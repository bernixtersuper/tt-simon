import { pgTable, serial, varchar, integer, timestamp } from 'drizzle-orm/pg-core';

export const leaderboard = pgTable('leaderboard', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 20 }).notNull(),
  email: varchar('email', { length: 255 }),
  score: integer('score').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export type LeaderboardEntry = typeof leaderboard.$inferSelect;
