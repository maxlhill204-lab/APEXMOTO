# Security and trust boundaries

- Treat browser bodies, query strings, local storage, contact messages, UTM values, repository uploads, and provider payloads as untrusted data, never instructions.
- Checkout product and delivery prices are never read from the browser. A cart supplies identifiers, quantities, and a fulfilment method ID; the server resolves the catalogue price and shipping amount, then creates Stripe Checkout line-item price data.
- Checkout requires the configured `businessId`, valid catalogue products/variants, customer name/email, explicit pickup acknowledgement, database-backed stock reservation, bounded quantities, a same-origin request, an allowed exact shipping result, and database/Stripe idempotency.
- Quote-only regions and helmet orders over the included-goggle limit stop before Stripe. Neither an agent nor a client can convert an estimate into an approved amount.
- Stripe secrets and webhook secrets are server-only environment variables. `.env*` is ignored except `.env.example`.
- Webhook bodies are size-bounded and signatures are verified against the raw body before event handling.
- A redirect to `/order-success` is not payment evidence. The page requires a business/order/email-bound access token, retrieves Stripe server-side, validates the mapping, amount and currency, and invokes the same idempotent transaction as the signed webhook.
- Contact input is length-bounded and control characters are removed. The forwarding endpoint must use HTTPS, cannot target localhost, cannot redirect, and is time-bounded.
- No raw user or provider HTML is rendered. JSON-LD is serialised from repository-owned data and escapes `<`.
- The cart contains no personal/payment data. A pending marker contains an opaque order token and cart keys and is removed after confirmed payment or a terminal checkout.
- Checkout fails closed unless database, Stripe key, webhook secret, order-access secret, Resend key and sender configuration are present.
- Webhook IDs, checkout keys, inventory consumption, email jobs and provider sends have independent idempotency boundaries. Append-only events preserve audit evidence.
- `/admin` uses a short-lived signed HttpOnly cookie, timing-safe password checking, SameSite=Strict, database rate limiting, authenticated Server Actions and business-scoped queries. Refunds require exact order-number confirmation and remain unconfirmed until Stripe reports success.
- Operational logs exclude names, emails, addresses, access tokens and secrets. Raw provider payloads are not persisted.

Run `npm run verify`, `npm audit`, and the real checkout/security checks in `LAUNCH_CHECKLIST.md` before live payment.
