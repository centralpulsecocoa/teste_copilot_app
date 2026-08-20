/*
 * map.js
 * Mapa coroplético do Brasil colorido pelo volume (Soma de quantidade_nf)
 * agregado por estado. Usa Leaflet + GeoJSON dos estados carregado via CDN.
 */

// GeoJSON dos estados do Brasil (nome completo em properties.name), via jsDelivr
const GEOJSON_URL = 'https://cdn.jsdelivr.net/gh/codeforgermany/click_that_hood@main/public/data/brazil-states.geojson';

// Nome completo -> sigla (UF)
const NOME_PARA_UF = {
  'Acre':'AC','Alagoas':'AL','Amapá':'AP','Amazonas':'AM','Bahia':'BA',
  'Ceará':'CE','Distrito Federal':'DF','Espírito Santo':'ES','Goiás':'GO',
  'Maranhão':'MA','Mato Grosso':'MT','Mato Grosso do Sul':'MS','Minas Gerais':'MG',
  'Pará':'PA','Paraíba':'PB','Paraná':'PR','Pernambuco':'PE','Piauí':'PI',
  'Rio de Janeiro':'RJ','Rio Grande do Norte':'RN','Rio Grande do Sul':'RS',
  'Rondônia':'RO','Roraima':'RR','Santa Catarina':'SC','São Paulo':'SP',
  'Sergipe':'SE','Tocantins':'TO'
};

let mapa = null;
let camadaGeo = null;
let legenda = null;
let volumePorUF = {};   // { 'BA': 1234, ... }
let maxVolume = 0;

// Escala de cor (tons da marca #870064)
function corPorValor(v) {
  if (!v || maxVolume === 0) return '#eeeeee';
  const t = v / maxVolume;            // 0..1
  if (t > 0.8) return '#4d0039';
  if (t > 0.6) return '#870064';
  if (t > 0.4) return '#b3308f';
  if (t > 0.2) return '#d17ab8';
  return '#efc9e2';
}

function estiloEstado(feature) {
  const uf = NOME_PARA_UF[feature.properties.name] || feature.properties.name;
  return {
    fillColor: corPorValor(volumePorUF[uf] || 0),
    weight: 1,
    opacity: 1,
    color: '#ffffff',
    fillOpacity: 0.85
  };
}

async function iniciarMapa() {
  mapa = L.map('mapa', { attributionControl: false, zoomControl: true })
          .setView([-14.2, -51.9], 4);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd', maxZoom: 10
  }).addTo(mapa);

  try {
    const resp = await fetch(GEOJSON_URL);
    const geo = await resp.json();

    camadaGeo = L.geoJSON(geo, {
      style: estiloEstado,
      onEachFeature: (feature, layer) => {
        const uf = NOME_PARA_UF[feature.properties.name] || feature.properties.name;
        layer.on('mouseover', () => layer.setStyle({ weight: 2, color: '#333' }));
        layer.on('mouseout', () => camadaGeo.resetStyle(layer));
        layer.bindTooltip('', { sticky: true });
        layer._uf = uf;
        layer._nome = feature.properties.name;
      }
    }).addTo(mapa);

    // Legenda
    legenda = L.control({ position: 'bottomright' });
    legenda.onAdd = function () {
      const div = L.DomUtil.create('div', 'map-legend');
      const faixas = ['#efc9e2','#d17ab8','#b3308f','#870064','#4d0039'];
      const rots   = ['baixo','','médio','','alto'];
      div.innerHTML = '<strong>Volume</strong><br>' +
        faixas.map((c,i) => `<span style="background:${c}"></span>${rots[i]}`).join('<br>');
      return div;
    };
    legenda.addTo(mapa);

    // Se dados já estavam prontos, aplica agora
    if (window._dadosMapaPendentes) {
      atualizarMapa(window._dadosMapaPendentes);
      window._dadosMapaPendentes = null;
    }
  } catch (e) {
    document.getElementById('mapa').innerHTML =
      '<div class="alert alert-warning m-0">Não foi possível carregar o mapa do Brasil.</div>';
    console.error('Erro ao carregar GeoJSON:', e);
  }
}

const fmtMapa = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

function atualizarMapa(dados) {
  // Se o mapa ainda não terminou de carregar o GeoJSON, guarda para depois
  if (!camadaGeo) { window._dadosMapaPendentes = dados; return; }

  volumePorUF = {};
  dados.forEach(d => {
    const uf = (d.estado || '').toUpperCase().trim();
    volumePorUF[uf] = (volumePorUF[uf] || 0) + d.volume;
  });
  maxVolume = Math.max(0, ...Object.values(volumePorUF));

  camadaGeo.setStyle(estiloEstado);
  camadaGeo.eachLayer(layer => {
    const v = volumePorUF[layer._uf] || 0;
    layer.setTooltipContent(`<strong>${layer._nome} (${layer._uf})</strong><br>Volume: ${fmtMapa.format(v)}`);
  });
}
