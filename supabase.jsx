// =========================================================
// Supabase client + helpers  v2
// Adds: Google OAuth, Email OTP, user profiles
// Column fix: products uses `category` + `original_price` (matches CSV)
// =========================================================

const SUPABASE_URL = "https://jgbtvoizamexxyrpugzx.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnYnR2b2l6YW1leHh5cnB1Z3p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMDE5NzMsImV4cCI6MjA5NDg3Nzk3M30.vTJrJYrn0Viod2rgvpg4wcAbDPkdoJu9rWfXCyZy-io";

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

// ---------- AUTH ----------

async function sbSignIn(email, password) {
  return await sb.auth.signInWithPassword({ email, password });
}

// Google OAuth — redirects to Google, then back to the app
async function sbSignInWithGoogle() {
  const redirectTo = window.location.origin + window.location.pathname;
  return await sb.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, queryParams: { access_type: "offline", prompt: "consent" } },
  });
}

// Send a 6-digit OTP to the user's email (passwordless / 2FA step)
async function sbSendEmailOtp(email) {
  return await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
}

// Verify the OTP the user received
async function sbVerifyEmailOtp(email, token) {
  return await sb.auth.verifyOtp({ email, token, type: "email" });
}

async function sbSignOut() {
  return await sb.auth.signOut();
}

async function sbGetSession() {
  return await sb.auth.getSession();
}

function sbOnAuthChange(callback) {
  const { data } = sb.auth.onAuthStateChange((event, session) => callback(event, session));
  return () => data?.subscription?.unsubscribe?.();
}

// ---------- PROFILES ----------

async function sbFetchProfile(userId) {
  const { data, error } = await sb.from("profiles").select("*").eq("id", userId).single();
  if (error && error.code !== "PGRST116") throw error; // PGRST116 = row not found
  return data || null;
}

async function sbUpsertProfile(userId, profile) {
  const row = {
    id: userId,
    email: profile.email,
    name: profile.name || null,
    phone: profile.phone || null,
    secondary_phone: profile.secondaryPhone || null,
    address: profile.address || null,
    landmark: profile.landmark || null,
    map_link: profile.mapLink || null,
  };
  const { data, error } = await sb.from("profiles").upsert(row, { onConflict: "id" }).select().single();
  if (error) throw error;
  return data;
}

// Convert DB row → JS shape used in state.user
function dbToProfileJs(row) {
  if (!row) return {};
  return {
    id: row.id,
    email: row.email || "",
    name: row.name || "",
    phone: row.phone || "",
    secondaryPhone: row.secondary_phone || "",
    address: row.address || "",
    landmark: row.landmark || "",
    mapLink: row.map_link || "",
  };
}

// ---------- PRODUCTS — DB ↔ JS ----------
// DB columns: id, name, category, price, original_price, description,
//             image_url, badge, in_stock, featured, daraz_url,
//             ne, tag, origin, body, color
function dbToProduct(row) {
  return {
    id: row.id,
    name: row.name,
    ne: row.ne || "",
    cat: (row.category || "").toLowerCase(),   // normalise to lowercase
    price: Number(row.price),
    was: row.original_price != null ? Number(row.original_price) : null,
    tag: row.tag || row.badge || null,
    badge: row.badge || null,
    origin: row.origin || "",
    body: row.body || "",
    desc: row.description || "",
    image: row.image_url || "",
    darazUrl: row.daraz_url || null,
    inStock: row.in_stock !== false,
    featured: row.featured || false,
    color: row.color || null,
    stock: row.stock != null ? Number(row.stock) : (row.in_stock !== false ? 10 : 0),
  };
}

function productToDb(p) {
  const row = {
    name: p.name,
    ne: p.ne || null,
    category: p.cat,
    price: Number(p.price),
    original_price: p.was != null && p.was !== "" ? Number(p.was) : null,
    tag: p.tag || null,
    badge: p.badge || null,
    origin: p.origin || null,
    body: p.body || null,
    description: p.desc || null,
    image_url: p.image || null,
    daraz_url: p.darazUrl || null,
    in_stock: p.inStock !== false,
    featured: p.featured || false,
    color: p.color || null,
    stock: p.stock != null ? Number(p.stock) : (p.inStock !== false ? 10 : 0),
    updated_at: new Date().toISOString(),
  };
  // Only include id if it's a valid UUID (DB uses uuid type)
  if (p.id) row.id = p.id;
  return row;
}

// ---------- ORDERS ----------
// DB columns: id (uuid), user_id, customer_name, customer_email, customer_phone,
//   address, items (jsonb), subtotal, delivery_fee, total, status, payment_method,
//   notes, created_at, updated_at, user_data (text/json), user_email
function dbToOrder(row) {
  // user_data is stored as text in DB, parse it
  let ud = {};
  if (row.user_data) {
    try { ud = typeof row.user_data === "string" ? JSON.parse(row.user_data) : row.user_data; } catch (e) { ud = {}; }
  }
  return {
    id:            row.id,
    ref:           ud._ref || row.id,
    createdAt:     row.created_at,
    status:        row.status        || "pending",
    subtotal:      Number(row.subtotal)      || 0,
    deliveryFee:   Number(row.delivery_fee)  || 0,
    total:         Number(row.total)         || 0,
    paymentMethod: row.payment_method        || "cod",
    items: (Array.isArray(row.items) ? row.items : []).map(i => ({
      id:    i.id    || "",
      name:  i.name  || "Unknown item",
      ne:    i.ne    || "",
      qty:   Number(i.qty)   || 1,
      price: Number(i.price) || 0,
    })),
    user: {
      name:           ud.name           || row.customer_name  || "",
      email:          ud.email          || row.customer_email || row.user_email || "",
      phone:          ud.phone          || row.customer_phone || "",
      secondaryPhone: ud.secondaryPhone || "",
      address:        ud.address        || row.address        || "",
      landmark:       ud.landmark       || "",
      mapLink:        ud.mapLink        || "",
    },
  };
}

function orderToDb(o) {
  const user = o.user || {};
  const userData = {
    _ref:           o.ref           || o.id,
    name:           user.name           || "",
    email:          user.email          || "",
    phone:          user.phone          || "",
    secondaryPhone: user.secondaryPhone || "",
    address:        user.address        || "",
    landmark:       user.landmark       || "",
    mapLink:        user.mapLink        || "",
  };
  return {
    status:         o.status         || "pending",
    subtotal:       Number(o.subtotal)      || 0,
    delivery_fee:   Number(o.deliveryFee)   || 0,
    total:          Number(o.total)         || 0,
    payment_method: o.paymentMethod  || "cod",
    items: (Array.isArray(o.items) ? o.items : []).map(i => ({
      id:    i.id    || "",
      name:  i.name  || "",
      ne:    i.ne    || "",
      qty:   Number(i.qty)   || 1,
      price: Number(i.price) || 0,
    })),
    customer_name:  user.name  || null,
    customer_email: user.email || null,
    customer_phone: user.phone || null,
    address:        user.address || null,
    user_data:      JSON.stringify(userData),
    user_email:     user.email || null,
  };
}

// ---------- PRODUCTS CRUD ----------
async function sbFetchProducts() {
  const { data, error } = await sb.from("products").select("*").order("created_at");
  if (error) throw error;
  return (data || []).map(dbToProduct);
}

async function sbSeedProductsIfEmpty(seed) {
  const { count, error } = await sb.from("products").select("*", { count: "exact", head: true });
  if (error) throw error;
  if (count > 0) return false;
  const rows = seed.map(productToDb);
  const { error: insErr } = await sb.from("products").insert(rows);
  if (insErr) throw insErr;
  return true;
}

async function sbUpsertProduct(product) {
  const row = productToDb(product);
  const { data, error } = await sb.from("products").upsert(row).select().single();
  if (error) throw error;
  return dbToProduct(data);
}

async function sbDeleteProduct(id) {
  const { error } = await sb.from("products").delete().eq("id", id);
  if (error) throw error;
}

async function sbDecrementStock(productId, qty) {
  // Fetch current stock, subtract qty, clamp to 0, update in_stock accordingly
  const { data: row, error: fetchErr } = await sb.from("products").select("stock, in_stock").eq("id", productId).single();
  if (fetchErr) throw fetchErr;
  const currentStock = row.stock != null ? Number(row.stock) : 10;
  const newStock = Math.max(0, currentStock - qty);
  const { error: updErr } = await sb.from("products").update({
    stock: newStock,
    in_stock: newStock > 0,
    updated_at: new Date().toISOString(),
  }).eq("id", productId);
  if (updErr) throw updErr;
}

// ---------- ORDERS CRUD ----------
async function sbFetchOrders() {
  const { data, error } = await sb.from("orders").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(dbToOrder);
}

async function sbInsertOrder(order) {
  const row = orderToDb(order);
  const { data, error } = await sb.from("orders").insert(row).select().single();
  if (error) throw error;
  return dbToOrder(data);
}

async function sbUpdateOrderStatus(id, status) {
  const { error } = await sb.from("orders").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

// ---------- REALTIME ----------
function sbSubscribeProducts(onChange) {
  const ch = sb.channel("products-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => onChange())
    .subscribe();
  return () => sb.removeChannel(ch);
}

function sbSubscribeOrders(onChange) {
  const ch = sb.channel("orders-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => onChange())
    .subscribe();
  return () => sb.removeChannel(ch);
}

function sbSubscribeProfiles(onChange) {
  const ch = sb.channel("profiles-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => onChange())
    .subscribe();
  return () => sb.removeChannel(ch);
}

// ---------- SOCIAL POSTS ----------
async function sbFetchSocialPosts() {
  const { data, error } = await sb.from("social_posts").select("*").eq("active", true).order("sort_order").order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

async function sbFetchAllSocialPosts() {
  const { data, error } = await sb.from("social_posts").select("*").order("sort_order").order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

async function sbUpsertSocialPost(post) {
  const row = {
    platform: post.platform,
    post_url: post.post_url,
    caption: post.caption || null,
    active: post.active !== false,
    sort_order: post.sort_order || 0,
    updated_at: new Date().toISOString(),
  };
  if (post.id) row.id = post.id;
  const { data, error } = await sb.from("social_posts").upsert(row).select().single();
  if (error) throw error;
  return data;
}

async function sbDeleteSocialPost(id) {
  const { error } = await sb.from("social_posts").delete().eq("id", id);
  if (error) throw error;
}

Object.assign(window, {
  sb, SUPABASE_URL,
  sbSignIn, sbSignInWithGoogle, sbSendEmailOtp, sbVerifyEmailOtp,
  sbSignOut, sbGetSession, sbOnAuthChange,
  sbFetchProfile, sbUpsertProfile, dbToProfileJs,
  sbFetchProducts, sbSeedProductsIfEmpty, sbUpsertProduct, sbDeleteProduct, sbDecrementStock,
  sbFetchOrders, sbInsertOrder, sbUpdateOrderStatus,
  sbSubscribeProducts, sbSubscribeOrders, sbSubscribeProfiles,
  sbFetchSocialPosts, sbFetchAllSocialPosts, sbUpsertSocialPost, sbDeleteSocialPost,
  dbToProduct, productToDb, dbToOrder, orderToDb,
});
