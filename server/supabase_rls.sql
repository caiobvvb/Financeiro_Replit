-- Tabelas básicas (compatíveis com Drizzle schema atual)

create table if not exists public.accounts (
  id text primary key default gen_random_uuid()::text,
  user_id text not null,
  name text not null,
  type text not null,
  balance numeric(20,2) default 0
);

create index if not exists idx_accounts_user on public.accounts(user_id);

alter table public.accounts enable row level security;
-- opcional: forçar RLS mesmo para superusuário
-- alter table public.accounts force row level security;

do $$ begin
  create policy select_own_rows on public.accounts
    for select using (user_id = auth.uid()::text);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy insert_own_rows on public.accounts
    for insert with check (user_id = auth.uid()::text);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy update_own_rows on public.accounts
    for update using (user_id = auth.uid()::text);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy delete_own_rows on public.accounts
    for delete using (user_id = auth.uid()::text);
exception when duplicate_object then null; end $$;

-- Categorias
create table if not exists public.categories (
  id text primary key default gen_random_uuid()::text,
  user_id text not null,
  name text not null,
  type text not null
);

create index if not exists idx_categories_user on public.categories(user_id);

alter table public.categories enable row level security;

do $$ begin
  create policy select_own_rows on public.categories
    for select using (user_id = auth.uid()::text);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy insert_own_rows on public.categories
    for insert with check (user_id = auth.uid()::text);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy update_own_rows on public.categories
    for update using (user_id = auth.uid()::text);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy delete_own_rows on public.categories
    for delete using (user_id = auth.uid()::text);
exception when duplicate_object then null; end $$;

-- Metadados em categorias
alter table public.categories add column if not exists description text;
alter table public.categories add column if not exists icon text;
alter table public.categories add column if not exists color text;
alter table public.categories add column if not exists archived boolean default false;
do $$ begin
  create unique index uniq_categories_user_name_type on public.categories (user_id, name, type);
exception when duplicate_table then null; end $$;

-- Transações
create table if not exists public.transactions (
  id text primary key default gen_random_uuid()::text,
  user_id text not null,
  account_id text not null,
  category_id text not null,
  amount numeric(20,2) not null,
  date date not null,
  description text
);

create index if not exists idx_transactions_user on public.transactions(user_id);
create index if not exists idx_transactions_account on public.transactions(account_id);
create index if not exists idx_transactions_category on public.transactions(category_id);

alter table public.transactions enable row level security;

do $$ begin
  create policy select_own_rows on public.transactions
    for select using (user_id = auth.uid()::text);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy insert_own_rows on public.transactions
    for insert with check (user_id = auth.uid()::text);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy update_own_rows on public.transactions
    for update using (user_id = auth.uid()::text);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy delete_own_rows on public.transactions
    for delete using (user_id = auth.uid()::text);
exception when duplicate_object then null; end $$;

-- Subcategorias
create table if not exists public.subcategories (
  id text primary key default gen_random_uuid()::text,
  user_id text not null,
  category_id text not null references public.categories(id) on delete restrict,
  name text not null,
  description text,
  icon text,
  color text,
  archived boolean default false
);
create index if not exists idx_subcategories_user on public.subcategories(user_id);
create index if not exists idx_subcategories_category on public.subcategories(category_id);
do $$ begin
  create unique index uniq_subcategories_user_cat_name on public.subcategories(user_id, category_id, name);
exception when duplicate_table then null; end $$;
alter table public.subcategories enable row level security;
do $$ begin
  create policy select_own_rows on public.subcategories for select using (user_id = auth.uid()::text);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy insert_own_rows on public.subcategories for insert with check (user_id = auth.uid()::text);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy update_own_rows on public.subcategories for update using (user_id = auth.uid()::text);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy delete_own_rows on public.subcategories for delete using (user_id = auth.uid()::text);
exception when duplicate_object then null; end $$;

-- FKs e índices em transações
alter table public.transactions add column if not exists subcategory_id text;
do $$ begin
  alter table public.transactions add constraint fk_transactions_category foreign key (category_id) references public.categories(id) on delete restrict;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.transactions add constraint fk_transactions_subcategory foreign key (subcategory_id) references public.subcategories(id) on delete restrict;
exception when duplicate_object then null; end $$;
create index if not exists idx_transactions_subcategory on public.transactions(subcategory_id);

-- Observações:
-- - As colunas id e user_id são `text` para compatibilidade com o schema atual (Drizzle).
-- - Em Supabase, `auth.uid()` retorna UUID; por isso o cast `::text` é utilizado.
-- - Caso deseje migrar colunas para `uuid`, ajuste o schema e faça migração antes de aplicar RLS.

-- Bancos (dados compartilhados)
create table if not exists public.banks (
  id text primary key default gen_random_uuid()::text,
  code text not null,
  name text not null,
  short_name text,
  slug text,
  color text,
  logo_url text
);

alter table public.banks enable row level security;

do $$ begin
  create policy read_all on public.banks for select using (true);
exception when duplicate_object then null; end $$;

-- Se desejar restringir insert/update/delete apenas ao service role, não crie políticas de escrita.
-- O service role (chave de servidor) ignora RLS, então pode semear dados.

insert into public.banks (code, name, short_name, slug, color, logo_url) values
('001','Banco do Brasil','BB','banco-do-brasil','#ffcc00','https://logo.clearbit.com/bancodobrasil.com.br'),
('341','Itaú Unibanco','Itaú','itau','#ff6600','https://logo.clearbit.com/itau.com.br'),
('237','Bradesco','Bradesco','bradesco','#cc0000','https://logo.clearbit.com/bradesco.com.br'),
('033','Santander','Santander','santander','#c8102e','https://logo.clearbit.com/santander.com.br'),
('104','Caixa','Caixa','caixa','#0b63ce','https://logo.clearbit.com/caixa.gov.br'),
('260','Nubank','Nubank','nubank','#8309fd','https://logo.clearbit.com/nubank.com.br'),
('077','Banco Inter','Inter','inter','#ff6e00','https://logo.clearbit.com/inter.co'),
('208','BTG Pactual','BTG','btg','#001e3c','https://logo.clearbit.com/btg.com.br'),
('336','C6 Bank','C6','c6','#000000','https://logo.clearbit.com/c6bank.com.br'),
('748','Sicredi','Sicredi','sicredi','#39a935','https://logo.clearbit.com/sicredi.com.br')
on conflict do nothing;

update public.banks set logo_url='https://logo.clearbit.com/bancodobrasil.com.br' where code='001' and logo_url is null;
update public.banks set logo_url='https://logo.clearbit.com/itau.com.br' where code='341' and logo_url is null;
update public.banks set logo_url='https://logo.clearbit.com/bradesco.com.br' where code='237' and logo_url is null;
update public.banks set logo_url='https://logo.clearbit.com/santander.com.br' where code='033' and logo_url is null;
update public.banks set logo_url='https://logo.clearbit.com/caixa.gov.br' where code='104' and logo_url is null;
update public.banks set logo_url='https://logo.clearbit.com/nubank.com.br' where code='260' and logo_url is null;
update public.banks set logo_url='https://logo.clearbit.com/inter.co' where code='077' and logo_url is null;
update public.banks set logo_url='https://logo.clearbit.com/btg.com.br' where code='208' and logo_url is null;
update public.banks set logo_url='https://logo.clearbit.com/c6bank.com.br' where code='336' and logo_url is null;
update public.banks set logo_url='https://logo.clearbit.com/sicredi.com.br' where code='748' and logo_url is null;
alter table public.banks add column if not exists logo_url text;

-- Cartões de crédito
create table if not exists public.credit_cards (
  id text primary key default gen_random_uuid()::text,
  user_id text not null,
  name text not null,
  limit_amount numeric(20,2) not null default 0,
  due_day int not null check (due_day between 1 and 31),
  close_day int not null check (close_day between 1 and 31),
  brand text not null
);

create index if not exists idx_cc_user on public.credit_cards(user_id);
do $$ begin
  create unique index uniq_cc_user_name on public.credit_cards(user_id, name);
exception when duplicate_table then null; end $$;

alter table public.credit_cards enable row level security;
do $$ begin
  create policy cc_select_own on public.credit_cards for select using (user_id = auth.uid()::text);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy cc_insert_own on public.credit_cards for insert with check (user_id = auth.uid()::text);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy cc_update_own on public.credit_cards for update using (user_id = auth.uid()::text);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy cc_delete_own on public.credit_cards for delete using (user_id = auth.uid()::text);
exception when duplicate_object then null; end $$;

-- Transações: extensão para cartão de crédito e fatura
do $$ begin
  alter table public.transactions add column if not exists credit_card_id text;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.transactions add constraint fk_tx_credit_card foreign key (credit_card_id) references public.credit_cards(id) on delete restrict;
exception when duplicate_object then null; end $$;
alter table public.transactions add column if not exists note text;
alter table public.transactions add column if not exists is_recurring boolean default false;
alter table public.transactions add column if not exists installment_count int default 1;
alter table public.transactions add column if not exists installment_number int default 1;
alter table public.transactions add column if not exists statement_year int;
alter table public.transactions add column if not exists statement_month int;
alter table public.transactions add column if not exists cycle_start date;
alter table public.transactions add column if not exists cycle_end date;
alter table public.transactions add column if not exists statement_due date;
create index if not exists idx_tx_credit_card on public.transactions(credit_card_id);
create index if not exists idx_tx_statement on public.transactions(statement_year, statement_month, credit_card_id);

-- Ignorar transação na fatura (sem excluir)
alter table public.transactions add column if not exists ignored boolean default false;
create index if not exists idx_tx_ignored on public.transactions(ignored);
do $$ begin
  create policy update_own_rows_set_ignored on public.transactions for update using (user_id = auth.uid()::text);
exception when duplicate_object then null; end $$;

-- Tags e associação
create table if not exists public.tags (
  id text primary key default gen_random_uuid()::text,
  user_id text not null,
  name text not null
);
create unique index if not exists uniq_tags_user_name on public.tags(user_id, name);
alter table public.tags enable row level security;
do $$ begin
  create policy select_own_rows on public.tags for select using (user_id = auth.uid()::text);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy insert_own_rows on public.tags for insert with check (user_id = auth.uid()::text);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy update_own_rows on public.tags for update using (user_id = auth.uid()::text);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy delete_own_rows on public.tags for delete using (user_id = auth.uid()::text);
exception when duplicate_object then null; end $$;

create table if not exists public.transaction_tags (
  transaction_id text not null references public.transactions(id) on delete cascade,
  tag_id text not null references public.tags(id) on delete cascade,
  primary key (transaction_id, tag_id)
);
alter table public.transaction_tags enable row level security;
do $$ begin
  create policy select_own_rows on public.transaction_tags for select using (
    exists (select 1 from public.transactions t where t.id = transaction_id and t.user_id = auth.uid()::text)
  );
exception when duplicate_object then null; end $$;
do $$ begin
  create policy insert_own_rows on public.transaction_tags for insert with check (
    exists (select 1 from public.transactions t where t.id = transaction_id and t.user_id = auth.uid()::text)
  );
exception when duplicate_object then null; end $$;
do $$ begin
  create policy delete_own_rows on public.transaction_tags for delete using (
    exists (select 1 from public.transactions t where t.id = transaction_id and t.user_id = auth.uid()::text)
  );
exception when duplicate_object then null; end $$;

-- Faturas (statements)
create table if not exists public.statements (
  id text primary key default gen_random_uuid()::text,
  user_id text not null,
  credit_card_id text not null references public.credit_cards(id) on delete cascade,
  year int not null,
  month int not null,
  status text not null default 'open',
  total_amount numeric(20,2) not null default 0,
  paid_amount numeric(20,2) not null default 0,
  close_date date not null,
  due_date date not null,
  closed_at timestamp with time zone,
  updated_at timestamp with time zone default now()
);
create unique index if not exists uniq_statements_user_card_period on public.statements(user_id, credit_card_id, year, month);
alter table public.statements enable row level security;
do $$ begin
  create policy st_select_own on public.statements for select using (user_id = auth.uid()::text);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy st_insert_own on public.statements for insert with check (user_id = auth.uid()::text);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy st_update_own on public.statements for update using (user_id = auth.uid()::text);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy st_delete_own on public.statements for delete using (user_id = auth.uid()::text);
exception when duplicate_object then null; end $$;

-- Pagamentos de fatura
create table if not exists public.statement_payments (
  id text primary key default gen_random_uuid()::text,
  user_id text not null,
  statement_id text not null references public.statements(id) on delete cascade,
  amount numeric(20,2) not null,
  date date not null,
  method text,
  note text
);
create index if not exists idx_statement_payments_statement on public.statement_payments(statement_id);
alter table public.statement_payments enable row level security;
do $$ begin
  create policy sp_select_own on public.statement_payments for select using (user_id = auth.uid()::text);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy sp_insert_own on public.statement_payments for insert with check (user_id = auth.uid()::text);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy sp_update_own on public.statement_payments for update using (user_id = auth.uid()::text);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy sp_delete_own on public.statement_payments for delete using (user_id = auth.uid()::text);
exception when duplicate_object then null; end $$;

-- Importações de OFX por conta
create table if not exists public.bank_imports (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  account_id text not null references public.accounts(id) on delete cascade,
  source_label text,
  period_start date,
  period_end date,
  imported_at timestamp with time zone default now(),
  entry_count integer,
  file_checksum text
);
create index if not exists idx_bank_imports_account on public.bank_imports(account_id);
alter table public.bank_imports enable row level security;
do $$ begin
  create policy bi_select_own on public.bank_imports for select using (user_id = auth.uid()::text);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy bi_insert_own on public.bank_imports for insert with check (user_id = auth.uid()::text);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy bi_update_own on public.bank_imports for update using (user_id = auth.uid()::text);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy bi_delete_own on public.bank_imports for delete using (user_id = auth.uid()::text);
exception when duplicate_object then null; end $$;
