# Worldwide shipping runbook

## What the storefront now supports

The shipping migration is backwards compatible. Until every Australia Post setting below is valid, the live cart keeps the existing Australian pickup and delivery rules. When configuration is complete, the cart changes automatically to destination-based Australia Post quotes:

- Newport pickup remains free and appointment-only.
- Australian delivery uses the destination postcode plus the measured parcel dimensions and weight.
- Enabled international countries use the destination country plus the measured parcel weight.
- The customer selects a quoted Australia Post service and sees shipping and the final total before opening Stripe.
- Stripe is restricted to the country used for the quote and collects the full international address.
- The signed quote, carrier, service code, destination, parcel snapshot, shipping charge and customs snapshot are retained with the order.
- A country mismatch, or an Australian postcode mismatch, is flagged in the order desk and owner email before a label is purchased.

Quotes expire after 15 minutes and are cryptographically tied to the exact cart. Browser-supplied prices are never trusted.

## 1. Get the Australia Post rate API key

Use the Australia Post Developer Centre and register for the **Postage Assessment Calculator (PAC)**. PAC is the official API for standard domestic and overseas postage calculations and does not require an eParcel contract. Set the issued production key as `AUSPOST_PAC_API_KEY` in Vercel Production and Preview.

Do not paste the key into code, GitHub, a `NEXT_PUBLIC_` variable or a browser form. It is server-only.

The normal production base URL is `https://digitalapi.auspost.com.au`. `AUSPOST_PAC_BASE_URL` exists only so the official Australia Post test endpoint can be used during controlled testing.

## 2. Measure the real packages

Australia Post domestic pricing needs the packed parcel length, width, height and weight. International PAC pricing needs the packed weight. Measure the actual ready-to-mail packaging rather than the bare product or a manufacturer listing.

Record:

1. One helmet packed exactly as it will be mailed: weight in kilograms and outer length, width and height in centimetres.
2. One pair of goggles packed alone: weight and outer dimensions.
3. The extra weight added by each additional pair of goggles when they share a parcel.
4. The maximum number of goggles that genuinely fit in the measured goggles parcel.
5. Bare product weights for a helmet, goggles and the bundle helmet bag. These are used on customs declarations; they are separate from packaging weight.

Set the matching `AUSPOST_*_WEIGHT_KG` and dimension variables from `.env.example`. The current packing model creates one parcel per helmet, places up to three goggles into each measured helmet parcel, and splits remaining goggles into measured goggle parcels. It sums Australia Post postage across every parcel in the cart.

If the real packing method changes, update and re-test the measurements before shipping orders.

## 3. Enter verified customs facts

Australia Post requires electronic customs data for commercial international parcels. For the helmet, goggles and included helmet bag, enter:

- a specific description of the goods and material, at most 40 characters;
- the correct 6-12 digit HS tariff code selected through the MyPost Business/Australia Post lookup or confirmed by a customs professional;
- the two-letter country where the item was manufactured, not the country it ships from;
- a genuine declared value in cents for the included bag. The remainder of the paid bundle price is allocated proportionally between the helmet and goggles.

Set the `CUSTOMS_*` variables from `.env.example`. International shipping remains disabled if any customs value is missing or malformed. This is deliberate: the system will not invent a tariff code or country of origin.

After Stripe confirms a promotion discount, the stored customs merchandise values are reduced proportionally so the snapshot reflects the paid merchandise amount.

## 4. Add the quote-signing secret and destinations

Generate a new random secret of at least 32 characters for `SHIPPING_QUOTE_SECRET`. It must be unrelated to the admin password, Stripe credentials and other application secrets.

`AUSPOST_SHIPPING_COUNTRIES` is a comma-separated ISO alpha-2 allow-list. The default prioritises Australia, New Zealand, the United Kingdom, Germany, major European destinations, the United States, Canada, Japan and Singapore. To add a country later:

1. Confirm Australia Post currently offers a parcel service to it and review destination restrictions.
2. Confirm Stripe Checkout accepts its ISO country code.
3. Add the two-letter code to `AUSPOST_SHIPPING_COUNTRIES`.
4. Redeploy and run a quote plus test-mode Checkout for that country.

## 5. Migrate and deploy

Run `npm run db:migrate` with the production Neon `DATABASE_URL`. Migration `0003_worldwide_shipping.sql` adds shipping carrier/service/destination, parcel, customs, address-review, tracking and future label fields without changing existing order or refund records.

Add the variables in Vercel, deploy a preview, and test:

1. Newport pickup.
2. Australian metro postcode.
3. Australian regional postcode.
4. New Zealand.
5. United Kingdom.
6. Germany.
7. One multi-parcel cart.
8. A changed cart after quoting (must require a new quote).
9. An expired quote.
10. A Stripe country/address mismatch (must flag the order for review).

Only promote the same tested preview artifact to production.

## MyPost Business labels and the direct API boundary

A MyPost Business account can create and pay for international labels in the MyPost Business portal, including the customs declaration. The order desk now retains the address, selected Australia Post service, parcel facts and customs lines needed for that process.

Australia Post's **Shipping & Tracking API** can automate contract rates, shipments, labels, tracking and landed-cost estimates, but Australia Post states that it is only available to eligible parcel-contract customers. A normal MyPost Business login is not enough.

For direct automatic labels, APEX MOTO would need to obtain and provide:

1. An eligible Australia Post eParcel contract or StarTrack parcel contract.
2. The Australia Post charge account number (10 digits, left-padded with zeroes where required).
3. The Australia Post Merchant Location ID (MLID), or StarTrack Despatch ID.
4. Australia Post Shipping & Tracking test-bed approval.
5. The test-bed API key, account number and API password.
6. Successful test integration and Australia Post technical validation.
7. A production API invitation, production API key and secret/password.

Until those exist, labels must be created in MyPost Business manually. The storefront must not call the contract label endpoints with a PAC key: they are different products and credentials.

## Customs and duties policy

The checkout copy states that postage does not include destination customs duties, taxes or import fees and that the receiver may need to pay them. Do not advertise duties-paid delivery unless APEX MOTO deliberately integrates and pays a supported landed-cost service.
