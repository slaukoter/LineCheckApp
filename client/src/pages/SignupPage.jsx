import { useState } from "react";
import { api } from "../api";
import { Link, useNavigate } from "react-router-dom";

export default function SignupPage({ onAuthed }) {
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
      const u = await api("/api/signup", {
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
    <div>
      <h1>Sign up</h1>

      <form onSubmit={handleSubmit}>
        <input name="username" placeholder="username" autoComplete="username" />
        <input
          name="password"
          placeholder="password (6+ chars)"
          type="password"
          autoComplete="new-password"
        />
        <button disabled={loading}>
          {loading ? "Creating..." : "Create account"}
        </button>
      </form>

      {error ? <p>{error}</p> : null}

      <p>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
