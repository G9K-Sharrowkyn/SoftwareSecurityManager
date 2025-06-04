import {
  users,
  cards,
  collections,
  decks,
  games,
  boosterPacks,
  type User,
  type UpsertUser,
  type Card,
  type Collection,
  type Deck,
  type Game,
  type BoosterPack,
  type InsertCard,
  type InsertCollection,
  type InsertDeck,
  type InsertGame,
  type InsertBoosterPack,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Card operations
  getAllCards(): Promise<Card[]>;
  getCard(id: number): Promise<Card | undefined>;
  createCard(card: InsertCard): Promise<Card>;
  seedCards(): Promise<void>;
  
  // Collection operations
  getUserCollection(userId: string): Promise<(Collection & { card: Card })[]>;
  addToCollection(userId: string, cardId: number, quantity?: number): Promise<void>;
  removeFromCollection(userId: string, cardId: number, quantity?: number): Promise<void>;
  
  // Deck operations
  getUserDecks(userId: string): Promise<Deck[]>;
  getDeck(id: number): Promise<Deck | undefined>;
  createDeck(deck: InsertDeck): Promise<Deck>;
  updateDeck(id: number, updates: Partial<Deck>): Promise<Deck>;
  deleteDeck(id: number): Promise<void>;
  setActiveDeck(userId: string, deckId: number): Promise<void>;
  
  // Game operations
  createGame(game: InsertGame): Promise<Game>;
  getGame(id: number): Promise<Game | undefined>;
  updateGame(id: number, updates: Partial<Game>): Promise<Game>;
  getUserGames(userId: string): Promise<Game[]>;
  getActiveGames(): Promise<Game[]>;
  
  // Booster pack operations
  getUserBoosterPacks(userId: string): Promise<BoosterPack[]>;
  addBoosterPack(userId: string, packType?: string): Promise<BoosterPack>;
  openBoosterPack(userId: string, packId: number): Promise<Card[]>;
  
  // Stats operations
  updateUserStats(userId: string, won: boolean, experienceGained: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Card operations
  async getAllCards(): Promise<Card[]> {
    return await db.select().from(cards);
  }

  async getCard(id: number): Promise<Card | undefined> {
    const [card] = await db.select().from(cards).where(eq(cards.id, id));
    return card;
  }

  async createCard(card: InsertCard): Promise<Card> {
    const [newCard] = await db.insert(cards).values(card).returning();
    return newCard;
  }

  async seedCards(): Promise<void> {
    // Import card data from the attached assets
    const cardData = [
      {
        name: 'Yazzilan_Industry_Zone',
        type: ["Shipyard"],
        cost: 0,
        attack: 0,
        defense: 0,
        commandCost: 0,
        unitMembers: 0,
        redCounters: 0,
        blueCounters: 0,
        specialAbility: "Industrial production facility for advanced starships",
        rarity: "uncommon"
      },
      {
        name: 'Aberran_Firenaute',
        type: ["BloodThirsty", "Biological"],
        cost: 2,
        attack: 2,
        defense: 2,
        commandCost: 2,
        unitMembers: 2,
        redCounters: 0,
        blueCounters: 2,
        specialAbility: "Merciless Strike",
        rarity: "common"
      },
      {
        name: 'Black_Watch_BattleMech',
        type: ["Machine"],
        cost: 7,
        attack: 4,
        defense: 4,
        commandCost: 7,
        unitMembers: 3,
        redCounters: 0,
        blueCounters: 3,
        specialAbility: "No Negotiations",
        rarity: "rare"
      },
      {
        name: 'Anokemi_the_Giant',
        type: ["Dread", "Reach", "Machine"],
        cost: 7,
        attack: 7,
        defense: 3,
        commandCost: 7,
        unitMembers: 1,
        redCounters: 0,
        blueCounters: 0,
        specialAbility: "The Big Gun",
        rarity: "legendary"
      }
    ];

    for (const card of cardData) {
      try {
        await this.createCard(card);
      } catch (error) {
        // Card already exists, skip
      }
    }
  }

  // Collection operations
  async getUserCollection(userId: string): Promise<(Collection & { card: Card })[]> {
    return await db
      .select()
      .from(collections)
      .innerJoin(cards, eq(collections.cardId, cards.id))
      .where(eq(collections.userId, userId));
  }

  async addToCollection(userId: string, cardId: number, quantity: number = 1): Promise<void> {
    await db
      .insert(collections)
      .values({ userId, cardId, quantity })
      .onConflictDoUpdate({
        target: [collections.userId, collections.cardId],
        set: {
          quantity: db.select().from(collections).where(and(
            eq(collections.userId, userId),
            eq(collections.cardId, cardId)
          )).then(rows => (rows[0]?.quantity || 0) + quantity)
        }
      });
  }

  async removeFromCollection(userId: string, cardId: number, quantity: number = 1): Promise<void> {
    const [current] = await db
      .select()
      .from(collections)
      .where(and(eq(collections.userId, userId), eq(collections.cardId, cardId)));
    
    if (current) {
      const newQuantity = current.quantity - quantity;
      if (newQuantity <= 0) {
        await db
          .delete(collections)
          .where(and(eq(collections.userId, userId), eq(collections.cardId, cardId)));
      } else {
        await db
          .update(collections)
          .set({ quantity: newQuantity })
          .where(and(eq(collections.userId, userId), eq(collections.cardId, cardId)));
      }
    }
  }

  // Deck operations
  async getUserDecks(userId: string): Promise<Deck[]> {
    return await db.select().from(decks).where(eq(decks.userId, userId));
  }

  async getDeck(id: number): Promise<Deck | undefined> {
    const [deck] = await db.select().from(decks).where(eq(decks.id, id));
    return deck;
  }

  async createDeck(deck: InsertDeck): Promise<Deck> {
    const [newDeck] = await db.insert(decks).values(deck).returning();
    return newDeck;
  }

  async updateDeck(id: number, updates: Partial<Deck>): Promise<Deck> {
    const [updatedDeck] = await db
      .update(decks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(decks.id, id))
      .returning();
    return updatedDeck;
  }

  async deleteDeck(id: number): Promise<void> {
    await db.delete(decks).where(eq(decks.id, id));
  }

  async setActiveDeck(userId: string, deckId: number): Promise<void> {
    // First, deactivate all user's decks
    await db
      .update(decks)
      .set({ isActive: false })
      .where(eq(decks.userId, userId));
    
    // Then activate the selected deck
    await db
      .update(decks)
      .set({ isActive: true })
      .where(eq(decks.id, deckId));
  }

  // Game operations
  async createGame(game: InsertGame): Promise<Game> {
    const [newGame] = await db.insert(games).values(game).returning();
    return newGame;
  }

  async getGame(id: number): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game;
  }

  async updateGame(id: number, updates: Partial<Game>): Promise<Game> {
    const [updatedGame] = await db
      .update(games)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(games.id, id))
      .returning();
    return updatedGame;
  }

  async getUserGames(userId: string): Promise<Game[]> {
    return await db
      .select()
      .from(games)
      .where(or(eq(games.player1Id, userId), eq(games.player2Id, userId)))
      .orderBy(desc(games.createdAt));
  }

  async getActiveGames(): Promise<Game[]> {
    return await db
      .select()
      .from(games)
      .where(eq(games.status, "active"))
      .orderBy(desc(games.createdAt));
  }

  // Booster pack operations
  async getUserBoosterPacks(userId: string): Promise<BoosterPack[]> {
    return await db
      .select()
      .from(boosterPacks)
      .where(eq(boosterPacks.userId, userId));
  }

  async addBoosterPack(userId: string, packType: string = "standard"): Promise<BoosterPack> {
    const [pack] = await db
      .insert(boosterPacks)
      .values({ userId, packType })
      .returning();
    return pack;
  }

  async openBoosterPack(userId: string, packId: number): Promise<Card[]> {
    // Verify user owns the pack
    const [pack] = await db
      .select()
      .from(boosterPacks)
      .where(and(eq(boosterPacks.id, packId), eq(boosterPacks.userId, userId)));
    
    if (!pack) {
      throw new Error("Booster pack not found");
    }

    // Get all available cards
    const allCards = await this.getAllCards();
    
    // Generate 5 random cards with rarity distribution
    const revealedCards: Card[] = [];
    for (let i = 0; i < 5; i++) {
      const rand = Math.random();
      let rarity: string;
      
      if (rand < 0.05) rarity = "legendary";
      else if (rand < 0.20) rarity = "rare";
      else if (rand < 0.40) rarity = "uncommon";
      else rarity = "common";
      
      const rarityCards = allCards.filter(card => card.rarity === rarity);
      if (rarityCards.length > 0) {
        const randomCard = rarityCards[Math.floor(Math.random() * rarityCards.length)];
        revealedCards.push(randomCard);
        
        // Add to user's collection
        await this.addToCollection(userId, randomCard.id);
      }
    }

    // Remove the pack
    await db.delete(boosterPacks).where(eq(boosterPacks.id, packId));

    return revealedCards;
  }

  // Stats operations
  async updateUserStats(userId: string, won: boolean, experienceGained: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;

    const newExperience = user.experience + experienceGained;
    const newLevel = Math.floor(newExperience / 1000) + 1;
    const creditsEarned = won ? 150 : 50;

    await db
      .update(users)
      .set({
        wins: won ? user.wins + 1 : user.wins,
        losses: won ? user.losses : user.losses + 1,
        experience: newExperience,
        level: newLevel,
        credits: user.credits + creditsEarned,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }
}

export const storage = new DatabaseStorage();
