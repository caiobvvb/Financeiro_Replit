import type { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";

export async function supabaseAuth(req: any, _res: Response, next: NextFunction) {
  const auth = req.headers["authorization"];
  if (!auth || !auth.startsWith("Bearer ")) return next();
  const token = auth.slice(7);

  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return next();

  const supabase = createClient(url, serviceKey);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return next();
  const name = (data.user.user_metadata as any)?.name || data.user.email;
  req.user = { id: data.user.id, username: name };
  next();
}
