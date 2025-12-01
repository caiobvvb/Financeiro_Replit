## Objetivo
- Atualizar o diálogo e a listagem de cartões em `/accounts`.
- Campos: Nome, Limite (com máscara), Dia do vencimento (1–31), Dia do fechamento (1–31), Bandeira (com ícone).
- Persistir no Supabase com RLS (cada usuário vê/edita só seus dados).

## Ajustes de UI
- Renomear label “Melhor Dia” → “Dia do vencimento” e introduzir “Dia do fechamento” conforme fluxo de fatura.
- Inputs numéricos 1–31 com seleção rápida e digitação:
  - Componente `NumberPicker` (Popover + Command) para 1..31 e `Input` accept-only digits.
- Máscara de Limite:
  - Formatar enquanto digita via `Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' })`.
  - Salvar valor numérico com parser robusto (centavos → decimal).
- Bandeira do cartão:
  - Combobox com busca + ícones (Visa, Mastercard, Amex, Elo, Hipercard, etc.).
  - Ícones: usar SVGs do repositório referenciado; fallback para rótulo textual se ícone não disponível.
- Após salvar: fechar diálogo e voltar à listagem de cartões.

## Modelo de Dados (Supabase)
### Tabela `public.credit_cards`
- `id text pk default gen_random_uuid()::text`
- `user_id text not null`
- `name text not null`
- `limit numeric(20,2) not null default 0`
- `due_day int not null check (due_day between 1 and 31)`
- `close_day int not null check (close_day between 1 and 31)`
- `brand text not null` (ex.: 'visa', 'mastercard', 'amex', 'elo', 'hipercard')
- Índices: `idx_cc_user (user_id)`, `unique (user_id, name)`

### RLS
- `enable row level security` em `credit_cards`.
- Políticas:
  - `select`: `using (user_id = auth.uid()::text)`
  - `insert`: `with check (user_id = auth.uid()::text)`
  - `update`: `using (user_id = auth.uid()::text)`
  - `delete`: `using (user_id = auth.uid()::text)`

### Relações futuras (opcional)
- `transactions` pode receber `credit_card_id text null references public.credit_cards(id) on delete restrict` para vincular compras.

## SQL (para aplicação manual, idempotente)
1) Criar tabela e índices:
```
create table if not exists public.credit_cards (
  id text primary key default gen_random_uuid()::text,
  user_id text not null,
  name text not null,
  limit numeric(20,2) not null default 0,
  due_day int not null check (due_day between 1 and 31),
  close_day int not null check (close_day between 1 and 31),
  brand text not null
);
create index if not exists idx_cc_user on public.credit_cards(user_id);
do $$ begin
  create unique index uniq_cc_user_name on public.credit_cards(user_id, name);
exception when duplicate_table then null; end $$;
```
2) Habilitar RLS e políticas:
```
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
```
3) (Opcional) transações:
```
alter table public.transactions add column if not exists credit_card_id text;
do $$ begin
  alter table public.transactions add constraint fk_tx_credit_card foreign key (credit_card_id) references public.credit_cards(id) on delete restrict;
exception when duplicate_object then null; end $$;
create index if not exists idx_tx_credit_card on public.transactions(credit_card_id);
```

## Integração na Página `/accounts`
- Listagem de cartões: `from('credit_cards').select().order('name')` filtrado por usuário via RLS.
- Diálogo “Adicionar Cartão de Crédito”:
  - Campos: Nome, Limite (com máscara), Dia do vencimento (NumberPicker 1–31), Dia do fechamento (NumberPicker 1–31), Bandeira (Combobox com ícones).
  - Validações: `due_day` != `close_day` opcional, `1..31`, `limit >= 0`.
  - Salvamento: `insert({ user_id: auth.uid, ... })`.
- Edição/Exclusão: `update/delete` no Supabase; bloquear exclusão se houver transações vinculadas (se FK opcional for adotada).

## Componentes
- `NumberPicker`: Popover + lista 1–31, permite digitar; retorna `number`.
- `MoneyInput`: máscara monetária pt-BR com parser.
- `BrandCombobox`: busca por nome e exibe SVG inline das bandeiras; fallback para texto quando não encontrado.

## UX
- Renomear rótulos: “Vencimento” → “Dia do vencimento”; “Melhor Dia” → “Dia do fechamento”.
- Após salvar: fecha o diálogo e volta à aba de cartões em `/accounts`.
- Ícones de bandeira exibidos na listagem ao lado do nome do cartão.

## Validação
- Testar criação/edição/exclusão com dois usuários distintos para validar RLS.
- Verificar limites e dias fora de intervalo.
- Garantir que a máscara não envia string ao banco (somente número).

Confirmando, aplico o SQL (se necessário manualmente) e implemento os componentes e chamadas Supabase na página `/accounts`. 