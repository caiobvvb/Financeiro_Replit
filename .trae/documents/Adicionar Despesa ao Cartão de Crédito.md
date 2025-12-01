## Objetivo
Implementar fluxo completo para lançar despesas no cartão, com modal sobreposto, computar fatura correta (atual/próxima), suporte a tags, observação, despesa fixa e parcelamento, integrado ao Supabase com RLS.

## UI/Modal
- Adicionar botão "Adicionar Despesa" em cada card de `/accounts` que abre um modal.
- Modal pré-seleciona o cartão clicado; título: "Nova despesa cartão de crédito".
- Campos obrigatórios:
  - Valor (MoneyInput com máscara e validação > 0)
  - Data da despesa (DatePicker)
  - Descrição (Input)
  - Categoria (dropdown de categorias `type='expense'`)
  - Cartão (dropdown, já selecionado pelo card)
- Fatura: texto informativo "Entrará na fatura de DD/MM" calculado com `close_day` e `due_day`.
- Detalhes:
  - Tags (combobox multi-seleção com CRUD básico em painel lateral)
  - Observação (Textarea)
  - Despesa fixa (Switch)
  - Parcelado (Switch): ao habilitar, mostra número de parcelas e valor por parcela; permite salvar distribuindo pelas faturas futuras.
- Ações: "Salvar", "Salvar e criar nova", "Cancelar"; feedback de sucesso/erro; loading enquanto salva.

## Lógica de Fatura
- Dado `expenseDate`, `close_day` e `due_day` do cartão:
  - `cycleEnd` = close_day do mês de `expenseDate` se `day <= close_day`; senão close_day do mês seguinte.
  - `cycleStart` = (cycleEnd - 1 mês) + 1 dia.
  - `dueDate` = due_day do mês seguinte ao `cycleEnd`.
- Exibir fatura alvo como label e salvar metadados da fatura: `statement_year`, `statement_month`, `cycle_start`, `cycle_end`, `due_date`.

## Backend (Supabase)
### Alterações de schema
- `public.transactions` (já existe) — adicionar colunas:
  - `credit_card_id text null references public.credit_cards(id) on delete restrict`
  - `note text`
  - `is_recurring boolean default false`
  - `installment_count int default 1`
  - `installment_number int default 1`
  - `statement_year int`, `statement_month int`, `cycle_start date`, `cycle_end date`, `statement_due date`
- Índices: `idx_tx_credit_card (credit_card_id)`, `idx_tx_statement (statement_year, statement_month, credit_card_id)`
- RLS: reaproveitar políticas existentes de `transactions` (já por `user_id`).

### Tags
- `public.tags`: `id text pk default gen_random_uuid()::text`, `user_id text not null`, `name text not null unique per user`
- `public.transaction_tags`: `transaction_id text references public.transactions(id) on delete cascade`, `tag_id text references public.tags(id) on delete cascade`, pk composta.
- Índices por `user_id` e `transaction_id`.
- RLS: permitir selecionar/escrever apenas do próprio usuário.

### Parcelamento (persistência)
- Duas opções (escolheremos simples e eficiente):
  - Gerar N transações "filhas" com `installment_number` de 1..N; cada uma com data posicionada por fatura; `amount` = valor por parcela (ajuste de centavos na última).
  - Manter uma transação "mãe" opcional com `installment_count` = N; não obrigatório.

### SQL idempotente (migração manual, se necessário)
- Arquivos:
  - `01_transactions_extend_card.sql` (ALTER TABLE + índices)
  - `02_tags.sql` (tabelas + RLS)
- Entrego blocos SQL compatíveis com o seu script `server/supabase_rls.sql`.

## Integração na Página
- `/accounts`:
  - Adicionar `CreditExpenseDialog` component.
  - Carregar categorias de despesas e tags do Supabase.
  - Salvar despesa:
    - Sem parcelado: cria 1 transação com metadados de fatura.
    - Parcelado: gera N transações com datas distribuídas por ciclo.
  - Atualizar lista e totais sem recarregar; toasts ao finalizar.

## Validações
- Valor > 0; data válida; categoria e cartão selecionados.
- Parcelamento: parcelas >= 2; cálculo por parcela com arredondamento; corrigir última parcela.
- Fatura: verificar consistência das datas calculadas.

## UX
- Responsivo; acessível; atalhos de teclado (Esc fecha; Enter salva).
- Indicadores de loading e mensagens claras.

Confirme para eu aplicar as mudanças (UI, lógica, SQL com RLS) e entregar os blocos SQL idempotentes caso prefira aplicar manualmente.