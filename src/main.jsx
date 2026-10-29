import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

function App() {
  const [mode, setMode] = useState("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);
  const [user, setUser] = useState(null);
  const isSignup = mode === "signup";

  function switchMode() {
    setMode(isSignup ? "login" : "signup");
    setPassword("");
    setNotice(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setNotice(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (isSignup && password.length < 8) {
      setNotice({ type: "error", text: "Use at least 8 characters for your password." });
      return;
    }
    if (new TextEncoder().encode(password).length > 72) {
      setNotice({ type: "error", text: "Your password must be 72 bytes or fewer." });
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
        setNotice({ type: "success", text: data.message || "You’re signed in." });
      }
      setPassword("");
    } catch (error) {
      const message = error instanceof TypeError
        ? "Couldn’t reach the account service. Make sure the server is running."
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
    <main className="page-shell">
      <section className="signup-panel" aria-labelledby="page-title">
        <h1 id="page-title">{isSignup ? "Sign Up" : "Log In"}</h1>
        <p className="member-prompt">
          {isSignup ? "Already a member?" : "New here?"}{" "}
          <button className="text-link" type="button" onClick={switchMode}>
            {isSignup ? "Log In" : "Sign Up"}
          </button>
        </p>

        {user ? (
          <div className="signed-in" role="status">
            <p>You’re logged in as <strong>{user.email}</strong>.</p>
            <button className="signout-button" type="button" onClick={signOut}>Log Out</button>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="field">
              <span className="visually-hidden">Email</span>
              <input
                aria-label="Email"
                autoCapitalize="none"
                autoComplete="email"
                maxLength={254}
                name="email"
                onChange={(event) => { setEmail(event.target.value); setNotice(null); }}
                placeholder="Email"
                required
                spellCheck="false"
                type="email"
                value={email}
              />
            </label>

            <label className="field">
              <span className="visually-hidden">Password</span>
              <input
                aria-label="Password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                maxLength={72}
                minLength={isSignup ? 8 : undefined}
                name="password"
                onChange={(event) => { setPassword(event.target.value); setNotice(null); }}
                placeholder="Password"
                required
                type="password"
                value={password}
              />
            </label>

            <button className="submit-button" type="submit" disabled={busy}>
              {busy ? "Please wait…" : isSignup ? "Sign Up" : "Log In"}
            </button>
          </form>
        )}

        {notice && (
          <p className={`notice ${notice.type}`} role={notice.type === "error" ? "alert" : "status"}>
            {notice.text}
          </p>
        )}
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode><App /></StrictMode>
);

