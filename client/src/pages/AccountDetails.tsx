import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Plus, ArrowLeft, Wallet } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as React from "react";
import { supabase } from "@/lib/supabase";
import { useRoute, useLocation } from "wouter";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { TransactionList } from "@/components/transactions/TransactionList";
import { TransferWarningDialog } from "@/components/transactions/TransferWarningDialog";
import { TransferConversionDialog } from "@/components/transactions/TransferConversionDialog";

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
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
    category?: { name: string; icon: string; color: string; type: string };
    account?: { name: string; bank_id?: string };
};

type Account = { id: string; name: string; balance: number; bank_id?: string; overdraft_limit?: number };

type Category = { id: string; name: string; type: string; icon: string; color: string };

type Bank = {
    id: string;
    code: string;
    name: string;
    shortName?: string | null;
    slug?: string | null;
    color?: string | null;
    logoUrl?: string | null;
};

export default function AccountDetails() {
    // ------------------------------------------------------------------
    // Routing & basic IDs
    // ------------------------------------------------------------------
    const [match, params] = useRoute("/contas/:id");
    const [, setLocation] = useLocation();
    const accountId = params?.id;

    // ------------------------------------------------------------------
    // State
    // ------------------------------------------------------------------
    const [transactions, setTransactions] = React.useState<Transaction[]>([]);
    const [account, setAccount] = React.useState<Account | null>(null);
    const [accounts, setAccounts] = React.useState<Account[]>([]); // for dropdowns
    const [categories, setCategories] = React.useState<Category[]>([]);
    const [banks, setBanks] = React.useState<Bank[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [calculatedBalance, setCalculatedBalance] = React.useState<number>(0);

    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [editingTransaction, setEditingTransaction] = React.useState<Transaction | null>(null);

    // Transfer conversion UI state
    const [transferWarningOpen, setTransferWarningOpen] = React.useState(false);
    const [transferConversionOpen, setTransferConversionOpen] = React.useState(false);
    const [transactionToConvert, setTransactionToConvert] = React.useState<Transaction | null>(null);

    // Filters
    const [search, setSearch] = React.useState("");
    const [filterType, setFilterType] = React.useState<"all" | "income" | "expense">("all");
    const [selectedAccountId, setSelectedAccountId] = React.useState<string | null>(null);

    const today = new Date();
    const [year, setYear] = React.useState(today.getFullYear());
    const [month, setMonth] = React.useState(today.getMonth() + 1);

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------
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

    // ------------------------------------------------------------------
    // Effects – fetch data & banks list
    // ------------------------------------------------------------------
    React.useEffect(() => {
        if (accountId) fetchData();
    }, [accountId, year, month]);

    React.useEffect(() => {
        fetch("/api/banks")
            .then((r) => r.json())
            .then((data: Bank[]) => setBanks(data || []))
            .catch(() => setBanks([]));
    }, []);

    // ------------------------------------------------------------------
    // Data fetching
    // ------------------------------------------------------------------
    async function fetchData() {
        setLoading(true);
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;

        const start = new Date(year, month - 1, 1).toISOString().slice(0, 10);
        const end = new Date(year, month, 0).toISOString().slice(0, 10);

        const [accRes, accsRes, catsRes, txsRes, allTxRes] = await Promise.all([
            supabase.from("accounts").select("*").eq("id", accountId).single(),
            supabase.from("accounts").select("id,name,balance").order("name"),
            supabase.from("categories").select("id,name,type,icon,color").order("name"),
            supabase
                .from("bank_transactions")
                .select(`
          *,
          category:categories(name,icon,color,type),
          account:accounts(name,bank_id)
        `)
                .eq("account_id", accountId)
                .gte("date", start)
                .lte("date", end)
                .order("date", { ascending: false }),
             supabase
                .from("bank_transactions")
                .select("amount")
                .eq("account_id", accountId)
                .eq("status", "paid")
        ]);

        if (accRes.data) setAccount(accRes.data);
        if (accsRes.data) setAccounts(accsRes.data);
        if (catsRes.data) setCategories(catsRes.data);
        if (txsRes.data) {
            const formatted = txsRes.data.map((t) => ({
                ...t,
                type: t.amount >= 0 ? "income" : "expense",
                tags: t.tags || []
            }));
            setTransactions(formatted);
        }

        // Calculate total balance dynamically
        if (accRes.data) {
             const initial = Number(accRes.data.balance || 0);
             const totalTx = (allTxRes.data || []).reduce((sum, t) => sum + Number(t.amount), 0);
             setCalculatedBalance(initial + totalTx);
        }

        setLoading(false);
    }

    // ------------------------------------------------------------------
    // UI actions
    // ------------------------------------------------------------------
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

    // Transfer conversion flow
    function handleConvertToTransfer(tx: Transaction) {
        setTransactionToConvert(tx);
        setTransferWarningOpen(true);
    }

    function confirmConversion() {
        setTransferWarningOpen(false);
        setTransferConversionOpen(true);
    }

    function onConversionSuccess() {
        setTransferConversionOpen(false);
        fetchData();
    }

    // ------------------------------------------------------------------
    // Filtering logic (search + type + optional account filter)
    // ------------------------------------------------------------------
    const baseFiltered = transactions.filter((tx) => {
        const matchSearch =
            tx.description?.toLowerCase().includes(search.toLowerCase()) ||
            tx.category?.name.toLowerCase().includes(search.toLowerCase());
        const matchAccount = selectedAccountId ? tx.account_id === selectedAccountId : true;
        return matchSearch && matchAccount;
    });

    const filteredTransactions = baseFiltered.filter((tx) => {
        if (filterType === "all") return true;
        if (filterType === "income") return tx.amount >= 0;
        if (filterType === "expense") return tx.amount < 0;
        return true;
    });

    const bank = banks.find((b) => b.id === account?.bank_id);
    const iconClass = bank ? bankIconByName(bank.shortName || bank.name) : account ? bankIconByName(account.name) : undefined;
    const overdraft = Number(account?.overdraft_limit || 0);
    const available = calculatedBalance + overdraft;

    // ------------------------------------------------------------------
    // Render
    // ------------------------------------------------------------------
    return (
        <Layout>
            <div>
                {/* Header */}
                <div className="mb-6">
                    <Button variant="ghost" className="pl-0 hover:pl-2 transition-all" onClick={() => setLocation("/contas")}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para Contas
                    </Button>
                </div>

                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-md"
                            style={{ 
                                backgroundColor: bank?.color || (
                                    (iconClass?.includes("banco-brasil") || account?.name.toLowerCase().includes("brasil")) 
                                    ? "#F8D117" 
                                    : "#999"
                                ) 
                            }}
                        >
                            {bank ? (
                                iconClass ? (
                                    <span className={`${iconClass} text-2xl text-white`}></span>
                                ) : (
                                    (bank.shortName || bank.name).substring(0, 2)
                                )
                            ) : (
                                <Wallet className="w-6 h-6" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">
                                {account?.name || "Carregando..."}
                            </h1>
                            <div className="flex flex-col">
                                <p className="text-muted-foreground">
                                    Saldo Atual: <span className={`font-bold ${calculatedBalance < 0 ? 'text-red-600' : 'text-foreground'}`}>
                                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(calculatedBalance)}
                                    </span>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Limite: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(overdraft)} • Disponível: <span className="font-medium text-foreground">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(available)}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <Button onClick={openNew} className="bg-primary hover:bg-primary/90 text-white shadow-lg">
                            <Plus className="w-4 h-4 mr-2" /> Nova Transação
                        </Button>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => setMonth((m) => (m === 1 ? (setYear((y) => y - 1), 12) : m - 1))}>
                                {"<"}
                            </Button>
                            <div className="px-3 py-1 rounded-full border text-sm bg-background">
                                {monthLabel(year, month)}
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setMonth((m) => (m === 12 ? (setYear((y) => y + 1), 1) : m + 1))}>
                                {">"}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Form modal */}
                <TransactionForm
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    onSuccess={fetchData}
                    initialData={editingTransaction}
                    defaultAccountId={accountId}
                    accounts={accounts}
                    categories={categories}
                />

                {/* Filters + list */}
                <Card className="border-none shadow-md">
                    <div className="p-6 flex flex-col md:flex-row gap-4 justify-between items-center border-b border-border/50">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                                placeholder="Buscar por descrição..."
                                className="pl-10 bg-muted/30 border-transparent focus:bg-white transition-all duration-200"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
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
                        <TransactionList
                            transactions={filteredTransactions}
                            onEdit={openEdit}
                            onDelete={handleDelete}
                            onConvertToTransfer={handleConvertToTransfer}
                            banks={banks}
                        />
                    </CardContent>
                </Card>

                {/* Transfer dialogs */}
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
