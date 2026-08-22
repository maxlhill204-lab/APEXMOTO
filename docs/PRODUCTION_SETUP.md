# Production setup gate

Checkout intentionally returns `CHECKOUT_NOT_READY` until all order, webhook and email dependencies are present. Complete these steps in test mode first, then repeat them with live-mode Stripe values.

## 1. Database

1. Add Neon Postgres through Vercel Marketplace or create a Neon project.
2. Set `DATABASE_URL` locally and for Vercel Production/Preview as appropriate.
3. Run `npm run db:migrate` against the intended database.
4. Sign in to `/admin`; the first load seeds the owner-confirmed physical SKU counts only when a SKU does not already exist.

## 2. Transactional email

1. Create an APEX MOTO Postmark server and verify `apexmoto.com.au` using its DKIM TXT and custom Return-Path CNAME records. Keep the transactional stream named `outbound`; the application disables open and link tracking.
2. Verify the same sender domain in Resend and publish its DKIM, `send` MX/SPF, and DMARC records. Resend is the automatic fallback when Postmark rejects or cannot accept a message.
3. Set `POSTMARK_SERVER_TOKEN`, `RESEND_API_KEY`, `ORDER_EMAIL_FROM`, and `STORE_ORDER_EMAIL` in Vercel. `ORDER_EMAIL_FROM` must use the verified domain; a Gmail address cannot be used as the sender identity.
4. Complete Postmark's manual account approval before relying on it for unrestricted recipients. Checkout can remain operational during review because the verified Resend fallback and Stripe's independent `receipt_email` are both configured.
5. Receive `max@apexmoto.com.au` through ImprovMX: root MX priorities 10/20 point to `mx1.improvmx.com` and `mx2.improvmx.com`, root SPF includes `spf.improvmx.com`, and the alias forwards to the store Gmail inbox.
6. Send provider-only tests, then complete a test-mode paid order and confirm both customer and store copies show `SENT` in `/admin`. Provider acceptance is not proof that a recipient opened the message.

## 3. Stripe

Create the endpoint `https://www.apexmoto.com.au/api/stripe/webhook` in the same Stripe mode as `STRIPE_SECRET_KEY`. Subscribe to:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`
- `refund.updated`

Set that endpoint’s signing secret as `STRIPE_WEBHOOK_SECRET`. Never reuse the Stripe API key as the webhook secret. Use a restricted server key where its permissions support Checkout Session retrieval/creation and refunds; keep all keys server-only.

Checkout Sessions set `allow_promotion_codes: true`. Signed fulfilment re-retrieves the Session, reconciles `subtotal + shipping − Stripe discount = amount paid`, and records the discount and promotion-code identifiers before allocating stock or emailing receipts.

## 4. Application secrets and owner access

Generate unrelated high-entropy values for `ORDER_ACCESS_SECRET`, `ADMIN_SESSION_SECRET`, and `CRON_SECRET`; each should be at least 32 characters. Set `ADMIN_PASSWORD` to exactly six digits and do not reuse any banking, device, or personal PIN. Set `PICKUP_ADDRESS_PRIVATE` to the exact collection address only if it is ready to be included in paid-order emails.

Vercel sends `CRON_SECRET` as a bearer credential to the daily email-outbox backstop. On Vercel Hobby, scheduled jobs cannot run more than once daily; signed Stripe webhook retries and the owner retry control provide the immediate recovery paths.

## 5. Evidence before live payments

Run the migration, deploy, complete one test pickup and one test delivery payment, inspect the database-backed order and both emails, verify the cart clears, replay the webhook to confirm no duplicate stock/email, expire an abandoned checkout, submit a cancellation, complete a test refund, and confirm a bad signature is rejected. Only then replace Stripe test values with live values and repeat one low-risk live verification.
