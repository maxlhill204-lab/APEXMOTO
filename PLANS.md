# APEX MOTO checkout reliability plan

## Objective

Ensure APEX MOTO cannot accept payment without a durable, owner-visible order, allocated stock, recorded fulfilment details and retryable customer/owner confirmation emails.

## Implemented scope

1. Neon Postgres schema/migrations for orders, immutable items, shared physical SKU inventory, checkout reservations, Stripe events, order/inventory audit events, email outbox, cancellation requests, store settings and owner login rate limiting.
2. Fail-closed checkout that collects name/email and explicit pickup acknowledgement, creates the order/reservation first, then opens server-priced Stripe Checkout with database and provider idempotency.
3. Signed Stripe payment/expiration/failure/refund handlers with exact order/amount/currency verification and exactly-once stock/email effects.
4. Detailed order-confirmation and private status/help journeys, confirmed-cart reconciliation, explicit cancellation acknowledgement, pickup availability and support-response expectations.
5. Postmark HTML and plain-text React Email templates for customer confirmation/status/refund and owner new-order/cancellation notifications, with durable five-attempt recovery and a protected daily backstop.
6. Protected owner order desk for customer/items/quantities/address/pickup, payment/order/email status, fulfilment actions, inventory adjustment, pickup settings, email retry and confirmed full refunds.
7. Security, operating, email and production-setup documentation plus unit/business-scope tests.

## Provider release boundary

Code completion does not prove production readiness. Production checkout stays disabled until Neon is activated and migrated; Postmark has a verified domain and working server token; the live Stripe endpoint and signing secret are deployed; and the owner saves a new private six-digit passcode in Vercel. Independent order/admin/cron secrets and the private pickup address are already stored in Vercel. A provider-backed pickup, delivery, duplicate-webhook, expiration, cancellation and refund journey must pass before live payments resume.

## Remaining verification

The full repository suite and PR 7 preview are verified. Complete the three owner-only provider handoffs, apply both Neon migrations, verify Postmark DNS/delivery and owner login, redeploy with the stored environment values, then promote and perform bounded production verification. Record provider status honestly in `SYSTEM_STATUS.json`.
