import React, { useState, useEffect } from 'react';
import api, { getApiErrorMessage } from '../api';
import { Plus, Pencil, Trash2, X, UtensilsCrossed, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../utils/format';

const CATEGORIES = ['Coffee', 'Tea', 'Snacks', 'Cold Drinks', 'Other'];
const emptyForm = { name: '', category: 'Coffee', price: '', stockQuantity: '', isAvailable: true };

const CARD_SHADOW = '0 2px 8px rgba(16,57,53,0.08)';

const CATEGORY_BADGE = {
  Coffee: { bg: '#FBF3E4', color: '#92400E' },
  Tea: { bg: '#E6F0EF', color: '#103935' },
  Snacks: { bg: '#F3E8FF', color: '#5B21B6' },
  'Cold Drinks': { bg: '#DBEAFE', color: '#1E40AF' },
  Other: { bg: '#F1F5F9', color: '#475569' }
};

function MenuManagement() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');

  useEffect(() => { fetchItems(); }, []);

  useEffect(() => {
    if (!showForm) return;
    const handleKey = (e) => { if (e.key === 'Escape') closeForm(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [showForm]);

  const fetchItems = async () => {
    try {
      const res = await api.get('/api/menu');
      setItems(res.data);
      setError('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load menu items.'));
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const openAddForm = () => { setForm(emptyForm); setEditingId(null); setShowForm(true); setError(''); };
  const openEditForm = (item) => {
    setForm({ name: item.name, category: item.category, price: item.price, stockQuantity: item.stockQuantity, isAvailable: item.isAvailable });
    setEditingId(item._id);
    setShowForm(true);
    setError('');
  };
  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(emptyForm); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setError('Item name is required.');
      return;
    }
    if (form.price === '' || Number(form.price) < 0) {
      setError('Valid price is required.');
      return;
    }
    if (form.stockQuantity === '' || Number(form.stockQuantity) < 0) {
      setError('Valid stock quantity is required.');
      return;
    }

    setSaving(true);
    setError('');
    const stockQuantity = Number(form.stockQuantity);
    const payload = {
      ...form,
      price: Number(form.price),
      stockQuantity,
      isAvailable: stockQuantity > 0 ? form.isAvailable : false
    };
    try {
      if (editingId) {
        await api.put(`/api/menu/${editingId}`, payload);
        showSuccess('Item updated successfully!');
      } else {
        await api.post('/api/menu', payload);
        showSuccess('Item added successfully!');
      }
      await fetchItems();
      closeForm();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to save item. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/menu/${id}`);
      setItems(prev => prev.filter(item => item._id !== id));
      showSuccess(`"${name}" deleted.`);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to delete item.'));
    }
  };

  const handleToggleAvailability = async (item) => {
    try {
      const res = await api.put(
        `/api/menu/${item._id}`,
        { isAvailable: !item.isAvailable }
      );
      setItems(prev => prev.map(i => (i._id === item._id ? res.data : i)));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update availability.'));
    }
  };

  const getCategoryCount = (cat) =>
    cat === 'All' ? items.length : items.filter(i => i.category === cat).length;

  const filtered = filterCategory === 'All' ? items : items.filter(i => i.category === filterCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ backgroundColor: '#F7F9F8' }}>
        <div className="text-center">
          <div
            className="w-12 h-12 rounded-full animate-spin mx-auto mb-4"
            style={{ border: '3px solid #E6F0EF', borderTopColor: '#103935' }}
          />
          <p className="text-sm font-medium" style={{ color: '#4A6B69' }}>Loading menu items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter p-4 sm:p-6 min-h-full" style={{ backgroundColor: '#F7F9F8' }}>
      <div className="flex justify-between items-start mb-6 flex-wrap gap-3">
        <div>
          <h2
            className="font-bold"
            style={{ color: '#0A1F1E', fontSize: '28px', letterSpacing: '-0.3px' }}
          >
            Menu Management
          </h2>
          <p className="text-sm mt-1" style={{ color: '#4A6B69' }}>
            {items.length} item{items.length !== 1 ? 's' : ''} in menu
          </p>
        </div>
        <button
          onClick={openAddForm}
          className="btn-press flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white transition-all duration-200 w-full sm:w-auto"
          style={{ backgroundColor: '#103935', boxShadow: '0 4px 12px rgba(16,57,53,0.25)' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0A2422'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#103935'}
        >
          <Plus size={16} strokeWidth={2.5} />
          Add New Item
        </button>
      </div>

      {error && !showForm && (
        <div
          className="px-4 py-3 rounded-xl mb-4 text-sm flex items-center gap-2"
          style={{ backgroundColor: '#FEE2E2', color: '#EF4444', border: '1px solid #FECACA' }}
        >
          <span className="w-1 h-4 rounded-full shrink-0" style={{ backgroundColor: '#EF4444' }} />
          {error}
        </div>
      )}

      <div className="flex gap-2 mb-5 flex-wrap">
        {['All', ...CATEGORIES].map(cat => {
          const count = getCategoryCount(cat);
          const isActive = filterCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className="btn-press flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all duration-200"
              style={isActive
                ? { backgroundColor: '#103935', color: 'white', boxShadow: '0 2px 8px rgba(16,57,53,0.20)' }
                : { backgroundColor: 'white', color: '#103935', border: '1px solid #D0E5E2' }
              }
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = '#E6F0EF'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'white'; }}
            >
              {cat}
              <span
                className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                style={isActive
                  ? { backgroundColor: 'rgba(255,255,255,0.22)', color: 'white' }
                  : { backgroundColor: '#E6F0EF', color: '#4A6B69' }
                }
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div
            className="rounded-2xl px-5 py-12 text-center"
            style={{
              backgroundColor: 'white',
              border: '1px solid #E0ECEA',
              boxShadow: CARD_SHADOW
            }}
          >
            <UtensilsCrossed size={40} className="mx-auto mb-3" style={{ color: '#E0ECEA' }} />
            <p className="text-sm font-semibold" style={{ color: '#8AADAA' }}>
              {filterCategory === 'All' ? 'No menu items yet' : `No ${filterCategory} items`}
            </p>
            <p className="text-xs mt-1" style={{ color: '#B0C8C5' }}>
              {filterCategory === 'All' ? 'Tap "Add New Item" to get started' : 'Try a different category filter'}
            </p>
          </div>
        ) : (
          filtered.map(item => {
            const badge = CATEGORY_BADGE[item.category] || CATEGORY_BADGE.Other;
            const stockColor = item.stockQuantity < 5 ? '#EF4444' : item.stockQuantity < 10 ? '#C9973A' : '#10B981';

            return (
              <div
                key={`mobile-${item._id}`}
                className="rounded-2xl p-4"
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #E0ECEA',
                  boxShadow: CARD_SHADOW
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-base" style={{ color: '#0A1F1E' }}>{item.name}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{ backgroundColor: badge.bg, color: badge.color }}
                      >
                        {item.category}
                      </span>
                      <span className="text-sm font-bold" style={{ color: '#C9973A' }}>
                        {formatCurrency(item.price)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditForm(item)}
                      className="btn-press w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
                      style={{ backgroundColor: '#DBEAFE', border: '1px solid #BFDBFE' }}
                      title="Edit Item"
                    >
                      <Pencil size={14} style={{ color: '#2563EB' }} />
                    </button>
                    <button
                      onClick={() => handleDelete(item._id, item.name)}
                      className="btn-press w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
                      style={{ backgroundColor: '#FEE2E2', border: '1px solid #FECACA' }}
                      title="Delete Item"
                    >
                      <Trash2 size={14} style={{ color: '#EF4444' }} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div
                    className="rounded-xl px-3 py-2"
                    style={{ backgroundColor: '#F7F9F8', border: '1px solid #F0F5F4' }}
                  >
                    <p className="text-[11px] font-semibold uppercase" style={{ color: '#8AADAA', letterSpacing: '0.05em' }}>
                      Stock
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stockColor }} />
                      <span className="font-bold text-sm" style={{ color: stockColor }}>
                        {item.stockQuantity}
                      </span>
                    </div>
                  </div>

                  <div
                    className="rounded-xl px-3 py-2"
                    style={{ backgroundColor: '#F7F9F8', border: '1px solid #F0F5F4' }}
                  >
                    <p className="text-[11px] font-semibold uppercase" style={{ color: '#8AADAA', letterSpacing: '0.05em' }}>
                      Available
                    </p>
                    <button
                      onClick={() => handleToggleAvailability(item)}
                      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 mt-2"
                      style={{ backgroundColor: item.isAvailable ? '#103935' : '#CBD5E1' }}
                      title={item.isAvailable ? 'Click to mark unavailable' : 'Click to mark available'}
                      aria-label={item.isAvailable ? 'Mark unavailable' : 'Mark available'}
                    >
                      <span
                        className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200"
                        style={{
                          transform: item.isAvailable ? 'translateX(24px)' : 'translateX(4px)',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.20)'
                        }}
                      />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div
        className="hidden md:block overflow-hidden"
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          border: '1px solid #E0ECEA',
          boxShadow: CARD_SHADOW
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: '#F7F9F8', borderBottom: '1px solid #E0ECEA' }}>
              <tr>
                {['Name', 'Category', 'Price', 'Stock', 'Available', 'Actions'].map(h => (
                  <th
                    key={h}
                    className="px-6 py-3.5 text-left font-semibold uppercase"
                    style={{ color: '#8AADAA', fontSize: '11px', letterSpacing: '0.05em' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <UtensilsCrossed size={40} className="mx-auto mb-3" style={{ color: '#E0ECEA' }} />
                    <p className="text-sm font-semibold" style={{ color: '#8AADAA' }}>
                      {filterCategory === 'All' ? 'No menu items yet' : `No ${filterCategory} items`}
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#B0C8C5' }}>
                      {filterCategory === 'All' ? 'Click "Add New Item" to get started' : 'Try a different category filter'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => {
                  const badge = CATEGORY_BADGE[item.category] || CATEGORY_BADGE.Other;
                  return (
                    <tr
                      key={item._id}
                      style={{
                        height: '56px',
                        borderBottom: idx < filtered.length - 1 ? '1px solid #F0F5F4' : 'none',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F7F9F8'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; }}
                    >
                      <td className="px-6 font-semibold text-sm" style={{ color: '#0A1F1E' }}>{item.name}</td>
                      <td className="px-6">
                        <span
                          className="text-xs px-2.5 py-1 rounded-full font-medium"
                          style={{ backgroundColor: badge.bg, color: badge.color }}
                        >
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 font-bold text-sm" style={{ color: '#C9973A' }}>{formatCurrency(item.price)}</td>
                      <td className="px-6">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: item.stockQuantity < 5 ? '#EF4444' : item.stockQuantity < 10 ? '#C9973A' : '#10B981'
                            }}
                          />
                          <span
                            className="font-bold text-sm"
                            style={{
                              color: item.stockQuantity < 5 ? '#EF4444' : item.stockQuantity < 10 ? '#C9973A' : '#10B981'
                            }}
                          >
                            {item.stockQuantity}
                          </span>
                        </div>
                      </td>
                      <td className="px-6">
                        <button
                          onClick={() => handleToggleAvailability(item)}
                          className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200"
                          style={{ backgroundColor: item.isAvailable ? '#103935' : '#CBD5E1' }}
                          title={item.isAvailable ? 'Click to mark unavailable' : 'Click to mark available'}
                          aria-label={item.isAvailable ? 'Mark unavailable' : 'Mark available'}
                        >
                          <span
                            className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200"
                            style={{
                              transform: item.isAvailable ? 'translateX(24px)' : 'translateX(4px)',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.20)'
                            }}
                          />
                        </button>
                      </td>
                      <td className="px-6">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditForm(item)}
                            className="btn-press w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
                            style={{ backgroundColor: '#DBEAFE', border: '1px solid #BFDBFE' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#BFDBFE'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#DBEAFE'}
                            title="Edit Item"
                          >
                            <Pencil size={13} style={{ color: '#2563EB' }} />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id, item.name)}
                            className="btn-press w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
                            style={{ backgroundColor: '#FEE2E2', border: '1px solid #FECACA' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FECACA'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FEE2E2'}
                            title="Delete Item"
                          >
                            <Trash2 size={13} style={{ color: '#EF4444' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(5,20,18,0.60)', backdropFilter: 'blur(6px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) closeForm(); }}
        >
          <div
            className="w-full max-w-md max-h-[90vh] overflow-y-auto card-enter"
            style={{
              backgroundColor: 'white',
              borderRadius: '24px',
              padding: '28px',
              boxShadow: '0 24px 80px rgba(16,57,53,0.22)',
              border: '1px solid #E0ECEA'
            }}
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold" style={{ color: '#0A1F1E', fontSize: '18px' }}>
                  {editingId ? 'Edit Menu Item' : 'Add New Item'}
                </h3>
                <p className="text-xs mt-0.5" style={{ color: '#8AADAA' }}>
                  {editingId ? 'Update the item details below' : 'Fill in the details for the new item'}
                </p>
              </div>
              <button
                onClick={closeForm}
                className="btn-press w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200"
                style={{ backgroundColor: '#F7F9F8', border: '1px solid #E0ECEA' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#E6F0EF'; e.currentTarget.style.borderColor = '#103935'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#F7F9F8'; e.currentTarget.style.borderColor = '#E0ECEA'; }}
                aria-label="Close"
              >
                <X size={14} style={{ color: '#4A6B69' }} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-medium mb-1.5" style={{ color: '#0A1F1E', fontSize: '14px' }}>Item Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 h-12 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{ border: '1px solid #E0ECEA', color: '#0A1F1E' }}
                  onFocus={e => { e.target.style.borderColor = '#103935'; e.target.style.boxShadow = '0 0 0 3px rgba(16,57,53,0.10)'; }}
                  onBlur={e => { e.target.style.borderColor = '#E0ECEA'; e.target.style.boxShadow = 'none'; }}
                  placeholder="e.g. Cappuccino Royale"
                  required
                  autoFocus
                />
                <p className="text-xs mt-1" style={{ color: '#8AADAA' }}>Use a clear, customer-facing name</p>
              </div>

              <div>
                <label className="block font-medium mb-1.5" style={{ color: '#0A1F1E', fontSize: '14px' }}>Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 h-12 rounded-xl text-sm outline-none transition-all duration-200 bg-white"
                  style={{ border: '1px solid #E0ECEA', color: '#0A1F1E' }}
                  onFocus={e => { e.target.style.borderColor = '#103935'; e.target.style.boxShadow = '0 0 0 3px rgba(16,57,53,0.10)'; }}
                  onBlur={e => { e.target.style.borderColor = '#E0ECEA'; e.target.style.boxShadow = 'none'; }}
                >
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1.5" style={{ color: '#0A1F1E', fontSize: '14px' }}>Price (INR) *</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full px-4 h-12 rounded-xl text-sm outline-none transition-all duration-200"
                    style={{ border: '1px solid #E0ECEA', color: '#0A1F1E' }}
                    onFocus={e => { e.target.style.borderColor = '#103935'; e.target.style.boxShadow = '0 0 0 3px rgba(16,57,53,0.10)'; }}
                    onBlur={e => { e.target.style.borderColor = '#E0ECEA'; e.target.style.boxShadow = 'none'; }}
                    placeholder="0"
                    min="0"
                    required
                  />
                  <p className="text-xs mt-1" style={{ color: '#8AADAA' }}>Excl. GST</p>
                </div>
                <div>
                  <label className="block font-medium mb-1.5" style={{ color: '#0A1F1E', fontSize: '14px' }}>Stock Qty *</label>
                  <input
                    type="number"
                    value={form.stockQuantity}
                    onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                    className="w-full px-4 h-12 rounded-xl text-sm outline-none transition-all duration-200"
                    style={{ border: '1px solid #E0ECEA', color: '#0A1F1E' }}
                    onFocus={e => { e.target.style.borderColor = '#103935'; e.target.style.boxShadow = '0 0 0 3px rgba(16,57,53,0.10)'; }}
                    onBlur={e => { e.target.style.borderColor = '#E0ECEA'; e.target.style.boxShadow = 'none'; }}
                    placeholder="0"
                    min="0"
                    required
                  />
                  <p className="text-xs mt-1" style={{ color: '#8AADAA' }}>Alert below 10 units</p>
                </div>
              </div>

              <div
                onClick={() => setForm({ ...form, isAvailable: !form.isAvailable })}
                className="flex items-center gap-3 cursor-pointer p-3.5 rounded-xl select-none transition-all duration-200"
                style={{ border: '1px solid #E0ECEA' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F7F9F8'; e.currentTarget.style.borderColor = '#9BBFBB'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.borderColor = '#E0ECEA'; }}
              >
                <div
                  className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200"
                  style={{ backgroundColor: form.isAvailable ? '#103935' : '#CBD5E1' }}
                >
                  <span
                    className="inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform duration-200"
                    style={{
                      transform: form.isAvailable ? 'translateX(18px)' : 'translateX(3px)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.18)'
                    }}
                  />
                </div>
                <div>
                  <span className="text-sm font-semibold" style={{ color: '#0A1F1E' }}>Mark as Available</span>
                  <p className="text-xs mt-0.5" style={{ color: '#8AADAA' }}>
                    {form.isAvailable ? 'Visible to billing counter' : 'Hidden from billing counter'}
                  </p>
                </div>
              </div>

              {error && (
                <div
                  className="text-sm p-3 rounded-xl flex items-center gap-2"
                  style={{ backgroundColor: '#FEE2E2', color: '#EF4444', border: '1px solid #FECACA' }}
                >
                  <span className="w-1 h-4 rounded-full shrink-0" style={{ backgroundColor: '#EF4444' }} />
                  {error}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeForm}
                  className="btn-press flex-1 h-12 rounded-xl font-medium text-sm transition-all duration-200"
                  style={{ border: '1px solid #E0ECEA', color: '#4A6B69', backgroundColor: 'white' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F7F9F8'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-press flex-1 h-12 rounded-xl font-semibold text-sm text-white transition-all duration-200 disabled:opacity-60"
                  style={{ backgroundColor: '#103935', boxShadow: '0 4px 12px rgba(16,57,53,0.25)' }}
                  onMouseEnter={e => { if (!saving) e.currentTarget.style.backgroundColor = '#0A2422'; }}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#103935'}
                >
                  {saving ? 'Saving...' : editingId ? 'Update Item' : 'Add Item'}
                </button>
              </div>

              <p className="text-center text-xs" style={{ color: '#B0C8C5' }}>Press Esc to cancel</p>
            </form>
          </div>
        </div>
      )}

      {successMsg && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold card-enter"
          style={{
            backgroundColor: '#103935',
            color: 'white',
            boxShadow: '0 8px 24px rgba(16,57,53,0.30)'
          }}
        >
          <CheckCircle2 size={16} style={{ color: '#10B981' }} />
          {successMsg}
        </div>
      )}
    </div>
  );
}

export default MenuManagement;
