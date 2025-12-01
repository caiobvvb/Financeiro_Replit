## Objetivo
- Criar uma página completa para gerenciamento de faturas de cartão de crédito com visualização, navegação por períodos, ações de pagamento (total/parcial), edição de dados, gestão de despesas e filtros.

## Modelagem de Dados (Supabase)
- Tabelas novas:
  - `statements` (faturas): `id`, `user_id`, `credit_card_id`, `year`, `month`, `status` ('open' | 'closed' | 'paid'), `total_amount`, `paid_amount`, `close_date`, `due_date`, `closed_at`, `updated_at`.
  - `statement_payments`: `id`, `user_id`, `statement_id`, `amount`, `date`, `method`, `note`.
- Alteração em `transactions`:
  - Adicionar `ignored boolean default false` para ocultar da fatura sem excluir.
- Índices:
  - `idx_statements_user_card_period(user_id, credit_card_id, year, month)`.
  - `idx_transactions_cc_period(credit_card_id, statement_year, statement_month)`.
- RLS (todas as tabelas):
  - `enable row level security` + políticas `select/insert/update/delete using (user_id = auth.uid()::text)`.

## Regras de Negócio
- Fatura é definida por `(credit_card_id, year, month)` e armazena `close_date` e `due_date` calculados a partir de `credit_cards.close_day`/`due_day`.
- `total_amount` = soma das `transactions.amount` da fatura (excluindo `ignored`).
- `paid_amount` = soma de `statement_payments.amount`.
- `status`: 
  - `open` quando `closed_at` null e período atual/futuro;
  - `closed` quando `closed_at` não null e `paid_amount < total_amount`;
  - `paid` quando `paid_amount >= total_amount`.
- Parcelamentos: mostrar `installment_number/installment_count`, e “Editar esta e todas futuras” atualiza as parcelas a partir da atual.

## Página e Navegação
- Nova página `client/src/pages/Statements.tsx`.
- Rota protegida: `/faturas/:cardId` com query `?year=YYYY&month=MM`.
- Entrada pela página de Cartões (Accounts) com link “Ver fatura”.

## Carregamento de Dados
- Buscar cartão (`credit_cards`) por `cardId`.
- Calcular ciclo (função util: `computeStatement(card, date)` já existe em `Accounts.tsx` → extrair para util compartilhado).
- Garantir fatura: `ensureStatement(cardId, year, month)` → cria se não existir com `close_date`/`due_date` calculados.
- Buscar despesas: `transactions` filtrando por `credit_card_id`, `statement_year`, `statement_month`, `ignored = false`.
- Buscar pagamentos: `statement_payments` do `statement_id`.

## UI e Layout (responsivo)
- Header: seletor de cartão (opcional) e período com controles de mês ±1.
- Ações principais (lado direito):
  - `+ Adicionar Despesa` (abre modal existente de nova despesa com `expenseCardId` e `expenseDate` pré-selecionados para o ciclo).
  - `Buscar` (filtro texto em descrição e tags).
  - `Mais` (menu com editar fatura, fechar/abrir, exportar CSV).
- Cards resumo (lado direito, como no print):
  - Valor da fatura (`total_amount`), Status, Dia de fechamento, Data de vencimento.
- Tabela de despesas:
  - Colunas: Situação (ícone: normal/parcelado/ignorado), Data, Descrição, Categoria (ícone + cor), Tags (toggles), Valor (cor por débito), Ações.
  - Linhas mostram `installment_number/installment_count` quando aplicável.

## Ações sobre Fatura
- Pagamento total: modal de confirmação → cria `statement_payments` com `amount = total_amount - paid_amount` e marca `status = 'paid'`.
- Pagamento parcial: modal com input monetário validado → cria `statement_payments` e recalcula `paid_amount`/`status`.
- Editar dados da fatura: editar `due_date`, `close_date`, `status` (com validação); confirmações.

## Gestão de Despesas (linha a linha)
- Editar: abre modal com duas opções:
  - “Apenas esta”: atualiza a transação atual.
  - “Esta e todas futuras”: atualiza transações com mesmo `installment_count` e `credit_card_id` com `installment_number >= atual`.
- Excluir: confirmação crítica; remove transação(s).
- Ignorar: alterna `ignored=true/false` para remover/reativar da fatura.
- Filtros: por `category_id` e por lista de `tags` (via `transaction_tags`).

## Validações e Feedback
- Inputs monetários com `formatMoneyInput/parseMoney` já utilizados.
- Datas dentro do período do ciclo (bloquear fora do mês/ano corrente da fatura quando criando pelo botão da fatura).
- Confirmações para exclusão/edição em massa.
- Toasts para sucesso/erro; indicadores visuais (badges de status,
  cores por categoria, ícones). 

## Realtime
- Inscrever em `postgres_changes` para `transactions`, `transaction_tags`, `statement_payments` e `statements` do `user_id` corrente para sincronizar UI em tempo real.

## Implementação Técnica
1. Criar `Statements.tsx` com layout e estrutura descritos; usar componentes existentes (`Card`, `Table`, `Select`, `Badge`, `Dialog`, `Button`).
2. Extrair `computeStatement` para `client/src/lib/billing.ts` e reutilizar.
3. Funções auxiliares:
   - `ensureStatement(cardId, year, month)`
   - `fetchStatement(cardId, year, month)`
   - `fetchStatementTransactions(cardId, year, month)`
   - `createPayment(statementId, amount, method?, note?)`
   - `toggleIgnoreTransaction(id, ignored)`
   - `bulkUpdateInstallments(baseTxId, updates)`
4. Integração com modal “Nova despesa” já existente, passando `expenseCardId` e `expenseDate` do ciclo selecionado.
5. Migrations Supabase (DDL) para novas tabelas e RLS; adicionar índices.

## Segurança (RLS)
- `statements`: selecionar/alterar apenas onde `user_id = auth.uid()`.
- `statement_payments`: idem.
- `transactions` e `transaction_tags`: manter RLS existente; adicionar política para atualizar `ignored`.

## Entregáveis
- Frontend:
  - `client/src/pages/Statements.tsx` (nova página)
  - `client/src/lib/billing.ts` (helpers de ciclo)
  - Rotas em `client/src/App.tsx` e link em `Accounts.tsx`.
- Backend (Supabase):
  - DDL em `server/supabase_rls.sql` para `statements`, `statement_payments`, campo `ignored` em `transactions` e políticas RLS.
  - Índices conforme descrito.

## Testes e Verificação
- Navegar mês/ano, conferir totals e datas de ciclo.
- Criar despesa via fatura; conferir inclusão na lista e total.
- Pagamento parcial e total; conferir status e paid_amount.
- Editar parcela “apenas esta” e “todas futuras”; validar cálculo.
- Realtime: alterar em outra aba e verificar atualização.
- Validações (datas/valores) e confirmações em ações críticas.

Confirme para eu seguir com a implementação e as migrations.