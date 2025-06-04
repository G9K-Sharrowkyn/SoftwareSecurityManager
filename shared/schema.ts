import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  uuid,
  real
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  username: varchar("username").unique().notNull(),
  level: integer("level").default(1),
  experience: integer("experience").default(0),
  credits: integer("credits").default(1000),
  gamesPlayed: integer("games_played").default(0),
  gamesWon: integer("games_won").default(0),
  currentRank: varchar("current_rank").default("Recruit"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Card definitions
export const cards = pgTable("cards", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  type: text("type").array().notNull(), // ["Unit", "Command", "Shipyard"]
  commandCost: integer("command_cost").default(0),
  attack: integer("attack").default(0),
  defense: integer("defense").default(0),
  unitMembers: integer("unit_members").default(0),
  specialAbility: text("special_ability"),
  rarity: varchar("rarity").notNull(), // "Common", "Uncommon", "Rare", "Legendary"
  imageUrl: varchar("image_url"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Player card collections
export const userCards = pgTable("user_cards", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  cardId: integer("card_id").notNull().references(() => cards.id, { onDelete: "cascade" }),
  quantity: integer("quantity").default(1),
  acquiredAt: timestamp("acquired_at").defaultNow(),
});

// Player decks
export const decks = pgTable("decks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Deck card compositions
export const deckCards = pgTable("deck_cards", {
  id: serial("id").primaryKey(),
  deckId: integer("deck_id").notNull().references(() => decks.id, { onDelete: "cascade" }),
  cardId: integer("card_id").notNull().references(() => cards.id, { onDelete: "cascade" }),
  quantity: integer("quantity").default(1),
});

// Game sessions
export const games = pgTable("games", {
  id: uuid("id").primaryKey().defaultRandom(),
  player1Id: varchar("player1_id").notNull().references(() => users.id),
  player2Id: varchar("player2_id").references(() => users.id), // null for AI games
  gameType: varchar("game_type").notNull(), // "AI", "PVP", "Ranked"
  status: varchar("status").notNull(), // "waiting", "active", "finished"
  winnerId: varchar("winner_id").references(() => users.id),
  currentPhase: varchar("current_phase").default("Command Phase"),
  currentTurn: integer("current_turn").default(1),
  gameState: jsonb("game_state"), // Store complete game state
  aiDifficulty: varchar("ai_difficulty"), // "Easy", "Medium", "Hard"
  createdAt: timestamp("created_at").defaultNow(),
  finishedAt: timestamp("finished_at"),
});

// Game moves/actions for replay
export const gameMoves = pgTable("game_moves", {
  id: serial("id").primaryKey(),
  gameId: uuid("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
  playerId: varchar("player_id").notNull().references(() => users.id),
  moveType: varchar("move_type").notNull(), // "deploy", "attack", "end_phase", etc.
  moveData: jsonb("move_data"),
  turnNumber: integer("turn_number").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Player achievements
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  type: varchar("type").notNull(), // "games_won", "cards_collected", etc.
  requirement: integer("requirement"),
  reward: integer("reward"), // credits awarded
  icon: varchar("icon"),
});

// User achievements
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  achievementId: integer("achievement_id").notNull().references(() => achievements.id, { onDelete: "cascade" }),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

// Booster packs
export const boosterPacks = pgTable("booster_packs", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  price: integer("price").notNull(),
  cardCount: integer("card_count").default(5),
  description: text("description"),
  rarity: varchar("rarity").notNull(),
  imageUrl: varchar("image_url"),
});

// User booster pack purchases
export const userBoosterPacks = pgTable("user_booster_packs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  boosterPackId: integer("booster_pack_id").notNull().references(() => boosterPacks.id),
  quantity: integer("quantity").default(1),
  purchasedAt: timestamp("purchased_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  userCards: many(userCards),
  decks: many(decks),
  gamesAsPlayer1: many(games, { relationName: "player1" }),
  gamesAsPlayer2: many(games, { relationName: "player2" }),
  userAchievements: many(userAchievements),
  userBoosterPacks: many(userBoosterPacks),
}));

export const cardsRelations = relations(cards, ({ many }) => ({
  userCards: many(userCards),
  deckCards: many(deckCards),
}));

export const userCardsRelations = relations(userCards, ({ one }) => ({
  user: one(users, { fields: [userCards.userId], references: [users.id] }),
  card: one(cards, { fields: [userCards.cardId], references: [cards.id] }),
}));

export const decksRelations = relations(decks, ({ one, many }) => ({
  user: one(users, { fields: [decks.userId], references: [users.id] }),
  deckCards: many(deckCards),
}));

export const deckCardsRelations = relations(deckCards, ({ one }) => ({
  deck: one(decks, { fields: [deckCards.deckId], references: [decks.id] }),
  card: one(cards, { fields: [deckCards.cardId], references: [cards.id] }),
}));

export const gamesRelations = relations(games, ({ one, many }) => ({
  player1: one(users, { fields: [games.player1Id], references: [users.id], relationName: "player1" }),
  player2: one(users, { fields: [games.player2Id], references: [users.id], relationName: "player2" }),
  winner: one(users, { fields: [games.winnerId], references: [users.id] }),
  gameMoves: many(gameMoves),
}));

export const gameMovesRelations = relations(gameMoves, ({ one }) => ({
  game: one(games, { fields: [gameMoves.gameId], references: [games.id] }),
  player: one(users, { fields: [gameMoves.playerId], references: [users.id] }),
}));

export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, { fields: [userAchievements.userId], references: [users.id] }),
  achievement: one(achievements, { fields: [userAchievements.achievementId], references: [achievements.id] }),
}));

export const boosterPacksRelations = relations(boosterPacks, ({ many }) => ({
  userBoosterPacks: many(userBoosterPacks),
}));

export const userBoosterPacksRelations = relations(userBoosterPacks, ({ one }) => ({
  user: one(users, { fields: [userBoosterPacks.userId], references: [users.id] }),
  boosterPack: one(boosterPacks, { fields: [userBoosterPacks.boosterPackId], references: [boosterPacks.id] }),
}));

// Type exports
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Card = typeof cards.$inferSelect;
export type InsertCard = typeof cards.$inferInsert;
export type UserCard = typeof userCards.$inferSelect;
export type InsertUserCard = typeof userCards.$inferInsert;
export type Deck = typeof decks.$inferSelect;
export type InsertDeck = typeof decks.$inferInsert;
export type DeckCard = typeof deckCards.$inferSelect;
export type InsertDeckCard = typeof deckCards.$inferInsert;
export type Game = typeof games.$inferSelect;
export type InsertGame = typeof games.$inferInsert;
export type GameMove = typeof gameMoves.$inferSelect;
export type InsertGameMove = typeof gameMoves.$inferInsert;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = typeof achievements.$inferInsert;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type BoosterPack = typeof boosterPacks.$inferSelect;
export type UserBoosterPack = typeof userBoosterPacks.$inferSelect;

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
});

export const insertCardSchema = createInsertSchema(cards);
export const insertDeckSchema = createInsertSchema(decks);
export const insertGameSchema = createInsertSchema(games);
