/*
 * app.js
 * Orquestra tudo: carrega dados, monta filtros, cards, mapa, gráfico e tabela.
 */

let TODOS = [];           // todos os registros
let DADOS_FILTRADOS = []; // registros após aplicar os filtros (usado na exportação)
let tabela = null;        // instância DataTable

// Formata número no padrão brasileiro
const fmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

document.addEventListener('DOMContentLoaded', iniciar);

async function iniciar() {
  try {
    // Inicia o mapa em paralelo (carrega o GeoJSON)
    iniciarMapa();

    TODOS = await carregarDados();

    if (!TODOS.length) {
      mostrarErro('O arquivo foi lido, mas não há registros na aba app_traceability.');
      return;
    }

    document.getElementById('loading').classList.add('d-none');

    montarFiltros();
    inicializarTabela();
    aplicarFiltros();

    // Eventos dos filtros
    ['filtro-fornecedor', 'filtro-estado', 'filtro-filial', 'filtro-status']
      .forEach(id => document.getElementById(id).addEventListener('change', aplicarFiltros));

    document.getElementById('btn-limpar').addEventListener('click', limparFiltros);
    document.getElementById('btn-exportar').addEventListener('click', () => exportarExcel(DADOS_FILTRADOS));

  } catch (e) {
    mostrarErro(e.message);
    console.error(e);
  }
}

function mostrarErro(msg) {
  document.getElementById('loading').classList.add('d-none');
  const el = document.getElementById('error');
  el.textContent = 'Erro ao carregar: ' + msg;
  el.classList.remove('d-none');
}

// Preenche um <select> com valores únicos de um campo
function preencherSelect(id, campo, rotulo) {
  const sel = document.getElementById(id);
  const valores = [...new Set(TODOS.map(d => d[campo]).filter(v => v !== ''))].sort();
  sel.innerHTML = `<option value="">Todos (${rotulo})</option>` +
    valores.map(v => `<option value="${v}">${v}</option>`).join('');
}

function montarFiltros() {
  preencherSelect('filtro-fornecedor', 'fornecedor', 'Fornecedor');
  preencherSelect('filtro-estado', 'estado', 'Estado');
  preencherSelect('filtro-filial', 'filial', 'Filial');
  preencherSelect('filtro-status', 'status', 'Status');
}

function limparFiltros() {
  ['filtro-fornecedor', 'filtro-estado', 'filtro-filial', 'filtro-status']
    .forEach(id => document.getElementById(id).value = '');
  aplicarFiltros();
}

function aplicarFiltros() {
  const f = {
    fornecedor: document.getElementById('filtro-fornecedor').value,
    estado:     document.getElementById('filtro-estado').value,
    filial:     document.getElementById('filtro-filial').value,
    status:     document.getElementById('filtro-status').value
  };

  DADOS_FILTRADOS = TODOS.filter(d =>
    (!f.fornecedor || d.fornecedor === f.fornecedor) &&
    (!f.estado     || d.estado     === f.estado) &&
    (!f.filial     || d.filial     === f.filial) &&
    (!f.status     || d.status     === f.status)
  );

  atualizarCards(DADOS_FILTRADOS);
  atualizarGrafico(DADOS_FILTRADOS);
  atualizarMapa(DADOS_FILTRADOS);
  atualizarTabela(DADOS_FILTRADOS);
}

function atualizarCards(dados) {
  const volume = dados.reduce((s, d) => s + d.volume, 0);
  const cp     = dados.reduce((s, d) => s + d.cp, 0);
  const saldo  = dados.reduce((s, d) => s + d.saldo, 0);
  const prod   = new Set(dados.map(d => d.nome).filter(Boolean)).size;

  document.getElementById('card-volume').textContent     = fmt.format(volume);
  document.getElementById('card-cp').textContent         = fmt.format(cp);
  document.getElementById('card-saldo').textContent      = fmt.format(saldo);
  document.getElementById('card-produtores').textContent = fmt.format(prod);
}

function inicializarTabela() {
  tabela = $('#tabela').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.8/i18n/pt-BR.json' },
    pageLength: 10,
    columns: [
      { data: 'nome' },
      { data: 'fornecedor' },
      { data: 'estado' },
      { data: 'filial' },
      { data: 'status' },
      { data: 'volume', render: v => fmt.format(v) },
      { data: 'cp',     render: v => fmt.format(v) },
      { data: 'saldo',  render: v => fmt.format(v) }
    ]
  });
}

function atualizarTabela(dados) {
  tabela.clear();
  tabela.rows.add(dados);
  tabela.draw();
}
