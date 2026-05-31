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
let currentIssueId = null; // selected detail panel issue

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
      if (el('stat-open'))       el('stat-open').textContent       = s.open ?? '73';
      if (el('stat-inprogress')) el('stat-inprogress').textContent = s.by_status?.in_progress ?? '37';
      if (el('stat-overdue'))    el('stat-overdue').textContent    = s.overdue ?? '9';
      // Update charts
      if (s.by_category) updateCategoryChart(s.by_category);
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
    Object.entries(STATUS_LABEL).forEach(([k,v]) => {
      statusSel.innerHTML += `<option value="${k}">${v}</option>`;
    });
  }
  if (catSel && catSel.children.length <= 1) {
    Object.entries(CATEGORY_LABEL).forEach(([k,v]) => {
      catSel.innerHTML += `<option value="${k}">${v}</option>`;
    });
  }
  // Map filter dropdowns
  const mapCat = document.getElementById('map-filter-cat');
  const mapSt = document.getElementById('map-filter-status');
  if (mapCat && mapCat.children.length <= 1) {
    Object.entries(CATEGORY_LABEL).forEach(([k,v]) => {
      mapCat.innerHTML += `<option value="${k}">${v}</option>`;
    });
  }
  if (mapSt && mapSt.children.length <= 1) {
    Object.entries(STATUS_LABEL).forEach(([k,v]) => {
      mapSt.innerHTML += `<option value="${k}">${v}</option>`;
    });
  }
}

function populateOrgDropdowns() {
  const sel = document.getElementById('dp-org-select');
  const orgSel = document.getElementById('filter-org');
  if (sel) sel.innerHTML = '<option value="">Avtomatik</option>' + orgsList.map(o => `<option value="${o.key}">${o.name_az}</option>`).join('');
  if (orgSel) orgSel.innerHTML = '<option value="">Bütün şöbələr</option>' + orgsList.map(o => `<option value="${o.key}">${o.name_az}</option>`).join('');
}

/* ===== Admin Actions ===== */
async function approveCurrentIssue() {
  if (!currentIssueId) return;
  const fd = new FormData();
  const sev = document.getElementById('dp-sev-select')?.value;
  const cat = document.getElementById('dp-cat-select')?.value;
  const org = document.getElementById('dp-org-select')?.value;
  const notes = document.getElementById('dp-notes')?.value;
  if (sev) fd.append('severity', sev);
  if (cat) fd.append('category', cat);
  if (org) fd.append('org_key', org);
  if (notes) fd.append('operator_notes', notes);
  try {
    const res = await fetch(`${API}/admin/issues/${currentIssueId}/approve`, { method: 'POST', body: fd });
    if (res.ok) {
      alert('Müraciət təsdiqləndi və quruma yönləndirildi.');
      closeDetailPanel();
      loadIssues();
    } else {
      const e = await res.json();
      alert('Xəta: ' + (e.detail || res.statusText));
    }
  } catch (e) { alert('API xətası: ' + e.message); }
}

async function advanceIssueStatus() {
  if (!currentIssueId) return;
  const newStatus = document.getElementById('dp-status-select')?.value;
  if (!newStatus) return alert('Status seçin.');
  const fd = new FormData();
  fd.append('status', newStatus);
  try {
    const res = await fetch(`${API}/admin/issues/${currentIssueId}/status`, { method: 'POST', body: fd });
    if (res.ok) {
      alert('Status yeniləndi.');
      closeDetailPanel();
      loadIssues();
    } else {
      const e = await res.json();
      alert('Xəta: ' + (e.detail || res.statusText));
    }
  } catch (e) { alert('API xətası: ' + e.message); }
}

async function rejectCurrentIssue() {
  if (!currentIssueId) return;
  const reason = prompt('İmtina səbəbini daxil edin (Azərbaycan dilində):');
  if (!reason) return;
  const fd = new FormData();
  fd.append('rejection_reason_az', reason);
  try {
    const res = await fetch(`${API}/admin/issues/${currentIssueId}/reject`, { method: 'POST', body: fd });
    if (res.ok) {
      alert('Müraciət imtina edildi.');
      closeDetailPanel();
      loadIssues();
    } else {
      const e = await res.json();
      alert('Xəta: ' + (e.detail || res.statusText));
    }
  } catch (e) { alert('API xətası: ' + e.message); }
}

/* ===== Detail Panel ===== */
async function openDetailForIssue(report) {
  currentIssueId = report._api_id;
  document.getElementById('detail-overlay').classList.add('open');
  document.getElementById('detail-panel').classList.add('open');
  document.getElementById('dp-desc').textContent = report.desc;
  document.getElementById('dp-coords').textContent = report.location;
  document.getElementById('dp-location').textContent = report.zone;
  document.getElementById('dp-zone').textContent = report.zone;
  document.getElementById('dp-report-count').textContent = report.report_count || '—';
  document.getElementById('dp-deadline').textContent = report.date;
  document.querySelector('.dp-api-id').textContent = '#' + report.id;
  document.querySelector('.dp-api-cat').childNodes[0].textContent = report.cat;
  document.querySelector('.dp-api-sev').childNodes[0].textContent = report.severity || '—';
  document.getElementById('dp-priority-badge').innerHTML = `<span class="priority-badge ${report.priority}">${report.priority}</span>`;
  document.getElementById('dp-status-badge').textContent = report.status;
  document.getElementById('dp-status-badge').className = 'status-badge ' + report.mStatus;
  document.getElementById('dp-notes').value = '';
  // Fetch full issue detail for thread
  try {
    const res = await fetch(`${API}/issues/${currentIssueId}`);
    if (res.ok) {
      const issue = await res.json();
      document.getElementById('dp-desc').textContent = issue.description_az || report.desc;
      const threadEl = document.getElementById('dp-thread');
      if (issue.reports) {
        threadEl.innerHTML = issue.reports.map(r => `
          <div class="timeline-item" ${r.is_root ? 'style="border-color:var(--accent);"' : ''}>
            <div class="tl-content">
              <div>${r.user_text || 'Müraciət əlavə edildi'}</div>
              <div class="tl-time">${new Date(r.created_at).toLocaleDateString('az-AZ')}</div>
            </div>
          </div>`).join('');
      }
      // Populate override selects
      const catSel = document.getElementById('dp-cat-select');
      const sevSel = document.getElementById('dp-sev-select');
      if (catSel) { catSel.style.display = 'inline-block'; catSel.innerHTML = Object.entries(CATEGORY_LABEL).map(([k,v]) => `<option value="${k}" ${k===issue.category?'selected':''}>${v}</option>`).join(''); }
      if (sevSel) { sevSel.style.display = 'inline-block'; sevSel.innerHTML = Object.entries(SEVERITY_LABEL).map(([k,v]) => `<option value="${k}" ${k===issue.severity?'selected':''}>${v}</option>`).join(''); }
      if (issue.org) {
        document.getElementById('dp-org-select').value = issue.org.key || '';
      }
    }
  } catch {}
  // Render org quick-action buttons
  const orgBtns = document.getElementById('dp-org-buttons');
  if (orgBtns) {
    orgBtns.innerHTML = orgsList.map(o => {
      const colors = ['#B3001B','#D5505F','#C42032','#2563EB','#1E3A8A','#E0A100','#EA7317','#1F9D55','#64748B'];
      const c = colors[orgsList.indexOf(o) % colors.length];
      return `<button class="btn btn-xs" style="background:${c};color:#fff;" onclick="window.open('mailto:${o.key === 'azersu' || o.key === 'azeriqaz' ? '' : o.contact_hint || ''}?subject=' + encodeURIComponent('Nərimanov — Müraciət #${report.id}'),'_blank')" title="${o.contact_hint || o.name_az}">${o.name_az}</button>`;
    }).join('');
  }
}

function openImportModal() { document.getElementById('import-overlay').classList.add('open'); }
function closeImportModal() { document.getElementById('import-overlay').classList.remove('open'); }
function openDetailPanel() { closeDetailPanel(); /* replaced by openDetailForIssue */ }
function closeDetailPanel() {
  currentIssueId = null;
  document.getElementById('detail-overlay').classList.remove('open');
  document.getElementById('detail-panel').classList.remove('open');
}

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
        iconSize: [14,14], iconAnchor: [7,7],
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
        if (marker._reportData._api_id) openDetailForIssue(marker._reportData);
        else showMapPanel(marker._reportData);
      });
    });
  } catch {}
}

function showMapPanel(d) {
  window._currentMapData = d;
  const get = id => document.getElementById(id);
  if (d.img) { get('mp-img').src = d.img; get('mp-img').style.display = 'block'; }
  else get('mp-img').style.display = 'none';
  get('mp-title').textContent = d.title;
  get('mp-id').textContent = 'ID: ' + d.id;
  get('mp-desc').textContent = d.desc;
  get('mp-loc').textContent = d.location;
  get('mp-zone').textContent = d.zone;
  get('mp-date').textContent = d.date;
  const stMap = { orange:'İcradadır', green:'Həll edildi', blue:'Quruma yönləndirildi', amber:'Operator yoxlaması', slate:'Süni intellekt yoxlaması', red:'İmtina edildi' };
  get('mp-status').innerHTML = `<span class="status-badge ${d.mStatus}">${stMap[d.mStatus] || d.status || ''}</span>`;
  document.getElementById('map-panel').classList.add('open');
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
    now.toLocaleDateString('az-AZ', { day:'numeric', month:'long', year:'numeric' }) +
    '  ' + now.toLocaleTimeString('az-AZ', { hour:'2-digit', minute:'2-digit' });
}
updateTime();
setInterval(updateTime, 30000);

/* ===== DASHBOARD CHARTS (dynamic) ===== */
const COLORS = ['#B3001B','#DC2626','#EA7317','#1F9D55','#E0A100','#2563EB','#64748B','#D5505F','#F0833A','#F2C14E','#8F0016','#1E3A8A','#6B0011','#0D9488','#7C3AED','#DB2777'];

let catBarChart, catChart;

function initCharts() {
  const catBarCtx = document.getElementById('catBarChart');
  if (catBarCtx) {
    catBarChart = new Chart(catBarCtx.getContext('2d'), {
      type: 'bar',
      data: {
        labels: ['Yol', 'İşıq', 'Tullantı', 'Su'],
        datasets: [{ data: [28, 15, 18, 12], backgroundColor: ['#B3001B','#E0A100','#EA7317','#2563EB'], borderRadius: 6, borderSkipped: false }]
      },
      options: { responsive: true, maintainAspectRatio: false,
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
      data: { labels: ['Yol','Tullantı','İşıq','Su'], datasets: [{ data: [38, 24, 21, 17], backgroundColor: ['#B3001B','#E0A100','#EA7317','#2563EB'], borderWidth: 0 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '70%',
        plugins: { legend: { display: false } }
      }
    });
  }
}

function updateCategoryChart(byCategory) {
  if (!catChart) return;
  const entries = Object.entries(byCategory).sort((a,b) => b[1] - a[1]).slice(0, 6);
  const total = entries.reduce((s,[,v]) => s+v, 0);
  catChart.data.labels = entries.map(([k]) => CATEGORY_LABEL[k] || k);
  catChart.data.datasets[0].data = entries.map(([,v]) => v);
  catChart.data.datasets[0].backgroundColor = COLORS.slice(0, entries.length);
  catChart.update();

  const totalEl = document.getElementById('donut-total');
  if (totalEl) totalEl.textContent = total;

  const legendEl = document.getElementById('dash-donut-legend');
  if (legendEl && entries.length > 0) {
    legendEl.innerHTML = entries.slice(0, 4).map(([k,v], i) => {
      const pct = total > 0 ? Math.round(v / total * 100) : 0;
      return `<div class="donut-legend-item"><span class="donut-legend-dot" style="background:${COLORS[i]};"></span><span class="donut-legend-label">${CATEGORY_LABEL[k] || k}</span><span class="donut-legend-pct">${pct}%</span></div>`;
    }).join('');
  }

  // Update grouped bar chart
  if (catBarChart) {
    const groups = {
      'Yol': (byCategory.road_surface||0)+(byCategory.road_excavation||0)+(byCategory.sidewalk||0),
      'İşıq': (byCategory.lighting||0),
      'Tullantı': (byCategory.waste||0)+(byCategory.cleanliness||0),
      'Su': (byCategory.flooding||0)+(byCategory.ice||0),
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
      labels: ['B.e','Ç.a','Ç','C.a','C','Ş','B'],
      datasets: [{ data: [38,42,35,48,52,22,15], backgroundColor: '#B3001B', borderRadius: 4, borderSkipped: false }]
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
      labels: ['Süni intellekt yoxlaması','Operator yoxlaması','Quruma yönləndirildi','İcradadır','Həll edildi','İmtina edildi'],
      datasets: [{ data: [120,210,89,210,847,69], backgroundColor: ['#64748B','#E0A100','#2563EB','#EA7317','#1F9D55','#DC2626'], borderWidth: 0 }]
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
      labels: ['Montin','N.Nərimanov','Gənclik','Ulduz','Atatürk P.','R.Stadionu','B.Zooparkı','M.prospektlər'],
      datasets: [{ label: 'Orta həll müddəti', data: [10,21,11,40,16,14,0,30], backgroundColor: '#B3001B', borderRadius: 4, borderSkipped: false }]
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
      labels: ['N. Nərimanov','Gənclik','Ulduz','Atatürk Parkı','M. prospektlər','Montin','R. Stadionu','B. Zooparkı'],
      datasets: [{ label: 'Müraciət sayı', data: [6,4,3,3,2,1,1,0], backgroundColor: ['#B3001B','#E0A100','#2563EB','#EA7317','#1F9D55','#64748B','#DC2626','#BBC2CE'], borderRadius: 4, borderSkipped: false }]
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
  { id: 'montin',        label: 'Montin',               lat: 40.396, lng: 49.849 },
  { id: 'n-nerimanov',   label: 'Nəriman Nərimanov',   lat: 40.412, lng: 49.868 },
  { id: 'genclik',       label: 'Gənclik',             lat: 40.403, lng: 49.855 },
  { id: 'ulduz',         label: 'Ulduz',               lat: 40.418, lng: 49.864 },
  { id: 'atat-park',     label: 'Atatürk Parkı',       lat: 40.407, lng: 49.850 },
  { id: 'resp-stadion',  label: 'Respublika Stadionu', lat: 40.400, lng: 49.853 },
  { id: 'zoo',           label: 'Bakı Zooparkı',       lat: 40.393, lng: 49.846 },
  { id: 'merk-prosp',    label: 'Mərkəzi prospektlər', lat: 40.409, lng: 49.859 }
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
  'Bina fasadı': ['#FF6B7A','#F43F5E','#E11D48','#9F1239'],
  'Zibil konteynerləri': ['#FFA726','#FB8C00','#EF6C00','#BF360C'],
  'Subasma': ['#60A5FA','#3B82F6','#1D4ED8','#1E3A8A'],
  'İşıqlandırma': ['#FACC15','#EAB308','#CA8A04','#713F12'],
  'Təmizlik': ['#4ADE80','#22C55E','#16A34A','#064E3B'],
  'Digər': ['#94A3B8','#64748B','#475569','#1E293B']
};

function initMap() {
  if (mapInitialized) return;
  mapInitialized = true;
  map = L.map('map', { center: [40.4093, 49.8671], zoom: 14, zoomControl: true });
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap',
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
      const baseColors = heatColorMap[cat] || ['#F1F5F9','#CBD5E1','#64748B','#334155'];
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
      <td><div class="td-title" style="cursor:pointer;" onclick="openDetailForIssue(allReports.find(x=>x.id==='${r.id}'))">${r.title}</div><div class="td-meta">ID: #${r.id}</div></td>
      <td>${r.cat}</td>
      <td>${r.location}</td>
      <td>${r.zone}</td>
      <td>${r.date}</td>
      <td><span class="status-badge ${r.mStatus}">${r.status}</span></td>
      <td><span class="priority-badge ${r.priority}">${r.priority}</span></td>
      <td>
        <div class="row-actions" style="display:flex;flex-wrap:wrap;gap:4px;">
          <button class="btn btn-secondary btn-xs" onclick="openDetailForIssue(allReports.find(x=>x.id==='${r.id}'))">Bax</button>
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
        <h4 style="cursor:pointer;" onclick="openDetailForIssue(allReports.find(x=>x.id==='${r.id}'))">${r.title}</h4>
        <div class="rc-meta">ID: #${r.id} &middot; ${r.cat} &middot; ${r.zone}</div>
        <div class="rc-footer">
          <div style="display:flex;gap:6px;align-items:center;">
            <span class="status-badge ${r.mStatus}">${r.status}</span>
            <span class="priority-badge ${r.priority}">${r.priority}</span>
          </div>
          <div class="rc-meta">${r.date}</div>
        </div>
        <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;">
          <button class="btn btn-secondary btn-xs" onclick="openDetailForIssue(allReports.find(x=>x.id==='${r.id}'))">Bax</button>
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
  } catch {}
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
