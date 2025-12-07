import * as React from "react"
import { Layout } from "@/components/layout/Layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { parsePdfText, detectBankFromText } from "@/lib/pdf-parser"

export default function PdfDev() {
  const [result, setResult] = React.useState<any>(null)

  async function runWithFile(name: string) {
    const res = await fetch(`/${name}`)
    const blob = await res.blob()
    const file = new File([blob], name, { type: blob.type })
    const text = await extractPdfText(file)
    const bank = detectBankFromText(text, name)
    const items = parsePdfText(text, name)
    setResult({ name, bank, count: items.length, first: items[0] })
  }

  async function extractPdfText(file: File): Promise<string> {
    const pdfjs = await import("pdfjs-dist");
    // @ts-ignore
    const workerSrc = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    // @ts-ignore
    (pdfjs as any).GlobalWorkerOptions.workerSrc = workerSrc.default;
    const buf = await file.arrayBuffer();
    const loadingTask = (pdfjs as any).getDocument({ data: buf });
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
  }

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {[
            "Nubank_2025-11-02.pdf",
            "Nubank_2025-12-02.pdf",
            "itau112025.pdf",
            "itau102025_semsenha.pdf",
            "inter112025.pdf",
            "credcard112025.pdf",
          ].map((f) => (
            <Button key={f} onClick={() => runWithFile(f)} variant="outline">{f}</Button>
          ))}
        </div>
        <Card className="border-none shadow-md">
          <CardContent className="p-4">
            <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}

