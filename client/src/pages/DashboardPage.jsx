import { useEffect, useState } from "react";
import { api } from "../api";
import { Link } from "react-router-dom";

export default function DashboardPage({ user, onLogout }) {
  // state
  const [inventories, setInventories] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [newInvName, setNewInvName] = useState("");

  const [shareInventoryId, setShareInventoryId] = useState("");
  const [shareUsername, setShareUsername] = useState("");

  // load inventories
  async function loadInventories() {
    setError("");
    try {
      const invs = await api("/api/inventories");
      setInventories(invs);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadInventories();
  }, []);

  // create inventory
  async function handleCreateInventory(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const created = await api("/api/inventories", {
        method: "POST",
        body: JSON.stringify({ name: newInvName }),
      });

      setNewInvName("");
      setShareInventoryId(String(created.id));
      setMessage(`Created inventory: ${created.name}`);

      await loadInventories();
    } catch (err) {
      setError(err.message);
    }
  }

  // share access
  async function handleShare(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const res = await api(`/api/inventories/${shareInventoryId}/members`, {
        method: "POST",
        body: JSON.stringify({ username: shareUsername, role: "manager" }),
      });

      setShareUsername("");
      setMessage(`Added ${res.username} to this inventory.`);
    } catch (err) {
      setError(err.message);
    }
  }

  // delete inventory
  async function handleDeleteInventory(invId, invName) {
    setError("");
    setMessage("");

    const ok = window.confirm(
      `Delete "${invName}"? This will delete all items inside it.`,
    );
    if (!ok) return;

    try {
      await api(`/api/inventories/${invId}`, { method: "DELETE" });

      setMessage("Inventory deleted.");
      setError("");

      if (shareInventoryId === String(invId)) setShareInventoryId("");
      await loadInventories();
    } catch (err) {
      setError(err.message);
    }
  }

  // UI
  return (
    <div className="container">
      <div className="card">
        <div className="header">
          <div>
            <h1 className="title">LineCheck Dashboard</h1>
            <p className="subtle">
              Logged in as <span className="mono">{user.username}</span>
            </p>
          </div>

          <button className="btn btnDanger" onClick={onLogout} type="button">
            Logout
          </button>
        </div>

        {error ? <div className="alert error">{error}</div> : null}
        {message ? <div className="alert ok">{message}</div> : null}
      </div>

      <div style={{ height: 14 }} />

      <div className="grid">
        <div className="card">
          <h2 className="sectionTitle">Your Inventories</h2>
          {inventories.length === 0 ? (
            <p className="small">No inventories yet.</p>
          ) : null}

          <ul className="list">
            {inventories.map((inv) => (
              <li key={inv.id} className="listItem">
                <Link to={`/inventories/${inv.id}`}>
                  <strong>{inv.name}</strong>
                </Link>

                <button
                  className="btn btnDanger"
                  type="button"
                  onClick={() => handleDeleteInventory(inv.id, inv.name)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h2 className="sectionTitle">Create Inventory</h2>
          <form onSubmit={handleCreateInventory} className="row">
            <input
              className="input"
              value={newInvName}
              onChange={(e) => setNewInvName(e.target.value)}
              placeholder="Inventory name"
            />
            <button className="btn btnPrimary" disabled={!newInvName.trim()}>
              Create
            </button>
          </form>

          <div style={{ height: 14 }} />

          <h2 className="sectionTitle">Share Access</h2>
          <form onSubmit={handleShare} className="row">
            <select
              className="select"
              value={shareInventoryId}
              onChange={(e) => setShareInventoryId(e.target.value)}
            >
              <option value="">Select inventory</option>
              {inventories.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.name}
                </option>
              ))}
            </select>

            <input
              className="input"
              value={shareUsername}
              onChange={(e) => setShareUsername(e.target.value)}
              placeholder="Username to add"
            />

            <button
              className="btn"
              disabled={!shareInventoryId || !shareUsername.trim()}
            >
              Add member
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
