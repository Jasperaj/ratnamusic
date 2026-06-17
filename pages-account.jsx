// =========================================================
// Account, Admin, About pages  v2
// AccountPage: loads profile from Supabase, allows editing
// =========================================================

function statusLabel(s) {
  return ({ pending: "Pending", placed: "Placed", confirmed: "Confirmed", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled" })[s] || s;
}
function fmtDate(iso) {
  return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// =========================================================
// Account Page
// =========================================================
function AccountPage({ navigate, onLoginNeeded }) {
  const [state] = useStore();
  const user = state.user;
  const [tab, setTab] = React.useState("orders");

  // Order detail modal
  const [openOrderId, setOpenOrderId] = React.useState(null);

  // Profile editing
  const [editing,  setEditing]  = React.useState(false);
  const [profForm, setProfForm] = React.useState({});
  const [profErr,  setProfErr]  = React.useState("");
  const [profOk,   setProfOk]   = React.useState(false);
  const [saving,   setSaving]   = React.useState(false);

  // Pre-fill form whenever user object changes
  React.useEffect(() => {
    if (user) {
      setProfForm({
        name:           user.name           || "",
        phone:          user.phone          || "",
        secondaryPhone: user.secondaryPhone || "",
        address:        user.address        || "",
        landmark:       user.landmark       || "",
        mapLink:        user.mapLink        || "",
      });
    }
  }, [user]);

  if (!user) {
    return (
      <main className="account-page">
        <div className="wrap" style={{ display: "block", textAlign: "center", padding: "100px 0" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 5vw, 56px)", margin: 0 }}>
            Sign in to see your orders.
          </h1>
          <div className="h-deva" style={{ color: "var(--ink-2)", fontSize: 22, marginTop: 14 }}>
            आफ्ना अर्डरहरू हेर्न साइन इन गर्नुहोस्
          </div>
          <p style={{ color: "var(--ink-2)", maxWidth: "50ch", margin: "30px auto 36px" }}>
            Your order history, delivery addresses, and contact details all live here once you sign in.
          </p>
          <button className="btn accent" onClick={onLoginNeeded}>Sign in</button>
        </div>
      </main>
    );
  }

  const myOrders = state.orders.filter(o =>
    o.user?.email?.toLowerCase() === user.email?.toLowerCase()
  );

  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    setSaving(true); setProfErr(""); setProfOk(false);
    const result = await saveUserProfile(profForm);
    setSaving(false);
    if (result.ok) {
      setProfOk(true);
      setEditing(false);
      setTimeout(() => setProfOk(false), 3000);
    } else {
      setProfErr(result.error || "Could not save profile.");
    }
  };

  const avatarLetter = (user.picture && user.picture.length === 1) ? user.picture : (user.name?.[0] || "?").toUpperCase();
  const isAvatarUrl  = user.picture && user.picture.startsWith("http");

  return (
    <main className="account-page">
      <div className="wrap">
        <aside>
          <div style={{ marginBottom: 28 }}>
            {isAvatarUrl ? (
              <img src={user.picture} alt={user.name} style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", marginBottom: 14 }} />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--accent)", color: "white", display: "grid", placeItems: "center", fontFamily: "var(--font-display)", fontSize: 22, marginBottom: 14 }}>{avatarLetter}</div>
            )}
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 1.1 }}>{user.name}</div>
            <div className="h-mono" style={{ color: "var(--ink-3)", marginTop: 6 }}>{user.email}</div>
          </div>
          <nav className="account-nav">
            <button className={tab === "orders"  ? "active" : ""} onClick={() => setTab("orders")}>My Orders ({myOrders.length})</button>
            <button className={tab === "profile" ? "active" : ""} onClick={() => setTab("profile")}>Profile &amp; Address</button>
            <button onClick={() => { logout(); navigate({ name: "home" }); }}>Sign out</button>
          </nav>
        </aside>

        <section>
          {/* ===== ORDERS TAB ===== */}
          {tab === "orders" && (
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 4vw, 48px)", margin: "0 0 6px" }}>My Orders</h1>
              <div className="h-dava" style={{ color: "var(--ink-2)", marginBottom: 28 }}>मेरा अर्डरहरू</div>
              {myOrders.length === 0 ? (
                <div style={{ marginTop: 60, padding: "60px 40px", border: "1px dashed var(--rule)", textAlign: "center" }}>
                  <p style={{ color: "var(--ink-2)", margin: "0 0 20px" }}>You haven't placed any orders yet.</p>
                  <button className="btn" onClick={() => navigate({ name: "home" })}>Browse the store</button>
                </div>
              ) : (
                <div style={{ marginTop: 32 }}>
                  {myOrders.map(o => (
                    <div className="order-row" key={o.id} onClick={() => setOpenOrderId(o.id)} style={{ cursor: "pointer" }}>
                      <span className="id">{o.ref || o.id}</span>
                      <div>
                        <span className="items-line">
                          {o.items[0]?.name}{o.items.length > 1 ? ` + ${o.items.length - 1} more` : ""}
                          <span className="sub">
                            {fmtDate(o.createdAt)} · {o.items.reduce((s, i) => s + i.qty, 0)} item{o.items.reduce((s, i) => s + i.qty, 0) === 1 ? "" : "s"}
                          </span>
                        </span>
                      </div>
                      <span className="tot">{NPR(o.total)}</span>
                      <span className={"status-pill " + o.status}><span className="dot" />{statusLabel(o.status)}</span>
                    </div>
                  ))}
                  <p className="h-mono" style={{ color: "var(--ink-3)", marginTop: 16, fontSize: 11 }}>Tap an order to see full details.</p>
                </div>
              )}

              {/* ===== USER ORDER DETAIL MODAL ===== */}
              {openOrderId && (() => {
                const o = myOrders.find(x => x.id === openOrderId);
                if (!o) return null;
                const itemCount = o.items.reduce((s, i) => s + i.qty, 0);
                const reorder = () => {
                  o.items.forEach(i => addToCart(i.id, i.qty));
                  setOpenOrderId(null);
                  navigate({ name: "checkout" });
                };
                const canCancel = o.status === "pending" || o.status === "placed";
                return (
                  <div className="modal-scrim" onClick={() => setOpenOrderId(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ width: "min(600px,100%)", padding: 36 }}>
                      <button className="close-x" onClick={() => setOpenOrderId(null)}>×</button>
                      <span className="h-eyebrow">Order {o.ref || o.id}</span>
                      <h2 style={{ margin: "8px 0 2px", fontFamily: "var(--font-display)" }}>
                        {NPR(o.total)}
                        <span className={"status-pill " + o.status} style={{ marginLeft: 14, verticalAlign: "middle" }}><span className="dot" />{statusLabel(o.status)}</span>
                      </h2>
                      <div className="h-mono" style={{ color: "var(--ink-3)", marginBottom: 24 }}>{fmtDate(o.createdAt)} · {itemCount} item{itemCount === 1 ? "" : "s"}</div>

                      {/* Items */}
                      <div style={{ border: "1px solid var(--rule)", padding: "8px 18px", marginBottom: 20 }}>
                        {o.items.map((i, idx) => (
                          <div key={i.id || idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "12px 0", borderBottom: idx < o.items.length - 1 ? "1px dashed var(--rule)" : "none" }}>
                            <div>
                              <div style={{ fontSize: 15 }}>{i.name}</div>
                              {i.ne && <div className="h-deva" style={{ color: "var(--ink-3)", fontSize: 12 }}>{i.ne}</div>}
                              <div className="h-mono" style={{ color: "var(--ink-3)", fontSize: 11, marginTop: 2 }}>{NPR(i.price)} × {i.qty}</div>
                            </div>
                            <span style={{ fontFamily: "var(--font-mono)" }}>{NPR(i.price * i.qty)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Totals */}
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "4px 0" }}><span style={{ color: "var(--ink-2)" }}>Subtotal</span><span>{NPR(o.subtotal)}</span></div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "4px 0" }}><span style={{ color: "var(--ink-2)" }}>Delivery</span><span>{o.deliveryFee === 0 ? "Free" : NPR(o.deliveryFee)}</span></div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-display)", fontSize: 20, padding: "8px 0 0", borderTop: "1px solid var(--rule)", marginTop: 6 }}><span>Total</span><span>{NPR(o.total)}</span></div>
                      </div>

                      {/* Delivery info */}
                      <div style={{ background: "var(--bg-2)", padding: 18, marginBottom: 22 }}>
                        <div className="h-mono" style={{ color: "var(--ink-3)", fontSize: 11, marginBottom: 8 }}>Delivery to</div>
                        <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                          <strong>{o.user.name}</strong><br />
                          {o.user.address}<br />
                          {o.user.landmark && <span style={{ color: "var(--ink-2)" }}>↳ {o.user.landmark}<br /></span>}
                          <span style={{ fontFamily: "var(--font-mono)" }}>+977 {o.user.phone}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", gap: 12 }}>
                        <button className="btn ghost" onClick={() => setOpenOrderId(null)}>Close</button>
                        <button className="btn accent" style={{ flex: 1 }} onClick={reorder}>
                          Reorder these items →
                        </button>
                      </div>
                      {canCancel && (
                        <button className="link-btn" style={{ marginTop: 16, display: "block" }} onClick={async () => {
                          if (confirm("Cancel this order? The store keeper will be notified.")) {
                            await updateOrderStatus(o.id, "cancelled");
                          }
                        }}>Cancel this order</button>
                      )}
                      {!canCancel && o.status !== "cancelled" && (
                        <p className="h-mono" style={{ color: "var(--ink-3)", fontSize: 11, marginTop: 16 }}>
                          This order is already {statusLabel(o.status).toLowerCase()} and can no longer be cancelled online — call the store to make changes.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ===== PROFILE TAB ===== */}
          {tab === "profile" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 4vw, 48px)", margin: 0 }}>Profile</h1>
                {!editing && (
                  <button className="btn ghost small" onClick={() => { setEditing(true); setProfErr(""); setProfOk(false); }}>
                    Edit profile
                  </button>
                )}
              </div>
              <div className="h-dava" style={{ color: "var(--ink-2)", marginBottom: 28 }}>प्रोफाइल विवरण</div>

              {profOk && (
                <div style={{ background: "oklch(0.92 0.05 142)", border: "1px solid oklch(0.7 0.1 142)", padding: "12px 16px", marginBottom: 24, fontSize: 14 }}>
                  Profile saved successfully. ✓
                </div>
              )}

              {/* View mode */}
              {!editing && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginTop: 8 }}>
                  <div><h4 className="h-mono" style={{ margin: "0 0 8px" }}>Name</h4><p style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 20 }}>{user.name}</p></div>
                  <div><h4 className="h-mono" style={{ margin: "0 0 8px" }}>Email</h4><p style={{ margin: 0 }}>{user.email}</p></div>
                  <div><h4 className="h-mono" style={{ margin: "0 0 8px" }}>Mobile · +977</h4><p style={{ margin: 0, fontFamily: "var(--font-mono)" }}>{user.phone || <span style={{ color: "var(--ink-3)" }}>Not set</span>}</p></div>
                  <div><h4 className="h-mono" style={{ margin: "0 0 8px" }}>Secondary Mobile</h4><p style={{ margin: 0, fontFamily: "var(--font-mono)" }}>{user.secondaryPhone || <span style={{ color: "var(--ink-3)" }}>Not set</span>}</p></div>
                  <div style={{ gridColumn: "1 / -1" }}><h4 className="h-mono" style={{ margin: "0 0 8px" }}>Delivery Address</h4><p style={{ margin: 0 }}>{user.address || <span style={{ color: "var(--ink-3)" }}>Not set</span>}</p></div>
                  <div><h4 className="h-mono" style={{ margin: "0 0 8px" }}>Landmark</h4><p style={{ margin: 0 }}>{user.landmark || <span style={{ color: "var(--ink-3)" }}>Not set</span>}</p></div>
                  <div><h4 className="h-mono" style={{ margin: "0 0 8px" }}>Map Link</h4><p style={{ margin: 0, wordBreak: "break-all", fontSize: 13 }}>{user.mapLink || <span style={{ color: "var(--ink-3)" }}>Not set</span>}</p></div>
                </div>
              )}

              {/* Edit mode */}
              {editing && (
                <form onSubmit={handleSaveProfile}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                    <div className="fld">
                      <label>Full Name</label>
                      <input type="text" value={profForm.name} onChange={e => setProfForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" />
                    </div>
                    <div className="fld">
                      <label>Email</label>
                      <input type="email" value={user.email} readOnly style={{ color: "var(--ink-3)" }} />
                      <span className="hint">Verified via sign-in</span>
                    </div>
                    <div className="fld">
                      <label>Mobile · +977</label>
                      <input type="tel" inputMode="numeric" maxLength={10} value={profForm.phone}
                        onChange={e => setProfForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                        placeholder="98XXXXXXXX" />
                    </div>
                    <div className="fld">
                      <label>Secondary Mobile · Optional</label>
                      <input type="tel" inputMode="numeric" maxLength={10} value={profForm.secondaryPhone}
                        onChange={e => setProfForm(f => ({ ...f, secondaryPhone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                        placeholder="Optional" />
                    </div>
                    <div className="fld" style={{ gridColumn: "1 / -1" }}>
                      <label>Delivery Address</label>
                      <textarea rows={3} value={profForm.address} onChange={e => setProfForm(f => ({ ...f, address: e.target.value }))}
                        placeholder="Tole / street, Ward, Municipality, District, Province" />
                    </div>
                    <div className="fld">
                      <label>Nearby Landmark</label>
                      <input type="text" value={profForm.landmark} onChange={e => setProfForm(f => ({ ...f, landmark: e.target.value }))} placeholder="e.g. Near Naxal Bhagwati Temple" />
                    </div>
                    <div className="fld">
                      <label>Google Maps Link · Optional</label>
                      <input type="url" value={profForm.mapLink} onChange={e => setProfForm(f => ({ ...f, mapLink: e.target.value }))} placeholder="https://maps.google.com/…" />
                    </div>
                  </div>

                  {profErr && <div className="admin-login-error" role="alert" style={{ marginTop: 16 }}>{profErr}</div>}

                  <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                    <button type="button" className="btn ghost" onClick={() => setEditing(false)} disabled={saving}>Cancel</button>
                    <button type="submit" className="btn accent" disabled={saving}>{saving ? "Saving…" : "Save profile"}</button>
                  </div>
                  <p style={{ marginTop: 14, color: "var(--ink-3)", fontSize: 13 }}>
                    These details are saved to your account and auto-fill at checkout next time.
                  </p>
                </form>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

// =========================================================
// Admin Login Gate
// =========================================================
function AdminLoginGate({ children }) {
  const [state] = useStore();
  const [user,  setUser]  = React.useState("");
  const [pass,  setPass]  = React.useState("");
  const [error, setError] = React.useState("");
  const [busy,  setBusy]  = React.useState(false);

  if (state.adminAuthed) return children;

  const submit = async (e) => {
    e?.preventDefault();
    if (busy) return;
    setError(""); setBusy(true);
    try {
      const r = await adminLogin(user.trim(), pass);
      if (!r.ok) setError(r.error);
    } catch (err) {
      setError(err?.message || "Sign-in failed.");
    } finally { setBusy(false); }
  };

  return (
    <main className="admin-page">
      <div className="wrap" style={{ display: "grid", placeItems: "center", minHeight: "70vh" }}>
        <div style={{ background: "var(--bg)", border: "1px solid var(--rule)", padding: 44, width: "min(440px, 100%)" }}>
          <span className="h-eyebrow">Restricted · store keeper only</span>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 38, margin: "12px 0 6px", lineHeight: 1.05 }}>Admin sign-in</h1>
          <div className="h-dava" style={{ color: "var(--ink-2)", marginBottom: 26 }}>स्टोर किपर लग-इन</div>
          <p style={{ color: "var(--ink-2)", fontSize: 14, marginBottom: 28 }}>Enter your credentials to manage orders and products.</p>
          <form onSubmit={submit} autoComplete="on">
            <div className="fld">
              <label>Username <span className="req">*</span></label>
              <input type="text" name="username" autoComplete="username" value={user} onChange={e => { setUser(e.target.value); setError(""); }} placeholder="family" autoFocus disabled={busy} />
            </div>
            <div className="fld" style={{ marginTop: 14 }}>
              <label>Password <span className="req">*</span></label>
              <input type="password" name="password" autoComplete="current-password" value={pass} onChange={e => { setPass(e.target.value); setError(""); }} placeholder="••••••••" disabled={busy} />
            </div>
            {error && <div className="admin-login-error" role="alert">{error}</div>}
            <button className="btn block" type="submit" style={{ marginTop: 18 }} disabled={busy}>{busy ? "Signing in…" : "Sign in →"}</button>
          </form>
          <p className="fineprint" style={{ marginTop: 22, lineHeight: 1.6, color: "var(--ink-3)" }}>Authorised personnel only. Contact the store owner for credentials.</p>
        </div>
      </div>
    </main>
  );
}

// =========================================================
// Admin Page
// =========================================================
function AdminPage({ navigate }) {
  const [state] = useStore();
  const orders = state.orders;
  const [tab, setTab] = React.useState("orders");
  const [selectedId, setSelectedId] = React.useState(null);
  const [statusFilter, setStatusFilter] = React.useState("all");

  if (!state.adminAuthed) return <AdminLoginGate><AdminPage navigate={navigate} /></AdminLoginGate>;

  const filtered = orders.filter(o => statusFilter === "all" ? true : o.status === statusFilter);
  const selected  = orders.find(o => o.id === selectedId);
  const totalRev  = orders.reduce((s, o) => s + o.total, 0);
  const placed    = orders.filter(o => o.status === "pending" || o.status === "placed").length;
  const delivered = orders.filter(o => o.status === "delivered").length;

  return (
    <main className="admin-page">
      <div className="wrap">
        <div className="admin-head">
          <div>
            <span className="h-eyebrow">Store keeper view</span>
            <h1>Order Desk</h1>
            <div className="ne">अर्डर डेस्क</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {tab === "orders" && (
              <>
                <span className="h-mono" style={{ color: "var(--ink-3)" }}>Filter:</span>
                <select className="select-bare" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="all">All ({orders.length})</option>
                  <option value="pending">Pending ({orders.filter(o => o.status === "pending").length})</option>
                  <option value="confirmed">Confirmed ({orders.filter(o => o.status === "confirmed").length})</option>
                  <option value="shipped">Shipped ({orders.filter(o => o.status === "shipped").length})</option>
                  <option value="delivered">Delivered ({orders.filter(o => o.status === "delivered").length})</option>
                  <option value="cancelled">Cancelled ({orders.filter(o => o.status === "cancelled").length})</option>
                </select>
              </>
            )}
            <button className="link-btn" style={{ marginLeft: 14 }} onClick={async () => { await adminLogout(); navigate({ name: "home" }); }}>Sign out</button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--rule)", marginBottom: 32 }}>
          {[["orders", "Orders (" + orders.length + ")"], ["products", "Products (" + getProducts().length + ")"]].map(([id, label]) => (
            <button key={id} className="chip" aria-pressed={tab === id} onClick={() => setTab(id)}
              style={{ borderRadius: 0, border: 0, borderBottom: tab === id ? "2px solid var(--ink)" : "2px solid transparent", padding: "12px 18px" }}>
              {label}
            </button>
          ))}
        </div>

        {tab === "orders" && (
          <>
            <div className="admin-stats">
              <div className="stat"><div className="k">Total Orders</div><div className="v">{orders.length}</div><div className="v-sub">{toDeva(orders.length)} अर्डर</div></div>
              <div className="stat"><div className="k">Awaiting Call</div><div className="v" style={{ color: "var(--accent)" }}>{placed}</div><div className="v-sub">Within 24h</div></div>
              <div className="stat"><div className="k">Delivered</div><div className="v">{delivered}</div><div className="v-sub">{toDeva(delivered)} पठाइयो</div></div>
              <div className="stat"><div className="k">Revenue</div><div className="v" style={{ fontSize: 30 }}>{NPR(totalRev)}</div><div className="v-sub">Lifetime · COD</div></div>
            </div>

            <div className="admin-table">
              <div className="hd">
                <span>Order ID</span><span>Customer</span><span>Address</span><span>Phone</span><span>Items</span><span>Total</span><span>Status</span>
              </div>
              {filtered.map(o => (
                <div className="tr" key={o.id} onClick={() => setSelectedId(o.id)}>
                  <span className="id">{o.ref || o.id}<span style={{ display: "block", fontSize: 10, color: "var(--ink-3)", marginTop: 2 }}>{fmtDate(o.createdAt)}</span></span>
                  <span className="cust">{o.user.name}<span className="e">{o.user.email}</span></span>
                  <span className="addr">{o.user.address}<span style={{ display: "block", color: "var(--ink-3)", fontSize: 11, marginTop: 2 }}>↳ {o.user.landmark}</span></span>
                  <span className="phone">+977 {o.user.phone}{o.user.secondaryPhone && <span style={{ display: "block", color: "var(--ink-3)", fontSize: 10 }}>+977 {o.user.secondaryPhone}</span>}</span>
                  <span className="h-mono" style={{ fontSize: 12 }}>{o.items.length} × {o.items.reduce((s, i) => s + i.qty, 0)}</span>
                  <span className="tot">{NPR(o.total)}</span>
                  <span className={"status-pill " + o.status}><span className="dot" />{statusLabel(o.status)}</span>
                </div>
              ))}
              {filtered.length === 0 && <div style={{ padding: 40, textAlign: "center", color: "var(--ink-3)" }}>No orders match this filter.</div>}
            </div>
          </>
        )}

        {tab === "products" && <ProductsAdmin />}

        {selected && (
          <div className="modal-scrim" onClick={() => setSelectedId(null)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ width: "min(640px,100%)", padding: 36 }}>
              <button className="close-x" onClick={() => setSelectedId(null)}>×</button>
              <span className="h-eyebrow">Order {selected.ref || selected.id}</span>
              <h2 style={{ marginTop: 8 }}>{selected.user.name}</h2>
              <div className="h-mono" style={{ color: "var(--ink-3)", marginBottom: 22 }}>{fmtDate(selected.createdAt)}</div>
              <div className="admin-detail" style={{ padding: 24 }}>
                <div className="row2">
                  <div>
                    <div className="block"><h4>Email</h4><p>{selected.user.email}</p></div>
                    <div className="block"><h4>Mobile (Primary)</h4><p style={{ fontFamily: "var(--font-mono)" }}>+977 {selected.user.phone}</p></div>
                    {selected.user.secondaryPhone && <div className="block"><h4>Mobile (Secondary)</h4><p style={{ fontFamily: "var(--font-mono)" }}>+977 {selected.user.secondaryPhone}</p></div>}
                  </div>
                  <div>
                    <div className="block"><h4>Delivery Address</h4><p>{selected.user.address}</p></div>
                    <div className="block"><h4>Landmark</h4><p>{selected.user.landmark}</p></div>
                    {selected.user.mapLink && <div className="block"><h4>Map Link</h4><p style={{ fontSize: 12, wordBreak: "break-all" }}>{selected.user.mapLink}</p></div>}
                  </div>
                </div>
                <div className="block" style={{ marginTop: 20 }}>
                  <h4>Items</h4>
                  {selected.items.map(i => (
                    <div key={i.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px dashed var(--rule)", fontSize: 14 }}>
                      <span>{i.name} <span style={{ color: "var(--ink-3)" }}>× {i.qty}</span></span>
                      <span style={{ fontFamily: "var(--font-mono)" }}>{NPR(i.price * i.qty)}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", fontFamily: "var(--font-display)", fontSize: 22 }}>
                    <span>Total</span><span>{NPR(selected.total)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>
                    Subtotal {NPR(selected.subtotal)} + Delivery {selected.deliveryFee === 0 ? "Free" : NPR(selected.deliveryFee)} · Cash on delivery
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 22 }}>
                <div className="h-mono" style={{ marginBottom: 10, color: "var(--ink-3)" }}>Update status</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {["pending","confirmed","shipped","delivered","cancelled"].map(s => (
                    <button key={s} className="chip" aria-pressed={selected.status === s} onClick={() => updateOrderStatus(selected.id, s)}>{statusLabel(s)}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// =========================================================
// About / Contact
// =========================================================
function AboutPage({ navigate }) {
  return (
    <main className="about-page">
      <div className="wrap">
        <span className="h-eyebrow">About · हाम्रो बारेमा</span>
        <h1>A storefront for<br />Nepal's musical lineage.</h1>
        <div className="ne-h1">परम्परा, मञ्च र विद्यालयका लागि</div>
        <p className="lead">Nepal Musical Store began in 2018 as a small shop in Putalisadak, selling guitars to weekend players. Eight years later, we stock everything from hand-carved sarangis sourced directly from Bhojpur to stage-ready amplifiers — and we deliver, cash on the doorstep, across Nepal.</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "stretch", marginBottom: 56 }}>
          <div style={{ aspectRatio: "4/3" }}><Placeholder label="store · putalisadak storefront" tone="dark" style={{ height: "100%" }} /></div>
          <div style={{ aspectRatio: "4/3" }}><Placeholder label="store keeper · ramesh dai" tone="saffron" style={{ height: "100%" }} /></div>
        </div>

        <section className="store-map">
          <div className="map-head">
            <div>
              <span className="h-eyebrow">Find us · पसल कहाँ छ</span>
              <h2>Putalisadak, Kathmandu.</h2>
            </div>
            <a className="link-btn" href="https://www.google.com/maps/search/?api=1&query=Putalisadak%2C+Kathmandu%2C+Nepal" target="_blank" rel="noopener noreferrer">Open in Google Maps ↗</a>
          </div>
          <div className="map-frame">
            <iframe title="Nepal Musical Store — Putalisadak, Kathmandu" src="https://www.google.com/maps?q=Putalisadak%2C+Kathmandu%2C+Nepal&z=16&output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
          </div>
          <p className="map-foot h-mono">
            <span>Putalisadak Marg, opposite Padmodaya School</span>
            <span className="sep">·</span><span className="h-deva">पुतलीसडक</span>
            <span className="sep">·</span><span>10 min from Ratna Park</span>
          </p>
        </section>

        <div className="columns">
          <div>
            <span className="meta">01 — Visit</span>
            <h3>Putalisadak, Kathmandu</h3>
            <p style={{ color: "var(--ink-2)", marginTop: 8 }}>Putalisadak Marg, opposite Padmodaya School. <span className="h-deva">पुतलीसडक</span></p>
            <p className="h-mono" style={{ color: "var(--ink-3)", marginTop: 12, fontSize: 11 }}>Sun – Fri · 10:00 – 20:00<br />Saturday · Closed</p>
            <a className="link-btn" href="https://www.google.com/maps/search/?api=1&query=Putalisadak%2C+Kathmandu%2C+Nepal" target="_blank" rel="noopener noreferrer" style={{ marginTop: 14, display: "inline-block" }}>Get directions ↗</a>
          </div>
          <div>
            <span className="meta">02 — Call</span>
            <h3>+977 1-4242424</h3>
            <p style={{ color: "var(--ink-2)", marginTop: 8 }}>Call our store keeper directly. We answer between 10 AM and 8 PM, every day except Saturday.</p>
            <p className="h-mono" style={{ color: "var(--ink-3)", marginTop: 12, fontSize: 11 }}>Mobile: +977 98-41-23-45-67</p>
          </div>
          <div>
            <span className="meta">03 — Promise</span>
            <h3>Cash on delivery,<br />Nepal-wide.</h3>
            <p style={{ color: "var(--ink-2)", marginTop: 8 }}>You pay only when the instrument arrives at your door. Inside the valley, free over Rs. 20,000. Outside the valley, two to seven days.</p>
          </div>
        </div>
      </div>
    </main>
  );
}

Object.assign(window, { AccountPage, AdminPage, AboutPage, AdminLoginGate });
