// =========================================================
// Store: cart + user are per-browser (localStorage)
//        products + orders + profiles are SHARED via Supabase
// v2: real Supabase auth for shoppers (Google OAuth / email OTP)
// =========================================================

const STORE_KEY = "nms_state_v2";
const ADMIN_USERNAME = "family";
const ADMIN_EMAIL = "family@nepalmusicalstore.com";

const defaultState = {
  cart: [],
  user: null,          // { id, email, name, picture, phone, secondaryPhone, address, landmark, mapLink }
  userSession: null,   // raw Supabase session for the shopper
  adminAuthed: false,
  adminSession: null,
  adminEmail: null,
  products: null,
  orders: [],
  loading: true,
  error: null,
  syncing: false,
};

function persistableSubset(state) {
  return {
    cart: state.cart,
    user: state.user,
    adminAuthed: state.adminAuthed,
    adminEmail: state.adminEmail,
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return { ...defaultState };
    return { ...defaultState, ...JSON.parse(raw) };
  } catch (e) { return { ...defaultState }; }
}

function saveState(state) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(persistableSubset(state))); } catch (e) {}
}

const listeners = new Set();
let _state = loadState();

function setStateGlobal(updater) {
  _state = typeof updater === "function" ? updater(_state) : { ..._state, ...updater };
  saveState(_state);
  listeners.forEach(fn => fn(_state));
}

function useStore() {
  const [, force] = React.useState(0);
  React.useEffect(() => {
    const fn = () => force(x => x + 1);
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);
  return [_state, setStateGlobal];
}

// ===== Bootstrap Supabase =====
async function bootstrapFromSupabase() {
  // Catalog data is public and must not be blocked by the more restricted
  // orders policy used for anonymous checkout/admin access.
  try {
    const products = await sbFetchProducts();
    setStateGlobal(s => ({ ...s, products, loading: false, error: null }));

    sbSubscribeProducts(async () => {
      try { const fresh = await sbFetchProducts(); setStateGlobal(s => ({ ...s, products: fresh })); } catch (e) {}
    });
  } catch (e) {
    console.error("Product catalog bootstrap failed", e);
    setStateGlobal(s => ({
      ...s, loading: false,
      error: "Couldn't reach the store catalog: " + (e?.message || e) + " — showing offline catalog.",
      products: PRODUCTS,
    }));
  }

  // Guest users are not allowed to read orders. Keep catalog loading
  // successful even when this request is rejected by RLS.
  try {
    const orders = await sbFetchOrders();
    setStateGlobal(s => ({ ...s, orders }));
    sbSubscribeOrders(async () => {
      try { const fresh = await sbFetchOrders(); setStateGlobal(s => ({ ...s, orders: fresh })); } catch (e) {}
    });
  } catch (e) {
    console.warn("Orders unavailable for current session", e);
  }
}

async function seedCatalogManually() {
  try {
    setStateGlobal(s => ({ ...s, syncing: true }));
    const inserted = await sbSeedProductsIfEmpty(PRODUCTS);
    if (!inserted) {
      setStateGlobal(s => ({ ...s, syncing: false, error: "Catalog isn't empty — clear it first or use Reset." }));
      return false;
    }
    const fresh = await sbFetchProducts();
    setStateGlobal(s => ({ ...s, products: fresh, syncing: false, error: null }));
    return true;
  } catch (e) {
    setStateGlobal(s => ({ ...s, syncing: false, error: "Seed failed: " + (e?.message || e) }));
    return false;
  }
}

// ===== Product helpers =====
function getProducts() { return _state.products || PRODUCTS; }
function getProductById(id) { return getProducts().find(p => p.id === id); }
function getCountByCat() {
  const list = getProducts();
  const acc = {};
  CATS.forEach(c => { acc[c.id] = list.filter(p => p.cat === c.id).length; });
  return acc;
}

// ===== Cart =====
function cartCount(state) { return (state.cart || []).reduce((s, i) => s + i.qty, 0); }
function cartSubtotal(state) {
  return (state.cart || []).reduce((s, i) => {
    const p = getProductById(i.id);
    const price = p ? p.price : (i.price || 0);
    return s + price * i.qty;
  }, 0);
}
function deliveryFee(subtotal) {
  if (subtotal === 0) return 0;
  if (subtotal >= 20000) return 0;
  return 350;
}
function addToCart(id, qty = 1) {
  const p = getProductById(id);
  if (!p) return;
  const availStock = p.stock != null ? p.stock : (p.inStock !== false ? 999 : 0);
  if (availStock <= 0) return;
  setStateGlobal(s => {
    const existing = s.cart.find(i => i.id === id);
    const currentQty = existing ? existing.qty : 0;
    const maxAdd = Math.max(0, availStock - currentQty);
    const actualQty = Math.min(qty, maxAdd);
    if (actualQty <= 0) return s;
    if (existing) {
      return { ...s, cart: s.cart.map(i => i.id === id ? { ...i, qty: i.qty + actualQty } : i) };
    }
    const item = { id, qty: actualQty, price: p?.price || 0, name: p?.name || "", ne: p?.ne || "" };
    return { ...s, cart: [...s.cart, item] };
  });
}
function updateQty(id, qty) {
  if (qty <= 0) { removeFromCart(id); return; }
  const p = getProductById(id);
  const availStock = p?.stock != null ? p.stock : 999;
  const clamped = Math.min(qty, availStock);
  setStateGlobal(s => ({
    ...s,
    cart: s.cart.map(i => i.id === id ? { ...i, qty: clamped } : i),
  }));
}
function removeFromCart(id) { setStateGlobal(s => ({ ...s, cart: s.cart.filter(i => i.id !== id) })); }
function clearCart() { setStateGlobal(s => ({ ...s, cart: [] })); }

// ===== User Auth (shopper) — real Supabase =====

function buildUserFromSession(session) {
  if (!session?.user) return null;
  const u = session.user;
  const meta = u.user_metadata || {};
  return {
    id: u.id,
    email: u.email || "",
    name: meta.full_name || meta.name || u.email?.split("@")[0] || "Customer",
    picture: meta.avatar_url || (u.email?.[0] || "U").toUpperCase(),
  };
}

async function loadUserProfileFromSupabase(userId) {
  try {
    const row = await sbFetchProfile(userId);
    if (row) {
      const profile = dbToProfileJs(row);
      setStateGlobal(s => ({ ...s, user: { ...(s.user || {}), ...profile } }));
    }
  } catch (e) {
    console.error("Load profile failed:", e);
  }
}

// Save profile to Supabase and update local state
async function saveUserProfile(profileData) {
  const userId = _state.userSession?.user?.id;
  if (!userId) return { ok: false, error: "Not signed in" };
  try {
    setStateGlobal(s => ({ ...s, syncing: true }));
    await sbUpsertProfile(userId, { ...profileData, email: _state.user?.email || profileData.email });
    setStateGlobal(s => ({
      ...s, user: { ...(s.user || {}), ...profileData }, syncing: false, error: null,
    }));
    return { ok: true };
  } catch (e) {
    setStateGlobal(s => ({ ...s, syncing: false }));
    return { ok: false, error: e.message || "Save failed" };
  }
}

// Sign out both shopper and admin
async function logout() {
  try { await window.sbSignOut(); } catch (e) {}
  setStateGlobal(s => ({ ...s, user: null, userSession: null }));
}

function updateUserProfile(partial) {
  setStateGlobal(s => ({ ...s, user: { ...(s.user || {}), ...partial } }));
}

// ===== Admin Auth =====
async function adminLogin(user, pass) {
  const id = (user || "").trim();
  const email = id.toLowerCase() === ADMIN_USERNAME ? ADMIN_EMAIL : id;
  if (typeof window.sbSignIn !== "function") {
    return { ok: false, error: "Auth library not loaded. Check connection and reload." };
  }
  try {
    const { data, error } = await window.sbSignIn(email, pass);
    if (error) return { ok: false, error: error.message || "Sign-in failed" };
    setStateGlobal(s => ({
      ...s, adminAuthed: true,
      adminSession: data?.session || null,
      adminEmail: data?.user?.email || email,
    }));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e?.message || "Couldn't reach the auth server." };
  }
}

async function adminLogout() {
  try { await window.sbSignOut(); } catch (e) {}
  setStateGlobal(s => ({ ...s, adminAuthed: false, adminSession: null, adminEmail: null }));
}

// ===== Unified auth init (admin + shopper) =====
let _authListenerInstalled = false;

async function initAuth() {
  if (_authListenerInstalled) return;
  _authListenerInstalled = true;

  if (typeof window.sbGetSession !== "function") {
    setStateGlobal(s => ({ ...s, adminAuthed: false, adminSession: null, adminEmail: null }));
    return;
  }

  try {
    const { data } = await window.sbGetSession();
    const session = data?.session || null;
    if (session) {
      const email = session.user?.email;
      if (email === ADMIN_EMAIL) {
        setStateGlobal(s => ({ ...s, adminAuthed: true, adminSession: session, adminEmail: email }));
      } else {
        const userFromSession = buildUserFromSession(session);
        setStateGlobal(s => ({
          ...s,
          user: { ...(s.user || {}), ...userFromSession },
          userSession: session,
        }));
        if (session.user?.id) loadUserProfileFromSupabase(session.user.id);
      }
    } else {
      setStateGlobal(s => ({ ...s, adminAuthed: false, adminSession: null, adminEmail: null }));
    }
  } catch (e) { /* offline — leave persisted state alone */ }

  if (typeof window.sbOnAuthChange === "function") {
    window.sbOnAuthChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setStateGlobal(s => ({
          ...s,
          adminAuthed: false, adminSession: null, adminEmail: null,
          user: null, userSession: null,
        }));
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        const email = session.user?.email;
        if (email === ADMIN_EMAIL) {
          setStateGlobal(s => ({
            ...s, adminAuthed: true, adminSession: session, adminEmail: email,
          }));
        } else {
          const userFromSession = buildUserFromSession(session);
          setStateGlobal(s => ({
            ...s,
            user: { ...(s.user || {}), ...userFromSession },
            userSession: session,
            adminAuthed: false,
          }));
          if (session.user?.id) loadUserProfileFromSupabase(session.user.id);
        }
      }
    });
  }
}

// Keep for backward compat — now delegates to initAuth
function initAdminAuth() { return initAuth(); }

function generateUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function generateOrderRef() {
  return "NMS-" + Date.now().toString(36).toUpperCase().slice(-5) + "-" + Math.floor(Math.random() * 90 + 10);
}

// ===== Orders =====
async function placeOrder(userProfile) {
  const state = _state;
  const items = state.cart.map(i => {
    const p = getProductById(i.id);
    return { id: i.id, qty: i.qty, name: p?.name || i.name || "", ne: p?.ne || i.ne || "", price: p?.price || i.price || 0 };
  });
  const sub = cartSubtotal(state);
  const fee = deliveryFee(sub);
  const uuid = generateUUID();
  const ref  = generateOrderRef();
  const order = {
    id: uuid, ref,
    createdAt: new Date().toISOString(),
    items, subtotal: sub, deliveryFee: fee,
    total: sub + fee, status: "pending", paymentMethod: "cod",
    user: { ...userProfile },
  };

  setStateGlobal(s => ({ ...s, syncing: true }));
  try {
    const saved = await sbInsertOrder(order);
    setStateGlobal(s => ({
      ...s,
      orders: [saved, ...s.orders.filter(o => o.id !== saved.id)],
      cart: [],
      user: { ...(s.user || {}), ...userProfile },
      syncing: false, error: null,
    }));

    for (const item of items) {
      try { await sbDecrementStock(item.id, item.qty); } catch (e) { console.error("Stock decrement:", e); }
    }

    const userId = state.userSession?.user?.id;
    if (userId) {
      sbUpsertProfile(userId, { ...userProfile }).catch(e => console.error("Profile upsert:", e));
    }
    return saved;
  } catch (e) {
    setStateGlobal(s => ({ ...s, syncing: false, error: "Order failed: " + (e.message || e) }));
    throw e;
  }
}

async function updateOrderStatus(orderId, status) {
  const before = _state.orders;
  setStateGlobal(s => ({
    ...s, orders: s.orders.map(o => o.id === orderId ? { ...o, status } : o), syncing: true,
  }));
  try {
    await sbUpdateOrderStatus(orderId, status);
    setStateGlobal(s => ({ ...s, syncing: false, error: null }));
  } catch (e) {
    setStateGlobal(s => ({ ...s, orders: before, syncing: false, error: "Status update failed: " + (e.message || e) }));
    throw e;
  }
}

function seedDemoOrdersIfEmpty() { /* no-op */ }

Object.assign(window, {
  useStore, setStateGlobal, STORE_KEY,
  cartCount, cartSubtotal, deliveryFee,
  addToCart, updateQty, removeFromCart, clearCart,
  logout, updateUserProfile, saveUserProfile, loadUserProfileFromSupabase,
  placeOrder, updateOrderStatus, seedDemoOrdersIfEmpty,
  getProducts, getProductById, getCountByCat,
  upsertProduct, deleteProduct, resetProducts, generateProductId,
  adminLogin, adminLogout, initAuth, initAdminAuth, ADMIN_USERNAME, ADMIN_EMAIL,
  bootstrapFromSupabase, seedCatalogManually, clearError,
  buildUserFromSession,
});
