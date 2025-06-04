import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  integer,
  boolean,
  serial,
} from "drizzle-orm/pg-core";
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
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  username: varchar("username").unique(),
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
  type: varchar("type").notNull(), // Unit, Command, Shipyard
  redCounters: integer("red_counters").default(0),
  blueCounters: integer("blue_counters").default(0),
  attack: integer("attack").default(0),
  defense: integer("defense").default(0),
  commandCost: integer("command_cost").default(0),
  unitMembers: integer("unit_members").default(0),
  specialAbility: text("special_ability"),
  rarity: varchar("rarity").default("Common"), // Common, Uncommon, Rare, Legendary
  imageUrl: varchar("image_url"),
});

// User card collections
export const userCards = pgTable("user_cards", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  cardId: integer("card_id").notNull().references(() => cards.id, { onDelete: "cascade" }),
  quantity: integer("quantity").default(1),
  acquiredAt: timestamp("acquired_at").defaultNow(),
});

// User decks
export const decks = pgTable("decks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  isActive: boolean("is_active").default(false),
  cardList: jsonb("card_list").notNull(), // Array of {cardId: number, quantity: number}
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Games
export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  player1Id: varchar("player1_id").notNull().references(() => users.id),
  player2Id: varchar("player2_id").references(() => users.id), // null for AI games
  winnerId: varchar("winner_id").references(() => users.id),
  gameType: varchar("game_type").notNull(), // "ai", "ranked", "casual"
  gameState: jsonb("game_state"), // Complete game state for replays
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
  isActive: boolean("is_active").default(true),
});

// Booster packs owned by users
export const userBoosterPacks = pgTable("user_booster_packs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  packType: varchar("pack_type").default("Standard"),
  quantity: integer("quantity").default(1),
  acquiredAt: timestamp("acquired_at").defaultNow(),
});

// Achievements
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  requirement: jsonb("requirement"), // Flexible requirement structure
  reward: jsonb("reward"), // Credits, cards, titles, etc.
  iconUrl: varchar("icon_url"),
});

// User achievements
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  achievementId: integer("achievement_id").notNull().references(() => achievements.id),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

// Type exports
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type Card = typeof cards.$inferSelect;
export type InsertCard = typeof cards.$inferInsert;

export type UserCard = typeof userCards.$inferSelect;
export type InsertUserCard = typeof userCards.$inferInsert;

export type Deck = typeof decks.$inferSelect;
export type InsertDeck = typeof decks.$inferInsert;

export type Game = typeof games.$inferSelect;
export type InsertGame = typeof games.$inferInsert;

export type UserBoosterPack = typeof userBoosterPacks.$inferSelect;
export type InsertUserBoosterPack = typeof userBoosterPacks.$inferInsert;

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = typeof achievements.$inferInsert;

export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = typeof userAchievements.$inferInsert;

// Validation schemas
export const createDeckSchema = createInsertSchema(decks).pick({
  name: true,
  cardList: true,
});

export const updateDeckSchema = createInsertSchema(decks).pick({
  name: true,
  cardList: true,
  isActive: true,
}).partial();

export const createGameSchema = createInsertSchema(games).pick({
  player2Id: true,
  gameType: true,
});
