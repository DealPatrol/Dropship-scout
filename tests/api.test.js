'use strict';

const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../server');

const DATA_DIR = path.join(__dirname, '../data');

// Backup and restore data files around tests
let originalProducts, originalSuppliers, originalJobs;

beforeAll(() => {
  originalProducts = fs.readFileSync(path.join(DATA_DIR, 'products.json'), 'utf8');
  originalSuppliers = fs.readFileSync(path.join(DATA_DIR, 'suppliers.json'), 'utf8');
  originalJobs = fs.readFileSync(path.join(DATA_DIR, 'automation_jobs.json'), 'utf8');
});

afterAll(() => {
  fs.writeFileSync(path.join(DATA_DIR, 'products.json'), originalProducts, 'utf8');
  fs.writeFileSync(path.join(DATA_DIR, 'suppliers.json'), originalSuppliers, 'utf8');
  fs.writeFileSync(path.join(DATA_DIR, 'automation_jobs.json'), originalJobs, 'utf8');
});

// ===== HEALTH =====
describe('GET /api/health', () => {
  it('returns ok status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.app).toBe('Dropship Scout');
  });
});

// ===== PRODUCTS =====
describe('Products API', () => {
  it('GET /api/products returns list', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/products/stats returns stats', async () => {
    const res = await request(app).get('/api/products/stats');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('totalProducts');
    expect(res.body.data).toHaveProperty('avgProfitMargin');
  });

  it('GET /api/products/:id returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/products/not-a-real-id');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/products creates a product', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({
        name: 'Test Widget',
        sku: 'TW-0001',
        supplierId: 'sup-001',
        supplierPrice: 5.00,
        sellingPrice: 19.99,
        category: 'Gadgets',
        stock: 100,
        automate: false,
        status: 'active',
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Test Widget');
    expect(res.body.data.id).toBeDefined();
  });

  it('POST /api/products returns 400 when required fields missing', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ name: 'Incomplete' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('PUT /api/products/:id updates a product', async () => {
    const createRes = await request(app)
      .post('/api/products')
      .send({
        name: 'Update Me',
        supplierId: 'sup-001',
        supplierPrice: 3.00,
        sellingPrice: 9.99,
        category: 'Accessories',
        stock: 50,
        status: 'active',
      });
    const id = createRes.body.data.id;
    const updateRes = await request(app)
      .put(`/api/products/${id}`)
      .send({ sellingPrice: 14.99 });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.sellingPrice).toBe(14.99);
  });

  it('DELETE /api/products/:id removes a product', async () => {
    const createRes = await request(app)
      .post('/api/products')
      .send({
        name: 'Delete Me',
        supplierId: 'sup-001',
        supplierPrice: 2.00,
        sellingPrice: 7.99,
        category: 'Other',
        stock: 10,
        status: 'active',
      });
    const id = createRes.body.data.id;
    const deleteRes = await request(app).delete(`/api/products/${id}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);
    const getRes = await request(app).get(`/api/products/${id}`);
    expect(getRes.status).toBe(404);
  });

  it('GET /api/products?search filters results', async () => {
    const res = await request(app).get('/api/products?search=earbuds');
    expect(res.status).toBe(200);
    expect(res.body.data.every((p) => p.name.toLowerCase().includes('earbuds') ||
      (p.tags && p.tags.some((t) => t.toLowerCase().includes('earbuds')))
    )).toBe(true);
  });

  it('POST /api/products/:id/profit-calculator returns calculation', async () => {
    const res = await request(app)
      .post('/api/products/prod-001/profit-calculator')
      .send({ shippingCost: 2, platformFee: 3, estimatedSales: 50 });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('netProfit');
    expect(res.body.data).toHaveProperty('monthlyProfit');
    expect(res.body.data.estimatedSales).toBe(50);
  });
});

// ===== SUPPLIERS =====
describe('Suppliers API', () => {
  it('GET /api/suppliers returns list', async () => {
    const res = await request(app).get('/api/suppliers');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/suppliers/stats returns stats', async () => {
    const res = await request(app).get('/api/suppliers/stats');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('totalSuppliers');
    expect(res.body.data).toHaveProperty('countries');
  });

  it('GET /api/suppliers/:id returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/suppliers/not-a-real-id');
    expect(res.status).toBe(404);
  });

  it('POST /api/suppliers creates a supplier', async () => {
    const res = await request(app)
      .post('/api/suppliers')
      .send({ name: 'Test Supplier', country: 'Japan', status: 'active' });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Test Supplier');
  });

  it('POST /api/suppliers returns 400 when required fields missing', async () => {
    const res = await request(app).post('/api/suppliers').send({ name: 'No Country' });
    expect(res.status).toBe(400);
  });

  it('PUT /api/suppliers/:id updates a supplier', async () => {
    const createRes = await request(app)
      .post('/api/suppliers')
      .send({ name: 'Update Supplier', country: 'Canada', status: 'active' });
    const id = createRes.body.data.id;
    const updateRes = await request(app)
      .put(`/api/suppliers/${id}`)
      .send({ country: 'USA' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.country).toBe('USA');
  });

  it('DELETE /api/suppliers/:id removes a supplier', async () => {
    const createRes = await request(app)
      .post('/api/suppliers')
      .send({ name: 'Delete Supplier', country: 'Mexico', status: 'active' });
    const id = createRes.body.data.id;
    const deleteRes = await request(app).delete(`/api/suppliers/${id}`);
    expect(deleteRes.status).toBe(200);
    const getRes = await request(app).get(`/api/suppliers/${id}`);
    expect(getRes.status).toBe(404);
  });
});

// ===== AUTOMATION =====
describe('Automation API', () => {
  it('GET /api/automation/jobs returns list', async () => {
    const res = await request(app).get('/api/automation/jobs');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /api/automation/jobs creates a job', async () => {
    const res = await request(app)
      .post('/api/automation/jobs')
      .send({ name: 'Test Price Monitor', type: 'price_monitor', productId: 'prod-001' });
    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe('price_monitor');
    expect(res.body.data.status).toBe('pending');
  });

  it('POST /api/automation/jobs returns 400 for invalid type', async () => {
    const res = await request(app)
      .post('/api/automation/jobs')
      .send({ name: 'Bad Job', type: 'invalid_type' });
    expect(res.status).toBe(400);
  });

  it('POST /api/automation/run/price-monitor returns result', async () => {
    const res = await request(app)
      .post('/api/automation/run/price-monitor')
      .send({ productId: 'prod-001' });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('currentPrice');
    expect(res.body.data).toHaveProperty('newMargin');
  });

  it('POST /api/automation/run/stock-check returns result', async () => {
    const res = await request(app)
      .post('/api/automation/run/stock-check')
      .send({ productId: 'prod-002' });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('currentStock');
    expect(res.body.data).toHaveProperty('lowStock');
  });

  it('GET /api/automation/run/profit-analysis returns analysis', async () => {
    const res = await request(app).get('/api/automation/run/profit-analysis');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    if (res.body.data.length > 0) {
      expect(res.body.data[0]).toHaveProperty('marginPct');
    }
  });

  it('GET /api/automation/dashboard returns dashboard data', async () => {
    const res = await request(app).get('/api/automation/dashboard');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('productStats');
    expect(res.body.data).toHaveProperty('topProducts');
    expect(res.body.data).toHaveProperty('totalEstimatedMonthlyRevenue');
  });

  it('DELETE /api/automation/jobs/:id removes a job', async () => {
    const createRes = await request(app)
      .post('/api/automation/jobs')
      .send({ name: 'Delete Me Job', type: 'stock_check' });
    const id = createRes.body.data.id;
    const deleteRes = await request(app).delete(`/api/automation/jobs/${id}`);
    expect(deleteRes.status).toBe(200);
    const getRes = await request(app).get(`/api/automation/jobs/${id}`);
    expect(getRes.status).toBe(404);
  });
});
