import { StrictMode, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

function BrandMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 40 40" fill="none">
      <path d="M20 4.5 23.7 16.3 35.5 20l-11.8 3.7L20 35.5l-3.7-11.8L4.5 20l11.8-3.7L20 4.5Z" fill="currentColor" />
      <circle cx="20" cy="20" r="3.1" fill="#e8f0d2" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="5" width="17" height="14" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="m5 7 7 5.5L19 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <rect x="4.5" y="10" width="15" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon({ hidden }) {
  return hidden ? (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="m3 3 18 18M10.7 10.8a2 2 0 0 0 2.5 2.5M9.8 5.2A10.8 10.8 0 0 1 12 5c5.2 0 8.7 4.4 9.5 7-.3.7-1.1 1.8-2.4 2.9M6.2 6.3C3.9 7.7 2.7 9.7 2.5 12c.4.9 3.9 7 9.5 7 1.2 0 2.3-.3 3.3-.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M2.5 12s3.4-7 9.5-7 9.5 7 9.5 7-3.4 7-9.5 7-9.5-7-9.5-7Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M12 3.5 19 6v5.2c0 4.4-2.8 7.7-7 9.3-4.2-1.6-7-4.9-7-9.3V6l7-2.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: "Add a password" };
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password) && /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password)
  ];
  const score = checks.filter(Boolean).length;
  return { score, label: ["", "Getting started", "Fair", "Good", "Strong"][score] };
}

function App() {
  const [mode, setMode] = useState("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [user, setUser] = useState(null);
  const emailRef = useRef(null);
  const isSignup = mode === "signup";
  const strength = getPasswordStrength(password);

  function switchMode() {
    setMode(isSignup ? "login" : "signup");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmation(false);
    setNotice(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setNotice(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !emailRef.current?.validity.valid) {
      setNotice({ type: "error", text: "Enter a valid email address to continue." });
      emailRef.current?.focus();
      return;
    }
    if (isSignup && password.length < 8) {
      setNotice({ type: "error", text: "Use at least 8 characters for your password." });
      return;
    }
    if (new TextEncoder().encode(password).length > 72) {
      setNotice({ type: "error", text: "Your password must be 72 bytes or fewer." });
      return;
    }
    if (isSignup && password !== confirmPassword) {
      setNotice({ type: "error", text: "Those passwords don’t match yet." });
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(`/api/auth/${isSignup ? "signup" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password })
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "We couldn’t complete your request. Please try again.");
      }

      if (isSignup) {
        setMode("login");
        setNotice({ type: "success", text: "Your account is ready. Log in to continue." });
      } else {
        setUser(data.user || { email: normalizedEmail });
        setNotice({ type: "success", text: data.message || "You’re signed in. Welcome back!" });
      }
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      const message = error instanceof TypeError
        ? "Couldn’t reach the account service. Check that the server is running."
        : error.message || "We couldn’t complete your request. Please try again.";
      setNotice({ type: "error", text: message });
    } finally {
      setBusy(false);
    }
  }

  function signOut() {
    setUser(null);
    setNotice(null);
    setMode("login");
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="Morrow home">
          <span className="brand-mark"><BrandMark /></span>
          <span className="brand-name">morrow<span>.</span></span>
        </a>
        <p className="topbar-tagline">A little space for what’s next</p>
        <div className="topbar-trust"><ShieldIcon /><span>Private by design</span></div>
      </header>

      <main className="auth-layout" id="home">
        <section className="welcome-panel" aria-labelledby="welcome-title">
          <div className="welcome-orbit welcome-orbit-one" />
          <div className="welcome-orbit welcome-orbit-two" />
          <div className="welcome-copy">
            <p className="eyebrow"><span className="eyebrow-dot" /> A FRESH PLACE TO BEGIN</p>
            <h1 id="welcome-title">Make room for<br /><em>what’s next.</em></h1>
            <p className="welcome-description">Bring your ideas, plans, and little wins into one calm place. Start with one small step.</p>
          </div>

          <div className="welcome-visual" aria-hidden="true">
            <div className="visual-glow" />
            <div className="visual-ring ring-one" />
            <div className="visual-ring ring-two" />
            <div className="sparkle sparkle-one">✦</div>
            <div className="sparkle sparkle-two">✳</div>
            <article className="note-card">
              <div className="note-card-top"><span className="note-icon">✳</span><span>YOUR NEXT CHAPTER</span><span className="note-menu">•••</span></div>
              <p className="note-label">A NOTE TO SELF</p>
              <h2>Good things grow<br />from here.</h2>
              <div className="note-progress"><span /></div>
              <div className="note-footer"><span className="note-status" /> One step at a time <span className="note-arrow">↗</span></div>
            </article>
            <div className="floating-note"><span className="floating-check">✓</span><span><strong>That’s a good start</strong><small>Keep your own pace.</small></span></div>
          </div>

          <div className="welcome-footer">
            <span className="welcome-footer-line" />
            <span>Small starts count.</span>
            <div className="avatar-stack" aria-hidden="true"><span>M</span><span>J</span><span>A</span></div>
            <span className="community-note">A calmer way to begin</span>
          </div>
        </section>

        <section className="form-card" aria-labelledby="form-title">
          <div className="form-card-top">
            <span className="step-label"><span>01</span>{isSignup ? "CREATE YOUR SPACE" : "WELCOME BACK"}</span>
            <span className="secure-label"><LockIcon /> SECURE ACCOUNT</span>
          </div>

          <div className="form-heading" key={mode}>
            <h2 id="form-title">{user ? "You’re all set." : isSignup ? "Create your account" : "Welcome back"}</h2>
            <p>{user ? "Your space is ready when you are." : isSignup ? "A few details and you’re on your way." : "Log in and pick up where you left off."}</p>
          </div>

          {user ? (
            <div className="signed-in-panel" role="status">
              <div className="signed-in-mark">✓</div>
              <p className="signed-in-kicker">YOUR SPACE IS READY</p>
              <h3>Welcome back.</h3>
              <p className="signed-in-email">{user.email}</p>
              <button className="secondary-button" type="button" onClick={signOut}>Log out <span aria-hidden="true">↗</span></button>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <label className="field" htmlFor="email">
                <span className="field-label">Email address</span>
                <span className="input-shell">
                  <span className="input-icon"><MailIcon /></span>
                  <input
                    ref={emailRef}
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => { setEmail(event.target.value); setNotice(null); }}
                    required
                    maxLength={254}
                    spellCheck="false"
                  />
                </span>
              </label>

              <label className="field" htmlFor="password">
                <span className="field-label">Password</span>
                <span className="input-shell">
                  <span className="input-icon"><LockIcon /></span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    placeholder={isSignup ? "At least 8 characters" : "Enter your password"}
                    value={password}
                    onChange={(event) => { setPassword(event.target.value); setNotice(null); }}
                    required
                    minLength={isSignup ? 8 : undefined}
                    maxLength={72}
                  />
                  <button className="visibility-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}><EyeIcon hidden={showPassword} /></button>
                </span>
              </label>

              {isSignup && (
                <>
                  <div className="strength-meter" aria-live="polite">
                    <div className="strength-heading"><span>Password strength</span><span className={`strength-label strength-${strength.score}`}>{strength.label}</span></div>
                    <div className="strength-bars" aria-hidden="true">{[1, 2, 3, 4].map((bar) => <span className={bar <= strength.score ? `filled strength-${strength.score}` : ""} key={bar} />)}</div>
                  </div>

                  <label className="field" htmlFor="confirm-password">
                    <span className="field-label">Confirm password</span>
                    <span className="input-shell">
                      <span className="input-icon"><LockIcon /></span>
                      <input
                        id="confirm-password"
                        name="confirm-password"
                        type={showConfirmation ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Enter your password again"
                        value={confirmPassword}
                        onChange={(event) => { setConfirmPassword(event.target.value); setNotice(null); }}
                        required
                        maxLength={72}
                      />
                      <button className="visibility-toggle" type="button" onClick={() => setShowConfirmation((visible) => !visible)} aria-label={showConfirmation ? "Hide confirmation password" : "Show confirmation password"} aria-pressed={showConfirmation}><EyeIcon hidden={showConfirmation} /></button>
                    </span>
                  </label>
                </>
              )}

              <button className="submit-button" type="submit" disabled={busy}>
                {busy && <span className="loading-spinner" aria-hidden="true" />}
                <span>{busy ? "Please wait…" : isSignup ? "Create account" : "Log in"}</span>
                {!busy && <span className="button-arrow" aria-hidden="true">↗</span>}
              </button>
            </form>
          )}

          {notice && <div className={`notice ${notice.type}`} role={notice.type === "error" ? "alert" : "status"}><span className="notice-mark" aria-hidden="true">{notice.type === "success" ? "✓" : "!"}</span><span>{notice.text}</span></div>}

          {!user && (
            <p className="mode-switch">
              <span>{isSignup ? "Already have an account?" : "New around here?"}</span>
              <button className="text-link" type="button" onClick={switchMode}>{isSignup ? "Log in" : "Create an account"} <span aria-hidden="true">→</span></button>
            </p>
          )}

          <div className="card-footer"><span className="footer-lock"><LockIcon /></span><span>Your password is hashed before it’s stored.</span><span className="footer-dot" /> <span>Private by design</span></div>
        </section>
      </main>

      <footer className="page-footer"><span>© 2026 MORROW</span><span className="footer-center"><span /> A GOOD PLACE TO BEGIN <span /></span><span>MADE FOR WHAT’S NEXT</span></footer>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<StrictMode><App /></StrictMode>);
