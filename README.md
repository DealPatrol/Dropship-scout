# Dropship Scout 🔍

Dropshipping automation platform — scout profitable products, manage suppliers, and automate monitoring.

## Features

- **📊 Dashboard** — Key metrics: total products, active suppliers, estimated monthly revenue & profit, average margin
- **🔍 Product Scout** — Profit analysis ranked by margin percentage with visual progress bars
- **📦 Products** — Full CRUD, category/search filters, per-product profit calculator
- **🏭 Suppliers** — Manage supplier partners with ratings, shipping times and categories
- **⚡ Automation** — Create jobs for price monitoring, stock checks, and profit analysis; run on demand

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express |
| Data | JSON file store (`data/`) |
| Frontend | Vanilla HTML + CSS + JS (dark-theme SPA) |
| Tests | Jest + Supertest |

## Getting Started

```bash
npm install
npm start        # production — http://localhost:3000
npm run dev      # development with auto-reload (nodemon)
npm test         # run test suite
```

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET/POST | `/api/products` | List / create products |
| GET/PUT/DELETE | `/api/products/:id` | Read / update / delete |
| POST | `/api/products/:id/profit-calculator` | Per-product profit calculation |
| GET | `/api/products/stats` | Product statistics |
| GET/POST | `/api/suppliers` | List / create suppliers |
| GET/PUT/DELETE | `/api/suppliers/:id` | Read / update / delete |
| GET | `/api/suppliers/stats` | Supplier statistics |
| GET/POST | `/api/automation/jobs` | List / create automation jobs |
| GET/PUT/DELETE | `/api/automation/jobs/:id` | Read / update / delete |
| POST | `/api/automation/run/price-monitor` | Run price check for a product |
| POST | `/api/automation/run/stock-check` | Run stock check for a product |
| GET | `/api/automation/run/profit-analysis` | Run profit analysis on all products |
| GET | `/api/automation/dashboard` | Dashboard aggregate data |
