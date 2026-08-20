/*
 * charts.js
 * Controla o gráfico de rosca do status.
 */

let graficoStatus = null;

const PALETA = ['#870064', '#f5a623', '#b3308f', '#5c9e31', '#3b7dd8', '#d84b4b', '#8a8a8a'];

function atualizarGrafico(dados) {
  // Agrupa por status
  const contagem = {};
  dados.forEach(d => {
    const s = d.status || 'Sem status';
    contagem[s] = (contagem[s] || 0) + 1;
  });

  const labels = Object.keys(contagem);
  const valores = Object.values(contagem);

  if (graficoStatus) {
    graficoStatus.data.labels = labels;
    graficoStatus.data.datasets[0].data = valores;
    graficoStatus.update();
    return;
  }

  const ctx = document.getElementById('grafico-status').getContext('2d');
  graficoStatus = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: valores,
        backgroundColor: PALETA,
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' }
      },
      cutout: '60%'
    }
  });
}
