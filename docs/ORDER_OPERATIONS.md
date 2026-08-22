# Order operations

## Where the owner sees orders

Open `/admin` on the production site and sign in with `ADMIN_PASSWORD`. The order desk shows the customer name and email, exact product/variant, quantity, amount, Stripe-confirmed payment state, pickup date or shipping address, cancellation requests, and every customer/owner email attempt.

Do not fulfil from a Stripe payment row alone. The order desk is the fulfilment source of truth because it is populated only after a signed event is matched to the reserved order and exact amount/currency.

## Order lifecycle

1. The cart collects the order name/email and a server-approved fulfilment method.
2. The server atomically reserves the underlying physical SKUs and creates `PENDING_PAYMENT`.
3. Stripe Checkout receives immutable order metadata and expires with the stock reservation.
4. A signed paid event locks the order, verifies amount/currency, consumes the reservation exactly once, decrements physical inventory, records audit evidence, and enqueues the two confirmations.
5. The order return page invokes the same idempotent fulfilment logic as a latency fallback; it never trusts the redirect itself.
6. Customer and owner email jobs are unique in the database. Postmark is attempted first; Resend is the verified automatic fallback and receives a deterministic idempotency key. The daily protected outbox job is a recovery backstop, and the owner can explicitly reset and retry a failed job after correcting a provider issue.
7. Checkout expiration or asynchronous payment failure releases the reservation without decrementing stock.

## Fulfilment

- For pickup, do not tell the customer to travel until the collection time and private address are confirmed. `PICKUP_ADDRESS_PRIVATE` is included in transactional emails only.
- Mark `Preparing`, then `Ready for pickup` or `Shipped`. Ready/shipped states send the matching customer update.
- Mark `Completed` only when handed over or delivery is complete.
- Review the dashboard’s email state. `SENT` is provider acceptance, not proof the recipient opened the email.

## Cancellation and refund

The customer’s private link can create a cancellation request. It immediately sends an acknowledgement stating that no cancellation/refund has yet occurred and alerts the owner. Review fulfilment before acting.

The full-refund control requires the order number to be typed. It calls Stripe with an idempotency key; only a successful refund event changes the order to `REFUNDED` and sends the refund email. For partial or unusual refunds, use Stripe Dashboard and review the resulting webhook evidence.

## Failed email

The order desk lists kind, recipient, state, attempts, and the bounded provider error. Correct the Postmark/Resend or recipient issue first, then select `Retry failed emails`. Automatic retries obey `next_attempt_at`, back off from five minutes to multiple days, and stop after eight attempts. The authenticated owner control resets only failed jobs and makes one new bounded retry cycle possible.

## Stock adjustments

Inventory is held once per physical SKU. Bundles consume the same helmet and goggle SKUs as individual listings. Enter a physical recount as `stock on hand`; active checkout reservations remain visible separately. Every paid decrement and owner adjustment creates an inventory audit event.
