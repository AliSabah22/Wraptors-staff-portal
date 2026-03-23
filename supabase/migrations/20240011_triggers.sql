-- ============================================================
-- UPDATED_AT TRIGGERS FOR ALL NEW TABLES
-- ============================================================

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_quote_requests_updated_at ON quote_requests;
CREATE TRIGGER trg_quote_requests_updated_at
  BEFORE UPDATE ON quote_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_jobs_updated_at ON jobs;
CREATE TRIGGER trg_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_pipeline_items_updated_at ON pipeline_items;
CREATE TRIGGER trg_pipeline_items_updated_at
  BEFORE UPDATE ON pipeline_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_campaigns_updated_at ON campaigns;
CREATE TRIGGER trg_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_memberships_updated_at ON memberships;
CREATE TRIGGER trg_memberships_updated_at
  BEFORE UPDATE ON memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_invoices_updated_at ON invoices;
CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_shop_settings_updated_at ON shop_settings;
CREATE TRIGGER trg_shop_settings_updated_at
  BEFORE UPDATE ON shop_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
