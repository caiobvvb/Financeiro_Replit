import * as React from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"

type ParsedItem = { date: string; amount: number; description: string; fitid?: string }

function normalizeDesc(s: string) {
  return (s || "").toLowerCase().replace(/\s+/g, " ").replace(/[^a-z0-9çáéíóúãõâêîôû]/g, "").trim()
}

async function sha256(buf: ArrayBuffer) {
  const h = await crypto.subtle.digest("SHA-256", buf)
  const a = Array.from(new Uint8Array(h))
  return a.map((b) => b.toString(16).padStart(2, "0")).join("")
}

export function parseOfx(text: string): { items: ParsedItem[], bankId?: string } {
  const t = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  const bankId = (t.match(/<BANKID>[\s\n]*([^\n<]+)/i)?.[1] || "").trim()
  const blocks = t.split(/<STMTTRN>/i).slice(1)
  const out: ParsedItem[] = []
  for (const b of blocks) {
    const dt = (b.match(/<DTPOSTED>([^\n<]+)/i)?.[1] || "").trim()
    const amtStr = (b.match(/<TRNAMT>([^\n<]+)/i)?.[1] || "").trim()
    const name = (b.match(/<NAME>([^\n<]+)/i)?.[1] || "").trim()
    const memo = (b.match(/<MEMO>([^\n<]+)/i)?.[1] || "").trim()
    const fitid = (b.match(/<FITID>([^\n<]+)/i)?.[1] || "").trim()
    if (!dt || !amtStr) continue
    const y = dt.slice(0, 4), m = dt.slice(4, 6), d = dt.slice(6, 8)
    const iso = `${y}-${m}-${d}`
    const amount = Number(amtStr)
    const desc = [name, memo].filter(Boolean).join(" - ") || "Sem descrição"
    out.push({ date: iso, amount, description: desc, fitid: fitid || undefined })
  }
  return { items: out, bankId }
}

import { Upload } from "lucide-react"

export function OfxImportDialog({ open, onOpenChange, accountId, onImported }: { open: boolean; onOpenChange: (v: boolean) => void; accountId: string; onImported: () => void }) {
  const [fileName, setFileName] = React.useState("")
  const [items, setItems] = React.useState<ParsedItem[]>([])
  const [selectedCount, setSelectedCount] = React.useState(0)
  const [duplicates, setDuplicates] = React.useState<Record<string, boolean>>({})
  const [selection, setSelection] = React.useState<Record<string, boolean>>({})
  const [period, setPeriod] = React.useState<{ start?: string; end?: string }>({})
  const [checksum, setChecksum] = React.useState<string>("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    const keys = Object.keys(selection).filter((k) => selection[k])
    setSelectedCount(keys.length)
  }, [selection])

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError("")
    const f = e.target.files?.[0]
    if (!f) return
    setFileName(f.name)
    const buf = await f.arrayBuffer()
    const sum = await sha256(buf)
    setChecksum(sum)
    const txt = await new Response(buf).text()
    const { items: parsed, bankId } = parseOfx(txt)
    console.log("DEBUG: OFX Raw Start:", txt.slice(0, 200))
    console.log("DEBUG: Extracted bankId:", bankId)

    // Validate Bank Code
    // 1. Fetch account details (try to get bank_code directly)
    const { data: accData } = await supabase
      .from("accounts")
      .select("bank_id, bank_code")
      .eq("id", accountId)
      .single()

    let accountBankCode = accData?.bank_code

    // 2. If no direct bank_code, but we have a bank_id, fetch from banks table
    if (!accountBankCode && accData?.bank_id) {
      const { data: bankData } = await supabase
        .from("banks")
        .select("code")
        .eq("id", accData.bank_id)
        .single()

      if (bankData?.code) {
        accountBankCode = bankData.code
      }
    }

    if (accountBankCode) {
      if (!bankId) {
        setItems([]); setSelection({}); setDuplicates({}); setPeriod({});
        setError("Não foi possível identificar o banco no arquivo OFX. Importação bloqueada por segurança.");
        return;
      }

      const b1 = parseInt(bankId, 10)
      const b2 = parseInt(accountBankCode, 10)

      if (isNaN(b1)) {
        setItems([]); setSelection({}); setDuplicates({}); setPeriod({});
        setError("Código do banco no arquivo OFX inválido/não numérico.");
        return;
      }

      if (b1 !== b2) {
        setItems([]); setSelection({}); setDuplicates({}); setPeriod({});

        // Fetch bank names for better error message
        const { data: banksData } = await supabase
          .from("banks")
          .select("code, name")
          .in("code", [bankId, accountBankCode])

        const ofxBankName = banksData?.find(b => parseInt(b.code, 10) === b1)?.name || bankId
        const accBankName = banksData?.find(b => parseInt(b.code, 10) === b2)?.name || accountBankCode

        setError(`Este arquivo OFX pertence ao ${ofxBankName}, mas a conta selecionada para importação é do  ${accBankName}.`);
        return;
      }
    } else {
      if (accData?.bank_id) {
        setItems([]); setSelection({}); setDuplicates({}); setPeriod({});
        setError(`Erro ao verificar banco vinculado (ID: ${accData.bank_id}). Contate o suporte.`);
        return;
      } else {
        setItems([]); setSelection({}); setDuplicates({}); setPeriod({});
        setError("Esta conta não possui um banco vinculado. Edite a conta e selecione um banco para importar OFX.");
        return;
      }
    }

    try {
      const metaRaw = localStorage.getItem(`import_meta_${accountId}`)
      if (metaRaw) {
        const meta = JSON.parse(metaRaw)
        if (meta?.file_checksum === sum) { setError("Arquivo já importado anteriormente"); setItems([]); setSelection({}); setDuplicates({}); setPeriod({}); return }
      }
    } catch { }
    if (!parsed.length) {
      setItems([]);
      setSelection({});
      setDuplicates({});
      setPeriod({});
      setError("Nenhuma transação encontrada no arquivo.");
      return
    }
    const dates = parsed.map((p) => p.date).sort()
    setPeriod({ start: dates[0], end: dates[dates.length - 1] })
    const sel: Record<string, boolean> = {}
    parsed.forEach((p, i) => { sel[`${p.date}|${p.amount}|${normalizeDesc(p.description)}|${p.fitid || ''}|${i}`] = true })
    setSelection(sel)
    setItems(parsed)
    await computeDuplicates(parsed)
  }

  async function computeDuplicates(parsed: ParsedItem[]) {
    const start = parsed.map((p) => p.date).sort()[0]
    const end = parsed.map((p) => p.date).sort().slice(-1)[0]
    const { data } = await supabase
      .from("bank_transactions")
      .select("date,amount,description,fitid")
      .eq("account_id", accountId)
      .gte("date", start)
      .lte("date", end)
    const seen = new Set<string>()
    const seenFitid = new Set<string>()
    for (const r of data || []) {
      const k = `${r.date}|${Number(r.amount)}|${normalizeDesc(r.description || '')}`
      seen.add(k)
      if (r.fitid) seenFitid.add(String(r.fitid))
    }
    const dup: Record<string, boolean> = {}
    parsed.forEach((p, i) => {
      const k = `${p.date}|${p.amount}|${normalizeDesc(p.description)}`
      const id = `${p.date}|${p.amount}|${normalizeDesc(p.description)}|${p.fitid || ''}|${i}`
      dup[id] = (p.fitid ? seenFitid.has(p.fitid) : false) || seen.has(k)
    })
    setDuplicates(dup)
  }

  async function importNow() {
    setLoading(true)
    setError("")
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { setLoading(false); setError("Autenticação necessária"); return }
    const chosen = items.filter((p, i) => selection[`${p.date}|${p.amount}|${normalizeDesc(p.description)}|${p.fitid || ''}|${i}`] && !duplicates[`${p.date}|${p.amount}|${normalizeDesc(p.description)}|${p.fitid || ''}|${i}`])
    if (!chosen.length) { setLoading(false); onOpenChange(false); return }
    // create import meta in DB (if table/policies allow)
    let importId: string | undefined = undefined
    try {
      const { data: impCreated } = await supabase.from("bank_imports").insert({
        user_id: userData.user.id,
        account_id: accountId,
        source_label: fileName || "OFX",
        period_start: period.start,
        period_end: period.end,
        entry_count: chosen.length,
        file_checksum: checksum
      }).select().limit(1)
      importId = impCreated?.[0]?.id
    } catch { }
    const payloads = chosen.map((p) => ({
      user_id: userData.user.id,
      account_id: accountId,
      description: p.description,
      amount: p.amount,
      date: p.date,
      category_id: null,
      tags: [`import:${period.start || ''}:${period.end || ''}`],
      status: "paid",
      is_fixed: false,
      is_recurring: false,
      recurrence_frequency: null,
      recurrence_count: null,
      fitid: p.fitid || null,
      import_id: importId || null
    }))
    const { error: err } = await supabase.from("bank_transactions").insert(payloads)
    if (err) { setLoading(false); setError("Falha ao salvar"); return }
    // Persistência da última importação agora é feita via bank_imports no banco
    setLoading(false)
    onOpenChange(false)
    onImported()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-card">
        <DialogHeader>
          <DialogTitle>Importar OFX</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-2">

          {/* File Upload Area */}
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="bg-primary/10 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <p className="font-medium text-lg">
              {fileName ? fileName : "Selecione o arquivo OFX"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {fileName ? "Clique para alterar o arquivo" : "Clique para buscar em seu computador"}
            </p>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".ofx"
              className="hidden"
              onChange={onFileChange}
            />
          </div>

          {items.length ? (
            <Card className="border shadow-sm">
              <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Resumo da Importação</p>
                  <p className="text-xs text-muted-foreground">
                    Período: <span className="font-medium text-foreground">{period.start}</span> até <span className="font-medium text-foreground">{period.end}</span>
                  </p>
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
                        <input
                          type="checkbox"
                          className="rounded border-gray-300"
                          checked={items.every((it, i) => {
                            const id = `${it.date}|${it.amount}|${normalizeDesc(it.description)}|${it.fitid || ''}|${i}`
                            return selection[id]
                          })}
                          onChange={(e) => {
                            const allSelected = e.target.checked
                            const newSel: Record<string, boolean> = {}
                            items.forEach((it, i) => {
                              const id = `${it.date}|${it.amount}|${normalizeDesc(it.description)}|${it.fitid || ''}|${i}`
                              newSel[id] = allSelected
                            })
                            setSelection(newSel)
                          }}
                        />
                      </th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Data</th>
                      <th className="text-left p-3 font-medium text-muted-foreground w-1/2">Descrição</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Valor</th>
                      <th className="text-center p-3 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map((it, i) => {
                      const id = `${it.date}|${it.amount}|${normalizeDesc(it.description)}|${it.fitid || ''}|${i}`
                      const dup = !!duplicates[id]
                      const isSelected = !!selection[id]

                      return (
                        <tr
                          key={id}
                          className={`
                            transition-colors hover:bg-muted/50
                            ${isSelected ? 'bg-primary/5' : ''}
                            ${dup ? 'opacity-60' : ''}
                          `}
                        >
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => setSelection((prev) => ({ ...prev, [id]: e.target.checked }))}
                              className="rounded border-gray-300"
                            />
                          </td>
                          <td className="p-3 whitespace-nowrap">{it.date.split('-').reverse().join('/')}</td>
                          <td className="p-3 font-medium text-foreground/80">{it.description}</td>
                          <td className={`p-3 text-right font-medium whitespace-nowrap ${it.amount < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(it.amount)}
                          </td>
                          <td className="p-3 text-center">
                            {dup ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                Duplicado
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                Novo
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : null}

          {error ? (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center gap-2 border border-red-100">
              <span className="font-bold">Erro:</span> {error}
            </div>
          ) : null}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={importNow} disabled={loading || !items.length} className="bg-primary hover:bg-primary/90 text-white shadow-sm">
            {loading ? "Importando..." : `Importar ${selectedCount} Transações`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

