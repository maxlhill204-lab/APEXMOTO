# APEX MOTO checkout reliability plan

## Objective

Ensure APEX MOTO cannot accept payment without a durable, owner-visible order, allocated stock, recorded fulfilment details and retryable customer/owner confirmation emails.

## Implemented scope

1. Neon Postgres schema/migrations for orders, immutable items, shared physical SKU inventory, checkout reservations, Stripe events, order/inventory audit events, email outbox, cancellation requests, store settings and owner login rate limiting.
2. Fail-closed checkout that collects name/email and explicit pickup acknowledgement, creates the order/reservation first, then opens server-priced Stripe Checkout with database and provider idempotency.
3. Signed Stripe payment/expiration/failure/refund handlers with exact order/amount/currency verification and exactly-once stock/email effects.
4. Detailed order-confirmation and private status/help journeys, confirmed-cart reconciliation, explicit cancellation acknowledgement, pickup availability and support-response expectations.
5. Resend React Email templates for customer confirmation/status/refund and owner new-order/cancellation notifications, with durable five-attempt recovery and a protected daily backstop.
6. Protected owner order desk for customer/items/quantities/address/pickup, payment/order/email status, fulfilment actions, inventory adjustment, pickup settings, email retry and confirmed full refunds.
7. Security, operating, email and production-setup documentation plus unit/business-scope tests.

## Provider release boundary

Code completion does not prove production readiness. Production checkout stays disabled until Neon is provisioned and migrated; Resend has a verified sender; the live Stripe endpoint and signing secret are installed; and independent order/admin/cron secrets exist in Vercel. A deployed test-mode pickup, delivery, duplicate-webhook, expiration, cancellation and refund journey must pass before live payments resume.

## Remaining verification

Run the full repository checks and local browser story, deploy a preview, configure providers, run provider-backed test-mode evidence, then promote and repeat one bounded production verification. Record provider status honestly in `SYSTEM_STATUS.json`.
