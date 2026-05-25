import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Ensure session is recovered on page load
supabase.auth.getSession()

// ---- AUTH ----
export async function signUp(email, password, userData) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: userData }
  })
  if (error) throw error
  return data
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data?.session || null
}

// ---- IMAGE UPLOAD ----
const STORAGE_BUCKET = 'aisha-images'

export async function uploadImage(folder, file) {
  const ext = file.name.split('.').pop()
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file)
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  return publicUrl
}

export async function deleteImage(path) {
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([path])
  if (error) throw error
}

// ---- RESTAURANTS ----
export async function getRestaurants() {
  const { data, error } = await supabase.from('restaurants').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createRestaurant(data) {
  const { data: result, error } = await supabase.from('restaurants').insert([data]).select()
  if (error) throw error
  return result?.[0]
}

export async function updateRestaurant(id, data) {
  const { data: result, error } = await supabase.from('restaurants').update(data).eq('id', id).select()
  if (error) throw error
  return result?.[0]
}

export async function deleteRestaurant(id) {
  const { error } = await supabase.from('restaurants').delete().eq('id', id)
  if (error) throw error
}

// ---- VENUES ----
export async function getVenues() {
  const { data, error } = await supabase.from('venues').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createVenue(data) {
  const { data: result, error } = await supabase.from('venues').insert([data]).select()
  if (error) throw error
  return result?.[0]
}

export async function updateVenue(id, data) {
  const { data: result, error } = await supabase.from('venues').update(data).eq('id', id).select()
  if (error) throw error
  return result?.[0]
}

export async function deleteVenue(id) {
  const { error } = await supabase.from('venues').delete().eq('id', id)
  if (error) throw error
}

// ---- MENU ITEMS ----
export async function getMeals() {
  const { data, error } = await supabase.from('menu_items').select('*, restaurants(name)').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createMeal(data) {
  const { data: result, error } = await supabase.from('menu_items').insert([data]).select()
  if (error) throw error
  return result?.[0]
}

export async function updateMeal(id, data) {
  const { data: result, error } = await supabase.from('menu_items').update(data).eq('id', id).select()
  if (error) throw error
  return result?.[0]
}

export async function deleteMeal(id) {
  const { error } = await supabase.from('menu_items').delete().eq('id', id)
  if (error) throw error
}

// ---- EVENTS ----
export async function getEvents() {
  const { data, error } = await supabase.from('events').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createEvent(data) {
  const { data: result, error } = await supabase.from('events').insert([data]).select()
  if (error) throw error
  return result?.[0]
}

export async function updateEvent(id, data) {
  const { data: result, error } = await supabase.from('events').update(data).eq('id', id).select()
  if (error) throw error
  return result?.[0]
}

export async function deleteEvent(id) {
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) throw error
}

// ---- BOOKINGS ----
export async function createBooking(bookingData) {
  const { data, error } = await supabase.from('bookings').insert([bookingData]).select()
  if (error) throw error
  return data
}

export async function updateBooking(id, data) {
  const { data: result, error } = await supabase.from('bookings').update(data).eq('id', id).select()
  if (error) throw error
  return result?.[0]
}

export async function deleteBooking(id) {
  const { error } = await supabase.from('bookings').delete().eq('id', id)
  if (error) throw error
}

// ---- ORDERS ----
export async function createOrder(orderData) {
  const { data, error } = await supabase.from('orders').insert([orderData]).select()
  if (error) throw error
  return data
}

export async function updateOrder(id, data) {
  const { data: result, error } = await supabase.from('orders').update(data).eq('id', id).select()
  if (error) throw error
  return result?.[0]
}

export async function deleteOrder(id) {
  const { error } = await supabase.from('orders').delete().eq('id', id)
  if (error) throw error
}

// ---- PROMOTIONS ----
export async function createPromotion(data) {
  const { data: result, error } = await supabase.from('promotions').insert([data]).select()
  if (error) throw error
  return result?.[0]
}

export async function updatePromotion(id, data) {
  const { data: result, error } = await supabase.from('promotions').update(data).eq('id', id).select()
  if (error) throw error
  return result?.[0]
}

export async function deletePromotion(id) {
  const { error } = await supabase.from('promotions').delete().eq('id', id)
  if (error) throw error
}

// ---- NOTIFICATIONS ----
export async function createNotification(data) {
  const { data: result, error } = await supabase.from('notifications').insert([data]).select()
  if (error) throw error
  return result?.[0]
}

export async function deleteNotification(id) {
  const { error } = await supabase.from('notifications').delete().eq('id', id)
  if (error) throw error
}

// ---- COMPLAINTS ----
export async function createComplaint(data) {
  const { data: result, error } = await supabase.from('complaints').insert([data]).select()
  if (error) throw error
  return result?.[0]
}

export async function updateComplaint(id, data) {
  const { data: result, error } = await supabase.from('complaints').update(data).eq('id', id).select()
  if (error) throw error
  return result?.[0]
}

export async function deleteComplaint(id) {
  const { error } = await supabase.from('complaints').delete().eq('id', id)
  if (error) throw error
}

// ---- AUTH STATE LISTENER ----
export function onAuthChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
  return subscription
}
