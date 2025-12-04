import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import {
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  Clock,
  Repeat,
  Pin,
  Calendar as CalendarIcon
} from "lucide-react";
import { IconByName } from "@/components/ui/icon-by-name";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import * as React from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";

type Transaction = {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense"; // inferred from amount or category type? usually amount > 0 is income, but let's stick to category type or explicit field. The current mock used explicit type. The DB schema has 'kind' (bank/card) but not 'type'. Usually we infer from amount sign or category type. Let's use category type or amount sign.
  date: string;
  category_id: string;
  account_id: string | null;
  credit_card_id: string | null;
  tags: string[];
  is_fixed: boolean;
  is_recurring: boolean;
  recurrence_frequency: string | null;
  recurrence_count: number | null;
  status: "paid" | "pending";
  category?: { name: string; icon: string; color: string; type: string };
  account?: { name: string; bank_id?: string };
};

type Account = { id: string; name: string };
type Category = { id: string; name: string; type: string; icon: string; color: string };
type Bank = { id: string; code: string; name: string; shortName?: string | null; slug?: string | null; color?: string | null; logoUrl?: string | null };

export default function Transactions() {
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [banks, setBanks] = React.useState<Bank[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  // Form states
  const [description, setDescription] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [type, setType] = React.useState<"income" | "expense">("expense");
  const [categoryId, setCategoryId] = React.useState("");
  const [accountId, setAccountId] = React.useState("");
  const [dateBr, setDateBr] = React.useState(new Date().toLocaleDateString("pt-BR"));
  const [tags, setTags] = React.useState("");
  const [status, setStatus] = React.useState<"paid" | "pending">("pending");
  const [isFixed, setIsFixed] = React.useState(false);
  const [isRecurring, setIsRecurring] = React.useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = React.useState("monthly");
  const [recurrenceCount, setRecurrenceCount] = React.useState("");

  // Filter states
  const [search, setSearch] = React.useState("");
  const [filterType, setFilterType] = React.useState<"all" | "income" | "expense">("all");

  const today = new Date();
  const [year, setYear] = React.useState(today.getFullYear());
  const [month, setMonth] = React.useState(today.getMonth() + 1);
  function monthLabel(y: number, m: number) {
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  }
  function formatAmountInput(value: string): string {
    const digits = value.replace(/\D/g, "");
    const num = parseInt(digits || "0", 10);
    const val = num / 100;
    return val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function parseAmountToNumber(v: string): number {
    const s = v.replace(/\./g, "").replace(/,(?=\d{2}$)/, ".");
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  }
  function brToISO(s: string): string {
    const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return new Date().toISOString().slice(0, 10);
    const d = new Date(parseInt(m[3],10), parseInt(m[2],10)-1, parseInt(m[1],10));
    return d.toISOString().slice(0, 10);
  }
  function formatNumberToPlain(n: number): string {
    return Math.abs(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function maskDateBr(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
  }
  function isValidDateBr(s: string): boolean {
    const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return false;
    const d = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10);
    const y = parseInt(m[3], 10);
    const dt = new Date(y, mo - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d;
  }
  function todayBr(): string {
    return new Date().toLocaleDateString("pt-BR");
  }

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

  React.useEffect(() => {
    fetchData();
  }, [year, month]);

  React.useEffect(() => {
    fetch("/api/banks")
      .then((r) => r.json())
      .then((data: Bank[]) => setBanks(data || []))
      .catch(() => setBanks([]));
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const start = new Date(year, month - 1, 1).toISOString().slice(0, 10);
    const end = new Date(year, month, 0).toISOString().slice(0, 10);

    const [accs, cats, txs] = await Promise.all([
      supabase.from("accounts").select("id,name").order("name"),
      supabase.from("categories").select("id,name,type,icon,color").order("name"),
      supabase.from("bank_transactions")
        .select(`
          *,
          category:categories(name,icon,color,type),
          account:accounts(name,bank_id)
        `)
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: false })
    ]);

    if (accs.data) setAccounts(accs.data);
    if (cats.data) setCategories(cats.data);
    if (txs.data) {
      // Normalize data if needed
      const formatted = txs.data.map(t => ({
        ...t,
        type: t.amount >= 0 ? "income" : "expense", // Infer type from amount sign for display
        tags: t.tags || []
      }));
      setTransactions(formatted);
    }
    setLoading(false);
  }

  function resetForm() {
    setEditingId(null);
    setDescription("");
    setAmount(formatAmountInput("0"));
    setType("expense");
    setCategoryId("");
    setAccountId("none");
    setDateBr(new Date().toLocaleDateString("pt-BR"));
    setTags("");
    setStatus("pending");
    setIsFixed(false);
    setIsRecurring(false);
    setRecurrenceFrequency("monthly");
    setRecurrenceCount("");
  }

  function openNew() {
    resetForm();
    setDialogOpen(true);
  }

  function openEdit(tx: Transaction) {
    setEditingId(tx.id);
    setDescription(tx.description || "");
    setAmount(formatNumberToPlain(Math.abs(tx.amount)));
    setType(tx.amount >= 0 ? "income" : "expense");
    setCategoryId(tx.category_id || "");
    setAccountId(tx.account_id ?? "none");
    setDateBr(new Date(tx.date).toLocaleDateString('pt-BR'));
    setTags(tx.tags ? tx.tags.join(", ") : "");
    setStatus(tx.status || "pending");
    setIsFixed(tx.is_fixed || false);
    setIsRecurring(tx.is_recurring || false);
    setRecurrenceFrequency(tx.recurrence_frequency || "monthly");
    setRecurrenceCount(tx.recurrence_count ? tx.recurrence_count.toString() : "");
    setDialogOpen(true);
  }

  async function handleSave() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const val = parseAmountToNumber(amount);
    if (isNaN(val)) return;
 
    const finalAmount = type === "expense" ? -Math.abs(val) : Math.abs(val);
    const tagsArray = tags.split(",").map(t => t.trim()).filter(t => t);
    const accountIdValue = accountId === "none" ? null : (accountId || null);

    const baseCount = isRecurring && recurrenceCount ? parseInt(recurrenceCount) : 1;
    const count = isRecurring && !isNaN(baseCount) && baseCount > 0 ? baseCount : 1;

    function addInterval(baseDateStr: string, freq: string, step: number): string {
      const d = new Date(baseDateStr);
      if (freq === "daily") d.setDate(d.getDate() + step);
      else if (freq === "weekly") d.setDate(d.getDate() + 7 * step);
      else if (freq === "monthly") d.setMonth(d.getMonth() + step);
      else if (freq === "yearly") d.setFullYear(d.getFullYear() + step);
      return d.toISOString().slice(0, 10);
    }

    if (editingId) {
      const payload = {
        user_id: userData.user.id,
        description,
        amount: finalAmount,
        date: brToISO(dateBr),
        category_id: categoryId,
        account_id: accountIdValue,
        tags: tagsArray,
        status,
        is_fixed: isFixed,
        is_recurring: isRecurring,
        recurrence_frequency: isRecurring ? recurrenceFrequency : null,
        recurrence_count: isRecurring ? count : null
      };
      const { error } = await supabase.from("bank_transactions").update(payload).eq("id", editingId);
      if (error) console.error(error);
    } else {
      const rows = Array.from({ length: count }).map((_, i) => {
        const isoDate = brToISO(dateBr);
        const dt = i === 0 ? isoDate : addInterval(isoDate, recurrenceFrequency, i);
        const rowStatus = i === 0 ? status : "pending";
        return {
          user_id: userData.user.id,
          description,
          amount: finalAmount,
          date: dt,
          category_id: categoryId,
          account_id: accountIdValue,
          tags: tagsArray,
          status: rowStatus,
          is_fixed: isFixed,
          is_recurring: isRecurring,
          recurrence_frequency: isRecurring ? recurrenceFrequency : null,
          recurrence_count: isRecurring ? count : null
        };
      });
      const { error } = await supabase.from("bank_transactions").insert(rows);
      if (error) console.error(error);
    }

    setDialogOpen(false);
    fetchData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta transação?")) return;
    await supabase.from("bank_transactions").delete().eq("id", id);
    fetchData();
  }

  const filteredTransactions = transactions.filter(tx => {
    const matchSearch = tx.description?.toLowerCase().includes(search.toLowerCase()) || 
                        tx.category?.name.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || 
                      (filterType === "income" && tx.amount >= 0) || 
                      (filterType === "expense" && tx.amount < 0);
    return matchSearch && matchType;
  });

  return (
    <Layout>
      <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Transações</h1>
          <p className="text-muted-foreground">Gerencie suas entradas e saídas detalhadamente.</p>
          <div className="mt-2 flex items-center gap-2">
            <Button variant="outline" onClick={() => setMonth((m) => (m === 1 ? (setYear((y) => y - 1), 12) : m - 1))}>{"<"}</Button>
            <div className="px-3 py-1 rounded-full border text-sm">{monthLabel(year, month)}</div>
            <Button variant="outline" onClick={() => setMonth((m) => (m === 12 ? (setYear((y) => y + 1), 1) : m + 1))}>{">"}</Button>
          </div>
        </div>
        <Button onClick={openNew} className="bg-primary hover:bg-primary/90 text-white shadow-lg">
          <Plus className="w-4 h-4 mr-2" />
          Nova Transação
        </Button>
      </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Transação" : "Adicionar Transação"}</DialogTitle>
              <DialogDescription>
                Preencha os detalhes abaixo.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Supermercado" />
                </div>
                <div className="space-y-2">
                  <Label>Valor</Label>
                  <Input type="text" value={amount} onChange={e => setAmount(formatAmountInput(e.target.value))} placeholder="0,00" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={type} onValueChange={(v: any) => setType(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Despesa</SelectItem>
                      <SelectItem value="income">Receita</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data</Label>
                  <div className="flex items-center gap-2">
                    <Input type="text" value={dateBr} onChange={e => setDateBr(maskDateBr(e.target.value))} onBlur={() => setDateBr(isValidDateBr(dateBr) ? dateBr : todayBr())} placeholder="dd/mm/aaaa" />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="icon">
                          <CalendarIcon className="w-4 h-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={new Date(brToISO(dateBr))}
                          locale={ptBR}
                          onDayClick={(day) => setDateBr(day.toLocaleDateString('pt-BR'))}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Conta Bancária</Label>
                  <Select value={accountId} onValueChange={setAccountId}>
                    <SelectTrigger><SelectValue placeholder="Selecione (Opcional)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma</SelectItem>
                      {accounts.map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Pago / Recebido</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tags (separadas por vírgula)</Label>
                  <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="Ex: mercado, semanal" />
                </div>
              </div>

              <div className="flex items-center gap-4 border p-3 rounded-md">
                 <div className="flex items-center space-x-2">
                  <Checkbox id="fixed" checked={isFixed} onCheckedChange={(c: boolean) => setIsFixed(c)} />
                  <Label htmlFor="fixed" className="cursor-pointer flex items-center gap-1">
                    <Pin className="w-3 h-3" /> Fixa
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="recurring" checked={isRecurring} onCheckedChange={(c: boolean) => setIsRecurring(c)} />
                  <Label htmlFor="recurring" className="cursor-pointer flex items-center gap-1">
                    <Repeat className="w-3 h-3" /> Recorrente
                  </Label>
                </div>
              </div>

              {isRecurring && (
                <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-md">
                  <div className="space-y-2">
                    <Label>Frequência</Label>
                    <Select value={recurrenceFrequency} onValueChange={setRecurrenceFrequency}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Diária</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="yearly">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Qtd. Repetições</Label>
                    <Input type="number" value={recurrenceCount} onChange={e => setRecurrenceCount(e.target.value)} placeholder="Ex: 12 (vazio = infinito)" />
                  </div>
                </div>
              )}

            </div>
            <DialogFooter>
              <Button onClick={handleSave}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      <Card className="border-none shadow-md">
        <div className="p-6 flex flex-col md:flex-row gap-4 justify-between items-center border-b border-border/50">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Buscar por descrição..." 
              className="pl-10 bg-muted/30 border-transparent focus:bg-white transition-all duration-200" 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
             <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
              <SelectTrigger className="w-[140px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="income">Receitas</SelectItem>
                <SelectItem value="expense">Despesas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <CardContent className="p-0">
          <div className="w-full overflow-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <th className="px-6 py-4">Descrição</th>
                  <th className="px-6 py-4">Categoria</th>
                  <th className="px-6 py-4">Conta</th>
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Valor</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                      Nenhuma transação encontrada.
                    </td>
                  </tr>
                )}
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-muted/20 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center border",
                          tx.amount >= 0
                            ? "bg-emerald-100 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800"
                            : "bg-red-100 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                        )}>
                          <IconByName name={tx.category?.icon || "Circle"} className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">{tx.description || "Sem descrição"}</span>
                          <div className="flex gap-1 mt-1">
                            {tx.is_fixed && <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 gap-1"><Pin className="w-2 h-2" /> Fixa</Badge>}
                            {tx.is_recurring && <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 gap-1"><Repeat className="w-2 h-2" /> Recorrente</Badge>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center border bg-slate-100 dark:bg-slate-800")}>
                            <IconByName name={tx.category?.icon || "Circle"} className="w-4 h-4" />
                          </div>
                          <span className="font-medium text-foreground">
                            {tx.category?.name || "Sem categoria"}
                          </span>
                        </div>
                        {tx.tags && tx.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {tx.tags.map(tag => (
                              <span key={tag} className="px-2 py-1 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      <div className="flex items-center gap-3">
                        {(() => {
                          const nm = (tx.account?.name || "").toLowerCase();
                          const bankById = banks.find((b) => b.id === (tx.account?.bank_id || ""));
                          const bankByName = banks.find((b) => {
                            const bn = (b.shortName || b.name || "").toLowerCase();
                            const sl = (b.slug || "").toLowerCase();
                            return nm && (bn.includes(nm) || nm.includes(bn) || (sl && nm.includes(sl)));
                          });
                          const bank = bankById || bankByName;
                          // Use bankIconClass logic fully if possible, but here we use bankIconByName which is simpler
                          // For "Brasil" account, if bank not found, we fallback to bankIconByName("Brasil") -> "ibb-banco-brasil"
                          const iconClass = (bank ? bankIconByName(bank.shortName || bank.name) : bankIconByName(tx.account?.name));
                          // Fallback color for Banco do Brasil if bank object is missing or has no color
                          const isBB = (iconClass && iconClass.includes("banco-brasil")) || nm.includes("brasil");
                          const bg = bank?.color || (isBB ? "#F8D117" : undefined) || "#999";
                          const finalIconClass = iconClass || (isBB ? "ibb-banco-brasil" : undefined);

                          return finalIconClass ? (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: bg }}>
                              <span className={`${finalIconClass} text-lg text-white`}></span>
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-muted-foreground font-bold text-xs">
                               {(tx.account?.name || "Ct").substring(0, 2)}
                            </div>
                          );
                        })()}
                        <span>{tx.account?.name || "-"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(tx.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {tx.status === 'paid' ? (
                         <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                           <CheckCircle className="w-3 h-3 mr-1" /> Pago
                         </span>
                      ) : (
                         <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                           <Clock className="w-3 h-3 mr-1" /> Pendente
                         </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={cn("font-bold font-mono", tx.amount >= 0 ? "text-emerald-600" : "text-red-600")}>
                        {tx.amount >= 0 ? "+" : ""} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openEdit(tx)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(tx.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      </div>
    </Layout>
  );
}
