import {
  users,
  cards,
  userCards,
  decks,
  games,
  userBoosterPacks,
  achievements,
  userAchievements,
  type User,
  type UpsertUser,
  type Card,
  type UserCard,
  type InsertUserCard,
  type Deck,
  type InsertDeck,
  type Game,
  type InsertGame,
  type UserBoosterPack,
  type InsertUserBoosterPack,
  type Achievement,
  type UserAchievement,
  type InsertUserAchievement,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Card operations
  getAllCards(): Promise<Card[]>;
  getCard(id: number): Promise<Card | undefined>;
  
  // User card collection operations
  getUserCards(userId: string): Promise<UserCard[]>;
  addCardToUser(userId: string, cardId: number, quantity?: number): Promise<UserCard>;
  
  // Deck operations
  getUserDecks(userId: string): Promise<Deck[]>;
  createDeck(userId: string, deck: Omit<InsertDeck, "userId">): Promise<Deck>;
  updateDeck(deckId: number, updates: Partial<Deck>): Promise<Deck>;
  deleteDeck(deckId: number): Promise<void>;
  
  // Game operations
  createGame(game: InsertGame): Promise<Game>;
  updateGame(gameId: number, updates: Partial<Game>): Promise<Game>;
  getUserGames(userId: string): Promise<Game[]>;
  getActiveGame(userId: string): Promise<Game | undefined>;
  
  // Booster pack operations
  getUserBoosterPacks(userId: string): Promise<UserBoosterPack[]>;
  addBoosterPack(userId: string, packType?: string): Promise<UserBoosterPack>;
  useBoosterPack(userId: string, packType?: string): Promise<Card[]>;
  
  // Achievement operations
  getAllAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: string): Promise<UserAchievement[]>;
  unlockAchievement(userId: string, achievementId: number): Promise<UserAchievement>;
  
  // Leaderboard operations
  getLeaderboard(limit?: number): Promise<User[]>;
  updateUserStats(userId: string, stats: { gamesPlayed?: number; gamesWon?: number; experience?: number }): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
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

  // User card collection operations
  async getUserCards(userId: string): Promise<UserCard[]> {
    return await db.select().from(userCards).where(eq(userCards.userId, userId));
  }

  async addCardToUser(userId: string, cardId: number, quantity: number = 1): Promise<UserCard> {
    const [existingCard] = await db
      .select()
      .from(userCards)
      .where(and(eq(userCards.userId, userId), eq(userCards.cardId, cardId)));

    if (existingCard) {
      const [updated] = await db
        .update(userCards)
        .set({ quantity: existingCard.quantity + quantity })
        .where(eq(userCards.id, existingCard.id))
        .returning();
      return updated;
    } else {
      const [newCard] = await db
        .insert(userCards)
        .values({ userId, cardId, quantity })
        .returning();
      return newCard;
    }
  }

  // Deck operations
  async getUserDecks(userId: string): Promise<Deck[]> {
    return await db.select().from(decks).where(eq(decks.userId, userId));
  }

  async createDeck(userId: string, deck: Omit<InsertDeck, "userId">): Promise<Deck> {
    const [newDeck] = await db
      .insert(decks)
      .values({ ...deck, userId })
      .returning();
    return newDeck;
  }

  async updateDeck(deckId: number, updates: Partial<Deck>): Promise<Deck> {
    const [updated] = await db
      .update(decks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(decks.id, deckId))
      .returning();
    return updated;
  }

  async deleteDeck(deckId: number): Promise<void> {
    await db.delete(decks).where(eq(decks.id, deckId));
  }

  // Game operations
  async createGame(game: InsertGame): Promise<Game> {
    const [newGame] = await db.insert(games).values(game).returning();
    return newGame;
  }

  async updateGame(gameId: number, updates: Partial<Game>): Promise<Game> {
    const [updated] = await db
      .update(games)
      .set(updates)
      .where(eq(games.id, gameId))
      .returning();
    return updated;
  }

  async getUserGames(userId: string): Promise<Game[]> {
    return await db
      .select()
      .from(games)
      .where(
        and(
          sql`(${games.player1Id} = ${userId} OR ${games.player2Id} = ${userId})`,
          eq(games.isActive, false)
        )
      )
      .orderBy(desc(games.endedAt));
  }

  async getActiveGame(userId: string): Promise<Game | undefined> {
    const [game] = await db
      .select()
      .from(games)
      .where(
        and(
          sql`(${games.player1Id} = ${userId} OR ${games.player2Id} = ${userId})`,
          eq(games.isActive, true)
        )
      );
    return game;
  }

  // Booster pack operations
  async getUserBoosterPacks(userId: string): Promise<UserBoosterPack[]> {
    return await db.select().from(userBoosterPacks).where(eq(userBoosterPacks.userId, userId));
  }

  async addBoosterPack(userId: string, packType: string = "Standard"): Promise<UserBoosterPack> {
    const [pack] = await db
      .insert(userBoosterPacks)
      .values({ userId, packType })
      .returning();
    return pack;
  }

  async useBoosterPack(userId: string, packType: string = "Standard"): Promise<Card[]> {
    // Find and remove a booster pack
    const [pack] = await db
      .select()
      .from(userBoosterPacks)
      .where(and(eq(userBoosterPacks.userId, userId), eq(userBoosterPacks.packType, packType)));

    if (!pack) {
      throw new Error("No booster pack available");
    }

    if (pack.quantity > 1) {
      await db
        .update(userBoosterPacks)
        .set({ quantity: pack.quantity - 1 })
        .where(eq(userBoosterPacks.id, pack.id));
    } else {
      await db.delete(userBoosterPacks).where(eq(userBoosterPacks.id, pack.id));
    }

    // Generate 5 random cards
    const allCards = await this.getAllCards();
    const randomCards: Card[] = [];
    
    for (let i = 0; i < 5; i++) {
      const randomIndex = Math.floor(Math.random() * allCards.length);
      const selectedCard = allCards[randomIndex];
      randomCards.push(selectedCard);
      
      // Add card to user's collection
      await this.addCardToUser(userId, selectedCard.id);
    }

    return randomCards;
  }

  // Achievement operations
  async getAllAchievements(): Promise<Achievement[]> {
    return await db.select().from(achievements);
  }

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return await db.select().from(userAchievements).where(eq(userAchievements.userId, userId));
  }

  async unlockAchievement(userId: string, achievementId: number): Promise<UserAchievement> {
    const [achievement] = await db
      .insert(userAchievements)
      .values({ userId, achievementId })
      .returning();
    return achievement;
  }

  // Leaderboard operations
  async getLeaderboard(limit: number = 100): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.experience), desc(users.gamesWon))
      .limit(limit);
  }

  async updateUserStats(userId: string, stats: { gamesPlayed?: number; gamesWon?: number; experience?: number }): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({ ...stats, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
