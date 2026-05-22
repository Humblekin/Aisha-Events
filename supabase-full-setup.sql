-- =============================================
-- Aisha Events Centre — Full Setup
-- Run this ONCE in your Supabase SQL Editor
-- Creates all tables + seeds sample data
-- =============================================

-- 1. PROFILES (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'vendor', 'driver', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. RESTAURANTS
CREATE TABLE IF NOT EXISTS restaurants (
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
  revenue TEXT DEFAULT '0',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'inactive')),
  owner_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active restaurants" ON restaurants;
CREATE POLICY "Public can view active restaurants"
  ON restaurants FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Admins can manage restaurants" ON restaurants;
CREATE POLICY "Admins can manage restaurants"
  ON restaurants FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- 3. VENUES
CREATE TABLE IF NOT EXISTS venues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  description TEXT,
  capacity INTEGER,
  price_per_event DECIMAL(12,2),
  location TEXT,
  image_url TEXT,
  badge TEXT,
  bookings_count INTEGER DEFAULT 0,
  phone TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
  owner_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active venues" ON venues;
CREATE POLICY "Public can view active venues"
  ON venues FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Admins can manage venues" ON venues;
CREATE POLICY "Admins can manage venues"
  ON venues FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- 4. MENU ITEMS
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT,
  prep_time INTEGER,
  image_url TEXT,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  orders_count INTEGER DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 0,
  restaurant_name TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active menu items" ON menu_items;
CREATE POLICY "Public can view active menu items"
  ON menu_items FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Admins can manage menu items" ON menu_items;
CREATE POLICY "Admins can manage menu items"
  ON menu_items FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- 5. EVENTS
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  venue_id UUID REFERENCES venues(id),
  venue_name TEXT,
  capacity INTEGER,
  price DECIMAL(10,2),
  image_url TEXT,
  location TEXT,
  spots TEXT,
  registered TEXT,
  full_date TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active events" ON events;
CREATE POLICY "Public can view active events"
  ON events FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Admins can manage events" ON events;
CREATE POLICY "Admins can manage events"
  ON events FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- 6. BOOKINGS
CREATE TABLE IF NOT EXISTS bookings (
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
  vip_package TEXT,
  vip_occasion TEXT,
  vip_concierge BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
CREATE POLICY "Admins can view all bookings"
  ON bookings FOR SELECT USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can manage bookings" ON bookings;
CREATE POLICY "Admins can manage bookings"
  ON bookings FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- 7. ORDERS (food delivery)
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  customer_name TEXT,
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

DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create orders" ON orders;
CREATE POLICY "Users can create orders"
  ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage orders" ON orders;
CREATE POLICY "Admins can manage orders"
  ON orders FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- 8. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  customer_name TEXT,
  service_name TEXT,
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

DROP POLICY IF EXISTS "Users can view own payments" ON payments;
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
CREATE POLICY "Admins can view all payments"
  ON payments FOR SELECT USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- 9. COMMISSIONS
CREATE TABLE IF NOT EXISTS commissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES profiles(id),
  vendor_name TEXT,
  service_type TEXT,
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

DROP POLICY IF EXISTS "Admins can manage commissions" ON commissions;
CREATE POLICY "Admins can manage commissions"
  ON commissions FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- 10. PROMOTIONS
CREATE TABLE IF NOT EXISTS promotions (
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

DROP POLICY IF EXISTS "Admins can manage promotions" ON promotions;
CREATE POLICY "Admins can manage promotions"
  ON promotions FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- 11. COMPLAINTS
CREATE TABLE IF NOT EXISTS complaints (
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

DROP POLICY IF EXISTS "Users can view own complaints" ON complaints;
CREATE POLICY "Users can view own complaints"
  ON complaints FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage complaints" ON complaints;
CREATE POLICY "Admins can manage complaints"
  ON complaints FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- 12. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can create notifications" ON notifications;
CREATE POLICY "Admins can create notifications"
  ON notifications FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- 13. VENDOR APPLICATIONS
CREATE TABLE IF NOT EXISTS vendor_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT NOT NULL,
  business_type TEXT,
  owner_name TEXT NOT NULL,
  owner_email TEXT,
  phone TEXT,
  documents TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE vendor_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage vendor apps" ON vendor_applications;
CREATE POLICY "Admins can manage vendor apps"
  ON vendor_applications FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

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
-- SEED DATA
-- =============================================

-- RESTAURANTS
INSERT INTO restaurants (id, name, cuisine, rating, price_range, location, tables_count, tags, revenue, status) VALUES
('a0000001-0000-0000-0000-000000000001', 'The Golden Palm', 'African Fusion', 4.9, '$$$', 'Victoria Island', 18, '{Fine Dining,African}', '4200000', 'active'),
('a0000001-0000-0000-0000-000000000002', 'Saffron Lounge', 'Mediterranean', 4.8, '$$$', 'Ikoyi', 14, '{Mediterranean,Lounge}', '3800000', 'active'),
('a0000001-0000-0000-0000-000000000003', 'Ember & Oak', 'Contemporary Grill', 4.7, '$$', 'Lekki', 22, '{Grill,Steakhouse}', '2900000', 'active'),
('a0000001-0000-0000-0000-000000000004', 'Jasmine Terrace', 'Asian Fusion', 4.8, '$$$', 'Lagos Island', 10, '{Asian,Rooftop}', '3100000', 'active'),
('a0000001-0000-0000-0000-000000000005', 'La Dolce Vita', 'Italian', 4.6, '$$', 'Banana Island', 16, '{Italian,Romantic}', '2400000', 'active'),
('a0000001-0000-0000-0000-000000000006', 'Savanna Kitchen', 'West African', 4.9, '$$', 'Yaba', 24, '{African,Casual}', '5100000', 'active'),
('a0000001-0000-0000-0000-000000000007', 'The Smoke House', 'BBQ & Grill', 0, '$$', 'Lekki', 20, '{BBQ,Grill}', NULL, 'pending'),
('a0000001-0000-0000-0000-000000000008', 'Coastal Breeze', 'Seafood', 0, '$$$', 'Victoria Island', 12, '{Seafood,Fine Dining}', NULL, 'pending'),
('a0000001-0000-0000-0000-000000000009', 'Le Petit Bistro', 'French', 4.4, '$$$', 'Ikoyi', 8, '{French,Romantic}', '1600000', 'inactive'),
('a0000001-0000-0000-0000-00000000000a', 'Spice Route', 'Indian', 4.7, '$$', 'Lagos Island', 14, '{Indian,Casual}', '2200000', 'active')
ON CONFLICT (id) DO NOTHING;

-- VENUES
INSERT INTO venues (id, name, type, capacity, price_per_event, badge, bookings_count, status) VALUES
('a0000002-0000-0000-0000-000000000001', 'The Grand Ballroom', 'Wedding Hall', 500, 2500000, 'Premium', 42, 'active'),
('a0000002-0000-0000-0000-000000000002', 'Skyline Terrace', 'Rooftop', 200, 1200000, 'Popular', 68, 'active'),
('a0000002-0000-0000-0000-000000000003', 'The Boardroom', 'Conference', 80, 450000, 'Corporate', 115, 'active'),
('a0000002-0000-0000-0000-000000000004', 'Garden Pavilion', 'Outdoor', 350, 1800000, 'New', 31, 'active'),
('a0000002-0000-0000-0000-000000000005', 'Royal Banquet Hall', 'Wedding Hall', 600, 3200000, 'Premium', 28, 'active'),
('a0000002-0000-0000-0000-000000000006', 'The Loft Studio', 'Lounge', 120, 800000, 'Popular', 54, 'active'),
('a0000002-0000-0000-0000-000000000007', 'Lakeside Retreat', 'Outdoor', 250, 1500000, 'New', 0, 'maintenance'),
('a0000002-0000-0000-0000-000000000008', 'Summit Conference', 'Conference', 150, 650000, 'Corporate', 89, 'active')
ON CONFLICT (id) DO NOTHING;

-- MENU ITEMS
INSERT INTO menu_items (id, name, description, price, category, prep_time, restaurant_id, orders_count, rating, restaurant_name, status) VALUES
('a0000003-0000-0000-0000-000000000001', 'Grilled Lobster Tail', 'Butter-poached with herbs and citrus', 18500, 'Main Course', 25, 'a0000001-0000-0000-0000-000000000001', 342, 4.9, 'The Golden Palm', 'active'),
('a0000003-0000-0000-0000-000000000002', 'Wagyu Beef Tenderloin', 'Truffle jus, roasted vegetables', 25000, 'Main Course', 30, 'a0000001-0000-0000-0000-000000000003', 218, 4.8, 'Ember & Oak', 'active'),
('a0000003-0000-0000-0000-000000000003', 'Jollof Rice Platter', 'Smoky party jollof with grilled chicken', 6500, 'Main Course', 20, 'a0000001-0000-0000-0000-000000000006', 1247, 4.9, 'Savanna Kitchen', 'active'),
('a0000003-0000-0000-0000-000000000004', 'Sushi Deluxe Box', 'Assorted nigiri, maki, sashimi', 14000, 'Main Course', 22, 'a0000001-0000-0000-0000-000000000004', 189, 4.7, 'Jasmine Terrace', 'active'),
('a0000003-0000-0000-0000-000000000005', 'Pasta Carbonara', 'Creamy egg-based with pancetta', 8200, 'Main Course', 18, 'a0000001-0000-0000-0000-000000000005', 456, 4.6, 'La Dolce Vita', 'active'),
('a0000003-0000-0000-0000-000000000006', 'Suya Skewers', 'Spicy peanut-crusted beef strips', 4800, 'Appetizers', 15, 'a0000001-0000-0000-0000-000000000006', 890, 4.7, 'Savanna Kitchen', 'active'),
('a0000003-0000-0000-0000-000000000007', 'Caesar Salad', 'Crispy romaine, parmesan, croutons', 5500, 'Appetizers', 10, 'a0000001-0000-0000-0000-000000000002', 678, 4.5, 'Saffron Lounge', 'active'),
('a0000003-0000-0000-0000-000000000008', 'Chocolate Lava Cake', 'Warm molten center, vanilla ice cream', 4200, 'Desserts', 12, 'a0000001-0000-0000-0000-000000000001', 523, 4.8, 'The Golden Palm', 'active')
ON CONFLICT (id) DO NOTHING;

-- EVENTS
INSERT INTO events (id, name, event_date, event_time, location, price, capacity, spots, registered, full_date, venue_name, status) VALUES
('a0000004-0000-0000-0000-000000000001', 'Moonlit Dinner Under the Sahel Sky', '2025-02-14', '19:00', 'Radach Hotel & Conference Centre', 35000, 80, '12 spots left', '68/80', 'Feb 14, 2025', 'Radach Hotel & Conference Centre', 'active'),
('a0000004-0000-0000-0000-000000000002', 'TZ & Afrobeats Brunch', '2025-02-22', '11:00', 'Tamarind Gardens', 15000, 120, '28 spots left', '92/120', 'Feb 22, 2025', 'Tamarind Gardens', 'active'),
('a0000004-0000-0000-0000-000000000003', 'Savannah Chef''s Table: Heritage Tasting', '2025-03-08', '18:30', 'Wakanda Gardens', 75000, 12, '6 spots left', '6/12', 'Mar 8, 2025', 'Wakanda Gardens', 'active'),
('a0000004-0000-0000-0000-000000000004', 'Sahel Highlife & Palm Wine Night', '2025-03-15', '20:00', 'Tamale Central Market Square', 12000, 60, '40 spots left', '20/60', 'Mar 15, 2025', 'Tamale Central Market Square', 'active')
ON CONFLICT (id) DO NOTHING;

-- PROMOTIONS
INSERT INTO promotions (id, code, name, description, discount_type, discount_value, max_uses, current_uses, status) VALUES
('a0000005-0000-0000-0000-000000000001', 'WELCOME15', 'First Order Discount', '15% off first food order', 'percentage', 15, 2000, 1247, 'active'),
('a0000005-0000-0000-0000-000000000002', 'VALENTINE25', 'Valentine Special', '25% off bookings Feb 14-16', 'percentage', 25, 500, 342, 'active'),
('a0000005-0000-0000-0000-000000000003', 'FREEDelivery', 'Free Delivery Weekend', 'Free delivery above 5,000 NGN', 'percentage', 100, 1000, 890, 'active'),
('a0000005-0000-0000-0000-000000000004', 'SUMMER2024', 'Summer Promo', '20% off venue bookings', 'percentage', 20, 500, 500, 'expired'),
('a0000005-0000-0000-0000-000000000005', 'LOYALTY10', 'Loyalty Reward', '10% off for loyalty members', 'percentage', 10, 5000, 2100, 'active')
ON CONFLICT (id) DO NOTHING;

-- VENDOR APPLICATIONS
INSERT INTO vendor_applications (id, business_name, business_type, owner_name, owner_email, documents, status) VALUES
('a0000006-0000-0000-0000-000000000001', 'The Smoke House', 'Restaurant', 'Emeka Nwankwo', 'emeka@smokehouse.com', '{Business Reg,Tax ID,Health Cert}', 'pending'),
('a0000006-0000-0000-0000-000000000002', 'Coastal Breeze', 'Restaurant', 'Amina Bello', 'amina@coastal.com', '{Business Reg,Tax ID}', 'pending'),
('a0000006-0000-0000-0000-000000000003', 'Lagos Event Hub', 'Venue', 'Segun Adeyinka', 'segun@lagosevents.com', '{Business Reg,Tax ID,Fire Safety}', 'pending'),
('a0000006-0000-0000-0000-000000000004', 'QuickBite Express', 'Cloud Kitchen', 'Funke Alade', 'funke@quickbite.com', '{Business Reg}', 'pending'),
('a0000006-0000-0000-0000-000000000005', 'The Wine Cellar', 'Bar/Lounge', 'Obi Nwosu', 'obi@winecellar.com', '{Business Reg,Tax ID,Liquor License}', 'pending')
ON CONFLICT (id) DO NOTHING;
