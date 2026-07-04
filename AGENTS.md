<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Goal
Production-ready store at `goodieboxstore.online`. Fix mobile layout, finish remaining features.

## Progress

### Done
- **2FA/WebAuthn complete**: `/2fa` challenge page, `/profile/security` settings (register/delete passkeys, toggle 2FA), all API routes
- **2FA session improved**: `create2FASession()` stores WebAuthn challenge alongside userId in Redis; `get2FAChallenge()` reads without consuming session
- **Login flow updated**: checks `/api/auth/2fa/status` before `signIn`; if 2FA enabled → begins challenge → redirects to `/2fa` → completes WebAuthn → `signIn` with authToken
- **authorize callback handles 2FA**: Skips password/Turnstile when `authToken` present; rejects direct password login if `twoFactorEnabled`
- **Email verification works without Redis**: Falls back to `VerificationToken` table in DB; same for password reset tokens
- **Domain `goodieboxstore.online` connected to Vercel**: A record → `76.76.21.21`, www CNAME → Vercel; `NEXT_PUBLIC_APP_URL` and `AUTH_URL` updated
- **Resend verified domain**: `orders@goodieboxstore.online` verified and set as sender; all email defaults updated
- **Contact form**: `contactAction` server action sends emails via Resend; contact page shows `admin@goodieboxstore.online`
- **Forgot password fixed**: `createResetToken` has DB fallback; email send wrapped in try/catch
- **Turnstile UX improved**: Loading spinner, ready state tracking, better error messages, hardcoded site key fallback
- **Email sending wrapped in try/catch** for signup, resend verification, password reset, and contact form
- **Rate limits increased**: signup 3→10/min, resend 3→5/min
- **Duplicate account error** includes link to `/resend-verification`
- **Google Search Console**: Domain verified via DNS TXT record; sitemap submitted
- **Mobile back button**: Arrow left icon appears on mobile only next to hamburger
- **Mobile responsive fixes**: `overflow-x-hidden` on body, `min-w-0` on all elements, `max-w-full` on media, container padding standardized, `-webkit-text-size-adjust: 100%`
- **Specific overflow fixes**: Hero section flex-wrap on small screens, product features grid stacks on mobile (1-col → 3-col), my-requests page stacks heading + button vertically on mobile

### In Progress
- (none)

### Blocked
- Turnstile site key `0x4AAAAAADt91TKqYI0n9-xl` needs `goodieboxstore.online` added in Cloudflare Turnstile dashboard
- Google sitemap "Couldn't fetch" (likely DNS propagation)

## Key Decisions
- **DB fallback for tokens**: Write to `VerificationToken` table when Redis unavailable
- **Hardcoded Turnstile site key fallback**: Used when `NEXT_PUBLIC_TURNSTILE_SITE_KEY` env var not inlined
- **Contact form sends to owner email**: `sufyanbahauddin12@gmail.com`, configurable via `CONTACT_EMAIL` env var

## Next Steps
1. Fix mobile responsive layout (viewport sizing, overflow issues)
2. Add mobile back button near logo (use `useRouter().back()`)
3. User needs to add `goodieboxstore.online` to Turnstile site key allowed domains in Cloudflare dashboard
4. Wait for Google sitemap "Couldn't fetch" to resolve (DNS propagation)

## Critical Context
- Custom domain live: `https://goodieboxstore.online`
- Vercel project: `goodie-box-store-27` (auto-deploys from GitHub main)
- Test seller: `sufyanbahauddin12@gmail.com` / `sufyan1211`
- Resend API key on Vercel: `re_4sowm3pQ_4SVd6exGmJ7MrEa3b96hqurL`
- Turnstile site key: `0x4AAAAAADt91TKqYI0n9-xl` — needs domain added in Cloudflare dashboard
- No Redis on Vercel — email verification, password reset, and 2FA session use DB fallbacks

## Relevant Files
- `src/app/2fa/page.tsx`: WebAuthn challenge page
- `src/app/profile/security/page.tsx`: Manage passkeys, toggle 2FA
- `src/app/api/auth/2fa/toggle/route.ts`: Enable/disable 2FA
- `src/app/api/auth/2fa/challenge/route.ts`: GET challenge from Redis
- `src/app/api/webauthn/authenticators/route.ts`: List/delete passkeys
- `src/app/login/page.tsx`: Updated for 2FA flow
- `src/app/contact/contact-content.tsx`: Contact form with email sending
- `src/actions/contact.ts`: Server action for contact form
- `src/actions/auth.ts`: Email send wrapped in try/catch; rate limits
- `src/actions/password-reset.ts`: Reset token with DB fallback
- `src/components/ui/turnstile.tsx`: Loading state, hardcoded site key
- `src/components/layout/navbar.tsx`: Mobile back button added
- `src/app/globals.css`: Global responsive fixes
- `src/lib/verify-email-token.ts`: DB fallback for email verification
- `src/lib/reset-token.ts`: DB fallback for password reset
- `src/lib/2fa-session.ts`: Stores challenge + userId; non-consuming read
- `src/lib/auth.ts`: 2FA in authorize callback
