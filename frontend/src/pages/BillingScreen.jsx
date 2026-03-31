import React, { useState, useEffect, useCallback } from 'react';
import api, { getApiErrorMessage } from '../api';
import {
  ShoppingCart, Plus, Minus, X, Tag, BadgeCheck,
  Search, Coffee, Leaf, Cookie, CupSoda, Utensils
} from 'lucide-react';
import { calculateTotalsFromDiscountPercentage, formatCurrency } from '../utils/format';

const CATEGORIES = ['Coffee', 'Tea', 'Snacks', 'Cold Drinks', 'Other'];

const CATEGORY_ICONS = {
  Coffee: { icon: Coffee, iconBg: '#FBF3E4', iconColor: '#92400E' },
  Tea: { icon: Leaf, iconBg: '#E6F0EF', iconColor: '#103935' },
  Snacks: { icon: Cookie, iconBg: '#F3E8FF', iconColor: '#5B21B6' },
  'Cold Drinks': { icon: CupSoda, iconBg: '#DBEAFE', iconColor: '#1E40AF' },
  Other: { icon: Utensils, iconBg: '#F1F5F9', iconColor: '#475569' }
};

const CATEGORY_COLORS = {
  Coffee: { bg: '#FBF3E4', color: '#92400E' },
  Tea: { bg: '#E6F0EF', color: '#103935' },
  Snacks: { bg: '#F3E8FF', color: '#5B21B6' },
  'Cold Drinks': { bg: '#DBEAFE', color: '#1E40AF' },
  Other: { bg: '#F1F5F9', color: '#475569' }
};

const CARD_SHADOW = '0 2px 8px rgba(16,57,53,0.08)';

function BillingScreen() {
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [successOrder, setSuccessOrder] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!successOrder) return;
    const handleKey = (e) => { if (e.key === 'Escape') setSuccessOrder(null); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [successOrder]);

  useEffect(() => { fetchMenu(); }, []);

  const fetchMenu = async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    }
    try {
      const res = await api.get('/api/menu/available');
      setMenuItems(res.data);
      setError('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load menu items.'));
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  const addToCart = useCallback((item) => {
    setCart(prev => {
      const existing = prev.find(c => c._id === item._id);
      if (existing) return prev.map(c => c._id === item._id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const decrementFromCart = useCallback((itemId) => {
    setCart(prev => {
      const existing = prev.find(c => c._id === itemId);
      if (existing && existing.quantity > 1) return prev.map(c => c._id === itemId ? { ...c, quantity: c.quantity - 1 } : c);
      return prev.filter(c => c._id !== itemId);
    });
  }, []);

  const removeFromCart = useCallback((itemId) => {
    setCart(prev => prev.filter(c => c._id !== itemId));
  }, []);

  const discountPct = Math.min(100, Math.max(0, parseFloat(discount) || 0));
  const totals = calculateTotalsFromDiscountPercentage(cart, discountPct);
  const { subtotal, discount: discountAmount, gst, total } = totals;

  const generateBill = async () => {
    if (cart.length === 0) return;
    setGenerating(true);
    setError('');
    try {
      const orderData = {
        items: cart.map(item => ({ itemId: item._id, quantity: item.quantity })),
        discountPercentage: discountPct
      };
      const res = await api.post('/api/orders', orderData);
      setSuccessOrder(res.data);
      setCart([]);
      setDiscount('');
      await fetchMenu(false);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to generate bill. Please try again.'));
      if (err.response) {
        await fetchMenu(false);
      }
    } finally {
      setGenerating(false);
    }
  };

  const getCategoryCount = (cat) =>
    cat === 'All' ? menuItems.length : menuItems.filter(i => i.category === cat).length;

  const byCat = activeCategory === 'All' ? menuItems : menuItems.filter(item => item.category === activeCategory);
  const filteredItems = debouncedSearch.trim()
    ? byCat.filter(item => item.name.toLowerCase().includes(debouncedSearch.toLowerCase()))
    : byCat;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ backgroundColor: '#F7F9F8' }}>
        <div className="text-center">
          <div
            className="w-12 h-12 rounded-full animate-spin mx-auto mb-4"
            style={{ border: '3px solid #E6F0EF', borderTopColor: '#103935' }}
          />
          <p className="text-sm font-medium" style={{ color: '#4A6B69' }}>Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter flex flex-col lg:flex-row h-full" style={{ backgroundColor: '#F7F9F8' }}>
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 min-h-0">
        <div className="px-6 pt-6 pb-4" style={{ backgroundColor: '#F7F9F8' }}>
          <h2
            className="font-bold"
            style={{ color: '#0A1F1E', fontSize: '28px', letterSpacing: '-0.3px' }}
          >
            Billing
          </h2>
          <p className="text-sm mt-0.5" style={{ color: '#4A6B69' }}>Select items to build the order</p>

          {error && (
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-xl mt-3 text-sm"
              style={{ backgroundColor: '#FEE2E2', color: '#EF4444', border: '1px solid #FECACA' }}
            >
              <span className="w-1 h-4 rounded-full shrink-0" style={{ backgroundColor: '#EF4444' }} />
              {error}
              <button
                onClick={fetchMenu}
                className="ml-auto underline font-semibold text-xs"
              >
                Retry
              </button>
            </div>
          )}

          <div className="relative mt-4">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#8AADAA' }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search menu items..."
              className="w-full pl-10 pr-4 h-11 rounded-xl text-sm outline-none transition-all duration-200"
              style={{ border: '1px solid #E0ECEA', backgroundColor: 'white', color: '#0A1F1E' }}
              onFocus={e => { e.target.style.borderColor = '#103935'; e.target.style.boxShadow = '0 0 0 3px rgba(16,57,53,0.10)'; }}
              onBlur={e => { e.target.style.borderColor = '#E0ECEA'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div className="flex gap-2 mt-3 flex-wrap">
            {['All', ...CATEGORIES].map(cat => {
              const count = getCategoryCount(cat);
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
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
                    className="text-xs font-bold leading-none px-1.5 py-0.5 rounded-full"
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
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {filteredItems.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingCart size={44} className="mx-auto mb-3" style={{ color: '#E0ECEA' }} />
              <p className="text-sm font-semibold" style={{ color: '#8AADAA' }}>
                {debouncedSearch ? `No results for "${debouncedSearch}"` : `No items in ${activeCategory}`}
              </p>
              <p className="text-xs mt-1" style={{ color: '#B0C8C5' }}>Try a different category or search term</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map(item => {
                const cartItem = cart.find(c => c._id === item._id);
                const catColor = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Other;
                const ci = CATEGORY_ICONS[item.category] || CATEGORY_ICONS.Other;
                const Icon = ci.icon;
                return (
                  <div
                    key={item._id}
                    onClick={() => addToCart(item)}
                    className="cursor-pointer select-none transition-all duration-200 relative group"
                    style={{
                      backgroundColor: cartItem ? '#F0F9F7' : 'white',
                      border: `1.5px solid ${cartItem ? '#103935' : '#E0ECEA'}`,
                      borderRadius: '16px',
                      padding: '16px',
                      boxShadow: cartItem ? '0 4px 14px rgba(16,57,53,0.14)' : CARD_SHADOW,
                      minHeight: '140px',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                    onMouseEnter={e => {
                      if (!cartItem) {
                        e.currentTarget.style.borderColor = '#9BBFBB';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(16,57,53,0.12)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!cartItem) {
                        e.currentTarget.style.borderColor = '#E0ECEA';
                        e.currentTarget.style.boxShadow = CARD_SHADOW;
                        e.currentTarget.style.transform = '';
                      }
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                      style={{ backgroundColor: ci.iconBg }}
                    >
                      <Icon size={20} style={{ color: ci.iconColor }} strokeWidth={1.75} />
                    </div>
                    <h3 className="font-bold text-sm leading-tight mb-auto" style={{ color: '#0A1F1E' }}>{item.name}</h3>
                    <div className="mt-2">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: catColor.bg, color: catColor.color }}
                      >
                        {item.category}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <span className="font-black text-sm" style={{ color: '#C9973A' }}>{formatCurrency(item.price)}</span>
                      {cartItem ? (
                        <span
                          className="text-xs px-2.5 py-0.5 rounded-full font-black text-white"
                          style={{ backgroundColor: '#103935' }}
                        >
                          {cartItem.quantity}
                        </span>
                      ) : (
                        <span
                          className="w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          style={{ backgroundColor: '#103935', color: 'white', fontSize: '16px', lineHeight: 1 }}
                        >
                          +
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div
        className="w-full lg:w-80 flex flex-col shrink-0 max-h-[42vh] lg:max-h-none"
        style={{ backgroundColor: 'white', borderTop: '1px solid #E0ECEA' }}
      >
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #E0ECEA' }}>
          <div className="flex items-center justify-between">
            <h3 className="font-bold" style={{ color: '#0A1F1E', fontSize: '16px' }}>Order Summary</h3>
            {cart.length > 0 && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-black text-white"
                style={{ backgroundColor: '#103935' }}
              >
                {cart.reduce((s, i) => s + i.quantity, 0)} items
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-8">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
                style={{ backgroundColor: '#E6F0EF' }}
              >
                <ShoppingCart size={24} style={{ color: '#103935' }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: '#4A6B69' }}>Cart is empty</p>
              <p className="text-xs mt-1" style={{ color: '#8AADAA' }}>Tap any menu item to add</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map(item => (
                <div
                  key={item._id}
                  className="flex items-center gap-2 rounded-xl p-3"
                  style={{ backgroundColor: '#F7F9F8', border: '1px solid #F0F5F4' }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-tight truncate" style={{ color: '#0A1F1E' }}>{item.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#4A6B69' }}>{formatCurrency(item.price)} each</p>
                  </div>
                  <div
                    className="flex items-center gap-1 rounded-full px-1"
                    style={{ backgroundColor: 'white', border: '1px solid #E0ECEA' }}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); decrementFromCart(item._id); }}
                      className="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200"
                      aria-label="Decrease quantity"
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#E6F0EF'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <Minus size={10} style={{ color: '#4A6B69' }} />
                    </button>
                    <span className="text-sm font-black w-5 text-center" style={{ color: '#0A1F1E' }}>{item.quantity}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                      className="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200"
                      aria-label="Increase quantity"
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#E6F0EF'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <Plus size={10} style={{ color: '#103935' }} />
                    </button>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFromCart(item._id); }}
                    className="w-6 h-6 rounded-full flex items-center justify-center ml-1 transition-all duration-200"
                    style={{ backgroundColor: '#FEE2E2' }}
                    aria-label="Remove item"
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FECACA'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FEE2E2'}
                  >
                    <X size={10} style={{ color: '#EF4444' }} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 space-y-3" style={{ borderTop: '1px solid #E0ECEA' }}>
          <div>
            <label
              className="flex items-center gap-1.5 mb-1.5"
              style={{ color: '#4A6B69', fontSize: '13px', fontWeight: '500' }}
            >
              <Tag size={11} />
              Discount (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              onBlur={(e) => {
                const num = parseFloat(e.target.value);
                if (e.target.value !== '' && (isNaN(num) || num < 0)) setDiscount('0');
                else if (num > 100) setDiscount('100');
              }}
              placeholder="0"
              className="w-full px-3 h-10 rounded-xl text-sm outline-none transition-all duration-200"
              style={{ border: '1px solid #E0ECEA', color: '#0A1F1E' }}
              onFocus={e => { e.target.style.borderColor = '#103935'; e.target.style.boxShadow = '0 0 0 3px rgba(16,57,53,0.10)'; }}
            />
          </div>

          <div
            className="rounded-xl p-3 space-y-2"
            style={{ backgroundColor: '#F7F9F8', border: '1px solid #F0F5F4' }}
          >
            <div className="flex justify-between text-sm" style={{ color: '#4A6B69' }}>
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm font-medium" style={{ color: '#10B981' }}>
                <span>Discount ({discountPct}%)</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm" style={{ color: '#4A6B69' }}>
              <span>GST (5%)</span>
              <span>{formatCurrency(gst)}</span>
            </div>
            <div
              className="flex justify-between font-black text-base pt-2"
              style={{ color: '#0A1F1E', borderTop: '1px solid #E0ECEA' }}
            >
              <span>Grand Total</span>
              <span style={{ color: '#103935' }}>{formatCurrency(total)}</span>
            </div>
          </div>

          <button
            onClick={generateBill}
            disabled={cart.length === 0 || generating}
            className="btn-press w-full h-12 rounded-xl font-bold text-sm text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#103935', boxShadow: cart.length > 0 ? '0 4px 12px rgba(16,57,53,0.30)' : 'none' }}
            onMouseEnter={e => { if (cart.length > 0 && !generating) e.currentTarget.style.backgroundColor = '#0A2422'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#103935'; }}
          >
            {generating ? 'Generating Bill...' : 'Generate Bill'}
          </button>

          {cart.length > 0 && (
            <button
              onClick={() => { setCart([]); setDiscount(''); }}
              className="btn-press w-full text-xs py-1.5 transition-colors duration-200 rounded-lg"
              style={{ color: '#8AADAA' }}
              onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
              onMouseLeave={e => e.currentTarget.style.color = '#8AADAA'}
            >
              Clear Cart
            </button>
          )}
        </div>
      </div>

      {successOrder && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(5,20,18,0.65)', backdropFilter: 'blur(6px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setSuccessOrder(null); }}
        >
          <div
            className="w-full max-w-sm text-center card-enter"
            style={{
              backgroundColor: 'white',
              borderRadius: '28px',
              padding: '36px 32px',
              boxShadow: '0 24px 80px rgba(16,57,53,0.30)',
              border: '1px solid #E0ECEA'
            }}
          >
            <div className="relative w-20 h-20 mx-auto mb-5">
              <div
                className="absolute inset-0 rounded-full"
                style={{ border: '3px solid #C9973A', opacity: 0.35 }}
              />
              <div
                className="absolute inset-2 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#E6F0EF' }}
              >
                <BadgeCheck size={32} style={{ color: '#103935' }} strokeWidth={2} />
              </div>
              {[0, 60, 120, 180, 240, 300].map(deg => (
                <div
                  key={deg}
                  className="absolute w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: '#C9973A',
                    opacity: 0.5,
                    top: '50%',
                    left: '50%',
                    transform: `rotate(${deg}deg) translate(36px, -50%)`
                  }}
                />
              ))}
            </div>

            <h3 className="text-xl font-black mb-1" style={{ color: '#0A1F1E' }}>Order Placed!</h3>
            <p className="text-sm" style={{ color: '#4A6B69' }}>Sent to kitchen successfully</p>

            <div
              className="mt-5 rounded-2xl p-5"
              style={{
                background: 'linear-gradient(135deg, #0A2422 0%, #103935 100%)',
                boxShadow: '0 8px 24px rgba(16,57,53,0.30)'
              }}
            >
              <p
                className="font-semibold uppercase mb-1"
                style={{ color: 'rgba(255,255,255,0.55)', fontSize: '11px', letterSpacing: '0.1em' }}
              >
                Token Number
              </p>
              <p
                className="font-black leading-none"
                style={{ color: '#C9973A', fontSize: '72px', letterSpacing: '-2px' }}
              >
                #{successOrder.tokenNumber}
              </p>
            </div>

            <div className="mt-4 space-y-1">
              <p className="text-sm" style={{ color: '#4A6B69' }}>
                Total:{' '}
                <strong style={{ color: '#C9973A', fontSize: '16px' }}>
                  {formatCurrency(successOrder.total)}
                </strong>
              </p>
              <p className="text-xs" style={{ color: '#8AADAA' }}>
                {successOrder.items.length} item{successOrder.items.length !== 1 ? 's' : ''} - GST included
              </p>
            </div>

            <button
              onClick={() => setSuccessOrder(null)}
              className="btn-press mt-6 w-full h-12 rounded-xl font-bold text-sm text-white transition-all duration-200"
              style={{ backgroundColor: '#103935', boxShadow: '0 4px 12px rgba(16,57,53,0.25)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0A2422'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#103935'}
            >
              New Order
            </button>

            <p className="text-xs mt-3" style={{ color: '#B0C8C5' }}>Press Esc or tap outside to close</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default BillingScreen;
