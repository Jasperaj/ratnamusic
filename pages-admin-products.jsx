// =========================================================
// ProductsAdmin — Add / Edit / Delete products
// =========================================================

function ProductsAdmin() {
  const [state] = useStore();
  const products = getProducts();
  const counts = getCountByCat();

  const [editing, setEditing] = React.useState(null); // product or { isNew: true }
  const [filter, setFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");

  // True when Supabase has been reached and the products table is empty
  // (i.e. boot succeeded but there are zero rows). We show a "Seed catalog"
  // CTA in this state — auto-seeding on boot was removed because it caused
  // deleted products to silently reappear on every page reload.
  const catalogEmpty = !state.loading && !state.error && Array.isArray(state.products) && state.products.length === 0;

  const filtered = products.filter(p => {
    if (filter !== "all" && p.cat !== filter) return false;
    if (search && !(p.name.toLowerCase().includes(search.toLowerCase()) || p.id.includes(search.toLowerCase()))) return false;
    return true;
  });

  const startNew = () => {
    setEditing({
      isNew: true,
      id: generateProductId(),
      name: "",
      ne: "",
      cat: "guitars",
      price: 0,
      was: null,
      tag: "",
      origin: "",
      body: "",
      desc: "",
      inStock: true,
      featured: false,
    });
  };

  return (
    <div>
      <div className="admin-stats" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
        {CATS.map(c => (
          <div className="stat" key={c.id}>
            <div className="k">{c.en}</div>
            <div className="v" style={{ fontSize: 32 }}>{counts[c.id]}</div>
            <div className="v-sub">{c.ne}</div>
          </div>
        ))}
      </div>

      {catalogEmpty && (
        <div style={{
          padding: "20px 24px",
          marginBottom: 22,
          border: "1px solid var(--rule)",
          background: "var(--bg-2)",
          display: "flex",
          gap: 20,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap"
        }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 20, marginBottom: 4 }}>
              Your catalog is empty.
            </div>
            <div style={{ color: "var(--ink-2)", fontSize: 14, maxWidth: "60ch" }}>
              No products in Supabase. Click "Seed catalog" to insert the 40-item starter catalog, or add products one at a time.
            </div>
          </div>
          <button
            className="btn accent"
            onClick={async () => {
              if (confirm("Insert the 40-item starter catalog into Supabase?")) {
                await seedCatalogManually();
              }
            }}
          >
            Seed catalog
          </button>
        </div>
      )}

      <div style={{ display: "flex", gap: 12, marginBottom: 22, alignItems: "center", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search by name or ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            background: "var(--bg)", border: "1px solid var(--rule)", padding: "10px 14px",
            fontSize: 14, color: "var(--ink)", minWidth: 280, outline: "none"
          }}
        />
        <select className="select-bare" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All categories</option>
          {CATS.map(c => <option key={c.id} value={c.id}>{c.en}</option>)}
        </select>
        <span style={{ flex: 1 }} />
        <button className="btn ghost small" onClick={() => {
          if (confirm("Reset products to original catalog? Your custom additions will be lost.")) {
            resetProducts();
          }
        }}>Reset catalog</button>
        <button className="btn accent" onClick={startNew}>+ Add Product</button>
      </div>

      <div className="admin-table products-table">
        <div className="hd">
          <span>ID</span>
          <span>Name</span>
          <span>Category</span>
          <span>Price</span>
          <span>Stock</span>
          <span>Tag</span>
          <span style={{ textAlign: "right" }}>Actions</span>
        </div>
        {filtered.map(p => (
          <div className="tr" key={p.id} onClick={() => setEditing({ ...p })}>
            <span className="id">{p.id}</span>
            <span className="cust">
              {p.name}
              <span className="e" style={{ fontFamily: "var(--font-deva)", color: "var(--ink-3)" }}>{p.ne}</span>
            </span>
            <span style={{ fontSize: 13 }}>{CAT_BY_ID[p.cat]?.en}</span>
            <span className="tot">
              {NPR(p.price)}
              {p.was && <span style={{ display: "block", color: "var(--ink-3)", fontSize: 11, textDecoration: "line-through" }}>{NPR(p.was)}</span>}
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: p.inStock !== false ? "green" : "var(--warn)" }}>
              {p.inStock !== false ? "In Stock" : "Out"}
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: p.tag ? "var(--accent)" : "var(--ink-3)" }}>
              {p.tag || "—"}
            </span>
            <span style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="chip" onClick={(e) => { e.stopPropagation(); setEditing({ ...p }); }}>Edit</button>
              <button
                className="chip"
                style={{ color: "var(--warn)", borderColor: "var(--warn)" }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete "${p.name}"? This cannot be undone.`)) deleteProduct(p.id);
                }}
              >Delete</button>
            </span>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: "var(--ink-3)" }}>No products match.</div>
        )}
      </div>

      {editing && (
        <ProductEditor
          product={editing}
          onClose={() => setEditing(null)}
          onSave={(p) => { upsertProduct(p); setEditing(null); }}
        />
      )}
    </div>
  );
}

// =========================================================
// ProductEditor modal
// =========================================================
function ProductEditor({ product, onClose, onSave }) {
  const [f, setF] = React.useState({ ...product });
  const [errors, setErrors] = React.useState({});

  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));

  const validate = () => {
    const e = {};
    if (!f.id?.trim()) e.id = "Required";
    if (!f.name?.trim()) e.name = "Required";
    if (!f.cat) e.cat = "Required";
    const priceNum = Number(f.price);
    const wasNum = f.was === "" || f.was == null ? null : Number(f.was);
    if (!priceNum || priceNum <= 0) e.price = "Must be greater than 0";
    if (wasNum != null && (Number.isNaN(wasNum) || wasNum <= priceNum)) {
      e.was = "Was-price should be higher than price";
    }
    if (f.image && !/^https?:\/\//i.test(f.image.trim())) {
      e.image = "Must start with http:// or https://";
    }
    if (f.darazUrl && !/^https:\/\//i.test(f.darazUrl.trim())) {
      e.darazUrl = "Must start with https://";
    }
    return e;
  };

  const submit = () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    const clean = {
      ...f,
      price: Number(f.price),
      was: f.was ? Number(f.was) : null,
      tag: f.tag?.trim() || null,
      image: f.image?.trim() || "",
      darazUrl: f.darazUrl?.trim() || null,
      inStock: f.inStock !== false,
      featured: f.featured || false,
    };
    delete clean.isNew;
    onSave(clean);
  };

  const isNew = product.isNew;

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: "min(720px, 100%)", padding: 36, maxHeight: "90vh", overflowY: "auto" }}>
        <button className="close-x" onClick={onClose}>×</button>
        <span className="h-eyebrow">{isNew ? "New product" : "Edit · " + product.id}</span>
        <h2 style={{ marginTop: 8, marginBottom: 24 }}>
          {isNew ? "Add a new product" : f.name || "Edit product"}
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <div className="fld">
            <label>Product ID <span className="req">*</span></label>
            <input
              type="text"
              value={f.id}
              onChange={e => set("id", e.target.value)}
              disabled={!isNew}
              style={{ fontFamily: "var(--font-mono)" }}
            />
            {errors.id ? <span className="err">{errors.id}</span> : <span className="hint">{isNew ? "Auto-generated, but editable" : "ID cannot be changed"}</span>}
          </div>
          <div className="fld">
            <label>Category <span className="req">*</span></label>
            <select value={f.cat} onChange={e => set("cat", e.target.value)} className="select-bare" style={{ padding: "10px 28px 10px 0", borderBottom: "1px solid var(--rule)", border: 0, borderRadius: 0 }}>
              {CATS.map(c => <option key={c.id} value={c.id}>{c.en} · {c.ne}</option>)}
            </select>
          </div>
        </div>

        <div className="fld">
          <label>Name (English) <span className="req">*</span></label>
          <input type="text" value={f.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Acoustic Guitar (Custom)" />
          {errors.name && <span className="err">{errors.name}</span>}
        </div>

        <div className="fld">
          <label>Name (Devanagari)</label>
          <input
            type="text"
            value={f.ne}
            onChange={e => set("ne", e.target.value)}
            placeholder="नेपालीमा नाम"
            style={{ fontFamily: "var(--font-deva)", fontSize: 17 }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18 }}>
          <div className="fld">
            <label>Price · Rs. <span className="req">*</span></label>
            <input
              type="number"
              min="0"
              step="50"
              value={f.price}
              onChange={e => set("price", e.target.value)}
              placeholder="4500"
            />
            {errors.price && <span className="err">{errors.price}</span>}
          </div>
          <div className="fld">
            <label>Was-Price · Rs.</label>
            <input
              type="number"
              min="0"
              step="50"
              value={f.was || ""}
              onChange={e => set("was", e.target.value || null)}
              placeholder="Optional — for sale items"
            />
            {errors.was && <span className="err">{errors.was}</span>}
          </div>
          <div className="fld">
            <label>Tag</label>
            <select className="select-bare" value={f.tag || ""} onChange={e => set("tag", e.target.value || null)} style={{ padding: "10px 28px 10px 0", borderBottom: "1px solid var(--rule)", border: 0, borderRadius: 0 }}>
              <option value="">— None —</option>
              <option value="New">New</option>
              <option value="Sale">Sale</option>
              <option value="Bestseller">Bestseller</option>
              <option value="Handmade">Handmade</option>
              <option value="Heritage">Heritage</option>
              <option value="Pro">Pro</option>
              <option value="Stage">Stage</option>
              <option value="Studio">Studio</option>
              <option value="Newari">Newari</option>
              <option value="Compact">Compact</option>
              <option value="Pocketable">Pocketable</option>
              <option value="Essential">Essential</option>
              <option value="Set">Set</option>
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <div className="fld">
            <label>Origin / Source</label>
            <input type="text" value={f.origin || ""} onChange={e => set("origin", e.target.value)} placeholder="e.g. Bhojpur, Imported" />
          </div>
          <div className="fld">
            <label>Body / Material</label>
            <input type="text" value={f.body || ""} onChange={e => set("body", e.target.value)} placeholder="e.g. khirra wood, alder" />
          </div>
        </div>

        <div className="fld">
          <label>Description</label>
          <textarea
            rows={4}
            value={f.desc || ""}
            onChange={e => set("desc", e.target.value)}
            placeholder="A short paragraph describing the instrument — its sound, build, and use."
          />
        </div>

        <div className="fld">
          <label>Image URL</label>
          <input
            type="url"
            value={f.image || ""}
            onChange={e => set("image", e.target.value)}
            placeholder="https://… (paste a direct image link — jpg, png, webp)"
            style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}
          />
          {errors.image
            ? <span className="err">{errors.image}</span>
            : <span className="hint">Leave blank to show the placeholder pattern.</span>}
          {f.image && /^https?:\/\//i.test(f.image) && (
            <div style={{ marginTop: 12, width: 140, height: 140, border: "1px solid var(--rule)", background: "var(--bg-2)", overflow: "hidden" }}>
              <img
                src={f.image}
                alt="preview"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            </div>
          )}
        </div>

        <div className="fld">
          <label>Daraz URL</label>
          <input
            type="url"
            value={f.darazUrl || ""}
            onChange={e => set("darazUrl", e.target.value)}
            placeholder="https://www.daraz.com.np/... (optional)"
            style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}
          />
          {errors.darazUrl
            ? <span className="err">{errors.darazUrl}</span>
            : <span className="hint">When set, a "Buy from Daraz" button appears on this product's page.</span>}
        </div>

        <div style={{ display: "flex", gap: 24, alignItems: "center", marginTop: 18, padding: "16px 18px", border: "1px solid var(--rule)", background: "var(--bg-2)" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", flex: 1 }}>
            <input type="checkbox" checked={f.inStock !== false} onChange={e => set("inStock", e.target.checked)} style={{ accentColor: "var(--accent)", width: 18, height: 18 }} />
            <span>
              <strong>In Stock</strong>
              <span style={{ display: "block", fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
                Uncheck to mark as out of stock — hides "Add to Cart" on the storefront
              </span>
            </span>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <input type="checkbox" checked={f.featured || false} onChange={e => set("featured", e.target.checked)} style={{ accentColor: "var(--accent)", width: 18, height: 18 }} />
            <span>
              <strong>Featured</strong>
              <span style={{ display: "block", fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
                Show on homepage featured section
              </span>
            </span>
          </label>
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--rule)" }}>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn accent" onClick={submit}>
            {isNew ? "Add Product" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ProductsAdmin, ProductEditor });
