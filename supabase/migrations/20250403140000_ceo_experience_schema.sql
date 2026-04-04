-- CEO experience polish: quote approval, warranties, condition reports, review URL

ALTER TABLE quote_requests
  ADD COLUMN IF NOT EXISTS approval_token TEXT,
  ADD COLUMN IF NOT EXISTS approval_token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS quote_line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS decline_reason TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_quote_requests_approval_token
  ON quote_requests (approval_token)
  WHERE approval_token IS NOT NULL;

ALTER TABLE shop_settings
  ADD COLUMN IF NOT EXISTS google_review_url TEXT;

CREATE TABLE IF NOT EXISTS job_warranties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  coverage_description TEXT NOT NULL,
  expires_at DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE job_warranties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can manage job warranties" ON job_warranties;
CREATE POLICY "Staff can manage job warranties"
  ON job_warranties FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM staff_users WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM staff_users WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_job_warranties_job_id ON job_warranties(job_id);
CREATE INDEX IF NOT EXISTS idx_job_warranties_expires_at ON job_warranties(expires_at);

CREATE TABLE IF NOT EXISTS vehicle_condition_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  zones JSONB NOT NULL DEFAULT '{}'::jsonb,
  photo_storage_paths TEXT[] NOT NULL DEFAULT '{}',
  acknowledgment_token TEXT,
  acknowledgment_token_expires_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicle_condition_reports_ack_token
  ON vehicle_condition_reports (acknowledgment_token)
  WHERE acknowledgment_token IS NOT NULL;

ALTER TABLE vehicle_condition_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff manage vehicle condition reports" ON vehicle_condition_reports;
CREATE POLICY "Staff manage vehicle condition reports"
  ON vehicle_condition_reports FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM staff_users WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM staff_users WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_vehicle_condition_reports_job_id ON vehicle_condition_reports(job_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicle_condition_reports_one_per_job
  ON vehicle_condition_reports (job_id);
