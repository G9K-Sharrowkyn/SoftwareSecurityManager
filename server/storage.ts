import {
  users,
  cards,
  userCards,
  decks,
  deckCards,
  games,
  gameMoves,
  achievements,
  userAchievements,
  boosterPacks,
  userBoosterPacks,
  type User,
  type UpsertUser,
  type Card,
  type InsertCard,
  type UserCard,
  type InsertUserCard,
  type Deck,
  type InsertDeck,
  type DeckCard,
  type InsertDeckCard,
  type Game,
  type InsertGame,
  type GameMove,
  type InsertGameMove,
  type Achievement,
  type BoosterPack,
  type UserBoosterPack,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  updateUserStats(userId: string, stats: { gamesPlayed?: number; gamesWon?: number; experience?: number; level?: number; credits?: number }): Promise<void>;
  updateUserProfile(userId: string, updates: Partial<Omit<UpsertUser, "id">>): Promise<User>;

  // Card operations
  getAllCards(): Promise<Card[]>;
  getCard(id: number): Promise<Card | undefined>;
  createCard(card: InsertCard): Promise<Card>;
  getUserCards(userId: string): Promise<(UserCard & { card: Card })[]>;
  addCardToUser(userId: string, cardId: number, quantity?: number): Promise<UserCard>;
  removeCardFromUser(userId: string, cardId: number, quantity?: number): Promise<void>;

  // Deck operations
  getUserDecks(userId: string): Promise<Deck[]>;
  getDeck(id: number): Promise<(Deck & { deckCards: (DeckCard & { card: Card })[] }) | undefined>;
  createDeck(deck: InsertDeck): Promise<Deck>;
  updateDeck(id: number, updates: Partial<Deck>): Promise<void>;
  deleteDeck(id: number): Promise<void>;
  addCardToDeck(deckId: number, cardId: number, quantity?: number): Promise<DeckCard>;
  removeCardFromDeck(deckId: number, cardId: number, quantity?: number): Promise<void>;

  // Game operations
  createGame(game: InsertGame): Promise<Game>;
  getGame(id: string): Promise<Game | undefined>;
  updateGame(id: string, updates: Partial<Game>): Promise<void>;
  getActiveGamesForUser(userId: string): Promise<Game[]>;
  getGameHistory(userId: string, limit?: number): Promise<Game[]>;
  addGameMove(move: InsertGameMove): Promise<GameMove>;
  getGameMoves(gameId: string): Promise<GameMove[]>;

  // Achievement operations
  getAllAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: string): Promise<Achievement[]>;
  unlockAchievement(userId: string, achievementId: number): Promise<void>;

  // Booster pack operations
  getAllBoosterPacks(): Promise<BoosterPack[]>;
  getUserBoosterPacks(userId: string): Promise<UserBoosterPack[]>;
  purchaseBoosterPack(userId: string, packId: number, quantity?: number): Promise<void>;
  openBoosterPack(userId: string, packId: number): Promise<Card[]>;

  // Ranking operations
  getTopPlayers(limit?: number): Promise<User[]>;
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

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async updateUserStats(userId: string, stats: { gamesPlayed?: number; gamesWon?: number; experience?: number; level?: number; credits?: number }): Promise<void> {
    await db.update(users)
      .set({ ...stats, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async updateUserProfile(userId: string, updates: Partial<Omit<UpsertUser, "id">>): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  // Card operations
  async getAllCards(): Promise<Card[]> {
    return await db.select().from(cards).orderBy(cards.name);
  }

  async getCard(id: number): Promise<Card | undefined> {
    const [card] = await db.select().from(cards).where(eq(cards.id, id));
    return card;
  }

  async createCard(card: InsertCard): Promise<Card> {
    const [newCard] = await db.insert(cards).values(card).returning();
    return newCard;
  }

  async getUserCards(userId: string): Promise<(UserCard & { card: Card })[]> {
    return await db
      .select()
      .from(userCards)
      .innerJoin(cards, eq(userCards.cardId, cards.id))
      .where(eq(userCards.userId, userId))
      .orderBy(cards.name);
  }

  async addCardToUser(userId: string, cardId: number, quantity: number = 1): Promise<UserCard> {
    // Check if user already has this card
    const [existing] = await db
      .select()
      .from(userCards)
      .where(and(eq(userCards.userId, userId), eq(userCards.cardId, cardId)));

    if (existing) {
      // Update quantity
      const [updated] = await db
        .update(userCards)
        .set({ quantity: existing.quantity + quantity })
        .where(and(eq(userCards.userId, userId), eq(userCards.cardId, cardId)))
        .returning();
      return updated;
    } else {
      // Create new entry
      const [newUserCard] = await db
        .insert(userCards)
        .values({ userId, cardId, quantity })
        .returning();
      return newUserCard;
    }
  }

  async removeCardFromUser(userId: string, cardId: number, quantity: number = 1): Promise<void> {
    const [existing] = await db
      .select()
      .from(userCards)
      .where(and(eq(userCards.userId, userId), eq(userCards.cardId, cardId)));

    if (existing) {
      if (existing.quantity <= quantity) {
        // Remove completely
        await db
          .delete(userCards)
          .where(and(eq(userCards.userId, userId), eq(userCards.cardId, cardId)));
      } else {
        // Reduce quantity
        await db
          .update(userCards)
          .set({ quantity: existing.quantity - quantity })
          .where(and(eq(userCards.userId, userId), eq(userCards.cardId, cardId)));
      }
    }
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

    const deckCardsWithCards = await db
      .select()
      .from(deckCards)
      .innerJoin(cards, eq(deckCards.cardId, cards.id))
      .where(eq(deckCards.deckId, id));

    return {
      ...deck,
      deckCards: deckCardsWithCards.map(row => ({
        ...row.deck_cards,
        card: row.cards
      }))
    };
  }

  async createDeck(deck: InsertDeck): Promise<Deck> {
    const [newDeck] = await db.insert(decks).values(deck).returning();
    return newDeck;
  }

  async updateDeck(id: number, updates: Partial<Deck>): Promise<void> {
    await db.update(decks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(decks.id, id));
  }

  async deleteDeck(id: number): Promise<void> {
    await db.delete(decks).where(eq(decks.id, id));
  }

  async addCardToDeck(deckId: number, cardId: number, quantity: number = 1): Promise<DeckCard> {
    const [existing] = await db
      .select()
      .from(deckCards)
      .where(and(eq(deckCards.deckId, deckId), eq(deckCards.cardId, cardId)));

    if (existing) {
      const [updated] = await db
        .update(deckCards)
        .set({ quantity: existing.quantity + quantity })
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

  async removeCardFromDeck(deckId: number, cardId: number, quantity: number = 1): Promise<void> {
    const [existing] = await db
      .select()
      .from(deckCards)
      .where(and(eq(deckCards.deckId, deckId), eq(deckCards.cardId, cardId)));

    if (existing) {
      if (existing.quantity <= quantity) {
        await db
          .delete(deckCards)
          .where(and(eq(deckCards.deckId, deckId), eq(deckCards.cardId, cardId)));
      } else {
        await db
          .update(deckCards)
          .set({ quantity: existing.quantity - quantity })
          .where(and(eq(deckCards.deckId, deckId), eq(deckCards.cardId, cardId)));
      }
    }
  }

  // Game operations
  async createGame(game: InsertGame): Promise<Game> {
    const [newGame] = await db.insert(games).values(game).returning();
    return newGame;
  }

  async getGame(id: string): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game;
  }

  async updateGame(id: string, updates: Partial<Game>): Promise<void> {
    await db.update(games).set(updates).where(eq(games.id, id));
  }

  async getActiveGamesForUser(userId: string): Promise<Game[]> {
    return await db
      .select()
      .from(games)
      .where(
        and(
          eq(games.status, "active"),
          sql`(${games.player1Id} = ${userId} OR ${games.player2Id} = ${userId})`
        )
      );
  }

  async getGameHistory(userId: string, limit: number = 20): Promise<Game[]> {
    return await db
      .select()
      .from(games)
      .where(
        and(
          eq(games.status, "finished"),
          sql`(${games.player1Id} = ${userId} OR ${games.player2Id} = ${userId})`
        )
      )
      .orderBy(desc(games.finishedAt))
      .limit(limit);
  }

  async addGameMove(move: InsertGameMove): Promise<GameMove> {
    const [newMove] = await db.insert(gameMoves).values(move).returning();
    return newMove;
  }

  async getGameMoves(gameId: string): Promise<GameMove[]> {
    return await db
      .select()
      .from(gameMoves)
      .where(eq(gameMoves.gameId, gameId))
      .orderBy(gameMoves.createdAt);
  }

  // Achievement operations
  async getAllAchievements(): Promise<Achievement[]> {
    return await db.select().from(achievements).orderBy(achievements.name);
  }

  async getUserAchievements(userId: string): Promise<Achievement[]> {
    const userAchievs = await db
      .select()
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, userId));

    return userAchievs.map(row => row.achievements);
  }

  async unlockAchievement(userId: string, achievementId: number): Promise<void> {
    // Check if already unlocked
    const [existing] = await db
      .select()
      .from(userAchievements)
      .where(and(eq(userAchievements.userId, userId), eq(userAchievements.achievementId, achievementId)));

    if (!existing) {
      await db.insert(userAchievements).values({ userId, achievementId });
    }
  }

  // Booster pack operations
  async getAllBoosterPacks(): Promise<BoosterPack[]> {
    return await db.select().from(boosterPacks).orderBy(boosterPacks.price);
  }

  async getUserBoosterPacks(userId: string): Promise<UserBoosterPack[]> {
    return await db
      .select()
      .from(userBoosterPacks)
      .where(eq(userBoosterPacks.userId, userId))
      .orderBy(desc(userBoosterPacks.purchasedAt));
  }

  async purchaseBoosterPack(userId: string, packId: number, quantity: number = 1): Promise<void> {
    const [existing] = await db
      .select()
      .from(userBoosterPacks)
      .where(and(eq(userBoosterPacks.userId, userId), eq(userBoosterPacks.boosterPackId, packId)));

    if (existing) {
      await db
        .update(userBoosterPacks)
        .set({ quantity: existing.quantity + quantity })
        .where(and(eq(userBoosterPacks.userId, userId), eq(userBoosterPacks.boosterPackId, packId)));
    } else {
      await db
        .insert(userBoosterPacks)
        .values({ userId, boosterPackId: packId, quantity });
    }
  }

  async openBoosterPack(userId: string, packId: number): Promise<Card[]> {
    // Remove one pack from user's inventory
    const [userPack] = await db
      .select()
      .from(userBoosterPacks)
      .where(and(eq(userBoosterPacks.userId, userId), eq(userBoosterPacks.boosterPackId, packId)));

    if (!userPack || userPack.quantity <= 0) {
      throw new Error("No booster packs available");
    }

    if (userPack.quantity === 1) {
      await db
        .delete(userBoosterPacks)
        .where(and(eq(userBoosterPacks.userId, userId), eq(userBoosterPacks.boosterPackId, packId)));
    } else {
      await db
        .update(userBoosterPacks)
        .set({ quantity: userPack.quantity - 1 })
        .where(and(eq(userBoosterPacks.userId, userId), eq(userBoosterPacks.boosterPackId, packId)));
    }

    // Get pack details
    const [pack] = await db.select().from(boosterPacks).where(eq(boosterPacks.id, packId));
    if (!pack) throw new Error("Booster pack not found");

    // Generate random cards based on rarity
    const allCards = await this.getAllCards();
    const revealedCards: Card[] = [];

    for (let i = 0; i < pack.cardCount; i++) {
      // Weighted random selection based on rarity
      const random = Math.random();
      let selectedCard: Card;

      if (random < 0.6) {
        // 60% chance for common
        const commonCards = allCards.filter(c => c.rarity === "Common");
        selectedCard = commonCards[Math.floor(Math.random() * commonCards.length)];
      } else if (random < 0.85) {
        // 25% chance for uncommon
        const uncommonCards = allCards.filter(c => c.rarity === "Uncommon");
        selectedCard = uncommonCards[Math.floor(Math.random() * uncommonCards.length)] || allCards[0];
      } else if (random < 0.96) {
        // 11% chance for rare
        const rareCards = allCards.filter(c => c.rarity === "Rare");
        selectedCard = rareCards[Math.floor(Math.random() * rareCards.length)] || allCards[0];
      } else {
        // 4% chance for legendary
        const legendaryCards = allCards.filter(c => c.rarity === "Legendary");
        selectedCard = legendaryCards[Math.floor(Math.random() * legendaryCards.length)] || allCards[0];
      }

      revealedCards.push(selectedCard);
      
      // Add card to user's collection
      await this.addCardToUser(userId, selectedCard.id, 1);
    }

    return revealedCards;
  }

  // Ranking operations
  async getTopPlayers(limit: number = 50): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.gamesWon), desc(users.level), desc(users.experience))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
