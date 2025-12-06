import { parseOfx } from "@/components/transactions/OfxImportDialog"

const sample = `
<OFX>
<BANKMSGSRSV1>
<STMTTRNRS>
<STMTRS>
<BANKTRANLIST>
<STMTTRN>
<DTPOSTED>20251203
<TRNAMT>-123.45
<FITID>ABC123
<NAME>Supermercado
<MEMO>Compra cartão
</STMTTRN>
<STMTTRN>
<DTPOSTED>20251204
<TRNAMT>100.00
<FITID>DEF456
<NAME>Salário
</STMTTRN>
</BANKTRANLIST>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>`

test("parseOfx extrai transações básicas", () => {
  const rows = parseOfx(sample)
  expect(rows.length).toBe(2)
  expect(rows[0].date).toBe("2025-12-03")
  expect(rows[0].amount).toBe(-123.45)
  expect(rows[0].fitid).toBe("ABC123")
  expect(rows[0].description.toLowerCase()).toContain("supermercado")
  expect(rows[1].date).toBe("2025-12-04")
  expect(rows[1].amount).toBe(100)
  expect(rows[1].fitid).toBe("DEF456")
})

