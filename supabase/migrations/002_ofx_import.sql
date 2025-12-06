create table if not exists public.bank_imports (
  id uuid primary key default gen_random_uuid(),
  user_id varchar not null,
  account_id varchar not null,
  source_label text,
  period_start date,
  period_end date,
  imported_at timestamp with time zone default now(),
  entry_count integer,
  file_checksum text
);

alter table public.bank_transactions add column if not exists fitid text;
alter table public.bank_transactions add column if not exists import_id uuid references public.bank_imports(id) on delete set null;
alter table public.bank_transactions add column if not exists is_transfer boolean default false;
alter table public.bank_transactions add column if not exists transfer_group_id uuid;

do $$ begin
  create unique index if not exists bank_tx_account_fitid_unique on public.bank_transactions(account_id, fitid);
exception when others then null; end $$;
