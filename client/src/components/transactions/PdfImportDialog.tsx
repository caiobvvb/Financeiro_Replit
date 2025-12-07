import * as React from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Upload, Lock } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { ParsedPdfItem, parsePdfText, detectBankFromText, normalizeDesc } from "@/lib/pdf-parser"

type Props = { open: boolean; onOpenChange: (v: boolean) => void; cardId: string; onImported: () => void };

export function PdfImportDialog({ open, onOpenChange, cardId, onImported }: Props) {
  const [fileName, setFileName] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [needPassword, setNeedPassword] = React.useState(false)
  const [items, setItems] = React.useState<ParsedPdfItem[]>([])
  const [duplicates, setDuplicates] = React.useState<Record<string, boolean>>({})
  const [selection, setSelection] = React.useState<Record<string, boolean>>({})
  const [selectedCount, setSelectedCount] = React.useState(0)
  const [bankInfo, setBankInfo] = React.useState<{ code?: string; name?: string }>({})
  const [period, setPeriod] = React.useState<{ start?: string; end?: string }>({})
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    const keys = Object.keys(selection).filter((k) => selection[k])
    setSelectedCount(keys.length)
  }, [selection])

  async function extractPdfText(file: File, pwd?: string): Promise<string> {
    try {
      const pdfjs = await import("pdfjs-dist");
      // @ts-ignore
      const workerSrc = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
      // @ts-ignore
      (pdfjs as any).GlobalWorkerOptions.workerSrc = workerSrc.default;
      const buf = await file.arrayBuffer();
      const loadingTask = (pdfjs as any).getDocument({ data: buf, password: pwd || undefined });
      loadingTask.onPassword = (update: number, callback: (pwd: string) => void) => {
        setNeedPassword(true);
        if (pwd) callback(pwd);
      };
      const pdf = await loadingTask.promise;
      let out = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        let line = "";
        for (const it of content.items as any[]) {
          const s = (it.str || "").trim();
          if (!s) continue;
          line += (line ? " " : "") + s;
          if (it.hasEOL) {
            out += line + "\n";
            line = "";
          }
        }
        if (line) out += line + "\n";
      }
      return out;
    } catch (e: any) {
      throw e;
    }
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(""); setNeedPassword(false); setPassword("");
    const f = e.target.files?.[0]
    if (!f) return
    setFileName(f.name)
    try {
      let text = await extractPdfText(f)
      if (!text && needPassword && password) {
        text = await extractPdfText(f, password)
      }
      const bank = detectBankFromText(text, f.name)
      setBankInfo(bank)
      const parsed = parsePdfText(text, f.name)
      if (!parsed.length) { setItems([]); setSelection({}); setDuplicates({}); setPeriod({}); setError("Nenhuma transação encontrada no PDF."); return }
      const dates = parsed.map((p) => p.date).sort()
      setPeriod({ start: dates[0], end: dates[dates.length - 1] })
      const sel: Record<string, boolean> = {}
      parsed.forEach((p, i) => { sel[`${p.date}|${p.amount}|${normalizeDesc(p.description)}|${i}`] = true })
      setSelection(sel)
      setItems(parsed)
      await computeDuplicates(parsed)
      await validateBankAgainstCard(bank)
    } catch (err: any) {
      const msg = String(err?.message || err)
      if (msg.toLowerCase().includes("password")) {
        setNeedPassword(true)
        setError("Este PDF requer senha. Informe a senha para continuar.")
      } else {
        setError("Falha ao ler PDF: " + msg)
      }
    }
  }

  async function validateBankAgainstCard(bank: { code?: string }) {
    try {
      const { data: acc } = await supabase.from("credit_cards").select("id,name,brand").eq("id", cardId).single()
      // opcional: validar por bancos vinculados ao cartão se existirem metadados
      // Sem metadados, aceitamos qualquer banco; conflitos futuros podem ser bloqueados aqui.
    } catch {}
  }

  async function computeDuplicates(parsed: ParsedPdfItem[]) {
    const start = parsed.map((p) => p.date).sort()[0]
    const end = parsed.map((p) => p.date).sort().slice(-1)[0]
    const { data } = await supabase
      .from("transactions")
      .select("date,amount,description")
      .eq("credit_card_id", cardId)
      .gte("date", start)
      .lte("date", end)
      .or("ignored.is.false,ignored.is.null")
    const seen = new Set<string>()
    for (const r of data || []) {
      const k = `${r.date}|${Number(r.amount)}|${normalizeDesc(r.description || '')}`
      seen.add(k)
    }
    const dup: Record<string, boolean> = {}
    parsed.forEach((p, i) => {
      const k = `${p.date}|${p.amount}|${normalizeDesc(p.description)}`
      const id = `${p.date}|${p.amount}|${normalizeDesc(p.description)}|${i}`
      dup[id] = seen.has(k)
    })
    setDuplicates(dup)
  }

  async function importNow() {
    setLoading(true); setError("")
    const chosen = items.filter((p, i) => selection[`${p.date}|${p.amount}|${normalizeDesc(p.description)}|${i}`] && !duplicates[`${p.date}|${p.amount}|${normalizeDesc(p.description)}|${i}`])
    if (!chosen.length) { setLoading(false); onOpenChange(false); return }
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setLoading(false); setError("Autenticação necessária"); return }

    // Tenta Edge Function, fallback para cliente
    try {
      const payload = { user_id: userData.user.id, card_id: cardId, bank_code: bankInfo.code, items: chosen } as any
      const { data, error } = await (supabase as any).functions.invoke("import-pdf-statement", { body: payload })
      if (error) throw error
      setLoading(false); onOpenChange(false); onImported(); return
    } catch {
      // Fallback: garantir statements e inserir transactions
      try {
        // Obter dados do cartão
        const { data: card } = await supabase.from("credit_cards").select("id,user_id,name,limit_amount,due_day,close_day,brand").eq("id", cardId).single()
        if (!card) throw new Error("Cartão não encontrado")
        // Agrupar por período
        const groups: Record<string, ParsedPdfItem[]> = {}
        for (const it of chosen) {
          const ref = computeStatementLocal(card, it.date)
          const key = `${ref.statement_year}-${ref.statement_month}`
          (groups[key] ||= []).push(it)
          await ensureStatement(card.user_id, cardId, ref)
          await insertTransactionsBatch(card.user_id, cardId, ref, groups[key])
        }
        setLoading(false); onOpenChange(false); onImported(); return
      } catch (e: any) {
        setLoading(false); setError("Falha ao salvar: " + String(e?.message || e)); return
      }
    }
  }

  function computeStatementLocal(card: any, dateStr: string) {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = d.getMonth();
    const close = Number(card.close_day);
    const due = Number(card.due_day);
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

  async function insertTransactionsBatch(userId: string, cardId: string, ref: any, rows: ParsedPdfItem[]) {
    if (!rows.length) return;
    const payloads = rows.map((p) => ({
      user_id: userId,
      account_id: cardId,
      credit_card_id: cardId,
      date: p.date,
      description: p.description,
      amount: p.amount,
      category_id: null,
      ignored: false,
      statement_year: ref.statement_year,
      statement_month: ref.statement_month,
      cycle_start: ref.cycle_start,
      cycle_end: ref.cycle_end,
      statement_due: ref.statement_due,
    }))
    const { error } = await supabase.from("transactions").insert(payloads)
    if (error) throw error
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-card">
        <DialogHeader>
          <DialogTitle>Importar PDF</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-2">
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
            <div className="bg-primary/10 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <p className="font-medium text-lg">{fileName ? fileName : "Selecione o arquivo PDF"}</p>
            <p className="text-sm text-muted-foreground mt-1">{fileName ? "Clique para alterar o arquivo" : "Clique para buscar em seu computador"}</p>
            <Input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={onFileChange} />
          </div>
          {needPassword ? (
            <Card className="border shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2"><Lock className="w-4 h-4" /><span className="text-sm">Este PDF está protegido por senha.</span></div>
              <div className="grid grid-cols-4 items-center gap-2">
                <Label className="text-right">Senha</Label>
                <Input className="col-span-3" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Digite a senha" />
              </div>
            </Card>
          ) : null}
          {items.length ? (
            <Card className="border shadow-sm">
              <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Resumo da Importação</p>
                  <p className="text-xs text-muted-foreground">Período: <span className="font-medium text-foreground">{period.start}</span> até <span className="font-medium text-foreground">{period.end}</span></p>
                  <p className="text-xs text-muted-foreground">Banco: <span className="font-medium text-foreground">{bankInfo.name || "Desconhecido"}</span></p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{selectedCount}</p>
                  <p className="text-xs text-muted-foreground">Transações selecionadas</p>
                </div>
              </div>
              <div className="max-h-[300px] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0 z-10">
                    <tr>
                      <th className="text-left p-3 font-medium text-muted-foreground w-[50px]">
                        <input type="checkbox" className="rounded border-gray-300" checked={items.every((it, i) => selection[`${it.date}|${it.amount}|${normalizeDesc(it.description)}|${i}`])} onChange={(e) => {
                          const allSelected = e.target.checked
                          const newSel: Record<string, boolean> = {}
                          items.forEach((it, i) => { newSel[`${it.date}|${it.amount}|${normalizeDesc(it.description)}|${i}`] = allSelected })
                          setSelection(newSel)
                        }} />
                      </th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Data</th>
                      <th className="text-left p-3 font-medium text-muted-foreground w-1/2">Descrição</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Valor</th>
                      <th className="text-center p-3 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map((it, i) => {
                      const id = `${it.date}|${it.amount}|${normalizeDesc(it.description)}|${i}`
                      const dup = !!duplicates[id]
                      const isSelected = !!selection[id]
                      return (
                        <tr key={id} className={`transition-colors hover:bg-muted/50 ${isSelected ? 'bg-primary/5' : ''} ${dup ? 'opacity-60' : ''}`}>
                          <td className="p-3"><input type="checkbox" checked={isSelected} onChange={(e) => setSelection((prev) => ({ ...prev, [id]: e.target.checked }))} className="rounded border-gray-300" /></td>
                          <td className="p-3 whitespace-nowrap">{it.date.split('-').reverse().join('/')}</td>
                          <td className="p-3 font-medium text-foreground/80">{it.description}</td>
                          <td className="p-3 text-right font-medium whitespace-nowrap text-red-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(it.amount)}</td>
                          <td className="p-3 text-center">{dup ? (<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Duplicado</span>) : (<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Novo</span>)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : null}
          {error ? (<div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center gap-2 border border-red-100"><span className="font-bold">Erro:</span> {error}</div>) : null}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={importNow} disabled={loading || !items.length} className="bg-primary hover:bg-primary/90 text-white shadow-sm">{loading ? "Importando..." : `Importar ${selectedCount} Transações`}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

