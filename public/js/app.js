/* jshint esversion: 6 */
'use strict';

const API = '/api';

// ===== TOAST =====
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ===== API HELPERS =====
async function apiFetch(path, options = {}) {
  try {
    const res = await fetch(API + path, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'API error');
    return data;
  } catch (err) {
    showToast(err.message, 'error');
    throw err;
  }
}

// ===== NAVIGATION =====
function navigate(page) {
  document.querySelectorAll('.nav-item').forEach((el) => el.classList.remove('active'));
  const navEl = document.querySelector(`[data-page="${page}"]`);
  if (navEl) navEl.classList.add('active');

  document.querySelectorAll('.page-section').forEach((el) => el.classList.add('hidden'));
  const section = document.getElementById(`page-${page}`);
  if (section) section.classList.remove('hidden');

  // Update topbar title
  const titles = {
    dashboard: '📊 Dashboard',
    products: '📦 Products',
    suppliers: '🏭 Suppliers',
    automation: '⚡ Automation',
    scout: '🔍 Product Scout',
  };
  document.getElementById('topbar-title').textContent = titles[page] || page;

  // Load page data
  if (page === 'dashboard') loadDashboard();
  else if (page === 'products') loadProducts();
  else if (page === 'suppliers') loadSuppliers();
  else if (page === 'automation') loadAutomation();
  else if (page === 'scout') loadScout();
}

// ===== DASHBOARD =====
async function loadDashboard() {
  try {
    const [dashRes, prodStats, supStats] = await Promise.all([
      apiFetch('/automation/dashboard'),
      apiFetch('/products/stats'),
      apiFetch('/suppliers/stats'),
    ]);

    const d = dashRes.data;
    const p = prodStats.data;
    const s = supStats.data;

    document.getElementById('dash-total-products').textContent = p.totalProducts;
    document.getElementById('dash-active-products').textContent = p.activeProducts;
    document.getElementById('dash-total-suppliers').textContent = s.totalSuppliers;
    document.getElementById('dash-monthly-revenue').textContent = `$${d.totalEstimatedMonthlyRevenue.toLocaleString()}`;
    document.getElementById('dash-monthly-profit').textContent = `$${d.totalEstimatedMonthlyProfit.toLocaleString()}`;
    document.getElementById('dash-avg-margin').textContent = `${p.avgProfitMargin}%`;
    document.getElementById('dash-automated').textContent = p.automatedProducts;

    // Top products table
    const tbody = document.getElementById('top-products-tbody');
    if (d.topProducts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:20px">No products found</td></tr>';
      return;
    }
    tbody.innerHTML = d.topProducts.map((p) => `
      <tr>
        <td><strong>${p.productName}</strong></td>
        <td>$${p.supplierPrice}</td>
        <td>$${p.sellingPrice}</td>
        <td><span class="tag tag-green">${p.marginPct}%</span></td>
        <td style="color:var(--success)"><strong>$${p.estimatedMonthlyProfit}</strong></td>
      </tr>
    `).join('');
  } catch (_) { /* handled by apiFetch */ }
}

// ===== PRODUCTS =====
let allProducts = [];

async function loadProducts(search = '') {
  try {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await apiFetch(`/products${query}`);
    allProducts = res.data;
    renderProducts(allProducts);
  } catch (_) { /* */ }
}

function renderProducts(products) {
  const grid = document.getElementById('products-grid');
  if (products.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="icon">📦</div><h3>No products found</h3><p>Add your first product to get started.</p></div>`;
    return;
  }
  grid.innerHTML = products.map((p) => {
    const margin = Math.round(((p.sellingPrice - p.supplierPrice) / p.sellingPrice) * 100);
    const emoji = categoryEmoji(p.category);
    return `
      <div class="product-card">
        <div class="product-card-img">${emoji}</div>
        <div class="product-card-body">
          <div class="product-card-name">${p.name}</div>
          <div class="product-card-cat">${p.category} &bull; SKU: ${p.sku || 'N/A'}</div>
          <div class="product-prices">
            <div class="price-item cost"><div class="price-label">Cost</div><div class="price-value">$${p.supplierPrice}</div></div>
            <div class="price-item sell"><div class="price-label">Sell</div><div class="price-value">$${p.sellingPrice}</div></div>
          </div>
          <div class="product-margin">Margin: <strong>${margin}%</strong> &bull; Stock: ${p.stock} &bull; ${p.automate ? '<span class="tag tag-teal">Auto</span>' : '<span class="tag tag-yellow">Manual</span>'}</div>
          <div class="product-card-actions">
            <button class="btn btn-ghost btn-sm" onclick="openProfitCalc('${p.id}')">💰 Calc</button>
            <button class="btn btn-ghost btn-sm" onclick="openEditProduct('${p.id}')">✏️ Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteProduct('${p.id}')">🗑</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function categoryEmoji(cat) {
  const map = {
    Electronics: '🎧', 'Home & Garden': '🏡', Accessories: '👜', Fashion: '👗',
    Sports: '🏋️', Kitchen: '🍳', Furniture: '🛋️', Gadgets: '🔌',
  };
  return map[cat] || '📦';
}

async function deleteProduct(id) {
  if (!confirm('Delete this product?')) return;
  try {
    await apiFetch(`/products/${id}`, { method: 'DELETE' });
    showToast('Product deleted', 'success');
    loadProducts();
  } catch (_) { /* */ }
}

function openAddProduct() {
  document.getElementById('product-form').reset();
  document.getElementById('product-form-id').value = '';
  document.getElementById('product-modal-title').textContent = 'Add Product';
  document.getElementById('product-modal').classList.add('open');
  populateSupplierSelect();
}

async function openEditProduct(id) {
  try {
    const res = await apiFetch(`/products/${id}`);
    const p = res.data;
    document.getElementById('product-form-id').value = p.id;
    document.getElementById('product-form-name').value = p.name;
    document.getElementById('product-form-sku').value = p.sku || '';
    document.getElementById('product-form-category').value = p.category;
    document.getElementById('product-form-supplier-price').value = p.supplierPrice;
    document.getElementById('product-form-selling-price').value = p.sellingPrice;
    document.getElementById('product-form-stock').value = p.stock;
    document.getElementById('product-form-automate').value = String(p.automate);
    document.getElementById('product-form-description').value = p.description || '';
    document.getElementById('product-modal-title').textContent = 'Edit Product';
    document.getElementById('product-modal').classList.add('open');
    await populateSupplierSelect(p.supplierId);
  } catch (_) { /* */ }
}

async function populateSupplierSelect(selectedId = null) {
  try {
    const res = await apiFetch('/suppliers');
    const select = document.getElementById('product-form-supplier');
    select.innerHTML = '<option value="">Select supplier...</option>' +
      res.data.map((s) => `<option value="${s.id}" ${s.id === selectedId ? 'selected' : ''}>${s.name}</option>`).join('');
  } catch (_) { /* */ }
}

async function saveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('product-form-id').value;
  const body = {
    name: document.getElementById('product-form-name').value,
    sku: document.getElementById('product-form-sku').value,
    category: document.getElementById('product-form-category').value,
    supplierId: document.getElementById('product-form-supplier').value,
    supplierPrice: parseFloat(document.getElementById('product-form-supplier-price').value),
    sellingPrice: parseFloat(document.getElementById('product-form-selling-price').value),
    stock: parseInt(document.getElementById('product-form-stock').value, 10),
    automate: document.getElementById('product-form-automate').value === 'true',
    description: document.getElementById('product-form-description').value,
    status: 'active',
  };

  try {
    if (id) {
      await apiFetch(`/products/${id}`, { method: 'PUT', body: JSON.stringify(body) });
      showToast('Product updated!', 'success');
    } else {
      await apiFetch('/products', { method: 'POST', body: JSON.stringify(body) });
      showToast('Product added!', 'success');
    }
    document.getElementById('product-modal').classList.remove('open');
    loadProducts();
  } catch (_) { /* */ }
}

// ===== PROFIT CALCULATOR =====
async function openProfitCalc(id) {
  try {
    const res = await apiFetch(`/products/${id}`);
    const p = res.data;
    document.getElementById('calc-product-id').value = p.id;
    document.getElementById('calc-product-name').textContent = p.name;
    document.getElementById('calc-shipping').value = '2.50';
    document.getElementById('calc-platform-fee').value = '3.00';
    document.getElementById('calc-other').value = '0';
    document.getElementById('calc-sales').value = '30';
    document.getElementById('calc-results').innerHTML = '';
    document.getElementById('calc-modal').classList.add('open');
  } catch (_) { /* */ }
}

async function runProfitCalc(e) {
  e.preventDefault();
  const id = document.getElementById('calc-product-id').value;
  const body = {
    shippingCost: parseFloat(document.getElementById('calc-shipping').value) || 0,
    platformFee: parseFloat(document.getElementById('calc-platform-fee').value) || 0,
    otherCosts: parseFloat(document.getElementById('calc-other').value) || 0,
    estimatedSales: parseInt(document.getElementById('calc-sales').value, 10) || 30,
  };
  try {
    const res = await apiFetch(`/products/${id}/profit-calculator`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const d = res.data;
    const marginClass = d.marginPct > 30 ? 'green' : d.marginPct > 15 ? 'teal' : 'red';
    document.getElementById('calc-results').innerHTML = `
      <div class="card" style="margin-top:16px">
        <div class="profit-meter">
          <div class="profit-row"><span class="label">Selling Price</span><span class="value">$${d.sellingPrice}</span></div>
          <div class="profit-row"><span class="label">Total Cost</span><span class="value" style="color:var(--warning)">-$${d.totalCost}</span></div>
          <div class="profit-row" style="border-top:1px solid var(--border);padding-top:8px;margin-top:4px">
            <span class="label">Net Profit/unit</span><span class="value" style="color:var(--success)"><strong>$${d.netProfit}</strong></span>
          </div>
          <div class="profit-row">
            <span class="label">Margin</span>
            <span class="tag tag-${marginClass === 'red' ? 'red' : marginClass === 'green' ? 'green' : 'teal'}">${d.marginPct}%</span>
          </div>
          <div class="profit-row" style="border-top:1px solid var(--border);padding-top:8px;margin-top:4px">
            <span class="label">Est. Monthly Revenue (${d.estimatedSales} sales)</span>
            <span class="value">$${d.monthlyRevenue}</span>
          </div>
          <div class="profit-row">
            <span class="label">Est. Monthly Profit</span>
            <span class="value" style="color:var(--success)"><strong>$${d.monthlyProfit}</strong></span>
          </div>
        </div>
      </div>
    `;
  } catch (_) { /* */ }
}

// ===== SUPPLIERS =====
async function loadSuppliers(search = '') {
  try {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await apiFetch(`/suppliers${query}`);
    renderSuppliers(res.data);
  } catch (_) { /* */ }
}

function renderSuppliers(suppliers) {
  const tbody = document.getElementById('suppliers-tbody');
  if (suppliers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:30px">No suppliers found</td></tr>';
    return;
  }
  tbody.innerHTML = suppliers.map((s) => `
    <tr>
      <td><strong>${s.name}</strong></td>
      <td>${s.country}</td>
      <td><span class="tag tag-${s.rating >= 4.5 ? 'green' : 'yellow'}">⭐ ${s.rating}</span></td>
      <td>${(s.categories || []).join(', ')}</td>
      <td>${s.avgShippingDays || 'N/A'} days</td>
      <td>
        <span class="tag tag-${s.status === 'active' ? 'green' : 'red'}">${s.status}</span>
        <button class="btn btn-ghost btn-sm" style="margin-left:8px" onclick="openEditSupplier('${s.id}')">✏️</button>
        <button class="btn btn-danger btn-sm" onclick="deleteSupplier('${s.id}')">🗑</button>
      </td>
    </tr>
  `).join('');
}

async function deleteSupplier(id) {
  if (!confirm('Delete this supplier?')) return;
  try {
    await apiFetch(`/suppliers/${id}`, { method: 'DELETE' });
    showToast('Supplier deleted', 'success');
    loadSuppliers();
  } catch (_) { /* */ }
}

function openAddSupplier() {
  document.getElementById('supplier-form').reset();
  document.getElementById('supplier-form-id').value = '';
  document.getElementById('supplier-modal-title').textContent = 'Add Supplier';
  document.getElementById('supplier-modal').classList.add('open');
}

async function openEditSupplier(id) {
  try {
    const res = await apiFetch(`/suppliers/${id}`);
    const s = res.data;
    document.getElementById('supplier-form-id').value = s.id;
    document.getElementById('supplier-form-name').value = s.name;
    document.getElementById('supplier-form-country').value = s.country;
    document.getElementById('supplier-form-website').value = s.website || '';
    document.getElementById('supplier-form-email').value = s.contactEmail || '';
    document.getElementById('supplier-form-rating').value = s.rating || '';
    document.getElementById('supplier-form-shipping-days').value = s.avgShippingDays || '';
    document.getElementById('supplier-form-categories').value = (s.categories || []).join(', ');
    document.getElementById('supplier-modal-title').textContent = 'Edit Supplier';
    document.getElementById('supplier-modal').classList.add('open');
  } catch (_) { /* */ }
}

async function saveSupplier(e) {
  e.preventDefault();
  const id = document.getElementById('supplier-form-id').value;
  const categories = document.getElementById('supplier-form-categories').value
    .split(',').map((c) => c.trim()).filter(Boolean);
  const body = {
    name: document.getElementById('supplier-form-name').value,
    country: document.getElementById('supplier-form-country').value,
    website: document.getElementById('supplier-form-website').value,
    contactEmail: document.getElementById('supplier-form-email').value,
    rating: parseFloat(document.getElementById('supplier-form-rating').value) || null,
    avgShippingDays: parseInt(document.getElementById('supplier-form-shipping-days').value, 10) || null,
    categories,
    status: 'active',
  };
  try {
    if (id) {
      await apiFetch(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(body) });
      showToast('Supplier updated!', 'success');
    } else {
      await apiFetch('/suppliers', { method: 'POST', body: JSON.stringify(body) });
      showToast('Supplier added!', 'success');
    }
    document.getElementById('supplier-modal').classList.remove('open');
    loadSuppliers();
  } catch (_) { /* */ }
}

// ===== AUTOMATION =====
async function loadAutomation() {
  try {
    const res = await apiFetch('/automation/jobs');
    renderJobs(res.data);
  } catch (_) { /* */ }
}

function renderJobs(jobs) {
  const container = document.getElementById('jobs-container');
  if (jobs.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="icon">⚡</div><h3>No automation jobs</h3><p>Create your first job to automate product monitoring.</p></div>`;
    return;
  }
  const typeMap = {
    price_monitor: { label: 'Price Monitor', icon: '📈', cls: 'monitor' },
    stock_check: { label: 'Stock Check', icon: '📦', cls: 'stock' },
    profit_analysis: { label: 'Profit Analysis', icon: '💰', cls: 'profit' },
  };
  container.innerHTML = jobs.map((j) => {
    const t = typeMap[j.type] || { label: j.type, icon: '⚡', cls: 'monitor' };
    return `
      <div class="job-card">
        <div class="job-icon ${t.cls}">${t.icon}</div>
        <div class="job-info">
          <div class="job-name">${j.name}</div>
          <div class="job-type">${t.label} &bull; Status: <span class="tag tag-${j.status === 'running' ? 'teal' : j.status === 'pending' ? 'yellow' : 'green'}">${j.status}</span></div>
          ${j.lastRun ? `<div style="font-size:12px;color:var(--text-muted);margin-top:4px">Last run: ${new Date(j.lastRun).toLocaleString()}</div>` : ''}
        </div>
        <div class="job-actions">
          <button class="btn btn-primary btn-sm" onclick="runJob('${j.id}', '${j.type}', '${j.productId || ''}')">▶ Run</button>
          <button class="btn btn-danger btn-sm" onclick="deleteJob('${j.id}')">🗑</button>
        </div>
      </div>
    `;
  }).join('');
}

async function runJob(jobId, type, productId) {
  try {
    let result;
    if (type === 'price_monitor') {
      result = await apiFetch('/automation/run/price-monitor', { method: 'POST', body: JSON.stringify({ productId }) });
      showToast(`Price check: ${result.data.productName} — $${result.data.currentPrice} (was $${result.data.previousPrice})`, 'info');
    } else if (type === 'stock_check') {
      result = await apiFetch('/automation/run/stock-check', { method: 'POST', body: JSON.stringify({ productId }) });
      const msg = result.data.lowStock ? '⚠️ Low stock alert!' : '✅ Stock OK';
      showToast(`${result.data.productName}: ${result.data.currentStock} units — ${msg}`, result.data.lowStock ? 'error' : 'success');
    } else if (type === 'profit_analysis') {
      result = await apiFetch('/automation/run/profit-analysis');
      showToast(`Profit analysis complete for ${result.count} products`, 'success');
    }
    await apiFetch(`/automation/jobs/${jobId}`, {
      method: 'PUT',
      body: JSON.stringify({ lastRun: new Date().toISOString(), status: 'completed' }),
    });
    loadAutomation();
  } catch (_) { /* */ }
}

async function deleteJob(id) {
  if (!confirm('Delete this job?')) return;
  try {
    await apiFetch(`/automation/jobs/${id}`, { method: 'DELETE' });
    showToast('Job deleted', 'success');
    loadAutomation();
  } catch (_) { /* */ }
}

function openAddJob() {
  document.getElementById('job-form').reset();
  document.getElementById('job-modal').classList.add('open');
  populateProductSelectForJob();
}

async function populateProductSelectForJob() {
  try {
    const res = await apiFetch('/products');
    const select = document.getElementById('job-form-product');
    select.innerHTML = '<option value="">All products</option>' +
      res.data.map((p) => `<option value="${p.id}">${p.name}</option>`).join('');
  } catch (_) { /* */ }
}

async function saveJob(e) {
  e.preventDefault();
  const type = document.getElementById('job-form-type').value;
  const productId = document.getElementById('job-form-product').value;
  const body = {
    name: document.getElementById('job-form-name').value,
    type,
    productId: productId || null,
  };
  try {
    await apiFetch('/automation/jobs', { method: 'POST', body: JSON.stringify(body) });
    showToast('Job created!', 'success');
    document.getElementById('job-modal').classList.remove('open');
    loadAutomation();
  } catch (_) { /* */ }
}

// ===== SCOUT =====
async function loadScout() {
  try {
    const res = await apiFetch('/automation/run/profit-analysis');
    renderScoutResults(res.data);
  } catch (_) { /* */ }
}

function renderScoutResults(items) {
  const container = document.getElementById('scout-results');
  if (items.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="icon">🔍</div><h3>No products to scout</h3></div>`;
    return;
  }
  const sorted = [...items].sort((a, b) => b.marginPct - a.marginPct);
  container.innerHTML = sorted.map((item) => {
    const marginClass = item.marginPct > 50 ? 'green' : item.marginPct > 30 ? 'teal' : item.marginPct > 15 ? 'yellow' : 'red';
    const barWidth = Math.min(item.marginPct, 100);
    return `
      <div class="card" style="margin-bottom:16px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <div>
            <div style="font-weight:700;font-size:16px">${item.productName}</div>
            <div style="font-size:12px;color:var(--text-muted)">Cost: $${item.supplierPrice} &bull; Sell: $${item.sellingPrice}</div>
          </div>
          <div style="text-align:right">
            <span class="tag tag-${marginClass}" style="font-size:14px">${item.marginPct}% margin</span>
            <div style="font-size:12px;color:var(--success);margin-top:4px">+$${item.grossProfit} profit</div>
          </div>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${barWidth}%"></div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:12px;font-size:13px;color:var(--text-muted)">
          <span>Est. Monthly Revenue: <strong style="color:var(--text)">$${item.estimatedMonthlyRevenue}</strong></span>
          <span>Est. Monthly Profit: <strong style="color:var(--success)">$${item.estimatedMonthlyProfit}</strong></span>
        </div>
      </div>
    `;
  }).join('');
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  navigate('dashboard');

  // Search handlers
  document.getElementById('product-search-input').addEventListener('input', (e) => {
    loadProducts(e.target.value);
  });
  document.getElementById('supplier-search-input').addEventListener('input', (e) => {
    loadSuppliers(e.target.value);
  });

  // Form submissions
  document.getElementById('product-form').addEventListener('submit', saveProduct);
  document.getElementById('supplier-form').addEventListener('submit', saveSupplier);
  document.getElementById('job-form').addEventListener('submit', saveJob);
  document.getElementById('calc-form').addEventListener('submit', runProfitCalc);
});
