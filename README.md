# Goodie Box Store

A production-ready B2C e-commerce platform for curated gift boxes, college essentials, snacks, and custom product requests. Built with Next.js 15+, TypeScript, Prisma, and a modern integrations stack.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 4 + Radix UI |
| Database | Neon PostgreSQL + Prisma ORM |
| Auth | NextAuth.js (Auth.js v5) — JWT sessions |
| Search | Algolia |
| Cache | Upstash Redis |
| Images | Cloudinary CDN |
| Payments | Razorpay + Stripe + mock fallback |
| Real-time | Pusher |
| State | TanStack Query + Zustand |
| Forms | React Hook Form + Zod |
| Charts | Recharts |

## Getting Started

### 1. Clone & Install

```bash
cd goodie-box-store
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

For local development, only `DATABASE_URL` and `AUTH_SECRET` are required. Set `PAYMENT_MODE=mock` to skip payment provider setup.

Generate an auth secret:

```bash
openssl rand -base64 32
```

### 3. Database Setup (Neon)

1. Create a free database at [neon.tech](https://neon.tech)
2. Copy the connection string to `DATABASE_URL`
3. Push schema and seed:

```bash
npm run db:push
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Seed Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@goodiebox.com | admin123 |
| Seller | sufyanbahauddin12@gmail.com | sufyan1211 |
| Customer | customer@goodiebox.com | customer123 |

## Project Structure

```
src/
├── actions/          # Server Actions (cart, orders, products, auth)
├── app/              # App Router pages
│   ├── admin/        # Admin dashboard
│   ├── seller/       # Seller workspace
│   ├── products/     # PLP & PDP
│   ├── cart/         # Shopping cart
│   ├── checkout/     # Multi-step checkout
│   └── api/          # API routes (payments, algolia sync)
├── components/       # UI components
│   ├── ui/           # Shadcn-style primitives
│   ├── layout/       # Navbar, Footer
│   ├── products/     # ProductCard, ReviewForm
│   └── checkout/     # Checkout flow
├── lib/              # Utilities (db, auth, redis, algolia, payments)
├── store/            # Zustand client state
└── middleware.ts     # RBAC route protection
```

## Features

### Customer
- Algolia-powered search with filters
- Product discovery, wishlist, cart
- Multi-step checkout with Zod validation
- Order tracking with real-time updates
- Custom gift box requests
- Curated collections / gift guides

### Seller
- Dashboard with sales metrics
- Product CRUD management
- Order fulfillment workflow
- Inventory tracking

### Admin
- Global metrics dashboard
- Revenue charts (Recharts)
- User and order oversight
- Custom request moderation

## Integrations Setup

### Algolia
1. Create an index named `products`
2. Set `NEXT_PUBLIC_ALGOLIA_*` and `ALGOLIA_ADMIN_KEY`
3. Sync products: `POST /api/algolia/sync` with `Authorization: Bearer <ALGOLIA_SYNC_SECRET>`

### Cloudinary
Set `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

### Upstash Redis
Create a database at [upstash.com](https://upstash.com) and set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`

### Payments
- **Razorpay**: Set `PAYMENT_MODE=razorpay` and Razorpay keys
- **Stripe**: Set `PAYMENT_MODE=stripe` and Stripe keys
- **Mock**: Set `PAYMENT_MODE=mock` (default for local dev)

### Pusher
Set Pusher credentials for real-time order updates and price drop alerts

## Deployment (Vercel + Neon)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add all environment variables from `.env.example`
4. Connect Neon database — use the pooled connection string for `DATABASE_URL`
5. Deploy — Vercel runs `prisma generate` via postinstall
6. Run seed against production DB once: `npm run db:seed`

### Post-Deploy Checklist
- [ ] Set `AUTH_SECRET` and `NEXTAUTH_URL` to production URL
- [ ] Run database migrations
- [ ] Sync Algolia index
- [ ] Configure Razorpay/Stripe webhooks
- [ ] Set up Sentry DSN and PostHog key for monitoring
- [ ] Verify PWA manifest icons exist in `/public/icons/`

## PWA

The app includes a web manifest at `/manifest.json`. Add icon files to `/public/icons/` (192x192 and 512x512) for installability.

## License

Private — All rights reserved.
