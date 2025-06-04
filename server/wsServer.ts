import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { storage } from './storage';
import { gameEngine } from './gameEngine';
import { aiEngine } from './aiEngine';

interface WebSocketWithId extends WebSocket {
  userId?: string;
  gameId?: string;
}

interface GameMessage {
  type: string;
  gameId?: string;
  data?: any;
}

class WebSocketGameServer {
  private wss: WebSocketServer;
  private clients: Map<string, WebSocketWithId> = new Map();
  private gameClients: Map<string, Set<string>> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws',
      verifyClient: (info) => {
        // Add authentication verification if needed
        return true;
      }
    });

    this.wss.on('connection', (ws: WebSocketWithId, req) => {
      console.log('New WebSocket connection');
      
      ws.on('message', async (message) => {
        try {
          const data: GameMessage = JSON.parse(message.toString());
          await this.handleMessage(ws, data);
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
          this.sendError(ws, 'Invalid message format');
        }
      });

      ws.on('close', () => {
        this.handleDisconnection(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  private async handleMessage(ws: WebSocketWithId, message: GameMessage) {
    switch (message.type) {
      case 'authenticate':
        await this.handleAuthentication(ws, message.data);
        break;
      
      case 'join_game':
        await this.handleJoinGame(ws, message.data);
        break;
      
      case 'leave_game':
        await this.handleLeaveGame(ws, message.data);
        break;
      
      case 'game_move':
        await this.handleGameMove(ws, message.data);
        break;
      
      case 'chat_message':
        await this.handleChatMessage(ws, message.data);
        break;
      
      case 'matchmaking':
        await this.handleMatchmaking(ws, message.data);
        break;
      
      default:
        this.sendError(ws, 'Unknown message type');
    }
  }

  private async handleAuthentication(ws: WebSocketWithId, data: { userId: string }) {
    const { userId } = data;
    
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        this.sendError(ws, 'User not found');
        return;
      }

      ws.userId = userId;
      this.clients.set(userId, ws);
      
      this.sendMessage(ws, {
        type: 'authenticated',
        data: { userId, user }
      });

      console.log(`User ${userId} authenticated via WebSocket`);
    } catch (error) {
      console.error('Authentication error:', error);
      this.sendError(ws, 'Authentication failed');
    }
  }

  private async handleJoinGame(ws: WebSocketWithId, data: { gameId: string }) {
    if (!ws.userId) {
      this.sendError(ws, 'Not authenticated');
      return;
    }

    const { gameId } = data;
    
    try {
      const game = await storage.getGame(gameId);
      if (!game) {
        this.sendError(ws, 'Game not found');
        return;
      }

      // Check if user is part of this game
      if (game.player1Id !== ws.userId && game.player2Id !== ws.userId) {
        this.sendError(ws, 'Not authorized to join this game');
        return;
      }

      ws.gameId = gameId;
      
      if (!this.gameClients.has(gameId)) {
        this.gameClients.set(gameId, new Set());
      }
      this.gameClients.get(gameId)!.add(ws.userId);

      // Send current game state
      this.sendMessage(ws, {
        type: 'game_joined',
        data: { gameId, gameState: game.gameState }
      });

      // Notify other players in the game
      this.broadcastToGame(gameId, {
        type: 'player_joined',
        data: { playerId: ws.userId }
      }, ws.userId);

      console.log(`User ${ws.userId} joined game ${gameId}`);
    } catch (error) {
      console.error('Error joining game:', error);
      this.sendError(ws, 'Failed to join game');
    }
  }

  private async handleLeaveGame(ws: WebSocketWithId, data: { gameId: string }) {
    if (!ws.userId || !ws.gameId) {
      return;
    }

    const gameId = ws.gameId;
    ws.gameId = undefined;

    const gameClients = this.gameClients.get(gameId);
    if (gameClients) {
      gameClients.delete(ws.userId);
      if (gameClients.size === 0) {
        this.gameClients.delete(gameId);
      }
    }

    // Notify other players
    this.broadcastToGame(gameId, {
      type: 'player_left',
      data: { playerId: ws.userId }
    }, ws.userId);

    console.log(`User ${ws.userId} left game ${gameId}`);
  }

  private async handleGameMove(ws: WebSocketWithId, data: { gameId: string; moveType: string; moveData: any }) {
    if (!ws.userId || !ws.gameId) {
      this.sendError(ws, 'Not in a game');
      return;
    }

    const { gameId, moveType, moveData } = data;

    try {
      const game = await storage.getGame(gameId);
      if (!game) {
        this.sendError(ws, 'Game not found');
        return;
      }

      // Process the move
      const newGameState = gameEngine.processMove(game.gameState, ws.userId, moveType, moveData);
      await storage.updateGame(gameId, { gameState: newGameState });
      
      // Log the move
      await storage.addGameMove({
        gameId,
        playerId: ws.userId,
        moveType,
        moveData
      });

      // Broadcast updated game state to all players
      this.broadcastToGame(gameId, {
        type: 'game_update',
        data: { 
          gameState: newGameState,
          lastMove: { playerId: ws.userId, moveType, moveData }
        }
      });

      // Handle AI response if needed
      if (game.isAiOpponent && newGameState.currentPlayer === "ai") {
        setTimeout(async () => {
          try {
            const aiMove = aiEngine.calculateMove(newGameState, game.aiDifficulty || "Medium");
            const finalGameState = gameEngine.processMove(newGameState, "ai", aiMove.type, aiMove.data);
            
            await storage.updateGame(gameId, { gameState: finalGameState });
            await storage.addGameMove({
              gameId,
              playerId: "ai",
              moveType: aiMove.type,
              moveData: aiMove.data
            });

            this.broadcastToGame(gameId, {
              type: 'game_update',
              data: { 
                gameState: finalGameState,
                lastMove: { playerId: "ai", moveType: aiMove.type, moveData: aiMove.data }
              }
            });
          } catch (error) {
            console.error('AI move error:', error);
          }
        }, aiEngine.getReactionTime(game.aiDifficulty || "Medium"));
      }

      console.log(`Game move processed: ${moveType} by ${ws.userId} in game ${gameId}`);
    } catch (error) {
      console.error('Error processing game move:', error);
      this.sendError(ws, error instanceof Error ? error.message : 'Failed to process move');
    }
  }

  private async handleChatMessage(ws: WebSocketWithId, data: { gameId: string; message: string }) {
    if (!ws.userId || !ws.gameId) {
      this.sendError(ws, 'Not in a game');
      return;
    }

    const { gameId, message } = data;

    try {
      const user = await storage.getUser(ws.userId);
      if (!user) {
        this.sendError(ws, 'User not found');
        return;
      }

      // Broadcast chat message to all players in the game
      this.broadcastToGame(gameId, {
        type: 'chat_message',
        data: {
          playerId: ws.userId,
          playerName: user.firstName || user.email || 'Anonymous',
          message,
          timestamp: new Date().toISOString()
        }
      });

      console.log(`Chat message from ${ws.userId} in game ${gameId}: ${message}`);
    } catch (error) {
      console.error('Error handling chat message:', error);
      this.sendError(ws, 'Failed to send chat message');
    }
  }

  private async handleMatchmaking(ws: WebSocketWithId, data: { difficulty?: string }) {
    if (!ws.userId) {
      this.sendError(ws, 'Not authenticated');
      return;
    }

    try {
      // For now, create AI games immediately
      // In a full implementation, this would handle human vs human matchmaking
      const game = await storage.createGame({
        player1Id: ws.userId,
        player2Id: null,
        isAiOpponent: true,
        aiDifficulty: data.difficulty || "Medium",
        status: "active",
        startedAt: new Date(),
        gameState: gameEngine.initializeGame(ws.userId, "ai")
      });

      this.sendMessage(ws, {
        type: 'match_found',
        data: { gameId: game.id, isAiOpponent: true }
      });

      console.log(`Created AI game ${game.id} for user ${ws.userId}`);
    } catch (error) {
      console.error('Matchmaking error:', error);
      this.sendError(ws, 'Matchmaking failed');
    }
  }

  private handleDisconnection(ws: WebSocketWithId) {
    if (ws.userId) {
      this.clients.delete(ws.userId);
      
      if (ws.gameId) {
        const gameClients = this.gameClients.get(ws.gameId);
        if (gameClients) {
          gameClients.delete(ws.userId);
          
          // Notify other players about disconnection
          this.broadcastToGame(ws.gameId, {
            type: 'player_disconnected',
            data: { playerId: ws.userId }
          }, ws.userId);
        }
      }
      
      console.log(`User ${ws.userId} disconnected`);
    }
  }

  private sendMessage(ws: WebSocket, message: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendError(ws: WebSocket, error: string) {
    this.sendMessage(ws, {
      type: 'error',
      data: { message: error }
    });
  }

  private broadcastToGame(gameId: string, message: any, excludeUserId?: string) {
    const gameClients = this.gameClients.get(gameId);
    if (!gameClients) return;

    for (const userId of gameClients) {
      if (excludeUserId && userId === excludeUserId) continue;
      
      const client = this.clients.get(userId);
      if (client) {
        this.sendMessage(client, message);
      }
    }
  }

  // Public methods for external use
  public sendToUser(userId: string, message: any) {
    const client = this.clients.get(userId);
    if (client) {
      this.sendMessage(client, message);
    }
  }

  public broadcastToAllGames(message: any) {
    for (const [gameId, clients] of this.gameClients) {
      this.broadcastToGame(gameId, message);
    }
  }

  public getConnectedUsers(): string[] {
    return Array.from(this.clients.keys());
  }

  public getGameConnections(gameId: string): string[] {
    const gameClients = this.gameClients.get(gameId);
    return gameClients ? Array.from(gameClients) : [];
  }
}

let wsServer: WebSocketGameServer;

export function setupWebSocket(server: Server): WebSocketGameServer {
  wsServer = new WebSocketGameServer(server);
  return wsServer;
}

export function getWebSocketServer(): WebSocketGameServer {
  return wsServer;
}
