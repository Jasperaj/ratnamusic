// =========================================================
// Shared UI primitives  v2
// Nav updated: all 7 categories, Wind & Drums added
// =========================================================

function MountainStrip({ position = "bottom" }) {
  return (
    <div className={"mountains " + position} aria-hidden="true">
      <svg viewBox="0 0 1200 110" preserveAspectRatio="none">
        <polygon points="0,110 140,30 270,90 380,10 520,80 640,40 780,90 900,20 1020,75 1140,35 1200,90 1200,110" fill="currentColor" />
        <polygon points="0,110 100,70 220,95 340,55 470,90 600,60 720,95 850,50 970,90 1100,70 1200,95 1200,110" fill="currentColor" opacity="0.5" />
      </svg>
    </div>
  );
}

function Placeholder({ label, tone, style }) {
  return (
    <div className={"ph" + (tone ? " " + tone : "")} style={style}>
      <span className="ph-label">{label}</span>
    </div>
  );
}

function productPlaceholderTone(id) {
  const i = parseInt((id || "p0").replace(/\D/g, ""), 10) || 0;
  const r = i % 8;
  if (r === 2) return "dark";
  if (r === 5) return "saffron";
  return "";
}

function productPhLabel(p) {
  if (p.cat === "traditional") return "traditional / " + (p.name.split(" ")[0] || "").toLowerCase();
  if (p.cat === "guitars")     return "guitar shot";
  if (p.cat === "keyboards")   return "keyboard shot";
  if (p.cat === "audio")       return "audio gear";
  if (p.cat === "wind")        return "wind instrument";
  if (p.cat === "drums")       return "drum / percussion";
  return "accessory";
}

// ===== Header =====
function SiteHeader({ route, navigate, openCart, openLogin }) {
  const [state] = useStore();
  const count = cartCount(state);
  const isAdminRoute = route?.name === "admin";
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  // Close mobile nav when route changes
  React.useEffect(() => { setMobileNavOpen(false); }, [route]);

  const NAV_ITEMS = [
    { label: "Shop",        action: () => navigate({ name: "home" }),                          active: route?.name === "home" },
    { label: "All",         action: () => navigate({ name: "all" }),                           active: route?.name === "all" },
    { label: "Traditional", action: () => navigate({ name: "category", id: "traditional" }),   active: route?.name === "category" && route?.id === "traditional" },
    { label: "Guitars",     action: () => navigate({ name: "category", id: "guitars" }),       active: route?.name === "category" && route?.id === "guitars" },
    { label: "Keyboards",   action: () => navigate({ name: "category", id: "keyboards" }),     active: route?.name === "category" && route?.id === "keyboards" },
    { label: "Audio",       action: () => navigate({ name: "category", id: "audio" }),         active: route?.name === "category" && route?.id === "audio" },
    { label: "Wind",        action: () => navigate({ name: "category", id: "wind" }),          active: route?.name === "category" && route?.id === "wind" },
    { label: "Drums",       action: () => navigate({ name: "category", id: "drums" }),         active: route?.name === "category" && route?.id === "drums" },
    { label: "Accessories", action: () => navigate({ name: "category", id: "accessories" }),   active: route?.name === "category" && route?.id === "accessories" },
    { label: "About",       action: () => navigate({ name: "about" }),                         active: route?.name === "about" },
  ];

  return (
    <React.Fragment>
      <div className="site-top-bar">
        <div className="wrap">
          <span>Free delivery inside Kathmandu Valley · Orders Rs. 20,000+</span>
          <span className="deva">नेपालभर डेलिभरी उपलब्ध</span>
        </div>
      </div>
      <header className="site-header">
        <div className="wrap">
          <div className="brand" onClick={() => navigate({ name: "home" })} style={{ cursor: "pointer" }}>
            <img src="logo_transparent.png" alt="Ratna Music" style={{ height: 48, width: "auto", objectFit: "contain" }} />
            <div className="brand-name">
              <span className="en">Ratna Music</span>
              <span className="ne">रत्न म्युजिक</span>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="nav">
            {NAV_ITEMS.map(item => (
              <button
                key={item.label}
                aria-current={item.active ? "page" : undefined}
                onClick={item.action}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="header-actions">
            {state.user ? (
              <button className="icon-btn" onClick={() => navigate({ name: "account" })} title={state.user.name}>
                {state.user.picture && state.user.picture.startsWith("http") ? (
                  <img src={state.user.picture} alt={state.user.name} style={{ width: 20, height: 20, borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 14 }}>
                    {(state.user.picture && state.user.picture.length === 1) ? state.user.picture : state.user.name?.[0]}
                  </span>
                )}
              </button>
            ) : (
              <button className="icon-btn" onClick={openLogin} title="Sign in"><UserIcon /></button>
            )}

            <button className="icon-btn" onClick={openCart} title="Cart">
              <BagIcon />
              {count > 0 && <span className="badge">{count}</span>}
            </button>

            {!isAdminRoute && (
              <button className="icon-btn" onClick={() => navigate({ name: "admin" })} title="Store keeper view" style={{ marginLeft: 4, borderStyle: "dashed" }}>
                <AdminIcon />
              </button>
            )}

            {/* Mobile hamburger */}
            <button
              className="icon-btn mobile-menu-btn"
              onClick={() => setMobileNavOpen(v => !v)}
              title="Menu"
              style={{ display: "none" }}
            >
              <svg width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M0 1h18M0 7h18M0 13h18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {mobileNavOpen && (
          <div style={{
            position: "absolute", top: "100%", left: 0, right: 0, zIndex: 200,
            background: "var(--bg)", borderBottom: "1px solid var(--rule)",
            display: "flex", flexDirection: "column", padding: "12px 0"
          }}>
            {NAV_ITEMS.map(item => (
              <button
                key={item.label}
                onClick={item.action}
                style={{
                  background: "none", border: "none", textAlign: "left",
                  padding: "12px 24px", fontSize: 15, color: item.active ? "var(--accent)" : "var(--ink)",
                  cursor: "pointer", fontFamily: "var(--font-body)"
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </header>
    </React.Fragment>
  );
}

// ===== Icons =====
function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="9" r="4" /><path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" />
    </svg>
  );
}
function BagIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M5 8h14l-1.2 11a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}
function AdminIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="4" y="5" width="16" height="14" /><path d="M4 9h16M9 13h6M9 16h4" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

// ===== Footer =====
function SiteFooter({ navigate }) {
  return (
    <footer className="site-foot">
      <div className="wrap">
        <div className="top">
          <div>
            <div className="brand" style={{ marginBottom: 20 }}>
              <img src="logo_transparent.png" alt="Ratna Music" style={{ height: 56, width: "auto", objectFit: "contain" }} />
              <div className="brand-name">
                <span className="en">Ratna Music</span>
                <span className="ne">रत्न म्युजिक</span>
              </div>
            </div>
            <p style={{ color: "var(--ink-2)", fontSize: 13, maxWidth: "38ch", margin: 0 }}>
              Curating Nepal's finest musical instruments — from the high-altitude lutes of Solukhumbu to gig-ready amplifiers — since 2018.
            </p>
          </div>
          <div>
            <h4>Shop</h4>
            <ul>
              <li><button onClick={() => navigate({ name: "all" })}>All Products</button></li>
              {CATS.map(c => (
                <li key={c.id}><button onClick={() => navigate({ name: "category", id: c.id })}>{c.en}</button></li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Account</h4>
            <ul>
              <li><button onClick={() => navigate({ name: "account" })}>My Orders</button></li>
              <li><button onClick={() => navigate({ name: "about" })}>About Us</button></li>
              <li><button onClick={() => navigate({ name: "admin" })}>Store Keeper</button></li>
            </ul>
          </div>
          <div>
            <h4>Visit</h4>
            <ul>
              <li>Bangemuda Chowk, Chittardhar Marg, Kathmandu</li>
              <li>+977 9803085676</li>
              <li style={{ fontFamily: "var(--font-deva)", marginTop: 6 }}>आइतबार – शुक्रबार · १०–८</li>
            </ul>
          </div>
        </div>
        <div className="bot">
          <span>© 2026 Ratna Music</span>
          <span>Cash on Delivery · Kathmandu, Nepal</span>
        </div>
      </div>
    </footer>
  );
}

// ===== ProductImage =====
function ProductImage({ src, alt, fallbackLabel, fallbackTone, style }) {
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => { setFailed(false); }, [src]);
  if (failed || !src) return <Placeholder label={fallbackLabel} tone={fallbackTone} style={style} />;
  return (
    <img src={src} alt={alt || ""} loading="lazy" onError={() => setFailed(true)}
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", ...(style || {}) }} />
  );
}

// ===== Product Card =====
function ProductCard({ p, onClick, onAdd }) {
  const tone = productPlaceholderTone(p.id);
  const src  = p.image || p.img || "";
  // Use badge from Supabase if tag is empty
  const displayTag = p.tag || p.badge || null;
  const availStock = p.stock != null ? p.stock : (p.inStock !== false ? 10 : 0);
  const isOut = availStock <= 0;
  return (
    <div className="product-card" onClick={() => onClick(p)}>
      <div className="frame">
        {src
          ? <ProductImage src={src} alt={p.name} fallbackLabel={productPhLabel(p)} fallbackTone={tone} />
          : <Placeholder label={productPhLabel(p)} tone={tone} />}
        {isOut && <span className="tag" style={{ background: "#888", color: "white" }}>Out of Stock</span>}
        {!isOut && displayTag && <span className={"tag" + (displayTag === "Sale" ? " sale" : displayTag === "New" ? " new" : "")}>{displayTag}</span>}
        {!isOut && p.featured && !displayTag && <span className="tag" style={{ background: "var(--accent)", color: "white" }}>Featured</span>}
        {!isOut ? (
          <button className="btn small block accent quick-add" onClick={e => { e.stopPropagation(); onAdd(p); }}>Add to Cart</button>
        ) : (
          <button className="btn small block quick-add" disabled style={{ opacity: 0.5, cursor: "not-allowed" }}>Out of Stock</button>
        )}
      </div>
      <div className="body">
        <div className="meta-row">
          <span className="cat">{(CAT_BY_ID[p.cat]?.en) || p.cat || "Uncategorized"}</span>
          <span className="price">{NPR(p.price)}{p.was && <span className="strike">{NPR(p.was)}</span>}</span>
        </div>
        <span className="name">{p.name}</span>
        <span className="ne">{p.ne}</span>
      </div>
    </div>
  );
}

// ===== Toast =====
function Toast({ message, onDone }) {
  React.useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [message]);
  if (!message) return null;
  return <div className="toast"><span className="dot" />{message}</div>;
}

Object.assign(window, {
  SiteHeader, SiteFooter, ProductCard, Placeholder, ProductImage,
  MountainStrip, Toast, productPlaceholderTone, productPhLabel, CloseIcon,
});
