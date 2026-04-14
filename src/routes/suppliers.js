'use strict';

const express = require('express');
const router = express.Router();
const Supplier = require('../models/supplier');

// GET /api/suppliers - list all suppliers
router.get('/', (req, res) => {
  const { country, status, search } = req.query;
  let suppliers = Supplier.getAll();

  if (country) {
    suppliers = suppliers.filter(
      (s) => s.country.toLowerCase() === country.toLowerCase()
    );
  }
  if (status) {
    suppliers = suppliers.filter((s) => s.status === status);
  }
  if (search) {
    const q = search.toLowerCase();
    suppliers = suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.country.toLowerCase().includes(q) ||
        (s.categories && s.categories.some((c) => c.toLowerCase().includes(q)))
    );
  }

  res.json({ success: true, data: suppliers, count: suppliers.length });
});

// GET /api/suppliers/stats - supplier statistics
router.get('/stats', (req, res) => {
  const stats = Supplier.getStats();
  res.json({ success: true, data: stats });
});

// GET /api/suppliers/:id - get supplier by id
router.get('/:id', (req, res) => {
  const supplier = Supplier.getById(req.params.id);
  if (!supplier) {
    return res.status(404).json({ success: false, message: 'Supplier not found' });
  }
  res.json({ success: true, data: supplier });
});

// POST /api/suppliers - create supplier
router.post('/', (req, res) => {
  const { name, country } = req.body;
  if (!name || !country) {
    return res.status(400).json({
      success: false,
      message: 'name and country are required',
    });
  }
  const supplier = Supplier.create(req.body);
  res.status(201).json({ success: true, data: supplier });
});

// PUT /api/suppliers/:id - update supplier
router.put('/:id', (req, res) => {
  const supplier = Supplier.update(req.params.id, req.body);
  if (!supplier) {
    return res.status(404).json({ success: false, message: 'Supplier not found' });
  }
  res.json({ success: true, data: supplier });
});

// DELETE /api/suppliers/:id - delete supplier
router.delete('/:id', (req, res) => {
  const deleted = Supplier.remove(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Supplier not found' });
  }
  res.json({ success: true, message: 'Supplier deleted' });
});

module.exports = router;
