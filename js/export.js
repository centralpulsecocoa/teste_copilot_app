/*
 * export.js
 * Exporta os registros atualmente exibidos (já filtrados) para um arquivo Excel.
 * O nome do arquivo reflete o Fornecedor selecionado no filtro.
 */

function exportarExcel(dadosFiltrados) {
  if (!dadosFiltrados || !dadosFiltrados.length) {
    alert('Não há registros para exportar com os filtros atuais.');
    return;
  }

  const fornecedor = document.getElementById('filtro-fornecedor').value || 'Todos';

  // Monta a planilha com cabeçalhos amigáveis (sem cpf_nf)
  const linhas = dadosFiltrados.map(d => ({
    'Nome':        d.nome,
    'Fornecedor':  d.fornecedor,
    'Estado':      d.estado,
    'Filial':      d.filial,
    'Status':      d.status,
    'Volume':      d.volume,
    'CP':          d.cp,
    'Saldo':       d.saldo
  }));

  const ws = XLSX.utils.json_to_sheet(linhas);
  ws['!cols'] = [
    { wch: 24 }, { wch: 20 }, { wch: 8 }, { wch: 16 },
    { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 12 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Rastreabilidade');

  // Nome do arquivo com fornecedor + data
  const safe = fornecedor.replace(/[^\w\-À-ÿ ]/g, '').replace(/\s+/g, '_');
  const hoje = new Date().toISOString().slice(0, 10);
  const nomeArquivo = `Rastreabilidade_${safe}_${hoje}.xlsx`;

  XLSX.writeFile(wb, nomeArquivo);
}
