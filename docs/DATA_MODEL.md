# Data model

## Product

A product belongs to one `businessId` and has a unique `id` and `slug`, category, supported descriptions, price in whole cents, image records, option definitions, and concrete variants. Optional features, specifications, box contents, certification evidence, SEO copy, related products, and bundle components render only when configured.

## Variant

Every variant has a unique `id`, exactly one value for every product option, a non-negative catalogue stock seed, and one or more `{ sku, quantity }` physical inventory requirements. Bundles consume their helmet and goggle SKUs instead of maintaining duplicate stock.

## Product image

Each image has a public source, factual alt text, real dimensions, and an optional colour label. A matching option label switches the gallery to that image. The bundle lead visual is assembled in the UI from the supplied helmet, goggles, and bag files without changing the underlying catalogue evidence.

## Certification

Certification contains an optional standard, approval number, verification state, and documentation URL. A `verified: true` record without a standard fails catalogue validation. The APEX MOTO record is based on the owner statement and visible rear product label; customer-facing wording explicitly avoids treating that marking as proof of Australian road legality.

## Cart item

`{ businessId, productId, variantId, quantity }`. No browser price or shipping price is stored. Resolution against the server catalogue produces display data and line totals. Personal information is collected only at final review and sent to the durable order record.

## Fulfilment selection

`shippingMethodId` identifies pickup, goggles-only Australia-wide delivery, or a configured helmet destination. It never contains a price. `calculateShipping` combines the selected method with resolved items and returns either one exact server amount or a quote-required state.

## Size chart

Product-specific chart with manufacturer, verification flag, and centimetre rows. The APEX MOTO Rally chart is transcribed from the owner-supplied product sheet and applies to the listed colour variants of that helmet.

## Operational tables

- `store_settings`: public pickup availability/location disclosure/date/window and support expectation.
- `inventory`: physical stock on hand by business/SKU.
- `inventory_reservations`: `ACTIVE`, `CONSUMED` or `RELEASED` quantities tied to an order.
- `inventory_events`: append-only paid decrements and owner adjustments.
- `orders`: customer, fulfilment, subtotal/shipping/discount/paid totals, promotion-code and payment-method display evidence, explicit order/payment states, Stripe IDs and reservation deadline.
- `order_items`: immutable product/variant/name/price/quantity/cart-key snapshot.
- `order_events`: append-only checkout/payment/status/cancellation/refund evidence.
- `webhook_events`: unique provider event and processing state.
- `email_outbox`: unique order/kind/recipient, bounded attempts and provider evidence.
- `cancellation_requests`: one open request per order and its outcome.
- `admin_login_attempts`: business-scoped hashed network identifier, result and time.
- `schema_migrations`: applied SQL migration versions.

All monetary values are integer cents, operational queries are scoped by `businessId`, and reviewed migrations live in `db/migrations`.
