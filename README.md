# Dropship Scout

AI merchandising manager for dropshipping stores: discover best sellers, build a catalog, time your launches, and list products on your Shopify store with one click.

## Setup

1. Copy `.env.local.example` to `.env.local`
2. Set `DATABASE_URL` to any Postgres connection string — [Neon](https://neon.tech) has a generous free tier. Tables are created automatically on first request (see `schema.sql` for the full schema).
3. Set `AUTH_SECRET` to a long random string (`openssl rand -base64 32`)
4. Optional: set `ANTHROPIC_API_KEY` to enable AI product search and smarter catalog-builder prompts
5. `pnpm install && pnpm dev`
