# Dashboard de Rastreabilidade | Sustentabilidade

Dashboard estático publicado no **GitHub Pages**. Lê um arquivo Excel do próprio
repositório e exibe cards, filtros, gráfico de rosca e tabela.

## Estrutura

```
/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── excel-reader.js
│   ├── charts.js
│   └── app.js
├── data/
│   └── qry_rastreabilidade.xlsx   <-- coloque seu Excel aqui
├── assets/
│   ├── logo-datasquad.png
│   └── logo-ofi.png
└── README.md
```

## Como publicar

1. Suba todos os arquivos para o repositório no GitHub.
2. Vá em **Settings > Pages**.
3. Em *Source*, selecione a branch `main` e a pasta `/root`.
4. Acesse a URL gerada (ex.: `https://SEU-USUARIO.github.io/SEU-REPO/`).

## Requisitos do Excel

- Nome do arquivo: `qry_rastreabilidade.xlsx`
- Aba: `app_traceability`
- Colunas usadas: `nome_nf`, `Fornecedor`, `Estado`, `Filial`,
  `status_acomp_campo`, `Soma de quantidade_nf`, `CP`, `SALDO`
- A coluna `cpf_nf` é **ignorada** e nunca é exibida.

## Observação importante

O dashboard usa `fetch()` para ler o Excel, o que **exige um servidor HTTP**.
Funciona normalmente no GitHub Pages. Se você abrir o `index.html` direto do
seu computador (file://), o navegador bloqueia a leitura. Para testar local:

```bash
python -m http.server 8000
# abra http://localhost:8000
```

## Novidades

- **Exportar para Excel**: botão acima da tabela gera um `.xlsx` apenas com os
  registros filtrados. O nome do arquivo inclui o Fornecedor selecionado, ex.:
  `Rastreabilidade_Coopercabruca_2026-08-20.xlsx`.
- **Mapa do Brasil**: mapa coroplético que colore cada estado pelo volume
  (`Soma de quantidade_nf`), reagindo aos filtros. O GeoJSON dos estados é
  carregado via CDN (jsDelivr), então requer conexão com a internet.
