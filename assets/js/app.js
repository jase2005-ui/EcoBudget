/* ─────────────────────────────────────────────────
   EcoBudget — app.js
   All frontend logic for every page
───────────────────────────────────────────────── */

/* ── Utilities ── */
const fmt = (n) => 'P ' + Number(n).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
const fmtDateLong = (d) => new Date(d).toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' });
const fmtMonth = (y, m) => new Date(y, m - 1).toLocaleDateString('en', { month: 'long', year: 'numeric' });
const today = () => new Date().toISOString().split('T')[0];
const qs = (s) => document.querySelector(s);
const qsa = (s) => document.querySelectorAll(s);

/* ── API wrapper ── */
const api = {
  async req(method, url, body = null) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },
  get:    (url)       => api.req('GET',    url),
  post:   (url, body) => api.req('POST',   url, body),
  put:    (url, body) => api.req('PUT',    url, body),
  delete: (url)       => api.req('DELETE', url),
};

/* ── Sidebar & Dark Mode ── */
function initSidebar() {
  const sidebar  = qs('#sidebar');
  const collapse = qs('#collapseBtn');
  const colIcon  = qs('#collapseIcon');
  const colLabel = qs('.collapse-label');
  const theme    = qs('#themeToggle');
  const themeIco = qs('#themeIcon');
  const themeLbl = qs('#themeLabel');

  // Restore collapsed state
  if (localStorage.getItem('sidebar_collapsed') === '1') {
    sidebar.classList.add('collapsed');
    colIcon && colIcon.setAttribute('data-lucide', 'chevron-right');
  }

  collapse?.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    const c = sidebar.classList.contains('collapsed');
    localStorage.setItem('sidebar_collapsed', c ? '1' : '0');
    if (colIcon) colIcon.setAttribute('data-lucide', c ? 'chevron-right' : 'chevron-left');
    lucide.createIcons();
  });

  // Dark mode
  const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';
  const setTheme = (dark) => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    document.cookie = `theme=${dark ? 'dark' : 'light'};path=/;max-age=31536000`;
    if (themeIco) themeIco.setAttribute('data-lucide', dark ? 'sun' : 'moon');
    if (themeLbl) themeLbl.textContent = dark ? 'Light mode' : 'Dark mode';
    lucide.createIcons();
  };
  theme?.addEventListener('click', () => setTheme(!isDark()));
  setTheme(isDark()); // init icon
}

/* ── Alert helper ── */
function showAlert(parentSel, msg, type = 'success') {
  const el = qs(parentSel + ' .alert') || createAlert(parentSel, type);
  el.className = `alert alert-${type}`;
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 4000);
}
function createAlert(parentSel, type) {
  const el = document.createElement('div');
  el.className = `alert alert-${type} hidden`;
  qs(parentSel).prepend(el);
  return el;
}

/* ── Dashboard ── */
async function initDashboard() {
  try {
    const d = await api.get('api/dashboard.php');
    const now = new Date();
    qs('#dash-date').textContent = now.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase();
    qs('#hero-month').textContent = now.toLocaleDateString('en', { month: 'long', year: 'numeric' }).toUpperCase();
    qs('#hero-amount').textContent = fmt(d.month_total);
    qs('#stat-today').textContent  = fmt(d.today_total);
    qs('#stat-today-count').textContent = d.today_count + ' transaction' + (d.today_count !== 1 ? 's' : '');
    qs('#stat-week').textContent   = fmt(d.week_total);
    qs('#stat-week-count').textContent  = d.week_count  + ' transaction' + (d.week_count  !== 1 ? 's' : '');
    qs('#stat-month').textContent  = fmt(d.month_total);
    qs('#stat-month-count').textContent = d.month_count + ' transaction' + (d.month_count !== 1 ? 's' : '');

    // Recent transactions
    const list = qs('#recent-list');
    if (!d.recent || d.recent.length === 0) {
      list.innerHTML = `<div class="empty-state"><div class="empty-icon"><i data-lucide="receipt"></i></div><h3>No transactions yet</h3><p>Add your first expense to get started</p></div>`;
    } else {
      list.innerHTML = d.recent.map(e => expenseItemHtml(e)).join('');
    }

    // Budget status
    const budgetWrap = qs('#budget-list');
    if (!d.budgets || d.budgets.length === 0) {
      budgetWrap.innerHTML = `<div class="empty-state" style="padding:24px 16px">
        <div class="empty-icon"><i data-lucide="wallet"></i></div>
        <h3>No budgets yet</h3><p>Set limits per category</p>
        <a href="budgets.php" class="budget-status-link" style="display:inline-block;margin-top:10px">Create budget →</a>
      </div>`;
    } else {
      budgetWrap.innerHTML = d.budgets.map(b => budgetBarHtml(b)).join('');
    }
    lucide.createIcons();
  } catch(e) { console.error(e); }
}

function expenseItemHtml(e) {
  const color = e.category_color || '#9ca3af';
  const badgeBg = hexToRgba(color, 0.15);
  return `<div class="expense-item">
    <div class="expense-dot" style="background:${color}"></div>
    <div class="expense-info">
      <div class="expense-desc">${esc(e.description)}</div>
      <div class="expense-meta">
        ${e.category_name ? `<span class="badge" style="background:${badgeBg};color:${color}">${esc(e.category_name)}</span>` : '<span class="badge" style="background:#f3f4f6;color:#6b7280">Uncategorized</span>'}
        <span class="expense-meta-text">${fmtDate(e.date)} · ${esc(e.payment_method)}</span>
      </div>
    </div>
    <div class="expense-amount">–${fmt(e.amount)}</div>
  </div>`;
}

function budgetBarHtml(b) {
  const pct = b.budget_amount > 0 ? Math.min((b.spent / b.budget_amount) * 100, 100) : 0;
  const over = b.spent > b.budget_amount;
  const color = over ? '#dc2626' : b.category_color || '#16a34a';
  return `<div class="budget-item">
    <div class="budget-item-header">
      <div class="budget-item-name">
        <div class="expense-dot" style="background:${b.category_color || '#9ca3af'}"></div>
        ${esc(b.category_name)}
      </div>
      <div class="budget-item-amounts">${fmt(b.spent)} / ${fmt(b.budget_amount)}</div>
    </div>
    <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${color}"></div></div>
    ${over ? `<div class="budget-over-label">${fmt(b.spent - b.budget_amount)} over budget</div>` : ''}
  </div>`;
}

function hexToRgba(hex, a) {
  let r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}
function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

/* ── Expenses List ── */
async function initExpenses() {
  let expenses = [], categories = [];

  async function load() {
    const [eRes, cRes] = await Promise.all([api.get('api/expenses.php'), api.get('api/categories.php')]);
    expenses   = eRes.data || [];
    categories = cRes.data || [];
    populateCategoryFilter(categories);
    render();
  }

  function populateCategoryFilter(cats) {
    const sel = qs('#filterCategory');
    if (!sel) return;
    sel.innerHTML = '<option value="">All Categories</option>' +
      cats.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
  }

  function render() {
    const search  = (qs('#searchInput')?.value || '').toLowerCase();
    const catId   = qs('#filterCategory')?.value || '';
    const month   = qs('#filterMonth')?.value || '';

    let filtered = expenses.filter(e => {
      if (search  && !e.description.toLowerCase().includes(search)) return false;
      if (catId   && String(e.category_id) !== catId) return false;
      if (month   && !e.date.startsWith(month)) return false;
      return true;
    });

    const total = filtered.reduce((s, e) => s + Number(e.amount), 0);
    qs('#exp-total') && (qs('#exp-total').textContent = fmt(total));
    qs('#exp-count') && (qs('#exp-count').textContent = filtered.length + ' transaction' + (filtered.length !== 1 ? 's' : ''));

    const list = qs('#expenses-list');
    if (filtered.length === 0) {
      list.innerHTML = `<div class="empty-state"><div class="empty-icon"><i data-lucide="receipt"></i></div><h3>No expenses found</h3><p>Try adjusting your filters</p></div>`;
      lucide.createIcons(); return;
    }

    // Group by date
    const groups = {};
    filtered.sort((a,b) => b.date.localeCompare(a.date)).forEach(e => {
      if (!groups[e.date]) groups[e.date] = [];
      groups[e.date].push(e);
    });

    list.innerHTML = Object.entries(groups).map(([date, items]) => {
      const dayTotal = items.reduce((s, e) => s + Number(e.amount), 0);
      return `<div class="expense-group">
        <div class="expense-group-header">
          <span>${fmtDate(date)}</span>
          <span>${fmt(dayTotal)}</span>
        </div>
        ${items.map(e => expenseItemHtmlFull(e)).join('')}
      </div>`;
    }).join('');
    lucide.createIcons();
  }

  function expenseItemHtmlFull(e) {
    const color = e.category_color || '#9ca3af';
    const badgeBg = hexToRgba(color, 0.15);
    return `<div class="expense-item" data-id="${e.id}">
      <div class="expense-dot" style="background:${color}"></div>
      <div class="expense-info">
        <div class="expense-desc">${esc(e.description)}</div>
        <div class="expense-meta">
          ${e.category_name ? `<span class="badge" style="background:${badgeBg};color:${color}">${esc(e.category_name)}</span>` : '<span class="badge" style="background:#f3f4f6;color:#6b7280">Uncategorized</span>'}
          <span class="expense-meta-text">${fmtDate(e.date)} · ${esc(e.payment_method)}</span>
        </div>
      </div>
      <div class="expense-amount">–${fmt(e.amount)}</div>
      <button class="btn btn-ghost btn-icon btn-sm delete-btn" data-id="${e.id}" title="Delete" style="margin-left:8px">
        <i data-lucide="trash-2"></i>
      </button>
    </div>`;
  }

  qs('#searchInput')?.addEventListener('input', render);
  qs('#filterCategory')?.addEventListener('change', render);
  qs('#filterMonth')?.addEventListener('change', render);

  qs('#expenses-list')?.addEventListener('click', async (e) => {
    const btn = e.target.closest('.delete-btn');
    if (!btn) return;
    if (!confirm('Delete this expense?')) return;
    try {
      await api.delete('api/expenses.php?id=' + btn.dataset.id);
      await load();
    } catch(err) { alert(err.message); }
  });

  // Set current month as default filter
  const mSel = qs('#filterMonth');
  if (mSel) {
    const n = new Date();
    mSel.value = n.getFullYear() + '-' + String(n.getMonth()+1).padStart(2,'0');
    mSel.value = ''; // show all by default
  }

  await load();
}

/* ── Add Expense ── */
async function initAddExpense() {
  const form = qs('#add-expense-form');
  if (!form) return;

  // Set today's date
  qs('#exp-date') && (qs('#exp-date').value = today());

  // Load categories
  try {
    const { data: cats } = await api.get('api/categories.php');
    const sel = qs('#exp-category');
    sel.innerHTML = '<option value="">Pick one</option>' + cats.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
  } catch(e) {}

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = qs('#save-btn');
    btn.disabled = true; btn.textContent = 'Saving…';

    const body = {
      description:    qs('#exp-desc').value.trim(),
      amount:         parseFloat(qs('#exp-amount').value),
      category_id:    qs('#exp-category').value || null,
      date:           qs('#exp-date').value,
      payment_method: qs('#exp-payment').value,
      notes:          qs('#exp-notes').value.trim(),
    };

    try {
      await api.post('api/expenses.php', body);
      window.location.href = 'expenses.php';
    } catch(err) {
      btn.disabled = false; btn.textContent = 'Save Expense';
      qs('#form-error').textContent = err.message;
      qs('#form-error').classList.remove('hidden');
    }
  });
}

/* ── Categories ── */
async function initCategories() {
  const COLORS = ['#16a34a','#2563eb','#7c3aed','#ea580c','#db2777','#0891b2','#ca8a04','#dc2626'];
  let selected = COLORS[0];

  // Render color picker
  const picker = qs('#color-picker');
  if (picker) {
    picker.innerHTML = COLORS.map(c =>
      `<div class="color-opt${c===selected?' selected':''}" style="background:${c}" data-color="${c}"></div>`
    ).join('');
    picker.addEventListener('click', e => {
      const opt = e.target.closest('.color-opt');
      if (!opt) return;
      selected = opt.dataset.color;
      qsa('.color-opt').forEach(o => o.classList.toggle('selected', o === opt));
    });
  }

  async function load() {
    const { data: cats } = await api.get('api/categories.php');
    const list = qs('#category-list');
    if (!list) return;
    if (cats.length === 0) {
      list.innerHTML = `<div class="empty-state"><div class="empty-icon"><i data-lucide="tag"></i></div><h3>No categories yet</h3></div>`;
    } else {
      list.innerHTML = cats.map(c => `
        <div class="category-item">
          <div class="category-item-left">
            <div class="category-dot" style="background:${c.color}"></div>
            <span class="category-name">${esc(c.name)}</span>
          </div>
          <button class="btn btn-ghost btn-icon btn-sm delete-cat" data-id="${c.id}" title="Delete">
            <i data-lucide="trash-2"></i>
          </button>
        </div>`).join('');
    }
    lucide.createIcons();
  }

  qs('#add-cat-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const name = qs('#cat-name').value.trim();
    if (!name) return;
    try {
      await api.post('api/categories.php', { name, color: selected });
      qs('#cat-name').value = '';
      await load();
    } catch(err) { alert(err.message); }
  });

  qs('#category-list')?.addEventListener('click', async e => {
    const btn = e.target.closest('.delete-cat');
    if (!btn) return;
    if (!confirm('Delete this category?')) return;
    try {
      await api.delete('api/categories.php?id=' + btn.dataset.id);
      await load();
    } catch(err) { alert(err.message); }
  });

  await load();
}

/* ── Budgets ── */
async function initBudgets() {
  const now = new Date();
  let month = now.getMonth() + 1, year = now.getFullYear();

  const monthSel = qs('#budget-month');
  if (monthSel) {
    monthSel.value = year + '-' + String(month).padStart(2,'0');
    monthSel.addEventListener('change', () => {
      const [y, m] = monthSel.value.split('-');
      year = parseInt(y); month = parseInt(m);
      load();
    });
  }

  async function load() {
    const [catRes, budRes] = await Promise.all([
      api.get('api/categories.php'),
      api.get(`api/budgets.php?month=${month}&year=${year}`),
    ]);
    const cats = catRes.data || [];
    const buds = budRes.data || [];

    // Populate category select
    const catSel = qs('#budget-cat-sel');
    if (catSel) {
      catSel.innerHTML = '<option value="">Select category</option>' +
        cats.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
    }

    // Totals
    const totalBudget = buds.reduce((s,b) => s + Number(b.budget_amount), 0);
    const totalSpent  = buds.reduce((s,b) => s + Number(b.spent), 0);
    qs('#total-budget') && (qs('#total-budget').textContent = fmt(totalBudget));
    qs('#total-spent')  && (qs('#total-spent').textContent  = fmt(totalSpent));
    const diff = totalBudget - totalSpent;
    const diffEl = qs('#budget-diff');
    if (diffEl) {
      diffEl.textContent = diff >= 0 ? fmt(diff) + ' remaining' : fmt(Math.abs(diff)) + ' over budget';
      diffEl.className   = diff >= 0 ? 'text-success' : 'text-danger';
    }

    // Progress bar
    const pct = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
    qs('#budget-progress') && (qs('#budget-progress').style.width = pct + '%');
    if (qs('#budget-progress')) qs('#budget-progress').style.background = totalSpent > totalBudget ? '#dc2626' : '#16a34a';

    // Budget list
    const list = qs('#budgets-list');
    if (!list) return;
    if (buds.length === 0) {
      const mLabel = new Date(year, month-1).toLocaleDateString('en', {month:'long',year:'numeric'});
      list.innerHTML = `<div class="empty-state"><div class="empty-icon"><i data-lucide="wallet"></i></div><h3>No budgets for ${mLabel}</h3><p>Use the form above to set category limits</p></div>`;
    } else {
      list.innerHTML = buds.map(b => budgetBarHtml(b)).join('');
    }
    lucide.createIcons();
  }

  qs('#set-budget-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const catId  = qs('#budget-cat-sel').value;
    const amount = parseFloat(qs('#budget-amount-input').value);
    if (!catId || isNaN(amount)) return;
    try {
      await api.post('api/budgets.php', { category_id: catId, amount, month, year });
      qs('#budget-amount-input').value = '';
      qs('#budget-cat-sel').value = '';
      await load();
    } catch(err) { alert(err.message); }
  });

  await load();
}

/* ── Recurring ── */
async function initRecurring() {
  async function load() {
    const [rRes, cRes] = await Promise.all([api.get('api/recurring.php'), api.get('api/categories.php')]);
    const items = rRes.data || [];
    const cats  = cRes.data || [];

    // Populate add form
    const catSel = qs('#rec-category');
    if (catSel) {
      catSel.innerHTML = '<option value="">No category</option>' +
        cats.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
    }

    const totalMonthly = items.filter(r=>r.is_active).reduce((s,r)=>s+Number(r.amount),0);
    const active = items.filter(r=>r.is_active).length;
    qs('#rec-total')   && (qs('#rec-total').textContent   = items.length);
    qs('#rec-active')  && (qs('#rec-active').textContent  = active);
    qs('#rec-monthly') && (qs('#rec-monthly').textContent = fmt(totalMonthly));
    qs('#rec-header-summary') && (qs('#rec-header-summary').textContent = `${active} active · ${fmt(totalMonthly)}/month`);

    const list = qs('#recurring-list');
    if (!list) return;
    if (items.length === 0) {
      list.innerHTML = `<div class="empty-state"><div class="empty-icon"><i data-lucide="refresh-cw"></i></div><h3>No recurring expenses</h3><p>Add subscriptions and regular bills</p></div>`;
    } else {
      list.innerHTML = items.map(r => {
        const suffix = r.day_of_month === 1 ? 'st' : r.day_of_month === 2 ? 'nd' : r.day_of_month === 3 ? 'rd' : 'th';
        const catName = r.category_name ? r.category_name + ' · ' : '';
        const lastGen = r.last_generated ? ' · Last: ' + r.last_generated.slice(0,7) : '';
        return `<div class="recurring-item">
          <div class="recurring-icon"><i data-lucide="calendar"></i></div>
          <div class="recurring-info">
            <div class="recurring-name">${esc(r.description)}</div>
            <div class="recurring-meta">${catName}${r.day_of_month}${suffix} of each month${lastGen}</div>
          </div>
          <div class="recurring-amount">${fmt(r.amount)}</div>
          <label class="toggle" style="margin-left:12px">
            <input type="checkbox" ${r.is_active ? 'checked' : ''} class="rec-toggle" data-id="${r.id}">
            <span class="toggle-slider"></span>
          </label>
          <button class="btn btn-ghost btn-icon btn-sm delete-rec" data-id="${r.id}" style="margin-left:6px" title="Delete"><i data-lucide="trash-2"></i></button>
        </div>`;
      }).join('');
    }
    lucide.createIcons();
  }

  qs('#add-rec-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const body = {
      description:    qs('#rec-desc').value.trim(),
      amount:         parseFloat(qs('#rec-amount').value),
      category_id:    qs('#rec-category').value || null,
      day_of_month:   parseInt(qs('#rec-day').value),
      payment_method: qs('#rec-payment').value,
    };
    try {
      await api.post('api/recurring.php', body);
      qs('#add-rec-form').reset();
      qs('#rec-day').value = '1';
      await load();
    } catch(err) { alert(err.message); }
  });

  document.addEventListener('change', async e => {
    if (!e.target.classList.contains('rec-toggle')) return;
    try {
      await api.put('api/recurring.php', { id: e.target.dataset.id, is_active: e.target.checked ? 1 : 0 });
      await load();
    } catch(err) { alert(err.message); }
  });

  document.addEventListener('click', async e => {
    const btn = e.target.closest('.delete-rec');
    if (!btn) return;
    if (!confirm('Delete this recurring expense?')) return;
    try {
      await api.delete('api/recurring.php?id=' + btn.dataset.id);
      await load();
    } catch(err) { alert(err.message); }
  });

  qs('#generate-btn')?.addEventListener('click', async () => {
    try {
      const res = await api.post('api/recurring.php', { action: 'generate' });
      alert(res.message || 'Generated ' + res.generated + ' expense(s)');
      await load();
    } catch(err) { alert(err.message); }
  });

  await load();
}

/* ── Reports ── */
async function initReports() {
  let currentMonth = new Date().toISOString().slice(0,7);
  let charts = {};

  const monthSel = qs('#report-month');
  if (monthSel) {
    monthSel.value = currentMonth;
    monthSel.addEventListener('change', () => { currentMonth = monthSel.value; load(); });
  }

  // Tabs
  qsa('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      qsa('.tab-btn').forEach(b => b.classList.remove('active'));
      qsa('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      qs('#tab-' + btn.dataset.tab)?.classList.add('active');
    });
  });

  async function load() {
    const [y, m] = currentMonth.split('-');
    const data = await api.get(`api/reports.php?month=${m}&year=${y}`);

    qs('#report-total') && (qs('#report-total').textContent = fmt(data.total));
    qs('#report-sub')   && (qs('#report-sub').textContent   = `${data.count} transactions in ${fmtMonth(parseInt(y), parseInt(m))}`);

    renderCategoryChart(data.by_category || []);
    renderTrendChart(data.trend || []);
    renderPaymentChart(data.by_payment || []);
    renderDetailTable(data.by_category || []);
  }

  function renderCategoryChart(items) {
    const canvas = qs('#cat-chart');
    if (!canvas) return;
    if (charts.cat) charts.cat.destroy();
    if (items.length === 0) {
      qs('#cat-chart-wrap').innerHTML = `<div class="empty-state"><p>No data for this period</p></div>`;
      return;
    }
    charts.cat = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels:   items.map(i => i.category_name || 'Uncategorized'),
        datasets: [{ data: items.map(i=>i.total), backgroundColor: items.map(i=>i.color||'#9ca3af'), borderWidth: 2, borderColor: getComputedStyle(document.documentElement).getPropertyValue('--card').trim() || '#fff' }]
      },
      options: { cutout: '65%', plugins: { legend: { display: false } }, maintainAspectRatio: true }
    });
    qs('#cat-legend').innerHTML = items.map(i =>
      `<div class="legend-item"><div class="legend-dot" style="background:${i.color||'#9ca3af'}"></div>${esc(i.category_name||'Uncategorized')} <span class="text-muted" style="margin-left:4px">${fmt(i.total)}</span></div>`
    ).join('');
  }

  function renderTrendChart(items) {
    const canvas = qs('#trend-chart');
    if (!canvas) return;
    if (charts.trend) charts.trend.destroy();
    charts.trend = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: items.map(i => i.label),
        datasets: [{ label: 'Spending', data: items.map(i=>i.total), backgroundColor: '#166534', borderRadius: 6 }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { callback: v => 'P' + Number(v).toLocaleString() } } },
        maintainAspectRatio: true
      }
    });
  }

  function renderPaymentChart(items) {
    const canvas = qs('#pay-chart');
    if (!canvas) return;
    if (charts.pay) charts.pay.destroy();
    const colors = ['#166534','#2563eb','#7c3aed','#ea580c','#0891b2'];
    charts.pay = new Chart(canvas, {
      type: 'pie',
      data: {
        labels:   items.map(i => i.method),
        datasets: [{ data: items.map(i=>i.total), backgroundColor: colors, borderWidth: 2 }]
      },
      options: { plugins: { legend: { position: 'bottom' } }, maintainAspectRatio: true }
    });
  }

  function renderDetailTable(items) {
    const tbody = qs('#detail-tbody');
    if (!tbody) return;
    if (items.length === 0) { tbody.innerHTML = '<tr><td colspan="3" class="text-muted" style="text-align:center;padding:20px">No data</td></tr>'; return; }
    tbody.innerHTML = items.map(i => `<tr>
      <td><div style="display:flex;align-items:center;gap:8px"><div class="expense-dot" style="background:${i.color||'#9ca3af'}"></div>${esc(i.category_name||'Uncategorized')}</div></td>
      <td class="mono">${fmt(i.total)}</td>
      <td>${i.count}</td>
    </tr>`).join('');
  }

  await load();
}

/* ── Monthly Summary ── */
async function initMonthlySummary() {
  const now = new Date();
  let month = now.getMonth()+1, year = now.getFullYear();

  const monthSel = qs('#summary-month');
  if (monthSel) {
    monthSel.value = year + '-' + String(month).padStart(2,'0');
    monthSel.addEventListener('change', () => {
      const [y,m] = monthSel.value.split('-');
      year = parseInt(y); month = parseInt(m);
      loadStats();
    });
  }

  let summaryChart = null;

  // Tabs
  qsa('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      qsa('.tab-btn').forEach(b => b.classList.remove('active'));
      qsa('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const t = btn.dataset.tab;
      qs('#tab-' + t)?.classList.add('active');
      if (t === 'pie') renderSummaryPie();
      if (t === 'bar') renderSummaryBar();
    });
  });

  let reportData = null;

  async function loadStats() {
    const data = await api.get(`api/reports.php?month=${month}&year=${year}`);
    reportData = data;

    qs('#sum-total')   && (qs('#sum-total').textContent   = fmt(data.total));
    qs('#sum-budget')  && (qs('#sum-budget').textContent  = fmt(data.total_budget));
    qs('#sum-count')   && (qs('#sum-count').textContent   = data.count);
    const rem = data.total_budget - data.total;
    const remEl = qs('#sum-remaining');
    if (remEl) { remEl.textContent = fmt(Math.abs(rem)); remEl.className = 'summary-stat-value' + (rem < 0 ? ' danger' : ''); }

    // Detailed table
    const tbody = qs('#sum-detail-tbody');
    if (tbody && data.by_category) {
      tbody.innerHTML = data.by_category.map(c => {
        const bud = data.budgets?.find(b => b.category_id == c.category_id);
        const budAmt = bud ? bud.budget_amount : 0;
        return `<tr>
          <td><div style="display:flex;align-items:center;gap:8px"><div class="expense-dot" style="background:${c.color||'#9ca3af'}"></div>${esc(c.category_name||'Uncategorized')}</div></td>
          <td class="mono">${fmt(c.total)}</td>
          <td class="mono">${budAmt ? fmt(budAmt) : '—'}</td>
          <td>${c.count}</td>
        </tr>`;
      }).join('');
    }
  }

  function renderSummaryPie() {
    if (!reportData) return;
    const canvas = qs('#sum-pie-chart');
    if (!canvas) return;
    if (summaryChart) summaryChart.destroy();
    const items = reportData.by_category || [];
    summaryChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels:   items.map(i=>i.category_name||'Uncategorized'),
        datasets: [{ data: items.map(i=>i.total), backgroundColor: items.map(i=>i.color||'#9ca3af'), borderWidth: 2 }]
      },
      options: { cutout: '60%', plugins: { legend: { position: 'bottom' } }, maintainAspectRatio: true }
    });
  }

  function renderSummaryBar() {
    if (!reportData) return;
    const canvas = qs('#sum-bar-chart');
    if (!canvas) return;
    if (summaryChart) summaryChart.destroy();
    const items = reportData.by_category || [];
    summaryChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: items.map(i=>i.category_name||'Uncategorized'),
        datasets: [{ label:'Spent', data: items.map(i=>i.total), backgroundColor: items.map(i=>i.color||'#9ca3af'), borderRadius: 6 }]
      },
      options: { plugins: {legend:{display:false}}, scales:{y:{beginAtZero:true}}, maintainAspectRatio: true }
    });
  }

  qs('#generate-summary-btn')?.addEventListener('click', async () => {
    const btn = qs('#generate-summary-btn');
    btn.disabled = true; btn.innerHTML = '<div class="spinner" style="width:18px;height:18px;display:inline-block;margin-right:6px"></div> Generating…';
    const wrap = qs('#ai-summary-content');
    wrap.innerHTML = '<div class="loading-overlay"><div class="spinner"></div></div>';

    try {
      const res = await api.post('api/ai.php', { type: 'monthly_summary', month, year });
      wrap.innerHTML = `<div class="ai-summary-box">${formatAiText(res.content)}</div>`;
    } catch(err) {
      wrap.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
    } finally {
      btn.disabled = false; btn.innerHTML = '<i data-lucide="sparkles" style="width:16px;height:16px;margin-right:6px"></i> Generate Summary';
      lucide.createIcons();
    }
  });

  await loadStats();
}

/* ── AI Advisor ── */
async function initAIAdvisor() {
  const messagesWrap = qs('#chat-messages');
  const inputEl      = qs('#chat-input');
  const sendBtn      = qs('#chat-send');
  let history = [];
  let isEmpty = true;

  function showEmpty() {
    qs('#ai-empty').classList.remove('hidden');
    qs('#chat-messages').classList.add('hidden');
  }
  function hideEmpty() {
    qs('#ai-empty').classList.add('hidden');
    qs('#chat-messages').classList.remove('hidden');
  }

  async function send(msg) {
    if (!msg.trim()) return;
    if (isEmpty) { hideEmpty(); isEmpty = false; }

    history.push({ role: 'user', content: msg });
    renderMessages();

    inputEl.value = '';
    inputEl.style.height = 'auto';
    sendBtn.disabled = true;
    appendTyping();

    try {
      const res = await api.post('api/ai.php', { type: 'chat', messages: history });
      removeTyping();
      history.push({ role: 'assistant', content: res.content });
      renderMessages();
    } catch(err) {
      removeTyping();
      history.push({ role: 'assistant', content: '⚠️ ' + err.message });
      renderMessages();
    } finally {
      sendBtn.disabled = false;
    }
  }

  function renderMessages() {
    messagesWrap.innerHTML = history.map(m => `
      <div class="chat-msg ${m.role === 'user' ? 'user' : 'ai'}">
        <div class="chat-avatar ${m.role === 'user' ? 'user' : 'ai'}">${m.role==='user' ? 'U' : '<i data-lucide="sparkles" style="width:14px;height:14px"></i>'}</div>
        <div class="chat-bubble">${formatAiText(m.content)}</div>
      </div>`).join('');
    messagesWrap.scrollTop = messagesWrap.scrollHeight;
    lucide.createIcons();
  }

  function appendTyping() {
    messagesWrap.innerHTML += `<div class="chat-msg ai" id="typing-indicator">
      <div class="chat-avatar ai"><i data-lucide="sparkles" style="width:14px;height:14px"></i></div>
      <div class="chat-bubble" style="display:flex;gap:4px;align-items:center">
        <span style="animation:pulse 1s infinite">●</span>
        <span style="animation:pulse 1s .2s infinite">●</span>
        <span style="animation:pulse 1s .4s infinite">●</span>
      </div></div>`;
    lucide.createIcons();
    messagesWrap.scrollTop = messagesWrap.scrollHeight;
  }
  function removeTyping() { qs('#typing-indicator')?.remove(); }

  sendBtn?.addEventListener('click', () => send(inputEl.value));
  inputEl?.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(inputEl.value); } });
  inputEl?.addEventListener('input', () => { inputEl.style.height = 'auto'; inputEl.style.height = inputEl.scrollHeight + 'px'; });

  // Suggested prompts
  qsa('.prompt-card').forEach(card => {
    card.addEventListener('click', () => send(card.dataset.prompt));
  });
}

function formatAiText(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^### (.*$)/gm, '<h4 style="font-size:.9rem;font-weight:700;margin:12px 0 6px">$1</h4>')
    .replace(/^## (.*$)/gm,  '<h3 style="font-size:1rem;font-weight:700;margin:14px 0 6px">$1</h3>')
    .replace(/^- (.*$)/gm,   '<li style="margin-left:16px;margin-bottom:4px">$1</li>')
    .replace(/\n/g, '<br>');
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  initSidebar();

  const page = document.body.dataset.page;
  const pages = {
    dashboard:       initDashboard,
    expenses:        initExpenses,
    'add-expense':   initAddExpense,
    categories:      initCategories,
    budgets:         initBudgets,
    recurring:       initRecurring,
    reports:         initReports,
    'monthly-summary': initMonthlySummary,
    'ai-advisor':    initAIAdvisor,
  };
  if (pages[page]) pages[page]();
});
