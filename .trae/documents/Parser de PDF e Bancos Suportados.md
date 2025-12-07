# Parser de PDF (Técnico)

## Bibliotecas
- `pdfjs-dist`: extração de texto por página no cliente.

## Detecção de Banco
- Heurísticas em `client/src/lib/pdf-parser.ts`:
  - Nubank (code 260), Itaú (341), Bradesco (237), Santander (033), Inter (077), Caixa (104).
  - Baseado em palavras-chave do texto e nome do arquivo.

## Extração de Transações
- `parsePdfText(text)`
  - Procura datas `DD/MM/AAAA`.
  - Busca valores na mesma ou nas próximas 2 linhas (suporta `R$ 1.234,56` e `1234.56`).
  - Descrição: linha da data ou próxima.
  - Valor gravado como positivo (despesa).

## Vinculação a Faturas
- Usa `computeStatement` (igual à lógica local) para definir:
  - `statement_year`, `statement_month`, `cycle_start`, `cycle_end`, `statement_due`.
- Garante existência de `statements` antes de inserir `transactions`.

## Persistência
- Fallback cliente: agrupa por período, insere em batch.
- Edge Function opcional: `import-pdf-statement` (transação SQL).

## Tratamento de Erros
- PDF com senha: callback `onPassword`.
- Estrutura inválida: sem datas/valores, retorna lista vazia.
- Logs no cliente e em função (quando disponível).

## Bancos Suportados (Inicial)
- Nubank, Itaú, Bradesco, Santander, Inter, Caixa.
- Extensível adicionando palavras-chave e mapeamentos.

