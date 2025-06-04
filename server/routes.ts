import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Initialize cards data
  await storage.seedCards();

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
      const id = parseInt(req.params.id);
      const card = await storage.getCard(id);
      if (!card) {
        return res.status(404).json({ message: "Card not found" });
      }
      res.json(card);
    } catch (error) {
      console.error("Error fetching card:", error);
      res.status(500).json({ message: "Failed to fetch card" });
    }
  });

  // Collection routes
  app.get('/api/collection', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const collection = await storage.getUserCollection(userId);
      res.json(collection);
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
      const deckSchema = z.object({
        name: z.string().min(1).max(50),
        cards: z.array(z.object({
          cardId: z.number(),
          quantity: z.number().min(1).max(4)
        }))
      });

      const { name, cards } = deckSchema.parse(req.body);
      
      const deck = await storage.createDeck({
        userId,
        name,
        cards,
        isActive: false
      });
      
      res.json(deck);
    } catch (error) {
      console.error("Error creating deck:", error);
      res.status(500).json({ message: "Failed to create deck" });
    }
  });

  app.put('/api/decks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      const deck = await storage.getDeck(id);
      if (!deck || deck.userId !== userId) {
        return res.status(404).json({ message: "Deck not found" });
      }

      const updateSchema = z.object({
        name: z.string().min(1).max(50).optional(),
        cards: z.array(z.object({
          cardId: z.number(),
          quantity: z.number().min(1).max(4)
        })).optional(),
        isActive: z.boolean().optional()
      });

      const updates = updateSchema.parse(req.body);
      const updatedDeck = await storage.updateDeck(id, updates);
      
      res.json(updatedDeck);
    } catch (error) {
      console.error("Error updating deck:", error);
      res.status(500).json({ message: "Failed to update deck" });
    }
  });

  app.delete('/api/decks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      const deck = await storage.getDeck(id);
      if (!deck || deck.userId !== userId) {
        return res.status(404).json({ message: "Deck not found" });
      }

      await storage.deleteDeck(id);
      res.json({ message: "Deck deleted" });
    } catch (error) {
      console.error("Error deleting deck:", error);
      res.status(500).json({ message: "Failed to delete deck" });
    }
  });

  // Game routes
  app.post('/api/games', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const gameSchema = z.object({
        isAI: z.boolean().default(true),
        aiDifficulty: z.enum(["easy", "medium", "hard"]).optional()
      });

      const { isAI, aiDifficulty } = gameSchema.parse(req.body);
      
      const game = await storage.createGame({
        player1Id: userId,
        player2Id: isAI ? null : undefined,
        isAI,
        aiDifficulty: isAI ? aiDifficulty || "medium" : undefined,
        status: "active",
        gameState: {
          phase: "Command Phase",
          turn: 1,
          player1Health: 100,
          player2Health: 100,
          player1CommandPoints: 0,
          player2CommandPoints: 0,
          player1Hand: [],
          player2Hand: [],
          player1Units: [],
          player2Units: [],
          player1Commands: [],
          player2Commands: []
        }
      });
      
      res.json(game);
    } catch (error) {
      console.error("Error creating game:", error);
      res.status(500).json({ message: "Failed to create game" });
    }
  });

  app.get('/api/games/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const game = await storage.getGame(id);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      res.json(game);
    } catch (error) {
      console.error("Error fetching game:", error);
      res.status(500).json({ message: "Failed to fetch game" });
    }
  });

  app.put('/api/games/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      const game = await storage.getGame(id);
      if (!game || (game.player1Id !== userId && game.player2Id !== userId)) {
        return res.status(404).json({ message: "Game not found" });
      }

      const updateSchema = z.object({
        gameState: z.any().optional(),
        currentPhase: z.string().optional(),
        currentTurn: z.number().optional(),
        winnerId: z.string().optional(),
        status: z.string().optional()
      });

      const updates = updateSchema.parse(req.body);
      const updatedGame = await storage.updateGame(id, updates);
      
      // Broadcast game update via WebSocket
      const gameUpdate = { type: 'game_update', gameId: id, game: updatedGame };
      gameRooms.get(id)?.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(gameUpdate));
        }
      });
      
      res.json(updatedGame);
    } catch (error) {
      console.error("Error updating game:", error);
      res.status(500).json({ message: "Failed to update game" });
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

  app.post('/api/booster-packs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const packSchema = z.object({
        packType: z.string().default("standard")
      });

      const { packType } = packSchema.parse(req.body);
      const pack = await storage.addBoosterPack(userId, packType);
      
      res.json(pack);
    } catch (error) {
      console.error("Error adding booster pack:", error);
      res.status(500).json({ message: "Failed to add booster pack" });
    }
  });

  app.post('/api/booster-packs/:id/open', isAuthenticated, async (req: any, res) => {
    try {
      const packId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      const cards = await storage.openBoosterPack(userId, packId);
      res.json(cards);
    } catch (error) {
      console.error("Error opening booster pack:", error);
      res.status(500).json({ message: "Failed to open booster pack" });
    }
  });

  // Stats routes
  app.post('/api/stats/update', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const statsSchema = z.object({
        won: z.boolean(),
        experienceGained: z.number().min(0)
      });

      const { won, experienceGained } = statsSchema.parse(req.body);
      await storage.updateUserStats(userId, won, experienceGained);
      
      res.json({ message: "Stats updated" });
    } catch (error) {
      console.error("Error updating stats:", error);
      res.status(500).json({ message: "Failed to update stats" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time multiplayer
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const gameRooms = new Map<number, Set<WebSocket>>();

  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');

    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        
        switch (data.type) {
          case 'join_game':
            const gameId = data.gameId;
            if (!gameRooms.has(gameId)) {
              gameRooms.set(gameId, new Set());
            }
            gameRooms.get(gameId)?.add(ws);
            
            ws.send(JSON.stringify({
              type: 'joined_game',
              gameId: gameId
            }));
            break;

          case 'game_action':
            const targetGameId = data.gameId;
            const gameRoom = gameRooms.get(targetGameId);
            if (gameRoom) {
              gameRoom.forEach(client => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: 'game_action',
                    action: data.action,
                    gameId: targetGameId
                  }));
                }
              });
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      // Remove from all game rooms
      gameRooms.forEach(room => room.delete(ws));
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  return httpServer;
}
