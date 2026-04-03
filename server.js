'use strict';

const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const productsRouter = require('./src/routes/products');
const suppliersRouter = require('./src/routes/suppliers');
const automationRouter = require('./src/routes/automation');

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(limiter);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/products', productsRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/automation', automationRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Dropship Scout',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Serve the frontend for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Only start the server if this file is run directly (not in tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Dropship Scout running at http://localhost:${PORT}`);
  });
}

module.exports = app;
