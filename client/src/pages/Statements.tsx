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
import { useRoute, useLocation } from "wouter";
import { computeStatement, formatBRL } from "@/lib/billing";
import { Home, Car, Utensils, Wallet, TrendingUp, Briefcase, ShoppingCart, CreditCard, Fuel, Phone, Wifi, FileText, Gift, DollarSign, Coins, PiggyBank, Banknote, Bus, School, Heart, Stethoscope, Dumbbell, Pill, PlayCircle, Tv, Bike, Hammer, Wrench, Edit2, Trash2, Minus, Filter, Download, Plus, Calendar, BarChart3 } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { toast } from "@/hooks/use-toast";
  import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { PdfImportDialog } from "@/components/transactions/PdfImportDialog";
import { ExcelImportDialog } from "@/components/transactions/ExcelImportDialog";

type CreditCardRow = { id: string; user_id: string; name: string; limit_amount: number; due_day: number; close_day: number; brand: string };
type StatementRow = { id: string; user_id: string; credit_card_id: string; year: number; month: number; status: string; total_amount: number; paid_amount: number; close_date: string; due_date: string };
type TxRow = { id: string; date: string; description?: string | null; category_id: string; amount: number; installment_count?: number | null; installment_number?: number | null; ignored?: boolean | null };
type Category = { id: string; name: string; icon?: string | null; color?: string | null };

function BrandIcon({ brand, className }: { brand: string; className?: string }) {
  const b = (brand || "").toLowerCase();
  if (b === "mastercard") {
    return (
      <svg viewBox="0 0 48 24" className={className}><circle cx="16" cy="12" r="9" fill="#EB001B" /><circle cx="32" cy="12" r="9" fill="#F79E1B" opacity="0.9" /></svg>
    );
  }
  if (b === "visa") {
    return (
      <svg viewBox="0 0 48 24" className={className}><rect width="48" height="24" fill="#0A1F44" /><text x="24" y="16" fontSize="10" fill="#FFFFFF" textAnchor="middle" fontFamily="Arial">VISA</text></svg>
    );
  }
  if (b === "amex") {
    return (
      <svg viewBox="0 0 48 24" className={className}><rect width="48" height="24" fill="#2E77BB" /><text x="24" y="16" fontSize="9" fill="#FFFFFF" textAnchor="middle" fontFamily="Arial">AMEX</text></svg>
    );
  }
  if (b === "elo") {
    return (
      <svg viewBox="0 0 48 24" className={className}><circle cx="12" cy="12" r="5" fill="#000" /><circle cx="24" cy="12" r="5" fill="#FFD400" /><circle cx="36" cy="12" r="5" fill="#E60000" /></svg>
    );
  }
  if (b === "hipercard") {
    return (
      <svg viewBox="0 0 48 24" className={className}><rect width="48" height="24" rx="4" fill="#9D0B0B" /><text x="24" y="16" fontSize="8" fill="#FFFFFF" textAnchor="middle" fontFamily="Arial">HIPERCARD</text></svg>
    );
  }
  return <div className={className}></div>;
}

export default function StatementsPage() {
  const [, params] = useRoute("/faturas/:cardId");
  const [, setLocation] = useLocation();
  const cardId = params?.cardId || "";
  const [allCards, setAllCards] = React.useState<CreditCardRow[]>([]);
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
  const [tagsByTx, setTagsByTx] = React.useState<Record<string, string[]>>({});
  const [editOpen, setEditOpen] = React.useState(false);
  const [editTx, setEditTx] = React.useState<TxRow | null>(null);
  const [editMode, setEditMode] = React.useState<"single" | "bulk">("single");
  const [editAmountStr, setEditAmountStr] = React.useState("");
  const [editDesc, setEditDesc] = React.useState("");
  const [editSaving, setEditSaving] = React.useState(false);
  const [editCategoryId, setEditCategoryId] = React.useState<string>("");
  const [editTags, setEditTags] = React.useState<string[]>([]);
  const [genCountStr, setGenCountStr] = React.useState("");
  const [genConfirmOpen, setGenConfirmOpen] = React.useState(false);
  const [genPreview, setGenPreview] = React.useState<{ date: string; amount: number; number: number }[]>([]);
  const [genError, setGenError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [payOpen, setPayOpen] = React.useState(false);
  const [payAmountStr, setPayAmountStr] = React.useState("");
  const [payFull, setPayFull] = React.useState(false);
  const [editStmtOpen, setEditStmtOpen] = React.useState(false);
  const [editStatus, setEditStatus] = React.useState<string>("open");
  const [editCloseDate, setEditCloseDate] = React.useState<string>("");
  const [editDueDate, setEditDueDate] = React.useState<string>("");
  const [editStmtError, setEditStmtError] = React.useState<string>("");
  const [pdfOpen, setPdfOpen] = React.useState(false);
  const [excelOpen, setExcelOpen] = React.useState(false);

  React.useEffect(() => { fetchAll(); }, [cardId, year, month]);

  async function fetchAll() {
    if (!cardId) return;
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setLoading(false); return; }

    // Fetch all cards
    const { data: allCardsData } = await supabase.from("credit_cards").select("id,user_id,name,limit_amount,due_day,close_day,brand").order("name");
    setAllCards((allCardsData || []) as any);

    const cc = (allCardsData || []).find((c: any) => c.id === cardId) || null;
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
      const ref = computeStatement(cc, new Date(year, month - 1, cc.close_day).toISOString().slice(0, 10));
      const payload = {
        user_id: userData.user.id,
        credit_card_id: cardId,
        year,
        month,
        status: "open",
        total_amount: 0,
        paid_amount: 0,
        close_date: ref.cycle_end.toISOString().slice(0, 10),
        due_date: ref.statement_due.toISOString().slice(0, 10)
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
    const { data: cats } = await supabase.from("categories").select("id,name,icon,color").eq("type", "expense");
    setCategories((cats || []) as any);
    const ids = (txdata || []).map((r: any) => r.id);
    if (ids.length) {
      const { data: tt } = await supabase.from("transaction_tags").select("transaction_id,tag_id").in("transaction_id", ids);
      const map: Record<string, string[]> = {};
      (tt || []).forEach((row: any) => { map[row.transaction_id] = [...(map[row.transaction_id] || []), row.tag_id]; });
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
    const { error } = await supabase.from("statement_payments").insert({ user_id: userData.user.id, statement_id: statement.id, amount, date: new Date().toISOString().slice(0, 10) });
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
    const allowed = ['open', 'closed', 'paid'];
    const st = allowed.includes(editStatus) ? editStatus : 'open';
    const cd = editCloseDate;
    const dd = editDueDate;
    if (!cd || !dd) { toast({ title: "Datas obrigatórias", description: "Informe fechamento e vencimento", variant: "destructive" }); return; }
    const closeDateObj = new Date(cd);
    const dueDateObj = new Date(dd);
    if (!(closeDateObj < dueDateObj)) { toast({ title: "Datas inconsistentes", description: "Fechamento deve ser anterior ao vencimento", variant: "destructive" }); return; }
    const cMonth = closeDateObj.getMonth() + 1, cYear = closeDateObj.getFullYear();
    if (cMonth !== month || cYear !== year) { toast({ title: "Fechamento no mês errado", description: "Ajuste para o mês/ano da fatura", variant: "destructive" }); return; }
    const expectedDueMonth = month === 12 ? 1 : month + 1;
    const expectedDueYear = month === 12 ? year + 1 : year;
    const dMonth = dueDateObj.getMonth() + 1, dYear = dueDateObj.getFullYear();
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
    const cMonth = closeDateObj.getMonth() + 1, cYear = closeDateObj.getFullYear();
    if (cMonth !== month || cYear !== year) { setEditStmtError("Fechamento deve estar no mês/ano da fatura"); return; }
    const expectedDueMonth = month === 12 ? 1 : month + 1;
    const expectedDueYear = month === 12 ? year + 1 : year;
    const dMonth = dueDateObj.getMonth() + 1, dYear = dueDateObj.getFullYear();
    if (dMonth !== expectedDueMonth || dYear !== expectedDueYear) { setEditStmtError("Vencimento deve ser no mês seguinte"); return; }
    if (card?.close_day && closeDateObj.getDate() !== Number(card.close_day)) { setEditStmtError(`Dia de fechamento deve ser ${card.close_day}`); return; }
    if (card?.due_day && dueDateObj.getDate() !== Number(card.due_day)) { setEditStmtError(`Dia de vencimento deve ser ${card.due_day}`); return; }
    setEditStmtError("");
  }, [editCloseDate, editDueDate, month, year, card]);

  function exportCsv() {
    const tagName = new Map((tags || []).map((t: any) => [t.id, t.name]));
    const rows = txs.filter(txMatchesFilters).map((t) => {
      const c = categories.find((x) => x.id === t.category_id);
      const tagStr = (tagsByTx[t.id] || []).map((id) => tagName.get(id) || '').join('|');
      const parcela = (t.installment_count && t.installment_count > 1) ? `${t.installment_number}/${t.installment_count}` : '';
      return [t.date, t.description || '', c?.name || '', tagStr, parcela, Number(t.amount).toFixed(2)];
    });
    let csv = 'Data,Descrição,Categoria,Tags,Parcelamento,Valor\n' + rows.map((r) => r.map((s) => '"' + String(s).replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fatura-${card?.name || cardId}-${year}-${String(month).padStart(2, '0')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function txMatchesFilters(t: TxRow) {
    const catOk = selectedCats.length ? selectedCats.includes(t.category_id) : true;
    const tagOk = selectedTags.length ? (tagsByTx[t.id] || []).some((id) => selectedTags.includes(id)) : true;
    const searchOk = search ? (t.description || "").toLowerCase().includes(search.toLowerCase()) : true;
    return catOk && tagOk && searchOk;
  }

  function openEdit(t: TxRow) {
    setEditTx(t);
    setEditMode("single");
    setEditAmountStr(formatMoneyInput(String(Math.abs(Number(t.amount || 0) * 100)).replace(/\D/g, "")));
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
      const toAdd = editTags.filter((id) => !current.includes(id));
      const toRemove = current.filter((id) => !editTags.includes(id));
      if (toAdd.length) {
        await supabase.from("transaction_tags").insert(toAdd.map((tagId) => ({ transaction_id: editTx.id, tag_id: tagId })));
      }
      if (toRemove.length) {
        for (const tagId of toRemove) {
          await supabase.from("transaction_tags").delete().eq("transaction_id", editTx.id).eq("tag_id", tagId);
        }
      }
    } else {
      const tx = editTx;
      // Bulk update only updates category, description and tags for now
      // Amount redistribution removed as per user request
      const { data: rows } = await supabase
        .from("transactions")
        .select("id")
        .eq("credit_card_id", tx as any ? (tx as any).credit_card_id : null)
        .eq("description", tx.description || null)
        .eq("installment_count", tx.installment_count || 1)
        .gte("installment_number", tx.installment_number || 1);
      
      const list = (rows || []);
      const ids = list.map((r: any) => r.id);
      
      if (ids.length) {
          const payload: any = {};
          if (editCategoryId) payload.category_id = editCategoryId;
          if (editDesc.trim()) payload.description = editDesc.trim();
          
          if (Object.keys(payload).length) {
            await supabase.from("transactions").update(payload).in("id", ids);
          }
      }
    }
    setEditSaving(false);
    setEditOpen(false);
    await fetchAll();
  }

  function computeStatementLocal(card: any, dateStr: string) {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = d.getMonth();
    const close = Number(card?.close_day || 1);
    const due = Number(card?.due_day || 1);
    let cycleEnd = new Date(year, month, close);
    if (d.getDate() > close) cycleEnd = new Date(year, month + 1, close);
    const cycleStart = new Date(cycleEnd); cycleStart.setMonth(cycleEnd.getMonth() - 1); cycleStart.setDate(close + 1);
    const dueDate = new Date(cycleEnd); dueDate.setMonth(dueDate.getMonth() + 1); dueDate.setDate(due);
    return {
      statement_year: cycleEnd.getFullYear(),
      statement_month: cycleEnd.getMonth() + 1,
      cycle_start: cycleStart.toISOString().slice(0,10),
      cycle_end: cycleEnd.toISOString().slice(0,10),
      statement_due: dueDate.toISOString().slice(0,10),
    }
  }

  async function ensureStatement(userId: string, cardId: string, ref: any) {
    const { data: st } = await supabase
      .from("statements")
      .select("id")
      .eq("user_id", userId)
      .eq("credit_card_id", cardId)
      .eq("year", ref.statement_year)
      .eq("month", ref.statement_month)
      .limit(1)
    if (!st?.[0]) {
      await supabase.from("statements").insert({
        user_id: userId,
        credit_card_id: cardId,
        year: ref.statement_year,
        month: ref.statement_month,
        status: "open",
        total_amount: 0,
        paid_amount: 0,
        close_date: ref.cycle_end,
        due_date: ref.statement_due,
      })
    }
  }

  function openGeneratePreview() {
    setGenError("");
    if (!editTx || !card) return;
    const count = genCountStr ? parseInt(genCountStr, 10) : 0;
    if (!count || count < 1 || !Number.isInteger(count)) { setGenError("Informe uma quantidade válida (inteiro positivo)"); return; }
    const baseNum = Number(editTx.installment_number || 1);
    const baseAmount = Math.abs(Number(editTx.amount || 0));
    const preview: { date: string; amount: number; number: number }[] = [];
    for (let i = 0; i < count; i++) {
      const due = new Date(year, month + i, Number(card?.due_day || 1));
      const date = due.toISOString().slice(0, 10);
      const number = baseNum + i + 1;
      preview.push({ date, amount: baseAmount, number });
    }
    setGenPreview(preview);
    setGenConfirmOpen(true);
  }

  async function confirmGenerateInstallments() {
    if (!editTx || !card) return;
    setEditSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setEditSaving(false); return; }
    const finalNumber = genPreview.length ? genPreview[genPreview.length - 1].number : Number(editTx.installment_number || 1);
    const payloads: any[] = [];
    for (const p of genPreview) {
      const ref = computeStatementLocal(card, p.date);
      await ensureStatement(userData.user.id, cardId, ref);
      payloads.push({
        user_id: userData.user.id,
        account_id: cardId,
        credit_card_id: cardId,
        date: p.date,
        description: editTx.description || "",
        amount: p.amount,
        category_id: editTx.category_id || null,
        ignored: false,
        installment_count: finalNumber,
        installment_number: p.number,
        statement_year: ref.statement_year,
        statement_month: ref.statement_month,
        cycle_start: ref.cycle_start,
        cycle_end: ref.cycle_end,
        statement_due: ref.statement_due,
      });
    }
    if (payloads.length) {
      const { error } = await supabase.from("transactions").insert(payloads);
      if (error) { setEditSaving(false); return; }
      await supabase.from("transactions").update({ installment_count: finalNumber }).eq("id", editTx.id);
    }
    setGenConfirmOpen(false);
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
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Fatura {card?.name}</h1>
            <p className="text-muted-foreground">Gerencie suas faturas e despesas.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white rounded-lg border p-1 shadow-sm">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMonth((m) => (m === 1 ? (setYear((y) => y - 1), 12) : m - 1))}>{"<"}</Button>
              <div className="px-2 text-sm font-medium min-w-[140px] text-center capitalize">{monthLabel(year, month)}</div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMonth((m) => (m === 12 ? (setYear((y) => y + 1), 1) : m + 1))}>{">"}</Button>
            </div>
            <Input placeholder="Buscar..." className="w-full md:w-64" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex-1 min-w-0 mr-2">
                <p className="text-sm font-medium text-muted-foreground mb-1">Cartão Atual</p>
                <Select value={cardId} onValueChange={(v) => setLocation(`/faturas/${v}`)}>
                  <SelectTrigger className="w-full border-none shadow-none p-0 h-auto text-2xl font-bold focus:ring-0 px-0">
                    <SelectValue>{card?.name}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {allCards.map((c) => (
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
              <div className="w-12 h-8 flex items-center justify-center shrink-0">
                <BrandIcon brand={card?.brand || ""} className="w-full h-full" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Valor da Fatura</p>
                <h2 className="text-2xl font-bold text-foreground">{formatBRL(Number(totalAmount))}</h2>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-foreground">
                <FileText className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Valor Pago</p>
                <h2 className="text-2xl font-bold text-emerald-600">{formatBRL(Number(statement?.paid_amount || 0))}</h2>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600">
                <Wallet className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full capitalize",
                  statement?.status === 'paid' ? "bg-emerald-100 text-emerald-700" :
                    statement?.status === 'closed' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700")}>
                  {statement?.status === 'paid' ? 'Paga' : statement?.status === 'closed' ? 'Fechada' : 'Aberta'}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Fechamento:</span>
                  <span className="font-medium">{statement?.close_date ? new Date(statement.close_date).toLocaleDateString('pt-BR') : '-'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Vencimento:</span>
                  <span className="font-medium">{statement?.due_date ? new Date(statement.due_date).toLocaleDateString('pt-BR') : '-'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button onClick={() => setPayOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <DollarSign className="w-4 h-4 mr-2" />
              Pagar Fatura
            </Button>
            <Button variant="outline" onClick={() => { const d = new Date(); const qs = new URLSearchParams({ add: "1", card: cardId, date: d.toISOString().slice(0, 10) }); location.href = `/accounts?${qs.toString()}`; }}>
              <Plus className="w-4 h-4 mr-2" />
              Despesa
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setLocation(`/faturas/${cardId}/overview`)}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Visão Geral
            </Button>
          <Button variant="ghost" size="sm" onClick={openEditStatement}>
            <Calendar className="w-4 h-4 mr-2" />
            Alterar Datas
          </Button>
          <Button variant="ghost" size="sm" onClick={exportCsv}>
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setPdfOpen(true)}>
            <FileText className="w-4 h-4 mr-2" />
            Importar PDF
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setExcelOpen(true)}>
            <FileText className="w-4 h-4 mr-2" />
            Importar Excel/CSV
          </Button>
          <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="absolute right-0 mt-2 z-10 bg-white p-4 rounded-lg shadow-xl border w-80">
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-medium mb-2 block">Categorias</span>
                    <div className="flex flex-wrap gap-1">
                      {categories.map((c) => (
                        <Toggle key={c.id} pressed={selectedCats.includes(c.id)} onPressedChange={(on) => setSelectedCats((prev) => on ? [...prev, c.id] : prev.filter((x) => x !== c.id))} className="h-6 px-2 text-[10px] border rounded-full data-[state=on]:bg-emerald-500 data-[state=on]:text-white">{c.name}</Toggle>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium mb-2 block">Tags</span>
                    <div className="flex flex-wrap gap-1">
                      {tags.map((t) => (
                        <Toggle key={t.id} pressed={selectedTags.includes(t.id)} onPressedChange={(on) => setSelectedTags((prev) => on ? [...prev, t.id] : prev.filter((x) => x !== t.id))} className="h-6 px-2 text-[10px] border rounded-full data-[state=on]:bg-emerald-500 data-[state=on]:text-white">{t.name}</Toggle>
                      ))}
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" className="w-full" onClick={() => { setSelectedTags([]); setSelectedCats([]); setSearch(''); }}>Limpar Filtros</Button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>

        <div className="space-y-3">
          {txs.filter(txMatchesFilters).map((t) => (
            <Card key={t.id} className="border-none shadow-sm hover:shadow-md transition-all duration-200 group">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: categories.find(c => c.id === t.category_id)?.color || "#f3f4f6" }}>
                  <IconByName name={categories.find(c => c.id === t.category_id)?.icon} className="w-5 h-5 text-slate-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-foreground truncate">{t.description || "Sem descrição"}</h4>
                    {t.installment_count && t.installment_count > 1 ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        {t.installment_number}/{t.installment_count}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                    <span>•</span>
                    <span>{categories.find(c => c.id === t.category_id)?.name || "Sem categoria"}</span>
                    {(tagsByTx[t.id] || []).length > 0 && (
                      <>
                        <span>•</span>
                        <div className="flex gap-1">
                          {(tagsByTx[t.id] || []).map(tid => {
                            const tag = tags.find(tg => tg.id === tid);
                            return tag ? <span key={tid} className="bg-slate-100 px-1 rounded">{tag.name}</span> : null;
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-red-600">{formatBRL(Number(t.amount))}</div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
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
              </CardContent>
            </Card>
          ))}
          {txs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <p>Nenhuma despesa encontrada para este período.</p>
            </div>
          ) : null}
        </div>

        <Dialog open={payOpen} onOpenChange={setPayOpen}>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader><DialogTitle>Pagamento da fatura</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-4 items-center gap-2">
                <Label className="text-right">Valor</Label>
                <Input className="col-span-3" value={payAmountStr} onChange={(e) => setPayAmountStr(formatMoneyInput(e.target.value))} disabled={payFull} />
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
                <input type="checkbox" checked={payFull} onChange={(e) => setPayFull(e.target.checked)} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={payStatement}>Confirmar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <PdfImportDialog open={pdfOpen} onOpenChange={setPdfOpen} cardId={cardId} onImported={fetchAll} />
        <ExcelImportDialog open={excelOpen} onOpenChange={setExcelOpen} cardId={cardId} onImported={fetchAll} targetYear={year} targetMonth={month} cardName={card?.name} />
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader><DialogTitle>Editar despesa</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-4 items-center gap-2">
                <Label className="text-right">Modo</Label>
                <div className="col-span-3 flex items-center gap-3">
                  <Toggle pressed={editMode === 'single'} onPressedChange={() => setEditMode('single')} className="h-7 px-2 text-xs border rounded data-[state=on]:bg-emerald-500 data-[state=on]:text-white">Apenas esta</Toggle>
                  <Toggle pressed={editMode === 'bulk'} onPressedChange={() => setEditMode('bulk')} className="h-7 px-2 text-xs border rounded data-[state=on]:bg-emerald-500 data-[state=on]:text-white">Esta e futuras</Toggle>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-2">
                <Label className="text-right">Categoria</Label>
                <div className="col-span-3">
                  <Select value={editCategoryId} onValueChange={setEditCategoryId}>
                    <SelectTrigger>
                      <div className="flex items-center gap-2 w-full">
                        {(() => { const c = categories.find((x) => x.id === editCategoryId); return c ? <IconByName name={c.icon} color={c.color || undefined} className="w-4 h-4" /> : null; })()}
                        <SelectValue placeholder="Selecione" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectPrimitive.Item key={c.id} value={c.id} className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground">
                          <div className="flex items-center gap-2"><IconByName name={c.icon} color={c.color || undefined} className="w-4 h-4" /><SelectPrimitive.ItemText>{c.name}</SelectPrimitive.ItemText></div>
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
                  {tags.map((t) => (
                    <Toggle key={t.id} pressed={editTags.includes(t.id)} onPressedChange={(on) => setEditTags((prev) => on ? [...prev, t.id] : prev.filter((x) => x !== t.id))} className="h-7 px-2 text-xs border rounded data-[state=on]:bg-emerald-500 data-[state=on]:text-white">{t.name}</Toggle>
                  ))}
                </div>
              </div>
              {editMode === 'single' ? (
                <>
                  <div className="grid grid-cols-4 items-center gap-2">
                    <Label className="text-right">Valor</Label>
                    <Input className="col-span-3" value={editAmountStr} onChange={(e) => setEditAmountStr(formatMoneyInput(e.target.value))} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-2">
                    <Label className="text-right">Descrição</Label>
                    <Input className="col-span-3" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-4 items-center gap-2">
                    <Label className="text-right">Qtd. Parcelas</Label>
                    <Input className="col-span-3" value={genCountStr} onChange={(e) => setGenCountStr(e.target.value.replace(/\D/g, '').slice(0,2))} placeholder="Quantas parcelas futuras gerar?" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-2">
                    <Label className="text-right"></Label>
                    <Button className="col-span-3" variant="secondary" onClick={openGeneratePreview} disabled={editSaving}>Gerar Parcelas Futuras</Button>
                  </div>
                  {genError && (
                    <div className="grid grid-cols-4 items-center gap-2">
                        <div className="col-start-2 col-span-3 text-xs text-red-600">{genError}</div>
                    </div>
                  )}
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
                <Input type="date" className="col-span-3" value={editCloseDate} onChange={(e) => setEditCloseDate(e.target.value)} />
              </div>
              <div className="grid grid-cols-4 items-center gap-2">
                <Label className="text-right">Vencimento</Label>
                <Input type="date" className="col-span-3" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} />
              </div>
              {editStmtError ? <div className="text-xs text-red-600">{editStmtError}</div> : null}
            </div>
            <DialogFooter>
              <Button onClick={saveEditStatement} disabled={!!editStmtError}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={genConfirmOpen} onOpenChange={setGenConfirmOpen}>
          <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Confirmar Geração de Parcelas</DialogTitle>
              <DialogDescription>
                Confira as parcelas que serão geradas.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="rounded border p-2 bg-slate-50 text-sm">
                <p><strong>Total de parcelas novas:</strong> {genPreview.length}</p>
                <p><strong>Valor por parcela:</strong> {formatBRL(Math.abs(Number(editTx?.amount || 0)))}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Detalhamento:</p>
                <div className="border rounded divide-y max-h-[200px] overflow-auto">
                  {genPreview.map((p, i) => (
                    <div key={i} className="flex justify-between p-2 text-sm">
                       <span>Parcela {p.number}</span>
                       <span>{new Date(p.date).toLocaleDateString('pt-BR')}</span>
                       <span className="font-medium">{formatBRL(p.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setGenConfirmOpen(false)}>Cancelar</Button>
              <Button onClick={confirmGenerateInstallments} disabled={editSaving}>
                 {editSaving ? "Gerando..." : "Confirmar Geração"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
const iconMap: Record<string, React.ComponentType<any>> = { Home, Car, Utensils, Wallet, TrendingUp, Briefcase, ShoppingCart, CreditCard, Fuel, Phone, Wifi, FileText, Gift, DollarSign, Coins, PiggyBank, Banknote, Bus, School, Heart, Stethoscope, Dumbbell, Pill, PlayCircle, Tv, Bike, Hammer, Wrench };
function IconByName({ name, className, color }: { name?: string | null; className?: string; color?: string | null }) {
  const key = (name || "").trim();
  const Comp = iconMap[key] || Utensils;
  return <Comp className={className} style={{ color: color || undefined }} />;
}
