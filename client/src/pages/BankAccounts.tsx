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
import { Wallet, Plus } from "lucide-react";
import * as React from "react";
import { supabase } from "@/lib/supabase";

type Bank = { id: string; code: string; name: string; shortName?: string | null; slug?: string | null; color?: string | null };
function bankIconClass(b: Bank): string | undefined {
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

export default function BankAccounts() {
  const [banks, setBanks] = React.useState<Bank[]>([]);
  const [selectedBank, setSelectedBank] = React.useState<string>("");
  const [bankOther, setBankOther] = React.useState<string>("");
  const [name, setName] = React.useState<string>("");
  const [balance, setBalance] = React.useState<string>("");
  const [saving, setSaving] = React.useState<boolean>(false);
  const [info, setInfo] = React.useState<string>("");
  const [bankQuery, setBankQuery] = React.useState<string>("");

  React.useEffect(() => {
    fetch("/api/banks")
      .then((r) => r.json())
      .then((data: Bank[]) => {
        setBanks(data);
      })
      .catch(() => {
        setBanks([]);
      });
  }, []);

  function parseMoney(v: string): number {
    const s = v.replace(/[^0-9,\.]/g, "").replace(/\./g, "").replace(/,(?=\d{2}$)/, ".");
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  }

  async function saveAccount() {
    setSaving(true);
    setInfo("");
    const bankLabel = (() => {
      const b = banks.find((x) => x.code === selectedBank);
      if (b) return b.shortName || b.name;
      if (selectedBank === "other" && bankOther) return bankOther;
      return "Conta";
    })();
    const finalName = name || bankLabel;
    const payload = { name: finalName, type: "bank", balance: parseMoney(balance).toFixed(2) } as any;
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch("/api/accounts", { method: "POST", headers, body: JSON.stringify(payload) });
      if (!res.ok) {
        setInfo("Não foi possível salvar");
        setSaving(false);
        return;
      }
      setInfo("Conta criada");
      setSaving(false);
      setName("");
      setBalance("");
      setSelectedBank("");
      setBankOther("");
    } catch {
      setInfo("Erro de rede");
      setSaving(false);
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

  const selectedObj = banks.find((x) => x.code === selectedBank);

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Contas Bancárias</h1>
          <p className="text-muted-foreground">Gerencie suas contas correntes e poupanças.</p>
        </div>

        <Dialog>
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
                    {selectedBank && bankIconClass(selectedObj as Bank) ? (
                      <span className={`${bankIconClass(selectedObj as Bank)} text-xl`}></span>
                    ) : selectedBank && (selectedObj?.logoUrl) ? (
                      <img src={(selectedObj as any).logoUrl} alt="Logo" className="w-5 h-5 rounded-sm" />
                    ) : selectedBank && selectedObj?.color ? (
                      <span className="inline-block w-5 h-5 rounded-sm" style={{ backgroundColor: selectedObj.color }} />
                    ) : null}
                    <Input placeholder="Pesquisar banco (nome/código)" value={bankQuery} onChange={(e) => setBankQuery(e.target.value)} />
                  </div>
                  <Select value={selectedBank} onValueChange={setSelectedBank}>
                    <SelectTrigger>
                      <SelectValue placeholder={banks.length ? "Selecione o banco" : "Carregando bancos..."} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="other">Outro</SelectItem>
                      {filteredBanks.map((b) => (
                        <SelectItem key={b.id} value={b.code}>
                          <div className="flex items-center gap-2">
                            {bankIconClass(b) ? (
                              <span className={`${bankIconClass(b)} text-base`}></span>
                            ) : b.logoUrl ? (
                              <img src={b.logoUrl} alt="Logo" className="w-4 h-4 rounded-sm" />
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
                <Input id="type" placeholder="Corrente, Poupança" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="balance" className="text-right">Saldo inicial</Label>
                <Input id="balance" placeholder="R$ 0,00" className="col-span-3" value={balance} onChange={(e) => setBalance(e.target.value)} />
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
              <h2 className="text-3xl font-bold text-primary">R$ 7.850,00</h2>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-primary">
              <Wallet className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="border-none shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold">Nu</div>
            <div className="flex-1">
              <h4 className="font-bold text-foreground">Conta Corrente</h4>
              <p className="text-sm text-muted-foreground">Nubank</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">R$ 5.720,50</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold">It</div>
            <div className="flex-1">
              <h4 className="font-bold text-foreground">Poupança</h4>
              <p className="text-sm text-muted-foreground">Itaú</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">R$ 2.129,50</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
