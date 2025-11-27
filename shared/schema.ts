import { sql } from "drizzle-orm";
import { pgTable, text, varchar, numeric, date, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const accounts = pgTable("accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  balance: numeric("balance", { precision: 20, scale: 2 }).default("0"),
});

export const insertAccountSchema = createInsertSchema(accounts).pick({
  userId: true,
  name: true,
  type: true,
  balance: true,
});
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Account = typeof accounts.$inferSelect;

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  userId: true,
  name: true,
  type: true,
});
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  accountId: varchar("account_id").notNull(),
  categoryId: varchar("category_id").notNull(),
  amount: numeric("amount", { precision: 20, scale: 2 }).notNull(),
  date: date("date").notNull(),
  description: text("description"),
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  userId: true,
  accountId: true,
  categoryId: true,
  amount: true,
  date: true,
  description: true,
});
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
