import { useEffect, useState } from "react";
import { api } from "./api";
import ItemsPage from "./pages/ItemsPage";

export default function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/check_session")
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setAuthChecked(true));
  }, []);

  async function handleLogout() {
    setError("");
    try {
      await api("/api/logout", { method: "DELETE" });
      setUser(null);
      setMode("login");
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleAuthSubmit(e) {
    e.preventDefault();
    setError("");

    const form = new FormData(e.target);
    const username = (form.get("username") || "").toString().trim();
    const password = (form.get("password") || "").toString();

    if (!username || !password) {
      setError("Username and password are required.");
      return;
    }

    const endpoint = mode === "signup" ? "/api/signup" : "/api/login";

    try {
      const u = await api(endpoint, {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      setUser(u);
    } catch (e2) {
      setError(e2.message);
    }
  }

  if (!authChecked) return <p>Loading...</p>;

  if (!user) {
    return (
      <div className="auth">
        <h1>{mode === "signup" ? "Sign Up" : "Login"}</h1>

        <form onSubmit={handleAuthSubmit}>
          <label>
            Username
            <input name="username" autoComplete="username" required />
          </label>

          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              required
            />
          </label>

          <button type="submit">
            {mode === "signup" ? "Create account" : "Login"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setError("");
            setMode((m) => (m === "login" ? "signup" : "login"));
          }}
        >
          {mode === "login" ? "Sign up" : "Already have an account? Log in"}
        </button>

        {error ? <p className="error">{error}</p> : null}
      </div>
    );
  }

  return <ItemsPage user={user} onLogout={handleLogout} />;
}
