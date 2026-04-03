'use strict';

const express = require('express');
const router = express.Router();
const Automation = require('../models/automation');
const Product = require('../models/product');

// GET /api/automation/jobs - list all automation jobs
router.get('/jobs', (req, res) => {
  const jobs = Automation.getAll();
  res.json({ success: true, data: jobs, count: jobs.length });
});

// GET /api/automation/jobs/:id - get job by id
router.get('/jobs/:id', (req, res) => {
  const job = Automation.getById(req.params.id);
  if (!job) {
    return res.status(404).json({ success: false, message: 'Job not found' });
  }
  res.json({ success: true, data: job });
});

// POST /api/automation/jobs - create automation job
router.post('/jobs', (req, res) => {
  const { type, productId, name } = req.body;
  if (!type || !name) {
    return res.status(400).json({
      success: false,
      message: 'type and name are required',
    });
  }

  const validTypes = Object.values(Automation.JOB_TYPES);
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      message: `type must be one of: ${validTypes.join(', ')}`,
    });
  }

  const job = Automation.create(req.body);
  res.status(201).json({ success: true, data: job });
});

// PUT /api/automation/jobs/:id - update job
router.put('/jobs/:id', (req, res) => {
  const job = Automation.update(req.params.id, req.body);
  if (!job) {
    return res.status(404).json({ success: false, message: 'Job not found' });
  }
  res.json({ success: true, data: job });
});

// DELETE /api/automation/jobs/:id - delete job
router.delete('/jobs/:id', (req, res) => {
  const deleted = Automation.remove(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Job not found' });
  }
  res.json({ success: true, message: 'Job deleted' });
});

// POST /api/automation/run/price-monitor - run price monitor for a product
router.post('/run/price-monitor', (req, res) => {
  const { productId } = req.body;
  if (!productId) {
    return res.status(400).json({ success: false, message: 'productId is required' });
  }
  const products = Product.getAll();
  const result = Automation.runPriceMonitor(productId, products);
  if (result.error) {
    return res.status(404).json({ success: false, message: result.error });
  }
  res.json({ success: true, data: result });
});

// POST /api/automation/run/stock-check - run stock check for a product
router.post('/run/stock-check', (req, res) => {
  const { productId } = req.body;
  if (!productId) {
    return res.status(400).json({ success: false, message: 'productId is required' });
  }
  const products = Product.getAll();
  const result = Automation.runStockCheck(productId, products);
  if (result.error) {
    return res.status(404).json({ success: false, message: result.error });
  }
  res.json({ success: true, data: result });
});

// GET /api/automation/run/profit-analysis - run profit analysis on all products
router.get('/run/profit-analysis', (req, res) => {
  const products = Product.getAll();
  const analysis = Automation.runProfitAnalysis(products);
  res.json({ success: true, data: analysis, count: analysis.length });
});

// GET /api/automation/dashboard - get dashboard stats
router.get('/dashboard', (req, res) => {
  const products = Product.getAll();
  const productStats = Product.getStats();

  const automatedProducts = products.filter((p) => p.automate);
  const analysis = Automation.runProfitAnalysis(automatedProducts);
  const topProducts = analysis
    .sort((a, b) => b.estimatedMonthlyProfit - a.estimatedMonthlyProfit)
    .slice(0, 5);

  const totalEstimatedMonthlyRevenue = analysis.reduce(
    (sum, p) => sum + p.estimatedMonthlyRevenue,
    0
  );
  const totalEstimatedMonthlyProfit = analysis.reduce(
    (sum, p) => sum + p.estimatedMonthlyProfit,
    0
  );

  res.json({
    success: true,
    data: {
      productStats,
      topProducts,
      totalEstimatedMonthlyRevenue: Math.round(totalEstimatedMonthlyRevenue * 100) / 100,
      totalEstimatedMonthlyProfit: Math.round(totalEstimatedMonthlyProfit * 100) / 100,
      activeJobs: Automation.getAll().filter((j) => j.status === 'running').length,
    },
  });
});

module.exports = router;
