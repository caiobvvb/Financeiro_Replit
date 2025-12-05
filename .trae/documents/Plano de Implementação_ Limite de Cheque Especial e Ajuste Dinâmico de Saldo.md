# Melhorias no Sistema de Contas e Transações

## 1. Banco de Dados e Schema
- **Atualizar Tabela `accounts`**: Adicionar coluna `overdraft_limit` (numérico, padrão 0).
- **Categoria de Sistema**: Garantir a existência da categoria "Ajuste de Saldo" (ID: `4c8c2765-74a9-45d2-9634-42ee4541a333`).
  - *Nota*: Como a tabela `categories` exige `user_id`, implementaremos uma verificação para criar/associar esta categoria ao usuário atual quando necessário, ou ajustaremos o schema se possível para permitir categorias globais.
- **Atualizar `shared/schema.ts`**: Refletir as mudanças nas definições do Drizzle e Zod.

## 2. Backend (API)
- **Atualizar `server/routes.ts`**:
  - Ajustar a criação/edição de contas para aceitar e salvar o `overdraft_limit`.

## 3. Frontend - Página de Contas (`BankAccounts.tsx`)
- **Cálculo Dinâmico de Saldo**:
  - Implementar busca de transações para calcular o saldo real em tempo real.
  - Fórmula: `Saldo Atual = Saldo Inicial (Cadastro) + Receitas Pagas - Despesas Pagas`.
- **Formulário de Conta**:
  - Adicionar campo "Limite de Cheque Especial".
- **Cards de Conta**:
  - Exibir "Saldo Atual" (Calculado).
  - Exibir "Limite Disponível" (`Saldo Atual + Limite`).
  - Adicionar botão "Ajustar Saldo".
- **Modal de Ajuste de Saldo**:
  - Criar modal para inserir o novo saldo desejado.
  - Lógica para calcular a diferença e criar automaticamente a transação de ajuste.

## 4. Frontend - Detalhes da Conta (`AccountDetails.tsx`)
- Atualizar a exibição para usar a mesma lógica de cálculo dinâmico e mostrar o limite de cheque especial.

## 5. Validação e Testes
- Verificar se o saldo é atualizado corretamente ao criar/editar transações.
- Testar o fluxo de ajuste de saldo (criação da transação automática).
- Garantir que o limite de cheque especial seja salvo e exibido corretamente.
