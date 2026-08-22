# Transactional email rules

| Trigger | Customer email | Owner email | Idempotency |
| --- | --- | --- | --- |
| Stripe confirms exact paid order | Receipt, items/variants/quantities, total, fulfilment, next step, private status link | Same order plus customer contact and fulfilment | one job per order/kind/recipient; provider key uses business/order/kind |
| Customer requests cancellation | Request received; explicitly not yet cancelled/refunded | Action-required cancellation alert | one open request and one email of each kind |
| Owner marks ready for pickup | Pickup date/window/location and status link | none | one ready email per order |
| Owner marks shipped | Shipped status and help route | none | one shipped email per order |
| Stripe confirms full refund | Refund confirmed and bank timing note | visible in owner order desk/Stripe | one refund email per order |

All messages reply to `apexmotostore.au@gmail.com` and state the normal 12–48 hour support window. The live `ORDER_EMAIL_FROM` must use a Postmark-verified domain. Postmark open and link tracking are disabled for these operational messages. The exact private pickup address is used only when `PICKUP_ADDRESS_PRIVATE` is configured; otherwise the email truthfully says it will be supplied with the confirmed appointment.

No marketing email, review request, cart-abandonment email, or fabricated delivery estimate is sent by this system.
