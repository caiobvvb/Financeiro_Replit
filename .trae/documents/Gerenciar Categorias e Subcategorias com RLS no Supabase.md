## Objetivo
- Implementar gerenciamento completo de categorias (despesas/receitas) e subcategorias com descrição, ícone, cor, arquivamento, edição e exclusão.
- Persistir tudo no Supabase com RLS: cada usuário vê/edita apenas seus próprios registros.
- Manter o padrão visual já usado em `/categories`.

## Modelo de Dados (Supabase)
### Tabela `public.categories`
- Campos: `id text pk default gen_random_uuid()::text`, `user_id text not null`, `name text not null`, `type text not null check (type in ('expense','income'))`, `description text`, `icon text`, `color text`, `archived boolean default false`.
- Índices: `idx_categories_user (user_id)`, `idx_categories_user_type (user_id, type)`, `unique (user_id, name, type)` para evitar duplicatas por usuário/tipo.

### Tabela `public.subcategories`
- Campos: `id text pk default gen_random_uuid()::text`, `user_id text not null`, `category_id text not null references public.categories(id) on delete restrict`, `name text not null`, `description text`, `icon text`, `color text`, `archived boolean default false`.
- Índices: `idx_subcategories_user (user_id)`, `idx_subcategories_category (category_id)`, `unique (user_id, category_id, name)`.

### Ajustes na `public.transactions`
- Adicionar coluna opcional `subcategory_id text null references public.subcategories(id) on delete restrict`.
- Adicionar FK para `category_id` apontando para `public.categories(id) on delete restrict` (se ainda não existir).
- Índices: `idx_transactions_subcategory (subcategory_id)`.
- Regra funcional: excluir categoria/subcategoria só é permitido quando não há transações vinculadas (reforçado por `on delete restrict`).

## RLS (Row Level Security)
- `enable row level security` em `categories` e `subcategories`.
- Políticas (em ambas as tabelas):
  - `select`: `using (user_id = auth.uid()::text)`
  - `insert`: `with check (user_id = auth.uid()::text)`
  - `update`: `using (user_id = auth.uid()::text)`
  - `delete`: `using (user_id = auth.uid()::text)`
- Em `transactions`, manter/estender políticas já existentes para `user_id = auth.uid()::text`.

## Operações (Cliente Supabase)
- Listar categorias por tipo: `from('categories').select().eq('type', 'expense'|'income').order('name')`.
- Criar categoria: `insert({ user_id: auth.uid, name, type, description, icon, color })`.
- Editar categoria: `update({ name, description, icon, color, archived })`.
- Arquivar/desarquivar: `update({ archived: true|false })` (ocultar em listagem padrão).
- Excluir categoria: antes, contar transações vinculadas e subcategorias; com FK `restrict`, tentativa de exclusão falha se vinculada (tratar mensagem amigável). 
- Subcategorias: mesmas operações (`select/insert/update/delete`) com filtro por `category_id`.

## UI/UX em `/categories`
- Abas “Despesas” e “Receitas” (já existente) listando categorias do tipo ativo.
- Cada linha de categoria:
  - Nome, ícone (lucide), bolinha com cor, badge “Arquivada” quando aplicável.
  - Ações: `Editar`, `Arquivar/Desarquivar`, `Excluir`, `+ Subcategoria`.
- Diálogo “Nova Categoria”/“Editar Categoria” com campos: Nome, Descrição, Ícone (select de ícones padrão), Cor (color picker), Tipo (fixo pela aba), Arquivada (toggle).
- Subcategorias: expand/collapse abaixo da categoria ou diálogo dedicado para CRUD.
- Feedbacks: loaders, toasts, validação simples (nome obrigatório, tipo válido).

## SQL Planejado (aplicado via MCP ao confirmar)
1) `categories`
- `alter table public.categories add column if not exists description text;`
- `alter table public.categories add column if not exists icon text;`
- `alter table public.categories add column if not exists color text;`
- `alter table public.categories add column if not exists archived boolean default false;`
- `create unique index if not exists uniq_categories_user_name_type on public.categories (user_id, name, type);`
- RLS: enable + 4 policies conforme seção RLS.

2) `subcategories`
- `create table if not exists public.subcategories ( id text primary key default gen_random_uuid()::text, user_id text not null, category_id text not null references public.categories(id) on delete restrict, name text not null, description text, icon text, color text, archived boolean default false );`
- Índices e unique conforme seção modelo.
- RLS: enable + 4 policies conforme seção RLS.

3) `transactions`
- `alter table public.transactions add column if not exists subcategory_id text;`
- `alter table public.transactions add constraint fk_transactions_subcategory foreign key (subcategory_id) references public.subcategories(id) on delete restrict;`
- `alter table public.transactions add constraint fk_transactions_category foreign key (category_id) references public.categories(id) on delete restrict;`
- Índice em `subcategory_id`.

## Implementação (etapas)
1. Aplicar DDL e RLS no Supabase via MCP (conforme SQL acima).
2. Ajustar `/categories` para usar Supabase direto (com token) para `select/insert/update/delete` de categorias/subcategorias.
3. Componentizar seletores de ícone e cor, mantendo padrão visual (reuso dos componentes UI existentes).
4. Implementar arquivamento: ocultar por padrão (filtro `archived = false`), com toggle para “Mostrar Arquivadas”.
5. Implementar verificação de exclusão: contar transações vinculadas; exibir mensagem clara quando não permitido.
6. Testar com usuário diferente para confirmar RLS (cada um vê apenas suas categorias/subcategorias).

## Validação
- Rodar criação/edição/exclusão em ambos tipos (“Despesas” e “Receitas”).
- Tentar excluir categoria com transações vinculadas: deve falhar (FK restrict) e mostrar toast.
- Confirmar que usuário A não vê dados do usuário B (RLS).

## Observações
- Mantém compatibilidade com `transactions` atual; subcategoria é opcional.
- Ícones persistidos como string (nome do ícone lucide), cor como hex (ex: `#ef4444`).
- Evitar duplicidade de nomes por usuário/tipo com índice único.

Confirma aplicar esse plano (DDL + ajustes de UI) usando MCP e atualizar a página `/categories` para esse fluxo? 