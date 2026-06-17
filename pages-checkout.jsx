// =========================================================
// Cart Drawer, Login Modal (Google OAuth + Email+Password+OTP),
// Checkout, Confirmation
// =========================================================

// ===== Cart Drawer =====
function CartDrawer({ open, onClose, navigate }) {
  const [state] = useStore();
  if (!open) return null;
  const items    = state.cart;
  const subtotal = cartSubtotal(state);
  const fee      = deliveryFee(subtotal);

  return (
    <React.Fragment>
      <div className="drawer-scrim" onClick={onClose} />
      <aside className="drawer">
        <div className="drawer-head">
          <div>
            <h3>Your Cart</h3>
            <div className="h-deva" style={{ color: "var(--ink-3)", fontSize: 13 }}>तपाईंको कार्ट</div>
          </div>
          <button className="close" onClick={onClose}><CloseIcon /></button>
        </div>
        <div className="drawer-body">
          {items.length === 0 ? (
            <div className="cart-empty">
              <div className="ne" style={{ marginBottom: 18 }}>कार्ट खाली छ</div>
              <p style={{ marginBottom: 24 }}>Your cart is empty.</p>
              <button className="btn" onClick={onClose}>Continue shopping</button>
            </div>
          ) : (
            items.map(i => {
              const p = getProductById(i.id);
              const price = p ? p.price : (i.price || 0);
              const name = p ? p.name : (i.name || "Item");
              const ne = p ? p.ne : (i.ne || "");
              return (
                <div className="cart-item" key={i.id}>
                  <div className="thumb">
                    {p?.image
                      ? <img src={p.image} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.currentTarget.style.display = "none"; }} />
                      : <Placeholder label="" tone={productPlaceholderTone(i.id)} style={{ height: "100%", padding: 4 }} />}
                  </div>
                  <div className="info">
                    <div className="name">{name}</div>
                    <div className="ne">{ne}</div>
                    <div className="ctl">
                      <button onClick={() => updateQty(i.id, i.qty - 1)}>−</button>
                      <span>{i.qty}</span>
                      <button onClick={() => updateQty(i.id, i.qty + 1)}>+</button>
                      <span style={{ flex: 1 }} />
                      <button onClick={() => removeFromCart(i.id)}>Remove</button>
                    </div>
                  </div>
                  <div className="price">{NPR(price * i.qty)}</div>
                </div>
              );
            })
          )}
        </div>
        {items.length > 0 && (
          <div className="drawer-foot">
            <div className="cart-summary">
              <div className="row"><span>Subtotal</span><span>{NPR(subtotal)}</span></div>
              <div className="row"><span>Delivery {subtotal >= 20000 ? "· Free over 20K" : ""}</span><span>{fee === 0 ? "Free" : NPR(fee)}</span></div>
              <div className="row"><span>Payment</span><span>Cash on delivery</span></div>
              <div className="row total"><span>Total</span><span>{NPR(subtotal + fee)}</span></div>
            </div>
            <button className="btn accent block" style={{ marginTop: 18 }} onClick={() => { onClose(); navigate({ name: "checkout" }); }}>
              Checkout →
            </button>
            <p className="h-mono" style={{ marginTop: 14, color: "var(--ink-3)", textAlign: "center" }}>Sign in at checkout</p>
          </div>
        )}
      </aside>
    </React.Fragment>
  );
}

// ===== Login Modal =====
// Stages:
//   intro       → choose: Google | Email+Password | Email OTP
//   email-pass  → enter email + password → on success, OTP sent → otp-verify
//   email-otp   → enter email → send OTP → otp-verify
//   otp-verify  → enter 6-digit code
function LoginModal({ open, onClose, onSuccess, navigate }) {
  const [stage,      setStage]      = React.useState("intro");
  const [email,      setEmail]      = React.useState("");
  const [password,   setPassword]   = React.useState("");
  const [otp,        setOtp]        = React.useState("");
  const [error,      setError]      = React.useState("");
  const [busy,       setBusy]       = React.useState(false);
  const [otpSent,    setOtpSent]    = React.useState(false); // true after OTP email dispatched

  React.useEffect(() => {
    if (open) {
      setStage("intro"); setEmail(""); setPassword(""); setOtp(""); setError(""); setBusy(false); setOtpSent(false);
    }
  }, [open]);

  // Must be declared before any early return (Rules of Hooks)
  const otpRefs = React.useRef([]);

  if (!open) return null;

  // ---- Google OAuth ----
  const handleGoogle = async () => {
    setBusy(true); setError("");
    try {
      const { error } = await sbSignInWithGoogle();
      if (error) { setError(error.message); setBusy(false); }
      // On success the page redirects; no further action needed here
    } catch (e) {
      setError(e.message || "Google sign-in failed"); setBusy(false);
    }
  };

  // ---- Email + Password → then OTP 2FA ----
  const handlePasswordSubmit = async (e) => {
    e?.preventDefault();
    if (busy) return;
    setError("");
    if (!email.trim()) return setError("Please enter your email address.");
    if (!password.trim()) return setError("Please enter your password.");
    setBusy(true);
    try {
      const { data, error: signInErr } = await sbSignIn(email.trim(), password);
      if (signInErr) { setError(signInErr.message || "Incorrect email or password."); setBusy(false); return; }

      // Password verified — now send OTP for 2FA
      // Sign out the password session; user will fully auth via OTP
      await sbSignOut().catch(() => {});
      const { error: otpErr } = await sbSendEmailOtp(email.trim());
      if (otpErr) { setError(otpErr.message || "Could not send verification code."); setBusy(false); return; }

      setOtpSent(true);
      setStage("otp-verify");
    } catch (ex) {
      setError(ex.message || "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  };

  // ---- Email OTP (passwordless) ----
  const handleOtpRequest = async (e) => {
    e?.preventDefault();
    if (busy) return;
    setError("");
    if (!email.trim()) return setError("Please enter your email address.");
    setBusy(true);
    try {
      const { error: otpErr } = await sbSendEmailOtp(email.trim());
      if (otpErr) { setError(otpErr.message || "Could not send code."); setBusy(false); return; }
      setOtpSent(true);
      setStage("otp-verify");
    } catch (ex) {
      setError(ex.message || "Failed to send code.");
    } finally {
      setBusy(false);
    }
  };

  // ---- OTP verification ----
  const handleOtpVerify = async (e) => {
    e?.preventDefault();
    if (busy) return;
    setError("");
    if (otp.trim().length !== 6) return setError("Please enter the 6-digit code.");
    setBusy(true);
    try {
      const { data, error: vErr } = await sbVerifyEmailOtp(email.trim(), otp.trim());
      if (vErr) { setError(vErr.message || "Invalid or expired code."); setBusy(false); return; }
      onSuccess();
    } catch (ex) {
      setError(ex.message || "Verification failed.");
    } finally {
      setBusy(false);
    }
  };

  // ---- OTP digit input ----
  const handleOtpKey = (i, e) => {
    if (e.key === "Backspace" && !e.target.value && i > 0) otpRefs.current[i - 1]?.focus();
  };
  const handleOtpChange = (i, val) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const arr = otp.split("");
    arr[i] = digit;
    const next = arr.join("").slice(0, 6).padEnd(6, " ").trimEnd();
    setOtp(arr.slice(0, 6).join(""));
    if (digit && i < 5) otpRefs.current[i + 1]?.focus();
  };

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <button className="close-x" onClick={onClose}>×</button>

        {/* ===== INTRO ===== */}
        {stage === "intro" && (
          <React.Fragment>
            <h2>Sign in</h2>
            <div className="ne" style={{ marginBottom: 22 }}>साइन इन गर्नुहोस्</div>

            {/* Google */}
            <button className="gmail-btn" onClick={handleGoogle} disabled={busy} style={{ marginBottom: 18 }}>
              <span className="g" />
              <span>Continue with Google</span>
              <span style={{ marginLeft: "auto", color: "var(--ink-3)", fontSize: 12 }}>→</span>
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 18px", color: "var(--ink-3)" }}>
              <span style={{ flex: 1, height: 1, background: "var(--rule)" }} />
              <span className="h-mono" style={{ fontSize: 11 }}>or sign in with email</span>
              <span style={{ flex: 1, height: 1, background: "var(--rule)" }} />
            </div>

            {/* Email + Password (for existing accounts) */}
            <button
              className="btn block"
              style={{ marginBottom: 10 }}
              onClick={() => { setError(""); setStage("email-pass"); }}
            >
              Email &amp; Password → OTP
            </button>

            {/* Passwordless OTP */}
            <button
              className="btn ghost block"
              onClick={() => { setError(""); setStage("email-otp"); }}
            >
              Send me a one-time code
            </button>

            {error && <div className="admin-login-error" role="alert" style={{ marginTop: 14 }}>{error}</div>}

            <p className="fineprint" style={{ marginTop: 20 }}>
              Your order history and delivery address are saved once you sign in.
              <span className="deva" style={{ display: "block", marginTop: 4 }}>साइन इन गरेपछि तपाईंको अर्डर इतिहास सुरक्षित हुन्छ।</span>
            </p>
          </React.Fragment>
        )}

        {/* ===== EMAIL + PASSWORD ===== */}
        {stage === "email-pass" && (
          <React.Fragment>
            <h2>Sign in</h2>
            <div className="ne" style={{ marginBottom: 22, color: "var(--ink-2)" }}>इमेल र पासवर्ड</div>
            <p style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 22 }}>
              Enter your email and password. We'll send a verification code to your email to complete sign-in.
            </p>
            <form onSubmit={handlePasswordSubmit}>
              <div className="fld">
                <label>Email Address <span className="req">*</span></label>
                <input
                  type="email" autoFocus value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  placeholder="you@example.com"
                  disabled={busy}
                />
              </div>
              <div className="fld" style={{ marginTop: 14 }}>
                <label>Password <span className="req">*</span></label>
                <input
                  type="password" value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  placeholder="••••••••"
                  disabled={busy}
                />
              </div>
              {error && <div className="admin-login-error" role="alert" style={{ marginTop: 12 }}>{error}</div>}
              <button className="btn block accent" type="submit" style={{ marginTop: 18 }} disabled={busy}>
                {busy ? "Verifying…" : "Continue →"}
              </button>
            </form>
            <p className="fineprint" style={{ marginTop: 16 }}>
              <button className="link-btn" onClick={() => { setStage("intro"); setError(""); }}>← Back</button>
            </p>
          </React.Fragment>
        )}

        {/* ===== EMAIL OTP (passwordless) ===== */}
        {stage === "email-otp" && (
          <React.Fragment>
            <h2>Sign in with email</h2>
            <div className="ne" style={{ marginBottom: 22, color: "var(--ink-2)" }}>इमेल कोडबाट साइन इन</div>
            <p style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 22 }}>
              We'll send a 6-digit code to your email address. No password needed.
            </p>
            <form onSubmit={handleOtpRequest}>
              <div className="fld">
                <label>Email Address <span className="req">*</span></label>
                <input
                  type="email" autoFocus value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  placeholder="you@example.com"
                  disabled={busy}
                />
              </div>
              {error && <div className="admin-login-error" role="alert" style={{ marginTop: 12 }}>{error}</div>}
              <button className="btn block accent" type="submit" style={{ marginTop: 18 }} disabled={busy}>
                {busy ? "Sending code…" : "Send verification code →"}
              </button>
            </form>
            <p className="fineprint" style={{ marginTop: 16 }}>
              <button className="link-btn" onClick={() => { setStage("intro"); setError(""); }}>← Back</button>
            </p>
          </React.Fragment>
        )}

        {/* ===== OTP VERIFY ===== */}
        {stage === "otp-verify" && (
          <React.Fragment>
            <h2>Enter verification code</h2>
            <div className="ne" style={{ marginBottom: 8, color: "var(--ink-2)" }}>प्रमाणिकरण कोड</div>
            <p style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 26 }}>
              A 6-digit code was sent to <strong>{email}</strong>. Check your inbox (and spam folder).
            </p>

            {/* OTP boxes */}
            <form onSubmit={handleOtpVerify}>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 22 }}>
                {[0,1,2,3,4,5].map(i => (
                  <input
                    key={i}
                    ref={el => { otpRefs.current[i] = el; }}
                    type="text" inputMode="numeric" maxLength={1}
                    value={otp[i] || ""}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKey(i, e)}
                    disabled={busy}
                    style={{
                      width: 44, height: 52, textAlign: "center", fontSize: 22,
                      fontFamily: "var(--font-mono)", border: "1px solid var(--rule)",
                      background: "var(--bg)", color: "var(--ink)", outline: "none",
                      caretColor: "var(--accent)"
                    }}
                    onFocus={e => e.target.select()}
                  />
                ))}
              </div>

              {error && <div className="admin-login-error" role="alert" style={{ marginBottom: 14 }}>{error}</div>}

              <button className="btn block accent" type="submit" disabled={busy || otp.replace(/\s/g,"").length < 6}>
                {busy ? "Verifying…" : "Verify & Sign in →"}
              </button>
            </form>

            <p className="fineprint" style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button className="link-btn" onClick={() => { setStage("intro"); setOtp(""); setError(""); }}>← Back</button>
              <button className="link-btn" onClick={() => {
                setOtp(""); setError("");
                stage === "otp-verify" && email
                  ? sbSendEmailOtp(email.trim()).then(() => setError("New code sent.")).catch(e => setError(e.message))
                  : null;
              }}>Resend code</button>
            </p>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

// =========================================================
// Checkout Page
// =========================================================
function CheckoutPage({ navigate, onLoginNeeded, onPlaced }) {
  const [state] = useStore();
  const subtotal = cartSubtotal(state);
  const fee      = deliveryFee(subtotal);
  const items    = state.cart;
  const total    = subtotal + fee;

  const [step,       setStep]      = React.useState(state.user ? "shipping" : "signin");
  const [form,       setForm]      = React.useState(() => ({
    name:          state.user?.name           || "",
    email:         state.user?.email          || "",
    phone:         state.user?.phone          || "",
    secondaryPhone:state.user?.secondaryPhone || "",
    address:       state.user?.address        || "",
    landmark:      state.user?.landmark       || "",
    mapLink:       state.user?.mapLink        || "",
  }));
  const [errors,     setErrors]    = React.useState({});
  const [placing,    setPlacing]   = React.useState(false);
  const [placeError, setPlaceError]= React.useState("");

  React.useEffect(() => {
    if (state.user) {
      setForm(f => ({
        name:          state.user.name           || f.name,
        email:         state.user.email          || f.email,
        phone:         state.user.phone          || f.phone,
        secondaryPhone:state.user.secondaryPhone || f.secondaryPhone,
        address:       state.user.address        || f.address,
        landmark:      state.user.landmark       || f.landmark,
        mapLink:       state.user.mapLink        || f.mapLink,
      }));
      if (step === "signin") setStep("shipping");
    }
  }, [state.user]);

  if (items.length === 0 && step !== "done") {
    return (
      <main className="checkout-page">
        <div className="wrap" style={{ display: "block", textAlign: "center", padding: "100px 0" }}>
          <h1>Your cart is empty.</h1>
          <div className="sub" style={{ fontSize: 22, marginTop: 14 }}>तपाईंको कार्ट खाली छ</div>
          <p style={{ color: "var(--ink-2)", maxWidth: "44ch", margin: "24px auto 36px" }}>
            Add some instruments to your cart before checking out.
          </p>
          <button className="btn accent" onClick={() => navigate({ name: "home" })}>Browse the store</button>
        </div>
      </main>
    );
  }

  const validate = () => {
    const e = {};
    if (!form.name?.trim()) e.name = "Required";
    if (!form.phone?.trim()) {
      e.phone = "Required";
    } else if (!/^9[78]\d{8}$/.test(form.phone.replace(/\D/g, ""))) {
      e.phone = "Must be 10 digits, starting with 97 or 98";
    }
    if (form.secondaryPhone?.trim() && !/^9[78]\d{8}$/.test(form.secondaryPhone.replace(/\D/g, ""))) {
      e.secondaryPhone = "Must be 10 digits, starting with 97 or 98";
    }
    if (!form.address?.trim() || form.address.trim().length < 12) e.address = "Please enter your full address";
    if (!form.landmark?.trim()) e.landmark = "Required — helps the delivery person find you";
    return e;
  };

  const onPlace = async () => {
    if (placing) return;
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setPlaceError(""); setPlacing(true);
    try {
      const order = await placeOrder(form);
      onPlaced(order);
    } catch (err) {
      setPlaceError(err?.message || "Couldn't reach the store database. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <main className="checkout-page">
      <div className="wrap">
        <div>
          <div className="crumbs">
            <a onClick={() => navigate({ name: "home" })} style={{ cursor: "pointer" }}>Home</a>
            <span className="sep">/</span><span>Checkout</span>
          </div>
          <h1>Checkout</h1>
          <div className="sub">डेलिभरी विवरण</div>

          <div className="steps">
            <div className={"s " + (step === "signin" ? "active" : "done")}><span className="n">1</span><span>Sign in</span></div>
            <div className="bar" />
            <div className={"s " + (step === "shipping" ? "active" : "")}><span className="n">2</span><span>Shipping</span></div>
            <div className="bar" />
            <div className="s"><span className="n">3</span><span>Confirm</span></div>
          </div>

          {step === "signin" && (
            <div style={{ border: "1px solid var(--rule)", padding: 32, background: "var(--bg-2)" }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 26, margin: "0 0 4px" }}>Sign in to continue</h3>
              <div className="h-deva" style={{ color: "var(--ink-2)", fontSize: 14, marginBottom: 18 }}>जारी राख्न साइन इन गर्नुहोस्</div>
              <p style={{ color: "var(--ink-2)", marginBottom: 24 }}>
                Sign in to place your order. Your delivery details will be saved for next time.
              </p>
              <button className="btn block" onClick={onLoginNeeded}>Sign in →</button>
            </div>
          )}

          {step === "shipping" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", border: "1px solid var(--rule)", background: "var(--bg-2)", marginBottom: 28 }}>
                <div>
                  <div className="h-mono" style={{ color: "var(--ink-3)" }}>Signed in as</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 17, marginTop: 2 }}>{state.user?.name}</div>
                  <div className="h-mono" style={{ color: "var(--ink-3)", marginTop: 2 }}>{state.user?.email}</div>
                </div>
                <button className="link-btn" onClick={() => { logout(); setStep("signin"); }}>Sign out</button>
              </div>

              <h3 className="h-display" style={{ fontSize: 22, margin: "0 0 4px" }}>Contact</h3>
              <hr className="h-rule" style={{ marginBottom: 20 }} />

              <div className="fld row2">
                <div className="fld">
                  <label>Full Name <span className="req">*</span></label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your full name" />
                  {errors.name && <span className="err">{errors.name}</span>}
                </div>
                <div className="fld">
                  <label>Email</label>
                  <input type="email" value={form.email} readOnly style={{ color: "var(--ink-3)" }} />
                  <span className="hint">Verified via sign-in</span>
                </div>
              </div>

              <div className="fld">
                <label>Mobile Number · Nepal <span className="req">*</span></label>
                <div className="fld-phone">
                  <div className="prefix">+977</div>
                  <input type="tel" inputMode="numeric" maxLength={10} value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                    placeholder="98XXXXXXXX" />
                </div>
                {errors.phone ? <span className="err">{errors.phone}</span> : <span className="hint">10 digits · must start with 97 or 98</span>}
              </div>

              <div className="fld">
                <label>Secondary Mobile · Optional</label>
                <div className="fld-phone">
                  <div className="prefix">+977</div>
                  <input type="tel" inputMode="numeric" maxLength={10} value={form.secondaryPhone}
                    onChange={e => setForm({ ...form, secondaryPhone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                    placeholder="Optional backup number" />
                </div>
                {errors.secondaryPhone && <span className="err">{errors.secondaryPhone}</span>}
              </div>

              <h3 className="h-display" style={{ fontSize: 22, margin: "32px 0 4px" }}>Delivery Address</h3>
              <hr className="h-rule" style={{ marginBottom: 20 }} />

              <div className="fld">
                <label>Full Address <span className="req">*</span></label>
                <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                  placeholder="Tole / street, Ward, Municipality, District, Province" rows={3} />
                {errors.address ? <span className="err">{errors.address}</span> : <span className="hint">e.g. Naxal, Ward 1, Kathmandu Metro, Bagmati Province</span>}
              </div>

              <div className="fld">
                <label>Nearby Landmark <span className="req">*</span></label>
                <input type="text" value={form.landmark} onChange={e => setForm({ ...form, landmark: e.target.value })} placeholder="e.g. Behind Naxal Bhagwati Temple" />
                {errors.landmark ? <span className="err">{errors.landmark}</span> : <span className="hint">A nearby place our delivery person will recognise</span>}
              </div>

              <div className="fld">
                <label>Google Maps Location · Optional</label>
                <input type="url" value={form.mapLink} onChange={e => setForm({ ...form, mapLink: e.target.value })} placeholder="Paste a Google Maps link (optional)" />
                <span className="hint">Helps us pin-drop your exact location</span>
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 32, alignItems: "center" }}>
                <input type="checkbox" checked readOnly style={{ accentColor: "var(--accent)" }} />
                <span style={{ fontSize: 13 }}>
                  <strong>Cash on delivery</strong> · Pay when the store keeper hands over your order.
                  <span className="h-deva" style={{ marginLeft: 6, color: "var(--ink-3)" }}>नगद डेलिभरी</span>
                </span>
              </div>

              {placeError && <div className="admin-login-error" role="alert" style={{ marginTop: 24 }}>{placeError}</div>}

              <div style={{ display: "flex", gap: 14, marginTop: 36 }}>
                <button className="btn ghost" onClick={() => navigate({ name: "home" })} disabled={placing}>← Continue shopping</button>
                <button className="btn accent" style={{ flex: 1 }} onClick={onPlace} disabled={placing}>
                  {placing ? "Placing order…" : "Place Order · " + NPR(total)}
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="checkout-summary">
          <h3>Order Summary</h3>
          <div className="items">
            {items.map(i => {
              const p = getProductById(i.id);
              const price = p ? p.price : (i.price || 0);
              const name = p ? p.name : (i.name || "Item");
              return (
                <div className="item-line" key={i.id} style={{ display: "flex", flexDirection: "column", gap: 6, padding: "10px 0", borderBottom: "1px solid var(--rule)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span className="nm">{name}</span>
                    <span style={{ fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>{NPR(price * i.qty)}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      className="chip"
                      style={{ width: 28, height: 28, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                      onClick={() => updateQty(i.id, i.qty - 1)}
                    >−</button>
                    <span style={{ fontFamily: "var(--font-mono)", minWidth: 20, textAlign: "center" }}>{i.qty}</span>
                    <button
                      className="chip"
                      style={{ width: 28, height: 28, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                      onClick={() => updateQty(i.id, i.qty + 1)}
                    >+</button>
                    <span style={{ flex: 1 }} />
                    <button
                      className="link-btn"
                      style={{ fontSize: 12, color: "var(--warn)" }}
                      onClick={() => removeFromCart(i.id)}
                    >Remove</button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="line"><span>Subtotal</span><span>{NPR(subtotal)}</span></div>
          <div className="line"><span>Delivery</span><span>{fee === 0 ? "Free" : NPR(fee)}</span></div>
          <div className="line tot"><span>Total</span><span>{NPR(total)}</span></div>
          <p className="h-mono" style={{ marginTop: 16, color: "var(--ink-3)", letterSpacing: "0.08em" }}>Cash on delivery · {toDeva("नगद")}</p>
        </aside>
      </div>
    </main>
  );
}

// =========================================================
// Order Confirmation
// =========================================================
function ConfirmationPage({ order, navigate }) {
  if (!order) {
    return (
      <main className="confirm-page">
        <div className="wrap">
          <p>No order found.</p>
          <button className="btn" onClick={() => navigate({ name: "home" })}>Back to shop</button>
        </div>
      </main>
    );
  }
  return (
    <main className="confirm-page">
      <div className="wrap">
        <div className="check" />
        <h1>Thank you<br />for your order.</h1>
        <div className="ne-hello">तपाईंको अर्डर प्राप्त भयो</div>
        <p className="msg">Thank you for placing your order! We will contact you for confirmation within 24 hours before delivery.</p>
        <div className="confirm-order-card">
          <h3>Order details</h3>
          <div className="row"><span className="k">Order Ref</span><span style={{ fontFamily: "var(--font-mono)" }}>{order.ref || order.id}</span></div>
          <div className="row"><span className="k">Customer</span><span>{order.user.name}</span></div>
          <div className="row"><span className="k">Mobile</span><span style={{ fontFamily: "var(--font-mono)" }}>+977 {order.user.phone}</span></div>
          <div className="row"><span className="k">Delivery</span><span style={{ textAlign: "right", maxWidth: "65%" }}>{order.user.address}</span></div>
          <div className="row"><span className="k">Landmark</span><span>{order.user.landmark}</span></div>
          <div className="row"><span className="k">Items</span><span>{order.items.length} item{order.items.length === 1 ? "" : "s"}</span></div>
          <div className="row"><span className="k">Total</span><span style={{ fontFamily: "var(--font-display)", fontSize: 20 }}>{NPR(order.total)}</span></div>
          <div className="row"><span className="k">Payment</span><span>Cash on delivery</span></div>
        </div>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 36 }}>
          <button className="btn ghost" onClick={() => navigate({ name: "home" })}>Continue shopping</button>
          <button className="btn" onClick={() => navigate({ name: "account" })}>View my orders</button>
        </div>
      </div>
    </main>
  );
}

Object.assign(window, { CartDrawer, LoginModal, CheckoutPage, ConfirmationPage });
