import "dotenv/config";
import fs from "fs";
import postgres from "postgres";
import dotenv from "dotenv";

async function main() {
  dotenv.config({ path: ".env.local" });
  dotenv.config();
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }
  const sqlText = fs.readFileSync("server/supabase_rls.sql", "utf8");
  const client = postgres(url, { ssl: "require" });
  await client.unsafe(sqlText);
  await client.end({ timeout: 5 });
  console.log("Applied server/supabase_rls.sql");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
