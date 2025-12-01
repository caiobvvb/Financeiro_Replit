export type CreditCardRow = { id: string; user_id: string; name: string; limit_amount: number; due_day: number; close_day: number; brand: string };

export function computeStatement(card: CreditCardRow, dateStr: string) {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();
  const close = card.close_day;
  const due = card.due_day;
  let cycleEnd = new Date(year, month, close);
  if (day > close) {
    cycleEnd = new Date(year, month + 1, close);
  }
  const cycleStart = new Date(cycleEnd);
  cycleStart.setMonth(cycleEnd.getMonth() - 1);
  cycleStart.setDate(close + 1);
  const dueDate = new Date(cycleEnd);
  dueDate.setMonth(dueDate.getMonth() + 1);
  dueDate.setDate(due);
  return {
    statement_year: cycleEnd.getFullYear(),
    statement_month: cycleEnd.getMonth() + 1,
    cycle_start: cycleStart,
    cycle_end: cycleEnd,
    statement_due: dueDate,
  };
}

export function formatBRL(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}
