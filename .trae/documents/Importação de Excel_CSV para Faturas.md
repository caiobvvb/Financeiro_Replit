## Objetivo
Adicionar importação de planilhas (Excel/CSV) com colunas "DATA", "Descrição" e "Valor" para faturas de cartão, com pré-visualização, deduplicação e persistência sem categoria (o usuário categoriza depois).

## UX/Fluxo
- Botão "Importar Excel/CSV" na página `/faturas/:cardId`, ao lado do PDF.
- Aceitar arquivos `.xlsx`, `.xls` e `.csv`.
- Pré-visualização em tabela: Data, Descrição, Valor, Status (Novo/Duplicado), seleção por checkbox (Selecionar todos / por linha).
- Resumo: período (menor/maior data), contagem selecionada.
- Importar apenas selecionados, ignorando duplicados.

## Parsing
- Usar biblioteca `xlsx` (SheetJS) para ler `.xlsx/.xls/.csv` no cliente.
- Colunas aceitas (case-insensitive, acentos): `DATA`, `Descrição`/`Descricao`, `Valor`.
- Datas: aceitar `dd/mm/yyyy` e `dd/mm` (inferir ano pelo nome do arquivo ou pelo período da fatura com `computeStatement`).
- Valores: aceitar `R$ 1.234,56`, `1.234,56`, `-123,45`; normalizar via função estilo `parseMoneyBR` (reutilizar/centralizar util existente).
- Descrição: normalizar espaços; manter texto cru para visualização, usar `normalizeDesc` para deduplicação.
- Para cartão, gravar despesas como valor positivo (usar `Math.abs`).

## Deduplicação
- Mesma chave do PDF: `date|amount|normalizeDesc(description)`.
- Consulta de duplicatas em `transactions` por `credit_card_id` dentro do período.

## Persistência
- Inserir em `transactions` com `category_id: null`, `ignored: false`.
- Agrupar por período usando `computeStatement(card, date)` para garantir criação/associação de `statements` e campos `statement_year/month`, `cycle_*`.
- Reutilizar o fallback cliente já usado no PDF (Edge Function opcional).

## Validações
- Rejeitar arquivos sem as colunas exigidas.
- Mostrar erro se nenhuma linha válida for encontrada.
- Limpar linhas com valores não numéricos ou datas inválidas.

## Segurança/Privacidade
- Processar no cliente (não enviar o arquivo bruto ao servidor).
- Não logar conteúdo da planilha.

## Testes
- Unitários: parser Excel/CSV com casos `dd/mm/yyyy`, `dd/mm` (ano inferido), valores com/sem "R$", negativos.
- Dev Harness: adicionar no `PdfDev` ou criar `ImportDev` para testar leitura de CSV/XLSX sample.

## Implementação Técnica
- Adicionar dependência `xlsx` ao `package.json`.
- Criar `client/src/components/transactions/ExcelImportDialog.tsx` (seguindo padrão de `OfxImportDialog`/`PdfImportDialog`).
- Reutilizar util de normalização/parse de moeda (`parseMoneyBR`); se necessário, extrair para `client/src/lib/money.ts`.
- Integrar na página `Statements.tsx` com estado e botão.
- Dedup/persistência copiadas do fluxo PDF, usando `supabase` e `computeStatement`.

## Arquivos a alterar/criar
- `client/src/pages/Statements.tsx`: adicionar botão e estado do novo diálogo.
- `client/src/components/transactions/ExcelImportDialog.tsx`: novo componente.
- `client/src/lib/money.ts` (opcional): util `parseMoneyBR` compartilhado.
- `client/tests/excel-import.test.ts`: testes de parser e validações.

## Entregáveis
- Importação funcional para `.xlsx/.xls/.csv` com pré-visualização e deduplicação.
- Persistência sem categoria para o usuário categorizar depois.
- Testes cobrindo parsing e casos de borda.

Confirma implementar conforme acima?