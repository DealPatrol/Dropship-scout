'use strict';

const { v4: uuidv4 } = require('uuid');
const { readData, writeData } = require('../db/database');

const FILE = 'products.json';

function getAll() {
  return readData(FILE);
}

function getById(id) {
  return getAll().find((p) => p.id === id) || null;
}

function create(data) {
  const products = getAll();
  const now = new Date().toISOString();
  const product = {
    id: `prod-${uuidv4().split('-')[0]}`,
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  products.push(product);
  writeData(FILE, products);
  return product;
}

function update(id, data) {
  const products = getAll();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) return null;
  products[index] = { ...products[index], ...data, updatedAt: new Date().toISOString() };
  writeData(FILE, products);
  return products[index];
}

function remove(id) {
  const products = getAll();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) return false;
  products.splice(index, 1);
  writeData(FILE, products);
  return true;
}

function getStats() {
  const products = getAll();
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.status === 'active').length;
  const automatedProducts = products.filter((p) => p.automate).length;
  const totalInventoryValue = products.reduce(
    (sum, p) => sum + p.supplierPrice * p.stock,
    0
  );
  const avgProfitMargin =
    products.length > 0
      ? products.reduce((sum, p) => {
          const margin = ((p.sellingPrice - p.supplierPrice) / p.sellingPrice) * 100;
          return sum + margin;
        }, 0) / products.length
      : 0;

  return {
    totalProducts,
    activeProducts,
    automatedProducts,
    totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
    avgProfitMargin: Math.round(avgProfitMargin * 100) / 100,
  };
}

module.exports = { getAll, getById, create, update, remove, getStats };
