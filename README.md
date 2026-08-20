# Dashboard de Sustentabilidade e Rastreabilidade

## Instalação
1. Coloque `qry_rastreabilidade.xlsx` e `acesso.xlsx` na pasta `data`.
2. Confirme que a base principal contém a aba `app_traceability`.
3. Confirme que `acesso.xlsx` contém as colunas exatas `usuario` e `senha`.
4. Publique todo o conteúdo desta pasta na raiz do GitHub Pages.

## Teste local
```bash
python -m http.server 8000
```
Acesse `http://localhost:8000`.

## Atenção de segurança
O login com `acesso.xlsx` é apenas uma barreira visual. Em GitHub Pages, arquivos enviados ao site podem ser acessados pelo navegador. Não use dados pessoais, confidenciais ou senhas corporativas reais. Para proteção efetiva, migre a autenticação para Microsoft Entra ID, Azure Static Web Apps ou um backend.

## Arquivos esperados
- `data/qry_rastreabilidade.xlsx`
- `data/acesso.xlsx`
- aba `app_traceability`
- `usuario` e `senha` em `acesso.xlsx`

Os logos fornecidos já estão em `assets`.
