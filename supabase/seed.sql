-- Seed data that mirrors the existing hardcoded portal data
INSERT INTO services (name, category, base_price, duration_hours, description) VALUES
  ('Full Vehicle PPF Wrap', 'ppf', 3500.00, 16.0, 'Complete paint protection film'),
  ('Partial PPF — Hood + Fenders', 'ppf', 1200.00, 6.0, 'High-impact zone PPF'),
  ('Full Chrome Delete', 'wrap', 1800.00, 8.0, 'Chrome trim replaced with matte black'),
  ('Full Color Change Wrap', 'wrap', 4500.00, 20.0, 'Complete vehicle color change'),
  ('Ceramic Window Tint', 'tint', 450.00, 4.0, 'High-grade ceramic tint'),
  ('Detail Stage 1', 'detailing', 299.00, 3.0, 'Wash, clay bar, sealant'),
  ('Detail Stage 2', 'detailing', 599.00, 6.0, 'Paint correction + ceramic coating'),
  ('Headlight PPF', 'ppf', 250.00, 2.0, 'PPF for headlights and taillights')
ON CONFLICT DO NOTHING;
