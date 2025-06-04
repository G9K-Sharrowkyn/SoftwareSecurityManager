import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertDeckSchema, insertGameSchema, insertBoosterPackSchema } from "@shared/schema";

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

  app.put('/api/user/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updates = req.body;
      const user = await storage.updateUserProfile(userId, updates);
      res.json(user);
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ message: 'Failed to update profile' });
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

  app.get('/api/cards/user', isAuthenticated, async (req: any, res) => {
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

  app.put('/api/decks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const deckId = parseInt(req.params.id);
      const updates = req.body;
      const deck = await storage.updateDeck(deckId, updates);
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
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting deck:", error);
      res.status(500).json({ message: "Failed to delete deck" });
    }
  });

  app.post('/api/decks/:id/activate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const deckId = parseInt(req.params.id);
      await storage.setActiveDeck(userId, deckId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error activating deck:", error);
      res.status(500).json({ message: "Failed to activate deck" });
    }
  });

  // Game routes
  app.post('/api/games', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const gameData = insertGameSchema.parse({ ...req.body, player1Id: userId });
      const game = await storage.createGame(gameData);
      res.json(game);
    } catch (error) {
      console.error("Error creating game:", error);
      res.status(500).json({ message: "Failed to create game" });
    }
  });

  app.get('/api/games/:id', isAuthenticated, async (req: any, res) => {
    try {
      const gameId = req.params.id;
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      res.json(game);
    } catch (error) {
      console.error("Error fetching game:", error);
      res.status(500).json({ message: "Failed to fetch game" });
    }
  });

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
      const packData = insertBoosterPackSchema.parse({ ...req.body, userId });
      const pack = await storage.createBoosterPack(packData);
      res.json(pack);
    } catch (error) {
      console.error("Error creating booster pack:", error);
      res.status(500).json({ message: "Failed to create booster pack" });
    }
  });

  app.post('/api/booster-packs/:id/open', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const packId = parseInt(req.params.id);
      
      // Get all cards for random selection
      const allCards = await storage.getAllCards();
      const cardsRevealed = [];
      
      // Generate 5 random cards
      for (let i = 0; i < 5; i++) {
        const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
        cardsRevealed.push(randomCard.id);
        // Add card to user's collection
        await storage.addCardToUser(userId, randomCard.id, 1);
      }
      
      const pack = await storage.openBoosterPack(packId, cardsRevealed);
      res.json(pack);
    } catch (error) {
      console.error("Error opening booster pack:", error);
      res.status(500).json({ message: "Failed to open booster pack" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // WebSocket server for real-time game communication
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req) => {
    console.log('WebSocket connection established');

    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        const { type, payload } = data;

        switch (type) {
          case 'join_game':
            // Handle player joining a game
            ws.send(JSON.stringify({
              type: 'game_joined',
              payload: { gameId: payload.gameId }
            }));
            break;

          case 'game_move':
            // Handle game moves
            const { gameId, playerId, moveType, moveData } = payload;
            await storage.addGameMove(gameId, playerId, moveType, moveData);
            
            // Broadcast move to other players
            wss.clients.forEach((client) => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'move_received',
                  payload: { gameId, playerId, moveType, moveData }
                }));
              }
            });
            break;

          case 'chat_message':
            // Handle chat messages
            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'chat_message',
                  payload: payload
                }));
              }
            });
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });

  return httpServer;
}
