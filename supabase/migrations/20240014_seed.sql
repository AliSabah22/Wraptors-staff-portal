-- ============================================================
-- DEVELOPMENT SEED DATA
-- ============================================================

INSERT INTO customers (id, full_name, email, phone, membership_status, source)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Alex Johnson', 'alex@example.com', '4165550001', 'active', 'app'),
  ('22222222-2222-2222-2222-222222222222', 'Maria Garcia', 'maria@example.com', '4165550002', 'none', 'website'),
  ('33333333-3333-3333-3333-333333333333', 'James Wilson', 'james@example.com', '4165550003', 'none', 'referral')
ON CONFLICT (email) DO NOTHING;

INSERT INTO vehicles (customer_id, make, model, year, color)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Porsche', '911 Carrera', 2022, 'Guards Red'),
  ('22222222-2222-2222-2222-222222222222', 'BMW', 'M3 Competition', 2023, 'Frozen Black'),
  ('33333333-3333-3333-3333-333333333333', 'Mercedes', 'G63 AMG', 2021, 'Obsidian Black')
ON CONFLICT DO NOTHING;

INSERT INTO products (name, category, price, description) VALUES
  ('XPEL Ultimate Plus PPF', 'ppf', 850.00, 'Self-healing paint protection film roll'),
  ('3M 1080 Matte Black Vinyl', 'wrap', 120.00, 'Premium matte black wrap film per roll'),
  ('Ceramic Pro 9H Coating', 'detailing', 299.00, 'Professional ceramic coating kit'),
  ('Llumar CTX Tint Film', 'tint', 89.00, 'Ceramic tint film per window')
ON CONFLICT DO NOTHING;
