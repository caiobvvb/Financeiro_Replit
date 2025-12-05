import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Wallet, Plus, CreditCard, Home, Car, Utensils, TrendingUp, Briefcase, ShoppingCart, Fuel, Phone, Wifi, FileText, Gift, DollarSign, Coins, PiggyBank, Banknote, Bus, School, Heart, Stethoscope, Dumbbell, Pill, PlayCircle, Tv, Bike, Hammer, Wrench, CheckCircle, AlertTriangle, CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectValue } from "@/components/ui/select";
import * as SelectPrimitive from "@radix-ui/react-select";
import * as React from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Switch } from "@/components/ui/switch";
import { Toggle } from "@/components/ui/toggle";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";

type CreditCardRow = { id: string; user_id: string; name: string; limit_amount: number; due_day: number; close_day: number; brand: string };
type Bank = { id: string; code: string; name: string; shortName?: string | null; slug?: string | null; color?: string | null; logoUrl?: string | null };

function bankIconByName(name?: string): string | undefined {
  const n = (name || "").toLowerCase();
  if (!n) return undefined;
  if (n.includes("brasil")) return "ibb-banco-brasil";
  if (n.includes("itaú") || n.includes("itau")) return "ibb-itau";
  if (n.includes("bradesco")) return "ibb-bradesco";
  if (n.includes("santander")) return "ibb-santander";
  if (n.includes("caixa")) return "ibb-caixa";
  if (n.includes("nubank") || n.includes("nu ")) return "ibb-nubank";
  if (n.includes("inter")) return "ibb-inter";
  if (n.includes("btg")) return "ibb-btg";
  if (n.includes("c6")) return "ibb-c6";
  if (n.includes("sicredi")) return "ibb-sicredi";
  if (n.includes("sicoob")) return "ibb-sicoob";
  if (n.includes("original")) return "ibb-original";
  if (n.includes("safra")) return "ibb-safra";
  if (n.includes("banrisul")) return "ibb-banrisul";
  return undefined;
}

function BrandIcon({ brand, className }: { brand: string; className?: string }) {
  const b = (brand || "").toLowerCase();
  if (b === "mastercard") {
    return (
      <svg viewBox="0 0 48 24" className={className}><circle cx="16" cy="12" r="9" fill="#EB001B"/><circle cx="32" cy="12" r="9" fill="#F79E1B" opacity="0.9"/></svg>
    );
  }
  if (b === "visa") {
    return (
      <svg viewBox="0 0 48 24" className={className}><rect width="48" height="24" fill="#0A1F44"/><text x="24" y="16" fontSize="10" fill="#FFFFFF" textAnchor="middle" fontFamily="Arial">VISA</text></svg>
    );
  }
  if (b === "amex") {
    return (
      <svg viewBox="0 0 48 24" className={className}><rect width="48" height="24" fill="#2E77BB"/><text x="24" y="16" fontSize="9" fill="#FFFFFF" textAnchor="middle" fontFamily="Arial">AMEX</text></svg>
    );
  }
  if (b === "elo") {
    return (
      <svg viewBox="0 0 48 24" className={className}><circle cx="12" cy="12" r="5" fill="#000"/><circle cx="24" cy="12" r="5" fill="#FFD400"/><circle cx="36" cy="12" r="5" fill="#E60000"/></svg>
    );
  }
  if (b === "hipercard") {
    return (
      <svg viewBox="0 0 48 24" className={className}><rect width="48" height="24" rx="4" fill="#9D0B0B"/><text x="24" y="16" fontSize="8" fill="#FFFFFF" textAnchor="middle" fontFamily="Arial">HIPERCARD</text></svg>
    );
  }
  return <div className={className}></div>;
}

const iconMap: Record<string, React.ComponentType<any>> = { Home, Car, Utensils, Wallet, TrendingUp, Briefcase, ShoppingCart, CreditCard, Fuel, Phone, Wifi, FileText, Gift, DollarSign, Coins, PiggyBank, Banknote, Bus, School, Heart, Stethoscope, Dumbbell, Pill, PlayCircle, Tv, Bike, Hammer, Wrench };
function IconByName({ name, className, color }: { name?: string | null; className?: string; color?: string | null }) {
  const key = (name || "").trim();
  const Comp = iconMap[key] || Utensils;
  return <Comp className={className} style={{ color: color || undefined }} />;
}

const BRANDS = [
  { value: "visa", label: "Visa" },
  { value: "mastercard", label: "MasterCard" },
  { value: "amex", label: "American Express" },
  { value: "elo", label: "Elo" },
  { value: "hipercard", label: "Hipercard" },
];

function NumberCombobox({ id, value, onChange, placeholder }: { id: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const options = React.useMemo(() => Array.from({ length: 31 }, (_, i) => String(i + 1)), []);
  const filtered = React.useMemo(() => options.filter((o) => (value ? o.startsWith(value) : true)), [options, value]);
  function select(v: string) {
    onChange(v);
    setOpen(false);
    setActive(0);
  }
  return (
    <div className="relative">
      <Input
        id={id}
        value={value}
        inputMode="numeric"
        placeholder={placeholder || "Dia (1..31)"}
        onFocus={() => setOpen(true)}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 2))}
        onKeyDown={(e) => {
          if (!open) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, Math.max(filtered.length - 1, 0)));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            const v = filtered[active] || value;
            if (v) select(v);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open ? (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-white text-foreground shadow-lg max-h-40 overflow-auto p-1">
          {filtered.map((o, i) => (
            <div
              key={o}
              className={`px-2 py-1 cursor-pointer rounded ${i === active ? "bg-muted" : "hover:bg-muted"}`}
              onMouseDown={(e) => {
                e.preventDefault();
                select(o);
              }}
            >
              {o}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function BrandCombobox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const filtered = React.useMemo(() => BRANDS.filter((b) => (query ? b.label.toLowerCase().includes(query.toLowerCase()) : true)), [query]);
  function select(v: string) {
    onChange(v);
    setOpen(false);
    setQuery("");
    setActive(0);
  }
  const current = BRANDS.find((b) => b.value === value);
  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="px-2 py-1 bg-white text-foreground rounded border border-border flex items-center">
          <BrandIcon brand={value} className="w-10 h-5" />
        </div>
        <Input
          value={current ? current.label : ""}
          placeholder="Buscar bandeira"
          onFocus={() => setOpen(true)}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (!open) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, Math.max(filtered.length - 1, 0)));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              const item = filtered[active] || filtered[0];
              if (item) select(item.value);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
        />
      </div>
      {open ? (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-white text-foreground shadow-lg max-h-48 overflow-auto p-1">
          {filtered.map((b, i) => (
            <div
              key={b.value}
              className={`px-2 py-1 cursor-pointer rounded flex items-center gap-2 ${i === active ? "bg-muted" : "hover:bg-muted"}`}
              onMouseDown={(e) => {
                e.preventDefault();
                select(b.value);
              }}
            >
              <BrandIcon brand={b.value} className="w-8 h-4" />
              <span>{b.label}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function Accounts() {
  const [, setLoc] = useLocation();
  const today = new Date();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [limitStr, setLimitStr] = React.useState("");
  const [dueDay, setDueDay] = React.useState<string>("");
  const [closeDay, setCloseDay] = React.useState<string>("");
  const [brand, setBrand] = React.useState<string>(BRANDS[0].value);
  const [cards, setCards] = React.useState<CreditCardRow[]>([]);
  const [expenseOpen, setExpenseOpen] = React.useState(false);
  const [expenseCardId, setExpenseCardId] = React.useState<string>("");
  const [expenseAmountStr, setExpenseAmountStr] = React.useState("");
  const [expenseDate, setExpenseDate] = React.useState<string>("");
  const [expenseDesc, setExpenseDesc] = React.useState("");
  const [expenseCategoryId, setExpenseCategoryId] = React.useState<string>("");
  const [expenseTags, setExpenseTags] = React.useState<string[]>([]);
  const [expenseNote, setExpenseNote] = React.useState("");
  const [expenseRecurring, setExpenseRecurring] = React.useState(false);
  const [expenseInstallments, setExpenseInstallments] = React.useState<number>(1);
  const [expenseInstallmentEnabled, setExpenseInstallmentEnabled] = React.useState(false);
  const [savingExpense, setSavingExpense] = React.useState(false);
  const [categories, setCategories] = React.useState<any[]>([]);
  const [tags, setTags] = React.useState<any[]>([]);
  const [addingTag, setAddingTag] = React.useState(false);
  const [newTagName, setNewTagName] = React.useState("");
  const [addingTagError, setAddingTagError] = React.useState<string>("");
  const [addingTagLoading, setAddingTagLoading] = React.useState(false);
  const [year, setYear] = React.useState(today.getFullYear());
  const [month, setMonth] = React.useState(today.getMonth() + 1);
  const [creditUsedTotal, setCreditUsedTotal] = React.useState(0);
  
  const [loadingSummary, setLoadingSummary] = React.useState(false);
  const [pendingAllTotal, setPendingAllTotal] = React.useState(0);
  const [pendingAllByCard, setPendingAllByCard] = React.useState<Record<string, number>>({});
  const [monthBalanceByCard, setMonthBalanceByCard] = React.useState<Record<string, number>>({});
  const [statementStatusByCard, setStatementStatusByCard] = React.useState<Record<string, string>>({});
  const [statementDatesByCard, setStatementDatesByCard] = React.useState<Record<string, { close_date: string; due_date: string }>>({});

  React.useEffect(() => {
    setLimitStr(new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(0));
  }, []);

  React.useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("add") === "1") {
      const cid = sp.get("card") || "";
      const date = sp.get("date") || new Date().toISOString().slice(0,10);
      if (cid) {
        setExpenseCardId(cid);
        setExpenseDate(date);
        setExpenseOpen(true);
        history.replaceState(null, "", window.location.pathname);
      }
    }
  }, []);

  React.useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setCards([]);
        return;
      }
      const { data, error } = await supabase.from("credit_cards").select("id,user_id,name,limit_amount,due_day,close_day,brand").order("name", { ascending: true });
      if (error || !data) {
        setCards([]);
        return;
      }
      setCards(data as any);
      const { data: cats } = await supabase.from("categories").select("id,name,type,icon,color").eq("type", "expense");
      setCategories(cats || []);
      const { data: t } = await supabase.from("tags").select("id,name").order("name");
      setTags(t || []);
    })();
  }, []);

  React.useEffect(() => {
    (async () => {
      setLoadingSummary(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { setCreditUsedTotal(0); setPendingAllByCard({}); setPendingAllTotal(0); setLoadingSummary(false); return; }
      const { data: txs } = await supabase
        .from("transactions")
        .select("id,amount,credit_card_id,ignored,statement_year,statement_month")
        .eq("statement_year", year)
        .eq("statement_month", month)
        .or("ignored.is.false,ignored.is.null");
      const used = (txs || []).reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);
      setCreditUsedTotal(Math.max(0, used));
      // saldo da fatura do mês por cartão
      const { data: stmtsMonth } = await supabase
        .from("statements")
        .select("credit_card_id,total_amount,paid_amount,year,month,status,close_date,due_date")
        .eq("year", year)
        .eq("month", month);
      const mb: Record<string, number> = {};
      const sb: Record<string, string> = {};
      const sd: Record<string, { close_date: string; due_date: string }> = {};
      (stmtsMonth || []).forEach((s: any) => {
        const pending = Math.max(0, Number(s.total_amount || 0) - Number(s.paid_amount || 0));
        mb[s.credit_card_id] = pending;
        sb[s.credit_card_id] = s.status;
        sd[s.credit_card_id] = { close_date: s.close_date, due_date: s.due_date };
      });
      const stmtCardSet = new Set((stmtsMonth || []).map((s: any) => s.credit_card_id));
      const { data: txsMonthAll } = await supabase
        .from("transactions")
        .select("credit_card_id,amount,ignored,statement_year,statement_month")
        .eq("statement_year", year)
        .eq("statement_month", month)
        .or("ignored.is.false,ignored.is.null");
      (txsMonthAll || []).forEach((t: any) => {
        const cid = t.credit_card_id;
        if (!cid) return;
        if (!stmtCardSet.has(cid)) {
          mb[cid] = (mb[cid] || 0) + Number(t.amount || 0);
        }
      });
      cards.forEach((cc) => {
        if (!stmtCardSet.has(cc.id) && mb[cc.id] !== undefined) {
          const close = new Date(year, month - 1, Number(cc.close_day || 1));
          const due = new Date(year, month, Number(cc.due_day || 1));
          sd[cc.id] = { close_date: close.toISOString().slice(0,10), due_date: due.toISOString().slice(0,10) };
        }
      });
      setMonthBalanceByCard(mb);
      setStatementStatusByCard(sb);
      setStatementDatesByCard(sd);

      const cardIds = cards.map((c) => c.id);
      const byCardAll: Record<string, number> = {};
      let totalPendingAll = 0;
      const byCardFromStatements: Record<string, number> = {};
      let pendingFromStatements = 0;
      let keySet = new Set<string>();
      if (cardIds.length) {
        const { data: stmtsByCards } = await supabase
          .from("statements")
          .select("credit_card_id,year,month,status,total_amount,paid_amount")
          .in("credit_card_id", cardIds)
          .neq("status", "paid");
        const { data: stmtsByUser } = await supabase
          .from("statements")
          .select("credit_card_id,year,month,status,total_amount,paid_amount,user_id")
          .eq("user_id", userData.user.id)
          .neq("status", "paid");
        const merged = [...(stmtsByCards || []), ...(stmtsByUser || [])];
        const dedupMap = new Map<string, any>();
        merged.forEach((s: any) => {
          const k = `${s.credit_card_id}:${s.year}:${s.month}`;
          if (!dedupMap.has(k)) dedupMap.set(k, s);
        });
        const stmtsAll = Array.from(dedupMap.values());
        keySet = new Set(stmtsAll.map((s: any) => `${s.credit_card_id}:${s.year}:${s.month}`));
        stmtsAll.forEach((s: any) => {
          const pending = Math.max(0, Number(s.total_amount || 0) - Number(s.paid_amount || 0));
          byCardFromStatements[s.credit_card_id] = (byCardFromStatements[s.credit_card_id] || 0) + pending;
          pendingFromStatements += pending;
        });
        const { data: paidByCards } = await supabase
          .from("statements")
          .select("credit_card_id,year,month,status")
          .in("credit_card_id", cardIds)
          .eq("status", "paid");
        const { data: paidByUser } = await supabase
          .from("statements")
          .select("credit_card_id,year,month,status,user_id")
          .eq("user_id", userData.user.id)
          .eq("status", "paid");
        const paidMerged = [...(paidByCards || []), ...(paidByUser || [])];
        const paidSet = new Set(paidMerged.map((s: any) => `${s.credit_card_id}:${s.year}:${s.month}`));

        const { data: txAll } = await supabase
          .from("transactions")
          .select("credit_card_id,statement_year,statement_month,amount,ignored")
          .in("credit_card_id", cardIds)
          .or("ignored.is.false,ignored.is.null");
        let pendingFromTx = 0;
        (txAll || []).forEach((t: any) => {
          const hasPeriod = t.statement_year != null && t.statement_month != null;
          const k = hasPeriod ? `${t.credit_card_id}:${t.statement_year}:${t.statement_month}` : "";
          if (!hasPeriod || !paidSet.has(k)) {
            const val = Number(t.amount || 0);
            byCardAll[t.credit_card_id] = (byCardAll[t.credit_card_id] || 0) + val;
            pendingFromTx += val;
          }
        });
        if (pendingFromTx > 0) {
          totalPendingAll = pendingFromTx;
        } else {
          totalPendingAll = pendingFromStatements;
          Object.assign(byCardAll, byCardFromStatements);
        }
      } else {
        const { data: stmtsByUserOnly } = await supabase
          .from("statements")
          .select("credit_card_id,year,month,status,total_amount,paid_amount,user_id")
          .eq("user_id", userData.user.id)
          .neq("status", "paid");
        (stmtsByUserOnly || []).forEach((s: any) => {
          const pending = Math.max(0, Number(s.total_amount || 0) - Number(s.paid_amount || 0));
          byCardFromStatements[s.credit_card_id] = (byCardFromStatements[s.credit_card_id] || 0) + pending;
          pendingFromStatements += pending;
        });
        totalPendingAll = pendingFromStatements;
        Object.assign(byCardAll, byCardFromStatements);
      }
      setPendingAllByCard(byCardAll);
      setPendingAllTotal(totalPendingAll);
      setLoadingSummary(false);
    })();
  }, [year, month, cards]);

  React.useEffect(() => {
    let chan: any;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      chan = supabase
        .channel("accounts-summary")
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => { /* refresh */ setMonth((m)=>m); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'statements' }, () => { /* refresh */ setMonth((m)=>m); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'credit_cards' }, () => { /* refresh */ setMonth((m)=>m); })
        .subscribe();
    })();
    return () => { if (chan) supabase.removeChannel(chan); };
  }, []);

  function monthLabel(y: number, m: number) {
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  }

  function formatMoneyInput(value: string): string {
    const digits = value.replace(/\D/g, "");
    const num = parseInt(digits || "0", 10);
    const val = num / 100;
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  }

  function parseMoney(value: string): number {
    const s = value.replace(/[^0-9,\.]/g, "").replace(/\./g, "").replace(/,(?=\d{2}$)/, ".");
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  }

  async function saveCard() {
    const nm = name.trim();
    const dd = Math.min(31, Math.max(1, Number(dueDay || 0)));
    const cd = Math.min(31, Math.max(1, Number(closeDay || 0)));
    if (!nm || !dd || !cd || !brand) return;
    const lim = parseMoney(limitStr);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const { data, error } = await supabase
      .from("credit_cards")
      .insert({ user_id: userData.user.id, name: nm, limit_amount: lim, due_day: dd, close_day: cd, brand })
      .select();
    if (error || !data) return;
    setCards((prev) => [...prev, data[0] as any]);
    setName("");
    setLimitStr(new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(0));
    setDueDay("");
    setCloseDay("");
    setBrand(BRANDS[0].value);
    setCreateOpen(false);
  }

  function computeStatement(card: CreditCardRow, dateStr: string) {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = d.getMonth(); // 0-11
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
    dueDate.setMonth(cycleEnd.getMonth() + 1);
    dueDate.setDate(due);
    return {
      statement_year: cycleEnd.getFullYear(),
      statement_month: cycleEnd.getMonth() + 1,
      cycle_start: cycleStart,
      cycle_end: cycleEnd,
      statement_due: dueDate,
    };
  }

  async function saveExpense() {
    if (savingExpense) return;
    setSavingExpense(true);
    try {
      const amount = parseMoney(expenseAmountStr);
      if (!amount || !expenseDate || !expenseCardId || !expenseCategoryId) { setSavingExpense(false); return; }
      const card = cards.find((c) => c.id === expenseCardId);
      if (!card) { setSavingExpense(false); return; }
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { setSavingExpense(false); return; }
      const base = computeStatement(card, expenseDate);
      const count = expenseInstallmentEnabled ? Math.max(2, expenseInstallments) : 1;
      const per = Math.floor((amount * 100) / count) / 100;
      const remainder = Number((amount - per * (count - 1)).toFixed(2));
      const inserts: any[] = [];
      for (let i = 1; i <= count; i++) {
        const cycleShift = i - 1;
        const cycleEnd = new Date(base.cycle_end);
        cycleEnd.setMonth(cycleEnd.getMonth() + cycleShift);
        const cycleStart = new Date(base.cycle_start);
        cycleStart.setMonth(cycleStart.getMonth() + cycleShift);
        const dueDate = new Date(base.statement_due);
        dueDate.setMonth(dueDate.getMonth() + cycleShift);
        const row = {
          user_id: userData.user.id,
          account_id: "", // opcional se quiser vincular a uma conta corrente
          category_id: expenseCategoryId,
          amount: i === count ? remainder : per,
          date: expenseDate,
          description: expenseDesc || null,
          credit_card_id: card.id,
          note: expenseNote || null,
          is_recurring: expenseRecurring,
          installment_count: count,
          installment_number: i,
          statement_year: cycleEnd.getFullYear(),
          statement_month: cycleEnd.getMonth() + 1,
          cycle_start: cycleStart.toISOString().slice(0,10),
          cycle_end: cycleEnd.toISOString().slice(0,10),
          statement_due: dueDate.toISOString().slice(0,10),
        };
        inserts.push(row);
      }
      const { data, error } = await supabase.from("transactions").insert(inserts).select("id");
      if (!error && data && data.length) {
        if (expenseTags.length) {
          const tagRows = data.flatMap((tx: any) => expenseTags.map((tagId) => ({ transaction_id: tx.id, tag_id: tagId })));
          await supabase.from("transaction_tags").insert(tagRows);
        }
        setExpenseOpen(false);
        setExpenseAmountStr(new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(0));
        setExpenseDate("");
        setExpenseDesc("");
        setExpenseCategoryId("");
        setExpenseTags([]);
        setExpenseNote("");
        setExpenseRecurring(false);
        setExpenseInstallmentEnabled(false);
        setExpenseInstallments(2);
      }
    } finally {
      setSavingExpense(false);
    }
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Meus Cartões</h1>
          <p className="text-muted-foreground">Gerencie seus cartões de crédito.</p>
        </div>
        
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Cartão
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Adicionar Cartão de Crédito</DialogTitle>
              <DialogDescription>Cadastre um novo cartão de crédito.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nome
                </Label>
                <Input id="name" placeholder="Ex: Nubank Platinum" className="col-span-3" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="limit" className="text-right">Limite</Label>
                <Input id="limit" placeholder="R$ 0,00" className="col-span-3" value={limitStr} onChange={(e) => setLimitStr(formatMoneyInput(e.target.value))} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="due_date" className="text-right">Dia do vencimento</Label>
                <div className="col-span-3"><NumberCombobox id="due_date" value={dueDay} onChange={setDueDay} /></div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="best_day" className="text-right">Dia do fechamento</Label>
                <div className="col-span-3"><NumberCombobox id="best_day" value={closeDay} onChange={setCloseDay} /></div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Bandeira</Label>
                <div className="col-span-3"><BrandCombobox value={brand} onChange={setBrand} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={saveCard}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setMonth((m) => (m === 1 ? (setYear((y)=>y-1), 12) : m-1))}>{"<"}</Button>
          <div className="px-3 py-1 rounded-full border text-sm">{monthLabel(year, month)}</div>
          <Button variant="outline" onClick={() => setMonth((m) => (m === 12 ? (setYear((y)=>y+1), 1) : m+1))}>{">"}</Button>
        </div>
        <Button variant="outline" onClick={() => setMonth((m)=>m)}>Atualizar</Button>
      </div>

      <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300 mb-8">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Crédito total disponível</p>
                <h2 className="text-3xl font-bold text-emerald-600">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cards.reduce((acc, cc) => acc + Number(cc.limit_amount || 0), 0))}</h2>
                <div className="mt-1 text-xs text-muted-foreground">Em aberto (não liquidado): <span className="font-semibold text-amber-600">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(pendingAllTotal)}</span></div>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600">
                <CreditCard className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Crédito utilizado</p>
                <h2 className={cn("text-3xl font-bold", pendingAllTotal > 0 ? "text-red-600" : "text-muted-foreground")}>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(pendingAllTotal)}</h2>
                <div className="mt-1 text-xs text-muted-foreground">No mês: <span className="font-semibold text-red-600">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(creditUsedTotal)}</span></div>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-red-600">
                <CreditCard className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Saldo calculado</p>
                <h2 className="text-3xl font-bold text-primary">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Math.max(0, cards.reduce((acc, cc) => acc + Number(cc.limit_amount || 0), 0) - pendingAllTotal))}</h2>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-primary">
                <Wallet className="w-6 h-6" />
              </div>
            </div>
          </div>
          
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
            <h3 className="text-xl font-bold mb-4">Cartões de Crédito</h3>
            <div className="space-y-4">
              {cards.map((cc) => (
                <Card key={cc.id} className="border-none shadow-sm hover:shadow-md transition-all duration-200 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h4 className="font-bold text-foreground flex items-center gap-2">
                          <span>{cc.name}</span>
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-xs cursor-default",
                                statementStatusByCard[cc.id]
                                  ? statementStatusByCard[cc.id] === "paid"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : statementStatusByCard[cc.id] === "closed"
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-blue-100 text-blue-700"
                                  : "bg-muted text-muted-foreground"
                              )}>
                                {statementStatusByCard[cc.id]
                                  ? statementStatusByCard[cc.id] === "paid"
                                    ? "Paga"
                                    : statementStatusByCard[cc.id] === "closed"
                                      ? "Fechada"
                                      : "Aberta"
                                  : "Sem fatura"}
                              </span>
                            </HoverCardTrigger>
                            <HoverCardContent side="top" align="center">
                              <div className="space-y-2">
                                <div className="text-sm font-medium">{monthLabel(year, month)}</div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <CalendarDays className="w-4 h-4" />
                                  <span>Fechamento: {statementDatesByCard[cc.id]?.close_date ? new Date(statementDatesByCard[cc.id]!.close_date).toLocaleDateString("pt-BR") : "-"}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <CalendarDays className="w-4 h-4" />
                                  <span>Vencimento: {statementDatesByCard[cc.id]?.due_date ? new Date(statementDatesByCard[cc.id]!.due_date).toLocaleDateString("pt-BR") : "-"}</span>
                                </div>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        </h4>
                        <div className="w-8 h-5 rounded mt-2 opacity-50 flex items-center justify-center">
                          <BrandIcon brand={cc.brand} className="w-8 h-4" />
                        </div>
                      </div>
                      {(() => {
                        const iconClass = bankIconByName(cc.name);
                        const isBB = (iconClass && iconClass.includes("banco-brasil")) || cc.name.toLowerCase().includes("brasil");
                        const bg = isBB ? "#F8D117" : "#999";
                        
                        if (iconClass) {
                           return (
                             <div
                                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-md"
                                style={{ backgroundColor: bg }}
                             >
                               <span className={`${iconClass} text-2xl text-white`}></span>
                             </div>
                           );
                        }
                        return (
                           <div className="w-12 h-12 rounded-full bg-white border border-border flex items-center justify-center shadow-md">
                             <BrandIcon brand={cc.brand} className="w-8 h-5" />
                           </div>
                        );
                      })()}
                    </div>
                    <div className="grid grid-cols-[1fr_auto] items-start gap-6 mb-2">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Limite</p>
                        <p className="text-2xl font-bold text-foreground">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(cc.limit_amount || 0))}</p>
                        <p className="text-xs text-muted-foreground">Disponível: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Math.max(0, Number(cc.limit_amount || 0) - Number(monthBalanceByCard[cc.id] || 0)))}</p>
                        <p className="text-xs text-muted-foreground mt-1">Fechamento: {cc.close_day}/mês - {statementDatesByCard[cc.id]?.close_date ? new Date(statementDatesByCard[cc.id]!.close_date).toLocaleDateString("pt-BR") : "-"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground mb-1">Saldo da fatura ({monthLabel(year, month)})</p>
                        <div className="flex items-center justify-end gap-2">
                          {(monthBalanceByCard[cc.id] || 0) === 0 ? (
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                          )}
                          <p className={cn("text-xl font-semibold", (monthBalanceByCard[cc.id] || 0) === 0 ? "text-emerald-600" : "text-red-600")}>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(monthBalanceByCard[cc.id] || 0)}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Vencimento: {cc.due_day}/mês - {statementDatesByCard[cc.id]?.due_date ? new Date(statementDatesByCard[cc.id]!.due_date).toLocaleDateString("pt-BR") : "-"}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex justify-end">
                      <Button
                        variant="ghost"
                        className="text-primary"
                        onClick={() => {
                          setExpenseOpen(true);
                          setExpenseCardId(cc.id);
                          setExpenseDate(new Date().toISOString().slice(0, 10));
                        }}
                      >
                        Adicionar despesa
                      </Button>
                      <Button
                        variant="ghost"
                        className="text-primary ml-2"
                        onClick={() => setLoc(`/faturas/${cc.id}`)}
                      >
                        Ver fatura
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {cards.length === 0 ? <div className="text-sm text-muted-foreground">Nenhum cartão cadastrado</div> : null}
            </div>
          </div>
      </div>
      <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Nova despesa cartão de crédito</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Valor</Label>
              <Input className="col-span-3" value={expenseAmountStr} onChange={(e) => setExpenseAmountStr(formatMoneyInput(e.target.value))} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Data</Label>
              <Input type="date" className="col-span-3" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Descrição</Label>
              <Input className="col-span-3" value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Categoria</Label>
              <div className="col-span-3">
                <Select value={expenseCategoryId} onValueChange={(v) => setExpenseCategoryId(v === "__none__" ? "" : v)}>
                  <SelectTrigger>
                    <div className="flex items-center gap-2 w-full">
                      {(() => {
                        const cat = categories.find((c: any) => c.id === expenseCategoryId);
                        if (!cat) return null;
                        return (
                          <div className="flex items-center gap-1">
                            <IconByName name={cat.icon} className="w-4 h-4" color={cat.color || undefined} />
                            {cat.color ? <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} /> : null}
                          </div>
                        );
                      })()}
                      <SelectValue placeholder="Selecione" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectPrimitive.Item value="__none__" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground">
                      <SelectPrimitive.ItemText>Limpar seleção</SelectPrimitive.ItemText>
                      <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center"><SelectPrimitive.ItemIndicator /></span>
                    </SelectPrimitive.Item>
                    {categories.map((c: any) => (
                      <SelectPrimitive.Item key={c.id} value={c.id} className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground">
                        <div className="flex items-center gap-2">
                          <IconByName name={c.icon} className="w-4 h-4" color={c.color || undefined} />
                          {c.color ? <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} /> : null}
                          <SelectPrimitive.ItemText>{c.name}</SelectPrimitive.ItemText>
                        </div>
                        <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center"><SelectPrimitive.ItemIndicator /></span>
                      </SelectPrimitive.Item>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Cartão</Label>
              <div className="col-span-3">
                <Select value={expenseCardId} onValueChange={setExpenseCardId}>
                  <SelectTrigger>
                    <div className="flex items-center gap-2 w-full">
                      {(() => {
                        const card = cards.find((c) => c.id === expenseCardId);
                        if (!card) return null;
                        return <BrandIcon brand={card.brand} className="w-6 h-3" />;
                      })()}
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {cards.map((c) => (
                      <SelectPrimitive.Item key={c.id} value={c.id} className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground">
                        <div className="flex items-center gap-2">
                          <BrandIcon brand={c.brand} className="w-8 h-4" />
                          <SelectPrimitive.ItemText>{c.name}</SelectPrimitive.ItemText>
                        </div>
                        <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center"><SelectPrimitive.ItemIndicator /></span>
                      </SelectPrimitive.Item>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {(() => {
              const card = cards.find((c) => c.id === expenseCardId);
              if (card && expenseDate) {
                const s = computeStatement(card, expenseDate);
                const due = new Date(s.statement_due);
                const label = `${String(due.getDate()).padStart(2,'0')}/${String(due.getMonth()+1).padStart(2,'0')}/${due.getFullYear()}`;
                return (<div className="text-xs text-muted-foreground">Entrará na fatura com vencimento em {label}</div>);
              }
              return null;
            })()}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Tags</Label>
              <div className="col-span-3 flex flex-wrap items-center gap-2">
                {tags.map((t) => (
                  <Toggle
                    key={t.id}
                    pressed={expenseTags.includes(t.id)}
                    onPressedChange={(on) =>
                      setExpenseTags((prev) =>
                        on ? [...prev, t.id] : prev.filter((x) => x !== t.id)
                      )
                    }
                    className="h-7 px-2 text-xs rounded border border-slate-200 bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 data-[state=on]:bg-emerald-500 data-[state=on]:text-white data-[state=on]:border-emerald-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                  >
                    {t.name}
                  </Toggle>
                ))}
                {!addingTag ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => setAddingTag(true)}
                  >
                    + Nova
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      className="h-7 w-40"
                      placeholder="Nome da tag"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                    />
                    <Button
                      type="button"
                      className="h-7 text-xs"
                      onClick={async () => {
                        const nm = newTagName.trim();
                        setAddingTagError("");
                        if (!nm) { setAddingTagError("Informe um nome"); return; }
                        const exists = tags.some((t) => (t.name || "").trim().toLowerCase() === nm.toLowerCase());
                        if (exists) { setAddingTagError("Tag já existe"); return; }
                        const { data: userData } = await supabase.auth.getUser();
                        if (!userData.user) { setAddingTagError("Sessão expirada"); return; }
                        setAddingTagLoading(true);
                        const { data, error } = await supabase
                          .from("tags")
                          .insert({ user_id: userData.user.id, name: nm })
                          .select();
                        setAddingTagLoading(false);
                        if (error) { setAddingTagError("Não foi possível adicionar"); return; }
                        if (data && data[0]) {
                          setTags((prev) => [...prev, data[0]]);
                          setExpenseTags((prev) => [...prev, data[0].id]);
                          setNewTagName("");
                          setAddingTag(false);
                        }
                      }}
                      disabled={addingTagLoading}
                    >
                      {addingTagLoading ? "Adicionando..." : "Adicionar"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => {
                        setNewTagName("");
                        setAddingTag(false);
                        setAddingTagError("");
                      }}
                    >
                      Cancelar
                    </Button>
                    {addingTagError ? (
                      <span className="text-xs text-red-600">{addingTagError}</span>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Observação</Label>
              <textarea className="col-span-3 h-16 rounded-md border px-2 py-1" value={expenseNote} onChange={(e) => setExpenseNote(e.target.value)} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Despesa fixa</Label>
              <div className="col-span-3 flex items-center gap-3">
                <Switch checked={expenseRecurring} onCheckedChange={setExpenseRecurring} />
                <span className="text-sm">Marcar como recorrente</span>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Parcelado</Label>
              <div className="col-span-3 flex items-center gap-3">
                <Switch checked={expenseInstallmentEnabled} onCheckedChange={setExpenseInstallmentEnabled} />
                <span className="text-sm">Habilitar</span>
                {expenseInstallmentEnabled ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Parcelas</span>
                    <Input
                      type="number"
                      className="w-20"
                      value={Number(expenseInstallments)}
                      min={2}
                      step={1}
                      onChange={(e) =>
                        setExpenseInstallments(Math.max(2, Number(e.target.value || 2)))
                      }
                    />
                    <span className="text-xs text-muted-foreground">vezes</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={saveExpense} disabled={savingExpense}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
