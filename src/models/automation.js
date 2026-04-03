'use strict';

const { v4: uuidv4 } = require('uuid');
const { readData, writeData } = require('../db/database');

const FILE = 'automation_jobs.json';

const JOB_TYPES = {
  PRICE_MONITOR: 'price_monitor',
  STOCK_CHECK: 'stock_check',
  PROFIT_ANALYSIS: 'profit_analysis',
};

function getAll() {
  return readData(FILE);
}

function getById(id) {
  return getAll().find((j) => j.id === id) || null;
}

function create(data) {
  const jobs = getAll();
  const now = new Date().toISOString();
  const job = {
    id: `job-${uuidv4().split('-')[0]}`,
    ...data,
    status: 'pending',
    lastRun: null,
    nextRun: data.nextRun || null,
    results: [],
    createdAt: now,
    updatedAt: now,
  };
  jobs.push(job);
  writeData(FILE, jobs);
  return job;
}

function update(id, data) {
  const jobs = getAll();
  const index = jobs.findIndex((j) => j.id === id);
  if (index === -1) return null;
  jobs[index] = { ...jobs[index], ...data, updatedAt: new Date().toISOString() };
  writeData(FILE, jobs);
  return jobs[index];
}

function remove(id) {
  const jobs = getAll();
  const index = jobs.findIndex((j) => j.id === id);
  if (index === -1) return false;
  jobs.splice(index, 1);
  writeData(FILE, jobs);
  return true;
}

function runPriceMonitor(productId, products) {
  const product = products.find((p) => p.id === productId);
  if (!product) return { error: 'Product not found' };

  const simulatedNewPrice = product.supplierPrice * (0.9 + Math.random() * 0.2);
  const priceDiff = simulatedNewPrice - product.supplierPrice;
  const newMargin =
    ((product.sellingPrice - simulatedNewPrice) / product.sellingPrice) * 100;

  return {
    productId,
    productName: product.name,
    previousPrice: product.supplierPrice,
    currentPrice: Math.round(simulatedNewPrice * 100) / 100,
    priceDiff: Math.round(priceDiff * 100) / 100,
    newMargin: Math.round(newMargin * 100) / 100,
    alert:
      product.priceAlert && product.priceAlert.enabled && simulatedNewPrice > product.priceAlert.threshold,
    timestamp: new Date().toISOString(),
  };
}

function runStockCheck(productId, products) {
  const product = products.find((p) => p.id === productId);
  if (!product) return { error: 'Product not found' };

  const simulatedStock = Math.floor(Math.random() * 1000);
  const lowStock = simulatedStock < 50;

  return {
    productId,
    productName: product.name,
    previousStock: product.stock,
    currentStock: simulatedStock,
    lowStock,
    timestamp: new Date().toISOString(),
  };
}

function runProfitAnalysis(products) {
  return products.map((product) => {
    const grossProfit = product.sellingPrice - product.supplierPrice;
    const marginPct = (grossProfit / product.sellingPrice) * 100;
    const monthlyRevenue = product.sellingPrice * 30;
    const monthlyProfit = grossProfit * 30;

    return {
      productId: product.id,
      productName: product.name,
      supplierPrice: product.supplierPrice,
      sellingPrice: product.sellingPrice,
      grossProfit: Math.round(grossProfit * 100) / 100,
      marginPct: Math.round(marginPct * 100) / 100,
      estimatedMonthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
      estimatedMonthlyProfit: Math.round(monthlyProfit * 100) / 100,
    };
  });
}

module.exports = {
  JOB_TYPES,
  getAll,
  getById,
  create,
  update,
  remove,
  runPriceMonitor,
  runStockCheck,
  runProfitAnalysis,
};
