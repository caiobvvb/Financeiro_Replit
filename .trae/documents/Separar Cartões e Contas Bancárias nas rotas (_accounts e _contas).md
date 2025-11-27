## Objetivo
Separar a tela atual de “Minhas Contas” em duas páginas distintas:
- `"/accounts"` para Cartões de Crédito
- `"/contas"` para Contas Bancárias

## Alterações de Rotas
- Em `client/src/App.tsx:20–33`, manter `"/accounts"` protegida e adicionar nova rota protegida `"/contas"` apontando para um novo componente de Contas Bancárias.
- Referência atual: `client/src/App.tsx:27` define `"/accounts"` com `Accounts`. Vamos adicionar:
  - `Route path="/contas" component={() => <ProtectedRoute component={BankAccounts} />} />`

## Sidebar/Navegação
- Em `client/src/components/layout/Sidebar.tsx:15–22`, atualizar itens de menu:
  - Alterar item existente para Cartões: `{ icon: CreditCard, label: "Cartões", href: "/accounts" }`
  - Adicionar novo item para Contas Bancárias: `{ icon: Wallet, label: "Contas Bancárias", href: "/contas" }`
- Mantém o padrão de uso do `wouter` e da util `cn` para destacar rota ativa.

## Páginas
- `Accounts.tsx` (existente, agora Cartões):
  - Atualizar header para `"Meus Cartões"` e descrição focada em cartões.
  - Remover o bloco "Contas Bancárias" (linhas `116–149`).
  - Simplificar o diálogo de criação para cartões: remover seletor de tipo; manter campos `nome`, `limite`, `vencimento`, `melhor dia`.
- Nova `BankAccounts.tsx`:
  - Criar página baseada no bloco existente de contas bancárias (linhas `116–149` de `Accounts.tsx`).
  - Header `"Contas Bancárias"` e UI semelhante ao exemplo compartilhado, com cards listando contas e saldos.
  - Diálogo "Adicionar Conta" com campos `nome`, `banco`, `tipo`, `saldo inicial`.

## Ícones e UI
- Reutilizar `Wallet` para contas bancárias e `CreditCard` para cartões (já presentes em `Accounts.tsx:15`).
- Manter componentes shadcn/ui existentes (`Card`, `Button`, `Dialog`, `Select`, etc.) e o padrão visual do app.

## Proteção e Fluxo
- Ambas as rotas continuam protegidas por `ProtectedRoute` (`client/src/App.tsx:49–60`).
- Não há mudanças no fluxo de autenticação.

## Compatibilidade
- Manter `"/accounts"` funcional para quem já utiliza esse caminho.
- Introduzir `"/contas"` para a visão exclusiva de contas bancárias.

## Validação
- Verificar navegação via Sidebar e acesso direto às URLs.
- Checar destaque de item ativo e ausência de erros de runtime.
- Atualizar textos para PT-BR conforme cada página.

## Entregáveis
- Rotas atualizadas em `App.tsx`.
- Sidebar com dois itens separados.
- `Accounts.tsx` focada em Cartões.
- Nova página `BankAccounts.tsx` focada em Contas Bancárias.