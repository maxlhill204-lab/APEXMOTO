ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS discount_amount integer NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  ADD COLUMN IF NOT EXISTS promotion_code text,
  ADD COLUMN IF NOT EXISTS stripe_promotion_code_id text,
  ADD COLUMN IF NOT EXISTS payment_method_label text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_discount_not_above_gross'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT orders_discount_not_above_gross
      CHECK (discount_amount <= subtotal_amount + shipping_amount);
  END IF;
END $$;
