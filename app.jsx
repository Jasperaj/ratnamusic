// =========================================================
// Main App — hash-based URL routing + tweaks panel + shell
// v2: page survives refresh; lastOrder persisted for confirmation page
// =========================================================

const DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "fontPair": "editorial",
  "accent": "#D08540",
  "heroLayout": "split",
  "cardStyle": "bordered"
}/*EDITMODE-END*/;

const FONT_PAIRS = {
  editorial: { display: '"DM Serif Display", Georgia, serif', body: '"Manrope", system-ui, sans-serif' },
  modern:    { display: '"Cormorant Garamond", Georgia, serif', body: '"DM Sans", system-ui, sans-serif' },
  classic:   { display: '"Spectral", Georgia, serif', body: '"Libre Franklin", system-ui, sans-serif' },
};

const ACCENT_SWATCHES = ["#D08540", "#3F6F9C", "#467D52", "#B65463"];

// ---------- URL hash routing ----------
function routeToHash(route) {
  if (!route || route.name === "home") return "#/";
  if (route.name === "all")          return "#/all";
  if (route.name === "category")     return "#/category/" + (route.id || "");
  if (route.name === "product")      return "#/product/" + encodeURIComponent(route.id || "");
  if (route.name === "confirmation") return "#/confirmation";
  return "#/" + route.name;
}

function hashToRoute(hash) {
  // Supabase OAuth callback — tokens appear in hash; let the SDK handle them
  if (!hash || hash === "#" || hash === "#/") return { name: "home" };
  if (hash.includes("access_token") || hash.includes("error_description") || hash.includes("type=recovery")) {
    return null; // signal: OAuth callback in progress
  }
  const path = hash.replace(/^#\/?/, "").split("?")[0];
  const parts = path.split("/");
  const page  = parts[0];
  if (!page || page === "") return { name: "home" };
  if (page === "all")          return { name: "all" };
  if (page === "category")     return { name: "category", id: parts[1] || "guitars" };
  if (page === "product")      return { name: "product",  id: decodeURIComponent(parts[1] || "") };
  if (page === "confirmation") return { name: "confirmation" };
  return { name: page };
}

// ---------- App ----------
function App() {
  // Initialise from URL hash so refresh restores the right page
  const [route, setRoute] = React.useState(() => {
    const parsed = hashToRoute(window.location.hash);
    return parsed || { name: "home" };
  });

  const [cartOpen,  setCartOpen]  = React.useState(false);
  const [loginOpen, setLoginOpen] = React.useState(false);
  const [toast,     setToast]     = React.useState(null);

  // Persist lastOrder so the confirmation page survives a refresh
  const [lastOrder, setLastOrder] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem("nms_last_order") || "null"); } catch (e) { return null; }
  });

  const [t, setTweak] = useTweaks(DEFAULTS);
  const [state]       = useStore();

  // Surface store errors as toasts
  React.useEffect(() => {
    if (state.error) {
      setToast(state.error);
      const tid = setTimeout(() => { if (typeof clearError === "function") clearError(); }, 100);
      return () => clearTimeout(tid);
    }
  }, [state.error]);

  // Bootstrap products/orders + auth on mount
  React.useEffect(() => {
    if (typeof bootstrapFromSupabase === "function") bootstrapFromSupabase();
  }, []);
  React.useEffect(() => {
    if (typeof initAuth === "function") initAuth();
  }, []);

  // Apply theme / fonts / accent
  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", t.theme || "light");
    const pair = FONT_PAIRS[t.fontPair] || FONT_PAIRS.editorial;
    document.documentElement.style.setProperty("--font-display", pair.display);
    document.documentElement.style.setProperty("--font-body",    pair.body);
    document.documentElement.style.setProperty("--accent",       t.accent || "#D08540");
  }, [t.theme, t.fontPair, t.accent]);

  // Navigate: update route state + URL hash
  const navigate = React.useCallback((next) => {
    setRoute(next);
    const hash = routeToHash(next);
    if (window.location.hash !== hash) window.history.pushState(null, "", hash);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  // Listen for browser back / forward / hashchange
  React.useEffect(() => {
    const onPop = () => {
      const parsed = hashToRoute(window.location.hash);
      if (parsed) setRoute(parsed);
    };
    window.addEventListener("popstate",   onPop);
    window.addEventListener("hashchange", onPop);
    return () => {
      window.removeEventListener("popstate",   onPop);
      window.removeEventListener("hashchange", onPop);
    };
  }, []);

  const handleAdd = (product, qty = 1) => {
    addToCart(product.id, qty);
    setToast("Added " + product.name);
  };

  const onLoginNeeded = () => setLoginOpen(true);

  const onPlaced = (order) => {
    setLastOrder(order);
    localStorage.setItem("nms_last_order", JSON.stringify(order));
    navigate({ name: "confirmation" });
  };

  return (
    <div className={"app card-style-" + (t.cardStyle || "bordered") + " hero-layout-" + (t.heroLayout || "split")}>
      <SiteHeader
        route={route}
        navigate={navigate}
        openCart={() => setCartOpen(true)}
        openLogin={() => setLoginOpen(true)}
      />

      {route.name === "home"         && <HomePage navigate={navigate} onAdd={handleAdd} heroLayout={t.heroLayout} />}
      {route.name === "all"          && <AllProductsPage navigate={navigate} onAdd={handleAdd} />}
      {route.name === "category"     && <CategoryPage catId={route.id} navigate={navigate} onAdd={handleAdd} />}
      {route.name === "product"      && <ProductPage id={route.id} navigate={navigate} onAdd={handleAdd} />}
      {route.name === "checkout"     && <CheckoutPage navigate={navigate} onLoginNeeded={onLoginNeeded} onPlaced={onPlaced} />}
      {route.name === "confirmation" && <ConfirmationPage order={lastOrder} navigate={navigate} />}
      {route.name === "account"      && <AccountPage navigate={navigate} onLoginNeeded={onLoginNeeded} />}
      {route.name === "admin"        && <AdminPage navigate={navigate} />}
      {route.name === "about"        && <AboutPage navigate={navigate} />}

      <SiteFooter navigate={navigate} />

      <CartDrawer  open={cartOpen}  onClose={() => setCartOpen(false)}  navigate={navigate} />
      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={() => { setLoginOpen(false); setToast("Signed in"); }}
        navigate={navigate}
      />

      <Toast message={toast} onDone={() => setToast(null)} />

      <TweaksPanel title="Tweaks">
        <TweakSection label="Theme">
          <TweakRadio
            label="Mode"
            value={t.theme}
            onChange={v => setTweak("theme", v)}
            options={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }]}
          />
          <TweakColor
            label="Accent"
            value={t.accent}
            onChange={v => setTweak("accent", v)}
            options={ACCENT_SWATCHES}
          />
        </TweakSection>

        <TweakSection label="Typography">
          <TweakSelect
            label="Font pair"
            value={t.fontPair}
            onChange={v => setTweak("fontPair", v)}
            options={[
              { value: "editorial", label: "DM Serif + Manrope" },
              { value: "modern",    label: "Cormorant + DM Sans" },
              { value: "classic",   label: "Spectral + Libre Franklin" },
            ]}
          />
        </TweakSection>

        <TweakSection label="Hero layout">
          <TweakRadio
            label="Style"
            value={t.heroLayout}
            onChange={v => setTweak("heroLayout", v)}
            options={[{ value: "split", label: "Split" }, { value: "marquee", label: "Marquee" }]}
          />
        </TweakSection>

        <TweakSection label="Product card">
          <TweakSelect
            label="Card style"
            value={t.cardStyle}
            onChange={v => setTweak("cardStyle", v)}
            options={[
              { value: "bordered", label: "Bordered (default)" },
              { value: "minimal",  label: "Minimal · no border" },
              { value: "postcard", label: "Postcard · padded" },
            ]}
          />
        </TweakSection>

        <TweakSection label="Demo data">
          <TweakButton
            label="Reset all data"
            secondary
            onClick={() => {
              if (confirm("Clear all orders, cart and user data?")) {
                localStorage.removeItem(STORE_KEY);
                localStorage.removeItem("nms_last_order");
                location.reload();
              }
            }}
          />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
