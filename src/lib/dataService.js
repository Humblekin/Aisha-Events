import {
  supabase,
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  createBooking,
  updateBooking,
  deleteBooking,
  createOrder,
  updateOrder,
  deleteOrder,
  getRestaurants,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getVenues,
  createVenue,
  updateVenue,
  deleteVenue,
  getMeals,
  createMeal,
  updateMeal,
  deleteMeal,
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  createPromotion,
  updatePromotion,
  deletePromotion,
  createNotification,
  createComplaint,
  updateComplaint,
  deleteComplaint,
  uploadImage,
} from "./supabase";
import { sanitizeObject, sanitizeText } from "./sanitize";
import * as mock from "../data/mockData";

const mockRestaurants = [...mock.restaurants];
const mockVenues = [...mock.venues];
const mockMeals = [...mock.meals];
const mockEvents = [...mock.events];
const mockUsers = [...mock.users];
const mockOrders = [...mock.orders];
const mockBookings = [...mock.bookings];
const mockPayments = [...mock.payments];
const mockPromotions = [...mock.promotions];
const mockComplaints = [...mock.complaints];
const mockNotifications = [...mock.notifications];
const mockActivities = [...mock.activities];
const mockRecentBookings = [...mock.recentBookings];

let _useMockData = false;
const _refreshHandlers = new Set();

export function setUseMockData(val) {
  _useMockData = val;
}

export function subscribeRefresh(fn) {
  _refreshHandlers.add(fn);
  return () => _refreshHandlers.delete(fn);
}

function notifyRefresh() {
  _refreshHandlers.forEach((fn) => fn());
}

const isConfigured = () => {
  if (_useMockData) return false;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return !!(url && key && url !== "https://your-project.supabase.co");
};

const makeId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

const nameToSeed = (name) =>
  name
    ? name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
    : "placeholder";

const supabaseFetch = async (fetchFn, mockData) => {
  if (!isConfigured()) return mockData;
  try {
    const data = await fetchFn();
    return data && data.length ? data : mockData;
  } catch {
    return mockData;
  }
};

// ---- FIELD MAPPERS (Supabase snake_case → frontend format) ----
const sanitizeImg = (url) =>
  !url || url === "null" || url === "undefined" ? "" : url;

const mapRestaurant = (r) => ({
  id: r.id,
  name: r.name,
  cuisine: r.cuisine,
  rating: r.rating || 0,
  price: r.price_range || "$$",
  img: sanitizeImg(r.image_url),
  tags: r.tags || [],
  location: r.location,
  tables: r.tables_count || 10,
  revenue: r.revenue || "\u2014",
  status: r.status || "active",
});

const mapVenue = (v) => ({
  id: v.id,
  name: v.name,
  type: v.type,
  capacity: v.capacity || 0,
  price: v.price_per_event ? v.price_per_event.toLocaleString() : "0",
  img: sanitizeImg(v.image_url),
  badge: v.badge,
  bookings: v.bookings_count || 0,
  status: v.status || "active",
});

const mapMeal = (m) => ({
  id: m.id,
  name: m.name,
  desc: m.description,
  price: m.price ? m.price.toLocaleString() : "0",
  time: m.prep_time ? `${m.prep_time} min` : "15 min",
  img: sanitizeImg(m.image_url),
  category: m.category,
  restaurant: m.restaurants?.name || m.restaurant_name || "",
  restaurant_id: m.restaurant_id,
  orders: m.orders_count || 0,
  rating: m.rating || 0,
  status: m.status || "active",
});

const mapEvent = (e) => {
  const d = e.event_date ? new Date(e.event_date) : new Date();
  return {
    id: e.id,
    name: e.name,
    date: {
      day: String(d.getDate()),
      month: d.toLocaleString("en", { month: "short" }),
    },
    time: e.event_time || "7:00 PM",
    location: e.location,
    price: e.price ? e.price.toLocaleString() : "0",
    spots: e.spots || `${e.capacity || 0} spots`,
    img: sanitizeImg(e.image_url),
    fullDate: e.full_date || e.event_date,
    venue: e.venue_name,
    capacity: e.capacity || 0,
    registered: e.registered || `0/${e.capacity || 0}`,
    event_date: e.event_date,
    status: e.status || "active",
  };
};

const mapBooking = (b) => ({
  id: b.id,
  guest: b.guest_name || "",
  type: b.booking_type || "Restaurant",
  service: b.service_name || "",
  dateTime: b.booking_date
    ? `${b.booking_date}${b.booking_time ? ", " + b.booking_time : ""}`
    : "",
  guests: b.guests || 1,
  amount: b.amount ? b.amount.toLocaleString() : "0",
  status: b.status || "pending",
  vip_package: b.vip_package || "",
  vip_occasion: b.vip_occasion || "",
});

const mapOrder = (o) => ({
  id: o.id || o.order_number,
  customer: o.customer_name || "",
  items:
    typeof o.items === "string"
      ? o.items
      : Array.isArray(o.items)
        ? o.items.map((i) => i.name || i).join(", ")
        : "",
  total: o.total ? o.total.toLocaleString() : "0",
  type: o.type || "Delivery",
  status: o.status || "Pending",
});

const mapPayment = (p) => ({
  id: p.id,
  customer: p.customer_name || "",
  service: p.service_name || "",
  amount: p.amount ? p.amount.toLocaleString() : "0",
  method: p.method || "Paystack",
  date: p.created_at
    ? new Date(p.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "",
  status: p.status || "pending",
});

const mapUser = (u) => ({
  id: u.id,
  name: `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.name || "",
  email: u.email || "",
  role: u.role || "Customer",
  joined: u.created_at
    ? new Date(u.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "",
  bookings: u.bookings || 0,
  spent: u.spent ? u.spent.toLocaleString() : "\u2014",
  status: u.status || "active",
});

// ---- FIELD REVERSE MAPPERS (frontend → Supabase snake_case) ----
const sanitizeFormText = (v) => (typeof v === "string" ? sanitizeText(v) : v);

const unmapRestaurant = (r) => ({
  name: sanitizeFormText(r.name),
  cuisine: sanitizeFormText(r.cuisine),
  rating: r.rating || 0,
  price_range: sanitizeFormText(r.price) || "$$",
  image_url: r.image_url || r.img,
  tags: Array.isArray(r.tags) ? r.tags.map(sanitizeFormText) : [],
  location: sanitizeFormText(r.location),
  tables_count: r.tables || 10,
  revenue: r.revenue || null,
  status: sanitizeFormText(r.status) || "active",
});

const unmapVenue = (v) => ({
  name: sanitizeFormText(v.name),
  type: sanitizeFormText(v.type),
  capacity: v.capacity || 0,
  price_per_event:
    v.price_per_event || parseFloat(String(v.price).replace(/,/g, "")) || 0,
  image_url: v.image_url || v.img,
  badge: sanitizeFormText(v.badge),
  bookings_count: v.bookings || 0,
  status: sanitizeFormText(v.status) || "active",
});

const unmapMeal = (m) => ({
  name: sanitizeFormText(m.name),
  description: sanitizeFormText(m.desc),
  price: parseFloat(String(m.price).replace(/,/g, "")) || 0,
  prep_time: parseInt(m.time) || 15,
  image_url: m.image_url || m.img,
  category: sanitizeFormText(m.category),
  restaurant_id: m.restaurant_id,
  orders_count: m.orders || 0,
  rating: m.rating || 0,
  status: sanitizeFormText(m.status) || "active",
});

const unmapEvent = (e) => ({
  name: sanitizeFormText(e.name),
  event_date: e.event_date || e.fullDate,
  event_time: sanitizeFormText(e.event_time || e.time) || "7:00 PM",
  location: sanitizeFormText(e.location),
  price: parseFloat(String(e.price).replace(/,/g, "")) || 0,
  capacity: e.capacity || 0,
  image_url: e.image_url || e.img,
  venue_name: sanitizeFormText(e.venue),
  status: sanitizeFormText(e.status) || "active",
});

const extractImageUrl = (formData) => formData.image_url || formData.img || "";

export const dataService = {
  isConfigured,
  setUseMockData,

  // ---- IMAGE UPLOAD ----
  async uploadImage(folder, file) {
    if (!isConfigured()) return nameToSeed(file.name);
    try {
      return await uploadImage(folder, file);
    } catch {
      return nameToSeed(file.name);
    }
  },

  // ---- AUTH ----
  async signUp(email, password, userData) {
    if (!isConfigured()) return { user: { email, ...userData } };
    return signUp(email, password, userData);
  },

  async signIn(email, password) {
    if (!isConfigured()) return { user: { email } };
    return signIn(email, password);
  },

  async signOut() {
    if (isConfigured()) await signOut();
  },

  async getCurrentUser() {
    if (!isConfigured()) return null;
    return getCurrentUser();
  },

  async getSession() {
    if (!isConfigured()) return null;
    return supabase.auth.getSession().then((r) => r.data?.session || null);
  },

  // ---- RESTAURANTS ----
  async fetchRestaurants() {
    const data = await supabaseFetch(getRestaurants, mockRestaurants);
    return data.map?.(mapRestaurant) || data;
  },

  async createRestaurant(formData) {
    const data = unmapRestaurant({
      ...formData,
      image_url: extractImageUrl(formData),
    });
    if (!data.image_url) data.image_url = nameToSeed(data.name || "restaurant");
    if (!isConfigured()) {
      const record = { ...data, id: makeId("r") };
      mockRestaurants.unshift(record);
      notifyRefresh();
      return record;
    }
    const result = await createRestaurant(data);
    notifyRefresh();
    return result;
  },

  async updateRestaurant(id, formData) {
    if (!isConfigured()) {
      const idx = mockRestaurants.findIndex((r) => r.id === id);
      if (idx !== -1) {
        Object.assign(
          mockRestaurants[idx],
          unmapRestaurant({
            ...formData,
            image_url: extractImageUrl(formData),
          }),
        );
        notifyRefresh();
        return mockRestaurants[idx];
      }
      return formData;
    }
    const data = unmapRestaurant({
      ...formData,
      image_url: extractImageUrl(formData),
    });
    const result = await updateRestaurant(id, data);
    notifyRefresh();
    return result;
  },

  async deleteRestaurant(id) {
    if (!isConfigured()) {
      const idx = mockRestaurants.findIndex((r) => r.id === id);
      if (idx !== -1) mockRestaurants.splice(idx, 1);
      notifyRefresh();
      return;
    }
    await deleteRestaurant(id);
    notifyRefresh();
  },

  // ---- VENUES ----
  async fetchVenues() {
    const data = await supabaseFetch(getVenues, mockVenues);
    return data.map?.(mapVenue) || data;
  },

  async createVenue(formData) {
    const data = unmapVenue({
      ...formData,
      image_url: extractImageUrl(formData),
    });
    if (!data.image_url) data.image_url = nameToSeed(data.name || "venue");
    if (!isConfigured()) {
      const record = { ...data, id: makeId("v") };
      mockVenues.unshift(record);
      notifyRefresh();
      return record;
    }
    const result = await createVenue(data);
    notifyRefresh();
    return result;
  },

  async updateVenue(id, formData) {
    if (!isConfigured()) {
      const idx = mockVenues.findIndex((v) => v.id === id);
      if (idx !== -1) {
        Object.assign(
          mockVenues[idx],
          unmapVenue({ ...formData, image_url: extractImageUrl(formData) }),
        );
        notifyRefresh();
        return mockVenues[idx];
      }
      return formData;
    }
    const data = unmapVenue({
      ...formData,
      image_url: extractImageUrl(formData),
    });
    const result = await updateVenue(id, data);
    notifyRefresh();
    return result;
  },

  async deleteVenue(id) {
    if (!isConfigured()) {
      const idx = mockVenues.findIndex((v) => v.id === id);
      if (idx !== -1) mockVenues.splice(idx, 1);
      notifyRefresh();
      return;
    }
    await deleteVenue(id);
    notifyRefresh();
  },

  // ---- MEALS ----
  async fetchMeals() {
    const data = await supabaseFetch(getMeals, mockMeals);
    return data.map?.(mapMeal) || data;
  },

  async createMeal(formData) {
    const data = unmapMeal({
      ...formData,
      image_url: extractImageUrl(formData),
    });
    if (!data.image_url) data.image_url = nameToSeed(data.name || "meal");
    if (!isConfigured()) {
      const record = { ...data, id: makeId("m") };
      mockMeals.unshift(record);
      notifyRefresh();
      return record;
    }
    const result = await createMeal(data);
    notifyRefresh();
    return result;
  },

  async updateMeal(id, formData) {
    if (!isConfigured()) {
      const idx = mockMeals.findIndex((m) => m.id === id);
      if (idx !== -1) {
        Object.assign(
          mockMeals[idx],
          unmapMeal({ ...formData, image_url: extractImageUrl(formData) }),
        );
        notifyRefresh();
        return mockMeals[idx];
      }
      return formData;
    }
    const data = unmapMeal({
      ...formData,
      image_url: extractImageUrl(formData),
    });
    const result = await updateMeal(id, data);
    notifyRefresh();
    return result;
  },

  async deleteMeal(id) {
    if (!isConfigured()) {
      const idx = mockMeals.findIndex((m) => m.id === id);
      if (idx !== -1) mockMeals.splice(idx, 1);
      notifyRefresh();
      return;
    }
    await deleteMeal(id);
    notifyRefresh();
  },

  // ---- EVENTS ----
  async fetchEvents() {
    const data = await supabaseFetch(getEvents, mockEvents);
    return data.map?.(mapEvent) || data;
  },

  async createEvent(formData) {
    const data = unmapEvent({
      ...formData,
      image_url: extractImageUrl(formData),
    });
    if (!data.image_url) data.image_url = nameToSeed(data.name || "event");
    if (!isConfigured()) {
      const record = { ...data, id: makeId("e") };
      mockEvents.unshift(record);
      notifyRefresh();
      return record;
    }
    const result = await createEvent(data);
    notifyRefresh();
    return result;
  },

  async updateEvent(id, formData) {
    if (!isConfigured()) {
      const idx = mockEvents.findIndex((e) => e.id === id);
      if (idx !== -1) {
        Object.assign(
          mockEvents[idx],
          unmapEvent({ ...formData, image_url: extractImageUrl(formData) }),
        );
        notifyRefresh();
        return mockEvents[idx];
      }
      return formData;
    }
    const data = unmapEvent({
      ...formData,
      image_url: extractImageUrl(formData),
    });
    const result = await updateEvent(id, data);
    notifyRefresh();
    return result;
  },

  async deleteEvent(id) {
    if (!isConfigured()) {
      const idx = mockEvents.findIndex((e) => e.id === id);
      if (idx !== -1) mockEvents.splice(idx, 1);
      notifyRefresh();
      return;
    }
    await deleteEvent(id);
    notifyRefresh();
  },

  // ---- BOOKINGS ----
  async fetchBookings() {
    if (!isConfigured()) return mockBookings.map(mapBooking);
    try {
      const { data } = await supabase
        .from("bookings")
        .select("*, profiles(first_name, last_name)")
        .order("created_at", { ascending: false });
      return (data || []).map(mapBooking);
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
      return mockBookings.map(mapBooking);
    }
  },

  async addBooking(bookingData) {
    const safeData = sanitizeObject(bookingData);
    if (isConfigured()) {
      try {
        const result = await createBooking(safeData);
        notifyRefresh();
        return result;
      } catch { /* fall through to mock storage */ }
    }
    const record = { ...safeData, id: `BK-${Date.now()}` };
    mockBookings.unshift(record);
    notifyRefresh();
    return record;
  },

  async updateBooking(id, data) {
    if (isConfigured()) {
      try {
        return await updateBooking(id, data);
      } catch {
        return null;
      }
    }
    return null;
  },

  async deleteBooking(id) {
    const idx = mockBookings.findIndex((b) => b.id === id);
    if (idx !== -1) {
      mockBookings.splice(idx, 1);
      notifyRefresh();
    }
    if (isConfigured()) {
      try {
        await deleteBooking(id);
      } catch {
        /* ignore delete error */
      }
    }
  },

  // ---- ORDERS ----
  async fetchOrders() {
    if (!isConfigured()) return mockOrders.map(mapOrder);
    try {
      const { data } = await supabase
        .from("orders")
        .select("*, profiles(first_name, last_name)")
        .order("created_at", { ascending: false });
      return (data || []).map(mapOrder);
    } catch (err) {
      console.error("Fatal error fetching orders:", err);
      return mockOrders.map(mapOrder);
    }
  },

  async addOrder(orderData) {
    const safeData = sanitizeObject(orderData);
    const enrichedData = {
      ...safeData,
      order_number:
        safeData.order_number ||
        `ORD-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`,
    };
    if (isConfigured()) {
      try {
        const result = await createOrder(enrichedData);
        notifyRefresh();
        return result;
      } catch { /* fall through to mock storage */ }
    }
    const record = { ...enrichedData, id: enrichedData.order_number };
    mockOrders.unshift(record);
    notifyRefresh();
    return record;
  },

  async updateOrder(id, data) {
    const rawStatus = data.status || "";
    let mappedStatus = rawStatus.toLowerCase();
    if (mappedStatus === "in transit") {
      mappedStatus = "in_transit";
    }
    const enrichedData = {
      ...data,
      status: mappedStatus || undefined,
    };

    if (isConfigured()) {
      try {
        const result = await updateOrder(id, enrichedData);
        const orderRec = result?.[0] || result;
        if (enrichedData.status === "delivered" && orderRec) {
          const { data: existingPay, error: payError } = await supabase
            .from("payments")
            .update({ status: "completed" })
            .eq("order_id", id)
            .select();

          if (!payError && (!existingPay || existingPay.length === 0)) {
            await supabase.from("payments").insert([
              {
                user_id: orderRec.user_id,
                order_id: id,
                amount: parseFloat(orderRec.total) || 0,
                currency: "GHS",
                method: "cash",
                reference: `REF-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
                status: "completed",
                customer_name: orderRec.customer_name || "Guest",
                service_name: `Food Order (${orderRec.type || "delivery"})`,
              },
            ]);
          }
        }
        notifyRefresh();
        return orderRec;
      } catch (err) {
        console.error("Failed to update order in Supabase:", err);
        return null;
      }
    }
    const idx = mockOrders.findIndex((o) => o.id === id);
    if (idx !== -1) {
      Object.assign(mockOrders[idx], enrichedData);
      const orderRec = mockOrders[idx];
      if (enrichedData.status === "delivered") {
        const payIdx = mockPayments.findIndex((p) => p.order_id === id);
        if (payIdx !== -1) {
          mockPayments[payIdx].status = "completed";
        } else {
          mockPayments.unshift({
            id: `PAY-${Date.now()}`,
            user_id: orderRec.user_id,
            order_id: id,
            amount: parseFloat(orderRec.total) || 0,
            currency: "GHS",
            method: "cash",
            reference: `REF-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
            status: "completed",
            customer_name: orderRec.customer_name || "Guest",
            service_name: `Food Order (${orderRec.type || "delivery"})`,
            created_at: new Date().toISOString(),
          });
        }
      }
      notifyRefresh();
      return mockOrders[idx];
    }
    return null;
  },

  async deleteOrder(id) {
    const idx = mockOrders.findIndex((o) => o.id === id);
    if (idx !== -1) {
      mockOrders.splice(idx, 1);
      notifyRefresh();
    }
    if (isConfigured()) {
      try {
        await deleteOrder(id);
      } catch {
        /* ignore delete error */
      }
    }
  },

  // ---- USERS ----
  async fetchUsers() {
    if (!isConfigured()) return mockUsers.map(mapUser);
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*, auth.users(email)")
        .order("created_at", { ascending: false });
      const supabaseData = (data || []).map(mapUser);
      const mockMapped = mockUsers.map(mapUser);
      const seen = new Set(supabaseData.map((u) => u.id));
      return [...supabaseData, ...mockMapped.filter((u) => !seen.has(u.id))];
    } catch {
      return mockUsers.map(mapUser);
    }
  },

  // ---- PAYMENTS ----
  async fetchPayments() {
    if (!isConfigured()) return mockPayments.map(mapPayment);
    try {
      const { data } = await supabase
        .from("payments")
        .select("*, profiles(first_name, last_name)")
        .order("created_at", { ascending: false });
      return (data || []).map(mapPayment);
    } catch {
      return mockPayments.map(mapPayment);
    }
  },

  async addPayment(paymentData) {
    const safeData = sanitizeObject(paymentData);
    if (isConfigured()) {
      try {
        const { data } = await supabase.from("payments").insert([safeData]).select();
        if (data && data.length > 0) {
          notifyRefresh();
          return data[0];
        }
      } catch { /* fall through to mock storage */ }
    }
    const record = {
      ...safeData,
      id: `PAY-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    mockPayments.unshift(record);
    notifyRefresh();
    return record;
  },

  // ---- COMMISSIONS ----
  // ---- PROMOTIONS ----
  async fetchPromotions() {
    if (!isConfigured()) return mockPromotions;
    try {
      const { data } = await supabase
        .from("promotions")
        .select("*")
        .order("created_at", { ascending: false });
      return data && data.length
        ? data.map((p) => ({
            id: p.id,
            code: p.code,
            name: p.name || "",
            desc: p.description || "",
            uses: `${p.current_uses || 0} / ${p.max_uses || "-"}`,
            status: p.status || "active",
          }))
        : mockPromotions;
    } catch {
      return mockPromotions;
    }
  },

  async createPromotion(formData) {
    const safeData = {
      code: sanitizeText(formData.code || ""),
      name: sanitizeText(formData.name || ""),
      desc: sanitizeText(formData.desc || ""),
      discountType: formData.discountType || "percentage",
      value: formData.value,
      maxUses: formData.maxUses,
    };
    if (!isConfigured()) {
      const record = { ...safeData, id: makeId("promo") };
      mockPromotions.unshift(record);
      notifyRefresh();
      return record;
    }
    try {
      return await createPromotion({
        code: safeData.code,
        name: safeData.name,
        description: safeData.desc,
        discount_type: safeData.discountType,
        discount_value: safeData.value,
        max_uses: safeData.maxUses,
        current_uses: 0,
        status: "active",
      });
    } catch {
      return null;
    }
  },

  async updatePromotion(id, data) {
    if (!isConfigured()) {
      const idx = mockPromotions.findIndex((p) => p.id === id);
      if (idx !== -1) {
        Object.assign(mockPromotions[idx], data);
        notifyRefresh();
        return mockPromotions[idx];
      }
      return data;
    }
    try {
      return await updatePromotion(id, data);
    } catch {
      return null;
    }
  },

  async deletePromotion(id) {
    if (!isConfigured()) {
      const idx = mockPromotions.findIndex((p) => p.id === id);
      if (idx !== -1) mockPromotions.splice(idx, 1);
      notifyRefresh();
      return;
    }
    try {
      await deletePromotion(id);
    } catch {
      /* ignore delete error */
    }
  },

  // ---- COMPLAINTS ----
  async addComplaint(complaintData) {
    const safeData = sanitizeObject(complaintData);
    if (isConfigured()) {
      try {
        return await createComplaint(safeData);
      } catch {
        /* fall through to mock storage */
      }
    }
    const record = {
      ...safeData,
      id: `CMP-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    mockComplaints.unshift(record);
    notifyRefresh();
    return record;
  },

  async fetchComplaints() {
    const mapC = (c) => ({
      id: c.id,
      user:
        `${c.profiles?.first_name || ""} ${c.profiles?.last_name || ""}`.trim() ||
        c.user ||
        "",
      subject: c.subject,
      priority: c.priority || "Medium",
      date: c.created_at
        ? new Date(c.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "",
      status: c.status || "open",
    });
    if (!isConfigured()) return mockComplaints.map(mapC);
    try {
      const { data } = await supabase
        .from("complaints")
        .select("*, profiles(first_name, last_name)")
        .order("created_at", { ascending: false });
      const supData = (data || []).map(mapC);
      const mockMapped = mockComplaints.map(mapC);
      const seen = new Set(supData.map((c) => c.id));
      return [...supData, ...mockMapped.filter((c) => !seen.has(c.id))];
    } catch {
      return mockComplaints.map(mapC);
    }
  },

  async updateComplaint(id, data) {
    const safeData = sanitizeObject(data);
    if (isConfigured()) {
      try {
        return await updateComplaint(id, safeData);
      } catch {
        return null;
      }
    }
    return null;
  },

  async deleteComplaint(id) {
    const idx = mockComplaints.findIndex((c) => c.id === id);
    if (idx !== -1) {
      mockComplaints.splice(idx, 1);
      notifyRefresh();
    }
    if (isConfigured()) {
      try {
        await deleteComplaint(id);
      } catch {
        /* ignore delete error */
      }
    }
  },

  // ---- NOTIFICATIONS ----
  async fetchNotifications() {
    if (!isConfigured()) return mockNotifications;
    try {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });
      return data && data.length
        ? data.map((n) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            time: n.created_at
              ? new Date(n.created_at).toLocaleDateString()
              : "",
            icon: n.icon || "fa-bell",
            color: n.color || "var(--gold)",
            read: n.is_read || false,
          }))
        : mockNotifications;
    } catch {
      return mockNotifications;
    }
  },

  async createNotification(formData) {
    const safeData = {
      title: sanitizeText(formData.title || ""),
      message: sanitizeText(formData.message || ""),
      icon: formData.icon || "fa-bell",
      color: formData.color || "var(--gold)",
      target: formData.target || "all",
      is_read: false,
    };
    if (!isConfigured()) return safeData;
    try {
      return await createNotification(safeData);
    } catch {
      return null;
    }
  },

  // ---- ACTIVITIES ----
  fetchActivities() {
    return mockActivities;
  },

  // ---- RECENT BOOKINGS ----
  async fetchRecentBookings() {
    const mapRb = (b) => ({
      guest: b.guest_name || "",
      service: b.service_name || "",
      date: b.booking_date || "",
      amount: b.amount ? b.amount.toLocaleString() : "0",
      status: b.status || "pending",
    });
    if (!isConfigured()) return mockRecentBookings.map(mapRb);
    try {
      const { data } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      const supData = (data || []).map(mapRb);
      const mockMapped = mockRecentBookings.map(mapRb);
      const combined = [...supData, ...mockMapped].slice(0, 5);
      return combined;
    } catch {
      return mockRecentBookings.map(mapRb);
    }
  },
};
