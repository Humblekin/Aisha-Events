-- =============================================
-- Aisha Events Centre — Seed Data
-- Run AFTER the schema has been created
-- =============================================

-- =============================================
-- RESTAURANTS
-- =============================================
INSERT INTO restaurants (id, name, cuisine, rating, price_range, location, tables_count, tags, revenue, status) VALUES
('a0000001-0000-0000-0000-000000000001', 'The Golden Palm', 'African Fusion', 4.9, '$$$', 'Victoria Island', 18, '{Fine Dining,African}', '4200000', 'active'),
('a0000001-0000-0000-0000-000000000002', 'Saffron Lounge', 'Mediterranean', 4.8, '$$$', 'Ikoyi', 14, '{Mediterranean,Lounge}', '3800000', 'active'),
('a0000001-0000-0000-0000-000000000003', 'Ember & Oak', 'Contemporary Grill', 4.7, '$$', 'Lekki', 22, '{Grill,Steakhouse}', '2900000', 'active'),
('a0000001-0000-0000-0000-000000000004', 'Jasmine Terrace', 'Asian Fusion', 4.8, '$$$', 'Lagos Island', 10, '{Asian,Rooftop}', '3100000', 'active'),
('a0000001-0000-0000-0000-000000000005', 'La Dolce Vita', 'Italian', 4.6, '$$', 'Banana Island', 16, '{Italian,Romantic}', '2400000', 'active'),
('a0000001-0000-0000-0000-000000000006', 'Savanna Kitchen', 'West African', 4.9, '$$', 'Yaba', 24, '{African,Casual}', '5100000', 'active'),
('a0000001-0000-0000-0000-000000000007', 'The Smoke House', 'BBQ & Grill', 0, '$$', 'Lekki', 20, '{BBQ,Grill}', null, 'pending'),
('a0000001-0000-0000-0000-000000000008', 'Coastal Breeze', 'Seafood', 0, '$$$', 'Victoria Island', 12, '{Seafood,Fine Dining}', null, 'pending'),
('a0000001-0000-0000-0000-000000000009', 'Le Petit Bistro', 'French', 4.4, '$$$', 'Ikoyi', 8, '{French,Romantic}', '1600000', 'inactive'),
('a0000001-0000-0000-0000-00000000000a', 'Spice Route', 'Indian', 4.7, '$$', 'Lagos Island', 14, '{Indian,Casual}', '2200000', 'active');

-- =============================================
-- VENUES
-- =============================================
INSERT INTO venues (id, name, type, capacity, price_per_event, badge, bookings_count, status) VALUES
('a0000002-0000-0000-0000-000000000001', 'The Grand Ballroom', 'Wedding Hall', 500, 2500000, 'Premium', 42, 'active'),
('a0000002-0000-0000-0000-000000000002', 'Skyline Terrace', 'Rooftop', 200, 1200000, 'Popular', 68, 'active'),
('a0000002-0000-0000-0000-000000000003', 'The Boardroom', 'Conference', 80, 450000, 'Corporate', 115, 'active'),
('a0000002-0000-0000-0000-000000000004', 'Garden Pavilion', 'Outdoor', 350, 1800000, 'New', 31, 'active'),
('a0000002-0000-0000-0000-000000000005', 'Royal Banquet Hall', 'Wedding Hall', 600, 3200000, 'Premium', 28, 'active'),
('a0000002-0000-0000-0000-000000000006', 'The Loft Studio', 'Lounge', 120, 800000, 'Popular', 54, 'active'),
('a0000002-0000-0000-0000-000000000007', 'Lakeside Retreat', 'Outdoor', 250, 1500000, 'New', 0, 'maintenance'),
('a0000002-0000-0000-0000-000000000008', 'Summit Conference', 'Conference', 150, 650000, 'Corporate', 89, 'active');

-- =============================================
-- MENU ITEMS
-- =============================================
INSERT INTO menu_items (id, name, description, price, category, prep_time, restaurant_id, orders_count, rating, restaurant_name, status) VALUES
('a0000003-0000-0000-0000-000000000001', 'Grilled Lobster Tail', 'Butter-poached with herbs and citrus', 18500, 'Main Course', 25, 'a0000001-0000-0000-0000-000000000001', 342, 4.9, 'The Golden Palm', 'active'),
('a0000003-0000-0000-0000-000000000002', 'Wagyu Beef Tenderloin', 'Truffle jus, roasted vegetables', 25000, 'Main Course', 30, 'a0000001-0000-0000-0000-000000000003', 218, 4.8, 'Ember & Oak', 'active'),
('a0000003-0000-0000-0000-000000000003', 'Jollof Rice Platter', 'Smoky party jollof with grilled chicken', 6500, 'Main Course', 20, 'a0000001-0000-0000-0000-000000000006', 1247, 4.9, 'Savanna Kitchen', 'active'),
('a0000003-0000-0000-0000-000000000004', 'Sushi Deluxe Box', 'Assorted nigiri, maki, sashimi', 14000, 'Main Course', 22, 'a0000001-0000-0000-0000-000000000004', 189, 4.7, 'Jasmine Terrace', 'active'),
('a0000003-0000-0000-0000-000000000005', 'Pasta Carbonara', 'Creamy egg-based with pancetta', 8200, 'Main Course', 18, 'a0000001-0000-0000-0000-000000000005', 456, 4.6, 'La Dolce Vita', 'active'),
('a0000003-0000-0000-0000-000000000006', 'Suya Skewers', 'Spicy peanut-crusted beef strips', 4800, 'Appetizers', 15, 'a0000001-0000-0000-0000-000000000006', 890, 4.7, 'Savanna Kitchen', 'active'),
('a0000003-0000-0000-0000-000000000007', 'Caesar Salad', 'Crispy romaine, parmesan, croutons', 5500, 'Appetizers', 10, 'a0000001-0000-0000-0000-000000000002', 678, 4.5, 'Saffron Lounge', 'active'),
('a0000003-0000-0000-0000-000000000008', 'Chocolate Lava Cake', 'Warm molten center, vanilla ice cream', 4200, 'Desserts', 12, 'a0000001-0000-0000-0000-000000000001', 523, 4.8, 'The Golden Palm', 'active');

-- =============================================
-- EVENTS
-- =============================================
INSERT INTO events (id, name, event_date, event_time, location, price, capacity, spots, registered, full_date, venue_name, status) VALUES
('a0000004-0000-0000-0000-000000000001', 'Moonlit Dinner Under the Sahel Sky', '2025-02-14', '19:00', 'Radach Hotel & Conference Centre', 35000, 80, '12 spots left', '68/80', 'Feb 14, 2025', 'Radach Hotel & Conference Centre', 'active'),
('a0000004-0000-0000-0000-000000000002', 'TZ & Afrobeats Brunch', '2025-02-22', '11:00', 'Tamarind Gardens', 15000, 120, '28 spots left', '92/120', 'Feb 22, 2025', 'Tamarind Gardens', 'active'),
('a0000004-0000-0000-0000-000000000003', 'Savannah Chef''s Table: Heritage Tasting', '2025-03-08', '18:30', 'Wakanda Gardens', 75000, 12, '6 spots left', '6/12', 'Mar 8, 2025', 'Wakanda Gardens', 'active'),
('a0000004-0000-0000-0000-000000000004', 'Sahel Highlife & Palm Wine Night', '2025-03-15', '20:00', 'Tamale Central Market Square', 12000, 60, '40 spots left', '20/60', 'Mar 15, 2025', 'Tamale Central Market Square', 'active');

-- =============================================
-- PROMOTIONS
-- =============================================
INSERT INTO promotions (id, code, name, description, discount_type, discount_value, max_uses, current_uses, status) VALUES
('a0000005-0000-0000-0000-000000000001', 'WELCOME15', 'First Order Discount', '15% off first food order', 'percentage', 15, 2000, 1247, 'active'),
('a0000005-0000-0000-0000-000000000002', 'VALENTINE25', 'Valentine Special', '25% off bookings Feb 14-16', 'percentage', 25, 500, 342, 'active'),
('a0000005-0000-0000-0000-000000000003', 'FREEDelivery', 'Free Delivery Weekend', 'Free delivery above 5,000 NGN', 'percentage', 100, 1000, 890, 'active'),
('a0000005-0000-0000-0000-000000000004', 'SUMMER2024', 'Summer Promo', '20% off venue bookings', 'percentage', 20, 500, 500, 'expired'),
('a0000005-0000-0000-0000-000000000005', 'LOYALTY10', 'Loyalty Reward', '10% off for loyalty members', 'percentage', 10, 5000, 2100, 'active');

-- =============================================
-- VENDOR APPLICATIONS
-- =============================================
INSERT INTO vendor_applications (id, business_name, business_type, owner_name, owner_email, documents, status) VALUES
('a0000006-0000-0000-0000-000000000001', 'The Smoke House', 'Restaurant', 'Emeka Nwankwo', 'emeka@smokehouse.com', '{Business Reg,Tax ID,Health Cert}', 'pending'),
('a0000006-0000-0000-0000-000000000002', 'Coastal Breeze', 'Restaurant', 'Amina Bello', 'amina@coastal.com', '{Business Reg,Tax ID}', 'pending'),
('a0000006-0000-0000-0000-000000000003', 'Lagos Event Hub', 'Venue', 'Segun Adeyinka', 'segun@lagosevents.com', '{Business Reg,Tax ID,Fire Safety}', 'pending'),
('a0000006-0000-0000-0000-000000000004', 'QuickBite Express', 'Cloud Kitchen', 'Funke Alade', 'funke@quickbite.com', '{Business Reg}', 'pending'),
('a0000006-0000-0000-0000-000000000005', 'The Wine Cellar', 'Bar/Lounge', 'Obi Nwosu', 'obi@winecellar.com', '{Business Reg,Tax ID,Liquor License}', 'pending');

-- =============================================
-- COMPLAINTS (references dummy user UUIDs)
-- =============================================
INSERT INTO complaints (id, user_id, subject, priority, status) VALUES
('a0000007-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Late delivery — waited 90 minutes', 'High', 'open'),
('a0000007-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'Wrong order delivered', 'High', 'in-progress'),
('a0000007-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'Venue not as advertised', 'Medium', 'open'),
('a0000007-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', 'Payment deducted twice', 'Critical', 'resolved'),
('a0000007-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005', 'Rude restaurant staff', 'Medium', 'resolved');

-- =============================================
-- NOTIFICATIONS
-- =============================================
INSERT INTO notifications (id, user_id, title, message, type, is_read) VALUES
('a0000008-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'New Vendor Application', 'The Smoke House applied to join the platform.', 'vendor', false),
('a0000008-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'High-Value Booking', 'Ibrahim Musa booked Grand Ballroom for 2,500,000 NGN.', 'booking', false),
('a0000008-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Payment Failed', 'TXN-982337 for Tunde Bakare failed.', 'payment', false),
('a0000008-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'New Complaint', 'Adaeze Okonkwo reported late delivery.', 'complaint', true),
('a0000008-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Daily Revenue Report', 'Yesterday: 1,850,000 NGN across 47 transactions.', 'report', true),
('a0000008-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'System Update Complete', 'Platform v2.4.1 deployed. New: QR menus.', 'system', true);

-- =============================================
-- NOTES
-- =============================================
-- Profiles, Bookings, Orders, Payments, Commissions require real auth.users
-- to exist first. After you create users via Supabase Auth, you can seed:
--   - profiles (auto-created via trigger)
--   - bookings (references profiles.id)
--   - orders (references profiles.id)
--   - payments (references profiles.id)
--   - commissions (references profiles.id)
--
-- The user_id references above use placeholder UUIDs — update them to
-- match your actual auth.users IDs after users sign up.
