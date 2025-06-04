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
  primaryKey,
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
  username: varchar("username").notNull().unique(),
  level: integer("level").default(1),
  experience: integer("experience").default(0),
  credits: integer("credits").default(1000),
  totalWins: integer("total_wins").default(0),
  totalLosses: integer("total_losses").default(0),
  winStreak: integer("win_streak").default(0),
  rank: varchar("rank").default("Cadet"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Card definitions
export const cards = pgTable("cards", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  type: jsonb("type").$type<string[]>().notNull(),
  attack: integer("attack").default(0),
  defense: integer("defense").default(0),
  commandCost: integer("command_cost").default(0),
  unitMembers: integer("unit_members").default(0),
  redCounters: integer("red_counters").default(0),
  blueCounters: integer("blue_counters").default(0),
  specialAbility: text("special_ability"),
  imageUrl: varchar("image_url"),
  rarity: varchar("rarity").notNull().default("Common"), // Common, Uncommon, Rare, Legendary
  createdAt: timestamp("created_at").defaultNow(),
});

// User card collections
export const userCards = pgTable("user_cards", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  cardId: integer("card_id").notNull().references(() => cards.id, { onDelete: "cascade" }),
  quantity: integer("quantity").default(1),
  acquiredAt: timestamp("acquired_at").defaultNow(),
});

// Decks
export const decks = pgTable("decks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Deck cards
export const deckCards = pgTable("deck_cards", {
  id: serial("id").primaryKey(),
  deckId: integer("deck_id").notNull().references(() => decks.id, { onDelete: "cascade" }),
  cardId: integer("card_id").notNull().references(() => cards.id, { onDelete: "cascade" }),
  quantity: integer("quantity").default(1),
});

// Games
export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  player1Id: varchar("player1_id").notNull().references(() => users.id),
  player2Id: varchar("player2_id").references(() => users.id), // null for AI games
  isAIGame: boolean("is_ai_game").default(false),
  aiDifficulty: varchar("ai_difficulty"), // Easy, Medium, Hard
  status: varchar("status").notNull().default("waiting"), // waiting, active, finished
  winnerId: varchar("winner_id").references(() => users.id),
  gameState: jsonb("game_state"), // Complete game state for resuming
  currentPhase: varchar("current_phase").default("Command Phase"),
  currentTurn: integer("current_turn").default(1),
  player1Health: integer("player1_health").default(100),
  player2Health: integer("player2_health").default(100),
  startedAt: timestamp("started_at"),
  finishedAt: timestamp("finished_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Game moves/actions log
export const gameMoves = pgTable("game_moves", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
  playerId: varchar("player_id").notNull().references(() => users.id),
  moveType: varchar("move_type").notNull(), // play_card, end_phase, attack, etc.
  moveData: jsonb("move_data"), // Specific move details
  timestamp: timestamp("timestamp").defaultNow(),
});

// Booster packs
export const boosterPacks = pgTable("booster_packs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  packType: varchar("pack_type").notNull().default("Standard"),
  isOpened: boolean("is_opened").default(false),
  openedAt: timestamp("opened_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Pack contents (revealed cards)
export const packContents = pgTable("pack_contents", {
  id: serial("id").primaryKey(),
  packId: integer("pack_id").notNull().references(() => boosterPacks.id, { onDelete: "cascade" }),
  cardId: integer("card_id").notNull().references(() => cards.id),
  revealedAt: timestamp("revealed_at").defaultNow(),
});

// Achievements
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  requirement: jsonb("requirement"), // Achievement requirements
  rewardCredits: integer("reward_credits").default(0),
  rewardExperience: integer("reward_experience").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// User achievements
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  achievementId: integer("achievement_id").notNull().references(() => achievements.id, { onDelete: "cascade" }),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  userCards: many(userCards),
  decks: many(decks),
  gamesAsPlayer1: many(games, { relationName: "player1" }),
  gamesAsPlayer2: many(games, { relationName: "player2" }),
  gameMoves: many(gameMoves),
  boosterPacks: many(boosterPacks),
  achievements: many(userAchievements),
}));

export const cardsRelations = relations(cards, ({ many }) => ({
  userCards: many(userCards),
  deckCards: many(deckCards),
  packContents: many(packContents),
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

export const decksRelations = relations(decks, ({ one, many }) => ({
  user: one(users, {
    fields: [decks.userId],
    references: [users.id],
  }),
  deckCards: many(deckCards),
}));

export const deckCardsRelations = relations(deckCards, ({ one }) => ({
  deck: one(decks, {
    fields: [deckCards.deckId],
    references: [decks.id],
  }),
  card: one(cards, {
    fields: [deckCards.cardId],
    references: [cards.id],
  }),
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
    relationName: "winner",
  }),
  moves: many(gameMoves),
}));

export const gameMovesRelations = relations(gameMoves, ({ one }) => ({
  game: one(games, {
    fields: [gameMoves.gameId],
    references: [games.id],
  }),
  player: one(users, {
    fields: [gameMoves.playerId],
    references: [users.id],
  }),
}));

export const boosterPacksRelations = relations(boosterPacks, ({ one, many }) => ({
  user: one(users, {
    fields: [boosterPacks.userId],
    references: [users.id],
  }),
  contents: many(packContents),
}));

export const packContentsRelations = relations(packContents, ({ one }) => ({
  pack: one(boosterPacks, {
    fields: [packContents.packId],
    references: [boosterPacks.id],
  }),
  card: one(cards, {
    fields: [packContents.cardId],
    references: [cards.id],
  }),
}));

export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements),
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
export const insertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  username: true,
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
});

export const insertBoosterPackSchema = createInsertSchema(boosterPacks).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Card = typeof cards.$inferSelect;
export type UserCard = typeof userCards.$inferSelect;
export type Deck = typeof decks.$inferSelect;
export type DeckCard = typeof deckCards.$inferSelect;
export type Game = typeof games.$inferSelect;
export type GameMove = typeof gameMoves.$inferSelect;
export type BoosterPack = typeof boosterPacks.$inferSelect;
export type PackContent = typeof packContents.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;

export type InsertCard = z.infer<typeof insertCardSchema>;
export type InsertDeck = z.infer<typeof insertDeckSchema>;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type InsertBoosterPack = z.infer<typeof insertBoosterPackSchema>;
