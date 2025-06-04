import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { createDeckSchema, updateDeckSchema, createGameSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
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

  app.get('/api/cards/:id', async (req, res) => {
    try {
      const card = await storage.getCard(parseInt(req.params.id));
      if (!card) {
        return res.status(404).json({ message: "Card not found" });
      }
      res.json(card);
    } catch (error) {
      console.error("Error fetching card:", error);
      res.status(500).json({ message: "Failed to fetch card" });
    }
  });

  // User collection routes
  app.get('/api/collection', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userCards = await storage.getUserCards(userId);
      res.json(userCards);
    } catch (error) {
      console.error("Error fetching collection:", error);
      res.status(500).json({ message: "Failed to fetch collection" });
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

  app.post('/api/decks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = createDeckSchema.parse(req.body);
      const deck = await storage.createDeck(userId, validatedData);
      res.status(201).json(deck);
    } catch (error) {
      console.error("Error creating deck:", error);
      res.status(500).json({ message: "Failed to create deck" });
    }
  });

  app.put('/api/decks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const deckId = parseInt(req.params.id);
      const validatedData = updateDeckSchema.parse(req.body);
      const deck = await storage.updateDeck(deckId, validatedData);
      res.json(deck);
    } catch (error) {
      console.error("Error updating deck:", error);
      res.status(500).json({ message: "Failed to update deck" });
    }
  });

  app.delete('/api/decks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const deckId = parseInt(req.params.id);
      await storage.deleteDeck(deckId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting deck:", error);
      res.status(500).json({ message: "Failed to delete deck" });
    }
  });

  // Game routes
  app.get('/api/games', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const games = await storage.getUserGames(userId);
      res.json(games);
    } catch (error) {
      console.error("Error fetching games:", error);
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });

  app.get('/api/games/active', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const game = await storage.getActiveGame(userId);
      res.json(game || null);
    } catch (error) {
      console.error("Error fetching active game:", error);
      res.status(500).json({ message: "Failed to fetch active game" });
    }
  });

  app.post('/api/games', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = createGameSchema.parse(req.body);
      const game = await storage.createGame({
        ...validatedData,
        player1Id: userId,
      });
      res.status(201).json(game);
    } catch (error) {
      console.error("Error creating game:", error);
      res.status(500).json({ message: "Failed to create game" });
    }
  });

  // Booster pack routes
  app.get('/api/booster-packs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const packs = await storage.getUserBoosterPacks(userId);
      res.json(packs);
    } catch (error) {
      console.error("Error fetching booster packs:", error);
      res.status(500).json({ message: "Failed to fetch booster packs" });
    }
  });

  app.post('/api/booster-packs/open', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { packType = "Standard" } = req.body;
      const cards = await storage.useBoosterPack(userId, packType);
      res.json(cards);
    } catch (error) {
      console.error("Error opening booster pack:", error);
      res.status(500).json({ message: "Failed to open booster pack" });
    }
  });

  app.post('/api/booster-packs/buy', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { packType = "Standard" } = req.body;
      const pack = await storage.addBoosterPack(userId, packType);
      res.status(201).json(pack);
    } catch (error) {
      console.error("Error buying booster pack:", error);
      res.status(500).json({ message: "Failed to buy booster pack" });
    }
  });

  // Achievement routes
  app.get('/api/achievements', async (req, res) => {
    try {
      const achievements = await storage.getAllAchievements();
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  app.get('/api/achievements/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userAchievements = await storage.getUserAchievements(userId);
      res.json(userAchievements);
    } catch (error) {
      console.error("Error fetching user achievements:", error);
      res.status(500).json({ message: "Failed to fetch user achievements" });
    }
  });

  // Leaderboard routes
  app.get('/api/leaderboard', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const leaderboard = await storage.getLeaderboard(limit);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time multiplayer
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  interface GameRoom {
    gameId: number;
    players: Map<string, WebSocket>;
    gameState: any;
  }

  const gameRooms = new Map<number, GameRoom>();

  wss.on('connection', (ws: WebSocket, req) => {
    console.log('WebSocket connection established');

    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        
        switch (data.type) {
          case 'join_game':
            const { gameId, userId } = data;
            
            if (!gameRooms.has(gameId)) {
              gameRooms.set(gameId, {
                gameId,
                players: new Map(),
                gameState: null
              });
            }
            
            const room = gameRooms.get(gameId)!;
            room.players.set(userId, ws);
            
            // Notify all players in the room
            room.players.forEach((playerWs, playerId) => {
              if (playerWs.readyState === WebSocket.OPEN) {
                playerWs.send(JSON.stringify({
                  type: 'player_joined',
                  userId: playerId,
                  totalPlayers: room.players.size
                }));
              }
            });
            break;
            
          case 'game_action':
            const { gameId: actionGameId, action, payload } = data;
            const actionRoom = gameRooms.get(actionGameId);
            
            if (actionRoom) {
              // Update game state and broadcast to all players
              actionRoom.players.forEach((playerWs) => {
                if (playerWs.readyState === WebSocket.OPEN) {
                  playerWs.send(JSON.stringify({
                    type: 'game_update',
                    action,
                    payload
                  }));
                }
              });
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      // Remove player from all rooms
      gameRooms.forEach((room, gameId) => {
        room.players.forEach((playerWs, userId) => {
          if (playerWs === ws) {
            room.players.delete(userId);
            
            // Notify remaining players
            room.players.forEach((remainingWs) => {
              if (remainingWs.readyState === WebSocket.OPEN) {
                remainingWs.send(JSON.stringify({
                  type: 'player_left',
                  userId
                }));
              }
            });
            
            // Clean up empty rooms
            if (room.players.size === 0) {
              gameRooms.delete(gameId);
            }
          }
        });
      });
    });
  });

  return httpServer;
}
