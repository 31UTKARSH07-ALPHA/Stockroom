import { useEffect, useMemo, useState } from 'react'
import { Activity, ArrowDownToLine, ArrowUpFromLine, Boxes, ChevronDown, CircleHelp, LayoutDashboard, Package, Plus, Search, Settings2, SlidersHorizontal, Sparkles, Tag, Trash2, TrendingUp, X } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || '/api'
const emptyForm = { sku: '', name: '', category: 'General', quantity: 0, price: '' }
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

function App() {
  const [products, setProducts] = useState([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All categories')
  const [dialog, setDialog] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function loadProducts() {
    setError('')
    try {
      const response = await fetch(`${API}/products`)
      if (!response.ok) throw new Error('Could not load inventory. Check that the API is running.')
      setProducts(await response.json())
    } catch (err) { setError(err.message) }
  }

  useEffect(() => { loadProducts() }, [])

  const categories = useMemo(() => ['All categories', ...new Set(products.map(p => p.category))], [products])
  const visible = useMemo(() => products.filter(p => {
    const matchesQuery = `${p.name} ${p.sku} ${p.category}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery && (category === 'All categories' || p.category === category)
  }), [products, query, category])
  const lowStock = products.filter(p => p.quantity < 10).length
  const inventoryValue = products.reduce((sum, p) => sum + Number(p.price) * p.quantity, 0)

  function openCreate() { setForm(emptyForm); setDialog({ mode: 'create' }) }
  function openEdit(product) { setForm({ sku: product.sku, name: product.name, category: product.category, quantity: product.quantity, price: product.price }); setDialog({ mode: 'edit', product }) }

  async function saveProduct(event) {
    event.preventDefault(); setBusy(true); setError('')
    try {
      const editing = dialog.mode === 'edit'
      const response = await fetch(editing ? `${API}/products/${dialog.product.id}` : `${API}/products`, {
        method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, quantity: Number(form.quantity), price: Number(form.price) }),
      })
      if (!response.ok) { const data = await response.json(); throw new Error(data.detail || 'Unable to save product') }
      setDialog(null); await loadProducts()
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  async function removeProduct(product) {
    if (!window.confirm(`Delete ${product.name} from inventory?`)) return
    const response = await fetch(`${API}/products/${product.id}`, { method: 'DELETE' })
    if (!response.ok) setError('Unable to delete product')
    else await loadProducts()
  }

  function exportProducts() {
    const csvCell = value => {
      let text = String(value ?? '')
      if (/^[\t\r\n ]*[=+\-@]/.test(text)) text = `'${text}`
      return `"${text.replace(/"/g, '""')}"`
    }
    const rows = [
      ['SKU', 'Name', 'Category', 'Quantity', 'Price'],
      ...products.map(product => [product.sku, product.name, product.category, product.quantity, Number(product.price).toFixed(2)]),
    ]
    const csv = rows.map(row => row.map(csvCell).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'stockroom-inventory.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return <div className="shell">
    <aside className="sidebar">
      <a className="brand" href="#"><span className="brand-mark"><Boxes size={20} /></span><span>stockroom<span className="brand-dot">.</span></span></a>
      <div className="workspace-label">WORKSPACE</div>
      <button className="workspace"><span className="workspace-icon">A</span><span>Acme Studio</span><ChevronDown size={15} /></button>
      <div className="nav-label">MENU</div>
      <nav><a className="nav-item" href="#"><LayoutDashboard size={17} />Overview</a><a className="nav-item active" href="#"><Package size={17} />Inventory<span className="nav-count">{products.length}</span></a><a className="nav-item" href="#"><ArrowDownToLine size={17} />Stock in</a><a className="nav-item" href="#"><ArrowUpFromLine size={17} />Stock out</a></nav>
      <div className="sidebar-bottom"><a className="nav-item" href="#"><Settings2 size={17} />Settings</a><a className="nav-item" href="#"><CircleHelp size={17} />Help center</a><div className="profile"><div className="avatar">UP</div><div><strong>Utkarsh Pathak</strong><small>Workspace admin</small></div><ChevronDown size={15} /></div></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>Inventory</strong></div><div className="top-actions"><span className="live-dot"></span><span className="sync-label">All changes synced</span><button className="icon-button" aria-label="Activity"><Activity size={18} /></button><div className="avatar small">UP</div></div></header>
      <section className="content">
        <div className="page-heading"><div><div className="eyebrow">YOUR BUSINESS, AT A GLANCE</div><h1>Inventory</h1><p className="subtitle">Keep your products organized and your stock in check.</p></div><div className="heading-actions"><button className="button secondary" onClick={exportProducts}><ArrowDownToLine size={16} />Export</button><button className="button primary" onClick={openCreate}><Plus size={17} />Add product</button></div></div>
        <div className="stats-grid">
          <article className="stat-card"><div className="stat-top"><span>Total products</span><span className="stat-icon lilac"><Package size={17} /></span></div><div className="stat-value">{products.length.toString().padStart(2, '0')}</div><div className="stat-note"><span className="trend"><TrendingUp size={13} /> Inventory items</span><span> across all categories</span></div></article>
          <article className="stat-card"><div className="stat-top"><span>Stock value</span><span className="stat-icon mint"><TrendingUp size={17} /></span></div><div className="stat-value">{currency.format(inventoryValue)}</div><div className="stat-note">Based on current quantity</div></article>
          <article className="stat-card"><div className="stat-top"><span>Low stock</span><span className="stat-icon amber"><Activity size={17} /></span></div><div className="stat-value">{lowStock.toString().padStart(2, '0')}</div><div className="stat-note">Items with fewer than 10 units</div></article>
          <article className="insight-card"><div className="insight-kicker"><Sparkles size={14} /> QUICK INSIGHT</div><p>{lowStock ? `${lowStock} item${lowStock > 1 ? 's are' : ' is'} running low. Reorder soon to avoid stockouts.` : 'Your inventory is looking healthy. Keep up the good work!'}</p><a href="#products">Review inventory <span>→</span></a><div className="insight-orb"></div></article>
        </div>
        <section className="inventory-panel" id="products"><div className="panel-heading"><div><h2>All products <span className="count-pill">{products.length}</span></h2><p>Manage and track your product catalog.</p></div><button className="button primary compact" onClick={openCreate}><Plus size={16} />Add product</button></div>
          <div className="toolbar"><label className="search-box"><Search size={17} /><input placeholder="Search products, SKU..." value={query} onChange={e => setQuery(e.target.value)} /></label><label className="select-wrap"><SlidersHorizontal size={16} /><select value={category} onChange={e => setCategory(e.target.value)}>{categories.map(c => <option key={c}>{c}</option>)}</select><ChevronDown size={14} /></label><button className="button secondary filter-button"><SlidersHorizontal size={15} />Filters</button></div>
          {error && <div className="error-banner">{error}<button onClick={loadProducts}>Retry</button></div>}
          <div className="table-wrap"><table><thead><tr><th><input type="checkbox" aria-label="Select all products" /></th><th>PRODUCT</th><th>SKU</th><th>CATEGORY</th><th>PRICE</th><th>QUANTITY</th><th>STATUS</th><th></th></tr></thead><tbody>
            {visible.map((p, i) => <tr key={p.id}><td><input type="checkbox" aria-label={`Select ${p.name}`} /></td><td><div className="product-cell"><span className={`product-thumb thumb-${i % 4}`}><Package size={18} /></span><strong>{p.name}</strong></div></td><td className="sku">{p.sku}</td><td><span className="category-label"><Tag size={12} />{p.category}</span></td><td className="price">{currency.format(p.price)}</td><td><span className="qty">{p.quantity} <small>units</small></span></td><td><span className={`status ${p.quantity < 10 ? 'low' : 'in-stock'}`}><i></i>{p.quantity < 10 ? 'Low stock' : 'In stock'}</span></td><td><div className="row-actions"><button title="Edit product" onClick={() => openEdit(p)}>Edit</button><button title="Delete product" onClick={() => removeProduct(p)}><Trash2 size={15} /></button></div></td></tr>)}
            {!visible.length && <tr><td colSpan="8"><div className="empty-state"><span className="empty-icon"><Package size={22} /></span><strong>{products.length ? 'No matching products' : 'Your inventory starts here'}</strong><p>{products.length ? 'Try a different search or category.' : 'Add your first product to start tracking stock.'}</p>{!products.length && <button className="button primary compact" onClick={openCreate}><Plus size={15} />Add product</button>}</div></td></tr>}
          </tbody></table></div><footer className="table-footer"><span>Showing <strong>{visible.length}</strong> of <strong>{products.length}</strong> products</span><div><button disabled>Previous</button><button disabled>Next</button></div></footer>
        </section>
        <footer className="page-footer">© 2026 Stockroom <span>Made for keeping things in order.</span></footer>
      </section>
    </main>
    {dialog && <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setDialog(null)}><form className="modal" onSubmit={saveProduct}><div className="modal-heading"><div><span className="eyebrow">PRODUCT DETAILS</span><h2>{dialog.mode === 'create' ? 'Add a product' : 'Edit product'}</h2></div><button type="button" className="icon-button" onClick={() => setDialog(null)} aria-label="Close"><X size={18} /></button></div><label>Product name<input required maxLength="160" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ceramic coffee mug" /></label><div className="form-row"><label>SKU<input required maxLength="64" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="e.g. MUG-001" /></label><label>Category<input required maxLength="100" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Kitchen" /></label></div><div className="form-row"><label>Price ($)<input required type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0.00" /></label><label>Quantity<input required type="number" min="0" step="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} /></label></div>{error && <div className="form-error">{error}</div>}<div className="modal-actions"><button type="button" className="button secondary" onClick={() => setDialog(null)}>Cancel</button><button className="button primary" disabled={busy}>{busy ? 'Saving...' : dialog.mode === 'create' ? 'Add product' : 'Save changes'}</button></div></form></div>}
  </div>
}

export default App
