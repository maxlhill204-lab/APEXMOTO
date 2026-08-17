# APEX MOTO implementation plan

## Objective

Deliver a launch-ready, mobile-first APEX MOTO storefront for the supplied ORZ helmets and goggles. Keep the buying journey short, show current variant stock clearly, apply the owner-supplied delivery rules, and remain honest when payment or business-policy configuration is incomplete.

## Completed product scope

1. Production Next.js foundation, central APEX MOTO configuration, validated catalogue, and repository evidence records.
2. Black-and-gold responsive design using the supplied logo, helmet, goggles, product-sheet, and helmet-bag imagery.
3. Shop filters, product galleries, image-matched colour selection, exact size stock, persistent cart, bundle variants, and destination shipping selection.
4. Deterministic checkout controls for origin, `businessId`, product/variant stock, server-owned catalogue prices, delivery method, destination rate, goggle-with-helmet limit, and idempotency.
5. Size, shipping, returns, helmet information, FAQ, contact, privacy, terms, order-state, sitemap, robots, and error experiences.
6. Lint, typecheck, automated tests, production build, content audit, route sweep, and responsive browser QA.

## Release boundary

The initial release uses repository-managed inventory. Stripe Checkout is available only after a protected server credential is configured. Stripe line-item prices are created from the validated server catalogue, never from browser input. There is no customer account, order database, or transactional inventory decrement in phase one.

## Owner launch gate

Before taking real orders, complete `LAUNCH_CHECKLIST.md`. The remaining important decisions are exact goggle quantities, the inferred white Medium quantity, final returns/exchange terms, tracking and processing expectations, legal identity where applicable, Stripe test evidence, final-domain configuration, and real-device/cross-browser checks.
