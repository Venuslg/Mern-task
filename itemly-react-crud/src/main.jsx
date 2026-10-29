import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

function Icon({ name, size = 18 }) {
  const common = {
    width: size, height: size, viewBox: "0 0 24 24",
    fill: "none", stroke: "currentColor", strokeWidth: 1.8,
    strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true
  };

  const paths = {
    box: <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 8 9 5 9-5"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></>,
    plus: <><path d="M12 5v14"/><path d="M5 12h14"/></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></>,
    edit: <><path d="m14 5 5 5"/><path d="M4 20l4.2-.9L19 8.3a2.1 2.1 0 0 0-3-3L5.2 16.1 4 20Z"/></>,
    trash: <><path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="m6 7 1 14h10l1-14"/><path d="M9 7V4h6v3"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
    package: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.5 8-4.5"/><path d="M12 12v9"/></>,
    rupee: <><path d="M5 4h14M5 8h14M5 4c7 0 8 8 0 8h2l9 8"/></>
  };

  return <svg {...common}>{paths[name] || paths.box}</svg>;
}

function App() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function api(url, options = {}) {
    const response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Something went wrong.");
    return data;
  }

  async function loadItems() {
    try {
      const data = await api("/api/items");
      setItems(data);
    } catch (error) {
      setNotice({ text: `${error.message} Make sure the Express server is running.`, type: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadItems(); }, []);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) =>
      item.name.toLowerCase().includes(query) || String(item.id).includes(query)
    );
  }, [items, search]);

  const totalValue = items.reduce((sum, item) => sum + Number(item.price), 0);

  function resetForm() {
    setName("");
    setPrice("");
    setEditingId(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim() || price === "" || !Number.isFinite(Number(price)) || Number(price) < 0) {
      setNotice({ text: "Please enter an item name and a valid price.", type: "error" });
      return;
    }

    setSaving(true);
    try {
      if (editingId !== null) {
        await api(`/api/items/${editingId}`, {
          method: "PUT",
          body: JSON.stringify({ name: name.trim(), price })
        });
        setNotice({ text: "Item updated successfully.", type: "success" });
      } else {
        await api("/api/items", {
          method: "POST",
          body: JSON.stringify({ name: name.trim(), price })
        });
        setNotice({ text: "New item added to your inventory.", type: "success" });
      }
      resetForm();
      await loadItems();
    } catch (error) {
      setNotice({ text: error.message, type: "error" });
    } finally {
      setSaving(false);
    }
  }

  function startEdit(item) {
    setEditingId(item.id);
    setName(item.name);
    setPrice(String(item.price));
    setNotice({ text: `Editing item #${item.id}. Update the fields and save your changes.`, type: "info" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function removeItem(item) {
    if (!window.confirm(`Delete "${item.name}" from your inventory?`)) return;
    try {
      await api(`/api/items/${item.id}`, { method: "DELETE" });
      if (editingId === item.id) resetForm();
      setNotice({ text: `${item.name} was deleted.`, type: "success" });
      await loadItems();
    } catch (error) {
      setNotice({ text: error.message, type: "error" });
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Icon name="box" size={23} /></div>
          <span>itemly<span className="brand-dot">.</span></span>
        </div>
        <div className="sidebar-label">WORKSPACE</div>
        <div className="nav-item active"><span className="nav-icon"><Icon name="package" /></span> Inventory <span className="nav-count">{items.length}</span></div>
        <div className="sidebar-bottom">
          <div className="avatar">IM</div>
          <div><strong>Inventory Manager</strong><span>Local workspace</span></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> <strong>Inventory</strong></div>
          <div className="status-pill"><span className="status-dot"></span> Local data</div>
        </header>

        <section className="page-heading">
          <div>
            <div className="eyebrow">OVERVIEW</div>
            <h1>Inventory</h1>
            <p className="subtitle">Manage your items, keep prices up to date, and stay organised.</p>
          </div>
          <a className="top-action" href="#item-form"><Icon name="plus" size={17} /> Add item</a>
        </section>

        <section className="stats-grid">
          <article className="stat-card">
            <div className="stat-icon lavender"><Icon name="package" size={20} /></div>
            <div className="stat-label">Total items</div>
            <div className="stat-value">{items.length}</div>
            <div className="stat-foot">Items in your inventory</div>
          </article>
          <article className="stat-card">
            <div className="stat-icon mint"><Icon name="rupee" size={20} /></div>
            <div className="stat-label">Combined value</div>
            <div className="stat-value">₹{totalValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
            <div className="stat-foot">Sum of all listed prices</div>
          </article>
          <article className="stat-card">
            <div className="stat-icon peach"><Icon name="box" size={20} /></div>
            <div className="stat-label">Matching results</div>
            <div className="stat-value">{filteredItems.length}</div>
            <div className="stat-foot">Based on your current search</div>
          </article>
        </section>

        {notice.text && (
          <div className={`notice ${notice.type}`} role="status">
            <span>{notice.text}</span>
            <button className="notice-close" onClick={() => setNotice({ text: "", type: "" })} aria-label="Dismiss message"><Icon name="close" size={16} /></button>
          </div>
        )}

        <section className="content-grid">
          <article className="panel form-panel" id="item-form">
            <div className="panel-heading">
              <div>
                <div className="panel-kicker">{editingId !== null ? "UPDATE DETAILS" : "CREATE NEW"}</div>
                <h2>{editingId !== null ? "Edit item" : "Add an item"}</h2>
              </div>
              <div className="panel-heading-icon"><Icon name={editingId !== null ? "edit" : "plus"} size={20} /></div>
            </div>
            <p className="panel-description">{editingId !== null ? "Make changes to this item below." : "Fill in the details to add an item to your inventory."}</p>
            <form onSubmit={handleSubmit}>
              <label htmlFor="item-name">Item name</label>
              <input id="item-name" type="text" placeholder="e.g. Notebook" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required />
              <label htmlFor="item-price">Price <span className="label-hint">(INR)</span></label>
              <div className="price-input"><span>₹</span><input id="item-price" type="number" placeholder="0.00" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required /></div>
              <button className="primary-button" type="submit" disabled={saving}>
                <Icon name={editingId !== null ? "edit" : "plus"} size={17} />
                {saving ? "Saving..." : editingId !== null ? "Save changes" : "Add to inventory"}
              </button>
              {editingId !== null && <button className="cancel-button" type="button" onClick={resetForm}>Cancel editing</button>}
            </form>
            <div className="form-note"><span className="note-dot"></span> Changes are managed through the Express REST API.</div>
          </article>

          <article className="panel table-panel">
            <div className="table-heading">
              <div>
                <div className="panel-kicker">YOUR COLLECTION</div>
                <h2>All items <span className="count-badge">{items.length}</span></h2>
              </div>
              <div className="search-box">
                <Icon name="search" size={17} />
                <input aria-label="Search items" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search items..." />
              </div>
            </div>
            <div className="table-container">
              <table>
                <thead><tr><th className="id-column">ID</th><th>ITEM DETAILS</th><th>PRICE</th><th className="actions-column">ACTIONS</th></tr></thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="4" className="empty-state">Loading your inventory...</td></tr>
                  ) : filteredItems.length === 0 ? (
                    <tr><td colSpan="4" className="empty-state"><div className="empty-icon"><Icon name="search" size={22} /></div><strong>No items found</strong><span>Try another search or add a new item.</span></td></tr>
                  ) : filteredItems.map((item) => (
                    <tr key={item.id}>
                      <td><span className="id-chip">#{item.id}</span></td>
                      <td><div className="item-cell"><div className="item-avatar">{item.name.trim().charAt(0).toUpperCase()}</div><div><strong>{item.name}</strong><span>Inventory item</span></div></div></td>
                      <td><span className="price-value">₹{Number(item.price).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></td>
                      <td><div className="row-actions">
                        <button className="icon-button edit-button" title={`Edit ${item.name}`} aria-label={`Edit ${item.name}`} onClick={() => startEdit(item)}><Icon name="edit" size={16} /></button>
                        <button className="icon-button delete-button" title={`Delete ${item.name}`} aria-label={`Delete ${item.name}`} onClick={() => removeItem(item)}><Icon name="trash" size={16} /></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-footer"><span>Showing <strong>{filteredItems.length}</strong> of <strong>{items.length}</strong> items</span><span className="footer-status"><span className="status-dot"></span> Up to date</span></div>
          </article>
        </section>

        <footer className="page-footer"><span>Itemly Inventory Manager</span><span>Built with React, CSS & Express REST API</span></footer>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<React.StrictMode><App /></React.StrictMode>);
