import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  integer,
  boolean,
  index,
  serial,
  decimal,
  uuid
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
  username: varchar("username").notNull().unique(),
  level: integer("level").default(1),
  experience: integer("experience").default(0),
  credits: integer("credits").default(500),
  totalWins: integer("total_wins").default(0),
  totalLosses: integer("total_losses").default(0),
  currentRank: varchar("current_rank").default("Recruit"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Card definitions
export const cards = pgTable("cards", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  type: varchar("type", { length: 100 }).notNull(), // Unit, Command, Shipyard
  subtype: varchar("subtype", { length: 100 }),
  commandCost: integer("command_cost").default(0),
  attack: integer("attack").default(0),
  defense: integer("defense").default(0),
  unitMembers: integer("unit_members").default(0),
  redCounters: integer("red_counters").default(0),
  blueCounters: integer("blue_counters").default(0),
  specialAbility: text("special_ability"),
  flavorText: text("flavor_text"),
  imageUrl: varchar("image_url"),
  rarity: varchar("rarity", { length: 50 }).default("Common"), // Common, Uncommon, Rare, Legendary
  createdAt: timestamp("created_at").defaultNow(),
});

// User card collections
export const userCards = pgTable("user_cards", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  cardId: integer("card_id").notNull().references(() => cards.id),
  quantity: integer("quantity").default(1),
  obtainedAt: timestamp("obtained_at").defaultNow(),
});

// Decks
export const decks = pgTable("decks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Deck cards
export const deckCards = pgTable("deck_cards", {
  id: serial("id").primaryKey(),
  deckId: integer("deck_id").notNull().references(() => decks.id),
  cardId: integer("card_id").notNull().references(() => cards.id),
  quantity: integer("quantity").default(1),
});

// Games
export const games = pgTable("games", {
  id: uuid("id").primaryKey().defaultRandom(),
  player1Id: varchar("player1_id").notNull().references(() => users.id),
  player2Id: varchar("player2_id").references(() => users.id), // null for AI games
  isAIGame: boolean("is_ai_game").default(false),
  aiDifficulty: varchar("ai_difficulty", { length: 50 }), // Easy, Medium, Hard
  gameStatus: varchar("game_status", { length: 50 }).default("waiting"), // waiting, active, completed, abandoned
  winnerId: varchar("winner_id").references(() => users.id),
  currentTurn: varchar("current_turn").references(() => users.id),
  currentPhase: varchar("current_phase", { length: 50 }).default("Command Phase"),
  turnNumber: integer("turn_number").default(1),
  gameState: jsonb("game_state"), // Complete game state
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Game moves/actions log
export const gameMoves = pgTable("game_moves", {
  id: serial("id").primaryKey(),
  gameId: uuid("game_id").notNull().references(() => games.id),
  playerId: varchar("player_id").notNull().references(() => users.id),
  moveType: varchar("move_type", { length: 100 }).notNull(), // play_card, end_phase, attack, etc.
  moveData: jsonb("move_data"),
  turnNumber: integer("turn_number"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Booster packs
export const boosterPacks = pgTable("booster_packs", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  cardCount: integer("card_count").default(5),
  cost: integer("cost").default(100),
  imageUrl: varchar("image_url"),
  isActive: boolean("is_active").default(true),
});

// User booster pack purchases
export const userBoosterPacks = pgTable("user_booster_packs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  boosterPackId: integer("booster_pack_id").notNull().references(() => boosterPacks.id),
  isOpened: boolean("is_opened").default(false),
  purchasedAt: timestamp("purchased_at").defaultNow(),
  openedAt: timestamp("opened_at"),
});

// Achievements
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  requirement: jsonb("requirement"), // Conditions to unlock
  rewardType: varchar("reward_type", { length: 50 }), // credits, xp, card, title
  rewardValue: integer("reward_value"),
  isActive: boolean("is_active").default(true),
});

// User achievements
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  achievementId: integer("achievement_id").notNull().references(() => achievements.id),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  userCards: many(userCards),
  decks: many(decks),
  gamesAsPlayer1: many(games, { relationName: "player1" }),
  gamesAsPlayer2: many(games, { relationName: "player2" }),
  gameMoves: many(gameMoves),
  userBoosterPacks: many(userBoosterPacks),
  userAchievements: many(userAchievements),
}));

export const cardsRelations = relations(cards, ({ many }) => ({
  userCards: many(userCards),
  deckCards: many(deckCards),
}));

export const decksRelations = relations(decks, ({ one, many }) => ({
  user: one(users, {
    fields: [decks.userId],
    references: [users.id],
  }),
  deckCards: many(deckCards),
}));

export const gamesRelations = relations(games, ({ one, many }) => ({
  player1: one(users, {
    fields: [games.player1Id],
    references: [users.id],
    relationName: "player1",
  }),
  player2: one(users, {
    fields: [games.player2Id],
    references: [users.id],
    relationName: "player2",
  }),
  winner: one(users, {
    fields: [games.winnerId],
    references: [users.id],
  }),
  gameMoves: many(gameMoves),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCardSchema = createInsertSchema(cards).omit({
  id: true,
  createdAt: true,
});

export const insertDeckSchema = createInsertSchema(decks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertBoosterPackSchema = createInsertSchema(boosterPacks).omit({
  id: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Card = typeof cards.$inferSelect;
export type InsertCard = z.infer<typeof insertCardSchema>;
export type UserCard = typeof userCards.$inferSelect;
export type Deck = typeof decks.$inferSelect;
export type InsertDeck = z.infer<typeof insertDeckSchema>;
export type DeckCard = typeof deckCards.$inferSelect;
export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type GameMove = typeof gameMoves.$inferSelect;
export type BoosterPack = typeof boosterPacks.$inferSelect;
export type UserBoosterPack = typeof userBoosterPacks.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;
