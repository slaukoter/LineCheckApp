import { useEffect, useState } from "react";
import { api } from "../api";
import { Link, useParams } from "react-router-dom";

export default function ItemsPage() {
  const { inventoryId } = useParams();

  // ----- state -----
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [total, setTotal] = useState(0);

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [unit, setUnit] = useState("");

  // ----- load items -----
  async function loadItems(p = page) {
    setError("");
    try {
      const data = await api(
        `/api/inventories/${inventoryId}/items?page=${p}&per_page=${perPage}`,
      );
      setItems(data.items);
      setPage(data.page);
      setTotal(data.total);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    setPage(1);
    setMessage("");
    loadItems(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inventoryId]);

  // ----- add item -----
  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      await api(`/api/inventories/${inventoryId}/items`, {
        method: "POST",
        body: JSON.stringify({
          name,
          quantity: Number(quantity),
          unit: unit || null,
        }),
      });

      setName("");
      setQuantity(0);
      setUnit("");
      setMessage("Item added.");
      await loadItems(1);
    } catch (err) {
      setError(err.message);
    }
  }

  // ----- delete item -----
  async function handleDeleteItem(itemId) {
    setError("");
    setMessage("");

    try {
      await api(`/api/items/${itemId}`, { method: "DELETE" });
      setMessage("Item deleted.");
      await loadItems(1);
    } catch (err) {
      setError(err.message);
    }
  }

  // ----- update item -----
  async function handleQuickUpdate(item, patch) {
    setError("");
    setMessage("");

    try {
      await api(`/api/items/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      setMessage("Item updated.");
      await loadItems(page);
    } catch (err) {
      setError(err.message);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="container">
      <div className="card">
        <div className="header">
          <div>
            <h1 className="title">Inventory Items</h1>
            <p className="subtle">
              <Link to="/">← Back to Dashboard</Link>
            </p>
          </div>
        </div>

        {error ? <div className="alert error">{error}</div> : null}
        {message ? <div className="alert ok">{message}</div> : null}
      </div>

      <div style={{ height: 14 }} />

      <div className="grid">
        <div className="card">
          <h2 className="sectionTitle">Add Item</h2>
          <form onSubmit={handleAdd} className="row">
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Item name"
            />
            <input
              className="input"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              type="number"
              placeholder="Qty"
            />
            <input
              className="input"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Unit (optional)"
            />
            <button className="btn btnPrimary" disabled={!name.trim()}>
              Add
            </button>
          </form>
        </div>

        <div className="card">
          <h2 className="sectionTitle">Items</h2>
          {items.length === 0 ? <p className="small">No items yet.</p> : null}

          <ul className="list">
            {items.map((item) => (
              <li key={item.id} className="listItem">
                <div>
                  <strong>{item.name}</strong>{" "}
                  <span className="small">
                    — {item.quantity} {item.unit || ""}
                  </span>
                </div>

                <div className="row">
                  <button
                    className="btn"
                    type="button"
                    onClick={() =>
                      handleQuickUpdate(item, { quantity: item.quantity + 1 })
                    }
                  >
                    +1
                  </button>
                  <button
                    className="btn"
                    type="button"
                    onClick={() =>
                      handleQuickUpdate(item, {
                        quantity: Math.max(0, item.quantity - 1),
                      })
                    }
                  >
                    -1
                  </button>
                  <button
                    className="btn btnDanger"
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="row" style={{ justifyContent: "space-between" }}>
            <button
              className="btn"
              type="button"
              disabled={page <= 1}
              onClick={() => loadItems(page - 1)}
            >
              Prev
            </button>

            <span className="small">
              Page {page} / {totalPages}
            </span>

            <button
              className="btn"
              type="button"
              disabled={page >= totalPages}
              onClick={() => loadItems(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
