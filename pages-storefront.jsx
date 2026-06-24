// =========================================================
// Pages: Home, Category, Product Detail, All Products
// v2: dynamic homepage — featured flag from Supabase,
//     per-category sections auto-built from live data
// =========================================================

// ===== HomePage =====
function HomePage({ navigate, onAdd, heroLayout }) {
  const [state] = useStore();
  const products = getProducts();
  const counts   = getCountByCat();

  // Featured: use `featured` flag from Supabase; fallback to tag-based selection
  const featuredProducts = React.useMemo(() => {
    const byFlag = products.filter(p => p.featured);
    if (byFlag.length >= 4) return byFlag.slice(0, 8);
    // Fallback: bestsellers, sale items, heritage
    return products
      .filter(p => p.tag === "Bestseller" || p.badge === "Bestseller" || p.tag === "Sale" || p.tag === "Heritage")
      .slice(0, 8);
  }, [products]);

  // New arrivals: tag or badge = "New"
  const newArrivals = React.useMemo(() => {
    return products.filter(p => p.tag === "New" || p.badge === "New").slice(0, 4);
  }, [products]);

  // Dynamic category highlights: pick 2 categories with the most products
  // that are not already covered by featuredProducts
  const catHighlights = React.useMemo(() => {
    return CATS
      .map(c => ({ cat: c, items: products.filter(p => p.cat === c.id).slice(0, 4) }))
      .filter(s => s.items.length >= 2)
      .sort((a, b) => b.items.length - a.items.length)
      .slice(0, 2);
  }, [products]);

  return (
    <main>
      {/* === HERO === */}
      <section className="hero" style={{ position: "relative" }}>
        <MountainStrip position="bottom" />
        <div className="wrap">
          <div>
            <div className="hero-eyebrow">
              <span className="dot" />
              <span className="h-mono">Vol. 12 · Spring 2026</span>
              <span className="h-rule" style={{ flex: 1 }} />
              <span className="h-mono" style={{ fontFamily: "var(--font-deva)" }}>संस्करण १२</span>
            </div>
            <h1 className="h-display">
              <span className="ne-line">हिमालयदेखि स्टेजसम्म</span>
              The instruments<br />of the <span className="it">himalaya</span>,<br />delivered.
            </h1>
            <p className="lead">
              From hand-carved sarangis of the eastern hills to gig-ready amplifiers — {products.length || "40"}+ curated instruments, cash on delivery anywhere in Nepal.
            </p>
            <div className="hero-cta">
              <button className="btn" onClick={() => navigate({ name: "category", id: "traditional" })}>Shop Traditional</button>
              <button className="btn ghost" onClick={() => navigate({ name: "all" })}>Browse All</button>
            </div>
            <div className="meta">
              <span>{products.length || "—"} Instruments</span>
              <span style={{ width: 4, height: 4, background: "var(--ink-3)", borderRadius: "50%" }} />
              <span>{CATS.length} Categories</span>
              <span style={{ width: 4, height: 4, background: "var(--ink-3)", borderRadius: "50%" }} />
              <span>{toDeva("नगद डेलिभरी")} · CASH</span>
            </div>
          </div>
          {heroLayout === "marquee" ? (
            <React.Fragment>
              <div className="hero-stage"><Placeholder label="sarangi · editorial shot" tone="dark" style={{ height: "100%" }} /></div>
              <div className="hero-stage side"><Placeholder label="madal close-up" tone="saffron" style={{ height: "100%" }} /></div>
            </React.Fragment>
          ) : (
            <div className="hero-stage">
              <Placeholder label="hero · sarangi / madal editorial composition" tone="dark" style={{ height: "100%" }} />
            </div>
          )}
        </div>
      </section>

      {/* === SOCIAL MEDIA === */}
      <SocialSection />

      {/* === CATEGORIES === */}
      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div>
              <span className="h-eyebrow">Browse by tradition</span>
              <h2 className="h-display">Seven rooms,<br />one storefront.</h2>
            </div>
            <div className="meta h-mono">
              <button className="link-btn" onClick={() => navigate({ name: "all" })}>View all products →</button>
            </div>
          </div>
          <div className="cat-strip">
            {CATS.map((c, i) => (
              <button key={c.id} className="cat-card" onClick={() => navigate({ name: "category", id: c.id })}>
                <span className="num">0{i + 1} / 0{CATS.length}</span>
                <div className="en">{c.en}</div>
                <div className="ne">{c.ne}</div>
                <div className="count">
                  <span>{counts[c.id] || 0} items</span>
                  <span>↗</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* === FEATURED / BESTSELLERS === */}
      {featuredProducts.length > 0 && (
        <section className="section" style={{ borderTop: "1px solid var(--rule)" }}>
          <div className="wrap">
            <div className="section-head">
              <div>
                <span className="h-eyebrow">
                  {products.filter(p => p.featured).length >= 4 ? "Handpicked for you" : "Most ordered this season"}
                </span>
                <h2 className="h-display">
                  {products.filter(p => p.featured).length >= 4 ? "Featured." : "Bestsellers."}
                </h2>
              </div>
              <div className="meta">
                <button className="link-btn" onClick={() => navigate({ name: "all" })}>View all →</button>
              </div>
            </div>
            <div className="product-grid">
              {featuredProducts.map(p => (
                <ProductCard key={p.id} p={p} onClick={pp => navigate({ name: "product", id: pp.id })} onAdd={onAdd} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* === DYNAMIC CATEGORY HIGHLIGHTS === */}
      {catHighlights.map(({ cat, items }) => (
        <section key={cat.id} className="section" style={{ background: "var(--bg-2)", borderTop: 0 }}>
          <div className="wrap">
            <div className="section-head">
              <div>
                <span className="h-eyebrow">{cat.ne} · {cat.desc}</span>
                <h2 className="h-display">{cat.en}.</h2>
              </div>
              <div className="meta h-mono">
                <button className="link-btn" onClick={() => navigate({ name: "category", id: cat.id })}>
                  View all {counts[cat.id] || 0} items →
                </button>
              </div>
            </div>
            <div className="product-grid">
              {items.map(p => (
                <ProductCard key={p.id} p={p} onClick={pp => navigate({ name: "product", id: pp.id })} onAdd={onAdd} />
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* === NEW ARRIVALS === */}
      {newArrivals.length > 0 && (
        <section className="section" style={{ borderTop: "1px solid var(--rule)" }}>
          <div className="wrap">
            <div className="section-head">
              <div>
                <span className="h-eyebrow">Just landed in store</span>
                <h2 className="h-display">New arrivals.</h2>
              </div>
              <div className="meta h-mono">
                <span className="h-deva">नयाँ · </span>{toDeva(newArrivals.length)} items
              </div>
            </div>
            <div className="product-grid">
              {newArrivals.map(p => (
                <ProductCard key={p.id} p={p} onClick={pp => navigate({ name: "product", id: pp.id })} onAdd={onAdd} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* === Empty state (loading or no products) === */}
      {state.loading && (
        <section className="section">
          <div className="wrap" style={{ textAlign: "center", padding: "60px 0", color: "var(--ink-3)" }}>
            <div className="h-mono" style={{ fontSize: 13 }}>Loading catalog…</div>
          </div>
        </section>
      )}
    </main>
  );
}

// =========================================================
// Category Page
// =========================================================
function CategoryPage({ catId, navigate, onAdd }) {
  const [state] = useStore();
  const cat = CAT_BY_ID[catId] || { id: catId, en: catId || "Category", ne: "", desc: "" };
  const counts = getCountByCat();
  const allProducts = getProducts();
  const [sort, setSort] = React.useState("featured");
  const [priceBand, setPriceBand] = React.useState("all");
  const [tagFilter, setTagFilter] = React.useState("all");

  const products = React.useMemo(() => {
    let list = allProducts.filter(p => p.cat === catId);
    if (priceBand === "low") list = list.filter(p => p.price < 5000);
    if (priceBand === "mid") list = list.filter(p => p.price >= 5000 && p.price < 20000);
    if (priceBand === "high") list = list.filter(p => p.price >= 20000);
    if (tagFilter === "sale") list = list.filter(p => p.was);
    if (tagFilter === "new") list = list.filter(p => p.tag === "New" || p.badge === "New");
    if (sort === "lowhigh") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "highlow") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [catId, sort, priceBand, tagFilter, allProducts]);

  return (
    <main className="cat-page">
      <div className="wrap">
        <div className="crumbs">
          <a onClick={() => navigate({ name: "home" })} style={{ cursor: "pointer" }}>Home</a>
          <span className="sep">/</span><span>{cat.en}</span>
        </div>
        <div className="cat-hero">
          <div>
            <span className="h-eyebrow">{counts[catId] || 0} instruments</span>
            <h1>{cat.en}</h1>
            <div className="ne">{cat.ne}</div>
          </div>
          <div>
            <p className="desc">{cat.desc}</p>
            <div className="stats">
              <span>{toDeva(counts[catId] || 0)} items</span>
              <span>·</span><span>cash delivery</span>
              <span>·</span><span>nepal-wide</span>
            </div>
          </div>
        </div>

        <div className="cat-toolbar">
          <span className="h-mono" style={{ marginRight: 8 }}>Price:</span>
          {[["all","All"],["low","Under 5K"],["mid","5K – 20K"],["high","20K+"]].map(([k,label]) => (
            <button key={k} className="chip" aria-pressed={priceBand === k} onClick={() => setPriceBand(k)}>{label}</button>
          ))}
          <span className="h-mono" style={{ marginLeft: 16, marginRight: 8 }}>Tag:</span>
          {[["all","All"],["new","New"],["sale","On Sale"]].map(([k,label]) => (
            <button key={k} className="chip" aria-pressed={tagFilter === k} onClick={() => setTagFilter(k)}>{label}</button>
          ))}
          <div className="toolbar-right">
            <span className="h-mono">Sort by:</span>
            <select className="select-bare" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="featured">Featured</option>
              <option value="lowhigh">Price · Low to High</option>
              <option value="highlow">Price · High to Low</option>
              <option value="name">Name · A to Z</option>
            </select>
          </div>
        </div>

        {products.length === 0 ? (
          <div style={{ padding: "80px 0", textAlign: "center", color: "var(--ink-3)" }}>
            <div className="h-deva" style={{ fontSize: 28, color: "var(--ink-2)" }}>केही फेला परेन</div>
            <p>No items match these filters.</p>
          </div>
        ) : (
          <div className="product-grid">
            {products.map(p => (
              <ProductCard key={p.id} p={p} onClick={pp => navigate({ name: "product", id: pp.id })} onAdd={onAdd} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

// =========================================================
// Product Detail Page
// =========================================================
function ProductPage({ id, navigate, onAdd }) {
  const p = getProductById(id);
  const [qty, setQty] = React.useState(1);
  const [activeThumb, setActiveThumb] = React.useState(0);

  if (!p) return (
    <main className="pdp"><div className="wrap"><p>Product not found.</p></div></main>
  );

  const cat = CAT_BY_ID[p.cat] || { id: p.cat, en: p.cat || "Category", ne: "", desc: "" };
  const tone = productPlaceholderTone(p.id);
  const phLabel = productPhLabel(p);
  const productImg = p.image || p.img || "";
  const related = getProducts().filter(x => x.cat === p.cat && x.id !== p.id).slice(0, 4);

  return (
    <main className="pdp">
      <div className="wrap">
        <div className="crumbs">
          <a onClick={() => navigate({ name: "home" })} style={{ cursor: "pointer" }}>Home</a>
          <span className="sep">/</span>
          <a onClick={() => navigate({ name: "category", id: p.cat })} style={{ cursor: "pointer" }}>{cat.en}</a>
          <span className="sep">/</span>
          <span>{p.name}</span>
        </div>

        <div className="pdp-main">
          <div className="pdp-gallery">
            <div className="main-shot">
              {productImg && activeThumb === 0 ? (
                <ProductImage src={productImg} alt={p.name} fallbackLabel={phLabel + " · main"} fallbackTone={tone} />
              ) : (
                <Placeholder label={[phLabel + " · main", phLabel + " · detail", phLabel + " · in use", phLabel + " · scale"][activeThumb]} tone={[tone,"","dark","saffron"][activeThumb]} style={{ height: "100%" }} />
              )}
            </div>
            <div className="thumbs">
              {[0,1,2,3].map(i => (
                <div key={i} className={"thumb" + (activeThumb === i ? " active" : "")} onClick={() => setActiveThumb(i)}>
                  {productImg && i === 0 ? (
                    <ProductImage src={productImg} alt="" fallbackLabel={"" + (i+1)} fallbackTone={tone} />
                  ) : (
                    <Placeholder label={"" + (i+1)} tone={[tone,"","dark","saffron"][i]} style={{ height: "100%", padding: 4 }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pdp-info">
            <div className="cat-line">
              <span>{cat.en}</span>
              <span style={{ width: 4, height: 4, background: "var(--ink-3)", borderRadius: "50%" }} />
              <span>{p.origin}</span>
              {p.tag && (<><span style={{ width: 4, height: 4, background: "var(--ink-3)", borderRadius: "50%" }} /><span style={{ color: "var(--accent)" }}>{p.tag}</span></>)}
            </div>
            <h1>{p.name}</h1>
            <div className="ne-name">{p.ne}</div>

            <div className="price-row">
              <span className="price-now">{NPR(p.price)}</span>
              {p.was && <span className="price-was">{NPR(p.was)}</span>}
              {p.was && <span className="h-mono" style={{ color: "var(--accent)" }}>SAVE {NPR(p.was - p.price)}</span>}
            </div>

            <p className="blurb">{p.desc}</p>

            <div className="specs">
              <div className="row"><span className="k">Origin</span><span>{p.origin || "—"}</span></div>
              <div className="row"><span className="k">Material</span><span>{p.body || "—"}</span></div>
              <div className="row"><span className="k">Category</span><span>{cat.en} · {cat.ne}</span></div>
              <div className="row"><span className="k">Payment</span><span>Cash on delivery</span></div>
              <div className="row"><span className="k">Delivery</span><span>Nepal-wide · 2–7 days</span></div>
            </div>

            {p.inStock === false ? (
              <div className="qty-row">
                <button className="btn" disabled style={{ flex: 1, opacity: 0.5, cursor: "not-allowed", background: "#888", color: "white", border: "none" }}>
                  Out of Stock · स्टकमा छैन
                </button>
              </div>
            ) : (
              <div className="qty-row">
                <div className="qty">
                  <button onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
                  <input value={qty} onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))} />
                  <button onClick={() => setQty(qty + 1)}>+</button>
                </div>
                <button className="btn accent" style={{ flex: 1 }} onClick={() => onAdd(p, qty)}>
                  Add to cart · {NPR(p.price * qty)}
                </button>
              </div>
            )}

            {p.darazUrl && (
              <a className="btn block daraz buy-daraz" href={p.darazUrl} target="_blank" rel="noopener noreferrer">
                Buy from Daraz <span className="ext">↗</span>
              </a>
            )}

            <p className="h-mono" style={{ marginTop: 22, color: "var(--ink-3)" }}>
              ☎ Store keeper will call within 24 hours to confirm order ·{" "}
              <span className="h-deva">२४ घन्टा भित्र फोन गरिनेछ</span>
            </p>
          </div>
        </div>

        {related.length > 0 && (
          <section className="section" style={{ borderTop: "1px solid var(--rule)", marginTop: 80 }}>
            <div className="section-head">
              <div>
                <span className="h-eyebrow">You may also like</span>
                <h2 className="h-display" style={{ fontSize: "clamp(28px, 3.4vw, 40px)" }}>More from {cat.en}</h2>
              </div>
              <button className="link-btn" onClick={() => navigate({ name: "category", id: p.cat })}>View all →</button>
            </div>
            <div className="product-grid">
              {related.map(rp => (
                <ProductCard key={rp.id} p={rp} onClick={pp => navigate({ name: "product", id: pp.id })} onAdd={onAdd} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

// =========================================================
// All Products Page
// =========================================================
function AllProductsPage({ navigate, onAdd }) {
  const allProducts = getProducts();
  const counts = getCountByCat();

  const [cats,    setCats]    = React.useState(() => new Set());
  const [tag,     setTag]     = React.useState("all");
  const [origin,  setOrigin]  = React.useState("all");
  const [sort,    setSort]    = React.useState("featured");
  const [search,  setSearch]  = React.useState("");

  const { minPrice, maxPrice } = React.useMemo(() => {
    if (allProducts.length === 0) return { minPrice: 0, maxPrice: 100000 };
    const prices = allProducts.map(p => p.price);
    return { minPrice: Math.min(...prices), maxPrice: Math.max(...prices) };
  }, [allProducts]);
  const [priceMin, setPriceMin] = React.useState(minPrice);
  const [priceMax, setPriceMax] = React.useState(maxPrice);
  React.useEffect(() => { setPriceMin(minPrice); setPriceMax(maxPrice); }, [minPrice, maxPrice]);

  const origins = React.useMemo(() => [...new Set(allProducts.map(p => p.origin).filter(Boolean))].sort(), [allProducts]);
  const tags    = React.useMemo(() => [...new Set(allProducts.map(p => p.tag).filter(Boolean))].sort(), [allProducts]);

  const toggleCat = id => setCats(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const clearAll = () => { setCats(new Set()); setTag("all"); setOrigin("all"); setSort("featured"); setSearch(""); setPriceMin(minPrice); setPriceMax(maxPrice); };

  const filtered = React.useMemo(() => {
    let list = [...allProducts];
    if (cats.size > 0) list = list.filter(p => cats.has(p.cat));
    if (tag !== "all") { if (tag === "_sale") list = list.filter(p => p.was); else list = list.filter(p => p.tag === tag || p.badge === tag); }
    if (origin !== "all") list = list.filter(p => p.origin === origin);
    list = list.filter(p => p.price >= priceMin && p.price <= priceMax);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) || (p.ne || "").includes(q) ||
        (p.desc || "").toLowerCase().includes(q) || (p.origin || "").toLowerCase().includes(q)
      );
    }
    if (sort === "lowhigh") list.sort((a, b) => a.price - b.price);
    else if (sort === "highlow") list.sort((a, b) => b.price - a.price);
    else if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "featured") list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    return list;
  }, [allProducts, cats, tag, origin, priceMin, priceMax, search, sort]);

  const activeFilterCount = (cats.size > 0 ? 1 : 0) + (tag !== "all" ? 1 : 0) + (origin !== "all" ? 1 : 0) + (priceMin !== minPrice || priceMax !== maxPrice ? 1 : 0) + (search.trim() ? 1 : 0);

  return (
    <main className="cat-page all-products">
      <div className="wrap">
        <div className="crumbs">
          <a onClick={() => navigate({ name: "home" })} style={{ cursor: "pointer" }}>Home</a>
          <span className="sep">/</span><span>All Products</span>
        </div>
        <div className="cat-hero">
          <div>
            <span className="h-eyebrow">{allProducts.length} instruments · {CATS.length} categories</span>
            <h1>All Products</h1>
            <div className="ne">सबै उत्पादनहरू</div>
          </div>
          <div>
            <p className="desc">The complete catalog — from hand-carved sarangis to gig amps. Filter by category, price band, origin, or tag.</p>
            <div className="stats">
              <span>{toDeva(allProducts.length)} items</span><span>·</span>
              <span>cash delivery</span><span>·</span><span>nepal-wide</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "14px 18px", border: "1px solid var(--rule)", background: "var(--bg-2)", marginBottom: 28, flexWrap: "wrap" }}>
          <span className="h-mono" style={{ color: "var(--ink-3)", fontSize: 11 }}>Search</span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Try 'sarangi', 'djembe', 'flute'…"
            style={{ flex: 1, minWidth: 220, background: "transparent", border: 0, outline: "none", fontSize: 16, color: "var(--ink)", padding: "4px 0" }} />
          {activeFilterCount > 0 && <button className="link-btn" onClick={clearAll}>Clear all ({activeFilterCount}) ×</button>}
        </div>

        {/* Filters */}
        <div className="all-filter-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 28, padding: "24px 0", borderTop: "1px solid var(--rule)", borderBottom: "1px solid var(--rule)", marginBottom: 28 }}>
          <div>
            <div className="h-mono" style={{ color: "var(--ink-3)", fontSize: 11, marginBottom: 12 }}>Category {cats.size > 0 && `· ${cats.size}/${CATS.length}`}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              <button className="chip" aria-pressed={cats.size === 0} onClick={() => setCats(new Set())}>All <span style={{ color: "var(--ink-3)", marginLeft: 4 }}>({allProducts.length})</span></button>
              {CATS.map(c => (
                <button key={c.id} className="chip" aria-pressed={cats.has(c.id)} onClick={() => toggleCat(c.id)} title={c.ne}>
                  {c.en} <span style={{ color: "var(--ink-3)", marginLeft: 4 }}>({counts[c.id] || 0})</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="h-mono" style={{ color: "var(--ink-3)", fontSize: 11, marginBottom: 12 }}>Price range</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "var(--font-mono)", fontSize: 13, marginBottom: 10 }}>
              <span>{NPR(priceMin)}</span><span style={{ color: "var(--ink-3)" }}>—</span><span>{NPR(priceMax)}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input type="range" min={minPrice} max={maxPrice} step={100} value={priceMin} onChange={e => setPriceMin(Math.min(Number(e.target.value), priceMax))} style={{ accentColor: "var(--accent)" }} aria-label="Min price" />
              <input type="range" min={minPrice} max={maxPrice} step={100} value={priceMax} onChange={e => setPriceMax(Math.max(Number(e.target.value), priceMin))} style={{ accentColor: "var(--accent)" }} aria-label="Max price" />
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
              <button className="chip" onClick={() => { setPriceMin(minPrice); setPriceMax(5000); }}>Under 5K</button>
              <button className="chip" onClick={() => { setPriceMin(5000); setPriceMax(20000); }}>5K–20K</button>
              <button className="chip" onClick={() => { setPriceMin(20000); setPriceMax(maxPrice); }}>20K+</button>
            </div>
          </div>

          <div>
            <div className="h-mono" style={{ color: "var(--ink-3)", fontSize: 11, marginBottom: 12 }}>Tag</div>
            <select className="select-bare" value={tag} onChange={e => setTag(e.target.value)} style={{ width: "100%", padding: "10px 28px 10px 0", border: 0, borderBottom: "1px solid var(--rule)", borderRadius: 0 }}>
              <option value="all">All tags</option>
              <option value="_sale">On sale</option>
              {tags.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <div className="h-mono" style={{ color: "var(--ink-3)", fontSize: 11, marginBottom: 12 }}>Origin</div>
            <select className="select-bare" value={origin} onChange={e => setOrigin(e.target.value)} style={{ width: "100%", padding: "10px 28px 10px 0", border: 0, borderBottom: "1px solid var(--rule)", borderRadius: 0 }}>
              <option value="all">All origins</option>
              {origins.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        {/* Results */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div className="h-mono" style={{ color: "var(--ink-3)" }}>
            Showing <strong style={{ color: "var(--ink)" }}>{filtered.length}</strong> of {allProducts.length} products
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span className="h-mono" style={{ color: "var(--ink-3)" }}>Sort by:</span>
            <select className="select-bare" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="featured">Featured first</option>
              <option value="lowhigh">Price · Low to High</option>
              <option value="highlow">Price · High to Low</option>
              <option value="name">Name · A to Z</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: "100px 0", textAlign: "center", color: "var(--ink-3)" }}>
            <div className="h-deva" style={{ fontSize: 28, color: "var(--ink-2)", marginBottom: 8 }}>केही फेला परेन</div>
            <p style={{ margin: "0 0 22px" }}>No items match these filters.</p>
            <button className="btn ghost" onClick={clearAll}>Clear filters</button>
          </div>
        ) : (
          <div className="product-grid">
            {filtered.map(p => (
              <ProductCard key={p.id} p={p} onClick={pp => navigate({ name: "product", id: pp.id })} onAdd={onAdd} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

// ===== Social Media Embed Helpers =====

function detectPlatform(url) {
  if (/tiktok\.com/i.test(url)) return "tiktok";
  if (/instagram\.com/i.test(url)) return "instagram";
  if (/facebook\.com|fb\.watch/i.test(url)) return "facebook";
  return null;
}

// Extract TikTok video ID from URL
function tiktokVideoId(url) {
  const m = url.match(/video\/(\d+)/);
  return m ? m[1] : null;
}

// Single social embed card
function SocialEmbed({ post }) {
  const ref = React.useRef(null);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    if (!ref.current) return;
    setLoaded(false);
    const el = ref.current;
    el.innerHTML = "";

    if (post.platform === "tiktok") {
      const vid = tiktokVideoId(post.post_url);
      if (!vid) { el.textContent = "Invalid TikTok URL"; return; }
      const cite = `https://www.tiktok.com/embed/v2/${vid}`;
      const iframe = document.createElement("iframe");
      iframe.src = cite;
      iframe.style.cssText = "width:100%;height:100%;border:none;border-radius:12px;";
      iframe.allowFullscreen = true;
      iframe.onload = () => setLoaded(true);
      el.appendChild(iframe);
    } else if (post.platform === "instagram") {
      // Use Instagram embed iframe
      const embedUrl = post.post_url.replace(/\?.*$/, "").replace(/\/$/, "") + "/embed";
      const iframe = document.createElement("iframe");
      iframe.src = embedUrl;
      iframe.style.cssText = "width:100%;height:100%;border:none;border-radius:12px;overflow:hidden;";
      iframe.allowFullscreen = true;
      iframe.onload = () => setLoaded(true);
      el.appendChild(iframe);
    } else if (post.platform === "facebook") {
      const iframe = document.createElement("iframe");
      iframe.src = "https://www.facebook.com/plugins/video.php?href=" + encodeURIComponent(post.post_url) + "&show_text=false&width=350";
      iframe.style.cssText = "width:100%;height:100%;border:none;border-radius:12px;overflow:hidden;";
      iframe.allowFullscreen = true;
      iframe.allow = "autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share";
      iframe.onload = () => setLoaded(true);
      el.appendChild(iframe);
    }
  }, [post.post_url, post.platform]);

  const platformIcon = { tiktok: "TikTok", instagram: "Instagram", facebook: "Facebook" };
  const platformColor = { tiktok: "#000", instagram: "#E1306C", facebook: "#1877F2" };

  return (
    <div className="social-card" style={{ position: "relative", background: "var(--bg-2)", borderRadius: 12, overflow: "hidden", aspectRatio: "9/16", minHeight: 480 }}>
      {!loaded && (
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "var(--ink-3)", fontSize: 13 }}>
          Loading {platformIcon[post.platform]}...
        </div>
      )}
      <div ref={ref} style={{ width: "100%", height: "100%" }} />
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
        padding: "24px 14px 12px", color: "white", fontSize: 11, fontFamily: "var(--font-mono)",
        display: "flex", justifyContent: "space-between", alignItems: "center", pointerEvents: "none"
      }}>
        <span style={{ background: platformColor[post.platform], padding: "3px 8px", borderRadius: 4, fontWeight: 600, fontSize: 10 }}>
          {platformIcon[post.platform]}
        </span>
        {post.caption && <span style={{ opacity: 0.8, maxWidth: "60%", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{post.caption}</span>}
      </div>
    </div>
  );
}

// ===== Social Section for Homepage =====
function SocialSection() {
  const [posts, setPosts] = React.useState([]);
  const [err, setErr] = React.useState(null);

  React.useEffect(() => {
    sbFetchSocialPosts()
      .then(data => setPosts(data))
      .catch(e => { console.error("Social fetch:", e); setErr(e.message); });
  }, []);

  if (posts.length === 0) return null;

  return (
    <section className="section" style={{ borderTop: "1px solid var(--rule)", background: "var(--bg-2)" }}>
      <div className="wrap">
        <div className="section-head">
          <div>
            <span className="h-eyebrow">Follow us · हामीलाई फलो गर्नुहोस्</span>
            <h2 className="h-display">Latest from<br />our socials.</h2>
          </div>
          <div className="meta h-mono" style={{ display: "flex", gap: 16 }}>
            <span style={{ color: "var(--ink-3)" }}>TikTok · Instagram · Facebook</span>
          </div>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 24, marginTop: 8
        }}>
          {posts.map(p => <SocialEmbed key={p.id} post={p} />)}
        </div>
      </div>
    </section>
  );
}

// ===== Admin: Social Posts Manager =====
function SocialPostsAdmin() {
  const [posts, setPosts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [newUrl, setNewUrl] = React.useState("");
  const [newCaption, setNewCaption] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  const load = async () => {
    try {
      setLoading(true);
      const data = await sbFetchAllSocialPosts();
      setPosts(data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  React.useEffect(() => { load(); }, []);

  const addPost = async (e) => {
    e?.preventDefault();
    const url = newUrl.trim();
    if (!url) return;
    const platform = detectPlatform(url);
    if (!platform) { setError("URL must be from TikTok, Instagram, or Facebook."); return; }
    setSaving(true); setError("");
    try {
      await sbUpsertSocialPost({ platform, post_url: url, caption: newCaption.trim(), active: true, sort_order: 0 });
      setNewUrl(""); setNewCaption("");
      await load();
    } catch (e) { setError("Save failed: " + e.message); }
    finally { setSaving(false); }
  };

  const toggleActive = async (post) => {
    try {
      await sbUpsertSocialPost({ ...post, active: !post.active });
      await load();
    } catch (e) { setError(e.message); }
  };

  const remove = async (id) => {
    if (!confirm("Delete this social post?")) return;
    try {
      await sbDeleteSocialPost(id);
      await load();
    } catch (e) { setError(e.message); }
  };

  const platformIcon = { tiktok: "TikTok", instagram: "Instagram", facebook: "Facebook" };
  const platformColor = { tiktok: "#000", instagram: "#E1306C", facebook: "#1877F2" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", margin: "0 0 4px" }}>Social Posts</h2>
          <div className="h-mono" style={{ color: "var(--ink-3)", fontSize: 11 }}>
            Paste a TikTok, Instagram, or Facebook post/reel URL to embed it on the homepage.
          </div>
        </div>
        <span className="h-mono" style={{ color: "var(--ink-3)" }}>{posts.filter(p => p.active).length} active</span>
      </div>

      {/* Add new */}
      <form onSubmit={addPost} style={{ border: "1px solid var(--rule)", padding: 20, marginBottom: 28, background: "var(--bg-2)" }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div className="fld" style={{ flex: 2, minWidth: 280 }}>
            <label>Post / Reel URL</label>
            <input type="url" value={newUrl} onChange={e => { setNewUrl(e.target.value); setError(""); }}
              placeholder="https://www.tiktok.com/@ratnamusic/video/..." disabled={saving} />
          </div>
          <div className="fld" style={{ flex: 1, minWidth: 180 }}>
            <label>Caption (optional)</label>
            <input type="text" value={newCaption} onChange={e => setNewCaption(e.target.value)}
              placeholder="New guitar drop!" disabled={saving} />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button type="submit" className="btn accent" disabled={saving || !newUrl.trim()}>
              {saving ? "Adding…" : "Add Post"}
            </button>
          </div>
        </div>
        {error && <div className="admin-login-error" role="alert" style={{ marginTop: 12 }}>{error}</div>}
      </form>

      {/* List */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--ink-3)" }}>Loading…</div>
      ) : posts.length === 0 ? (
        <div style={{ padding: 60, textAlign: "center", border: "1px dashed var(--rule)" }}>
          <p style={{ color: "var(--ink-2)", margin: "0 0 8px" }}>No social posts yet.</p>
          <p className="h-mono" style={{ color: "var(--ink-3)", fontSize: 11 }}>Paste a URL above to add one.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {posts.map(p => (
            <div key={p.id} style={{
              display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
              border: "1px solid var(--rule)", background: p.active ? "var(--bg)" : "var(--bg-2)",
              opacity: p.active ? 1 : 0.55
            }}>
              <span style={{
                background: platformColor[p.platform], color: "white",
                padding: "3px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, fontFamily: "var(--font-mono)", minWidth: 70, textAlign: "center"
              }}>
                {platformIcon[p.platform]}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.post_url}</div>
                {p.caption && <div className="h-mono" style={{ color: "var(--ink-3)", fontSize: 11, marginTop: 2 }}>{p.caption}</div>}
              </div>
              <button className="chip" aria-pressed={p.active} onClick={() => toggleActive(p)} title={p.active ? "Hide from homepage" : "Show on homepage"}>
                {p.active ? "Visible" : "Hidden"}
              </button>
              <button className="link-btn" style={{ color: "var(--ink-3)" }} onClick={() => remove(p.id)}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { HomePage, CategoryPage, ProductPage, AllProductsPage, SocialSection, SocialPostsAdmin });
