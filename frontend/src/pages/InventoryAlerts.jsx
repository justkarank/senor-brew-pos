import React, { useState, useEffect } from 'react';
import api, { getApiErrorMessage } from '../api';
import { Package, AlertOctagon, AlertTriangle, CheckCircle2, Save } from 'lucide-react';

const CARD_SHADOW = '0 2px 8px rgba(16,57,53,0.08)';

const CARD_STYLE_BASE = {
  backgroundColor: 'white',
  borderRadius: '16px',
  border: '1px solid #E0ECEA',
  boxShadow: CARD_SHADOW
};

const CATEGORY_BADGE = {
  Coffee: { bg: '#FBF3E4', color: '#92400E' },
  Tea: { bg: '#E6F0EF', color: '#103935' },
  Snacks: { bg: '#F3E8FF', color: '#5B21B6' },
  'Cold Drinks': { bg: '#DBEAFE', color: '#1E40AF' },
  Other: { bg: '#F1F5F9', color: '#475569' }
};

function InventoryAlerts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stockInputs, setStockInputs] = useState({});
  const [saving, setSaving] = useState({});
  const [saved, setSaved] = useState({});

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      const res = await api.get('/api/menu');
      setItems(res.data);
      setError('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load inventory data.'));
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (itemId) => {
    const newQty = stockInputs[itemId];
    if (newQty === undefined || newQty === '') return;

    const qty = Number(newQty);
    if (!Number.isInteger(qty) || qty < 0) {
      setError('Please enter a whole number 0 or greater.');
      return;
    }

    setSaving(prev => ({ ...prev, [itemId]: true }));
    setSaved(prev => ({ ...prev, [itemId]: false }));

    try {
      const res = await api.put(`/api/menu/${itemId}`, { stockQuantity: qty });
      setItems(prev => prev.map(item => item._id === itemId ? res.data : item));
      setStockInputs(prev => { const next = { ...prev }; delete next[itemId]; return next; });
      setSaved(prev => ({ ...prev, [itemId]: true }));
      setTimeout(() => setSaved(prev => ({ ...prev, [itemId]: false })), 2500);
      setError('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update stock. Please try again.'));
    } finally {
      setSaving(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const handleStockKeyDown = (e, itemId) => {
    if (e.key === 'Enter') updateStock(itemId);
  };

  const criticalItems = items.filter(i => i.stockQuantity < 5);
  const lowItems = items.filter(i => i.stockQuantity >= 5 && i.stockQuantity < 10);

  const getStockLevel = (qty) => {
    if (qty < 5) return {
      label: 'Critical',
      pillBg: '#FEE2E2', pillColor: '#EF4444', pillBorder: 'rgba(239,68,68,0.30)',
      bar: '#EF4444', borderLeft: '#EF4444', numColor: '#EF4444',
      pct: Math.max(8, (qty / 20) * 100)
    };
    if (qty < 10) return {
      label: 'Low',
      pillBg: '#FBF3E4', pillColor: '#C9973A', pillBorder: 'rgba(201,151,58,0.30)',
      bar: '#C9973A', borderLeft: '#C9973A', numColor: '#C9973A',
      pct: (qty / 20) * 100
    };
    return {
      label: 'OK',
      pillBg: '#E6F0EF', pillColor: '#103935', pillBorder: 'rgba(16,57,53,0.20)',
      bar: '#103935', borderLeft: '#103935', numColor: '#103935',
      pct: Math.min(100, (qty / 20) * 100)
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ backgroundColor: '#F7F9F8' }}>
        <div className="text-center">
          <div
            className="w-12 h-12 rounded-full animate-spin mx-auto mb-4"
            style={{ border: '3px solid #E6F0EF', borderTopColor: '#103935' }}
          />
          <p className="text-sm font-medium" style={{ color: '#4A6B69' }}>Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter p-4 sm:p-6 min-h-full" style={{ backgroundColor: '#F7F9F8' }}>
      <div className="mb-6">
        <h2
          className="font-bold"
          style={{ color: '#0A1F1E', fontSize: '28px', letterSpacing: '-0.3px' }}
        >
          Inventory Alerts
        </h2>
        <p className="text-sm mt-1" style={{ color: '#4A6B69' }}>Monitor and restock item levels</p>
      </div>

      {error && (
        <div
          className="px-4 py-3 rounded-xl mb-4 text-sm flex items-center gap-2"
          style={{ backgroundColor: '#FEE2E2', color: '#EF4444', border: '1px solid #FECACA' }}
        >
          <span className="w-1 h-4 rounded-full shrink-0" style={{ backgroundColor: '#EF4444' }} />
          {error}
          <button onClick={() => setError('')} className="ml-auto">
            <span style={{ fontSize: '16px' }}>x</span>
          </button>
        </div>
      )}

      {criticalItems.length > 0 && (
        <div
          className="flex items-start gap-3 rounded-xl p-4 mb-4"
          style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderLeft: '4px solid #EF4444'
          }}
        >
          <AlertOctagon size={18} style={{ color: '#EF4444', flexShrink: 0, marginTop: '1px' }} />
          <div>
            <p className="font-bold text-sm" style={{ color: '#991B1B' }}>
              Critical Stock - Immediate Action Required
            </p>
            <p className="text-sm mt-0.5" style={{ color: '#DC2626' }}>
              <strong>{criticalItems.length}</strong> item{criticalItems.length !== 1 ? 's' : ''} below 5 units:{' '}
              <strong>{criticalItems.map(i => i.name).join(', ')}</strong>
            </p>
          </div>
        </div>
      )}

      {lowItems.length > 0 && (
        <div
          className="flex items-start gap-3 rounded-xl p-4 mb-5"
          style={{
            backgroundColor: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderLeft: '4px solid #C9973A'
          }}
        >
          <AlertTriangle size={18} style={{ color: '#C9973A', flexShrink: 0, marginTop: '1px' }} />
          <div>
            <p className="font-bold text-sm" style={{ color: '#92400E' }}>Low Stock Warning</p>
            <p className="text-sm mt-0.5" style={{ color: '#B45309' }}>
              <strong>{lowItems.length}</strong> item{lowItems.length !== 1 ? 's' : ''} running low (5-9 units):{' '}
              {lowItems.map(i => i.name).join(', ')}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
        <div
          className="p-6 transition-all duration-200"
          style={{ ...CARD_STYLE_BASE }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(16,57,53,0.14)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = CARD_SHADOW; e.currentTarget.style.transform = ''; }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: '#E6F0EF' }}>
            <Package size={22} style={{ color: '#103935' }} />
          </div>
          <p className="font-semibold uppercase" style={{ color: '#8AADAA', fontSize: '11px', letterSpacing: '0.05em' }}>Total Items</p>
          <p className="font-black mt-1" style={{ color: '#103935', fontSize: '36px', letterSpacing: '-0.5px', lineHeight: 1.1 }}>{items.length}</p>
          <p className="text-xs mt-1" style={{ color: '#8AADAA' }}>In menu</p>
        </div>

        <div
          className="p-6 transition-all duration-200"
          style={{ ...CARD_STYLE_BASE }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(16,57,53,0.14)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = CARD_SHADOW; e.currentTarget.style.transform = ''; }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: '#FBF3E4' }}>
            <AlertTriangle size={22} style={{ color: '#C9973A' }} />
          </div>
          <p className="font-semibold uppercase" style={{ color: '#8AADAA', fontSize: '11px', letterSpacing: '0.05em' }}>Low Stock</p>
          <p className="font-black mt-1" style={{ color: '#C9973A', fontSize: '36px', letterSpacing: '-0.5px', lineHeight: 1.1 }}>{lowItems.length}</p>
          <p className="text-xs mt-1" style={{ color: '#8AADAA' }}>5 - 9 units</p>
        </div>

        <div
          className="p-6 transition-all duration-200"
          style={{ ...CARD_STYLE_BASE }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(16,57,53,0.14)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = CARD_SHADOW; e.currentTarget.style.transform = ''; }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: '#FEE2E2' }}>
            <AlertOctagon size={22} style={{ color: '#EF4444' }} />
          </div>
          <p className="font-semibold uppercase" style={{ color: '#8AADAA', fontSize: '11px', letterSpacing: '0.05em' }}>Critical</p>
          <p className="font-black mt-1" style={{ color: '#EF4444', fontSize: '36px', letterSpacing: '-0.5px', lineHeight: 1.1 }}>{criticalItems.length}</p>
          <p className="text-xs mt-1" style={{ color: '#8AADAA' }}>Below 5 units</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div
          className="text-center py-16 rounded-2xl"
          style={{ backgroundColor: 'white', border: '1px solid #E0ECEA', boxShadow: CARD_SHADOW }}
        >
          <Package size={44} className="mx-auto mb-3" style={{ color: '#E0ECEA' }} />
          <p className="text-sm font-semibold" style={{ color: '#8AADAA' }}>No inventory items found</p>
          <p className="text-xs mt-1" style={{ color: '#B0C8C5' }}>Add items in Menu Management first</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map(item => {
            const level = getStockLevel(item.stockQuantity);
            const badge = CATEGORY_BADGE[item.category] || CATEGORY_BADGE.Other;
            return (
              <div
                key={item._id}
                className="overflow-hidden transition-all duration-200"
                style={{
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  border: '1px solid #E0ECEA',
                  borderLeft: `4px solid ${level.borderLeft}`,
                  boxShadow: CARD_SHADOW,
                  padding: '24px'
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(16,57,53,0.12)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = CARD_SHADOW; e.currentTarget.style.transform = ''; }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold" style={{ color: '#0A1F1E', fontSize: '15px' }}>{item.name}</h3>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium mt-1.5 inline-block"
                      style={{ backgroundColor: badge.bg, color: badge.color }}
                    >
                      {item.category}
                    </span>
                  </div>
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 ml-2"
                    style={{
                      backgroundColor: level.pillBg,
                      color: level.pillColor,
                      border: `1px solid ${level.pillBorder}`
                    }}
                  >
                    {level.label}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between items-baseline mb-2">
                    <span
                      className="font-semibold uppercase"
                      style={{ color: '#8AADAA', fontSize: '11px', letterSpacing: '0.05em' }}
                    >
                      Stock Level
                    </span>
                    <span
                      className="font-black"
                      style={{ color: level.numColor, fontSize: '36px', letterSpacing: '-0.5px', lineHeight: 1 }}
                    >
                      {item.stockQuantity}
                    </span>
                  </div>
                  <div
                    className="w-full rounded-full overflow-hidden"
                    style={{ height: '10px', backgroundColor: '#F0F5F4' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${level.pct}%`, backgroundColor: level.bar }}
                    />
                  </div>
                  <p className="text-xs mt-1" style={{ color: '#8AADAA' }}>out of ~20 units max</p>
                </div>

                <div style={{ borderTop: '1px solid #F0F5F4', marginBottom: '16px' }} />

                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={stockInputs[item._id] ?? ''}
                    onChange={(e) => setStockInputs(prev => ({ ...prev, [item._id]: e.target.value }))}
                    onKeyDown={(e) => handleStockKeyDown(e, item._id)}
                    placeholder="New qty"
                    className="flex-1 px-3 h-10 rounded-xl text-sm outline-none transition-all duration-200"
                    style={{ border: '1px solid #E0ECEA', color: '#0A1F1E' }}
                    onFocus={e => { e.target.style.borderColor = '#103935'; e.target.style.boxShadow = '0 0 0 3px rgba(16,57,53,0.10)'; }}
                    onBlur={e => { e.target.style.borderColor = '#E0ECEA'; e.target.style.boxShadow = 'none'; }}
                  />
                  <button
                    onClick={() => updateStock(item._id)}
                    disabled={saving[item._id] || stockInputs[item._id] === undefined || stockInputs[item._id] === ''}
                    className="btn-press px-4 h-10 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                    style={{ backgroundColor: '#103935' }}
                    onMouseEnter={e => { if (!saving[item._id]) e.currentTarget.style.backgroundColor = '#0A2422'; }}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#103935'}
                  >
                    {saving[item._id] ? (
                      <div className="w-4 h-4 rounded-full animate-spin" style={{ border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
                    ) : (
                      <>
                        <Save size={13} />
                        Save
                      </>
                    )}
                  </button>
                </div>

                {saved[item._id] && (
                  <div className="flex items-center gap-1.5 mt-2.5 text-xs font-semibold" style={{ color: '#10B981' }}>
                    <CheckCircle2 size={13} />
                    Stock updated successfully
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default InventoryAlerts;
