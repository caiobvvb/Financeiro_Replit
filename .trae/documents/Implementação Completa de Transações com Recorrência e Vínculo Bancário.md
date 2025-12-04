# Plano de Implementação: Página de Transações Completa

Vamos transformar a página `/transactions` (atualmente estática) em uma funcionalidade completa, integrada ao banco de dados Supabase, com suporte a contas bancárias, recorrência, tags e status de pagamento.

## 1. Atualização do Banco de Dados (SQL)

Precisamos adicionar colunas à tabela `transactions` para suportar os novos requisitos.

**Script SQL (para executar no Editor SQL do Supabase):**

```sql
-- Adicionar novas colunas na tabela transactions
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_fixed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_recurring boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS recurrence_frequency text CHECK (recurrence_frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
ADD COLUMN IF NOT EXISTS recurrence_count int,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'paid' CHECK (status IN ('pending', 'paid'));

-- Garantir que RLS (Row Level Security) esteja ativo
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem para evitar duplicidade (opcional, mas seguro)
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;

-- Criar políticas de segurança (RLS)
CREATE POLICY "Users can view their own transactions" 
ON public.transactions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" 
ON public.transactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" 
ON public.transactions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions" 
ON public.transactions FOR DELETE 
USING (auth.uid() = user_id);
```

## 2. Frontend: Página de Transações (`Transactions.tsx`)

Vamos reescrever o componente para:

1.  **Carregar Dados Reais**:
    *   Buscar transações do Supabase (`transactions`).
    *   Buscar contas bancárias (`accounts`) para preencher o seletor.
    *   Buscar categorias (`categories`) para o seletor.

2.  **Formulário de Nova/Edição de Transação**:
    *   **Descrição**: Campo de texto.
    *   **Valor**: Campo numérico (com formatação de moeda).
    *   **Tipo**: Receita ou Despesa.
    *   **Conta Bancária**: Seletor (dropdown) listando as contas cadastradas.
    *   **Categoria**: Seletor de categorias.
    *   **Data**: Date picker ou input de data.
    *   **Status**: Seletor ou Switch ("Pago" / "Pendente").
    *   **Tags**: Input de texto (separado por vírgula).
    *   **Opções Avançadas**:
        *   Checkbox "Transação Fixa".
        *   Checkbox "Transação Recorrente".
        *   Se recorrente: Seletor de Frequência (Mensal, Semanal, etc.) e Input de "Quantas vezes" (ou "Infinito").

3.  **Listagem e Filtros**:
    *   Tabela listando as transações reais.
    *   Colunas para Tags e Status.
    *   Filtros básicos (Mês atual, Tipo).

4.  **Ações**:
    *   Salvar (INSERT/UPDATE).
    *   Excluir (DELETE).
    *   Marcar como pago/pendente diretamente na lista.

## 3. Passos de Execução

1.  **Executar SQL**: Você precisará rodar o script SQL acima no seu painel do Supabase para preparar o banco. (Eu posso simular a execução se tivermos a ferramenta MCP configurada, ou assumir que você fará isso).
2.  **Atualizar Código**: Vou modificar o arquivo `client/src/pages/Transactions.tsx` para implementar toda a lógica descrita.

Este plano cobre todos os requisitos: associação com contas, tags, recorrência, status de pagamento e segurança via RLS.
