import { computeStatement } from "../src/lib/billing";

const card = { id:"c", user_id:"u", name:"Card", limit_amount:0, due_day:5, close_day:1, brand:"visa" };

function assert(name: string, cond: boolean) {
  if (!cond) throw new Error("Test failed: " + name);
  console.log("ok:", name);
}

const ref = computeStatement(card, "2025-11-30");
assert("close before due", ref.cycle_end < ref.statement_due);
assert("month advent", ref.statement_month >= 1 && ref.statement_month <= 12);

