import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertCardSchema, insertDeckSchema, insertGameSchema } from "@shared/schema";
import { z } from "zod";

interface GameConnection {
  socket: WebSocket;
  userId: string;
  gameId?: string;
}

const gameConnections = new Map<string, GameConnection>();

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

  // Card routes
  app.get('/api/cards', async (req, res) => {
    try {
      const cards = await storage.getCards();
      res.json(cards);
    } catch (error) {
      console.error("Error fetching cards:", error);
      res.status(500).json({ message: "Failed to fetch cards" });
    }
  });

  app.post('/api/cards', isAuthenticated, async (req, res) => {
    try {
      const cardData = insertCardSchema.parse(req.body);
      const card = await storage.createCard(cardData);
      res.json(card);
    } catch (error) {
      console.error("Error creating card:", error);
      res.status(500).json({ message: "Failed to create card" });
    }
  });

  // User collection routes
  app.get('/api/collection', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const collection = await storage.getUserCards(userId);
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
      const deckData = insertDeckSchema.parse({ ...req.body, userId });
      const deck = await storage.createDeck(deckData);
      res.json(deck);
    } catch (error) {
      console.error("Error creating deck:", error);
      res.status(500).json({ message: "Failed to create deck" });
    }
  });

  app.get('/api/decks/:id', isAuthenticated, async (req, res) => {
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

  app.post('/api/decks/:id/cards', isAuthenticated, async (req, res) => {
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

  app.delete('/api/decks/:deckId/cards/:cardId', isAuthenticated, async (req, res) => {
    try {
      const deckId = parseInt(req.params.deckId);
      const cardId = parseInt(req.params.cardId);
      await storage.removeCardFromDeck(deckId, cardId);
      res.json({ message: "Card removed from deck" });
    } catch (error) {
      console.error("Error removing card from deck:", error);
      res.status(500).json({ message: "Failed to remove card from deck" });
    }
  });

  // Game routes
  app.post('/api/games', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const gameData = insertGameSchema.parse({ 
        ...req.body, 
        player1Id: userId,
        gameState: {
          player1: { health: 100, hand: [], units: [], commands: [], commandPoints: 0 },
          player2: { health: 100, hand: [], units: [], commands: [], commandPoints: 0 },
          currentPhase: "Command Phase",
          turnNumber: 1
        }
      });
      const game = await storage.createGame(gameData);
      res.json(game);
    } catch (error) {
      console.error("Error creating game:", error);
      res.status(500).json({ message: "Failed to create game" });
    }
  });

  app.get('/api/games/:id', isAuthenticated, async (req, res) => {
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
  app.get('/api/booster-packs', async (req, res) => {
    try {
      const packs = await storage.getBoosterPacks();
      res.json(packs);
    } catch (error) {
      console.error("Error fetching booster packs:", error);
      res.status(500).json({ message: "Failed to fetch booster packs" });
    }
  });

  app.get('/api/user-booster-packs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const packs = await storage.getUserBoosterPacks(userId);
      res.json(packs);
    } catch (error) {
      console.error("Error fetching user booster packs:", error);
      res.status(500).json({ message: "Failed to fetch user booster packs" });
    }
  });

  app.post('/api/purchase-booster', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { boosterPackId } = req.body;
      const pack = await storage.purchaseBoosterPack(userId, boosterPackId);
      res.json(pack);
    } catch (error) {
      console.error("Error purchasing booster pack:", error);
      res.status(500).json({ message: "Failed to purchase booster pack" });
    }
  });

  app.post('/api/open-booster/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userBoosterPackId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const cards = await storage.openBoosterPack(userBoosterPackId);
      
      // Add cards to user collection
      for (const card of cards) {
        await storage.addCardToUser(userId, card.id);
      }
      
      res.json(cards);
    } catch (error) {
      console.error("Error opening booster pack:", error);
      res.status(500).json({ message: "Failed to open booster pack" });
    }
  });

  // Leaderboard routes
  app.get('/api/leaderboard', async (req, res) => {
    try {
      const leaderboard = await storage.getLeaderboard();
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Achievement routes
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

  const httpServer = createServer(app);

  // WebSocket setup for real-time multiplayer
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (socket: WebSocket, request) => {
    console.log('New WebSocket connection');
    
    socket.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'join_game':
            const { gameId, userId } = message;
            gameConnections.set(userId, { socket, userId, gameId });
            socket.send(JSON.stringify({ type: 'joined_game', gameId }));
            break;
            
          case 'game_move':
            const { move, gameId: moveGameId } = message;
            // Broadcast move to other players in the game
            for (const [connUserId, conn] of gameConnections) {
              if (conn.gameId === moveGameId && conn.socket !== socket && conn.socket.readyState === WebSocket.OPEN) {
                conn.socket.send(JSON.stringify({ type: 'opponent_move', move }));
              }
            }
            break;
            
          case 'chat_message':
            const { gameId: chatGameId, message: chatMessage, sender } = message;
            // Broadcast chat to other players in the game
            for (const [connUserId, conn] of gameConnections) {
              if (conn.gameId === chatGameId && conn.socket.readyState === WebSocket.OPEN) {
                conn.socket.send(JSON.stringify({ 
                  type: 'chat_message', 
                  message: chatMessage, 
                  sender, 
                  timestamp: new Date().toISOString() 
                }));
              }
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    socket.on('close', () => {
      // Remove connection
      for (const [userId, conn] of gameConnections) {
        if (conn.socket === socket) {
          gameConnections.delete(userId);
          break;
        }
      }
    });
  });

  return httpServer;
}
