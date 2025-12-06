import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Filter,
  Plus,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import * as React from "react";
import { supabase } from "@/lib/supabase";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { TransactionList } from "@/components/transactions/TransactionList";
import { TransferWarningDialog } from "@/components/transactions/TransferWarningDialog";
import { TransferConversionDialog } from "@/components/transactions/TransferConversionDialog";

type Transaction = {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
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
  fitid?: string | null;
  import_id?: string | null;
  category?: { name: string; icon: string; color: string; type: string };
  account?: { name: string; bank_id?: string };
};

type Account = { id: string; name: string; bank_id?: string };
type Category = { id: string; name: string; type: string; icon: string; color: string };
type Bank = { id: string; code: string; name: string; shortName?: string | null; slug?: string | null; color?: string | null; logoUrl?: string | null };

export default function Transactions() {
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [banks, setBanks] = React.useState<Bank[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingTransaction, setEditingTransaction] = React.useState<Transaction | null>(null);

  // Transfer Conversion States
  const [transferWarningOpen, setTransferWarningOpen] = React.useState(false);
  const [transferConversionOpen, setTransferConversionOpen] = React.useState(false);
  const [transactionToConvert, setTransactionToConvert] = React.useState<Transaction | null>(null);

  // Filter states
  const [search, setSearch] = React.useState("");
  const [filterType, setFilterType] = React.useState<"all" | "income" | "expense">("all");
  const [selectedAccountId, setSelectedAccountId] = React.useState<string | null>(null);
  const [filterImported, setFilterImported] = React.useState<"all" | "only" | "hide">("all");
  const [filterCategory, setFilterCategory] = React.useState<"all" | "categorized" | "uncategorized">("all");

  const today = new Date();
  const [year, setYear] = React.useState(today.getFullYear());
  const [month, setMonth] = React.useState(today.getMonth() + 1);

  function monthLabel(y: number, m: number) {
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
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
      supabase.from("accounts").select("id,name,bank_id").order("name"),
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
      const formatted = txs.data.map(t => ({
        ...t,
        type: t.amount >= 0 ? "income" : "expense",
        tags: t.tags || []
      }));
      setTransactions(formatted);
    }
    setLoading(false);
  }

  function openNew() {
    setEditingTransaction(null);
    setDialogOpen(true);
  }

  function openEdit(tx: Transaction) {
    setEditingTransaction(tx);
    setDialogOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta transação?")) return;
    await supabase.from("bank_transactions").delete().eq("id", id);
    fetchData();
  }

  function handleConvertToTransfer(tx: Transaction) {
    setTransactionToConvert(tx);
    setTransferWarningOpen(true);
  }

  function confirmConversion() {
    setTransferWarningOpen(false);
    setTransferConversionOpen(true);
  }

  function onConversionSuccess() {
    fetchData();
    // Optional: Show success toast
  }

  const baseFiltered = transactions.filter(tx => {
    const matchSearch = tx.description?.toLowerCase().includes(search.toLowerCase()) ||
      tx.category?.name.toLowerCase().includes(search.toLowerCase());
    const matchAccount = selectedAccountId ? tx.account_id === selectedAccountId : true;
    return matchSearch && matchAccount;
  });

  const counts = {
    all: baseFiltered.length,
    income: baseFiltered.filter(tx => tx.amount >= 0).length,
    expense: baseFiltered.filter(tx => tx.amount < 0).length
  };

  const afterType = baseFiltered.filter(tx => {
    if (filterType === "all") return true;
    if (filterType === "income") return tx.amount >= 0;
    if (filterType === "expense") return tx.amount < 0;
    return true;
  });

  // Counts for Import
  const countsImported = {
    all: afterType.length,
    only: afterType.filter(t => t.import_id || t.fitid).length,
    hide: afterType.filter(t => !(t.import_id || t.fitid)).length
  };

  const afterImported = afterType.filter(tx => {
    if (filterImported === "only") return !!(tx.import_id || tx.fitid);
    if (filterImported === "hide") return !(tx.import_id || tx.fitid);
    return true;
  });

  // Counts for Category
  const countsCategory = {
    all: afterImported.length,
    categorized: afterImported.filter(t => t.category_id).length,
    uncategorized: afterImported.filter(t => !t.category_id).length
  };

  const filteredTransactions = afterImported.filter(tx => {
    if (filterCategory === "categorized") return !!tx.category_id;
    if (filterCategory === "uncategorized") return !tx.category_id;
    return true;
  });

  const accountsWithBank = React.useMemo(() => {
    return accounts.map(a => {
      const bank = banks.find(b => b.id === a.bank_id);
      return { ...a, bank };
    });
  }, [accounts, banks]);

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

        <div className="flex items-center gap-4 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          <div
            className={cn(
              "flex items-center gap-2 px-4 py-1 rounded-full border cursor-pointer transition-all whitespace-nowrap min-w-fit",
              selectedAccountId === null
                ? "bg-primary text-primary-foreground border-primary shadow-md"
                : "bg-background hover:bg-muted border-border"
            )}
            onClick={() => setSelectedAccountId(null)}
          >
            <Wallet className="w-4 h-4" />
            <span className="font-medium text-sm">Todas as Contas</span>
          </div>
          {accounts.map(acc => {
            const bank = banks.find(b => b.id === acc.bank_id);
            const iconClass = bank ? bankIconByName(bank.shortName || bank.name) : bankIconByName(acc.name);
            const isBB = (iconClass && iconClass.includes("banco-brasil")) || acc.name.toLowerCase().includes("brasil");
            const isNubank = (iconClass && iconClass.includes("nubank")) || acc.name.toLowerCase().includes("nubank") || acc.name.toLowerCase().includes("nu ");
            const bg = bank?.color || (isBB ? "#0038A8" : undefined) || (isNubank ? "#820AD1" : undefined) || "#999";
            const finalIconClass = iconClass || (isBB ? "ibb-banco-brasil" : undefined) || (isNubank ? "ibb-nubank" : undefined);

            return (
              <div
                key={acc.id}
                className={cn(
                  "flex items-center gap-2 px-4 py-1 rounded-full border cursor-pointer transition-all whitespace-nowrap min-w-fit",
                  selectedAccountId === acc.id
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-background hover:bg-muted border-border"
                )}
                onClick={() => setSelectedAccountId(acc.id)}
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-[8px]"
                  style={{ backgroundColor: selectedAccountId === acc.id ? "transparent" : bg }}
                >
                  {finalIconClass ? (
                    <span className={`${finalIconClass} text-xs ${selectedAccountId === acc.id ? "text-white" : "text-white"}`}></span>
                  ) : (
                    (acc.name).substring(0, 2)
                  )}
                </div>
                <span className="font-medium text-sm">{acc.name}</span>
              </div>
            )
          })}
        </div>

        <TransactionForm
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={fetchData}
          initialData={editingTransaction}
          accounts={accounts}
          categories={categories}
        />

        <Card className="border-none shadow-md">
          <div className="flex flex-col">
            <div className="flex items-center border-b w-full px-6 pt-2">
              <button
                className={cn(
                  "flex items-center gap-2 px-6 py-4 border-b-2 transition-colors text-sm font-medium",
                  filterType === "all" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setFilterType("all")}
              >
                Todos
                <Badge variant={filterType === "all" ? "default" : "secondary"} className="ml-1 text-[10px] h-5 px-1.5 rounded-full">
                  {counts.all}
                </Badge>
              </button>
              <button
                className={cn(
                  "flex items-center gap-2 px-6 py-4 border-b-2 transition-colors text-sm font-medium",
                  filterType === "income" ? "border-emerald-500 text-emerald-600" : "border-transparent text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setFilterType("income")}
              >
                Receitas
                <Badge variant="outline" className={cn("ml-1 text-[10px] h-5 px-1.5 rounded-full", filterType === "income" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "")}>
                  {counts.income}
                </Badge>
              </button>
              <button
                className={cn(
                  "flex items-center gap-2 px-6 py-4 border-b-2 transition-colors text-sm font-medium",
                  filterType === "expense" ? "border-red-500 text-red-600" : "border-transparent text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setFilterType("expense")}
              >
                Despesas
                <Badge variant="outline" className={cn("ml-1 text-[10px] h-5 px-1.5 rounded-full", filterType === "expense" ? "bg-red-100 text-red-700 border-red-200" : "")}>
                  {counts.expense}
                </Badge>
              </button>
            </div>

            <div className="p-4 flex flex-col xl:flex-row gap-4 justify-between items-center bg-muted/10">
              <div className="relative w-full xl:w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por descrição..."
                  className="pl-10 bg-white border-border/50 focus:bg-white transition-all duration-200"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="flex flex-col lg:flex-row gap-4 items-center w-full xl:w-auto overflow-x-auto">
                <div className="flex items-center bg-background rounded-md border shadow-sm p-1 shrink-0">
                  <button className={cn("px-3 py-1.5 text-xs font-medium rounded-sm transition-all flex items-center gap-2", filterImported === "all" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted")} onClick={() => setFilterImported("all")}>
                    Todas <span className="opacity-70 text-[10px] bg-black/10 px-1 rounded">{countsImported.all}</span>
                  </button>
                  <button className={cn("px-3 py-1.5 text-xs font-medium rounded-sm transition-all flex items-center gap-2", filterImported === "only" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted")} onClick={() => setFilterImported("only")}>
                    Apenas Importadas <span className="opacity-70 text-[10px] bg-black/10 px-1 rounded">{countsImported.only}</span>
                  </button>
                  <button className={cn("px-3 py-1.5 text-xs font-medium rounded-sm transition-all flex items-center gap-2", filterImported === "hide" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted")} onClick={() => setFilterImported("hide")}>
                    Ocultar Importadas <span className="opacity-70 text-[10px] bg-black/10 px-1 rounded">{countsImported.hide}</span>
                  </button>
                </div>

                <div className="flex items-center bg-background rounded-md border shadow-sm p-1 shrink-0">
                  <button className={cn("px-3 py-1.5 text-xs font-medium rounded-sm transition-all flex items-center gap-2", filterCategory === "all" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted")} onClick={() => setFilterCategory("all")}>
                    Todas <span className="opacity-70 text-[10px] bg-black/10 px-1 rounded">{countsCategory.all}</span>
                  </button>
                  <button className={cn("px-3 py-1.5 text-xs font-medium rounded-sm transition-all flex items-center gap-2", filterCategory === "categorized" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted")} onClick={() => setFilterCategory("categorized")}>
                    Com Categoria <span className="opacity-70 text-[10px] bg-black/10 px-1 rounded">{countsCategory.categorized}</span>
                  </button>
                  <button className={cn("px-3 py-1.5 text-xs font-medium rounded-sm transition-all flex items-center gap-2", filterCategory === "uncategorized" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted")} onClick={() => setFilterCategory("uncategorized")}>
                    Sem Categoria <span className="opacity-70 text-[10px] bg-black/10 px-1 rounded">{countsCategory.uncategorized}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <CardContent className="p-0">
            <TransactionList
              transactions={filteredTransactions}
              onEdit={openEdit}
              onDelete={handleDelete}
              onConvertToTransfer={handleConvertToTransfer}
              banks={banks}
            />
          </CardContent>
        </Card>

        <TransferWarningDialog
          open={transferWarningOpen}
          onOpenChange={setTransferWarningOpen}
          onConfirm={confirmConversion}
        />

        <TransferConversionDialog
          open={transferConversionOpen}
          onOpenChange={setTransferConversionOpen}
          transaction={transactionToConvert}
          accounts={accounts}
          banks={banks}
          onSuccess={onConversionSuccess}
        />
      </div>
    </Layout>
  );
}
