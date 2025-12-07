# Importação de Faturas em PDF

## Onde acessar
- Na página de faturas (`/faturas/:cardId`), use o botão **Importar PDF**.

## Passos
- Clique em **Importar PDF** e selecione o arquivo.
- Se o PDF estiver protegido, informe a senha para leitura.
- Revise a lista de transações extraídas e desmarque duplicadas se necessário.
- Confirme a importação para salvar na fatura do cartão atual.

## Regras
- Banco emissor é identificado automaticamente (heurísticas por texto/arquivo).
- Categorias ficam como **Sem categoria**; edite após importar.
- Cada transação é vinculada à fatura correta usando o ciclo do cartão (fechamento/vencimento).

## Erros comuns
- "Nenhuma transação encontrada": verifique se o PDF é o da fatura.
- "PDF com senha": informe a senha correta.
- "Falha ao salvar": tente novamente; verifique conexão/autenticação.

