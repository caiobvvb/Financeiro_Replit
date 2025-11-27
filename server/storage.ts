import { type User, type InsertUser, users, accounts, categories, transactions, type InsertAccount, type Account, type InsertCategory, type Category, type InsertTransaction, type Transaction } from "@shared/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  listAccounts(userId: string): Promise<Account[]>;
  createAccount(data: InsertAccount): Promise<Account>;
  updateAccount(id: string, data: Partial<InsertAccount>): Promise<Account | undefined>;
  deleteAccount(id: string): Promise<void>;
  listCategories(userId: string): Promise<Category[]>;
  createCategory(data: InsertCategory): Promise<Category>;
  updateCategory(id: string, data: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<void>;
  listTransactions(userId: string): Promise<Transaction[]>;
  createTransaction(data: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, data: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private _accounts: Map<string, Account>;
  private _categories: Map<string, Category>;
  private _transactions: Map<string, Transaction>;

  constructor() {
    this.users = new Map();
    this._accounts = new Map();
    this._categories = new Map();
    this._transactions = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async listAccounts(userId: string): Promise<Account[]> {
    return Array.from(this._accounts.values()).filter((a) => a.userId === userId);
  }

  async createAccount(data: InsertAccount): Promise<Account> {
    const id = randomUUID();
    const acc: Account = { ...data, id } as Account;
    this._accounts.set(id, acc);
    return acc;
  }

  async updateAccount(id: string, data: Partial<InsertAccount>): Promise<Account | undefined> {
    const current = this._accounts.get(id);
    if (!current) return undefined;
    const updated = { ...current, ...data } as Account;
    this._accounts.set(id, updated);
    return updated;
  }

  async deleteAccount(id: string): Promise<void> {
    this._accounts.delete(id);
  }

  async listCategories(userId: string): Promise<Category[]> {
    return Array.from(this._categories.values()).filter((c) => c.userId === userId);
  }

  async createCategory(data: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const cat: Category = { ...data, id } as Category;
    this._categories.set(id, cat);
    return cat;
  }

  async updateCategory(id: string, data: Partial<InsertCategory>): Promise<Category | undefined> {
    const current = this._categories.get(id);
    if (!current) return undefined;
    const updated = { ...current, ...data } as Category;
    this._categories.set(id, updated);
    return updated;
  }

  async deleteCategory(id: string): Promise<void> {
    this._categories.delete(id);
  }

  async listTransactions(userId: string): Promise<Transaction[]> {
    return Array.from(this._transactions.values()).filter((t) => t.userId === userId);
  }

  async createTransaction(data: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const tx: Transaction = { ...data, id } as Transaction;
    this._transactions.set(id, tx);
    return tx;
  }

  async updateTransaction(id: string, data: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const current = this._transactions.get(id);
    if (!current) return undefined;
    const updated = { ...current, ...data } as Transaction;
    this._transactions.set(id, updated);
    return updated;
  }

  async deleteTransaction(id: string): Promise<void> {
    this._transactions.delete(id);
  }
}

class DbStorage implements IStorage {
  private db;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required for DbStorage");
    }
    const client = postgres(process.env.DATABASE_URL!, {
      ssl: "require",
    });
    this.db = drizzle(client);
  }

  async getUser(id: string): Promise<User | undefined> {
    const rows = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return rows[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const rows = await this.db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    return rows[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [created] = await this.db
      .insert(users)
      .values({ username: insertUser.username, password: insertUser.password })
      .returning();
    return created;
  }

  async listAccounts(userId: string): Promise<Account[]> {
    const rows = await this.db.select().from(accounts).where(eq(accounts.userId, userId));
    return rows;
  }

  async createAccount(data: InsertAccount): Promise<Account> {
    const [created] = await this.db.insert(accounts).values(data).returning();
    return created;
  }

  async updateAccount(id: string, data: Partial<InsertAccount>): Promise<Account | undefined> {
    const [updated] = await this.db.update(accounts).set(data).where(eq(accounts.id, id)).returning();
    return updated;
  }

  async deleteAccount(id: string): Promise<void> {
    await this.db.delete(accounts).where(eq(accounts.id, id));
  }

  async listCategories(userId: string): Promise<Category[]> {
    const rows = await this.db.select().from(categories).where(eq(categories.userId, userId));
    return rows;
  }

  async createCategory(data: InsertCategory): Promise<Category> {
    const [created] = await this.db.insert(categories).values(data).returning();
    return created;
  }

  async updateCategory(id: string, data: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updated] = await this.db.update(categories).set(data).where(eq(categories.id, id)).returning();
    return updated;
  }

  async deleteCategory(id: string): Promise<void> {
    await this.db.delete(categories).where(eq(categories.id, id));
  }

  async listTransactions(userId: string): Promise<Transaction[]> {
    const rows = await this.db.select().from(transactions).where(eq(transactions.userId, userId));
    return rows;
  }

  async createTransaction(data: InsertTransaction): Promise<Transaction> {
    const [created] = await this.db.insert(transactions).values(data).returning();
    return created;
  }

  async updateTransaction(id: string, data: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const [updated] = await this.db.update(transactions).set(data).where(eq(transactions.id, id)).returning();
    return updated;
  }

  async deleteTransaction(id: string): Promise<void> {
    await this.db.delete(transactions).where(eq(transactions.id, id));
  }
}

export const storage = process.env.DATABASE_URL ? new DbStorage() : new MemStorage();
