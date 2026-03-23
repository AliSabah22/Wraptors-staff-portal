-- ============================================================
-- PERFORMANCE INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_jobs_customer_id ON jobs(customer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_technician_id ON jobs(technician_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_media_job_id ON job_media(job_id);

CREATE INDEX IF NOT EXISTS idx_quote_requests_customer_id ON quote_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON quote_requests(status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_created_at ON quote_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pipeline_items_stage_id ON pipeline_items(stage_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_id ON chat_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_end_date ON campaigns(end_date);

CREATE INDEX IF NOT EXISTS idx_app_notifications_customer_id ON app_notifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_app_notifications_read ON app_notifications(read);

CREATE INDEX IF NOT EXISTS idx_memberships_customer_id ON memberships(customer_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);

CREATE INDEX IF NOT EXISTS idx_invoices_job_id ON invoices(job_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
