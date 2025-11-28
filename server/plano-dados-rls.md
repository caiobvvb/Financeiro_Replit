# Plano de Modelo de Dados e RLS

## Objetivo
- Estruturar tabelas para multiusuários com isolamento de dados por usuário (RLS em Supabase).
- Começar por: Categorias, Contas Bancárias, Cartões de Crédito e Transações.

## Entidades
- Categorias (`categories`)
  - Campos: `id`, `user_id`, `name`, `type` (ex.: income/expense)
  - Possível expansão: `parent_id`, `color`
- Contas (`accounts`)
  - Campos: `id`, `user_id`, `name`, `type` (bank/card/cash), `balance`
  - Cartões: usar `type = 'card'` e estender com `credit_limit`, `billing_day`, `best_day`, `brand` quando necessário
- Transações (`transactions`)
  - Campos: `id`, `user_id`, `account_id`, `category_id`, `amount`, `date`, `description`
  - Possível expansão: `kind` (income/expense/transfer), `status`, `related_transaction_id`

## Relacionamentos
- `transactions.account_id -> accounts.id`
- `transactions.category_id -> categories.id`
- Todas as tabelas possuem `user_id` para aplicar RLS (`auth.uid()`)

## RLS (Supabase)
- Habilitar RLS e criar políticas por tabela:
  - `select`: `user_id = auth.uid()::text`
  - `insert`: `WITH CHECK (user_id = auth.uid()::text)`
  - `update/delete`: `USING (user_id = auth.uid()::text)`

## Endpoints (existentes)
- `GET/POST/PUT/DELETE /api/accounts` — filtrado por `req.user.id`
- `GET/POST/PUT/DELETE /api/categories` — filtrado por `req.user.id`
- `GET/POST/PUT/DELETE /api/transactions` — filtrado por `req.user.id`

## Aderência ao Frontend
- `"/accounts"` exibe Cartões (type `card`)
- `"/contas"` exibe Contas Bancárias (type `bank`)

## Próximos Passos
- Adicionar colunas específicas de cartão em `accounts` (limite, vencimento, melhor dia)
- Criar tabela de faturas (`statements`) para cartões (opcional, fase 2)
- Orçamentos por categoria (fase 2)

## Aplicação do RLS
- Use o arquivo `server/supabase_rls.sql` para criar/ajustar tabelas e políticas diretamente no Supabase (SQL). 
