import { useEffect, useState } from "react";
import { api } from "./api";
import ItemsPage from "./pages/ItemsPage";

export default function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/check_session")
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setAuthChecked(true));
  }, []);

  async function handleLogout() {
    await api("/api/logout", { method: "DELETE" });
    setUser(null);
  }

  async function quickLogin(e) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.target);
    const username = form.get("username");
    const password = form.get("password");

    try {
      const u = await api("/api/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      setUser(u);
    } catch (e2) {
      setError(e2.message);
    }
  }

  if (!authChecked) return <p style={{ padding: 16 }}>Loading...</p>;

  if (!user) {
    return (
      <div style={{ maxWidth: 400, margin: "40px auto", padding: 16 }}>
        <h1>Login</h1>
        <form onSubmit={quickLogin} style={{ display: "grid", gap: 8 }}>
          <input name="username" placeholder="username" />
          <input name="password" type="password" placeholder="password" />
          <button type="submit">Login</button>
        </form>
        {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
      </div>
    );
  }

  return <ItemsPage user={user} onLogout={handleLogout} />;
}
