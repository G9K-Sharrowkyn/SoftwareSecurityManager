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
  real,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  level: integer("level").default(1),
  experience: integer("experience").default(0),
  credits: integer("credits").default(1000),
  wins: integer("wins").default(0),
  losses: integer("losses").default(0),
  currentRank: varchar("current_rank").default("Recruit"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Card definitions
export const cards = pgTable("cards", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  type: jsonb("type").$type<string[]>().notNull(),
  commandCost: integer("command_cost").default(0),
  attack: integer("attack").default(0),
  defense: integer("defense").default(0),
  unitMembers: integer("unit_members").default(0),
  redCounters: integer("red_counters").default(0),
  blueCounters: integer("blue_counters").default(0),
  specialAbility: text("special_ability"),
  imageUrl: varchar("image_url"),
  rarity: varchar("rarity").default("common"), // common, uncommon, rare, legendary
  createdAt: timestamp("created_at").defaultNow(),
});

// User card collections
export const userCards = pgTable("user_cards", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  cardId: integer("card_id").notNull().references(() => cards.id),
  quantity: integer("quantity").default(1),
  acquiredAt: timestamp("acquired_at").defaultNow(),
});

// User decks
export const decks = pgTable("decks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  cards: jsonb("cards").$type<{cardId: number, quantity: number}[]>().notNull(),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Games
export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  player1Id: varchar("player1_id").notNull().references(() => users.id),
  player2Id: varchar("player2_id").references(() => users.id), // null for AI games
  isAIGame: boolean("is_ai_game").default(false),
  aiDifficulty: varchar("ai_difficulty"), // easy, medium, hard
  gameState: jsonb("game_state").$type<any>(),
  currentPhase: varchar("current_phase").default("Command Phase"),
  currentPlayer: varchar("current_player"),
  winnerId: varchar("winner_id").references(() => users.id),
  experienceGained: integer("experience_gained").default(0),
  creditsGained: integer("credits_gained").default(0),
  status: varchar("status").default("active"), // active, completed, abandoned
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Booster packs
export const boosterPacks = pgTable("booster_packs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  packType: varchar("pack_type").default("standard"),
  isOpened: boolean("is_opened").default(false),
  cards: jsonb("cards").$type<number[]>(), // card IDs
  purchasedAt: timestamp("purchased_at").defaultNow(),
  openedAt: timestamp("opened_at"),
});

// Achievements
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  requirement: jsonb("requirement").$type<any>(),
  reward: jsonb("reward").$type<{credits?: number, experience?: number, cards?: number[]}>(),
  iconUrl: varchar("icon_url"),
  createdAt: timestamp("created_at").defaultNow(),
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
  boosterPacks: many(boosterPacks),
  userAchievements: many(userAchievements),
}));

export const cardsRelations = relations(cards, ({ many }) => ({
  userCards: many(userCards),
}));

export const userCardsRelations = relations(userCards, ({ one }) => ({
  user: one(users, {
    fields: [userCards.userId],
    references: [users.id],
  }),
  card: one(cards, {
    fields: [userCards.cardId],
    references: [cards.id],
  }),
}));

export const decksRelations = relations(decks, ({ one }) => ({
  user: one(users, {
    fields: [decks.userId],
    references: [users.id],
  }),
}));

export const gamesRelations = relations(games, ({ one }) => ({
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
}));

export const boosterPacksRelations = relations(boosterPacks, ({ one }) => ({
  user: one(users, {
    fields: [boosterPacks.userId],
    references: [users.id],
  }),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id],
  }),
  achievement: one(achievements, {
    fields: [userAchievements.achievementId],
    references: [achievements.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertCardSchema = createInsertSchema(cards).omit({
  id: true,
  createdAt: true,
});

export const insertUserCardSchema = createInsertSchema(userCards).omit({
  id: true,
  acquiredAt: true,
});

export const insertDeckSchema = createInsertSchema(decks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
  startedAt: true,
  completedAt: true,
});

export const insertBoosterPackSchema = createInsertSchema(boosterPacks).omit({
  id: true,
  purchasedAt: true,
  openedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Card = typeof cards.$inferSelect;
export type InsertCard = z.infer<typeof insertCardSchema>;
export type UserCard = typeof userCards.$inferSelect;
export type InsertUserCard = z.infer<typeof insertUserCardSchema>;
export type Deck = typeof decks.$inferSelect;
export type InsertDeck = z.infer<typeof insertDeckSchema>;
export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type BoosterPack = typeof boosterPacks.$inferSelect;
export type InsertBoosterPack = z.infer<typeof insertBoosterPackSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;
