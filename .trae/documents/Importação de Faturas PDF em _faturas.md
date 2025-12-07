## Objetivo
Implementar importação de faturas em PDF na tela `/faturas/:cardId`, extraindo transações (data, descrição, valor), identificando o banco emissor e vinculando automaticamente ao cartão de crédito e à fatura correta, com suporte a PDFs protegidos por senha, atomicidade na gravação, validações e testes.

## Integrações Existentes
- Página de fatura: `client/src/pages/Statements.tsx` usa `cardId` da rota, carrega `transactions` e `statements` direto do Supabase.
- Cálculo de período de fatura: `client/src/lib/billing.ts:3` (`computeStatement`).
- Fluxo de importação de OFX: `client/src/components/transactions/OfxImportDialog.tsx` (UI, seleção, duplicados, persistência em tabelas de banco).

## Arquitetura da Solução
1. **UI / Ação**
   - Adicionar botão `Importar PDF` ao action bar da página de fatura (`Statements.tsx`, ao lado de `CSV`), abrindo um novo diálogo `PdfImportDialog`.

2. **Componente PdfImportDialog**
   - Local: `client/src/components/transactions/PdfImportDialog.tsx`.
   - Funcionalidades:
     - Input de arquivo (`accept=".pdf"`).
     - Detecção de senha e prompt: uso de `pdfjs-dist` com `onPassword` (NEED_PASSWORD/INCORRECT_PASSWORD) exibindo `<Input type="password">` antes de parsear.
     - Extração de texto por página (`getTextContent`) e montagem linear de linhas.
     - Identificação automática do banco emissor por heurísticas no texto (e fallback pelo nome do arquivo):
       - Nubank: palavras-chave como "Nubank", "Fatura", "Cartão", CNPJ.
       - Itaú/Itaucard: "Itaucard", "Itaú", "Banco Itaú".
       - Bradesco/Bradescard: "Bradesco".
       - Inter: "Banco Inter", "inter.co".
       - Outros: mapeamento extensível com regex.
     - Parsing de transações:
       - Data: regex `\b(\d{2})/(\d{2})/(\d{4})\b` → ISO `AAAA-MM-DD`.
       - Descrição: captura da linha associada à data/valor; concatenação de campos quando necessário.
       - Valor: robusto para `1.234,56` ou `1234.56` com sinal; normalização para `number`.
       - Categoria inicial: `null` ("Sem categoria").
     - Seleção e deduplicação:
       - Marcar automaticamente como selecionadas as transações novas.
       - Detectar duplicados consultando `transactions` no intervalo; chave: `date|amount|normalize(description)`.
     - Resumo visual (quantidade, período detectado, total selecionado) e tabela com seleção por linha.

3. **Vinculação ao Cartão e Fatura**
   - Recebe `cardId` da tela.
   - Para cada transação:
     - Usa `computeStatement(card, date)` para determinar `statement_year`, `statement_month`, `cycle_start`, `cycle_end`, `statement_due`.
   - Garante que haja `statements` para cada período (cria se necessário).

4. **Persistência com Atomicidade**
   - Criar uma **Edge Function Supabase** `import-pdf-statement` com payload: `{ user_id, card_id, bank_code?, items: [{ date, description, amount }], options }`.
   - No servidor (transação SQL):
     - `BEGIN`.
     - Agrupar items por `(statement_year, statement_month)`; assegurar existência de `statements` (criando conforme `computeStatement`).
     - Inserir em `transactions` com campos:
       - `user_id`, `credit_card_id`, `date`, `description`, `amount`, `category_id=null`, `ignored=false`, `statement_year`, `statement_month`, `cycle_start`, `cycle_end`, `statement_due`.
     - Atualizar `statements.total_amount` somando transações do período.
     - `COMMIT`; em caso de erro, `ROLLBACK`.
   - O diálogo chama a função com os itens selecionados; em sucesso, fecha e refaz `fetchAll()` em `Statements.tsx`.

5. **Suporte a PDFs Protegidos**
   - Cliente utiliza `pdfjs-dist` com callback de senha.
   - Caso necessário, a senha é enviada ao parser apenas no cliente (não persistir), mantendo privacidade.
   - Se parsing falhar mesmo com senha, exibir erro específico e orientar trocar arquivo.

6. **Tratamento de Erros e Logs**
   - Validações no cliente:
     - Arquivo é PDF; contém datas e valores; pelo menos 1 transação selecionável.
     - Banco detectado com confiança (texto) ou fallback ao nome do arquivo; se conflito com o banco do cartão, bloquear e informar.
   - Edge Function:
     - Valida payload; log detalhado por grupo de período; mensagens com códigos.
     - Retorna lista de transações inseridas e períodos afetados.

7. **Performance**
   - Processamento paginado do PDF; normalização lazy das linhas.
   - Limitar tamanho máximo (exibir aviso) e processar em Web Worker do pdf.js.
   - UI responsiva com contador e barra de progresso.

8. **Testes**
   - Unitários do parser:
     - `client/tests/pdf-parser.test.ts`: testa `parsePdfText()` com fixtures de texto típicos (Nubank/Itaú/Inter/Bradesco) e variações de número (`1.234,56` vs `1234.56`).
   - Integrados (dev/harness):
     - Página dev-only para carregar PDFs de `public/` e inspecionar extração.
   - Casos obrigatórios:
     - Todos PDFs em `public/` (ex.: `Nubank_*.pdf`, `inter*.pdf`, `itau*.pdf`, `credcard*.pdf`).
     - PDFs com senha (simular via `onPassword`).
     - PDFs grandes (verificar tempo de parsing e UI).

9. **Documentação**
   - Manual do usuário: passo a passo do fluxo, requisitos de arquivo e mensagens de erro comuns.
   - Doc técnica: arquitetura do parser, heurísticas de detecção de banco, regra de período (`computeStatement`), API da Edge Function.
   - Lista de bancos suportados e particularidades (palavras-chave/formatos).

## Alterações de Código Planejadas
- `client/src/pages/Statements.tsx`: adicionar botão "Importar PDF" e estado para abrir `PdfImportDialog`.
- `client/src/components/transactions/PdfImportDialog.tsx`: novo componente com UI e lógica de parsing (pdfjs-dist) e deduplicação.
- `client/src/lib/pdf-parser.ts`: utilidades de parsing, normalização e detecção de banco.
- Edge Function `import-pdf-statement`: transação atômica para inserir `transactions` e garantir `statements`.
- Testes: `client/tests/pdf-parser.test.ts` (unit), harness dev para integração.
- Dependências: adicionar `pdfjs-dist` (cliente) e, se necessário na Edge, `pdf-lib` ou `pdfjs-dist` no bundle da função.

## Confirmações Necessárias
- Podemos adicionar a dependência `pdfjs-dist` no cliente?
- Preferência por criar Edge Function para garantir atomicidade (em vez de inserir direto do cliente)?
- Aceita que a detecção de banco use heurísticas por texto com fallback ao nome do arquivo?
