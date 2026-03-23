-- ============================================================
-- WRAPTORS — COMPLETE SCHEMA MIGRATION
-- Portal (Next.js) + App (React Native) shared backend
-- All tables use RLS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  inventory_count INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can read products" ON products;
CREATE POLICY "Staff can read products"
  ON products FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM staff_users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "CEO and receptionist can modify products" ON products;
CREATE POLICY "CEO and receptionist can modify products"
  ON products FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM staff_users
    WHERE id = auth.uid() AND role IN ('ceo', 'receptionist')
  ));

DROP POLICY IF EXISTS "Customers can read active products" ON products;
CREATE POLICY "Customers can read active products"
  ON products FOR SELECT TO authenticated
  USING (
    is_active = true AND
    EXISTS (SELECT 1 FROM customers WHERE id = auth.uid())
  );

-- ============================================================
-- QUOTE REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS quote_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  services_requested TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new','contacted','quoted','accepted','declined','converted')),
  source TEXT NOT NULL DEFAULT 'app'
    CHECK (source IN ('app','website','phone','walk_in','meta_ads','referral','other')),
  notes TEXT,
  estimated_value DECIMAL(10,2),
  converted_job_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can access all quote requests" ON quote_requests;
CREATE POLICY "Staff can access all quote requests"
  ON quote_requests FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM staff_users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Customers can create quote requests" ON quote_requests;
CREATE POLICY "Customers can create quote requests"
  ON quote_requests FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS "Customers can view own quote requests" ON quote_requests;
CREATE POLICY "Customers can view own quote requests"
  ON quote_requests FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

-- ============================================================
-- JOBS
-- ============================================================
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  technician_id UUID REFERENCES staff_users(id) ON DELETE SET NULL,
  quote_request_id UUID REFERENCES quote_requests(id) ON DELETE SET NULL,
  services TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'intake'
    CHECK (status IN (
      'intake','in_progress','quality_check',
      'ready_for_pickup','completed','cancelled'
    )),
  start_date DATE,
  end_date DATE,
  price DECIMAL(10,2),
  deposit_paid DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  internal_notes TEXT,
  created_by UUID REFERENCES staff_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can access all jobs" ON jobs;
CREATE POLICY "Staff can access all jobs"
  ON jobs FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM staff_users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Customers can view own jobs" ON jobs;
CREATE POLICY "Customers can view own jobs"
  ON jobs FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

-- ============================================================
-- JOB MEDIA
-- ============================================================
CREATE TABLE IF NOT EXISTS job_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('before','after','progress')),
  url TEXT NOT NULL,
  storage_path TEXT,
  caption TEXT,
  uploaded_by UUID REFERENCES staff_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE job_media ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can manage job media" ON job_media;
CREATE POLICY "Staff can manage job media"
  ON job_media FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM staff_users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Customers can view own job media" ON job_media;
CREATE POLICY "Customers can view own job media"
  ON job_media FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = job_media.job_id
      AND jobs.customer_id = auth.uid()
    )
  );

-- ============================================================
-- PIPELINE STAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#B8962E',
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can access pipeline stages" ON pipeline_stages;
CREATE POLICY "Staff can access pipeline stages"
  ON pipeline_stages FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM staff_users WHERE id = auth.uid()));

INSERT INTO pipeline_stages (name, color, position) VALUES
  ('New Lead',        '#6B7280', 0),
  ('Contacted',       '#3B82F6', 1),
  ('Quoted',          '#F59E0B', 2),
  ('Accepted',        '#8B5CF6', 3),
  ('Scheduled',       '#B8962E', 4),
  ('In Progress',     '#0EA5E9', 5),
  ('Ready for Pickup','#22C55E', 6),
  ('Completed',       '#16A34A', 7)
ON CONFLICT DO NOTHING;

-- ============================================================
-- PIPELINE ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS pipeline_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id UUID NOT NULL REFERENCES pipeline_stages(id) ON DELETE RESTRICT,
  quote_request_id UUID REFERENCES quote_requests(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT pipeline_item_has_reference
    CHECK (quote_request_id IS NOT NULL OR job_id IS NOT NULL)
);

ALTER TABLE pipeline_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can access pipeline items" ON pipeline_items;
CREATE POLICY "Staff can access pipeline items"
  ON pipeline_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM staff_users WHERE id = auth.uid()));

-- ============================================================
-- CHAT
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('job','direct','general')),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  title TEXT,
  created_by UUID REFERENCES staff_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can access chat threads" ON chat_threads;
CREATE POLICY "Staff can access chat threads"
  ON chat_threads FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM staff_users WHERE id = auth.uid()));

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES staff_users(id) ON DELETE RESTRICT,
  body TEXT NOT NULL,
  read_by UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can access chat messages" ON chat_messages;
CREATE POLICY "Staff can access chat messages"
  ON chat_messages FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM staff_users WHERE id = auth.uid()));

-- ============================================================
-- CAMPAIGNS
-- ============================================================
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('product','service','category','custom')),
  target_id UUID,
  target_label TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','scheduled','active','paused','completed','archived')),
  offer_headline TEXT NOT NULL DEFAULT '',
  offer_body TEXT NOT NULL DEFAULT '',
  offer_cta TEXT NOT NULL DEFAULT '',
  offer_code TEXT,
  discount_type TEXT NOT NULL DEFAULT 'none'
    CHECK (discount_type IN ('percentage','fixed','none')),
  discount_value DECIMAL(10,2),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  max_redemptions INTEGER,
  redemption_count INTEGER DEFAULT 0,
  members_only BOOLEAN DEFAULT false,
  audience_type TEXT NOT NULL DEFAULT 'all_users'
    CHECK (audience_type IN (
      'all_users','all_customers','previous_customers',
      'members_only','service_history','manual'
    )),
  audience_params JSONB,
  channels JSONB NOT NULL DEFAULT '{"in_app": true, "email": false, "sms": false}',
  ai_generated BOOLEAN DEFAULT false,
  mock_reach INTEGER DEFAULT 0,
  mock_sent JSONB DEFAULT '{"in_app": 0, "email": 0, "sms": 0}',
  mock_opens INTEGER DEFAULT 0,
  mock_clicks INTEGER DEFAULT 0,
  created_by UUID REFERENCES staff_users(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can manage campaigns" ON campaigns;
CREATE POLICY "Staff can manage campaigns"
  ON campaigns FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM staff_users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Customers can read active campaigns" ON campaigns;
CREATE POLICY "Customers can read active campaigns"
  ON campaigns FOR SELECT TO authenticated
  USING (
    status = 'active'
    AND end_date >= CURRENT_DATE
    AND EXISTS (SELECT 1 FROM customers WHERE id = auth.uid())
  );

-- ============================================================
-- MEMBERSHIPS
-- ============================================================
CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'basic'
    CHECK (plan IN ('basic','premium','vip')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','expired','cancelled','paused')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  price DECIMAL(10,2),
  auto_renew BOOLEAN DEFAULT false,
  notes TEXT,
  created_by UUID REFERENCES staff_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can manage memberships" ON memberships;
CREATE POLICY "Staff can manage memberships"
  ON memberships FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM staff_users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Customers can view own membership" ON memberships;
CREATE POLICY "Customers can view own membership"
  ON memberships FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can read all reviews" ON reviews;
CREATE POLICY "Staff can read all reviews"
  ON reviews FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM staff_users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Customers can create reviews" ON reviews;
CREATE POLICY "Customers can create reviews"
  ON reviews FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS "Customers can view own reviews" ON reviews;
CREATE POLICY "Customers can view own reviews"
  ON reviews FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

-- ============================================================
-- APP NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS app_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT false,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE app_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can create app notifications" ON app_notifications;
CREATE POLICY "Staff can create app notifications"
  ON app_notifications FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM staff_users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Customers can access own app notifications" ON app_notifications;
CREATE POLICY "Customers can access own app notifications"
  ON app_notifications FOR ALL TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

-- ============================================================
-- INVOICES
-- ============================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE RESTRICT,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  invoice_number TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','sent','paid','overdue','cancelled')),
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES staff_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can manage invoices" ON invoices;
CREATE POLICY "Staff can manage invoices"
  ON invoices FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM staff_users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Customers can view own invoices" ON invoices;
CREATE POLICY "Customers can view own invoices"
  ON invoices FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

-- ============================================================
-- SHOP SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS shop_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_name TEXT NOT NULL DEFAULT 'Wraptors',
  shop_email TEXT,
  shop_phone TEXT,
  shop_address TEXT,
  shop_city TEXT,
  shop_province TEXT,
  shop_postal_code TEXT,
  shop_country TEXT DEFAULT 'CA',
  shop_logo_url TEXT,
  shop_hours JSONB,
  booking_lead_days INTEGER DEFAULT 2,
  currency TEXT DEFAULT 'CAD',
  tax_rate DECIMAL(5,2) DEFAULT 13.00,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can read shop settings" ON shop_settings;
CREATE POLICY "Staff can read shop settings"
  ON shop_settings FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM staff_users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "CEO can update shop settings" ON shop_settings;
CREATE POLICY "CEO can update shop settings"
  ON shop_settings FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM staff_users WHERE id = auth.uid() AND role = 'ceo'
  ));

DROP POLICY IF EXISTS "Customers can read shop settings" ON shop_settings;
CREATE POLICY "Customers can read shop settings"
  ON shop_settings FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM customers WHERE id = auth.uid()));

INSERT INTO shop_settings (shop_name) VALUES ('Wraptors')
ON CONFLICT DO NOTHING;
