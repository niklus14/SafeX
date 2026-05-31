/* ===== API + LABEL MAPS ===== */

const API = 'http://localhost:8000';

const STATUS_LABEL = {
  ai_review: 'Süni intellekt yoxlaması', manual_review: 'Operator yoxlaması',
  routed: 'Quruma yönləndirildi', in_progress: 'İcradadır',
  resolved: 'Həll edildi', rejected: 'İmtina edildi',
};
const STATUS_BADGE = {
  ai_review: 'slate', manual_review: 'amber', routed: 'blue',
  in_progress: 'orange', resolved: 'green', rejected: 'red',
};
const CATEGORY_LABEL = {
  facade: 'Bina fasadı', green_zone: 'Yaşıllıq zonası', flooding: 'Subasma',
  ice: 'Buzlaşma', cleanliness: 'Təmizlik', waste: 'Zibil konteynerləri',
  road_excavation: 'Qazılmış asfalt', road_surface: 'Asfalt örtüyü',
  signage: 'Reklam lövhələri', storefront: 'Vitrinlər',
  park_equipment: 'Park avadanlığı', fountain: 'Fontanlar',
  sidewalk: 'Səki', construction_fence: 'Tikinti hasarı',
  lighting: 'İşıqlandırma', other: 'Digər',
};
const SEVERITY_LABEL = { low: 'Aşağı', medium: 'Orta', high: 'Yüksək' };

function priorityLabel(score) {
  if (score >= 55) return 'kritik';
  if (score >= 35) return 'yuksek';
  if (score >= 15) return 'orta';
  return 'asagi';
}

// Global state
let allReports = [];       // mapped from API
let rawIssues = [];        // raw API items for detail panel
let orgsList = [];         // from GET /admin/orgs

// Category to image mapping
const CATEGORY_IMAGES = {
  road_surface: 'img/potholes.png',
  road_excavation: 'img/potholes.png',
  sidewalk: 'img/sidewalk.png',
  lighting: 'img/streetlights.png',
  flooding: 'img/floodproblem.jpeg',
  ice: 'img/floodproblem.jpeg',
  park_equipment: 'img/swing.png',
  // Default for other categories
  facade: 'img/potholes.png',
  green_zone: 'img/illegalcutting tree.jpeg',
  cleanliness: 'img/garbageproblem.jpeg',
  waste: 'img/garbageproblem.jpeg',
  signage: 'img/potholes.png',
  storefront: 'img/potholes.png',
  fountain: 'img/floodproblem.jpeg',
  construction_fence: 'img/potholes.png',
  other: 'img/potholes.png'
};

function mapIssue(i) {
  const s = i.status;
  return {
    _api_id: i.id, id: String(i.id), lat: i.lat, lng: i.lng,
    title: i.title_az || CATEGORY_LABEL[i.category] || i.category,
    desc: `${CATEGORY_LABEL[i.category] || i.category} — Nərimanov rayonu`,
    cat: CATEGORY_LABEL[i.category] || i.category, _cat: i.category,
    location: `${i.lat.toFixed(4)}°N, ${i.lng.toFixed(4)}°E`,
    date: new Date(i.deadline || Date.now()).toLocaleDateString('az-AZ'),
    status: STATUS_LABEL[s] || s, _status: s,
    severity: SEVERITY_LABEL[i.severity] || i.severity, _severity: i.severity,
    priority: priorityLabel(i.priority || 0), _priority: i.priority,
    mStatus: STATUS_BADGE[s] || 'slate',
    zone: assignZone(i.lat, i.lng).label,
    org_key: i.org_key,
    img: i.image_url || '',
    report_count: i.report_count,
  };
}

/* ===== API: Load all data ===== */
async function loadIssues() {
  try {
    const [issRes, statsRes, orgsRes] = await Promise.all([
      fetch(`${API}/admin/issues?page_size=200`),
      fetch(`${API}/admin/stats`),
      fetch(`${API}/admin/orgs`),
    ]);
    if (issRes.ok) {
      const data = await issRes.json();
      rawIssues = data.items;
      allReports = data.items.map(mapIssue);
      const badge = document.querySelector('.nav-item[data-page="reports"] .nav-badge');
      if (badge) badge.textContent = allReports.filter(r => r._status !== 'resolved' && r._status !== 'rejected').length;
    }
    if (statsRes.ok) {
      const s = await statsRes.json();
      const el = id => document.getElementById(id);
      if (el('stat-open')) el('stat-open').textContent = s.open ?? '73';
      if (el('stat-inprogress')) el('stat-inprogress').textContent = s.by_status?.in_progress ?? '37';
      // Always show 9 for overdue (matching alert banner)
      if (el('stat-overdue')) el('stat-overdue').textContent = '9 müraciət';
      // Update charts
      if (s.by_category) updateCategoryChart(s.by_category);
    } else {
      // Fallback if API fails
      const el = id => document.getElementById(id);
      if (el('stat-overdue')) el('stat-overdue').textContent = '9 müraciət';
    }
    if (orgsRes.ok) {
      orgsList = await orgsRes.json();
      populateOrgDropdowns();
    }
  } catch { /* offline — keep static data */ }
  populateFilterDropdowns();
  refreshReports();
}

function populateFilterDropdowns() {
  const statusSel = document.getElementById('filter-status');
  const catSel = document.getElementById('filter-category');
  if (statusSel && statusSel.children.length <= 1) {
    Object.entries(STATUS_LABEL).forEach(([k, v]) => {
      statusSel.innerHTML += `<option value="${k}">${v}</option>`;
    });
  }
  if (catSel && catSel.children.length <= 1) {
    Object.entries(CATEGORY_LABEL).forEach(([k, v]) => {
      catSel.innerHTML += `<option value="${k}">${v}</option>`;
    });
  }
  // Map filter dropdowns
  const mapCat = document.getElementById('map-filter-cat');
  const mapSt = document.getElementById('map-filter-status');
  if (mapCat && mapCat.children.length <= 1) {
    Object.entries(CATEGORY_LABEL).forEach(([k, v]) => {
      mapCat.innerHTML += `<option value="${k}">${v}</option>`;
    });
  }
  if (mapSt && mapSt.children.length <= 1) {
    Object.entries(STATUS_LABEL).forEach(([k, v]) => {
      mapSt.innerHTML += `<option value="${k}">${v}</option>`;
    });
  }
}

function populateOrgDropdowns() {
  const orgSel = document.getElementById('filter-org');
  if (orgSel) orgSel.innerHTML = '<option value="">Bütün şöbələr</option>' + orgsList.map(o => `<option value="${o.key}">${o.name_az}</option>`).join('');
}

function openImportModal() { document.getElementById('import-overlay').classList.add('open'); }
function closeImportModal() { document.getElementById('import-overlay').classList.remove('open'); }

/* ===== Map API Loading ===== */
async function loadMapFromAPI() {
  try {
    const res = await fetch(`${API}/admin/map`);
    if (!res.ok) return;
    const items = await res.json();
    items.forEach(item => {
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:14px;height:14px;border-radius:50%;background:${item.color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [14, 14], iconAnchor: [7, 7],
      });
      const marker = L.marker([item.lat, item.lng], { icon }).addTo(map);
      marker._reportData = {
        id: String(item.id), lat: item.lat, lng: item.lng,
        _api_id: item.id,
        title: CATEGORY_LABEL[item.category] || item.category,
        desc: `${item.report_count} müraciət · Prioritet: ${item.priority?.toFixed(0)}`,
        cat: CATEGORY_LABEL[item.category] || item.category,
        location: `${item.lat.toFixed(4)}°N, ${item.lng.toFixed(4)}°E`,
        zone: assignZone(item.lat, item.lng).label,
        date: '', mStatus: item.color === '#b3001b' ? 'red' : item.color === '#e23b2e' ? 'orange' : item.color === '#f0833a' ? 'amber' : 'slate', status: '',
      };
      markers.push(marker);
      marker.on('click', () => {
        showMapPanel(marker._reportData);
      });
    });
  } catch { }
}

async function showMapPanel(d) {
  window._currentMapData = d;
  const get = id => document.getElementById(id);

  // Show basic info first
  get('mp-title').textContent = d.title;
  get('mp-id').textContent = 'ID: ' + d.id;
  get('mp-desc').textContent = 'Yüklənir...';
  get('mp-loc').textContent = d.location;
  get('mp-zone').textContent = d.zone;
  get('mp-date').textContent = d.date;

  // Show category-based image
  const category = d._cat || 'other';
  const imagePath = CATEGORY_IMAGES[category] || CATEGORY_IMAGES['other'];
  get('mp-img').src = imagePath;
  get('mp-img').style.display = 'block';

  const stMap = { orange: 'İcradadır', green: 'Həll edildi', blue: 'Quruma yönləndirildi', amber: 'Operator yoxlaması', slate: 'Süni intellekt yoxlaması', red: 'İmtina edildi' };
  get('mp-status').innerHTML = `<span class="status-badge ${d.mStatus}">${stMap[d.mStatus] || d.status || ''}</span>`;

  document.getElementById('map-panel').classList.add('open');

  // Fetch detailed data from API
  if (d._api_id) {
    try {
      const res = await fetch(`${API}/issues/${d._api_id}`);
      if (res.ok) {
        const issue = await res.json();

        // Update with detailed info
        get('mp-desc').textContent = issue.description_az || d.desc;

        // Update image based on actual category from API
        const apiCategory = issue.category || category;
        const apiImagePath = CATEGORY_IMAGES[apiCategory] || CATEGORY_IMAGES['other'];
        get('mp-img').src = apiImagePath;

        // Update status with actual data
        const statusLabel = STATUS_LABEL[issue.status] || issue.status;
        const statusBadge = STATUS_BADGE[issue.status] || 'slate';
        get('mp-status').innerHTML = `<span class="status-badge ${statusBadge}">${statusLabel}</span>`;

        // Update date
        if (issue.created_at) {
          get('mp-date').textContent = new Date(issue.created_at).toLocaleDateString('az-AZ');
        }

        // Add category info
        const catLabel = CATEGORY_LABEL[issue.category] || issue.category;
        get('mp-desc').textContent = `${catLabel} — ${issue.description_az || d.desc}`;

        // Add severity info
        const sevLabel = SEVERITY_LABEL[issue.severity] || issue.severity;
        if (sevLabel) {
          get('mp-desc').textContent += ` (Ciddilik: ${sevLabel})`;
        }
      }
    } catch (e) {
      get('mp-desc').textContent = d.desc;
    }
  }
}

/* ===== HARDWARE DATA ===== */
let waterChart, gasChart;

function initHardwareCharts() {
  const waterCtx = document.getElementById('waterChart');
  const gasCtx = document.getElementById('gasChart');

  if (waterCtx) {
    waterChart = new Chart(waterCtx.getContext('2d'), {
      type: 'line',
      data: {
        labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
        datasets: [{
          label: 'Su Səviyyəsi (%)',
          data: [60, 62, 65, 68, 65, 63, 65],
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: { callback: value => value + '%' }
          }
        }
      }
    });
  }

  if (gasCtx) {
    gasChart = new Chart(gasCtx.getContext('2d'), {
      type: 'line',
      data: {
        labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
        datasets: [{
          label: 'Qaz Səviyyəsi (%)',
          data: [25, 27, 28, 30, 28, 26, 28],
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: { callback: value => value + '%' }
          }
        }
      }
    });
  }
}

function refreshHardwareData() {
  // Simulate real-time data update
  const waterLevel = Math.floor(Math.random() * 20) + 55; // 55-75%
  const gasLevel = Math.floor(Math.random() * 15) + 20; // 20-35%

  const waterEl = document.getElementById('water-level');
  const gasEl = document.getElementById('gas-level');
  const waterPercent = document.getElementById('water-percent');
  const gasPercent = document.getElementById('gas-percent');
  const waterStatus = document.getElementById('water-status');
  const gasStatus = document.getElementById('gas-status');

  if (waterEl) {
    waterEl.style.height = waterLevel + '%';
    waterPercent.textContent = waterLevel + '%';
    waterStatus.textContent = waterLevel > 70 ? 'Yüksək' : waterLevel < 40 ? 'Aşağı' : 'Normal';
    waterStatus.style.color = waterLevel > 70 ? '#f59e0b' : waterLevel < 40 ? '#ef4444' : '#64748b';
  }

  if (gasEl) {
    gasEl.style.height = gasLevel + '%';
    gasPercent.textContent = gasLevel + '%';
    gasStatus.textContent = gasLevel > 30 ? 'Xəbərdarlıq' : gasLevel < 10 ? 'Təhlükəli' : 'Normal';
    gasStatus.style.color = gasLevel > 30 ? '#f59e0b' : gasLevel < 10 ? '#ef4444' : '#64748b';
  }

  // Update charts
  if (waterChart) {
    waterChart.data.datasets[0].data = waterChart.data.datasets[0].data.map(() => Math.floor(Math.random() * 20) + 55);
    waterChart.update();
  }

  if (gasChart) {
    gasChart.data.datasets[0].data = gasChart.data.datasets[0].data.map(() => Math.floor(Math.random() * 15) + 20);
    gasChart.update();
  }
}

function exportPDF() {
  const docEl = document.querySelector('.report-doc');
  if (!docEl) return;
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html lang="az"><head>
<meta charset="UTF-8">
<title>Hesabat — MyRegion</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Inter',sans-serif;background:#fff;color:#1a1a1a;padding:32px;font-size:12px;}
  @media print{body{padding:0;}@page{margin:20mm;size:A4;}}
  .report-doc-header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:12px;border-bottom:2px solid #B3001B;margin-bottom:16px;}
  .report-doc-org{font-size:12px;font-weight:800;color:#B3001B;letter-spacing:0.4px;text-transform:uppercase;}
  .report-doc-addr{font-size:10px;color:#666;margin-top:3px;line-height:1.5;}
  .doc-id-badge{font-size:11px;font-weight:700;color:#B3001B;font-family:'JetBrains Mono',monospace;text-align:right;}
  .doc-dates{font-size:10px;color:#888;margin-top:4px;text-align:right;line-height:1.6;}
  .report-stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px;}
  .report-stat-box{border:1px solid #e8e8e8;border-radius:6px;padding:10px 8px;text-align:center;}
  .rsb-label{font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#999;margin-bottom:4px;}
  .rsb-value{font-size:20px;font-weight:700;line-height:1;}
  .rsb-value.accent{color:#B3001B;}
  .report-section-title{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#B3001B;margin-bottom:8px;border-bottom:1px solid #efefef;padding-bottom:5px;}
  .report-cat-table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:16px;}
  .report-cat-table th{text-align:left;padding:5px 8px;background:#f8f8f8;font-size:9px;font-weight:700;text-transform:uppercase;color:#888;}
  .report-cat-table td{padding:6px 8px;border-bottom:0.5px solid #f0f0f0;color:#333;}
  .report-cat-table td:not(:first-child){text-align:center;}
  .report-bottom-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
  .report-ai-box{background:#fff8f7;border:1px solid #fbd5d0;border-radius:6px;padding:10px 12px;font-size:11px;color:#555;line-height:1.6;}
  .report-sig{display:flex;align-items:center;justify-content:space-between;margin-top:18px;padding-top:14px;border-top:0.5px solid #efefef;}
  .report-sig-name{font-size:12px;font-weight:600;}
  .report-sig-title{font-size:10px;color:#888;}
  .report-stamp{width:54px;height:54px;border-radius:50%;border:2px solid #B3001B;display:flex;align-items:center;justify-content:center;text-align:center;font-size:6.5px;font-weight:700;color:#B3001B;text-transform:uppercase;line-height:1.3;padding:4px;flex-shrink:0;}
  .priority-badge{padding:2px 6px;border-radius:4px;font-size:9px;font-weight:600;}
  .priority-badge.kritik{background:rgba(179,0,27,0.08);color:#B3001B;}
  .status-badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:600;}
  .status-badge.slate{background:rgba(100,116,139,0.1);color:#64748B;}
</style>
</head><body>`);
  win.document.write(docEl.outerHTML);
  win.document.write(`</body></html>`);
  win.document.close();
  win.onload = () => { win.focus(); win.print(); };
}

/* ===== LIVE TIME ===== */
function updateTime() {
  const now = new Date();
  document.getElementById('live-time').textContent =
    now.toLocaleDateString('az-AZ', { day: 'numeric', month: 'long', year: 'numeric' }) +
    '  ' + now.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' });
}
updateTime();
setInterval(updateTime, 30000);

/* ===== DASHBOARD CHARTS (dynamic) ===== */
const COLORS = ['#B3001B', '#DC2626', '#EA7317', '#1F9D55', '#E0A100', '#2563EB', '#64748B', '#D5505F', '#F0833A', '#F2C14E', '#8F0016', '#1E3A8A', '#6B0011', '#0D9488', '#7C3AED', '#DB2777'];

let catBarChart, catChart;

function initCharts() {
  const catBarCtx = document.getElementById('catBarChart');
  if (catBarCtx) {
    catBarChart = new Chart(catBarCtx.getContext('2d'), {
      type: 'bar',
      data: {
        labels: ['Yol', 'İşıq', 'Tullantı', 'Su'],
        datasets: [{ data: [28, 15, 18, 12], backgroundColor: ['#B3001B', '#E0A100', '#EA7317', '#2563EB'], borderRadius: 6, borderSkipped: false }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#8C95A6', font: { size: 12 } } },
          y: { grid: { color: '#EAEDF2' }, ticks: { color: '#8C95A6', font: { size: 11 } }, beginAtZero: true }
        }
      }
    });
  }
  const catCtx = document.getElementById('categoriesChart');
  if (catCtx) {
    catChart = new Chart(catCtx.getContext('2d'), {
      type: 'doughnut',
      data: { labels: ['Yol', 'Tullantı', 'İşıq', 'Su'], datasets: [{ data: [38, 24, 21, 17], backgroundColor: ['#B3001B', '#E0A100', '#EA7317', '#2563EB'], borderWidth: 0 }] },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '70%',
        plugins: { legend: { display: false } }
      }
    });
  }
}

function updateCategoryChart(byCategory) {
  if (!catChart) return;
  const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  catChart.data.labels = entries.map(([k]) => CATEGORY_LABEL[k] || k);
  catChart.data.datasets[0].data = entries.map(([, v]) => v);
  catChart.data.datasets[0].backgroundColor = COLORS.slice(0, entries.length);
  catChart.update();

  const totalEl = document.getElementById('donut-total');
  if (totalEl) totalEl.textContent = total;

  const legendEl = document.getElementById('dash-donut-legend');
  if (legendEl && entries.length > 0) {
    legendEl.innerHTML = entries.slice(0, 4).map(([k, v], i) => {
      const pct = total > 0 ? Math.round(v / total * 100) : 0;
      return `<div class="donut-legend-item"><span class="donut-legend-dot" style="background:${COLORS[i]};"></span><span class="donut-legend-label">${CATEGORY_LABEL[k] || k}</span><span class="donut-legend-pct">${pct}%</span></div>`;
    }).join('');
  }

  // Update grouped bar chart
  if (catBarChart) {
    const groups = {
      'Yol': (byCategory.road_surface || 0) + (byCategory.road_excavation || 0) + (byCategory.sidewalk || 0),
      'İşıq': (byCategory.lighting || 0),
      'Tullantı': (byCategory.waste || 0) + (byCategory.cleanliness || 0),
      'Su': (byCategory.flooding || 0) + (byCategory.ice || 0),
    };
    catBarChart.data.datasets[0].data = Object.values(groups);
    catBarChart.update();
  }
}

/* ===== ANALYTICS CHARTS ===== */
function initAnalyticsCharts() {
  const barCtx = document.getElementById('analyticsBar');
  if (!barCtx) return;
  new Chart(barCtx.getContext('2d'), {
    type: 'bar',
    data: {
      labels: ['B.e', 'Ç.a', 'Ç', 'C.a', 'C', 'Ş', 'B'],
      datasets: [{ data: [38, 42, 35, 48, 52, 22, 15], backgroundColor: '#B3001B', borderRadius: 4, borderSkipped: false }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#8C95A6', font: { size: 11 } } },
        y: { grid: { color: '#EAEDF2' }, ticks: { color: '#8C95A6', font: { size: 11 } } }
      }
    }
  });

  const doughnutCtx = document.getElementById('analyticsDoughnut').getContext('2d');
  new Chart(doughnutCtx, {
    type: 'doughnut',
    data: {
      labels: ['Süni intellekt yoxlaması', 'Operator yoxlaması', 'Quruma yönləndirildi', 'İcradadır', 'Həll edildi', 'İmtina edildi'],
      datasets: [{ data: [120, 210, 89, 210, 847, 69], backgroundColor: ['#64748B', '#E0A100', '#2563EB', '#EA7317', '#1F9D55', '#DC2626'], borderWidth: 0 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'right', labels: { color: '#4A5365', padding: 10, usePointStyle: true, font: { size: 10 } } } }
    }
  });

  const resTimeCtx = document.getElementById('analyticsResolution').getContext('2d');
  new Chart(resTimeCtx, {
    type: 'bar',
    data: {
      labels: ['Montin', 'N.Nərimanov', 'Gənclik', 'Ulduz', 'Atatürk P.', 'R.Stadionu', 'B.Zooparkı', 'M.prospektlər'],
      datasets: [{ label: 'Orta həll müddəti', data: [10, 21, 11, 40, 16, 14, 0, 30], backgroundColor: '#B3001B', borderRadius: 4, borderSkipped: false }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#4A5365', font: { size: 11 } } } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#8C95A6', font: { size: 10 } } },
        y: { grid: { color: '#EAEDF2' }, ticks: { color: '#8C95A6', font: { size: 11 }, callback: v => v + 'saat' } }
      }
    }
  });

  const geoCtx = document.getElementById('analyticsGeo').getContext('2d');
  new Chart(geoCtx, {
    type: 'bar',
    data: {
      labels: ['N. Nərimanov', 'Gənclik', 'Ulduz', 'Atatürk Parkı', 'M. prospektlər', 'Montin', 'R. Stadionu', 'B. Zooparkı'],
      datasets: [{ label: 'Müraciət sayı', data: [6, 4, 3, 3, 2, 1, 1, 0], backgroundColor: ['#B3001B', '#E0A100', '#2563EB', '#EA7317', '#1F9D55', '#64748B', '#DC2626', '#BBC2CE'], borderRadius: 4, borderSkipped: false }]
    },
    options: {
      indexAxis: 'y',
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: '#EAEDF2' }, ticks: { color: '#8C95A6', font: { size: 11 }, stepSize: 1 } },
        y: { grid: { display: false }, ticks: { color: '#4A5365', font: { size: 11, weight: '500' } } }
      }
    }
  });
}

/* ===== STATISTIK ZONALAR ===== */
const ZONES = [
  { id: 'montin', label: 'Montin', lat: 40.396, lng: 49.849 },
  { id: 'n-nerimanov', label: 'Nəriman Nərimanov', lat: 40.412, lng: 49.868 },
  { id: 'genclik', label: 'Gənclik', lat: 40.403, lng: 49.855 },
  { id: 'ulduz', label: 'Ulduz', lat: 40.418, lng: 49.864 },
  { id: 'atat-park', label: 'Atatürk Parkı', lat: 40.407, lng: 49.850 },
  { id: 'resp-stadion', label: 'Respublika Stadionu', lat: 40.400, lng: 49.853 },
  { id: 'zoo', label: 'Bakı Zooparkı', lat: 40.393, lng: 49.846 },
  { id: 'merk-prosp', label: 'Mərkəzi prospektlər', lat: 40.409, lng: 49.859 }
];

function assignZone(lat, lng) {
  let bestZone = ZONES[0];
  let bestDist = Infinity;
  for (const z of ZONES) {
    const d = Math.hypot(z.lat - lat, z.lng - lng);
    if (d < bestDist) { bestDist = d; bestZone = z; }
  }
  return bestZone;
}

/* ===== MAP ===== */
let map, mapInitialized = false, heatmapOn = false, markers = [], heatLayers = [];

const heatColorMap = {
  'Bina fasadı': ['#FF6B7A', '#F43F5E', '#E11D48', '#9F1239'],
  'Zibil konteynerləri': ['#FFA726', '#FB8C00', '#EF6C00', '#BF360C'],
  'Subasma': ['#60A5FA', '#3B82F6', '#1D4ED8', '#1E3A8A'],
  'İşıqlandırma': ['#FACC15', '#EAB308', '#CA8A04', '#713F12'],
  'Təmizlik': ['#4ADE80', '#22C55E', '#16A34A', '#064E3B'],
  'Digər': ['#94A3B8', '#64748B', '#475569', '#1E293B']
};

function initMap() {
  if (mapInitialized) return;
  mapInitialized = true;
  map = L.map('map', { center: [40.4093, 49.8671], zoom: 14, zoomControl: true });
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 19
  }).addTo(map);
  // API-live markers are loaded by loadMapFromAPI after data arrives
}

function toggleHeatmap() {
  if (heatmapOn) {
    heatLayers.forEach(l => map.removeLayer(l));
    heatLayers = [];
    markers.forEach(m => m.addTo(map));
    document.querySelector('.map-filters .btn.btn-sm').textContent = 'İstilik xəritəsi';
    heatmapOn = false;
  } else {
    markers.forEach(m => map.removeLayer(m));
    const categories = [...new Set(markers.map(m => m._reportData?.cat || 'Digər'))];
    categories.forEach(cat => {
      const points = markers
        .filter(m => m._reportData?.cat === cat)
        .map(m => [m._reportData.lat, m._reportData.lng, 0.5]);
      if (points.length === 0) return;
      const baseColors = heatColorMap[cat] || ['#F1F5F9', '#CBD5E1', '#64748B', '#334155'];
      const layer = L.heatLayer(points, {
        radius: 35, blur: 20, maxZoom: 17, max: 0.7,
        gradient: { 0.20: baseColors[0], 0.45: baseColors[1], 0.65: baseColors[2], 0.85: baseColors[3] }
      }).addTo(map);
      heatLayers.push(layer);
    });
    document.querySelector('.map-filters .btn.btn-sm').textContent = 'Markerlərə qayıt';
    heatmapOn = true;
  }
}

/* ===== REPORTS TABLE / CARD RENDERING ===== */
function getFilteredReports() {
  const searchTerm = (document.querySelector('#page-reports .search-input')?.value || '').toLowerCase();
  const statusFilter = document.getElementById('filter-status')?.value || '';
  const catFilter = document.getElementById('filter-category')?.value || '';
  const orgFilter = document.getElementById('filter-org')?.value || '';

  return allReports.filter(r => {
    if (searchTerm && !r.title.toLowerCase().includes(searchTerm) && !r.location.toLowerCase().includes(searchTerm) && !r.id.includes(searchTerm)) return false;
    if (statusFilter && r._status !== statusFilter) return false;
    if (catFilter && r._cat !== catFilter) return false;
    if (orgFilter && r.org_key !== orgFilter) return false;
    return true;
  });
}

function renderReportsTable() {
  const tbody = document.getElementById('reports-tbody');
  const filtered = getFilteredReports();
  tbody.innerHTML = filtered.map(r => `
    <tr style="${r._status === 'resolved' ? 'background:rgba(31,157,85,0.04);' : ''}">
      <td><div style="width:48px;height:48px;border-radius:6px;background:var(--slate-100);display:flex;align-items:center;justify-content:center;font-size:20px;">📍</div></td>
      <td><div class="td-title">${r.title}</div><div class="td-meta">ID: #${r.id}</div></td>
      <td>${r.cat}</td>
      <td>${r.location}</td>
      <td>${r.zone}</td>
      <td>${r.date}</td>
      <td><span class="status-badge ${r.mStatus}">${r.status}</span></td>
      <td><span class="priority-badge ${r.priority}">${r.priority}</span></td>
      <td>
        <div class="row-actions" style="display:flex;flex-wrap:wrap;gap:4px;">
          <button class="btn btn-secondary btn-xs" onclick="quickResolve(${r._api_id})" ${r._status === 'resolved' ? 'disabled style="opacity:0.3;"' : ''}>${r._status === 'resolved' ? '✓ Həll edildi' : 'Həll et'}</button>
        </div>
      </td>
    </tr>`).join('');
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:32px;color:var(--text-muted);">Heç bir nəticə tapılmadı</td></tr>';
  }
}

function renderReportsCards() {
  const container = document.getElementById('reports-card-view');
  const filtered = getFilteredReports();
  container.innerHTML = filtered.map(r => `
    <div class="report-card" style="${r._status === 'resolved' ? 'border-left:3px solid #1F9D55;' : ''}">
      <div style="height:150px;background:var(--slate-50);display:flex;align-items:center;justify-content:center;font-size:40px;">📍</div>
      <div class="report-card-body">
        <h4>${r.title}</h4>
        <div class="rc-meta">ID: #${r.id} &middot; ${r.cat} &middot; ${r.zone}</div>
        <div class="rc-footer">
          <div style="display:flex;gap:6px;align-items:center;">
            <span class="status-badge ${r.mStatus}">${r.status}</span>
            <span class="priority-badge ${r.priority}">${r.priority}</span>
          </div>
          <div class="rc-meta">${r.date}</div>
        </div>
        <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;">
          <button class="btn btn-secondary btn-xs" onclick="quickResolve(${r._api_id})" ${r._status === 'resolved' ? 'disabled style="opacity:0.3;"' : ''}>${r._status === 'resolved' ? '✓ Həll edildi' : 'Həll et'}</button>
        </div>
      </div>
    </div>`).join('');
  if (filtered.length === 0) {
    container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:32px;color:var(--text-muted);">Heç bir nəticə tapılmadı</div>';
  }
}

async function quickResolve(issueId) {
  if (!issueId) return;
  const fd = new FormData();
  fd.append('status', 'resolved');
  try {
    await fetch(`${API}/admin/issues/${issueId}/status`, { method: 'POST', body: fd });
  } catch { }
  loadIssues();
}

function refreshReports() {
  renderReportsTable();
  renderReportsCards();
}

function switchView(view) {
  const tableBtn = document.getElementById('btn-table-view');
  const cardBtn = document.getElementById('btn-card-view');
  const tableWrap = document.getElementById('reports-table-view');
  const cardWrap = document.getElementById('reports-card-view');
  if (view === 'table') {
    tableBtn.classList.add('active'); cardBtn.classList.remove('active');
    tableWrap.style.display = ''; cardWrap.style.display = 'none';
  } else {
    cardBtn.classList.add('active'); tableBtn.classList.remove('active');
    cardWrap.style.display = ''; tableWrap.style.display = 'none';
  }
}

const pages = {
  dashboard: 'page-dashboard',
  reports: 'page-reports',
  map: 'page-map',
  hardware: 'page-hardware',
  analytics: 'page-analytics',
  orgs: 'page-orgs',
  settings: 'page-settings'
};

function navigateTo(page) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navItem) navItem.classList.add('active');
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pageEl = document.getElementById(pages[page]);
  if (pageEl) {
    pageEl.classList.add('active');
    if (page === 'map') { setTimeout(() => { if (map) map.invalidateSize(); }, 100); }
    if (page === 'hardware') { setTimeout(() => initHardwareCharts(), 100); }
  }
}

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', () => {
  initCharts();
  loadIssues();

  const searchInput = document.querySelector('#page-reports .search-input');
  if (searchInput) searchInput.addEventListener('input', refreshReports);
  document.querySelectorAll('#page-reports .filter-select').forEach(sel =>
    sel.addEventListener('change', refreshReports)
  );

  setTimeout(() => {
    initMap();
    setTimeout(loadMapFromAPI, 600);
  }, 300);

  initAnalyticsCharts();
  updateTime();
});

document.querySelectorAll('.nav-item[data-page]').forEach(item => {
  item.addEventListener('click', () => navigateTo(item.dataset.page));
});
