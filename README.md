# Dashboard de Agendamentos

Dashboard estático para GitHub Pages, com leitura do arquivo `data/teste_agendameto.xlsx` diretamente no navegador.

## Funcionalidades

- Cards de total de veículos, total de sacos, concluídos e percentual concluído
- Filtros por fornecedor, situação e depósito
- Pesquisa em todas as colunas
- Gráfico em rosca por situação
- Tabela responsiva com paginação e ordenação
- Exportação dos registros filtrados para Excel
- Data e hora do último carregamento
- Layout responsivo com a cor principal `#870064`
- Detecção flexível de nomes de colunas

## Estrutura

```text
index.html
css/style.css
js/config.js
js/app.js
assets/logo-data-squad.svg
assets/logo-ofi.svg
data/teste_agendameto.xlsx
```

## Instalação

1. Copie o Excel real para `data/teste_agendameto.xlsx`.
2. Substitua os SVGs de `assets` pelos logos oficiais, mantendo os mesmos nomes, se desejar.
3. Envie todos os arquivos para a raiz do repositório GitHub.
4. No GitHub, acesse **Settings > Pages**.
5. Em **Build and deployment**, selecione **Deploy from a branch**.
6. Escolha a branch `main` e a pasta `/ (root)`.
7. Salve e aguarde a URL do GitHub Pages.

## Teste local

Não abra o HTML diretamente com duplo clique, pois o navegador pode bloquear a leitura do Excel. Na pasta do projeto, execute:

```bash
python -m http.server 8000
```

Depois acesse:

```text
http://localhost:8000
```

## Nomes de colunas reconhecidos

A configuração fica em `js/config.js`. Por padrão, o dashboard procura variações de:

- Fornecedor: `Fornecedor`, `Supplier`, `Fornecedor Nome`
- Situação: `Situação`, `Status`, `Status Agendamento`
- Depósito: `Depósito`, `Warehouse`, `Armazém`
- Sacos: `Sacos`, `Quantidade Sacos`, `Qtd Sacos`, `Bags`
- Veículo: `Veículo`, `Placa`, `Vehicle`

Se a sua planilha usar outro cabeçalho, basta acrescentá-lo na lista correspondente em `columnAliases`.

## Observações

- O projeto usa SheetJS e Chart.js por CDN, portanto precisa de internet para carregar essas bibliotecas.
- O Excel fica publicamente acessível quando o repositório e o GitHub Pages são públicos. Não publique dados confidenciais.
- Os logos incluídos são placeholders. Substitua pelos arquivos oficiais mantendo os nomes ou altere os caminhos no `index.html`.
