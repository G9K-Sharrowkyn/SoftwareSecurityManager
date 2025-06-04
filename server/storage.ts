import {
  users,
  cards,
  userCards,
  decks,
  deckCards,
  games,
  gameMoves,
  boosterPacks,
  packContents,
  achievements,
  userAchievements,
  type User,
  type UpsertUser,
  type Card,
  type UserCard,
  type Deck,
  type DeckCard,
  type Game,
  type GameMove,
  type BoosterPack,
  type PackContent,
  type Achievement,
  type UserAchievement,
  type InsertCard,
  type InsertDeck,
  type InsertGame,
  type InsertBoosterPack,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql, count, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStats(userId: string, stats: { wins?: number; losses?: number; experience?: number; credits?: number }): Promise<void>;
  
  // Card operations
  getCards(): Promise<Card[]>;
  getCard(id: number): Promise<Card | undefined>;
  createCard(card: InsertCard): Promise<Card>;
  seedCards(cards: InsertCard[]): Promise<Card[]>;
  
  // User card collection
  getUserCards(userId: string): Promise<(UserCard & { card: Card })[]>;
  addCardToUser(userId: string, cardId: number, quantity?: number): Promise<UserCard>;
  getUserCardQuantity(userId: string, cardId: number): Promise<number>;
  
  // Deck operations
  getUserDecks(userId: string): Promise<Deck[]>;
  getDeck(id: number): Promise<(Deck & { deckCards: (DeckCard & { card: Card })[] }) | undefined>;
  createDeck(deck: InsertDeck): Promise<Deck>;
  updateDeck(id: number, updates: Partial<Deck>): Promise<Deck>;
  deleteDeck(id: number): Promise<void>;
  addCardToDeck(deckId: number, cardId: number, quantity?: number): Promise<DeckCard>;
  removeCardFromDeck(deckId: number, cardId: number): Promise<void>;
  setActiveDeck(userId: string, deckId: number): Promise<void>;
  
  // Game operations
  createGame(game: InsertGame): Promise<Game>;
  getGame(id: number): Promise<Game | undefined>;
  updateGame(id: number, updates: Partial<Game>): Promise<Game>;
  getActiveGames(userId: string): Promise<Game[]>;
  getGameHistory(userId: string, limit?: number): Promise<Game[]>;
  addGameMove(gameId: number, playerId: string, moveType: string, moveData: any): Promise<GameMove>;
  
  // Booster pack operations
  getUserBoosterPacks(userId: string): Promise<BoosterPack[]>;
  createBoosterPack(pack: InsertBoosterPack): Promise<BoosterPack>;
  openBoosterPack(packId: number): Promise<{ pack: BoosterPack; cards: Card[] }>;
  
  // Leaderboard
  getLeaderboard(limit?: number): Promise<User[]>;
  
  // AI opponents
  createAIGame(playerId: string, difficulty: string): Promise<Game>;
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
      .values({
        ...userData,
        username: userData.username || userData.email?.split('@')[0] || 'player',
      })
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

  async updateUserStats(userId: string, stats: { wins?: number; losses?: number; experience?: number; credits?: number }): Promise<void> {
    const updates: any = { updatedAt: new Date() };
    
    if (stats.wins !== undefined) {
      updates.totalWins = sql`${users.totalWins} + ${stats.wins}`;
      if (stats.wins > 0) {
        updates.winStreak = sql`${users.winStreak} + ${stats.wins}`;
      }
    }
    
    if (stats.losses !== undefined) {
      updates.totalLosses = sql`${users.totalLosses} + ${stats.losses}`;
      if (stats.losses > 0) {
        updates.winStreak = 0;
      }
    }
    
    if (stats.experience !== undefined) {
      updates.experience = sql`${users.experience} + ${stats.experience}`;
    }
    
    if (stats.credits !== undefined) {
      updates.credits = sql`${users.credits} + ${stats.credits}`;
    }

    await db.update(users).set(updates).where(eq(users.id, userId));
  }

  // Card operations
  async getCards(): Promise<Card[]> {
    return await db.select().from(cards).orderBy(asc(cards.name));
  }

  async getCard(id: number): Promise<Card | undefined> {
    const [card] = await db.select().from(cards).where(eq(cards.id, id));
    return card;
  }

  async createCard(card: InsertCard): Promise<Card> {
    const [newCard] = await db.insert(cards).values(card).returning();
    return newCard;
  }

  async seedCards(cardList: InsertCard[]): Promise<Card[]> {
    if (cardList.length === 0) return [];
    
    return await db.insert(cards).values(cardList).onConflictDoNothing().returning();
  }

  // User card collection
  async getUserCards(userId: string): Promise<(UserCard & { card: Card })[]> {
    return await db
      .select()
      .from(userCards)
      .innerJoin(cards, eq(userCards.cardId, cards.id))
      .where(eq(userCards.userId, userId))
      .orderBy(asc(cards.name));
  }

  async addCardToUser(userId: string, cardId: number, quantity: number = 1): Promise<UserCard> {
    const existing = await db
      .select()
      .from(userCards)
      .where(and(eq(userCards.userId, userId), eq(userCards.cardId, cardId)));

    if (existing.length > 0) {
      const [updated] = await db
        .update(userCards)
        .set({ quantity: sql`${userCards.quantity} + ${quantity}` })
        .where(and(eq(userCards.userId, userId), eq(userCards.cardId, cardId)))
        .returning();
      return updated;
    } else {
      const [newUserCard] = await db
        .insert(userCards)
        .values({ userId, cardId, quantity })
        .returning();
      return newUserCard;
    }
  }

  async getUserCardQuantity(userId: string, cardId: number): Promise<number> {
    const [result] = await db
      .select({ quantity: userCards.quantity })
      .from(userCards)
      .where(and(eq(userCards.userId, userId), eq(userCards.cardId, cardId)));
    
    return result?.quantity || 0;
  }

  // Deck operations
  async getUserDecks(userId: string): Promise<Deck[]> {
    return await db
      .select()
      .from(decks)
      .where(eq(decks.userId, userId))
      .orderBy(desc(decks.createdAt));
  }

  async getDeck(id: number): Promise<(Deck & { deckCards: (DeckCard & { card: Card })[] }) | undefined> {
    const [deck] = await db.select().from(decks).where(eq(decks.id, id));
    if (!deck) return undefined;

    const deckCardsResult = await db
      .select()
      .from(deckCards)
      .innerJoin(cards, eq(deckCards.cardId, cards.id))
      .where(eq(deckCards.deckId, id));

    return {
      ...deck,
      deckCards: deckCardsResult,
    };
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

  async addCardToDeck(deckId: number, cardId: number, quantity: number = 1): Promise<DeckCard> {
    const existing = await db
      .select()
      .from(deckCards)
      .where(and(eq(deckCards.deckId, deckId), eq(deckCards.cardId, cardId)));

    if (existing.length > 0) {
      const [updated] = await db
        .update(deckCards)
        .set({ quantity: sql`${deckCards.quantity} + ${quantity}` })
        .where(and(eq(deckCards.deckId, deckId), eq(deckCards.cardId, cardId)))
        .returning();
      return updated;
    } else {
      const [newDeckCard] = await db
        .insert(deckCards)
        .values({ deckId, cardId, quantity })
        .returning();
      return newDeckCard;
    }
  }

  async removeCardFromDeck(deckId: number, cardId: number): Promise<void> {
    await db
      .delete(deckCards)
      .where(and(eq(deckCards.deckId, deckId), eq(deckCards.cardId, cardId)));
  }

  async setActiveDeck(userId: string, deckId: number): Promise<void> {
    // First deactivate all decks for the user
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
      .set(updates)
      .where(eq(games.id, id))
      .returning();
    return updatedGame;
  }

  async getActiveGames(userId: string): Promise<Game[]> {
    return await db
      .select()
      .from(games)
      .where(
        and(
          sql`(${games.player1Id} = ${userId} OR ${games.player2Id} = ${userId})`,
          eq(games.status, "active")
        )
      )
      .orderBy(desc(games.createdAt));
  }

  async getGameHistory(userId: string, limit: number = 20): Promise<Game[]> {
    return await db
      .select()
      .from(games)
      .where(
        and(
          sql`(${games.player1Id} = ${userId} OR ${games.player2Id} = ${userId})`,
          eq(games.status, "finished")
        )
      )
      .orderBy(desc(games.finishedAt))
      .limit(limit);
  }

  async addGameMove(gameId: number, playerId: string, moveType: string, moveData: any): Promise<GameMove> {
    const [move] = await db
      .insert(gameMoves)
      .values({ gameId, playerId, moveType, moveData })
      .returning();
    return move;
  }

  // Booster pack operations
  async getUserBoosterPacks(userId: string): Promise<BoosterPack[]> {
    return await db
      .select()
      .from(boosterPacks)
      .where(eq(boosterPacks.userId, userId))
      .orderBy(desc(boosterPacks.createdAt));
  }

  async createBoosterPack(pack: InsertBoosterPack): Promise<BoosterPack> {
    const [newPack] = await db.insert(boosterPacks).values(pack).returning();
    return newPack;
  }

  async openBoosterPack(packId: number): Promise<{ pack: BoosterPack; cards: Card[] }> {
    // Get all cards for random selection
    const allCards = await db.select().from(cards);
    
    if (allCards.length === 0) {
      throw new Error("No cards available for booster pack");
    }

    // Generate 5 random cards with rarity weighting
    const selectedCards: Card[] = [];
    const rarityWeights = { Common: 60, Uncommon: 30, Rare: 9, Legendary: 1 };
    
    for (let i = 0; i < 5; i++) {
      // Weighted random selection
      const random = Math.random() * 100;
      let rarity: string;
      
      if (random < 60) rarity = "Common";
      else if (random < 90) rarity = "Uncommon";
      else if (random < 99) rarity = "Rare";
      else rarity = "Legendary";
      
      const cardsOfRarity = allCards.filter(card => card.rarity === rarity);
      if (cardsOfRarity.length > 0) {
        const randomCard = cardsOfRarity[Math.floor(Math.random() * cardsOfRarity.length)];
        selectedCards.push(randomCard);
      } else {
        // Fallback to random card if rarity not available
        const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
        selectedCards.push(randomCard);
      }
    }

    // Update pack as opened
    const [updatedPack] = await db
      .update(boosterPacks)
      .set({ isOpened: true, openedAt: new Date() })
      .where(eq(boosterPacks.id, packId))
      .returning();

    // Add cards to pack contents
    for (const card of selectedCards) {
      await db.insert(packContents).values({ packId, cardId: card.id });
    }

    return { pack: updatedPack, cards: selectedCards };
  }

  // Leaderboard
  async getLeaderboard(limit: number = 50): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.totalWins), desc(users.experience), asc(users.totalLosses))
      .limit(limit);
  }

  // AI opponents
  async createAIGame(playerId: string, difficulty: string): Promise<Game> {
    const [game] = await db
      .insert(games)
      .values({
        player1Id: playerId,
        player2Id: null, // AI opponent
        isAIGame: true,
        aiDifficulty: difficulty,
        status: "active",
        startedAt: new Date(),
      })
      .returning();
    
    return game;
  }
}

export const storage = new DatabaseStorage();
