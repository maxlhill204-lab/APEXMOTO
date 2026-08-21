CREATE TABLE IF NOT EXISTS schema_migrations (
  version text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS store_settings (
  business_id text PRIMARY KEY,
  pickup_enabled boolean NOT NULL DEFAULT true,
  pickup_location_label text NOT NULL,
  pickup_address_disclosure text NOT NULL,
  pickup_next_available_date date,
  pickup_window text NOT NULL,
  pickup_same_day_available boolean NOT NULL DEFAULT false,
  pickup_appointment_required boolean NOT NULL DEFAULT true,
  support_response_min_hours integer NOT NULL CHECK (support_response_min_hours >= 0),
  support_response_max_hours integer NOT NULL CHECK (support_response_max_hours >= support_response_min_hours),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory (
  business_id text NOT NULL,
  sku text NOT NULL,
  stock_on_hand integer NOT NULL CHECK (stock_on_hand >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (business_id, sku)
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY,
  business_id text NOT NULL,
  order_number text NOT NULL,
  checkout_key uuid NOT NULL,
  request_fingerprint text NOT NULL,
  status text NOT NULL,
  payment_status text NOT NULL DEFAULT 'UNPAID',
  currency text NOT NULL DEFAULT 'aud',
  subtotal_amount integer NOT NULL CHECK (subtotal_amount >= 0),
  shipping_amount integer NOT NULL CHECK (shipping_amount >= 0),
  total_amount integer NOT NULL CHECK (total_amount >= 0),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  fulfilment_method_id text NOT NULL,
  fulfilment_label text NOT NULL,
  pickup_date date,
  pickup_window text,
  shipping_details jsonb,
  stripe_session_id text UNIQUE,
  stripe_payment_intent_id text,
  stripe_customer_id text,
  stripe_refund_id text,
  reservation_expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  refunded_at timestamptz,
  UNIQUE (business_id, order_number),
  UNIQUE (business_id, checkout_key)
);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY,
  business_id text NOT NULL,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  product_id text NOT NULL,
  variant_id text NOT NULL,
  product_name text NOT NULL,
  variant_label text NOT NULL,
  unit_amount integer NOT NULL CHECK (unit_amount >= 0),
  quantity integer NOT NULL CHECK (quantity > 0),
  line_total integer NOT NULL CHECK (line_total >= 0),
  cart_item_key text NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory_reservations (
  id uuid PRIMARY KEY,
  business_id text NOT NULL,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  sku text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  status text NOT NULL CHECK (status IN ('ACTIVE', 'CONSUMED', 'RELEASED')),
  expires_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, order_id, sku)
);

CREATE TABLE IF NOT EXISTS inventory_events (
  id uuid PRIMARY KEY,
  business_id text NOT NULL,
  sku text NOT NULL,
  event_type text NOT NULL,
  quantity_before integer,
  quantity_after integer,
  order_id uuid REFERENCES orders(id) ON DELETE RESTRICT,
  actor text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id uuid PRIMARY KEY,
  business_id text NOT NULL,
  provider text NOT NULL,
  provider_event_id text NOT NULL,
  event_type text NOT NULL,
  status text NOT NULL CHECK (status IN ('PROCESSING', 'PROCESSED', 'FAILED', 'IGNORED')),
  attempts integer NOT NULL DEFAULT 1,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  UNIQUE (business_id, provider, provider_event_id)
);

CREATE TABLE IF NOT EXISTS order_events (
  id uuid PRIMARY KEY,
  business_id text NOT NULL,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  event_type text NOT NULL,
  provider_event_id text,
  actor text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_outbox (
  id uuid PRIMARY KEY,
  business_id text NOT NULL,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  email_kind text NOT NULL,
  recipient text NOT NULL,
  status text NOT NULL CHECK (status IN ('PENDING', 'SENDING', 'SENT', 'FAILED')),
  attempts integer NOT NULL DEFAULT 0,
  provider_message_id text,
  last_error text,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  UNIQUE (business_id, order_id, email_kind)
);

CREATE TABLE IF NOT EXISTS cancellation_requests (
  id uuid PRIMARY KEY,
  business_id text NOT NULL,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  reason text,
  status text NOT NULL CHECK (status IN ('OPEN', 'APPROVED', 'DECLINED', 'WITHDRAWN')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE TABLE IF NOT EXISTS admin_login_attempts (
  id uuid PRIMARY KEY,
  business_id text NOT NULL,
  ip_hash text NOT NULL,
  successful boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_business_status_idx ON orders (business_id, status, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS order_events_provider_unique_idx ON order_events (business_id, provider_event_id, event_type) WHERE provider_event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS reservations_active_idx ON inventory_reservations (business_id, sku, status, expires_at);
CREATE INDEX IF NOT EXISTS inventory_events_idx ON inventory_events (business_id, sku, created_at DESC);
CREATE INDEX IF NOT EXISTS email_outbox_work_idx ON email_outbox (business_id, status, next_attempt_at);
CREATE INDEX IF NOT EXISTS cancellation_open_idx ON cancellation_requests (business_id, status, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS cancellation_one_open_idx ON cancellation_requests (business_id, order_id) WHERE status = 'OPEN';
CREATE INDEX IF NOT EXISTS admin_attempts_idx ON admin_login_attempts (business_id, ip_hash, created_at DESC);
