-- =============================================
-- Aisha Events Centre — Supabase Schema
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. PROFILES (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'driver', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. RESTAURANTS
CREATE TABLE restaurants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  cuisine TEXT,
  description TEXT,
  rating DECIMAL(2,1) DEFAULT 0,
  price_range TEXT,
  location TEXT,
  phone TEXT,
  tables_count INTEGER DEFAULT 10,
  image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'inactive')),
  owner_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active restaurants"
  ON restaurants FOR SELECT USING (status = 'active');

CREATE POLICY "Admins can manage restaurants"
  ON restaurants FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- 3. VENUES
CREATE TABLE venues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  description TEXT,
  capacity INTEGER,
  price_per_event DECIMAL(12,2),
  location TEXT,
  image_url TEXT,
  badge TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
  owner_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active venues"
  ON venues FOR SELECT USING (status = 'active');

CREATE POLICY "Admins can manage venues"
  ON venues FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- 4. MENU ITEMS
CREATE TABLE menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT,
  prep_time INTEGER,
  image_url TEXT,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active menu items"
  ON menu_items FOR SELECT USING (status = 'active');

CREATE POLICY "Admins can manage menu items"
  ON menu_items FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- 5. EVENTS
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  venue_id UUID REFERENCES venues(id),
  capacity INTEGER,
  price DECIMAL(10,2),
  image_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active events"
  ON events FOR SELECT USING (status = 'active');

CREATE POLICY "Admins can manage events"
  ON events FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- 6. BOOKINGS
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  guest_name TEXT,
  booking_type TEXT CHECK (booking_type IN ('restaurant', 'venue', 'event', 'vip')),
  service_name TEXT,
  restaurant_id UUID REFERENCES restaurants(id),
  venue_id UUID REFERENCES venues(id),
  event_id UUID REFERENCES events(id),
  booking_date DATE NOT NULL,
  booking_time TIME,
  guests INTEGER DEFAULT 1,
  special_requests TEXT,
  amount DECIMAL(12,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  payment_id UUID,
  payment_reference TEXT,
  vip_package TEXT,
  vip_occasion TEXT,
  vip_concierge BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all bookings"
  ON bookings FOR SELECT USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

CREATE POLICY "Admins can manage bookings"
  ON bookings FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- 7. ORDERS (food delivery)
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  total DECIMAL(12,2) NOT NULL,
  type TEXT CHECK (type IN ('delivery', 'pickup')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'in_transit', 'delivered', 'cancelled')),
  delivery_address TEXT,
  payment_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders"
  ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage orders"
  ON orders FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- 8. PAYMENTS
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  booking_id UUID REFERENCES bookings(id),
  order_id UUID REFERENCES orders(id),
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'NGN',
  method TEXT DEFAULT 'paystack',
  reference TEXT UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  paystack_response JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments"
  ON payments FOR SELECT USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- 9. COMMISSIONS
CREATE TABLE commissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES profiles(id),
  restaurant_id UUID REFERENCES restaurants(id),
  venue_id UUID REFERENCES venues(id),
  amount DECIMAL(12,2) NOT NULL,
  rate DECIMAL(5,2) NOT NULL,
  period_start DATE,
  period_end DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage commissions"
  ON commissions FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- 10. PROMOTIONS
CREATE TABLE promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT,
  description TEXT,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'disabled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage promotions"
  ON promotions FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- 11. COMPLAINTS
CREATE TABLE complaints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  subject TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'resolved')),
  resolved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own complaints"
  ON complaints FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage complaints"
  ON complaints FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- 12. NOTIFICATIONS
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can create notifications"
  ON notifications FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- =============================================
-- ADD DISPLAY / DENORMALIZED COLUMNS
-- These match what the frontend admin dashboard expects
-- =============================================

-- Restaurants: add revenue for admin display
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS revenue TEXT DEFAULT '0';

-- Venues: add bookings_count & phone for admin display
ALTER TABLE venues ADD COLUMN IF NOT EXISTS bookings_count INTEGER DEFAULT 0;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS phone TEXT;

-- Menu items: add orders_count & rating for admin display
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS orders_count INTEGER DEFAULT 0;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS rating DECIMAL(2,1) DEFAULT 0;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS restaurant_name TEXT;

-- Events: add display fields for frontend
ALTER TABLE events ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS spots TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS registered TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS full_date TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_name TEXT;

-- Bookings: add guest_name, service_name for admin display
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guest_name TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_name TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS vip_package TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS vip_occasion TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS vip_concierge BOOLEAN DEFAULT false;

-- Orders: add customer_name for admin display
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- Payments: add customer_name, service_name for admin display
ALTER TABLE payments ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS service_name TEXT;

-- Commissions: add vendor_name, service_type for admin display
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS vendor_name TEXT;
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS service_type TEXT;

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- =============================================
-- SEED DATA (optional — run if you want sample data)
-- =============================================
-- Copy the mock data arrays from src/data/mockData.js into Supabase
-- via the Table Editor or use the Supabase API to insert them.
