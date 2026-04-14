'use strict';

const express = require('express');
const router = express.Router();
const Product = require('../models/product');

// GET /api/products - list all products
router.get('/', (req, res) => {
  const { category, status, search } = req.query;
  let products = Product.getAll();

  if (category) {
    products = products.filter(
      (p) => p.category.toLowerCase() === category.toLowerCase()
    );
  }
  if (status) {
    products = products.filter((p) => p.status === status);
  }
  if (search) {
    const q = search.toLowerCase();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
    );
  }

  res.json({ success: true, data: products, count: products.length });
});

// GET /api/products/stats - product statistics
router.get('/stats', (req, res) => {
  const stats = Product.getStats();
  res.json({ success: true, data: stats });
});

// GET /api/products/:id - get product by id
router.get('/:id', (req, res) => {
  const product = Product.getById(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  res.json({ success: true, data: product });
});

// POST /api/products - create product
router.post('/', (req, res) => {
  const { name, supplierId, supplierPrice, sellingPrice, category } = req.body;
  if (!name || !supplierId || supplierPrice == null || sellingPrice == null || !category) {
    return res.status(400).json({
      success: false,
      message: 'name, supplierId, supplierPrice, sellingPrice, and category are required',
    });
  }
  const product = Product.create(req.body);
  res.status(201).json({ success: true, data: product });
});

// PUT /api/products/:id - update product
router.put('/:id', (req, res) => {
  const product = Product.update(req.params.id, req.body);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  res.json({ success: true, data: product });
});

// DELETE /api/products/:id - delete product
router.delete('/:id', (req, res) => {
  const deleted = Product.remove(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  res.json({ success: true, message: 'Product deleted' });
});

// POST /api/products/:id/profit-calculator - calculate profit for a product
router.post('/:id/profit-calculator', (req, res) => {
  const product = Product.getById(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  const { shippingCost = 0, platformFee = 0, otherCosts = 0, estimatedSales = 30 } =
    req.body;
  const totalCost =
    product.supplierPrice + Number(shippingCost) + Number(platformFee) + Number(otherCosts);
  const netProfit = product.sellingPrice - totalCost;
  const marginPct = (netProfit / product.sellingPrice) * 100;
  const monthlyRevenue = product.sellingPrice * Number(estimatedSales);
  const monthlyProfit = netProfit * Number(estimatedSales);

  res.json({
    success: true,
    data: {
      productId: product.id,
      productName: product.name,
      sellingPrice: product.sellingPrice,
      totalCost: Math.round(totalCost * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      marginPct: Math.round(marginPct * 100) / 100,
      estimatedSales: Number(estimatedSales),
      monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
      monthlyProfit: Math.round(monthlyProfit * 100) / 100,
      breakEvenUnits: netProfit > 0 ? Math.ceil(totalCost / netProfit) : 0,
    },
  });
});

module.exports = router;
