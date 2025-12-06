import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Wallet, Plus, Edit2, Trash2, Scale, AlertCircle } from "lucide-react";
import * as React from "react";
import { supabase } from "@/lib/supabase";
import { useLocation } from "wouter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Bank = { id: string; code: string; name: string; shortName?: string | null; slug?: string | null; color?: string | null; logoUrl?: string | null };
function bankIconClass(b: Bank | undefined): string | undefined {
  if (!b) return undefined;
  const byCode: Record<string, string> = {
    "001": "ibb-banco-brasil",
    "341": "ibb-itau",
    "237": "ibb-bradesco",
    "033": "ibb-santander",
    "104": "ibb-caixa",
    "260": "ibb-nubank",
    "077": "ibb-inter",
    "208": "ibb-btg",
    "336": "ibb-c6",
    "748": "ibb-sicredi",
    "756": "ibb-bancoob",
  };
  const bySlug: Record<string, string> = {
    "banco-do-brasil": "ibb-banco-brasil",
    "itau": "ibb-itau",
    "bradesco": "ibb-bradesco",
    "santander": "ibb-santander",
    "caixa": "ibb-caixa",
    "nubank": "ibb-nubank",
    "inter": "ibb-inter",
    "btg": "ibb-btg",
    "c6": "ibb-c6",
    "sicredi": "ibb-sicredi",
    "sicoob": "ibb-sicoob",
    "original": "ibb-original",
    "safra": "ibb-safra",
    "banrisul": "ibb-banrisul",
  };
  const slug = (b.slug || "").toLowerCase();
  if (slug && bySlug[slug]) return bySlug[slug];
  if (b.code && byCode[b.code]) return byCode[b.code];
  const n = ((b.shortName || b.name || "").toLowerCase());
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

type Account = { id: string; name: string; balance: number | string; bankId?: string | null; type: string; overdraftLimit?: number | string };
type Transaction = { id: string; account_id: string; amount: number; status: string };

export default function BankAccounts() {
  const [banks, setBanks] = React.useState<Bank[]>([]);
  const [selectedBank, setSelectedBank] = React.useState<string>("");
  const [bankOther, setBankOther] = React.useState<string>("");
  const [name, setName] = React.useState<string>("");
  const [balance, setBalance] = React.useState<string>("");
  const [overdraftLimit, setOverdraftLimit] = React.useState<string>("");
  const [saving, setSaving] = React.useState<boolean>(false);
  const [info, setInfo] = React.useState<string>("");
  const [bankQuery, setBankQuery] = React.useState<string>("");
  const [logoErrorByCode, setLogoErrorByCode] = React.useState<Record<string, boolean>>({});
  const [logoSrcByCode, setLogoSrcByCode] = React.useState<Record<string, string>>({});
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [accountType, setAccountType] = React.useState<string>("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [, setLocation] = useLocation();
  const [editOpen, setEditOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string>("");
  const [editName, setEditName] = React.useState<string>("");
  const [editType, setEditType] = React.useState<string>("");
  const [editBankId, setEditBankId] = React.useState<string | null>(null);
  const [editBalance, setEditBalance] = React.useState<string>("");
  const [editOverdraftLimit, setEditOverdraftLimit] = React.useState<string>("");
  const [editHasTx, setEditHasTx] = React.useState<boolean>(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  // Adjust Balance Modal State
  const [adjustOpen, setAdjustOpen] = React.useState(false);
  const [adjustAccountId, setAdjustAccountId] = React.useState<string>("");
  const [adjustNewBalance, setAdjustNewBalance] = React.useState<string>("");

  async function fetchAccounts() {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setAccounts([]);
        setTransactions([]);
        return;
      }

      // Fetch Accounts
      const { data: accData, error: accError } = await supabase
        .from("accounts")
        .select("id,name,balance,bank_id,type,overdraft_limit")
        .order("name", { ascending: true });

      if (accError || !accData) {
        setAccounts([]);
        return;
      }

      // Fetch Transactions (for dynamic balance)
      const { data: txData, error: txError } = await supabase
        .from("bank_transactions")
        .select("id,account_id,amount,status")
        .eq("status", "paid");

      if (!txError && txData) {
        setTransactions(txData as Transaction[]);
      }

      const normalized = accData.map((a: any) => ({
        id: a.id,
        name: a.name,
        balance: Number(a.balance ?? 0),
        bankId: a.bank_id ?? null,
        type: a.type ?? "Corrente",
        overdraftLimit: Number(a.overdraft_limit ?? 0),
      })) as Account[];
      setAccounts(normalized);
    } catch {
      setAccounts([]);
    }
  }

  React.useEffect(() => {
    fetch("/api/banks")
      .then((r) => r.json())
      .then((data: Bank[]) => {
        setBanks(data);
      })
      .catch(() => {
        setBanks([]);
      });

    fetchAccounts();
  }, []);

  React.useEffect(() => {
    setBalance(new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(0));
    setOverdraftLimit(new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(0));
  }, []);

  function parseMoney(v: string): number {
    const s = v.replace(/[^0-9,\.]/g, "").replace(/\./g, "").replace(/,(?=\d{2}$)/, ".");
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  }

  function formatBalanceInput(value: string): string {
    const digits = value.replace(/\D/g, "");
    const num = parseInt(digits || "0", 10);
    const val = (num / 100);
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  }

  function getCalculatedBalance(acc: Account): number {
    const initial = Number(acc.balance || 0);
    const accountTx = transactions.filter(t => t.account_id === acc.id);
    const txSum = accountTx.reduce((sum, t) => sum + Number(t.amount), 0);
    return initial + txSum;
  }

  async function saveAccount() {
    setSaving(true);
    setInfo("");
    const bankLabel = (() => {
      const b = banks.find((x) => x.id === selectedBank);
      if (b) return b.shortName || b.name;
      if (selectedBank === "other" && bankOther) return bankOther;
      return "Conta";
    })();
    const finalName = name || bankLabel;
    const payload = {
      name: finalName,
      type: accountType || "Corrente",
      balance: parseMoney(balance),
      overdraft_limit: parseMoney(overdraftLimit),
      bank_id: selectedBank === "other" ? null : selectedBank,
    } as any;
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setInfo("Necessário autenticar");
        setSaving(false);
        return;
      }
      const userId = userData.user.id;
      const { error } = await supabase
        .from("accounts")
        .insert({
          user_id: userId,
          name: payload.name,
          type: payload.type,
          balance: payload.balance,
          overdraft_limit: payload.overdraft_limit,
          bank_id: payload.bank_id,
          bank_code: banks.find((x) => x.id === selectedBank)?.code || null,
        });
      if (error) {
        setInfo("Não foi possível salvar");
        setSaving(false);
        return;
      }
      setInfo("Conta criada");
      setSaving(false);
      setName("");
      setBalance(new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(0));
      setOverdraftLimit(new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(0));
      setSelectedBank("");
      setBankOther("");
      setAccountType("");
      setDialogOpen(false);
      setLocation("/contas");
      fetchAccounts();
    } catch {
      setInfo("Erro de rede");
      setSaving(false);
    }
  }

  function openEdit(acc: Account) {
    setEditId(acc.id);
    setEditName(acc.name);
    setEditType(acc.type || "Corrente");
    setEditBankId(acc.bankId ?? null);
    setEditBalance(new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(acc.balance || 0)));
    setEditOverdraftLimit(new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(acc.overdraftLimit || 0)));
    setEditOpen(true);
    (async () => {
      const { count } = await supabase
        .from("bank_transactions")
        .select("id", { count: "exact", head: true })
        .eq("account_id", acc.id);
      setEditHasTx((count || 0) > 0);
    })();
  }

  async function updateAccount() {
    try {
      const updatePayload: any = {
        name: editName,
        type: editType,
        bank_id: editBankId,
        overdraft_limit: parseMoney(editOverdraftLimit)
      };
      if (!editHasTx) {
        updatePayload.balance = parseMoney(editBalance);
      }
      const { error } = await supabase
        .from("accounts")
        .update(updatePayload)
        .eq("id", editId);
      if (error) return;
      setEditOpen(false);
      fetchAccounts();
    } catch { }
  }

  async function canDeleteAccount(id: string): Promise<boolean> {
    const { count, error } = await supabase
      .from("bank_transactions")
      .select("id", { count: "exact", head: true })
      .eq("account_id", id);
    if (error) return false;
    return (count || 0) === 0;
  }

  async function deleteAccount(id: string) {
    try {
      const ok = await canDeleteAccount(id);
      if (!ok) {
        setInfo("Conta possui transações vinculadas");
        setDeletingId(null);
        return;
      }
      const { error } = await supabase.from("accounts").delete().eq("id", id);
      if (error) {
        setInfo("Não foi possível excluir");
        setDeletingId(null);
        return;
      }
      setInfo("");
      setDeletingId(null);
      fetchAccounts();
    } catch {
      setInfo("Erro de rede");
      setDeletingId(null);
    }
  }

  // Adjust Balance Functions
  function openAdjust(acc: Account) {
    const current = getCalculatedBalance(acc);
    setAdjustAccountId(acc.id);
    setAdjustNewBalance(new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(current));
    setAdjustOpen(true);
  }

  async function handleAdjustBalance() {
    try {
      const account = accounts.find(a => a.id === adjustAccountId);
      if (!account) return;

      const current = getCalculatedBalance(account);
      const target = parseMoney(adjustNewBalance);
      const diff = target - current;

      if (Math.abs(diff) < 0.01) {
        setAdjustOpen(false);
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      // Ensure category exists
      const ADJUST_CATEGORY_ID = "4c8c2765-74a9-45d2-9634-42ee4541a333";
      const { data: catData } = await supabase.from("categories").select("id").eq("id", ADJUST_CATEGORY_ID).single();

      if (!catData) {
        // Create category if not exists (try)
        await supabase.from("categories").insert({
          id: ADJUST_CATEGORY_ID,
          user_id: userData.user.id,
          name: "Ajuste de Saldo",
          type: "expense", // or income, doesn't matter for system category much
          icon: "scale",
          color: "#808080"
        });
      }

      // Create transaction
      const { error } = await supabase.from("bank_transactions").insert({
        user_id: userData.user.id,
        account_id: adjustAccountId,
        category_id: ADJUST_CATEGORY_ID,
        amount: diff, // Signed amount
        date: new Date().toISOString().slice(0, 10),
        description: "Ajuste de Saldo",
        status: "paid"
      });

      if (error) {
        alert("Erro ao ajustar saldo: " + error.message);
        return;
      }

      setAdjustOpen(false);
      fetchAccounts();

    } catch (err) {
      console.error(err);
      alert("Erro inesperado");
    }
  }

  const filteredBanks = banks.filter((b) => {
    const q = bankQuery.toLowerCase();
    if (!q) return true;
    return (
      (b.shortName || "").toLowerCase().includes(q) ||
      (b.name || "").toLowerCase().includes(q) ||
      (b.code || "").toLowerCase().includes(q)
    );
  });

  const selectedObj = banks.find((x) => x.id === selectedBank);

  React.useEffect(() => {
    const code = selectedObj?.code;
    if (!code) return;
    setLogoErrorByCode((prev) => {
      const next = { ...prev };
      delete next[code];
      return next;
    });
    (async () => {
      try {
        if (!selectedObj?.logoUrl) return;
        const r = await fetch(`/api/logo/${code}`);
        if (!r.ok) {
          setLogoErrorByCode((prev) => ({ ...prev, [code]: true }));
          return;
        }
        const blob = await r.blob();
        const url = URL.createObjectURL(blob);
        setLogoSrcByCode((prev) => ({ ...prev, [code]: url }));
      } catch {
        setLogoErrorByCode((prev) => ({ ...prev, [code]: true }));
      }
    })();
  }, [selectedObj?.code]);

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Contas Bancárias</h1>
          <p className="text-muted-foreground">Gerencie suas contas correntes e poupanças.</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Conta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Adicionar Conta Bancária</DialogTitle>
              <DialogDescription>Cadastre uma nova conta bancária.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Nome</Label>
                <Input id="name" placeholder="Ex: Conta Corrente" className="col-span-3" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="bank" className="text-right">Banco</Label>
                <div className="col-span-3">
                  <div className="flex items-center gap-2 mb-2">
                    {selectedBank && selectedObj && logoSrcByCode[selectedObj.code] && !logoErrorByCode[selectedObj.code] ? (
                      <img src={logoSrcByCode[selectedObj.code]} alt="Logo" className="w-5 h-5 rounded-sm" />
                    ) : selectedBank && bankIconClass(selectedObj as Bank) ? (
                      <span className={`${bankIconClass(selectedObj as Bank)} text-xl`} style={{ color: (selectedObj?.color || "#333") }}></span>
                    ) : selectedBank && selectedObj?.color ? (
                      <span className="inline-block w-5 h-5 rounded-sm" style={{ backgroundColor: selectedObj.color }} />
                    ) : null}
                    <Input placeholder="Pesquisar banco (nome/código)" value={bankQuery} onChange={(e) => setBankQuery(e.target.value)} />
                  </div>
                  <Select value={selectedBank} onValueChange={setSelectedBank}>
                    <SelectTrigger>
                      <SelectValue placeholder={banks.length ? "Selecione o banco" : "Carregando bancos..."} />
                    </SelectTrigger>
                    <SelectContent className="max-h-72 overflow-y-auto">
                      <SelectItem value="other">Outro</SelectItem>
                      {filteredBanks.map((b) => (
                        <SelectItem key={b.id} value={b.id} className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            {bankIconClass(b) ? (
                              <span className={`${bankIconClass(b)} text-base`} style={{ color: (bankIconClass(b)?.includes("banco-brasil") ? "#0038A8" : (b.color || "#333")) }}></span>
                            ) : (
                              <span className="inline-block w-4 h-4 rounded-sm" style={{ backgroundColor: b.color || "#999" }} />
                            )}
                            <span>
                              {(b.shortName || b.name) + (b.code ? ` (${b.code})` : "")}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {selectedBank === "other" ? (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="bank_other" className="text-right">Banco (Outro)</Label>
                  <Input id="bank_other" placeholder="Digite o nome do banco" className="col-span-3" value={bankOther} onChange={(e) => setBankOther(e.target.value)} />
                </div>
              ) : null}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">Tipo</Label>
                <div className="col-span-3">
                  <Select value={accountType} onValueChange={setAccountType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Corrente" className="cursor-pointer">Corrente</SelectItem>
                      <SelectItem value="Poupança" className="cursor-pointer">Poupança</SelectItem>
                      <SelectItem value="Investimento" className="cursor-pointer">Investimento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="balance" className="text-right">Saldo inicial</Label>
                <Input
                  id="balance"
                  placeholder="R$ 0,00"
                  className="col-span-3"
                  value={balance}
                  onChange={(e) => setBalance(formatBalanceInput(e.target.value))}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="overdraft" className="text-right">Limite Cheque Esp.</Label>
                <Input
                  id="overdraft"
                  placeholder="R$ 0,00"
                  className="col-span-3"
                  value={overdraftLimit}
                  onChange={(e) => setOverdraftLimit(formatBalanceInput(e.target.value))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={saveAccount} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
              {info ? <span className="text-sm text-muted-foreground ml-3">{info}</span> : null}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Saldo Total</p>
              <h2 className="text-3xl font-bold text-primary">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                  (Array.isArray(accounts) ? accounts : []).reduce((acc, curr) => acc + getCalculatedBalance(curr), 0)
                )}
              </h2>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-primary">
              <Wallet className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {(Array.isArray(accounts) ? accounts : []).map((account) => {
          const bank = banks.find((b) => b.id === account.bankId);
          const currentBalance = getCalculatedBalance(account);
          const limit = Number(account.overdraftLimit || 0);
          const available = currentBalance + limit;
          const isLow = currentBalance < 0; // Simple alert logic, can be improved

          const iconClass = bankIconClass(bank || { name: account.name } as Bank);
          const isBB = (iconClass?.includes("banco-brasil") || account.name.toLowerCase().includes("brasil"));
          const isNubank = (iconClass?.includes("nubank") || account.name.toLowerCase().includes("nubank") || account.name.toLowerCase().includes("nu "));

          let bgColor = "#999";
          if (isBB) bgColor = "#0038A8";
          else if (bank?.color) bgColor = bank.color;
          else if (isNubank) bgColor = "#820AD1";

          return (
            <Card
              key={account.id}
              className="border-none shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
              onClick={() => setLocation(`/contas/${account.id}`)}
            >
              <CardContent className="p-6 flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-sm"
                  style={{ backgroundColor: bgColor }}
                >
                  {iconClass ? (
                    <span className={`${iconClass} text-2xl text-white`}></span>
                  ) : (
                    (account.name).substring(0, 2).toUpperCase()
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-foreground">{account.name}</h4>
                    {isLow && <AlertCircle className="w-4 h-4 text-red-500" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{bank?.name || "Banco não informado"}</p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Limite: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(limit)}
                    <span className="mx-2">•</span>
                    Disponível: <span className="font-medium text-foreground">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(available)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-lg ${currentBalance < 0 ? 'text-red-600' : 'text-foreground'}`}>
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(currentBalance)}
                  </p>
                  <p className="text-xs text-muted-foreground">Saldo Atual</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={(e) => { e.stopPropagation(); openAdjust(account); }} title="Ajustar Saldo">
                    <Scale className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={(e) => { e.stopPropagation(); openEdit(account); }} title="Editar">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); setDeletingId(account.id); }}
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir conta?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Só é possível excluir contas sem transações vinculadas.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={(e) => { e.stopPropagation(); setDeletingId(null); }}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={(e) => { e.stopPropagation(); deleteAccount(account.id); }}>Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Conta</DialogTitle>
            <DialogDescription>Atualize as informações da conta.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_name" className="text-right">Nome</Label>
              <Input id="edit_name" className="col-span-3" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_type" className="text-right">Tipo</Label>
              <div className="col-span-3">
                <Select value={editType} onValueChange={setEditType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Corrente" className="cursor-pointer">Corrente</SelectItem>
                    <SelectItem value="Poupança" className="cursor-pointer">Poupança</SelectItem>
                    <SelectItem value="Investimento" className="cursor-pointer">Investimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_balance" className="text-right">Saldo Inicial</Label>
              <div className="col-span-3">
                <Input
                  id="edit_balance"
                  placeholder="R$ 0,00"
                  value={editBalance}
                  onChange={(e) => setEditBalance(formatBalanceInput(e.target.value))}
                  disabled={editHasTx}
                />
                {editHasTx ? (
                  <p className="mt-1 text-xs text-muted-foreground">Não é possível editar o saldo com transações vinculadas.</p>
                ) : null}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_overdraft" className="text-right">Limite Cheque Esp.</Label>
              <div className="col-span-3">
                <Input
                  id="edit_overdraft"
                  placeholder="R$ 0,00"
                  value={editOverdraftLimit}
                  onChange={(e) => setEditOverdraftLimit(formatBalanceInput(e.target.value))}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_bank" className="text-right">Banco</Label>
              <div className="col-span-3">
                <Select value={editBankId ?? ""} onValueChange={(v) => setEditBankId(v === "none" ? null : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o banco" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72 overflow-y-auto">
                    <SelectItem value="none">Nenhum</SelectItem>
                    {banks.map((b) => (
                      <SelectItem key={b.id} value={b.id} className="cursor-pointer">
                        {(b.shortName || b.name) + (b.code ? ` (${b.code})` : "")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={updateAccount}>Salvar alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Ajustar Saldo</DialogTitle>
            <DialogDescription>Informe o valor real do saldo atual. Uma transação de ajuste será criada automaticamente.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="adjust_balance" className="text-right">Novo Saldo</Label>
              <Input
                id="adjust_balance"
                placeholder="R$ 0,00"
                className="col-span-3"
                value={adjustNewBalance}
                onChange={(e) => setAdjustNewBalance(formatBalanceInput(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleAdjustBalance}>Confirmar Ajuste</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
