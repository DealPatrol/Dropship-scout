'use strict';

const { v4: uuidv4 } = require('uuid');
const { readData, writeData } = require('../db/database');

const FILE = 'suppliers.json';

function getAll() {
  return readData(FILE);
}

function getById(id) {
  return getAll().find((s) => s.id === id) || null;
}

function create(data) {
  const suppliers = getAll();
  const now = new Date().toISOString();
  const supplier = {
    id: `sup-${uuidv4().split('-')[0]}`,
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  suppliers.push(supplier);
  writeData(FILE, suppliers);
  return supplier;
}

function update(id, data) {
  const suppliers = getAll();
  const index = suppliers.findIndex((s) => s.id === id);
  if (index === -1) return null;
  suppliers[index] = { ...suppliers[index], ...data, updatedAt: new Date().toISOString() };
  writeData(FILE, suppliers);
  return suppliers[index];
}

function remove(id) {
  const suppliers = getAll();
  const index = suppliers.findIndex((s) => s.id === id);
  if (index === -1) return false;
  suppliers.splice(index, 1);
  writeData(FILE, suppliers);
  return true;
}

function getStats() {
  const suppliers = getAll();
  return {
    totalSuppliers: suppliers.length,
    activeSuppliers: suppliers.filter((s) => s.status === 'active').length,
    countries: [...new Set(suppliers.map((s) => s.country))],
  };
}

module.exports = { getAll, getById, create, update, remove, getStats };
