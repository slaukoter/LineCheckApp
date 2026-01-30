import { useEffect, useState } from "react";
import { api } from "../api";

export default function ItemsPage({ user, onLogout }) {
  const [items, setItems] = useState(user.items ?? []);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [parLevel, setParLevel] = useState(0);
  const [unit, setUnit] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    quantity: 0,
    par_level: 0,
    unit: "",
  });

  useEffect(() => {
    setError("");
    api("/api/items")
      .then(setItems)
      .catch((e) => setError(e.message));
  }, [user]);

  async function handleAdd(e) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (Number(quantity) < 0 || Number(parLevel) < 0) {
      setError("Quantity and par level must be 0 or more.");
      return;
    }

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

  function startEdit(item) {
    setEditingId(item.id);
    setEditForm({
      name: item.name ?? "",
      quantity: item.quantity ?? 0,
      par_level: item.par_level ?? 0,
      unit: item.unit ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id) {
    setError("");

    if (!editForm.name.trim()) {
      setError("Name is required.");
      return;
    }
    if (Number(editForm.quantity) < 0 || Number(editForm.par_level) < 0) {
      setError("Quantity and par level must be 0 or more.");
      return;
    }

    try {
      const updated = await api(`/api/items/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editForm.name,
          quantity: Number(editForm.quantity),
          par_level: Number(editForm.par_level),
          unit: editForm.unit || null,
        }),
      });

      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
      setEditingId(null);
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
          required
          placeholder="Name (required)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="number"
          min="0"
          placeholder="Quantity"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
        />

        <input
          type="number"
          min="0"
          placeholder="Par level"
          value={parLevel}
          onChange={(e) => setParLevel(Number(e.target.value))}
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
              {editingId === item.id ? (
                <>
                  <input
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, name: e.target.value }))
                    }
                  />
                  <input
                    type="number"
                    min="0"
                    value={editForm.quantity}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        quantity: Number(e.target.value),
                      }))
                    }
                  />
                  <input
                    type="number"
                    min="0"
                    value={editForm.par_level}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        par_level: Number(e.target.value),
                      }))
                    }
                  />
                  <input
                    value={editForm.unit}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, unit: e.target.value }))
                    }
                  />

                  <button
                    onClick={() => saveEdit(item.id)}
                    style={{ marginLeft: 10 }}
                  >
                    save
                  </button>
                  <button onClick={cancelEdit} style={{ marginLeft: 6 }}>
                    cancel
                  </button>
                </>
              ) : (
                <>
                  <b>{item.name}</b>{" "}
                  <span>
                    — qty: {item.quantity ?? 0} / par: {item.par_level ?? 0}{" "}
                    {item.unit ? `(${item.unit})` : ""}
                  </span>
                  <button
                    onClick={() => startEdit(item)}
                    style={{ marginLeft: 10 }}
                  >
                    edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    style={{ marginLeft: 6 }}
                  >
                    delete
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
