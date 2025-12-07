import { parsePdfText, detectBankFromText } from "@/lib/pdf-parser"

const sampleTextNubank = `
Fatura Nubank
Compra 28/11/2025 Supermercado XYZ R$ 123,45
Compra 30/11/2025 Padaria ABC 56,70
`;

const sampleTextItau = `
Itaucard Mastercard
28/11/2025 Uber Viagem 18,90
29/11/2025 Netflix 39,90
`;

test("parsePdfText extrai transações com data, descrição e valor", () => {
  const rows = parsePdfText(sampleTextNubank)
  expect(rows.length).toBeGreaterThan(1)
  expect(rows[0].date).toMatch(/\d{4}-\d{2}-\d{2}/)
  expect(typeof rows[0].amount).toBe("number")
  expect(rows[0].description.length).toBeGreaterThan(0)
})

test("detectBankFromText identifica Nubank e Itaú", () => {
  const nb = detectBankFromText(sampleTextNubank, "Nubank_2025-11-02.pdf")
  expect(nb.code).toBe("260")
  const it = detectBankFromText(sampleTextItau, "itau112025.pdf")
  expect(it.code).toBe("341")
})

