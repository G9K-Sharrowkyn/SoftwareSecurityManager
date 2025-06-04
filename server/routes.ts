import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { GameEngine } from "./gameEngine";
import { AIEngine } from "./aiEngine";
import { z } from "zod";
import { insertDeckSchema, insertGameSchema } from "@shared/schema";

interface GameSocket extends WebSocket {
  userId?: string;
  gameId?: string;
}

interface GameRoom {
  id: string;
  players: Map<string, GameSocket>;
  engine: GameEngine;
  aiEngine?: AIEngine;
}

const gameRooms = new Map<string, GameRoom>();

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User routes
  app.patch('/api/users/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { username } = req.body;
      
      if (username) {
        await storage.upsertUser({ id: userId, username });
      }
      
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Card routes
  app.get('/api/cards', async (req, res) => {
    try {
      const cards = await storage.getAllCards();
      res.json(cards);
    } catch (error) {
      console.error("Error fetching cards:", error);
      res.status(500).json({ message: "Failed to fetch cards" });
    }
  });

  app.get('/api/users/cards', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userCards = await storage.getUserCards(userId);
      res.json(userCards);
    } catch (error) {
      console.error("Error fetching user cards:", error);
      res.status(500).json({ message: "Failed to fetch user cards" });
    }
  });

  // Deck routes
  app.get('/api/decks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const decks = await storage.getUserDecks(userId);
      res.json(decks);
    } catch (error) {
      console.error("Error fetching decks:", error);
      res.status(500).json({ message: "Failed to fetch decks" });
    }
  });

  app.get('/api/decks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const deckId = parseInt(req.params.id);
      const deck = await storage.getDeck(deckId);
      if (!deck) {
        return res.status(404).json({ message: "Deck not found" });
      }
      res.json(deck);
    } catch (error) {
      console.error("Error fetching deck:", error);
      res.status(500).json({ message: "Failed to fetch deck" });
    }
  });

  app.post('/api/decks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const deckData = insertDeckSchema.parse({ ...req.body, userId });
      const deck = await storage.createDeck(deckData);
      res.json(deck);
    } catch (error) {
      console.error("Error creating deck:", error);
      res.status(500).json({ message: "Failed to create deck" });
    }
  });

  app.post('/api/decks/:id/cards', isAuthenticated, async (req: any, res) => {
    try {
      const deckId = parseInt(req.params.id);
      const { cardId, quantity = 1 } = req.body;
      
      const deckCard = await storage.addCardToDeck(deckId, cardId, quantity);
      res.json(deckCard);
    } catch (error) {
      console.error("Error adding card to deck:", error);
      res.status(500).json({ message: "Failed to add card to deck" });
    }
  });

  app.delete('/api/decks/:id/cards/:cardId', isAuthenticated, async (req: any, res) => {
    try {
      const deckId = parseInt(req.params.id);
      const cardId = parseInt(req.params.cardId);
      const { quantity = 1 } = req.body;
      
      await storage.removeCardFromDeck(deckId, cardId, quantity);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing card from deck:", error);
      res.status(500).json({ message: "Failed to remove card from deck" });
    }
  });

  // Game routes
  app.post('/api/games', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { gameType, aiDifficulty, deckId } = req.body;
      
      const gameData = {
        player1Id: userId,
        gameType,
        status: "waiting" as const,
        aiDifficulty: gameType === "AI" ? aiDifficulty : undefined,
        gameState: { 
          player1DeckId: deckId,
          currentPlayerId: userId,
          phase: "Command Phase",
          turn: 1
        }
      };
      
      const game = await storage.createGame(gameData);
      res.json(game);
    } catch (error) {
      console.error("Error creating game:", error);
      res.status(500).json({ message: "Failed to create game" });
    }
  });

  app.get('/api/games/active', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const games = await storage.getActiveGamesForUser(userId);
      res.json(games);
    } catch (error) {
      console.error("Error fetching active games:", error);
      res.status(500).json({ message: "Failed to fetch active games" });
    }
  });

  app.get('/api/games/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const games = await storage.getGameHistory(userId, limit);
      res.json(games);
    } catch (error) {
      console.error("Error fetching game history:", error);
      res.status(500).json({ message: "Failed to fetch game history" });
    }
  });

  // Booster pack routes
  app.get('/api/booster-packs', async (req, res) => {
    try {
      const packs = await storage.getAllBoosterPacks();
      res.json(packs);
    } catch (error) {
      console.error("Error fetching booster packs:", error);
      res.status(500).json({ message: "Failed to fetch booster packs" });
    }
  });

  app.get('/api/users/booster-packs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const packs = await storage.getUserBoosterPacks(userId);
      res.json(packs);
    } catch (error) {
      console.error("Error fetching user booster packs:", error);
      res.status(500).json({ message: "Failed to fetch user booster packs" });
    }
  });

  app.post('/api/booster-packs/:id/open', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const packId = parseInt(req.params.id);
      
      const revealedCards = await storage.openBoosterPack(userId, packId);
      res.json({ cards: revealedCards });
    } catch (error) {
      console.error("Error opening booster pack:", error);
      res.status(500).json({ message: "Failed to open booster pack" });
    }
  });

  // Rankings routes
  app.get('/api/rankings', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const topPlayers = await storage.getTopPlayers(limit);
      res.json(topPlayers);
    } catch (error) {
      console.error("Error fetching rankings:", error);
      res.status(500).json({ message: "Failed to fetch rankings" });
    }
  });

  // Achievements routes
  app.get('/api/achievements', async (req, res) => {
    try {
      const achievements = await storage.getAllAchievements();
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  app.get('/api/users/achievements', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const achievements = await storage.getUserAchievements(userId);
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching user achievements:", error);
      res.status(500).json({ message: "Failed to fetch user achievements" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time multiplayer
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: GameSocket, req) => {
    console.log('WebSocket connection established');

    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        
        switch (data.type) {
          case 'join_game':
            await handleJoinGame(ws, data);
            break;
          case 'game_action':
            await handleGameAction(ws, data);
            break;
          case 'chat_message':
            await handleChatMessage(ws, data);
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      // Clean up game rooms when player disconnects
      if (ws.gameId && ws.userId) {
        const room = gameRooms.get(ws.gameId);
        if (room) {
          room.players.delete(ws.userId);
          if (room.players.size === 0) {
            gameRooms.delete(ws.gameId);
          }
        }
      }
    });
  });

  async function handleJoinGame(ws: GameSocket, data: any) {
    const { gameId, userId } = data;
    
    try {
      const game = await storage.getGame(gameId);
      if (!game) {
        ws.send(JSON.stringify({ type: 'error', message: 'Game not found' }));
        return;
      }

      // Create or get game room
      let room = gameRooms.get(gameId);
      if (!room) {
        const engine = new GameEngine(storage);
        await engine.initializeGame(game);
        
        room = {
          id: gameId,
          players: new Map(),
          engine,
          aiEngine: game.gameType === "AI" ? new AIEngine(game.aiDifficulty || "Medium") : undefined
        };
        gameRooms.set(gameId, room);
      }

      ws.userId = userId;
      ws.gameId = gameId;
      room.players.set(userId, ws);

      // Send initial game state
      const gameState = await room.engine.getGameState();
      ws.send(JSON.stringify({ 
        type: 'game_state', 
        state: gameState 
      }));

      // If AI game and it's AI's turn, make AI move
      if (room.aiEngine && gameState.currentPlayerId !== userId) {
        setTimeout(async () => {
          const aiMove = await room!.aiEngine!.makeMove(gameState);
          if (aiMove) {
            await room!.engine.processMove(aiMove);
            broadcastGameState(room!);
          }
        }, 1000);
      }

    } catch (error) {
      console.error('Error joining game:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Failed to join game' }));
    }
  }

  async function handleGameAction(ws: GameSocket, data: any) {
    if (!ws.gameId || !ws.userId) return;

    const room = gameRooms.get(ws.gameId);
    if (!room) return;

    try {
      const result = await room.engine.processMove({
        playerId: ws.userId,
        action: data.action,
        data: data.actionData
      });

      if (result.success) {
        broadcastGameState(room);
        
        // Check for game end
        if (result.gameEnded) {
          await storage.updateGame(ws.gameId, {
            status: "finished",
            winnerId: result.winnerId,
            finishedAt: new Date()
          });
          
          // Update player stats
          if (result.winnerId) {
            const winner = await storage.getUser(result.winnerId);
            if (winner) {
              await storage.updateUserStats(result.winnerId, {
                gamesPlayed: winner.gamesPlayed + 1,
                gamesWon: winner.gamesWon + 1,
                experience: winner.experience + 100
              });
            }
          }
        }
        
        // If AI game and it's AI's turn, make AI move
        if (room.aiEngine && !result.gameEnded) {
          setTimeout(async () => {
            const gameState = await room!.engine.getGameState();
            if (gameState.currentPlayerId !== ws.userId) {
              const aiMove = await room!.aiEngine!.makeMove(gameState);
              if (aiMove) {
                await room!.engine.processMove(aiMove);
                broadcastGameState(room!);
              }
            }
          }, 1500);
        }
      } else {
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: result.error || 'Invalid move' 
        }));
      }
    } catch (error) {
      console.error('Error processing game action:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Failed to process action' }));
    }
  }

  async function handleChatMessage(ws: GameSocket, data: any) {
    if (!ws.gameId || !ws.userId) return;

    const room = gameRooms.get(ws.gameId);
    if (!room) return;

    const user = await storage.getUser(ws.userId);
    if (!user) return;

    const chatMessage = {
      type: 'chat_message',
      message: {
        userId: ws.userId,
        username: user.username,
        content: data.message,
        timestamp: new Date().toISOString()
      }
    };

    // Broadcast to all players in the game
    room.players.forEach(player => {
      if (player.readyState === WebSocket.OPEN) {
        player.send(JSON.stringify(chatMessage));
      }
    });
  }

  function broadcastGameState(room: GameRoom) {
    room.engine.getGameState().then(gameState => {
      const message = JSON.stringify({ 
        type: 'game_state', 
        state: gameState 
      });
      
      room.players.forEach(player => {
        if (player.readyState === WebSocket.OPEN) {
          player.send(message);
        }
      });
    });
  }

  return httpServer;
}
