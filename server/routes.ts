import type { Express, Request, Response } from "express";
import passport from "passport";
import bcrypt from "bcryptjs";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertAccountSchema, insertCategorySchema, insertTransactionSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ ok: true, db: Boolean(process.env.DATABASE_URL) });
  });

  app.get("/api/banks", async (_req: Request, res: Response) => {
    const rows = await storage.listBanks();
    res.json(rows);
  });

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    const parse = insertUserSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ message: "Invalid payload" });
    const { username, password } = parse.data;
    const existing = await storage.getUserByUsername(username);
    if (existing) return res.status(409).json({ message: "Username already exists" });
    const hash = await bcrypt.hash(password, 10);
    const created = await storage.createUser({ username, password: hash });
    res.status(201).json({ id: created.id, username: created.username });
  });

  app.post("/api/auth/login", (req: Request, res: Response, next) => {
    passport.authenticate("local", (err: any, user: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Invalid credentials" });
      req.logIn(user, (e: any) => {
        if (e) return next(e);
        res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req: any, res: Response) => {
    req.logout(() => {
      res.json({ ok: true });
    });
  });

  app.get("/api/auth/me", (req: any, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    res.json(req.user);
  });

  app.post("/api/users", async (req: Request, res: Response) => {
    const parse = insertUserSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    const { username, password } = parse.data;
    const existing = await storage.getUserByUsername(username);
    if (existing) {
      return res.status(409).json({ message: "Username already exists" });
    }
    const created = await storage.createUser({ username, password });
    res.status(201).json(created);
  });

  app.get("/api/users/:id", async (req: Request, res: Response) => {
    const user = await storage.getUser(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  });

  
  app.get("/api/accounts", async (req: any, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const rows = await storage.listAccounts(req.user.id);
    res.json(rows);
  });

  app.post("/api/accounts", async (req: any, res: Response) => {
    const devUserId = process.env.NODE_ENV !== "production" ? "dev" : undefined;
    const userId = req.user?.id ?? devUserId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const parse = insertAccountSchema.safeParse({ ...req.body, userId });
    if (!parse.success) return res.status(400).json({ message: "Invalid payload" });
    const created = await storage.createAccount(parse.data);
    res.status(201).json(created);
  });

  app.put("/api/accounts/:id", async (req: any, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const updated = await storage.updateAccount(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  });

  app.delete("/api/accounts/:id", async (req: any, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    await storage.deleteAccount(req.params.id);
    res.json({ ok: true });
  });

  app.get("/api/categories", async (req: any, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const rows = await storage.listCategories(req.user.id);
    res.json(rows);
  });

  app.post("/api/categories", async (req: any, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const parse = insertCategorySchema.safeParse({ ...req.body, userId: req.user.id });
    if (!parse.success) return res.status(400).json({ message: "Invalid payload" });
    const created = await storage.createCategory(parse.data);
    res.status(201).json(created);
  });

  app.put("/api/categories/:id", async (req: any, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const updated = await storage.updateCategory(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  });

  app.delete("/api/categories/:id", async (req: any, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    await storage.deleteCategory(req.params.id);
    res.json({ ok: true });
  });

  app.get("/api/transactions", async (req: any, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const rows = await storage.listTransactions(req.user.id);
    res.json(rows);
  });

  app.post("/api/transactions", async (req: any, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const parse = insertTransactionSchema.safeParse({ ...req.body, userId: req.user.id });
    if (!parse.success) return res.status(400).json({ message: "Invalid payload" });
    const created = await storage.createTransaction(parse.data);
    res.status(201).json(created);
  });

  app.put("/api/transactions/:id", async (req: any, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const updated = await storage.updateTransaction(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  });

  app.delete("/api/transactions/:id", async (req: any, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    await storage.deleteTransaction(req.params.id);
    res.json({ ok: true });
  });
  app.get("/api/logo/:code", async (req: Request, res: Response) => {
    try {
      const code = req.params.code;
      const banks = await storage.listBanks();
      const bank = banks.find((b) => (b.code || "") === code);
      if (!bank || !bank.logoUrl) return res.status(404).end();
      const r = await fetch(bank.logoUrl);
      if (!r.ok) return res.status(502).end();
      const ct = r.headers.get("content-type") || "image/svg+xml";
      res.setHeader("Content-Type", ct);
      res.setHeader("Cache-Control", "public, max-age=86400");
      const buf = Buffer.from(await r.arrayBuffer());
      res.end(buf);
    } catch {
      res.status(500).end();
    }
  });
  return httpServer;
}
