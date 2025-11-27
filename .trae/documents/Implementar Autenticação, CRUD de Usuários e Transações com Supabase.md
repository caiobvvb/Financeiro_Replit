## Objetivos
- Tornar o app funcional com backend: autenticação (login/logout/me), cadastro de usuários, CRUD de transações, contas e categorias.
- Usar Supabase Postgres via Drizzle ORM para persistência.
- Colocar a tela de Login como primeira tela, com fluxo de registro.

## Arquitetura e Convenções
- Backend: Express (`server/index.ts`, `server/routes.ts`) com sessões e Passport Local.
- ORM: Drizzle com Postgres (Supabase) e esquemas em `shared/schema.ts` (source-of-truth).
- Frontend: React + Vite + Tailwind + Wouter; dados com React Query.
- Rotas de API prefixadas com `/api` e respostas JSON.

## Esquemas de Banco (Drizzle)
1. Usuários (`users`)
- Campos: `id (uuid)`, `username (unique)`, `password (hash)` — já existe (`shared/schema.ts`).
- Adição: índices em `username`.

2. Contas (`accounts`)
- `id (uuid)`, `name`, `type (checking, savings, credit)`, `balance (numeric)`, `user_id (fk users)`.

3. Categorias (`categories`)
- `id (uuid)`, `name`, `type (income|expense)`, `user_id (fk users)`.

4. Transações (`transactions`)
- `id (uuid)`, `account_id (fk accounts)`, `category_id (fk categories)`, `user_id (fk users)`, `amount (numeric)`, `date (date)`, `description (text)`.
- Índices: `user_id+date`, `account_id`, `category_id`.

5. Orçamentos (opcional, fase 2) (`budgets`)
- `id`, `user_id`, `category_id`, `month (date)`, `limit (numeric)`.

6. Sessões (por `connect-pg-simple`)
- Tabela `session` será criada automaticamente pelo store.

## Endpoints Backend
### Autenticação `/api/auth`
- `POST /api/auth/register` — valida com Zod, hash de senha (`bcryptjs`), cria usuário.
- `POST /api/auth/login` — Passport Local, inicia sessão.
- `POST /api/auth/logout` — encerra sessão.
- `GET /api/auth/me` — retorna usuário autenticado.

### Usuários `/api/users`
- `GET /api/users/:id` — restrito ao próprio usuário ou admin (futuro).

### Contas `/api/accounts`
- `GET /api/accounts` — lista do usuário.
- `POST /api/accounts` — cria.
- `PUT /api/accounts/:id` — atualiza.
- `DELETE /api/accounts/:id` — remove (soft delete opcional).

### Categorias `/api/categories`
- CRUD similar a contas.

### Transações `/api/transactions`
- `GET /api/transactions` — filtros por data, conta, categoria.
- `POST /api/transactions` — cria.
- `PUT /api/transactions/:id` — atualiza.
- `DELETE /api/transactions/:id` — remove.

## Integrações e Segurança
- Hash de senha: adicionar `bcryptjs` (evita build nativo em Windows).
- Sessões: `express-session` + `connect-pg-simple` usando `DATABASE_URL` (já validado).
- Variáveis: backend usa `DATABASE_URL`; frontend usa `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` apenas para features client-side (se necessário). Nunca expor `service_role` no front.

## Frontend
1. Tela de Login (primeira tela)
- Página `Login` com `react-hook-form` + Zod.
- Ações: `login`, link para `cadastro`.
- Ao autenticar, redirecionar para `Dashboard`.

2. Tela de Cadastro de Usuário
- Página `Register` com validação, chama `POST /api/auth/register`.

3. Proteção de Rotas
- Guard no router: consulta `GET /api/auth/me` ao carregar; se não autenticado, redireciona para `/login`.

4. CRUDs
- Contas/Categorias/Transações: páginas de lista e formulário; hooks com React Query (useQuery/useMutation); componentes de tabela e modais (Radix UI).

## Alterações no Código (Planejadas)
- `server/index.ts`: configurar `express-session`, Passport e `connect-pg-simple`.
- `server/routes.ts`: implementar rotas `/api/auth`, `/api/accounts`, `/api/categories`, `/api/transactions`.
- `server/storage.ts`: adicionar métodos para contas, categorias e transações (DbStorage usando Drizzle).
- `shared/schema.ts`: adicionar tabelas `accounts`, `categories`, `transactions` e tipos Zod.
- `client/src/App.tsx`: adicionar rota `/login` e `/register`; aplicar guard nas demais.
- Páginas novas: `client/src/pages/Login.tsx`, `client/src/pages/Register.tsx`.
- Hooks API: `client/src/lib/api.ts` com wrappers para chamadas; `client/src/lib/auth.ts` para estado do usuário.

## Fluxo de Execução
- Dev: `npm run dev` (Node 20 recomendado); ou `cross-env DATABASE_URL=... npm run dev`.
- Build: `npm run build` → `npm start`.

## Critérios de Aceite
- `GET /api/health` retorna `db: true` (funcionando).
- Registrar e logar usuário; `GET /api/auth/me` retorna usuário autenticado.
- Criar conta, categoria e transação; listar e editar.
- Login obrigatório para acessar Dashboard e páginas de CRUD.

## Próximas Fases (Planejamento)
- Orçamentos e relatórios (gráficos, agregações por mês/categoria).
- Importação CSV/OFX.
- Recorrências de transação.
- Auditoria simples (created_at/updated_at e quem alterou).

Confirma implementar agora a Fase 1 (autenticação + CRUD básico de contas/categorias/transações + telas Login/Register)?