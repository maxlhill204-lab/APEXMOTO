# APEX MOTO quick edit guide

## Change a price

File: `src/data/products.ts`  
Field: `price` in cents. Example: `12495` = $124.95 AUD. Update the matching Stripe Price at the same time.

## Change stock

File: `src/data/products.ts`  
Change the exact variant’s `stock`. Also update bundle combinations that use the same physical stock.

## Add or replace a product photo

Folder: `public/products/<product-folder>/`  
Then update the product’s `images` array in `src/data/products.ts`, including the real dimensions, alt text, and colour label when applicable.

## Add a new helmet

File: `src/data/products.ts`  
Copy an existing helmet object and change its unique `id`, `slug`, name, price, images, options, variants, and exact stock.

## Change business or contact details

File: `src/config/site.ts`  
Edit `businessName`, `tagline`, `email`, `phone`, `instagramUrl`, or `facebookUrl`.

## Change pickup location

File: `src/config/site.ts`  
Edit `pickupSuburb`, `city`, and `state`. Do not publish a residential street address.

## Change shipping prices

File: `src/config/site.ts`  
Edit `helmetShippingRegions`, `gogglesShippingPrice`, or `maxIncludedGogglesWithHelmet`. Prices are cents; use `null` plus `quoteRequired: true` for address-based quotes.

## Check any edit

Run `npm run verify`, then check the changed product and cart at a phone-sized width.
