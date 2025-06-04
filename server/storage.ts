import {
  users,
  cards,
  userCards,
  decks,
  deckCards,
  games,
  gameMoves,
  boosterPacks,
  userBoosterPacks,
  achievements,
  userAchievements,
  type User,
  type UpsertUser,
  type Card,
  type InsertCard,
  type UserCard,
  type Deck,
  type InsertDeck,
  type DeckCard,
  type Game,
  type InsertGame,
  type GameMove,
  type BoosterPack,
  type UserBoosterPack,
  type Achievement,
  type UserAchievement,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Card operations
  getCards(): Promise<Card[]>;
  getCard(id: number): Promise<Card | undefined>;
  createCard(card: InsertCard): Promise<Card>;
  
  // User collection operations
  getUserCards(userId: string): Promise<(UserCard & { card: Card })[]>;
  addCardToUser(userId: string, cardId: number, quantity?: number): Promise<UserCard>;
  
  // Deck operations
  getUserDecks(userId: string): Promise<Deck[]>;
  getDeck(id: number): Promise<(Deck & { deckCards: (DeckCard & { card: Card })[] }) | undefined>;
  createDeck(deck: InsertDeck): Promise<Deck>;
  updateDeck(id: number, updates: Partial<Deck>): Promise<Deck>;
  deleteDeck(id: number): Promise<void>;
  addCardToDeck(deckId: number, cardId: number, quantity?: number): Promise<DeckCard>;
  removeCardFromDeck(deckId: number, cardId: number): Promise<void>;
  
  // Game operations
  createGame(game: InsertGame): Promise<Game>;
  getGame(id: string): Promise<Game | undefined>;
  updateGame(id: string, updates: Partial<Game>): Promise<Game>;
  getUserGames(userId: string): Promise<Game[]>;
  getActiveGames(): Promise<Game[]>;
  
  // Game moves
  addGameMove(move: Omit<GameMove, 'id' | 'timestamp'>): Promise<GameMove>;
  getGameMoves(gameId: string): Promise<GameMove[]>;
  
  // Booster pack operations
  getBoosterPacks(): Promise<BoosterPack[]>;
  getUserBoosterPacks(userId: string): Promise<UserBoosterPack[]>;
  purchaseBoosterPack(userId: string, boosterPackId: number): Promise<UserBoosterPack>;
  openBoosterPack(userBoosterPackId: number): Promise<Card[]>;
  
  // Achievement operations
  getAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: string): Promise<(UserAchievement & { achievement: Achievement })[]>;
  grantAchievement(userId: string, achievementId: number): Promise<UserAchievement>;
  
  // Leaderboard operations
  getLeaderboard(): Promise<User[]>;
  updateUserStats(userId: string, won: boolean, experience: number): Promise<User>;
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
  async getCards(): Promise<Card[]> {
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

  // User collection operations
  async getUserCards(userId: string): Promise<(UserCard & { card: Card })[]> {
    return await db
      .select({
        id: userCards.id,
        userId: userCards.userId,
        cardId: userCards.cardId,
        quantity: userCards.quantity,
        obtainedAt: userCards.obtainedAt,
        card: cards,
      })
      .from(userCards)
      .innerJoin(cards, eq(userCards.cardId, cards.id))
      .where(eq(userCards.userId, userId));
  }

  async addCardToUser(userId: string, cardId: number, quantity: number = 1): Promise<UserCard> {
    // Check if user already has this card
    const [existingCard] = await db
      .select()
      .from(userCards)
      .where(and(eq(userCards.userId, userId), eq(userCards.cardId, cardId)));

    if (existingCard) {
      // Update quantity
      const [updated] = await db
        .update(userCards)
        .set({ quantity: existingCard.quantity + quantity })
        .where(eq(userCards.id, existingCard.id))
        .returning();
      return updated;
    } else {
      // Add new card
      const [newUserCard] = await db
        .insert(userCards)
        .values({ userId, cardId, quantity })
        .returning();
      return newUserCard;
    }
  }

  // Deck operations
  async getUserDecks(userId: string): Promise<Deck[]> {
    return await db.select().from(decks).where(eq(decks.userId, userId));
  }

  async getDeck(id: number): Promise<(Deck & { deckCards: (DeckCard & { card: Card })[] }) | undefined> {
    const [deck] = await db.select().from(decks).where(eq(decks.id, id));
    if (!deck) return undefined;

    const deckCardsWithCards = await db
      .select({
        id: deckCards.id,
        deckId: deckCards.deckId,
        cardId: deckCards.cardId,
        quantity: deckCards.quantity,
        card: cards,
      })
      .from(deckCards)
      .innerJoin(cards, eq(deckCards.cardId, cards.id))
      .where(eq(deckCards.deckId, id));

    return { ...deck, deckCards: deckCardsWithCards };
  }

  async createDeck(deck: InsertDeck): Promise<Deck> {
    const [newDeck] = await db.insert(decks).values(deck).returning();
    return newDeck;
  }

  async updateDeck(id: number, updates: Partial<Deck>): Promise<Deck> {
    const [updated] = await db
      .update(decks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(decks.id, id))
      .returning();
    return updated;
  }

  async deleteDeck(id: number): Promise<void> {
    await db.delete(deckCards).where(eq(deckCards.deckId, id));
    await db.delete(decks).where(eq(decks.id, id));
  }

  async addCardToDeck(deckId: number, cardId: number, quantity: number = 1): Promise<DeckCard> {
    const [existingCard] = await db
      .select()
      .from(deckCards)
      .where(and(eq(deckCards.deckId, deckId), eq(deckCards.cardId, cardId)));

    if (existingCard) {
      const [updated] = await db
        .update(deckCards)
        .set({ quantity: existingCard.quantity + quantity })
        .where(eq(deckCards.id, existingCard.id))
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

  // Game operations
  async createGame(game: InsertGame): Promise<Game> {
    const [newGame] = await db.insert(games).values(game).returning();
    return newGame;
  }

  async getGame(id: string): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game;
  }

  async updateGame(id: string, updates: Partial<Game>): Promise<Game> {
    const [updated] = await db
      .update(games)
      .set(updates)
      .where(eq(games.id, id))
      .returning();
    return updated;
  }

  async getUserGames(userId: string): Promise<Game[]> {
    return await db
      .select()
      .from(games)
      .where(sql`${games.player1Id} = ${userId} OR ${games.player2Id} = ${userId}`)
      .orderBy(desc(games.createdAt));
  }

  async getActiveGames(): Promise<Game[]> {
    return await db
      .select()
      .from(games)
      .where(eq(games.gameStatus, 'active'))
      .orderBy(desc(games.createdAt));
  }

  // Game moves
  async addGameMove(move: Omit<GameMove, 'id' | 'timestamp'>): Promise<GameMove> {
    const [newMove] = await db.insert(gameMoves).values(move).returning();
    return newMove;
  }

  async getGameMoves(gameId: string): Promise<GameMove[]> {
    return await db
      .select()
      .from(gameMoves)
      .where(eq(gameMoves.gameId, gameId))
      .orderBy(gameMoves.timestamp);
  }

  // Booster pack operations
  async getBoosterPacks(): Promise<BoosterPack[]> {
    return await db.select().from(boosterPacks).where(eq(boosterPacks.isActive, true));
  }

  async getUserBoosterPacks(userId: string): Promise<UserBoosterPack[]> {
    return await db
      .select()
      .from(userBoosterPacks)
      .where(and(eq(userBoosterPacks.userId, userId), eq(userBoosterPacks.isOpened, false)));
  }

  async purchaseBoosterPack(userId: string, boosterPackId: number): Promise<UserBoosterPack> {
    const [pack] = await db
      .insert(userBoosterPacks)
      .values({ userId, boosterPackId })
      .returning();
    return pack;
  }

  async openBoosterPack(userBoosterPackId: number): Promise<Card[]> {
    // Mark pack as opened
    await db
      .update(userBoosterPacks)
      .set({ isOpened: true, openedAt: new Date() })
      .where(eq(userBoosterPacks.id, userBoosterPackId));

    // Get random cards (simplified - in production would have rarity weighting)
    const allCards = await db.select().from(cards);
    const selectedCards: Card[] = [];
    
    for (let i = 0; i < 5; i++) {
      const randomIndex = Math.floor(Math.random() * allCards.length);
      selectedCards.push(allCards[randomIndex]);
    }

    return selectedCards;
  }

  // Achievement operations
  async getAchievements(): Promise<Achievement[]> {
    return await db.select().from(achievements).where(eq(achievements.isActive, true));
  }

  async getUserAchievements(userId: string): Promise<(UserAchievement & { achievement: Achievement })[]> {
    return await db
      .select({
        id: userAchievements.id,
        userId: userAchievements.userId,
        achievementId: userAchievements.achievementId,
        unlockedAt: userAchievements.unlockedAt,
        achievement: achievements,
      })
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, userId));
  }

  async grantAchievement(userId: string, achievementId: number): Promise<UserAchievement> {
    const [achievement] = await db
      .insert(userAchievements)
      .values({ userId, achievementId })
      .returning();
    return achievement;
  }

  // Leaderboard operations
  async getLeaderboard(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.totalWins), desc(users.level))
      .limit(100);
  }

  async updateUserStats(userId: string, won: boolean, experience: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        totalWins: won ? sql`${users.totalWins} + 1` : users.totalWins,
        totalLosses: won ? users.totalLosses : sql`${users.totalLosses} + 1`,
        experience: sql`${users.experience} + ${experience}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    
    // Level up logic
    const newLevel = Math.floor(user.experience / 1000) + 1;
    if (newLevel > user.level) {
      const [updatedUser] = await db
        .update(users)
        .set({ level: newLevel })
        .where(eq(users.id, userId))
        .returning();
      return updatedUser;
    }
    
    return user;
  }
}

export const storage = new DatabaseStorage();
