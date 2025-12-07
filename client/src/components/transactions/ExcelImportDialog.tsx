import * as React from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { normalizeDesc, parseMoneyBR, categorySlugFromText } from "@/lib/pdf-parser"

type ParsedRow = { date: string; amount: number; description: string; category?: string }

export function ExcelImportDialog({ open, onOpenChange, cardId, onImported, targetYear, targetMonth, cardName }: { open: boolean; onOpenChange: (v: boolean) => void; cardId: string; onImported: () => void; targetYear: number; targetMonth: number; cardName?: string }) {
  const [fileName, setFileName] = React.useState("")
  const [items, setItems] = React.useState<ParsedRow[]>([])
  const [selectedCount, setSelectedCount] = React.useState(0)
  const [duplicates, setDuplicates] = React.useState<Record<string, boolean>>({})
  const [selection, setSelection] = React.useState<Record<string, boolean>>({})
  const [period, setPeriod] = React.useState<{ start?: string; end?: string }>({})
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [warnings, setWarnings] = React.useState<string[]>([])
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [confirmOpen, setConfirmOpen] = React.useState(false)

  React.useEffect(() => {
    const keys = Object.keys(selection).filter((k) => selection[k])
    setSelectedCount(keys.length)
  }, [selection])

  React.useEffect(() => {
    if (!open) {
      setFileName("")
      setItems([])
      setSelection({})
      setDuplicates({})
      setPeriod({})
      setWarnings([])
      setError("")
      setConfirmOpen(false)
      setLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }, [open])

  function inferDateFromText(ddmm: string, yearHint?: number): string | null {
    const isoMatch = ddmm.match(/\b(\d{4})-(\d{2})-(\d{2})\b/)
    if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`
    const mFull = ddmm.match(/\b(\d{2})\/(\d{2})\/(\d{4})\b/)
    if (mFull) return `${mFull[3]}-${mFull[2]}-${mFull[1]}`
    const mShort = ddmm.match(/\b(\d{2})\/(\d{2})\b/)
    if (mShort) {
      const y = yearHint || new Date().getFullYear()
      return `${y}-${mShort[2]}-${mShort[1]}`
    }
    return null
  }

  async function parseWorkbook(file: File): Promise<ParsedRow[]> {
    const XLSX = await import("xlsx")
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: "array" })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" })
    const out: ParsedRow[] = []
    const warns: string[] = []
    const yearFromName = (file.name.match(/(\d{4})[-_]?(\d{2})/)?.[1] ? parseInt(file.name.match(/(\d{4})[-_]?(\d{2})/)![1], 10) : undefined)
    const serialToISO = (val: any): string | null => {
      if (val instanceof Date) return val.toISOString().slice(0,10)
      if (typeof val === 'number') {
        const d = (XLSX as any).SSF?.parse_date_code ? (XLSX as any).SSF.parse_date_code(val) : null
        if (d && d.y && d.m && d.d) {
          const y = String(d.y).padStart(4, '0')
          const m = String(d.m).padStart(2, '0')
          const day = String(d.d).padStart(2, '0')
          return `${y}-${m}-${day}`
        }
        // fallback formula from Excel epoch (1899-12-30)
        const epoch = new Date(Math.round((val - 25569) * 86400) * 1000)
        if (!isNaN(epoch.getTime())) return epoch.toISOString().slice(0,10)
      }
      if (typeof val === 'string' && /^\d+(\.\d+)?$/.test(val)) {
        return serialToISO(Number(val))
      }
      if (typeof val === 'string') {
        return inferDateFromText(val, yearFromName)
      }
      return null
    }
    for (const r of rows) {
      const keys = Object.keys(r)
      const get = (name: string) => {
        const k = keys.find((k) => k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(name))
        return k ? String(r[k]) : ""
      }
      const dateCell = ((): any => {
        const k = keys.find((k) => k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes("data"))
        return k ? r[k] : ""
      })()
      const dateStr = typeof dateCell === 'string' ? dateCell : String(dateCell)
      const descStr = get("descricao") || get("descri") || get("descrit") || get("desc") || get("descrição")
      const valStr = get("valor")
      const iso = serialToISO(dateCell)
      const amt = parseMoneyBR(String(valStr))
      const desc = String(descStr).trim() || "Sem descrição"
      if (!iso) { warns.push(`Data inválida: "${dateStr}"`); continue }
      if (amt === null) { warns.push(`Valor inválido: "${valStr}"`); continue }
      const cat = categorySlugFromText(desc)
      out.push({ date: iso, amount: Math.abs(Number(amt)), description: desc, category: cat })
    }
    setWarnings(warns)
    return out
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError("")
    const f = e.target.files?.[0]
    if (!f) return
    setFileName(f.name)
    try {
      const parsed = await parseWorkbook(f)
      if (!parsed.length) { setItems([]); setSelection({}); setDuplicates({}); setPeriod({}); setError("Nenhuma transação encontrada no arquivo."); return }
      const dates = parsed.map((p) => p.date).sort()
      setPeriod({ start: dates[0], end: dates[dates.length - 1] })
      const sel: Record<string, boolean> = {}
      parsed.forEach((p, i) => { sel[`${p.date}|${p.amount}|${normalizeDesc(p.description)}|${i}`] = true })
      setSelection(sel)
      setItems(parsed)
      await computeDuplicates(parsed)
    } catch (err: any) {
      setError("Falha ao ler arquivo: " + String(err?.message || err))
    }
  }

  async function computeDuplicates(parsed: ParsedRow[]) {
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

  async function insertTransactionsBatch(userId: string, cardId: string, ref: any, rows: (ParsedRow & { category_id?: string | null })[]) {
    if (!rows.length) return;
    const payloads = rows.map((p) => ({
      user_id: userId,
      account_id: cardId,
      credit_card_id: cardId,
      date: p.date,
      description: p.description,
      amount: p.amount,
      category_id: (p as any).category_id ?? null,
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

  function monthLabel(y: number, m: number) {
    const d = new Date(y, m - 1, 1)
    return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
  }

  async function importNow() {
    setConfirmOpen(true)
  }

  async function proceedImportNow() {
    if (loading) return
    setConfirmOpen(false)
    setLoading(true); setError("")
    const chosen = items.filter((p, i) => selection[`${p.date}|${p.amount}|${normalizeDesc(p.description)}|${i}`] && !duplicates[`${p.date}|${p.amount}|${normalizeDesc(p.description)}|${i}`])
    if (!chosen.length) { setLoading(false); onOpenChange(false); return }
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setLoading(false); setError("Autenticação necessária"); return }
    try {
      const { data: card } = await supabase.from("credit_cards").select("id,user_id,name,limit_amount,due_day,close_day,brand").eq("id", cardId).single()
      if (!card) throw new Error("Cartão não encontrado")
      const { data: cats } = await supabase.from("categories").select("id,name,type").eq("type","expense")
      function norm(s: string) { return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '') }
      const targetRef = (() => {
        const close = Number(card.close_day)
        const due = Number(card.due_day)
        const cycleEnd = new Date(targetYear, targetMonth - 1, close)
        const cycleStart = new Date(cycleEnd); cycleStart.setMonth(cycleEnd.getMonth() - 1); cycleStart.setDate(close + 1)
        const dueDate = new Date(cycleEnd); dueDate.setMonth(dueDate.getMonth() + 1); dueDate.setDate(due)
        return {
          statement_year: cycleEnd.getFullYear(),
          statement_month: cycleEnd.getMonth() + 1,
          cycle_start: cycleStart.toISOString().slice(0,10),
          cycle_end: cycleEnd.toISOString().slice(0,10),
          statement_due: dueDate.toISOString().slice(0,10),
        }
      })()
      await ensureStatement(card.user_id, cardId, targetRef)
      const mapped = chosen.map((p) => {
        let category_id: string | null = null
        if (p.category && Array.isArray(cats)) {
          const slug = norm(p.category)
          const found = cats.find((c: any) => norm(c.name || '') === slug)
          category_id = found ? found.id : null
        }
        return { ...p, category_id }
      })
      await insertTransactionsBatch(card.user_id, cardId, targetRef, mapped as any)
      setLoading(false); onOpenChange(false); onImported(); return
    } catch (e: any) {
      setLoading(false); setError("Falha ao salvar: " + String(e?.message || e)); return
    }
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-card">
        <DialogHeader>
          <DialogTitle>Importar Excel/CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-2">
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
            <div className="bg-primary/10 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
              {/* ícone reaproveitado */}
              <span className="w-8 h-8 text-primary inline-flex items-center justify-center">📄</span>
            </div>
            <p className="font-medium text-lg">{fileName ? fileName : "Selecione o arquivo Excel/CSV"}</p>
            <p className="text-sm text-muted-foreground mt-1">{fileName ? "Clique para alterar o arquivo" : "Clique para buscar em seu computador"}</p>
            <Input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onFileChange} />
          </div>
          {items.length ? (
            <Card className="border shadow-sm">
              <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Resumo da Importação</p>
                  <p className="text-xs text-muted-foreground">Período: <span className="font-medium text-foreground">{period.start}</span> até <span className="font-medium text-foreground">{period.end}</span></p>
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
                      <th className="text-left p-3 font-medium text-muted-foreground">Categoria</th>
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
                          <td className="p-3">{it.category ? it.category : '—'}</td>
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
          {warnings.length ? (
            <Card className="border shadow-sm p-4">
              <p className="text-sm font-medium mb-2">Avisos de validação</p>
              <ul className="text-xs text-muted-foreground list-disc pl-5">
                {warnings.map((w, idx) => (<li key={idx}>{w}</li>))}
              </ul>
            </Card>
          ) : null}
          {error ? (<div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center gap-2 border border-red-100"><span className="font-bold">Erro:</span> {error}</div>) : null}
          {!items.length ? (
            <Card className="border shadow-sm p-4">
              <p className="text-sm font-medium mb-2">Guia de importação</p>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>Formato esperado: planilha com colunas <b>DATA</b>, <b>Descrição</b>, <b>Valor</b>.</p>
                <p>Datas aceitas: <code>dd/mm/yyyy</code> ou <code>dd/mm</code> (ano inferido pelo nome do arquivo).</p>
                <p>Valores aceitos: <code>R$ 1.234,56</code>, <code>1.234,56</code>, <code>-123,45</code>.</p>
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="secondary" size="sm" onClick={downloadTemplateXlsx}>Baixar modelo (XLSX)</Button>
                <Button variant="secondary" size="sm" onClick={downloadTemplateCsv}>Baixar modelo (CSV)</Button>
              </div>
            </Card>
          ) : null}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={importNow} disabled={loading || !items.length} className="bg-primary hover:bg-primary/90 text-white shadow-sm">{loading ? "Importando..." : `Importar ${selectedCount} Transações`}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    {/* Confirm Dialog */}
    <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Confirmar importação</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p>Você está importando para o cartão <b>{cardName || cardId}</b> e fatura de <b>{monthLabel(targetYear, targetMonth)}</b>.</p>
          <p>Transações selecionadas: <b>{selectedCount}</b></p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={loading}>Voltar</Button>
          <Button onClick={proceedImportNow} disabled={loading} className="bg-primary text-white">{loading ? 'Confirmando...' : 'Confirmar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}

async function downloadTemplateXlsx() {
  const XLSX = await import("xlsx")
  const rows = [{ DATA: "02/10/2025", Descrição: "Supermercado", Valor: "R$ 123,45" }]
  const ws = XLSX.utils.json_to_sheet(rows, { header: ["DATA", "Descrição", "Valor"] })
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Import")
  const wbout = XLSX.write(wb, { type: "array", bookType: "xlsx" })
  const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = "modelo-importacao.xlsx"
  a.click()
  URL.revokeObjectURL(url)
}

function downloadTemplateCsv() {
  const csv = 'DATA,Descrição,Valor\n"02/10/2025","Supermercado","R$ 123,45"\n'
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'modelo-importacao.csv'
  a.click()
  URL.revokeObjectURL(url)
}
