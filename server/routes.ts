import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { gameEngine } from "./gameEngine";
import { aiEngine } from "./aiEngine";
import { z } from "zod";
import { insertDeckSchema, insertGameSchema, insertBoosterPackSchema } from "@shared/schema";

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

  // User profile routes
  app.get('/api/profile/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
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
      const deckData = insertDeckSchema.parse(req.body);
      const deck = await storage.createDeck({ ...deckData, userId });
      res.json(deck);
    } catch (error) {
      console.error("Error creating deck:", error);
      res.status(400).json({ message: "Failed to create deck" });
    }
  });

  app.put('/api/decks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const deckId = parseInt(req.params.id);
      const deckData = insertDeckSchema.parse(req.body);
      const deck = await storage.updateDeck(deckId, userId, deckData);
      res.json(deck);
    } catch (error) {
      console.error("Error updating deck:", error);
      res.status(400).json({ message: "Failed to update deck" });
    }
  });

  app.delete('/api/decks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const deckId = parseInt(req.params.id);
      await storage.deleteDeck(deckId, userId);
      res.json({ message: "Deck deleted successfully" });
    } catch (error) {
      console.error("Error deleting deck:", error);
      res.status(400).json({ message: "Failed to delete deck" });
    }
  });

  // Game routes
  app.post('/api/games/ai', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { difficulty, deckId } = req.body;
      
      if (!['easy', 'medium', 'hard'].includes(difficulty)) {
        return res.status(400).json({ message: "Invalid difficulty level" });
      }

      const deck = await storage.getDeck(deckId, userId);
      if (!deck) {
        return res.status(400).json({ message: "Deck not found" });
      }

      const gameData = insertGameSchema.parse({
        player1Id: userId,
        isAIGame: true,
        aiDifficulty: difficulty,
        currentPlayer: userId,
        gameState: await gameEngine.initializeGame(deck, difficulty),
      });

      const game = await storage.createGame(gameData);
      res.json(game);
    } catch (error) {
      console.error("Error creating AI game:", error);
      res.status(400).json({ message: "Failed to create AI game" });
    }
  });

  app.get('/api/games/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const gameId = parseInt(req.params.id);
      const game = await storage.getGame(gameId, userId);
      res.json(game);
    } catch (error) {
      console.error("Error fetching game:", error);
      res.status(404).json({ message: "Game not found" });
    }
  });

  app.post('/api/games/:id/action', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const gameId = parseInt(req.params.id);
      const { action, data } = req.body;

      const game = await storage.getGame(gameId, userId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      if (game.currentPlayer !== userId) {
        return res.status(400).json({ message: "Not your turn" });
      }

      let newGameState;
      if (game.isAIGame) {
        newGameState = await gameEngine.processPlayerAction(game.gameState, action, data);
        if (newGameState.currentPlayer !== userId) {
          // AI turn
          const aiAction = await aiEngine.getAIAction(newGameState, game.aiDifficulty);
          newGameState = await gameEngine.processAIAction(newGameState, aiAction);
        }
      } else {
        newGameState = await gameEngine.processPlayerAction(game.gameState, action, data);
      }

      const updatedGame = await storage.updateGameState(gameId, newGameState);
      
      // Broadcast to WebSocket clients if multiplayer
      if (!game.isAIGame && gameClients.has(gameId)) {
        const clients = gameClients.get(gameId)!;
        clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'gameUpdate',
              game: updatedGame
            }));
          }
        });
      }

      res.json(updatedGame);
    } catch (error) {
      console.error("Error processing game action:", error);
      res.status(400).json({ message: "Failed to process action" });
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

  app.post('/api/booster-packs/purchase', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { packType, quantity = 1 } = req.body;
      
      const cost = packType === 'premium' ? 500 : 200;
      const totalCost = cost * quantity;

      const user = await storage.getUser(userId);
      if (!user || user.credits < totalCost) {
        return res.status(400).json({ message: "Insufficient credits" });
      }

      const packs = [];
      for (let i = 0; i < quantity; i++) {
        const packData = insertBoosterPackSchema.parse({
          userId,
          packType,
        });
        const pack = await storage.createBoosterPack(packData);
        packs.push(pack);
      }

      await storage.updateUserCredits(userId, user.credits - totalCost);
      res.json(packs);
    } catch (error) {
      console.error("Error purchasing booster pack:", error);
      res.status(400).json({ message: "Failed to purchase booster pack" });
    }
  });

  app.post('/api/booster-packs/:id/open', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const packId = parseInt(req.params.id);
      
      const pack = await storage.getBoosterPack(packId, userId);
      if (!pack || pack.isOpened) {
        return res.status(400).json({ message: "Pack not found or already opened" });
      }

      const cards = await storage.generateBoosterPackCards(pack.packType);
      const openedPack = await storage.openBoosterPack(packId, cards);
      
      // Add cards to user collection
      for (const cardId of cards) {
        await storage.addCardToCollection(userId, cardId);
      }

      res.json({ pack: openedPack, cards });
    } catch (error) {
      console.error("Error opening booster pack:", error);
      res.status(400).json({ message: "Failed to open booster pack" });
    }
  });

  // Rankings route
  app.get('/api/rankings', async (req, res) => {
    try {
      const rankings = await storage.getUserRankings();
      res.json(rankings);
    } catch (error) {
      console.error("Error fetching rankings:", error);
      res.status(500).json({ message: "Failed to fetch rankings" });
    }
  });

  // Achievements routes
  app.get('/api/achievements', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const achievements = await storage.getUserAchievements(userId);
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // WebSocket setup for multiplayer
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const gameClients = new Map<number, Set<WebSocket>>();

  wss.on('connection', (ws, req) => {
    console.log('WebSocket connection established');

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        switch (data.type) {
          case 'joinGame':
            const gameId = data.gameId;
            if (!gameClients.has(gameId)) {
              gameClients.set(gameId, new Set());
            }
            gameClients.get(gameId)!.add(ws);
            
            ws.send(JSON.stringify({
              type: 'gameJoined',
              gameId
            }));
            break;

          case 'leaveGame':
            gameClients.forEach((clients, gameId) => {
              clients.delete(ws);
              if (clients.size === 0) {
                gameClients.delete(gameId);
              }
            });
            break;

          default:
            console.log('Unknown WebSocket message type:', data.type);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      // Clean up client from all games
      gameClients.forEach((clients, gameId) => {
        clients.delete(ws);
        if (clients.size === 0) {
          gameClients.delete(gameId);
        }
      });
      console.log('WebSocket connection closed');
    });
  });

  return httpServer;
}
