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
  unique
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
  username: varchar("username").unique(),
  level: integer("level").default(1),
  experience: integer("experience").default(0),
  credits: integer("credits").default(500),
  wins: integer("wins").default(0),
  losses: integer("losses").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const cards = pgTable("cards", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  type: jsonb("type").$type<string[]>().notNull(),
  cost: integer("cost").default(0),
  attack: integer("attack").default(0),
  defense: integer("defense").default(0),
  commandCost: integer("command_cost").default(0),
  unitMembers: integer("unit_members").default(0),
  redCounters: integer("red_counters").default(0),
  blueCounters: integer("blue_counters").default(0),
  specialAbility: text("special_ability"),
  rarity: varchar("rarity").default("common"), // common, uncommon, rare, legendary
  imageUrl: varchar("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  cardId: integer("card_id").notNull().references(() => cards.id, { onDelete: "cascade" }),
  quantity: integer("quantity").default(1),
  obtainedAt: timestamp("obtained_at").defaultNow(),
}, (table) => [
  unique().on(table.userId, table.cardId)
]);

export const decks = pgTable("decks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  cards: jsonb("cards").$type<{ cardId: number; quantity: number }[]>().notNull(),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  player1Id: varchar("player1_id").notNull().references(() => users.id),
  player2Id: varchar("player2_id").references(() => users.id),
  isAI: boolean("is_ai").default(false),
  aiDifficulty: varchar("ai_difficulty"), // easy, medium, hard
  gameState: jsonb("game_state").$type<any>(),
  currentPhase: varchar("current_phase").default("Command Phase"),
  currentTurn: integer("current_turn").default(1),
  winnerId: varchar("winner_id").references(() => users.id),
  status: varchar("status").default("waiting"), // waiting, active, completed, abandoned
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const boosterPacks = pgTable("booster_packs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  packType: varchar("pack_type").default("standard"),
  quantity: integer("quantity").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  collections: many(collections),
  decks: many(decks),
  gamesAsPlayer1: many(games, { relationName: "player1" }),
  gamesAsPlayer2: many(games, { relationName: "player2" }),
  boosterPacks: many(boosterPacks),
}));

export const cardsRelations = relations(cards, ({ many }) => ({
  collections: many(collections),
}));

export const collectionsRelations = relations(collections, ({ one }) => ({
  user: one(users, {
    fields: [collections.userId],
    references: [users.id],
  }),
  card: one(cards, {
    fields: [collections.cardId],
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

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  username: true,
});

export const insertCardSchema = createInsertSchema(cards);
export const insertCollectionSchema = createInsertSchema(collections);
export const insertDeckSchema = createInsertSchema(decks);
export const insertGameSchema = createInsertSchema(games);
export const insertBoosterPackSchema = createInsertSchema(boosterPacks);

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Card = typeof cards.$inferSelect;
export type Collection = typeof collections.$inferSelect;
export type Deck = typeof decks.$inferSelect;
export type Game = typeof games.$inferSelect;
export type BoosterPack = typeof boosterPacks.$inferSelect;
export type InsertCard = z.infer<typeof insertCardSchema>;
export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type InsertDeck = z.infer<typeof insertDeckSchema>;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type InsertBoosterPack = z.infer<typeof insertBoosterPackSchema>;
