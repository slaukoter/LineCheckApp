import { useEffect, useState } from "react";
import { api } from "../api";

export default function ItemsPage({ user, onLogout }) {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [parLevel, setParLevel] = useState(0);
  const [unit, setUnit] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/items")
      .then(setItems)
      .catch((e) => setError(e.message));
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setError("");

    try {
      const newItem = await api("/api/items", {
        method: "POST",
        body: JSON.stringify({
          name,
          quantity: Number(quantity),
          par_level: Number(parLevel),
          unit: unit || null,
        }),
      });

      setItems((prev) => [newItem, ...prev]);
      setName("");
      setQuantity(0);
      setParLevel(0);
      setUnit("");
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleDelete(id) {
    setError("");
    try {
      await api(`/api/items/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", padding: 16 }}>
      <h1>Inventory</h1>
      <p>
        Logged in as: <b>{user.username}</b>
      </p>

      <button onClick={onLogout}>Logout</button>

      <hr style={{ margin: "20px 0" }} />

      <h2>Add Item</h2>
      <form onSubmit={handleAdd} style={{ display: "grid", gap: 8 }}>
        <input
          placeholder="Name (required)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="number"
          placeholder="Quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />

        <input
          type="number"
          placeholder="Par level"
          value={parLevel}
          onChange={(e) => setParLevel(e.target.value)}
        />

        <input
          placeholder="Unit (ex: lbs, cases)"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
        />

        <button type="submit">Add</button>
      </form>

      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

      <hr style={{ margin: "20px 0" }} />

      <h2>Items</h2>
      {items.length === 0 ? (
        <p>No items yet.</p>
      ) : (
        <ul style={{ paddingLeft: 18 }}>
          {items.map((item) => (
            <li key={item.id} style={{ marginBottom: 8 }}>
              <b>{item.name}</b>{" "}
              <span>
                — qty: {item.quantity ?? 0} / par: {item.par_level ?? 0}{" "}
                {item.unit ? `(${item.unit})` : ""}
              </span>{" "}
              <button
                onClick={() => handleDelete(item.id)}
                style={{ marginLeft: 10 }}
              >
                delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
