## Objetivo

Desenhar e guiar a implementação do modelo de dados (categorias, contas bancárias, cartões de crédito, transações e relacionamentos) com segurança multiusuário via RLS, mantendo o app escalável e consistente com o stack atual.

## Arquitetura de Dados

* Banco Postgres com tabelas separadas por tipo:

  * `bank_accounts` (Contas Bancárias)

  * `credit_cards` (Cartões de Crédito)

  * `categories` (Categorias)

  * `transactions` (Transações)

  * `transfers` (Transferências entre contas)

* Chaves estrangeiras entre entidades; índices por `user_id` e FKs; check constraints para integridade.

* RLS por tabela garantindo acesso apenas ao `user_id` do usuário autenticado.

## Integração com Autenticação

* Preferência: usar o Postgres do Supabase para RLS nativa (`auth.uid()`), com o cliente do frontend já usando Supabase Auth.

* Alternativa (se usar Postgres externo/Neon): manter separação no backend (já existe) e implementar RLS via GUC (`current_setting('app.user_id')`) setado pelo servidor por conexão.

## Tabelas e Relacionamentos

### Categories

* Campos: `id`, `user_id`, `name`, `type` (`income|expense|transfer`), `parent_id?`, `archived?`, `created_at`.

* Índices: `idx_categories_user` (`user_id`), `idx_categories_user_type` (`user_id,type`).

* Relacionamentos: `parent_id` auto-referência para hierarquia.

### Bank Accounts

* Campos: `id`, `user_id`, `name`, `institution?`, `account_type` (`checking|savings|cash|wallet`), `balance`, `currency` (default `BRL`), `created_at`.

* Índices: `idx_bank_accounts_user` (`user_id`).

### Credit Cards

* Campos: `id`, `user_id`, `name`, `brand?` (`visa|mastercard|elo|amex|hipercard|outros`), `limit_amount`, `billing_day` (1–31), `best_day` (1–31), `created_at`.

* Índices: `idx_credit_cards_user` (`user_id`).

### Transactions (MVP unificado)

* Campos: `id`, `user_id`, `kind` (`bank|card`), `account_id?`, `credit_card_id?`, `category_id`, `amount`, `date`, `description?`, `installments?` (>=1), `installment_index?` (>=1), `created_at`.

* Restrição: `constraint transaction_target_fk` assegura XOR entre `account_id` e `credit_card_id` conforme `kind`.

* Índices: `idx_transactions_user_date` (`user_id,date`), `idx_transactions_user_cat` (`user_id,category_id`).

### Transfers (opcional, porém recomendado)

* Campos: `id`, `user_id`, `from_account_id`, `to_account_id`, `amount`, `date`, `description?`, `created_at`.

* Índices: `idx_transfers_user_date` (`user_id,date`).

## Políticas RLS (Supabase)

### Padrão por tabela

* `ALTER TABLE <tabela> ENABLE ROW LEVEL SECURITY;`

* `CREATE POLICY` de `SELECT/INSERT/UPDATE/DELETE` com `USING (user_id = auth.uid())` e `WITH CHECK (user_id = auth.uid())`.

## SQL (Supabase) — Criação + RLS

```sql
-- Categories
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income','expense','transfer')),
  parent_id uuid references public.categories(id) on delete set null,
  archived boolean default false,
  created_at timestamptz default now()
);
create index idx_categories_user on public.categories(user_id);
create index idx_categories_user_type on public.categories(user_id, type);
alter table public.categories enable row level security;
create policy categories_select on public.categories for select using (user_id = auth.uid());
create policy categories_insert on public.categories for insert with check (user_id = auth.uid());
create policy categories_update on public.categories for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy categories_delete on public.categories for delete using (user_id = auth.uid());

-- Bank Accounts
create table public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  institution text,
  account_type text not null check (account_type in ('checking','savings','cash','wallet')),
  balance numeric(20,2) default 0,
  currency text default 'BRL',
  created_at timestamptz default now()
);
create index idx_bank_accounts_user on public.bank_accounts(user_id);
alter table public.bank_accounts enable row level security;
create policy bank_accounts_select on public.bank_accounts for select using (user_id = auth.uid());
create policy bank_accounts_insert on public.bank_accounts for insert with check (user_id = auth.uid());
create policy bank_accounts_update on public.bank_accounts for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy bank_accounts_delete on public.bank_accounts for delete using (user_id = auth.uid());

-- Credit Cards
create table public.credit_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  brand text,
  limit_amount numeric(20,2) default 0,
  billing_day int check (billing_day between 1 and 31),
  best_day int check (best_day between 1 and 31),
  created_at timestamptz default now()
);
create index idx_credit_cards_user on public.credit_cards(user_id);
alter table public.credit_cards enable row level security;
create policy credit_cards_select on public.credit_cards for select using (user_id = auth.uid());
create policy credit_cards_insert on public.credit_cards for insert with check (user_id = auth.uid());
create policy credit_cards_update on public.credit_cards for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy credit_cards_delete on public.credit_cards for delete using (user_id = auth.uid());

-- Transactions (unificada para bank/card)
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('bank','card')),
  account_id uuid references public.bank_accounts(id) on delete set null,
  credit_card_id uuid references public.credit_cards(id) on delete set null,
  category_id uuid not null references public.categories(id),
  amount numeric(20,2) not null,
  date date not null,
  description text,
  installments int default 1 check (installments >= 1),
  installment_index int default 1 check (installment_index >= 1),
  created_at timestamptz default now(),
  constraint transaction_target_fk check (
    (kind = 'bank' and account_id is not null and credit_card_id is null) or
    (kind = 'card' and credit_card_id is not null and account_id is null)
  )
);
create index idx_transactions_user_date on public.transactions(user_id, date);
create index idx_transactions_user_cat on public.transactions(user_id, category_id);
alter table public.transactions enable row level security;
create policy transactions_select on public.transactions for select using (user_id = auth.uid());
create policy transactions_insert on public.transactions for insert with check (user_id = auth.uid());
create policy transactions_update on public.transactions for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy transactions_delete on public.transactions for delete using (user_id = auth.uid());

-- Transfers (opcional)
create table public.transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  from_account_id uuid not null references public.bank_accounts(id),
  to_account_id uuid not null references public.bank_accounts(id),
  amount numeric(20,2) not null,
  date date not null,
  description text,
  created_at timestamptz default now()
);
create index idx_transfers_user_date on public.transfers(user_id, date);
alter table public.transfers enable row level security;
create policy transfers_select on public.transfers for select using (user_id = auth.uid());
create policy transfers_insert on public.transfers for insert with check (user_id = auth.uid());
create policy transfers_update on public.transfers for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy transfers_delete on public.transfers for delete using (user_id = auth.uid());
```

## Backend/API

* Endpoints REST (paralelos aos já existentes):

  * `GET/POST/PUT/DELETE /api/bank-accounts` (lista/CRUD por usuário)

  * `GET/POST/PUT/DELETE /api/credit-cards`

  * `GET/POST/PUT/DELETE /api/categories`

  * `GET/POST/PUT/DELETE /api/transactions`

  * `GET/POST/DELETE /api/transfers`

* Todos exigem usuário em `req.user` (middleware Supabase) e vinculam `user_id` nos inserts.

## Frontend

* Páginas já separadas: `"/contas"` (bancárias) e `"/accounts"` (cartões).

* Formular criar/editar sincronizam com novos endpoints e modelos.

* Listagens filtram por usuário (já feito via API) e categorização.

## Migração com Drizzle (se preferir código/migrations)

* Atualizar `shared/schema.ts` para refletir novas tabelas e remover o `accounts` genérico.

* Gerar migrações com `drizzle-kit` e `db:push` para o Postgres alvo.

* Se optar por RLS no Supabase, executar o SQL acima direto no Supabase SQL editor.

## Alternativa RLS no Postgres externo (sem Supabase)

* Criar RLS com `USING (user_id::text = current_setting('app.user_id', true))`.

* No servidor, ao abrir conexão, executar `SET app.user_id = '<uuid-do-usuário>'` (escopo de transação) antes das queries.

## Checklist de Validação

* RLS ativo em todas as tabelas e testado com dois usuários.

* Índices criados e verificadas consultas por `user_id`.

* Inserções/updates garantem `user_id = auth.uid()`.

* Transações respeitam a restrição XOR (`bank` vs `card`).

## Próximos Itens (depois do MVP)

* `card_statements` (faturas mensais) e `statement_payments` (pagamentos da fatura).

* `budgets` (orçamento por categoria/mes).

* `payees` e `tags` para enriquecer transações.

* Arquivos/anexos e conciliação.

## Observações

* Nunca expor chaves de serviço do Supabase.

* `gen_random_uuid()` requer `pgcrypto` (já habilitado no Supabase). Se usar outro Postgres, validar a extensão.

* Manter colunas monetárias em `numeric(20,2)` para precisão.

