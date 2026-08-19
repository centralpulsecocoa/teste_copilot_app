(() => {
  "use strict";
  const cfg = window.APP_CONFIG;
  const state = { allRows: [], filteredRows: [], columns: [], mapped: {}, page: 1, pageSize: 25, sortColumn: null, sortDirection: 1, chart: null };
  const $ = id => document.getElementById(id);
  const normalize = value => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
  const number = value => {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    let text = String(value ?? "").trim().replace(/\s/g, "");
    if (!text) return 0;
    if (text.includes(",") && text.includes(".")) text = text.lastIndexOf(",") > text.lastIndexOf(".") ? text.replace(/\./g, "").replace(",", ".") : text.replace(/,/g, "");
    else if (text.includes(",")) text = text.replace(",", ".");
    const parsed = Number(text.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const formatNumber = value => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value || 0);
  const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
  const unique = values => [...new Set(values.map(v => String(v ?? "").trim()).filter(Boolean))].sort((a,b) => a.localeCompare(b, "pt-BR", { numeric: true }));

  function mapColumns() {
    const normalizedColumns = new Map(state.columns.map(c => [normalize(c), c]));
    for (const [key, aliases] of Object.entries(cfg.columnAliases)) {
      state.mapped[key] = aliases.map(normalize).map(alias => normalizedColumns.get(alias)).find(Boolean) || null;
    }
  }

  function value(row, key) { return state.mapped[key] ? row[state.mapped[key]] : ""; }

  async function loadExcel() {
    try {
      if (typeof XLSX === "undefined") throw new Error("A biblioteca XLSX não foi carregada. Verifique a conexão com a internet.");
      const response = await fetch(`${cfg.excelPath}?v=${Date.now()}`);
      if (!response.ok) throw new Error(`Arquivo não encontrado: ${cfg.excelPath} (HTTP ${response.status})`);
      const bytes = await response.arrayBuffer();
      const workbook = XLSX.read(bytes, { type: "array", cellDates: true });
      const sheetName = cfg.sheetName && workbook.SheetNames.includes(cfg.sheetName) ? cfg.sheetName : workbook.SheetNames[0];
      if (!sheetName) throw new Error("O Excel não possui planilhas disponíveis.");
      state.allRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "", raw: false });
      if (!state.allRows.length) throw new Error(`A planilha "${sheetName}" não possui registros.`);
      state.columns = [...new Set(state.allRows.flatMap(Object.keys))];
      mapColumns();
      populateFilters();
      applyFilters();
      $("dataStatus").textContent = `${state.allRows.length.toLocaleString("pt-BR")} registros carregados • Aba: ${sheetName}`;
      $("lastUpdate").textContent = `Última atualização: ${new Date().toLocaleString("pt-BR")}`;
    } catch (error) {
      console.error(error);
      $("errorMessage").textContent = error.message;
      $("errorPanel").classList.remove("hidden");
      $("dataStatus").textContent = "Falha no carregamento";
    } finally {
      $("loading").classList.add("hidden");
    }
  }

  function populateSelect(id, values) {
    const select = $(id), first = select.options[0].outerHTML;
    select.innerHTML = first + unique(values).map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");
  }
  function populateFilters() {
    populateSelect("supplierFilter", state.allRows.map(r => value(r, "supplier")));
    populateSelect("statusFilter", state.allRows.map(r => value(r, "status")));
    populateSelect("warehouseFilter", state.allRows.map(r => value(r, "warehouse")));
  }

  function applyFilters() {
    const supplier = normalize($("supplierFilter").value), status = normalize($("statusFilter").value), warehouse = normalize($("warehouseFilter").value), search = normalize($("searchInput").value);
    state.filteredRows = state.allRows.filter(row => {
      if (supplier && normalize(value(row, "supplier")) !== supplier) return false;
      if (status && normalize(value(row, "status")) !== status) return false;
      if (warehouse && normalize(value(row, "warehouse")) !== warehouse) return false;
      if (search && !state.columns.some(col => normalize(row[col]).includes(search))) return false;
      return true;
    });
    if (state.sortColumn) sortRows(false);
    state.page = 1;
    updateDashboard();
  }

  function updateDashboard() { updateCards(); updateChart(); renderTable(); }
  function updateCards() {
    const rows = state.filteredRows;
    const vehicles = state.mapped.vehicle ? unique(rows.map(r => value(r, "vehicle"))).length : rows.length;
    const bags = state.mapped.bags ? rows.reduce((sum, row) => sum + number(value(row, "bags")), 0) : 0;
    const complete = rows.filter(r => cfg.completedTerms.some(term => normalize(value(r, "status")).includes(normalize(term)))).length;
    const rate = rows.length ? complete / rows.length * 100 : 0;
    $("totalVehicles").textContent = formatNumber(vehicles);
    $("totalBags").textContent = formatNumber(bags);
    $("totalCompleted").textContent = formatNumber(complete);
    $("completionRate").textContent = `${rate.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
    $("completionProgress").style.width = `${Math.min(rate, 100)}%`;
  }

  function updateChart() {
    const counts = new Map();
    state.filteredRows.forEach(row => { const key = String(value(row, "status") || "Não informado").trim(); counts.set(key, (counts.get(key) || 0) + 1); });
    const labels = [...counts.keys()], data = [...counts.values()];
    $("chartEmpty").classList.toggle("hidden", data.length > 0);
    if (state.chart) state.chart.destroy();
    if (!data.length || typeof Chart === "undefined") return;
    state.chart = new Chart($("statusChart"), {
      type: "doughnut",
      data: { labels, datasets: [{ data, backgroundColor: labels.map((_, i) => cfg.chartColors[i % cfg.chartColors.length]), borderColor: "#ffffff", borderWidth: 3, hoverOffset: 7 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: "62%", plugins: { legend: { position: "bottom", labels: { usePointStyle: true, padding: 16 } }, tooltip: { callbacks: { label: ctx => { const total = ctx.dataset.data.reduce((a,b) => a+b, 0); return ` ${ctx.label}: ${ctx.raw} (${(ctx.raw/total*100).toFixed(1)}%)`; } } } } }
    });
  }

  function renderTable() {
    const head = $("dataTable").querySelector("thead"), body = $("dataTable").querySelector("tbody");
    head.innerHTML = `<tr>${state.columns.map(col => `<th data-column="${escapeHtml(col)}">${escapeHtml(col)}${state.sortColumn === col ? (state.sortDirection === 1 ? " ▲" : " ▼") : ""}</th>`).join("")}</tr>`;
    head.querySelectorAll("th").forEach(th => th.addEventListener("click", () => sortRows(true, th.dataset.column)));
    const pages = Math.max(1, Math.ceil(state.filteredRows.length / state.pageSize));
    state.page = Math.min(state.page, pages);
    const start = (state.page - 1) * state.pageSize;
    const rows = state.filteredRows.slice(start, start + state.pageSize);
    body.innerHTML = rows.length ? rows.map(row => `<tr>${state.columns.map(col => `<td title="${escapeHtml(row[col])}">${escapeHtml(row[col])}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${Math.max(state.columns.length, 1)}" class="empty-message">Nenhum registro encontrado.</td></tr>`;
    $("recordCount").textContent = `${state.filteredRows.length.toLocaleString("pt-BR")} registros`;
    $("pageInfo").textContent = `Página ${state.page} de ${pages}`;
    $("prevPage").disabled = state.page <= 1;
    $("nextPage").disabled = state.page >= pages;
  }

  function sortRows(render = true, column = state.sortColumn) {
    if (!column) return;
    if (render) state.sortDirection = state.sortColumn === column ? state.sortDirection * -1 : 1;
    state.sortColumn = column;
    state.filteredRows.sort((a,b) => String(a[column] ?? "").localeCompare(String(b[column] ?? ""), "pt-BR", { numeric: true }) * state.sortDirection);
    if (render) renderTable();
  }

  function exportFiltered() {
    if (!state.filteredRows.length) return alert("Não há registros para exportar.");
    const ws = XLSX.utils.json_to_sheet(state.filteredRows, { header: state.columns });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dados Filtrados");
    XLSX.writeFile(wb, `agendamentos_filtrados_${new Date().toISOString().slice(0,10)}.xlsx`);
  }

  ["supplierFilter", "statusFilter", "warehouseFilter"].forEach(id => $(id).addEventListener("change", applyFilters));
  let timer; $("searchInput").addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(applyFilters, 250); });
  $("clearFilters").addEventListener("click", () => { ["supplierFilter","statusFilter","warehouseFilter","searchInput"].forEach(id => $(id).value = ""); applyFilters(); });
  $("pageSize").addEventListener("change", e => { state.pageSize = Number(e.target.value); state.page = 1; renderTable(); });
  $("prevPage").addEventListener("click", () => { if (state.page > 1) { state.page--; renderTable(); } });
  $("nextPage").addEventListener("click", () => { if (state.page * state.pageSize < state.filteredRows.length) { state.page++; renderTable(); } });
  $("exportButton").addEventListener("click", exportFiltered);
  loadExcel();
})();
