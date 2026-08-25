ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_carrier text,
  ADD COLUMN IF NOT EXISTS shipping_service_code text,
  ADD COLUMN IF NOT EXISTS shipping_destination_country text,
  ADD COLUMN IF NOT EXISTS shipping_destination_postal_code text,
  ADD COLUMN IF NOT EXISTS shipping_quote_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS shipping_parcels jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS customs_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS shipping_address_review boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS shipping_provider_shipment_id text,
  ADD COLUMN IF NOT EXISTS shipping_tracking_number text,
  ADD COLUMN IF NOT EXISTS shipping_label_url text;

CREATE INDEX IF NOT EXISTS orders_shipping_destination_idx
  ON orders (business_id, shipping_destination_country, created_at DESC);

CREATE INDEX IF NOT EXISTS orders_shipping_review_idx
  ON orders (business_id, shipping_address_review, created_at DESC)
  WHERE shipping_address_review = true;
