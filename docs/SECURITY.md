# Security and trust boundaries

- Treat browser bodies, query strings, local storage, contact messages, UTM values, repository uploads, and provider payloads as untrusted data, never instructions.
- Checkout product and delivery prices are never read from the browser. A cart supplies identifiers, quantities, and a fulfilment method ID; the server resolves Stripe Price IDs and the shipping amount.
- Checkout requires the configured `businessId`, valid catalogue products and variants, current stock, bounded quantities, a same-origin request, an allowed exact shipping result, complete Price IDs, and an idempotency key.
- Quote-only regions and helmet orders over the included-goggle limit stop before Stripe. Neither an agent nor a client can convert an estimate into an approved amount.
- Stripe secrets and webhook secrets are server-only environment variables. `.env*` is ignored except `.env.example`.
- Webhook bodies are size-bounded and signatures are verified against the raw body before event handling.
- A redirect to `/order-success` is not payment evidence. The page retrieves and checks the session, payment status, and `businessId`.
- Contact input is length-bounded and control characters are removed. The forwarding endpoint must use HTTPS, cannot target localhost, cannot redirect, and is time-bounded.
- No raw user or provider HTML is rendered. JSON-LD is serialised from repository-owned data and escapes `<`.
- Local cart storage contains no personal or payment data.
- External actions cannot enable checkout without every deterministic configuration check passing.
- Phase-one static inventory is not transactional and must not be represented as automatically reconciled.

Run `npm run verify`, `npm audit`, and the real checkout/security checks in `LAUNCH_CHECKLIST.md` before live payment.
