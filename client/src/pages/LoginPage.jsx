import { useState } from "react";
import { api } from "../api";
import { Link, useNavigate } from "react-router-dom";

export default function LoginPage({ onAuthed }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.target);
    const username = form.get("username");
    const password = form.get("password");

    try {
      const u = await api("/api/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      onAuthed(u);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div className="card">
        <div className="header">
          <h1 className="title">Login</h1>
          <span className="badge">LineCheck</span>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid"
          style={{ gridTemplateColumns: "1fr" }}
        >
          <input
            className="input"
            name="username"
            placeholder="username"
            autoComplete="username"
          />
          <input
            className="input"
            name="password"
            placeholder="password"
            type="password"
            autoComplete="current-password"
          />
          <button className="btn btnPrimary" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {error ? <div className="alert error">{error}</div> : null}

        <p className="small">
          No account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
