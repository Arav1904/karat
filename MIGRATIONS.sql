-- ════════════════════════════════════════════════════════════════════
-- KARAT v3 — Database Migration
-- ════════════════════════════════════════════════════════════════════
-- Apply in your Supabase SQL editor (in order). Each block is idempotent
-- (uses IF NOT EXISTS / DROP IF EXISTS) so it's safe to re-run.
-- Recommended: run during a low-traffic window. Total runtime < 30s
-- even on a 5k-product database.
-- ════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────
-- 1) PRODUCTS — add video_url column, drop AI columns
-- ────────────────────────────────────────────────────────────────────
-- The video_url column holds the Cloudinary secure_url of an uploaded
-- product video (≤ 10s). Single video per product (per spec #11).
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS video_url text;

-- AI-generated columns are being removed (spec #1). We DROP them so
-- the schema stays clean. If you want a safe two-phase migration,
-- comment these out for one release, deploy the v3 frontend (which
-- no longer reads them), verify everything works, then drop later.
ALTER TABLE public.products DROP COLUMN IF EXISTS ai_title;
ALTER TABLE public.products DROP COLUMN IF EXISTS ai_description;
ALTER TABLE public.products DROP COLUMN IF EXISTS ai_key_features;
ALTER TABLE public.products DROP COLUMN IF EXISTS ai_occasions;
ALTER TABLE public.products DROP COLUMN IF EXISTS ai_care_instructions;
ALTER TABLE public.products DROP COLUMN IF EXISTS ai_whatsapp_summary;
ALTER TABLE public.products DROP COLUMN IF EXISTS ai_style_tip;

-- ────────────────────────────────────────────────────────────────────
-- 2) PRODUCTS — enforce uniqueness of "current" SKU per owner
-- ────────────────────────────────────────────────────────────────────
-- A partial unique index ensures one SKU has only one is_current=true
-- row per owner — guarantees the "1 record per product" invariant
-- even if a buggy client tries to insert duplicates.
DROP INDEX IF EXISTS public.products_owner_sku_current_unique;
CREATE UNIQUE INDEX products_owner_sku_current_unique
  ON public.products(owner_id, sku)
  WHERE is_current = true;

-- ────────────────────────────────────────────────────────────────────
-- 3) PRODUCTS — enforce plan product_limit at the database
-- ────────────────────────────────────────────────────────────────────
-- Client checks are bypassable. This trigger HARD-rejects any INSERT
-- that would push a store past its product_limit. Returns a clear
-- error message which the frontend already handles.
CREATE OR REPLACE FUNCTION public.enforce_product_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit integer;
  v_count integer;
BEGIN
  -- Only check on INSERT, and only for is_current = true rows
  -- (soft-deleted rows don't count toward the limit).
  IF (TG_OP = 'INSERT' AND NEW.is_current = true) THEN
    SELECT product_limit INTO v_limit
      FROM public.stores
      WHERE owner_id = NEW.owner_id;

    -- product_limit is NOT NULL by schema, but be defensive
    IF v_limit IS NULL OR v_limit <= 0 THEN
      RETURN NEW;     -- no limit configured → allow
    END IF;

    SELECT COUNT(*) INTO v_count
      FROM public.products
      WHERE owner_id = NEW.owner_id
        AND is_current = true;

    IF v_count >= v_limit THEN
      RAISE EXCEPTION 'Product limit reached: % of %. Upgrade your plan to add more.',
        v_count, v_limit
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_product_limit ON public.products;
CREATE TRIGGER trg_enforce_product_limit
  BEFORE INSERT ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.enforce_product_limit();

-- ────────────────────────────────────────────────────────────────────
-- 4) STORES — ensure ai_models_limit is sensible (≥0)
-- ────────────────────────────────────────────────────────────────────
ALTER TABLE public.stores
  ADD CONSTRAINT IF NOT EXISTS stores_ai_models_limit_check
  CHECK (ai_models_limit IS NULL OR ai_models_limit >= 0);

-- ────────────────────────────────────────────────────────────────────
-- 5) ROW-LEVEL SECURITY — lock everything down to owner_id = auth.uid()
-- ────────────────────────────────────────────────────────────────────
-- Without RLS, the public anon key + a curious user can read other
-- stores' data. These policies make every row owner-scoped.

-- ── STORES table ──
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owners_select_own_store"  ON public.stores;
DROP POLICY IF EXISTS "owners_update_own_store"  ON public.stores;
CREATE POLICY "owners_select_own_store"
  ON public.stores FOR SELECT
  USING (owner_id = auth.uid());
CREATE POLICY "owners_update_own_store"
  ON public.stores FOR UPDATE
  USING  (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());
-- INSERT/DELETE on stores stays admin-only (no policy → service-role only)

-- ── PRODUCTS table ──
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owners_full_own_products" ON public.products;
CREATE POLICY "owners_full_own_products"
  ON public.products FOR ALL
  USING  (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- ── CUSTOMERS table ──
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owners_full_own_customers" ON public.customers;
CREATE POLICY "owners_full_own_customers"
  ON public.customers FOR ALL
  USING  (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- ── MONTHLY_USAGE & WHATSAPP_LOGS — read-only for owners ──
ALTER TABLE public.monthly_usage  ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owners_read_own_usage" ON public.monthly_usage;
CREATE POLICY "owners_read_own_usage"
  ON public.monthly_usage FOR SELECT
  USING (owner_id = auth.uid());

ALTER TABLE public.whatsapp_logs  ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owners_read_own_logs" ON public.whatsapp_logs;
CREATE POLICY "owners_read_own_logs"
  ON public.whatsapp_logs FOR SELECT
  USING (owner_id = auth.uid());

ALTER TABLE public.conversation_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owners_read_own_sessions" ON public.conversation_sessions;
CREATE POLICY "owners_read_own_sessions"
  ON public.conversation_sessions FOR SELECT
  USING (owner_id = auth.uid());

ALTER TABLE public.alert_flags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owners_read_own_alerts" ON public.alert_flags;
CREATE POLICY "owners_read_own_alerts"
  ON public.alert_flags FOR SELECT
  USING (owner_id = auth.uid());

-- ── Reference tables — readable by everyone ──
ALTER TABLE public.jewellery_categories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jewellery_sub_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans       ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_categories" ON public.jewellery_categories;
DROP POLICY IF EXISTS "public_read_subcats"    ON public.jewellery_sub_categories;
DROP POLICY IF EXISTS "public_read_plans"      ON public.subscription_plans;

CREATE POLICY "public_read_categories" ON public.jewellery_categories
  FOR SELECT USING (true);
CREATE POLICY "public_read_subcats" ON public.jewellery_sub_categories
  FOR SELECT USING (true);
CREATE POLICY "public_read_plans" ON public.subscription_plans
  FOR SELECT USING (true);

-- ────────────────────────────────────────────────────────────────────
-- 6) SUBSCRIPTION_PLANS — seed/update the four plans
-- ────────────────────────────────────────────────────────────────────
INSERT INTO public.subscription_plans
  (plan_name, conversation_limit, monthly_budget_inr, product_limit,
   image_storage_gb, has_image_search, has_voice_search, monthly_price_inr,
   description, ai_models, customer_tiers, analytics, virtual_tryon)
VALUES
  ('trial',         50,    0,       50,    1,  TRUE,  TRUE,     0, 'Trial — full Professional features for evaluation',          TRUE,  TRUE,  'PROFESSIONAL', TRUE),
  ('starter',      500,  250,      500,    5,  FALSE, FALSE, 3500, 'Starter — WhatsApp bot + inventory',                          FALSE, FALSE, 'STARTER',      FALSE),
  ('professional',2000,  500,     5000,   25,  TRUE,  TRUE,  8500, 'Professional — voice/image search, CRM tiers, advanced AI', TRUE,  TRUE,  'PROFESSIONAL', TRUE),
  ('enterprise', 100000, 5000, 1000000,  500,  TRUE,  TRUE, 18000, 'Enterprise — unlimited everything, fair-use',                 TRUE,  TRUE,  'ENTERPRISE',   TRUE)
ON CONFLICT (plan_name) DO UPDATE SET
  conversation_limit = EXCLUDED.conversation_limit,
  monthly_budget_inr = EXCLUDED.monthly_budget_inr,
  product_limit      = EXCLUDED.product_limit,
  image_storage_gb   = EXCLUDED.image_storage_gb,
  has_image_search   = EXCLUDED.has_image_search,
  has_voice_search   = EXCLUDED.has_voice_search,
  monthly_price_inr  = EXCLUDED.monthly_price_inr,
  description        = EXCLUDED.description,
  ai_models          = EXCLUDED.ai_models,
  customer_tiers     = EXCLUDED.customer_tiers,
  analytics          = EXCLUDED.analytics,
  virtual_tryon      = EXCLUDED.virtual_tryon;

-- ────────────────────────────────────────────────────────────────────
-- 7) (Optional) DAILY_METAL_RATES — for the pricing calculator
-- ────────────────────────────────────────────────────────────────────
-- If you wire a scheduled n8n workflow to fetch live gold/silver rates,
-- write them here and the frontend will read from this table instead
-- of the hard-coded defaults.
CREATE TABLE IF NOT EXISTS public.daily_metal_rates (
  rate_date  date    NOT NULL DEFAULT CURRENT_DATE,
  metal_key  text    NOT NULL,   -- '24K' | '22K' | '925 Silver' | …
  rate_inr   numeric NOT NULL,
  source     text,
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (rate_date, metal_key)
);
ALTER TABLE public.daily_metal_rates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_rates" ON public.daily_metal_rates;
CREATE POLICY "public_read_rates" ON public.daily_metal_rates
  FOR SELECT USING (true);

-- ════════════════════════════════════════════════════════════════════
-- DONE
-- ════════════════════════════════════════════════════════════════════
-- Verify with these queries:
--   SELECT column_name FROM information_schema.columns
--    WHERE table_name = 'products' AND column_name IN ('video_url','ai_title');
--   -- video_url should appear; ai_title should not.
--
--   SELECT indexname FROM pg_indexes
--    WHERE tablename = 'products' AND indexname LIKE '%current%';
--
--   SELECT tgname FROM pg_trigger WHERE tgname = 'trg_enforce_product_limit';
-- ════════════════════════════════════════════════════════════════════
