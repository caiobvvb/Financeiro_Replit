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
import { Wallet, Plus, CreditCard, Home, Car, Utensils, TrendingUp, Briefcase, ShoppingCart, Fuel, Phone, Wifi, FileText, Gift, DollarSign, Coins, PiggyBank, Banknote, Bus, School, Heart, Stethoscope, Dumbbell, Pill, PlayCircle, Tv, Bike, Hammer, Wrench } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectValue } from "@/components/ui/select";
import * as SelectPrimitive from "@radix-ui/react-select";
import * as React from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Switch } from "@/components/ui/switch";
import { Toggle } from "@/components/ui/toggle";
import { useEffect } from "react";

type CreditCardRow = { id: string; user_id: string; name: string; limit_amount: number; due_day: number; close_day: number; brand: string };

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Saldo Total</p>
                    <h2 className="text-3xl font-bold text-primary">R$ 7.850,00</h2>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-primary">
                    <Wallet className="w-6 h-6" />
                </div>
            </CardContent>
        </Card>
        <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Crédito Utilizado</p>
                    <h2 className="text-3xl font-bold text-red-600">R$ 2.340,00</h2>
                </div>
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-red-600">
                    <CreditCard className="w-6 h-6" />
                </div>
            </CardContent>
        </Card>
        <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Limite total de crédito</p>
                    <h2 className="text-3xl font-bold text-emerald-600">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cards.reduce((acc, cc) => acc + Number(cc.limit_amount || 0), 0))}</h2>
                </div>
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600">
                    <CreditCard className="w-6 h-6" />
                </div>
            </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
            <h3 className="text-xl font-bold mb-4">Cartões de Crédito</h3>
            <div className="space-y-4">
              {cards.map((cc) => (
                <Card key={cc.id} className="border-none shadow-sm hover:shadow-md transition-all duration-200 bg-slate-100 dark:bg-slate-900/50">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h4 className="font-bold text-foreground">{cc.name}</h4>
                        <div className="w-8 h-5 rounded mt-2 opacity-50 flex items-center justify-center">
                          <BrandIcon brand={cc.brand} className="w-8 h-4" />
                        </div>
                      </div>
                      <div className="px-2 py-1 bg-white text-foreground rounded border border-border flex items-center">
                        <BrandIcon brand={cc.brand} className="w-10 h-5" />
                      </div>
                    </div>
                    <div className="mb-2">
                      <p className="text-xs text-muted-foreground mb-1">Limite</p>
                      <p className="text-2xl font-bold text-foreground">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(cc.limit_amount || 0))}</p>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Vencimento: {cc.due_day}/mês</span>
                      <span>Fechamento: {cc.close_day}/mês</span>
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
