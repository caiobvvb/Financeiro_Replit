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
