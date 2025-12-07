export type ParsedPdfItem = { date: string; amount: number; description: string; category?: string; city?: string };

export function normalizeDesc(s: string) {
  return (s || "").toLowerCase().replace(/\s+/g, " ").replace(/[^a-z0-9çáéíóúãõâêîôû]/g, "").trim();
}

export function detectBankFromText(text: string, filename?: string): { code?: string; name?: string } {
  const t = (text || "").toLowerCase();
  const f = (filename || "").toLowerCase();
  if (t.includes("nubank") || f.includes("nubank") || f.includes("nu_")) return { code: "260", name: "Nubank" };
  if (t.includes("itau") || t.includes("itaú") || f.includes("itau")) return { code: "341", name: "Itaú Unibanco" };
  if (t.includes("bradesco") || f.includes("bradesco")) return { code: "237", name: "Bradesco" };
  if (t.includes("santander") || f.includes("santander")) return { code: "033", name: "Santander" };
  if (t.includes("inter") || f.includes("inter")) return { code: "077", name: "Banco Inter" };
  if (t.includes("caixa") || f.includes("caixa")) return { code: "104", name: "Caixa" };
  return { code: undefined, name: undefined };
}

export function parseMoneyBR(str: string): number | null {
  const s = (str || "")
    .replace(/[^0-9,\.\-]/g, "")
    .replace(/\.(?=\d{3}(\.|,))/g, "")
    .replace(/,(?=\d{2}$)/, ".");
  if (!s) return null;
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function inferYearMonthFromFilename(filename?: string): { year?: number; monthHint?: number } {
  const f = (filename || "").toLowerCase();
  const m1 = f.match(/(\d{2})(\d{4})/); // ex: itau102025
  if (m1) return { monthHint: parseInt(m1[1], 10), year: parseInt(m1[2], 10) };
  const m2 = f.match(/(\d{4})[-_](\d{2})/); // ex: 2025-10
  if (m2) return { year: parseInt(m2[1], 10), monthHint: parseInt(m2[2], 10) };
  return {};
}

export function parsePdfText(text: string, filename?: string): ParsedPdfItem[] {
  const lines = (text || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const items: ParsedPdfItem[] = [];
  const hint = inferYearMonthFromFilename(filename);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let iso: string | undefined;
    const mFull = line.match(/\b(\d{2})\/(\d{2})\/(\d{4})\b/);
    if (mFull) {
      iso = `${mFull[3]}-${mFull[2]}-${mFull[1]}`;
    } else {
      const mShort = line.match(/\b(\d{2})\/(\d{2})\b/);
      if (mShort && hint.year) {
        iso = `${hint.year}-${mShort[2]}-${mShort[1]}`;
      }
    }
    if (!iso) continue;
    // Busca valor na mesma linha ou próximas 2 linhas
    let amount: number | null = null;
    let desc = line
      .replace(/\b(\d{2})\/(\d{2})\/(\d{4})\b/, "")
      .replace(/\b(\d{2})\/(\d{2})\b/, "")
      .trim();
    for (let k = 0; k < 3; k++) {
      const ln = lines[i + k] || "";
      const valMatch = ln.match(/(-?\s*R\$\s*[0-9\.,]+)(?!.*R\$)|(-?[0-9\.,]+)$/);
      if (valMatch) {
        amount = parseMoneyBR(valMatch[0] || "");
        if (k > 0 && !desc) desc = (lines[i + 1] || "").trim();
        break;
      }
    }
    if (amount === null) continue;
    const cleanDesc = desc || (lines[i + 1] || "").trim();

    const norm = normalizeDesc(cleanDesc);
    const stop = [
      "pagamentoefetuadoem",
      "pagamentorealizado",
      "pagamentodefatura",
      "saldoi",
      "bancoita",
    ];
    if (!norm || norm.length < 4) continue;
    if (stop.some((s) => norm.includes(s))) continue;

    const category = detectCategory(lines, i);
    const city = extractCity(lines, i);
    // Cartões costumam listar despesas como positivas na fatura
    const amt = Math.abs(Number(amount));
    items.push({ date: iso, amount: Number(amt.toFixed(2)), description: cleanDesc || "Sem descrição", category, city });
  }
  return items;
}

function detectCategory(lines: string[], i: number): string | undefined {
  const window = [lines[i], lines[i + 1] || "", lines[i + 2] || ""].join(" ").toLowerCase();
  const map: Record<string, string> = {
    "saúde": "saude",
    "saude": "saude",
    "serviços": "servicos",
    "servicos": "servicos",
    "educacao": "educacao",
    "educação": "educacao",
    "vestuário": "vestuario",
    "vestuario": "vestuario",
    "outros": "outros",
    "retail": "retail",
    "electronics": "eletronics",
    "eletronics": "eletronics",
  };
  for (const k of Object.keys(map)) {
    if (window.includes(k)) return map[k];
  }
  return undefined;
}

function extractCity(lines: string[], i: number): string | undefined {
  const window = `${lines[i]} ${lines[i + 1] || ""}`;
  const tokens = window.split(/\s+/);
  for (let t = tokens.length - 1; t >= 0; t--) {
    const w = tokens[t];
    if (/^[A-ZÇÃÕÁÉÍÓÚ]{4,}$/.test(w)) return w;
  }
  return undefined;
}

export function categorySlugFromText(text: string): string | undefined {
  const window = String(text || "").toLowerCase();
  const map: Record<string, string> = {
    "saúde": "saude",
    "saude": "saude",
    "serviços": "servicos",
    "servicos": "servicos",
    "educacao": "educacao",
    "educação": "educacao",
    "vestuário": "vestuario",
    "vestuario": "vestuario",
    "outros": "outros",
    "retail": "retail",
    "electronics": "eletronics",
    "eletronics": "eletronics",
  };
  for (const k of Object.keys(map)) {
    if (window.includes(k)) return map[k];
  }
  return undefined;
}
