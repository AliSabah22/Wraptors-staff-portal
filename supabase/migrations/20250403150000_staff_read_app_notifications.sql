-- Allow staff to read app_notifications for operational dashboards (pickup notify detection, etc.)
DROP POLICY IF EXISTS "Staff can read app_notifications" ON app_notifications;
CREATE POLICY "Staff can read app_notifications"
  ON app_notifications FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM staff_users WHERE id = auth.uid()));
