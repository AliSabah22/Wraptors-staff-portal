-- App / portal verification dataset (idempotent)
DO $$
DECLARE
  customer_uuid UUID;
  vehicle_uuid UUID;
  job_uuid UUID;
  campaign_uuid UUID;
  staff_uuid UUID;
BEGIN
  IF EXISTS (
    SELECT 1 FROM jobs
    WHERE notes = 'App verification test job — safe to delete'
  ) THEN
    RAISE NOTICE 'Verification job already exists; skipping seed.';
    RETURN;
  END IF;

  SELECT id INTO staff_uuid FROM staff_users
  WHERE role = 'ceo'
  LIMIT 1;

  IF staff_uuid IS NULL THEN
    SELECT id INTO staff_uuid FROM staff_users LIMIT 1;
  END IF;

  IF staff_uuid IS NULL THEN
    RAISE NOTICE 'No staff_users row; cannot set created_by. Skipping verification seed.';
    RETURN;
  END IF;

  SELECT id INTO customer_uuid FROM customers LIMIT 1;

  IF customer_uuid IS NULL THEN
    RAISE NOTICE 'No customers found; add a customer first, then re-run migrations or apply this SQL manually.';
    RETURN;
  END IF;

  SELECT id INTO vehicle_uuid FROM vehicles
  WHERE customer_id = customer_uuid
  LIMIT 1;

  IF vehicle_uuid IS NULL THEN
    INSERT INTO vehicles (customer_id, make, model, year, color)
    VALUES (customer_uuid, 'Porsche', '911 GT3', 2023, 'Guards Red')
    RETURNING id INTO vehicle_uuid;
  END IF;

  INSERT INTO jobs (
    customer_id, vehicle_id, services, status,
    price, start_date, notes, created_by
  )
  VALUES (
    customer_uuid, vehicle_uuid,
    ARRAY['Full PPF Wrap', 'Ceramic Window Tint']::text[],
    'in_progress',
    4200.00,
    CURRENT_DATE,
    'App verification test job — safe to delete',
    staff_uuid
  )
  RETURNING id INTO job_uuid;

  INSERT INTO job_media (job_id, type, url, caption)
  VALUES (
    job_uuid,
    'before',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800',
    'Vehicle received — before PPF application'
  );

  INSERT INTO pipeline_items (stage_id, job_id, position)
  SELECT ps.id, job_uuid, 0
  FROM pipeline_stages ps
  WHERE ps.name = 'In Progress'
    AND NOT EXISTS (SELECT 1 FROM pipeline_items pi WHERE pi.job_id = job_uuid)
  LIMIT 1;

  INSERT INTO campaigns (
    title, type, target_label, status,
    offer_headline, offer_body, offer_cta,
    offer_code, discount_type, discount_value,
    start_date, end_date,
    channels, members_only,
    mock_reach, mock_sent, mock_opens, mock_clicks,
    ai_generated, created_by
  )
  VALUES (
    'Summer PPF Special',
    'service',
    'Paint Protection Film',
    'active',
    'Protect Your Investment This Summer',
    'Get 20% off our full vehicle PPF package. Premium self-healing film that keeps your car looking showroom fresh year-round.',
    'Book Now',
    'SUMMER20',
    'percentage',
    20,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    '{"in_app": true, "email": true, "sms": false}'::jsonb,
    false,
    847,
    '{"in_app": 312, "email": 198, "sms": 0}'::jsonb,
    89, 34,
    false,
    staff_uuid
  )
  RETURNING id INTO campaign_uuid;

  INSERT INTO app_notifications (
    customer_id, type, title, message,
    job_id, read
  )
  VALUES (
    customer_uuid,
    'job_update',
    'Work has started on your vehicle',
    'We have started your Full PPF Wrap. We will notify you when it is ready for pickup.',
    job_uuid,
    false
  );

  INSERT INTO quote_requests (
    customer_id, customer_name, customer_email,
    services_requested, source, status, notes
  )
  SELECT
    customer_uuid,
    c.full_name,
    c.email,
    ARRAY['Full Color Change Wrap']::text[],
    'app',
    'new',
    'Interested in matte black wrap — app verification test'
  FROM customers c
  WHERE c.id = customer_uuid;

END $$;
