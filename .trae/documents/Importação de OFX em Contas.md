## Objetivo
Implementar importação de extratos OFX dentro de /contas/:id, com seleção de arquivo, pré-visualização, deduplicação, gravação segura em `bank_transactions` e registro do período/metadata da importação.

## Mudanças de Banco de Dados
1. Criar tabela `bank_imports`:
   - Campos: `id (uuid)`, `user_id (text)`, `account_id (text)`, `source_label (text)`, `period_start (date)`, `period_end (date)`, `imported_at (timestamp)`, `entry_count (int)`, `file_checksum (text)`.
2. Adicionar colunas em `bank_transactions`:
   - `fitid (text)` para identificar transações do OFX.
   - `import_id (uuid)` relacionando o lote de importação.
   - `is_transfer (boolean)` e opcional `transfer_group_id (uuid)` para correlacionar pares de transferência.
3. Índices/uniques:
   - `unique(account_id, fitid)` para deduplicação forte.
   - Índice em `import_id`.

## UI/UX
1. `AccountDetails.tsx` (cabeçalho): adicionar botão `Importar OFX` ao lado de `Nova Transação`.
2. Abrir um diálogo em etapas:
   - Etapa 1: Seleção do arquivo `.ofx` (File input).
   - Etapa 2: Pré-visualização em tabela (Descrição, Data, Valor, Tipo), com avisos de duplicados e marcação de prováveis transferências.
   - Etapa 3: Confirmação: resumo (quantidade de lançamentos, período, duplicados ignorados). Botões `Cancelar` e `Importar`.
3. Mostrar “Última importação” (data e período) no header da conta, consultando `bank_imports`.

## Parsing OFX
1. Parsing client-side via File API, sem enviar o arquivo.
2. Implementar parser leve para OFX (SGML):
   - Consumir blocos `STMTTRN` e campos principais: `DTPOSTED`, `TRNAMT`, `FITID`, `NAME`, `MEMO`.
   - Datas `DTPOSTED` no formato `YYYYMMDD[HHMMSS]` com timezone opcional.
   - Descrição: usar `NAME` e complementar com `MEMO` quando existir.
3. Mapear para `bank_transactions`:
   - `amount`: número (positivo receita, negativo despesa); `type` derivado do sinal na UI.
   - `date`: ISO `YYYY-MM-DD`.
   - `description`: texto do OFX.
   - `status`: sempre `paid`/`recebido` (usar `"paid"` em DB; UI exibe Pago/Recebido).
   - `category_id`: `null` (usuário categoriza depois).
   - `tags`: `[]` (sem tags iniciais).
   - `fitid`, `is_transfer` e `import_id` conforme abaixo.

## Deduplicação
1. Forte: checar existência de `fitid` para a `account_id` (unique impede duplicatas).
2. Fallback quando o OFX não fornecer `FITID`:
   - Fingerprint por `(date, amount, normalize(description))` dentro do período.
   - Sinalizar como “suspeito duplicado” na pré-visualização; permitir desmarcar/ignorar.
3. Evitar reimportar o mesmo arquivo usando `file_checksum` (hash SHA-256 do conteúdo) armazenado em `bank_imports`;
   - Ao importar, bloquear se checksum e período já foram importados.

## Identificação de Transferências
1. Heurísticas por descrição: regex para `PIX`, `TED`, `DOC`, `Transferência`, `Transf.`, `Envio`, `Receb.`.
2. Marcar `is_transfer = true` e tag interna `transfer` (opcional) para facilitar filtro.
3. Se ambos os lados forem importados (em contas diferentes), usar `transfer_group_id` para correlacionar pares com mesmo valor e data (tolerância de ±1 dia) e descrições compatíveis.

## Gravação & Metadados
1. Na confirmação, criar um registro em `bank_imports` com período (`min(date)`, `max(date)`), quantidade e `file_checksum`.
2. Inserir lote em `bank_transactions` com `import_id` e `fitid` (quando disponível), ignorando duplicados já sinalizados.
3. Atualizar cabeçalho “Última importação” no front consultando `bank_imports` (último por `imported_at`).

## Validações
- Bloquear importação sem arquivo ou com extensão inválida.
- Alertar quando não houver transações válidas no OFX.
- Mostrar contagem de duplicados e permitir excluir antes de confirmar.
- Garantir que `account_id` do contexto está presente e usuário autenticado.

## Testes
1. Parser: unit tests para `DTPOSTED`, `TRNAMT` (positivo/negativo), extração de `FITID`, descrição.
2. Deduplicação: testes com/sem `FITID` e fingerprints.
3. Integração: importar arquivo mock e validar criação em `bank_transactions` e `bank_imports`.

## Arquivos/Locais a Alterar
- `client/src/pages/AccountDetails.tsx`: botão “Importar OFX”, exibição “Última importação”, integração do diálogo.
- Novo componente `components/transactions/OfxImportDialog.tsx`: fluxo, parser e pré-visualização.
- Migrations SQL: criar `bank_imports` e adicionar colunas/constraints em `bank_transactions`.

## Entregáveis
- UI funcional de importação com pré-visualização e confirmação.
- Parser OFX robusto compatível com Nubank/Inter (SGML).
- Deduplicação confiável via `FITID` e fallback por fingerprint.
- Registro do período e checksum da importação; exibição da última importação.
- Identificação básica de transferências por heurística e possível correlação futura.

Confirma seguir com esta implementação?