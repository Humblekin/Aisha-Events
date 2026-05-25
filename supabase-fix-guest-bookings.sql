-- =============================================
-- FIX: Allow Guest Bookings and Orders
-- This migration makes user_id nullable and updates RLS policies
-- =============================================

-- 1. Make user_id nullable for bookings (to allow guest bookings)
ALTER TABLE bookings ALTER COLUMN user_id DROP NOT NULL;

-- 2. Make user_id nullable for orders (to allow guest orders)
ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;

-- 3. Make user_id nullable for payments (to allow guest payment tracking)
ALTER TABLE payments ALTER COLUMN user_id DROP NOT NULL;

-- 4. Update booking RLS policies to allow guest bookings
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;

CREATE POLICY "Users and guests can create bookings"
  ON bookings FOR INSERT WITH CHECK (
    user_id IS NULL OR auth.uid() = user_id OR auth.role() = 'authenticated'
  );

-- 5. Update booking SELECT policies for guests
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;

CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT USING (
    user_id IS NULL OR auth.uid() = user_id
  );

-- 6. Update order RLS policies to allow guest orders
DROP POLICY IF EXISTS "Users can create orders" ON orders;

CREATE POLICY "Users and guests can create orders"
  ON orders FOR INSERT WITH CHECK (
    user_id IS NULL OR auth.uid() = user_id OR auth.role() = 'authenticated'
  );

-- 7. Update order SELECT policies for guests
DROP POLICY IF EXISTS "Users can view own orders" ON orders;

CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT USING (
    user_id IS NULL OR auth.uid() = user_id
  );

-- 8. Update payment RLS policies
DROP POLICY IF EXISTS "Users can view own payments" ON payments;

CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT USING (
    user_id IS NULL OR auth.uid() = user_id
  );

DROP POLICY IF EXISTS "Users can create payments" ON payments;

CREATE POLICY "Users and guests can create payments"
  ON payments FOR INSERT WITH CHECK (
    user_id IS NULL OR auth.uid() = user_id OR auth.role() = 'authenticated'
  );

-- =============================================
-- NOTE: After running this migration, admins should be able to:
-- 1. See all bookings (both guest and authenticated)
-- 2. See all orders (both guest and authenticated)
-- 3. Create guest bookings/orders without a user_id
-- =============================================
