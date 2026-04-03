-- Seed Wraptors services catalog (idempotent)
INSERT INTO services (name, category, base_price, duration_hours, description, is_active)
SELECT 'Full Vehicle PPF Wrap', 'ppf', 3500.00, 16.0, 'Complete paint protection film coverage for entire vehicle', true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Full Vehicle PPF Wrap');

INSERT INTO services (name, category, base_price, duration_hours, description, is_active)
SELECT 'Partial PPF — Hood + Fenders', 'ppf', 1200.00, 6.0, 'PPF coverage for high-impact zones only', true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Partial PPF — Hood + Fenders');

INSERT INTO services (name, category, base_price, duration_hours, description, is_active)
SELECT 'Headlight + Taillight PPF', 'ppf', 250.00, 2.0, 'PPF protection for all lights', true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Headlight + Taillight PPF');

INSERT INTO services (name, category, base_price, duration_hours, description, is_active)
SELECT 'Full Color Change Wrap', 'wrap', 4500.00, 20.0, 'Complete vehicle color change with premium vinyl', true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Full Color Change Wrap');

INSERT INTO services (name, category, base_price, duration_hours, description, is_active)
SELECT 'Partial Wrap', 'wrap', 1800.00, 8.0, 'Hood, roof, or partial color change', true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Partial Wrap');

INSERT INTO services (name, category, base_price, duration_hours, description, is_active)
SELECT 'Chrome Delete', 'wrap', 1600.00, 7.0, 'Replace all chrome trim with matte black or body color', true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Chrome Delete');

INSERT INTO services (name, category, base_price, duration_hours, description, is_active)
SELECT 'Racing Stripes', 'wrap', 450.00, 3.0, 'Custom stripe package in any color', true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Racing Stripes');

INSERT INTO services (name, category, base_price, duration_hours, description, is_active)
SELECT 'Ceramic Window Tint', 'tint', 450.00, 4.0, 'High-grade ceramic tint all windows', true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Ceramic Window Tint');

INSERT INTO services (name, category, base_price, duration_hours, description, is_active)
SELECT 'Windshield Tint', 'tint', 150.00, 1.0, 'Ceramic tint for windshield (legal strip)', true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Windshield Tint');

INSERT INTO services (name, category, base_price, duration_hours, description, is_active)
SELECT 'Detail Stage 1', 'detailing', 299.00, 3.0, 'Exterior wash, clay bar, sealant application', true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Detail Stage 1');

INSERT INTO services (name, category, base_price, duration_hours, description, is_active)
SELECT 'Detail Stage 2', 'detailing', 599.00, 6.0, 'Paint correction + ceramic coating', true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Detail Stage 2');

INSERT INTO services (name, category, base_price, duration_hours, description, is_active)
SELECT 'Interior Detail', 'detailing', 349.00, 4.0, 'Full interior deep clean and conditioning', true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Interior Detail');

INSERT INTO services (name, category, base_price, duration_hours, description, is_active)
SELECT 'Ceramic Coating — 1 Year', 'detailing', 799.00, 6.0, '1-year ceramic coating protection', true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Ceramic Coating — 1 Year');

INSERT INTO services (name, category, base_price, duration_hours, description, is_active)
SELECT 'Ceramic Coating — 3 Year', 'detailing', 1299.00, 8.0, '3-year ceramic coating with maintenance kit', true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Ceramic Coating — 3 Year');
