import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";
import { insertDeckSchema, insertGameSchema, insertBoosterPackSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Seed initial cards if none exist
  await seedInitialCards();

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

  app.get('/api/cards/:id', async (req, res) => {
    try {
      const cardId = parseInt(req.params.id);
      const card = await storage.getCard(cardId);
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

  app.post('/api/collection/add', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { cardId, quantity = 1 } = req.body;
      
      const userCard = await storage.addCardToUser(userId, cardId, quantity);
      res.json(userCard);
    } catch (error) {
      console.error("Error adding card to collection:", error);
      res.status(500).json({ message: "Failed to add card to collection" });
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

  app.get('/api/decks/:id', async (req, res) => {
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid deck data", errors: error.errors });
      }
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
      res.json({ message: "Deck deleted successfully" });
    } catch (error) {
      console.error("Error deleting deck:", error);
      res.status(500).json({ message: "Failed to delete deck" });
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
      
      await storage.removeCardFromDeck(deckId, cardId);
      res.json({ message: "Card removed from deck" });
    } catch (error) {
      console.error("Error removing card from deck:", error);
      res.status(500).json({ message: "Failed to remove card from deck" });
    }
  });

  app.put('/api/decks/:id/activate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const deckId = parseInt(req.params.id);
      
      await storage.setActiveDeck(userId, deckId);
      res.json({ message: "Deck activated successfully" });
    } catch (error) {
      console.error("Error activating deck:", error);
      res.status(500).json({ message: "Failed to activate deck" });
    }
  });

  // Game routes
  app.get('/api/games/active', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const games = await storage.getActiveGames(userId);
      res.json(games);
    } catch (error) {
      console.error("Error fetching active games:", error);
      res.status(500).json({ message: "Failed to fetch active games" });
    }
  });

  app.get('/api/games/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 20;
      const games = await storage.getGameHistory(userId, limit);
      res.json(games);
    } catch (error) {
      console.error("Error fetching game history:", error);
      res.status(500).json({ message: "Failed to fetch game history" });
    }
  });

  app.post('/api/games/ai', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { difficulty = "Medium" } = req.body;
      
      const game = await storage.createAIGame(userId, difficulty);
      res.json(game);
    } catch (error) {
      console.error("Error creating AI game:", error);
      res.status(500).json({ message: "Failed to create AI game" });
    }
  });

  app.get('/api/games/:id', async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
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
      const user = await storage.getUser(userId);
      
      if (!user || user.credits < 100) {
        return res.status(400).json({ message: "Insufficient credits" });
      }

      // Create booster pack
      const pack = await storage.createBoosterPack({ userId, packType: "Standard" });
      
      // Deduct credits
      await storage.updateUserStats(userId, { credits: -100 });
      
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
      
      const result = await storage.openBoosterPack(packId);
      
      // Add cards to user collection
      for (const card of result.cards) {
        await storage.addCardToUser(userId, card.id, 1);
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error opening booster pack:", error);
      res.status(500).json({ message: "Failed to open booster pack" });
    }
  });

  // Leaderboard
  app.get('/api/leaderboard', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const leaderboard = await storage.getLeaderboard(limit);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // Setup WebSocket for real-time multiplayer
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const gameRooms = new Map<number, Set<WebSocket>>();
  const userConnections = new Map<string, WebSocket>();

  wss.on('connection', (ws) => {
    console.log('WebSocket connection established');

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'join_game':
            const gameId = message.gameId;
            const userId = message.userId;
            
            if (!gameRooms.has(gameId)) {
              gameRooms.set(gameId, new Set());
            }
            
            gameRooms.get(gameId)?.add(ws);
            userConnections.set(userId, ws);
            
            // Notify other players in the room
            broadcastToGame(gameId, {
              type: 'player_joined',
              userId,
            }, ws);
            break;

          case 'game_move':
            const moveGameId = message.gameId;
            const playerId = message.playerId;
            const moveType = message.moveType;
            const moveData = message.moveData;
            
            // Save move to database
            await storage.addGameMove(moveGameId, playerId, moveType, moveData);
            
            // Broadcast move to other players
            broadcastToGame(moveGameId, {
              type: 'game_move',
              playerId,
              moveType,
              moveData,
            }, ws);
            break;

          case 'leave_game':
            const leaveGameId = message.gameId;
            const leaveUserId = message.userId;
            
            gameRooms.get(leaveGameId)?.delete(ws);
            userConnections.delete(leaveUserId);
            
            broadcastToGame(leaveGameId, {
              type: 'player_left',
              userId: leaveUserId,
            }, ws);
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      // Clean up connections
      for (const [userId, connection] of userConnections.entries()) {
        if (connection === ws) {
          userConnections.delete(userId);
          break;
        }
      }
      
      for (const [gameId, connections] of gameRooms.entries()) {
        connections.delete(ws);
        if (connections.size === 0) {
          gameRooms.delete(gameId);
        }
      }
    });
  });

  function broadcastToGame(gameId: number, message: any, exclude?: WebSocket) {
    const connections = gameRooms.get(gameId);
    if (connections) {
      connections.forEach((connection) => {
        if (connection !== exclude && connection.readyState === WebSocket.OPEN) {
          connection.send(JSON.stringify(message));
        }
      });
    }
  }

  return httpServer;
}

async function seedInitialCards() {
  try {
    const existingCards = await storage.getCards();
    if (existingCards.length > 0) {
      return; // Cards already seeded
    }

    // Seed some initial cards from the attached CardsSpecifics
    const initialCards = [
      {
        name: "Yazzilan_Industry_Zone",
        type: ["Shipyard"],
        attack: 0,
        defense: 0,
        commandCost: 0,
        unitMembers: 0,
        redCounters: 0,
        blueCounters: 0,
        specialAbility: "Provides 2 command points per turn",
        rarity: "Uncommon",
        imageUrl: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600"
      },
      {
        name: "Terran_Shipyard",
        type: ["Shipyard"],
        attack: 0,
        defense: 0,
        commandCost: 0,
        unitMembers: 0,
        redCounters: 0,
        blueCounters: 0,
        specialAbility: "Provides 2 command points per turn",
        rarity: "Common",
        imageUrl: "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600"
      },
      {
        name: "Aberran_Firenaute",
        type: ["BloodThirsty", "Biological"],
        attack: 2,
        defense: 2,
        commandCost: 2,
        unitMembers: 2,
        redCounters: 0,
        blueCounters: 2,
        specialAbility: "Merciless Strike - Deal extra damage when attacking damaged units",
        rarity: "Common",
        imageUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600"
      },
      {
        name: "Aelgallan_Flamers",
        type: ["Mech Quad", "Machine"],
        attack: 3,
        defense: 2,
        commandCost: 6,
        unitMembers: 3,
        redCounters: 0,
        blueCounters: 3,
        specialAbility: "Kill With Fire - Destroy target unit with 1 defense",
        rarity: "Rare",
        imageUrl: "https://pixabay.com/get/gbb6c78a0e29d22aab83cf8a23f72a895f8479d51e9adc2227bb6af3455ba8335f4601725e6165ae80dfd754debd34534601240535363a7e88dd1c0e873dd3302_1280.jpg"
      },
      {
        name: "Aneankae_Lady_of_War",
        type: ["Dread", "Tactician", "Biological"],
        attack: 6,
        defense: 4,
        commandCost: 8,
        unitMembers: 1,
        redCounters: 0,
        blueCounters: 0,
        specialAbility: "Glorious Death - When destroyed, deal 3 damage to target unit",
        rarity: "Legendary",
        imageUrl: "https://images.unsplash.com/photo-1502134249126-9f3755a50d78?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600"
      },
      {
        name: "Black_Watch_BattleMech",
        type: ["Machine"],
        attack: 4,
        defense: 4,
        commandCost: 7,
        unitMembers: 3,
        redCounters: 0,
        blueCounters: 3,
        specialAbility: "No Negotiations - Cannot be targeted by enemy abilities",
        rarity: "Rare",
        imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600"
      }
    ];

    await storage.seedCards(initialCards);
    console.log("Initial cards seeded successfully");
  } catch (error) {
    console.error("Error seeding initial cards:", error);
  }
}
