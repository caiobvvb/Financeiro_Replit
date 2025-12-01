import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectValue } from "@/components/ui/select";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cn } from "@/lib/utils";
import * as React from "react";
import { supabase } from "@/lib/supabase";
import { useRoute } from "wouter";
import { computeStatement, formatBRL } from "@/lib/billing";
import { Home, Car, Utensils, Wallet, TrendingUp, Briefcase, ShoppingCart, CreditCard, Fuel, Phone, Wifi, FileText, Gift, DollarSign, Coins, PiggyBank, Banknote, Bus, School, Heart, Stethoscope, Dumbbell, Pill, PlayCircle, Tv, Bike, Hammer, Wrench, Edit2, Trash2, Minus } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { toast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ButtonGroup } from "@/components/ui/button-group";

type CreditCardRow = { id: string; user_id: string; name: string; limit_amount: number; due_day: number; close_day: number; brand: string };
type StatementRow = { id: string; user_id: string; credit_card_id: string; year: number; month: number; status: string; total_amount: number; paid_amount: number; close_date: string; due_date: string };
type TxRow = { id: string; date: string; description?: string | null; category_id: string; amount: number; installment_count?: number | null; installment_number?: number | null; ignored?: boolean | null };
type Category = { id: string; name: string; icon?: string | null; color?: string | null };

export default function StatementsPage() {
  const [, params] = useRoute("/faturas/:cardId");
  const cardId = params?.cardId || "";
  const [card, setCard] = React.useState<CreditCardRow | null>(null);
  const today = new Date();
  const [year, setYear] = React.useState(today.getFullYear());
  const [month, setMonth] = React.useState(today.getMonth() + 1);
  const [statement, setStatement] = React.useState<StatementRow | null>(null);
  const [txs, setTxs] = React.useState<TxRow[]>([]);
  const [search, setSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("");
  const [tags, setTags] = React.useState<any[]>([]);
  const [tagFilter, setTagFilter] = React.useState<string>("");
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [selectedCats, setSelectedCats] = React.useState<string[]>([]);
  const leftListRef = React.useRef<HTMLDivElement | null>(null);
  const firstItemRef = React.useRef<HTMLDivElement | null>(null);
  const firstTitleRef = React.useRef<HTMLDivElement | null>(null);
  const rightColRef = React.useRef<HTMLDivElement | null>(null);
  const [rightOffset, setRightOffset] = React.useState(0);
  const RIGHT_SHIFT = 12;
  const [tagsByTx, setTagsByTx] = React.useState<Record<string, string[]>>({});
  const [editOpen, setEditOpen] = React.useState(false);
  const [editTx, setEditTx] = React.useState<TxRow | null>(null);
  const [editMode, setEditMode] = React.useState<"single" | "bulk">("single");
  const [editAmountStr, setEditAmountStr] = React.useState("");
  const [editDesc, setEditDesc] = React.useState("");
  const [bulkTotalStr, setBulkTotalStr] = React.useState("");
  const [editSaving, setEditSaving] = React.useState(false);
  const [editCategoryId, setEditCategoryId] = React.useState<string>("");
  const [editTags, setEditTags] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [payOpen, setPayOpen] = React.useState(false);
  const [payAmountStr, setPayAmountStr] = React.useState("");
  const [payFull, setPayFull] = React.useState(false);
  const [editStmtOpen, setEditStmtOpen] = React.useState(false);
  const [editStatus, setEditStatus] = React.useState<string>("open");
  const [editCloseDate, setEditCloseDate] = React.useState<string>("");
  const [editDueDate, setEditDueDate] = React.useState<string>("");
  const [editStmtError, setEditStmtError] = React.useState<string>("");

  React.useEffect(() => { fetchAll(); }, [cardId, year, month]);
  React.useLayoutEffect(() => {
    const left = leftListRef.current;
    const title = firstTitleRef.current;
    const first = firstItemRef.current;
    if (left && (title || first)) {
      const l = left.getBoundingClientRect();
      const base = (title || first)!.getBoundingClientRect();
      setRightOffset((base.top - l.top) + RIGHT_SHIFT);
    } else {
      setRightOffset(0);
    }
    function onResize() {
      const l2 = leftListRef.current;
      const t2 = firstTitleRef.current;
      const f2 = firstItemRef.current;
      if (l2 && (t2 || f2)) {
        const lr = l2.getBoundingClientRect();
        const br = (t2 || f2)!.getBoundingClientRect();
        setRightOffset((br.top - lr.top) + RIGHT_SHIFT);
      }
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [txs, selectedCats, selectedTags, search]);

  async function fetchAll() {
    if (!cardId) return;
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setLoading(false); return; }
    const { data: cards } = await supabase.from("credit_cards").select("id,user_id,name,limit_amount,due_day,close_day,brand").eq("id", cardId).limit(1);
    const cc = (cards?.[0] || null) as any;
    setCard(cc);
    if (!cc) { setLoading(false); return; }
    // ensure statement
    const { data: st } = await supabase
      .from("statements")
      .select("id,user_id,credit_card_id,year,month,status,total_amount,paid_amount,close_date,due_date")
      .eq("credit_card_id", cardId)
      .eq("year", year)
      .eq("month", month)
      .limit(1);
    let stmt = st?.[0] as any;
    if (!stmt) {
      const ref = computeStatement(cc, new Date(year, month - 1, cc.close_day).toISOString().slice(0,10));
      const payload = {
        user_id: userData.user.id,
        credit_card_id: cardId,
        year,
        month,
        status: "open",
        total_amount: 0,
        paid_amount: 0,
        close_date: ref.cycle_end.toISOString().slice(0,10),
        due_date: ref.statement_due.toISOString().slice(0,10)
      } as any;
      const { data: created } = await supabase.from("statements").insert(payload).select();
      stmt = created?.[0] as any;
    }
    setStatement(stmt);
    const { data: txdata } = await supabase
      .from("transactions")
      .select("id,date,description,category_id,amount,installment_count,installment_number,ignored")
      .eq("credit_card_id", cardId)
      .eq("statement_year", year)
      .eq("statement_month", month)
      .eq("ignored", false)
      .order("date", { ascending: true });
    setTxs((txdata || []) as any);
    const { data: t } = await supabase.from("tags").select("id,name").order("name");
    setTags(t || []);
    const { data: cats } = await supabase.from("categories").select("id,name,icon,color").eq("type","expense");
    setCategories((cats||[]) as any);
    const ids = (txdata || []).map((r:any)=>r.id);
    if (ids.length) {
      const { data: tt } = await supabase.from("transaction_tags").select("transaction_id,tag_id").in("transaction_id", ids);
      const map: Record<string, string[]> = {};
      (tt||[]).forEach((row:any)=>{ map[row.transaction_id] = [...(map[row.transaction_id]||[]), row.tag_id]; });
      setTagsByTx(map);
    } else {
      setTagsByTx({});
    }
    const total = (txdata || []).reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);
    let paid = 0;
    if (stmt?.id) {
      const { data: pays } = await supabase.from("statement_payments").select("amount").eq("statement_id", stmt.id);
      paid = (pays || []).reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0);
      await supabase.from("statements").update({ total_amount: total, paid_amount: paid }).eq("id", stmt.id);
      setStatement((prev) => prev ? { ...prev, total_amount: total, paid_amount: paid } : prev);
    }
    setLoading(false);
  }

  function monthLabel(y: number, m: number) {
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  }

  async function payStatement() {
    if (!statement) return;
    const remaining = Number(statement.total_amount) - Number(statement.paid_amount || 0);
    const amount = payFull ? remaining : parseMoney(payAmountStr);
    if (!amount || amount <= 0) return;
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const { error } = await supabase.from("statement_payments").insert({ user_id: userData.user.id, statement_id: statement.id, amount, date: new Date().toISOString().slice(0,10) });
    if (error) { toast({ title: "Erro ao pagar fatura", description: "Tente novamente", variant: "destructive" }); return; }
    await fetchAll();
    setPayOpen(false);
    setPayAmountStr("");
    setPayFull(false);
    toast({ title: "Pagamento registrado", description: `Valor pago: ${formatBRL(amount)}` });
  }

  React.useEffect(() => {
    let chan: any;
    (async () => {
      if (!statement) return;
      chan = supabase
        .channel(`fatura-${cardId}-${year}-${month}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `statement_year=eq.${year}` }, () => fetchAll())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `statement_month=eq.${month}` }, () => fetchAll())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `credit_card_id=eq.${cardId}` }, () => fetchAll())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transaction_tags' }, () => fetchAll())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'statement_payments', filter: `statement_id=eq.${statement.id}` }, () => fetchAll())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'statements', filter: `id=eq.${statement.id}` }, () => fetchAll())
        .subscribe();
    })();
    return () => { if (chan) supabase.removeChannel(chan); };
  }, [statement, cardId, year, month]);

  function openEditStatement() {
    if (!statement) return;
    setEditStatus(statement.status || 'open');
    setEditCloseDate(statement.close_date || '');
    setEditDueDate(statement.due_date || '');
    setEditStmtError("");
    setEditStmtOpen(true);
  }

  async function saveEditStatement() {
    if (!statement) return;
    const allowed = ['open','closed','paid'];
    const st = allowed.includes(editStatus) ? editStatus : 'open';
    const cd = editCloseDate;
    const dd = editDueDate;
    if (!cd || !dd) { toast({ title: "Datas obrigatórias", description: "Informe fechamento e vencimento", variant: "destructive" }); return; }
    const closeDateObj = new Date(cd);
    const dueDateObj = new Date(dd);
    if (!(closeDateObj < dueDateObj)) { toast({ title: "Datas inconsistentes", description: "Fechamento deve ser anterior ao vencimento", variant: "destructive" }); return; }
    const cMonth = closeDateObj.getMonth()+1, cYear = closeDateObj.getFullYear();
    if (cMonth !== month || cYear !== year) { toast({ title: "Fechamento no mês errado", description: "Ajuste para o mês/ano da fatura", variant: "destructive" }); return; }
    const expectedDueMonth = month === 12 ? 1 : month+1;
    const expectedDueYear = month === 12 ? year+1 : year;
    const dMonth = dueDateObj.getMonth()+1, dYear = dueDateObj.getFullYear();
    if (dMonth !== expectedDueMonth || dYear !== expectedDueYear) { toast({ title: "Vencimento fora do ciclo", description: "Deve ser no mês seguinte", variant: "destructive" }); return; }
    if (card?.close_day && closeDateObj.getDate() !== Number(card.close_day)) { toast({ title: "Dia de fechamento divergente", description: `Esperado ${card.close_day}`, variant: "destructive" }); return; }
    if (card?.due_day && dueDateObj.getDate() !== Number(card.due_day)) { toast({ title: "Dia de vencimento divergente", description: `Esperado ${card.due_day}`, variant: "destructive" }); return; }
    const ok = window.confirm('Confirmar atualização da fatura?');
    if (!ok) return;
    const { error } = await supabase.from('statements').update({ status: st, close_date: cd, due_date: dd }).eq('id', statement.id);
    if (error) { toast({ title: "Erro ao atualizar fatura", variant: "destructive" }); return; }
    setEditStmtOpen(false);
    await fetchAll();
    toast({ title: "Fatura atualizada", description: "Dados salvos com sucesso" });
  }

  React.useEffect(() => {
    const cd = editCloseDate;
    const dd = editDueDate;
    if (!cd || !dd) { setEditStmtError("Informe fechamento e vencimento"); return; }
    const closeDateObj = new Date(cd);
    const dueDateObj = new Date(dd);
    if (!(closeDateObj < dueDateObj)) { setEditStmtError("Fechamento deve ser anterior ao vencimento"); return; }
    const cMonth = closeDateObj.getMonth()+1, cYear = closeDateObj.getFullYear();
    if (cMonth !== month || cYear !== year) { setEditStmtError("Fechamento deve estar no mês/ano da fatura"); return; }
    const expectedDueMonth = month === 12 ? 1 : month+1;
    const expectedDueYear = month === 12 ? year+1 : year;
    const dMonth = dueDateObj.getMonth()+1, dYear = dueDateObj.getFullYear();
    if (dMonth !== expectedDueMonth || dYear !== expectedDueYear) { setEditStmtError("Vencimento deve ser no mês seguinte"); return; }
    if (card?.close_day && closeDateObj.getDate() !== Number(card.close_day)) { setEditStmtError(`Dia de fechamento deve ser ${card.close_day}`); return; }
    if (card?.due_day && dueDateObj.getDate() !== Number(card.due_day)) { setEditStmtError(`Dia de vencimento deve ser ${card.due_day}`); return; }
    setEditStmtError("");
  }, [editCloseDate, editDueDate, month, year, card]);

  function exportCsv() {
    const tagName = new Map((tags||[]).map((t:any)=>[t.id,t.name]));
    const rows = txs.filter(txMatchesFilters).map((t)=>{
      const c = categories.find((x)=>x.id===t.category_id);
      const tagStr = (tagsByTx[t.id]||[]).map((id)=>tagName.get(id)||'').join('|');
      const parcela = (t.installment_count && t.installment_count>1) ? `${t.installment_number}/${t.installment_count}` : '';
      return [t.date, t.description||'', c?.name||'', tagStr, parcela, Number(t.amount).toFixed(2)];
    });
    let csv = 'Data,Descrição,Categoria,Tags,Parcelamento,Valor\n' + rows.map((r)=> r.map((s)=> '"'+String(s).replace(/"/g,'""')+'"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fatura-${card?.name || cardId}-${year}-${String(month).padStart(2,'0')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function txMatchesFilters(t: TxRow) {
    const catOk = selectedCats.length ? selectedCats.includes(t.category_id) : true;
    const tagOk = selectedTags.length ? (tagsByTx[t.id]||[]).some((id)=>selectedTags.includes(id)) : true;
    const searchOk = search ? (t.description||"").toLowerCase().includes(search.toLowerCase()) : true;
    return catOk && tagOk && searchOk;
  }

  function openEdit(t: TxRow) {
    setEditTx(t);
    setEditMode("single");
    setEditAmountStr(formatMoneyInput(String(Math.abs(Number(t.amount||0)*100)).replace(/\D/g, "")));
    setEditDesc(t.description || "");
    setBulkTotalStr("");
    setEditCategoryId(t.category_id);
    setEditTags([...(tagsByTx[t.id] || [])]);
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!editTx || editSaving) return;
    setEditSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setEditSaving(false); return; }
    if (editMode === "single") {
      const amt = parseMoney(editAmountStr);
      const payload: any = { amount: amt };
      if (editCategoryId) payload.category_id = editCategoryId;
      if (editDesc.trim()) payload.description = editDesc.trim();
      await supabase.from("transactions").update(payload).eq("id", editTx.id);
      const current = tagsByTx[editTx.id] || [];
      const toAdd = editTags.filter((id)=> !current.includes(id));
      const toRemove = current.filter((id)=> !editTags.includes(id));
      if (toAdd.length) {
        await supabase.from("transaction_tags").insert(toAdd.map((tagId)=> ({ transaction_id: editTx.id, tag_id: tagId })));
      }
      if (toRemove.length) {
        for (const tagId of toRemove) {
          await supabase.from("transaction_tags").delete().eq("transaction_id", editTx.id).eq("tag_id", tagId);
        }
      }
    } else {
      const tx = editTx;
      const total = parseMoney(bulkTotalStr);
      const remaining = (tx.installment_count || 1) - (tx.installment_number || 1) + 1;
      if (!remaining || remaining < 1 || !total) { setEditSaving(false); return; }
      const per = Math.floor((total * 100) / remaining) / 100;
      const remainder = Number((total - per * (remaining - 1)).toFixed(2));
      const { data: rows } = await supabase
        .from("transactions")
        .select("id,installment_number")
        .eq("credit_card_id", tx as any ? (tx as any).credit_card_id : null)
        .eq("description", tx.description || null)
        .eq("installment_count", tx.installment_count || 1)
        .gte("installment_number", tx.installment_number || 1);
      const list = (rows||[]).sort((a:any,b:any)=>Number(a.installment_number)-Number(b.installment_number));
      for (let i=0;i<list.length;i++) {
        const row = list[i];
        const amount = (i === list.length-1) ? remainder : per;
        await supabase.from("transactions").update({ amount }).eq("id", row.id);
      }
    }
    setEditSaving(false);
    setEditOpen(false);
    await fetchAll();
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

  const totalAmount = React.useMemo(() => {
    return txs.reduce((acc, t) => acc + Number(t.amount || 0), 0);
  }, [txs]);

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Fatura</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setMonth((m) => (m === 1 ? (setYear((y)=>y-1), 12) : m-1))}>{"<"}</Button>
            <div className="px-3 py-1 rounded-full border text-sm">{monthLabel(year, month)}</div>
            <Button variant="outline" onClick={() => setMonth((m) => (m === 12 ? (setYear((y)=>y+1), 1) : m+1))}>{">"}</Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Input placeholder="Buscar descrição" className="w-56" value={search} onChange={(e)=>setSearch(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <ButtonGroup>
              <Button onClick={() => setPayOpen(true)}>Pagamento</Button>
              <Button variant="outline" onClick={openEditStatement}>Editar Fatura</Button>
              <Button variant="outline" onClick={()=>{ const d = new Date(); const qs = new URLSearchParams({ add: "1", card: cardId, date: d.toISOString().slice(0,10) }); location.href = `/accounts?${qs.toString()}`; }}>Adicionar Despesa</Button>
              <Button variant="outline" onClick={exportCsv}>Exportar CSV</Button>
            </ButtonGroup>
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="h-8">Filtros</Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-3 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground">Categorias:</span>
                    {categories.map((c)=> (
                      <Toggle key={c.id} pressed={selectedCats.includes(c.id)} onPressedChange={(on)=>setSelectedCats((prev)=> on ? [...prev,c.id] : prev.filter((x)=>x!==c.id))} className="h-7 px-2 text-xs border rounded data-[state=on]:bg-emerald-500 data-[state=on]:text-white">{c.name}</Toggle>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground">Tags:</span>
                    {tags.map((t)=> (
                      <Toggle key={t.id} pressed={selectedTags.includes(t.id)} onPressedChange={(on)=>setSelectedTags((prev)=> on ? [...prev,t.id] : prev.filter((x)=>x!==t.id))} className="h-7 px-2 text-xs border rounded data-[state=on]:bg-emerald-500 data-[state=on]:text-white">{t.name}</Toggle>
                    ))}
                    <Button variant="ghost" className="h-7 text-xs" onClick={()=>{ setSelectedTags([]); setSelectedCats([]); setSearch(''); }}>Limpar filtros</Button>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
          <div ref={leftListRef} className="space-y-3">
            {txs.filter(txMatchesFilters).map((t, i) => (
              <div ref={i===0 ? firstItemRef : undefined}>
                <Card key={t.id} className="border-none shadow-sm">
                <CardContent className="p-4 grid grid-cols-[1fr_auto] items-start gap-3">
                  <div className="flex items-start gap-3">
                    <div>
                      <div ref={i===0 ? firstTitleRef : undefined} className="text-sm font-medium text-foreground flex items-center gap-2">
                        <span>{t.description || "Sem descrição"}</span>
                        {t.installment_count && t.installment_count > 1 ? (
                          <span className="px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">
                            {t.installment_number}/{t.installment_count}
                          </span>
                        ) : null}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>{t.date}</span>
                        <span>•</span>
                        {(() => {
                          const c = categories.find((x)=>x.id===t.category_id);
                          return (
                            <span className="flex items-center gap-1">
                              <IconByName name={c?.icon} color={c?.color || undefined} className="w-4 h-4" />
                              {c?.name || "-"}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-24 sm:w-28 md:w-32 text-right">
                      <div className="font-mono font-semibold text-red-600 leading-none">{formatBRL(Number(t.amount))}</div>
                    </div>
                    <div className="flex items-center gap-2 h-8 mt-[2px]">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openEdit(t)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-amber-600" onClick={async () => { const { error } = await supabase.from("transactions").update({ ignored: true }).eq("id", t.id); if (error) toast({ title: "Erro ao ignorar", variant: "destructive" }); else { toast({ title: "Transação ignorada" }); await fetchAll(); } }}>
                        <Minus className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={async () => { const { error } = await supabase.from("transactions").delete().eq("id", t.id); if (error) toast({ title: "Erro ao excluir", variant: "destructive" }); else { toast({ title: "Transação excluída" }); await fetchAll(); } }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              </div>
            ))}
            {txs.length === 0 ? (
              <Card className="border-none shadow-sm">
                <CardContent className="p-6 text-sm text-muted-foreground">Sem despesas neste período</CardContent>
              </Card>
            ) : null}
          </div>
        </div>
        <div ref={rightColRef} style={{ marginTop: rightOffset }} className="flex flex-col gap-4">
          <Card className="border-none shadow-sm"><CardContent className="p-4"><div className="text-sm text-muted-foreground">Valor da fatura</div><div className="text-2xl font-bold">{formatBRL(Number(totalAmount))}</div></CardContent></Card>
          <Card className="border-none shadow-sm"><CardContent className="p-4"><div className="text-sm text-muted-foreground">Valor pago</div><div className="text-2xl font-bold text-emerald-600">{formatBRL(Number(statement?.paid_amount || 0))}</div></CardContent></Card>
          <Card className="border-none shadow-sm"><CardContent className="p-4"><div className="text-sm text-muted-foreground">Saldo pendente</div><div className="text-2xl font-bold text-red-600">{formatBRL(Math.max(0, Number(totalAmount) - Number(statement?.paid_amount || 0)))}</div></CardContent></Card>
          <Card className="border-none shadow-sm"><CardContent className="p-4"><div className="text-sm text-muted-foreground">Status</div><div className="text-lg font-semibold">{statement?.status === 'paid' ? 'Fatura paga' : statement?.status === 'closed' ? 'Fatura fechada' : 'Fatura aberta'}</div></CardContent></Card>
          <Card className="border-none shadow-sm"><CardContent className="p-4"><div className="text-sm text-muted-foreground">Dia de fechamento</div><div className="text-lg">{statement?.close_date || '-'}</div></CardContent></Card>
          <Card className="border-none shadow-sm"><CardContent className="p-4"><div className="text-sm text-muted-foreground">Data vencimento</div><div className="text-lg">{statement?.due_date || '-'}</div></CardContent></Card>
        </div>
      </div>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader><DialogTitle>Pagamento da fatura</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-4 items-center gap-2">
              <Label className="text-right">Valor</Label>
              <Input className="col-span-3" value={payAmountStr} onChange={(e)=>setPayAmountStr(formatMoneyInput(e.target.value))} disabled={payFull} />
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
              <Label className="text-right">Total</Label>
              <div className="col-span-3 text-sm">{formatBRL(Number(statement?.total_amount || 0))}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
              <Label className="text-right">Pago</Label>
              <div className="col-span-3 text-sm">{formatBRL(Number(statement?.paid_amount || 0))}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
              <Label className="text-right">Pagar tudo</Label>
              <input type="checkbox" checked={payFull} onChange={(e)=>setPayFull(e.target.checked)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={payStatement}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader><DialogTitle>Editar despesa</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-4 items-center gap-2">
              <Label className="text-right">Modo</Label>
              <div className="col-span-3 flex items-center gap-3">
                <Toggle pressed={editMode==='single'} onPressedChange={()=>setEditMode('single')} className="h-7 px-2 text-xs border rounded data-[state=on]:bg-emerald-500 data-[state=on]:text-white">Apenas esta</Toggle>
                <Toggle pressed={editMode==='bulk'} onPressedChange={()=>setEditMode('bulk')} className="h-7 px-2 text-xs border rounded data-[state=on]:bg-emerald-500 data-[state=on]:text-white">Esta e futuras</Toggle>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
              <Label className="text-right">Categoria</Label>
              <div className="col-span-3">
                <Select value={editCategoryId} onValueChange={setEditCategoryId}>
                  <SelectTrigger>
                    <div className="flex items-center gap-2 w-full">
                      {(() => { const c = categories.find((x)=>x.id===editCategoryId); return c ? <IconByName name={c.icon} color={c.color||undefined} className="w-4 h-4" /> : null; })()}
                      <SelectValue placeholder="Selecione" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c)=> (
                      <SelectPrimitive.Item key={c.id} value={c.id} className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground">
                        <div className="flex items-center gap-2"><IconByName name={c.icon} color={c.color||undefined} className="w-4 h-4" /><SelectPrimitive.ItemText>{c.name}</SelectPrimitive.ItemText></div>
                        <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center"><SelectPrimitive.ItemIndicator /></span>
                      </SelectPrimitive.Item>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
              <Label className="text-right">Tags</Label>
              <div className="col-span-3 flex flex-wrap items-center gap-2">
                {tags.map((t)=> (
                  <Toggle key={t.id} pressed={editTags.includes(t.id)} onPressedChange={(on)=> setEditTags((prev)=> on ? [...prev, t.id] : prev.filter((x)=> x!==t.id))} className="h-7 px-2 text-xs border rounded data-[state=on]:bg-emerald-500 data-[state=on]:text-white">{t.name}</Toggle>
                ))}
              </div>
            </div>
            {editMode==='single' ? (
              <>
                <div className="grid grid-cols-4 items-center gap-2">
                  <Label className="text-right">Valor</Label>
                  <Input className="col-span-3" value={editAmountStr} onChange={(e)=>setEditAmountStr(formatMoneyInput(e.target.value))} />
                </div>
                <div className="grid grid-cols-4 items-center gap-2">
                  <Label className="text-right">Descrição</Label>
                  <Input className="col-span-3" value={editDesc} onChange={(e)=>setEditDesc(e.target.value)} />
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-4 items-center gap-2">
                  <Label className="text-right">Total restante</Label>
                  <Input className="col-span-3" value={bulkTotalStr} onChange={(e)=>setBulkTotalStr(formatMoneyInput(e.target.value))} />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button onClick={saveEdit} disabled={editSaving}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={editStmtOpen} onOpenChange={setEditStmtOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader><DialogTitle>Editar Fatura</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-4 items-center gap-2">
              <Label className="text-right">Status</Label>
              <div className="col-span-3">
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectPrimitive.Item value="open" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground"><SelectPrimitive.ItemText>Aberta</SelectPrimitive.ItemText></SelectPrimitive.Item>
                    <SelectPrimitive.Item value="closed" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground"><SelectPrimitive.ItemText>Fechada</SelectPrimitive.ItemText></SelectPrimitive.Item>
                    <SelectPrimitive.Item value="paid" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground"><SelectPrimitive.ItemText>Paga</SelectPrimitive.ItemText></SelectPrimitive.Item>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
              <Label className="text-right">Fechamento</Label>
              <Input type="date" className="col-span-3" value={editCloseDate} onChange={(e)=>setEditCloseDate(e.target.value)} />
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
              <Label className="text-right">Vencimento</Label>
              <Input type="date" className="col-span-3" value={editDueDate} onChange={(e)=>setEditDueDate(e.target.value)} />
            </div>
            {editStmtError ? <div className="text-xs text-red-600">{editStmtError}</div> : null}
          </div>
          <DialogFooter>
            <Button onClick={saveEditStatement} disabled={!!editStmtError}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
const iconMap: Record<string, React.ComponentType<any>> = { Home, Car, Utensils, Wallet, TrendingUp, Briefcase, ShoppingCart, CreditCard, Fuel, Phone, Wifi, FileText, Gift, DollarSign, Coins, PiggyBank, Banknote, Bus, School, Heart, Stethoscope, Dumbbell, Pill, PlayCircle, Tv, Bike, Hammer, Wrench };
function IconByName({ name, className, color }: { name?: string | null; className?: string; color?: string | null }) {
  const key = (name || "").trim();
  const Comp = iconMap[key] || Utensils;
  return <Comp className={className} style={{ color: color || undefined }} />;
}
