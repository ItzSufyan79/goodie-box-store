<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Goal
Production-ready e-commerce store at `goodieboxstore.online` with size variants, per-size pricing, order delay management, admin product management, customer self-service, returns, and shipping integration.

## Constraints & Preferences
- Mobile back button only visible on mobile (near logo)
- Favicon: `public/favicon.ico`, `public/favicon.png`, `/icon.png` (210×210 PNG from `src/app/icon.png`)
- Instagram handle: `goodieboxstore.27`
- Products max ~1 kg, max 10in (25cm), worst case 1.5 kg
- Box dimensions: 25×20×10cm (≈10×8×4in)
- Origin pincode: Ahmedabad **380055**
- Delivery options: Urgent (1–2d, ₹99), Standard (3–4d, **₹59**, free ≥₹1,499), Flexible (choose date, ₹149)
- Delhivery API base: `https://track.delhivery.com`; waybill auth uses `?token=` query param (GET); shipment creation uses `Authorization: Token` header + form-encoded body (`format=json&data=<json>`); pincode check uses `Authorization: Token` header
- No Redis on Vercel — 2FA sessions, email verification, password reset use DB fallbacks
- Hobby plan: max 1 cron job per day (set to 6am daily) — handles abandoned carts + low stock + back-in-stock notifications
- COD fee: ₹30 added to total when customer selects COD
- Cart unique constraint removed — same product can have multiple cart items with different customizations + size variants
- Tailwind v4: requires `@custom-variant dark (&:where(.dark, .dark *))` for class-based dark mode to work
- Pickup location on Delhivery: "Goodie Box Store" (Ahmedabad, Gujarat) — set via `PICKUP_NAME` env var

## Progress

### Done
- **Admin Products Page** (`/admin/products`): table with search (title/brand/seller), pagination, toggle active/featured, delete, view/edit links.
- **Product Sizes with per-size pricing**: `ProductSize` model (label + price per variant). Seller adds/removes sizes in new/edit product forms. `SizeSelector` grid updates displayed price. `sizeId` on CartItem + OrderItem.
- **Customizable products now visible in normal listings**: Removed `isCustomizable: false` filter from `getProductsAction`.
- **Product-level customization delay fields** (optional): `customizationDelay` + `customizationDelayReason` on Product. Amber notice shown on product page.
- **Order-level delay system**: `DELAYED` status, `delayReason` + `delayedAt` + `revisedDeliveryDate` on Order. `delayOrderAction(orderId, reason, revisedDate?)` seller modal. Resume clears delay fields. Customer sees amber banner.
- **Contact form stored in DB**: `contactAction` creates `ContactMessage` before emailing.
- **Admin contact inbox** (`/admin/contacts`): list with read/unread, detail view with inline reply via Resend from `admin@goodieboxstore.online`.
- **Newsletter signup**: `NewsletterSubscriber` model, `subscribeNewsletterAction`, embed form in footer, confirmation email.
- **Stock notifications**: `StockNotification` model, "Notify me when back in stock" form on out-of-stock products, cron sends `sendStockBackInStockEmail`.
- **Customer self-cancellation**: `cancelOrderByCustomerAction` on `/orders/[id]` — for PENDING orders, marks CANCELLED + REFUNDED if paid.
- **Structured data**: JSON-LD `Product` on product pages (price, availability, aggregateRating, brand), `Organization` + `WebSite` (with `SearchAction`) in root layout, `BreadcrumbList` on product pages.
- **Recently viewed + social share + scroll progress + sticky mobile add-to-cart bar**: All implemented.
- **Admin order filters**: payment status, provider, date range, delayed status pill.
- **WhatsApp button**: `bottom-20 md:bottom-6` to clear sticky bar.
- **COD fee (₹30)**: `COD_FEE = 30` in `src/actions/orders.ts`.
- **Admin revenue chart + 4 insight cards**: `getAdminStatsAction` returns chart data; dashboard shows pending actions, payment breakdown, low-stock alerts, recent signups.
- **2FA**: Full WebAuthn flow, DB fallback (`TwoFactorSession` model).
- **Seller customization field builder**: `CustomProductField` model; `ProductCustomizer` validates and passes to add-to-cart.
- **Cart/Order display customizations**: Shown in `CartItemsList` and `order-detail-client.tsx`.
- **Favicon at root**: `public/favicon.ico`, `public/favicon.png`, `public/icon.png` added. Explicit `icons` metadata and `<link rel="icon" href="/favicon.ico">` in head.
- **Skeleton shimmer**: Changed to CSS variables (dark mode support), pendulum `ease-in-out` animation, 2s duration, dimmer tones. `SkeletonCard` updated to use `.skeleton` class.
- **Sticky bar price**: Now shows `displayPrice * quantity` (total, not per-unit).
- **7-Day Money-Back Guarantee + Returns System**: `ReturnRequest` model + `ReturnStatus` enum. `POST /api/orders/return` with 7-day window check. `MoneyBackBadge` on product cards, product page, cart, checkout. `/returns` policy page. Customer return request with reason textarea on order detail page. Admin returns dashboard (`/admin/returns`) with approve/reject/refund workflow. Returns link in admin quick links and footer. `Textarea` UI component created. `src/actions/returns.ts` server actions.
- **Shipping standardised at ₹59**: Cart page, checkout `DELIVERY_OPTIONS`, shipping policy, homepage, product page, and terms page all use ₹59 standard rate with free shipping above ₹1,499.
- **Required customizations block Add to Cart**: Main CTA and sticky mobile bar both hide (show message instead) when product has required custom fields not yet filled.
- **Delhivery API integration fixed**: Waybill generation returns bare JSON string — parser now handles it. Shipment creation uses `Authorization: Token` header + form-encoded `format=json&data=<json>` body (was `?token=` + JSON body). Pickup location name set to "Goodie Box Store" matching portal. `.env` files updated with `PICKUP_*` vars.

### In Progress
- (none)

### Blocked
- Delhivery create shipment needs prepaid balance — add funds at one.delhivery.com
- Google sitemap "Couldn't fetch" (likely DNS propagation)
- Shiprocket — deferred indefinitely (GST certificate required for KYC)
- Turnstile site key `0x4AAAAAADt91TKqYI0n9-xl` needs `goodieboxstore.online` added in Cloudflare Turnstile dashboard

## Key Decisions
- **Delhivery auth**: GET requests (waybill) use `?token=` query param; POST requests (create shipment) use `Authorization: Token` header + form-encoded `format=json&data=<json>` body; pincode check uses `Authorization: Token` header
- **Product sizes**: `ProductSize` model with per-variant price. Overrides base product price everywhere.
- **Two-tier delay**: Product-level `customizationDelay` = upfront info. Order-level `delayOrderAction` = real-time status.
- **Customizable products now visible**: Removed hidden filter.
- **COD fee**: ₹30 constant, applied at order creation.
- **Customization fields**: Seller-defined questions in `CustomProductField` table, answers as JSON.
- **Cart unique constraint removed**: Allows same product with different customizations/sizes.
- **Admin dashboard cards**: Actionable insight cards replaced generic "Recent Orders".
- **No Redis**: DB fallbacks for 2FA sessions, tokens, cache.
- **Vercel Cron**: Single daily cron (6am) merged abandoned carts + low-stock + back-in-stock.
- **New models pushed via `prisma db push`**: `ContactMessage`, `NewsletterSubscriber`, `StockNotification`, `ReturnRequest`, `revisedDeliveryDate` — no separate migration files.
- **Tailwind v4 dark mode**: Added `@custom-variant dark (&:where(.dark, .dark *))` so `dark:*` utilities activate with `.dark` class, matching the theme toggle.

## Next Steps
1. Add prepaid balance to Delhivery account at one.delhivery.com and test a real shipment
2. Set `PICKUP_NAME`, `PICKUP_ADDRESS`, `PICKUP_CITY`, `PICKUP_STATE`, `PICKUP_PHONE` in Vercel env vars (already in `.env`/`.env.local`)
3. Seed reviews / social proof ("1,200+ happy customers") on homepage
4. Monitor Google sitemap fetch + request re-indexing in Search Console
5. User creates products and starts selling

## Critical Context
- Custom domain: `https://goodieboxstore.online`
- Vercel project: `goodie-box-store-27` (auto-deploys from GitHub main)
- Admin: `sufyan.at.work.with.web@gmail.com` / `SufyanAdmin1211`
- Test seller: `sufyanbahauddin12@gmail.com` / `sufyan1211`
- Test user: `sufyanawebs@gmail.com` / `sufyan1211`
- Delhivery API key: `dc30a777570921ac8e368917090029c226f1d1a1` (live token)
- Razorpay live keys (`rzp_live_*`); webhook secret `sufyan1211`
- Cloudflare Email Routing: `admin@goodieboxstore.online` → Gmail
- Resend from: `orders@goodieboxstore.online`; admin replies from `admin@goodieboxstore.online`
- WhatsApp: `+91 8320895174`
- Pickup location: "Goodie Box Store" (Ahmedabad, Gujarat, 380055)
- PaymentProvider default: `RAZORPAY`
- No Redis on Vercel — 2FA sessions, tokens, cache fall back to DB
- CI: Lint & Type Check + Security Audit only (build removed)
- COD fee: ₹30 constant (`COD_FEE`), applied in `src/actions/orders.ts`

## Relevant Files
- `src/lib/delhivery.ts`: Waybill generation (GET + `?token=`), shipment creation (POST + `Authorization: Token` + form-encoded body), pincode check, tracking, rate calc with manual fallback
- `.env`, `.env.local`: `PICKUP_NAME`, `PICKUP_ADDRESS`, `PICKUP_CITY`, `PICKUP_STATE`, `PICKUP_PHONE` env vars
- `prisma/schema.prisma`: All product, order, return, contact, newsletter models
- `src/app/globals.css`: `.skeleton` animation (CSS vars, pendulum ease-in-out, 2s), `@custom-variant dark`
- `src/components/ui/money-back-badge.tsx`: ShieldCheck icon + "7-Day Money-Back Guarantee"
- `src/actions/returns.ts`: `getReturnRequestsAction`, `updateReturnRequestAction`
- `src/app/api/orders/return/route.ts`: POST endpoint for return creation
- `src/components/products/product-customizer.tsx`: Sticky bar with `displayPrice * quantity`, required fields blocking
