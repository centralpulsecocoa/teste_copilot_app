/*
 * excel-reader.js
 * Lê o arquivo Excel em data/qry_rastreabilidade.xlsx (aba app_traceability)
 * e devolve os registros já normalizados.
 * IMPORTANTE: a coluna cpf_nf é ignorada de propósito e nunca é carregada.
 */

const ARQUIVO = 'data/qry_rastreabilidade.xlsx';
const ABA = 'app_traceability';

// Converte texto tipo "1.234,56" ou "1234.56" em número
function paraNumero(v) {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return v;
  let s = String(v).trim().replace(/\s/g, '');
  // formato brasileiro: remove pontos de milhar e troca vírgula por ponto
  if (s.indexOf(',') > -1) s = s.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

async function carregarDados() {
  const resp = await fetch(ARQUIVO);
  if (!resp.ok) {
    throw new Error('Não foi possível abrir ' + ARQUIVO + ' (HTTP ' + resp.status + ')');
  }
  const buffer = await resp.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  if (!workbook.Sheets[ABA]) {
    throw new Error('Aba "' + ABA + '" não encontrada. Abas disponíveis: ' + workbook.SheetNames.join(', '));
  }

  const linhas = XLSX.utils.sheet_to_json(workbook.Sheets[ABA], { defval: '' });

  // Mapeia somente as colunas necessárias (cpf_nf NÃO entra)
  return linhas.map(r => ({
    nome:       r['nome_nf']              ?? '',
    fornecedor: r['Fornecedor']           ?? '',
    estado:     r['Estado']               ?? '',
    filial:     r['Filial']               ?? '',
    status:     r['status_acomp_campo']   ?? '',
    volume:     paraNumero(r['Soma de quantidade_nf']),
    cp:         paraNumero(r['CP']),
    saldo:      paraNumero(r['SALDO'])
  }));
}
