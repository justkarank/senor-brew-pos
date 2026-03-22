import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { SOCKET_URL } from '../config';
import { io } from 'socket.io-client';
import { ChefHat, Timer, CheckCircle2, RefreshCw, Radio } from 'lucide-react';
const CARD_SHADOW = '0 2px 8px rgba(16,57,53,0.08)';

const STATUS_CONFIG = {
  pending: {
    topBar: '#C9973A',
    badge: { bg: '#FBF3E4', color: '#92400E', border: 'rgba(245,158,11,0.35)' },
    label: 'Pending'
  },
  preparing: {
    topBar: '#3B82F6',
    badge: { bg: '#DBEAFE', color: '#1E40AF', border: 'rgba(59,130,246,0.35)' },
    label: 'Preparing'
  },
  ready: {
    topBar: '#103935',
    badge: { bg: '#E6F0EF', color: '#103935', border: 'rgba(16,57,53,0.30)' },
    label: 'Ready'
  }
};

const timeAgo = (dateStr) => {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'Just now';
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins} min${mins !== 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} hr${hrs !== 1 ? 's' : ''} ago`;
};

function KitchenScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  // Used only to trigger re-render every 30s for "X mins ago" labels
  const [, setTick] = useState(0);

  // Re-render every 30s to update "X mins ago" labels
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchTodayOrders();

    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('newOrder', (order) => setOrders(prev => [order, ...prev]));
    socket.on('orderStatusUpdate', (updatedOrder) => {
      setOrders(prev => prev.map(o => (o._id === updatedOrder._id ? updatedOrder : o)));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const fetchTodayOrders = async () => {
    try {
      const res = await api.get('/api/orders/today');
      setOrders(res.data);
      setError('');
    } catch (err) {
      setError('Failed to load orders. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/api/orders/${orderId}/status`, { status: newStatus });
      // Optimistic update — socket event will also update but this feels faster
      setOrders(prev =>
        prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o)
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order status.');
    }
  };

  const sortedOrders = [...orders].sort((a, b) => {
    const priority = { pending: 0, preparing: 1, ready: 2 };
    return (priority[a.status] ?? 0) - (priority[b.status] ?? 0);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ backgroundColor: '#F7F9F8' }}>
        <div className="text-center">
          <div
            className="w-12 h-12 rounded-full animate-spin mx-auto mb-4"
            style={{ border: '3px solid #E6F0EF', borderTopColor: '#103935' }}
          />
          <p className="text-sm font-medium" style={{ color: '#4A6B69' }}>Loading kitchen orders...</p>
        </div>
      </div>
    );
  }

  const activeOrders = sortedOrders.filter(o => o.status !== 'ready');
  const completedOrders = sortedOrders.filter(o => o.status === 'ready');

  return (
    <div className="page-enter p-6 min-h-full" style={{ backgroundColor: '#F7F9F8' }}>

      {/* Header Card */}
      <div
        className="flex justify-between items-center px-6 py-4 mb-6 flex-wrap gap-3"
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          border: '1px solid #E0ECEA',
          boxShadow: CARD_SHADOW
        }}
      >
        <div>
          <h2 className="font-bold" style={{ color: '#0A1F1E', fontSize: '28px', letterSpacing: '-0.3px' }}>
            Kitchen Display
          </h2>
          <p className="text-sm mt-0.5" style={{ color: '#4A6B69' }}>Real-time order management</p>
        </div>
        <div className="flex items-center gap-3">
          {/* LIVE badge */}
          <div
            className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full font-semibold"
            style={connected
              ? { backgroundColor: '#E6F0EF', color: '#103935', border: '1px solid rgba(16,57,53,0.20)' }
              : { backgroundColor: '#FEE2E2', color: '#EF4444', border: '1px solid #FECACA' }
            }
          >
            {connected ? (
              <Radio size={12} className="live-pulse" style={{ color: '#10B981' }} />
            ) : (
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#EF4444' }} />
            )}
            {connected ? 'LIVE' : 'Disconnected'}
          </div>

          <button
            onClick={fetchTodayOrders}
            className="btn-press flex items-center gap-2 text-sm px-3 py-1.5 rounded-xl transition-all duration-200"
            style={{ color: '#4A6B69', backgroundColor: 'white', border: '1px solid #E0ECEA' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#E6F0EF'; e.currentTarget.style.color = '#103935'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = '#4A6B69'; }}
          >
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div
          className="px-4 py-3 rounded-xl mb-4 text-sm flex items-center gap-2"
          style={{ backgroundColor: '#FEE2E2', color: '#EF4444', border: '1px solid #FECACA' }}
        >
          {error}
          <button onClick={fetchTodayOrders} className="ml-auto underline font-semibold text-xs">
            Retry
          </button>
        </div>
      )}

      {/* Summary strip when orders exist */}
      {sortedOrders.length > 0 && (
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
            style={{ backgroundColor: '#FBF3E4', color: '#92400E' }}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#C9973A' }} />
            {activeOrders.filter(o => o.status === 'pending').length} Pending
          </div>
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
            style={{ backgroundColor: '#DBEAFE', color: '#1E40AF' }}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#3B82F6' }} />
            {activeOrders.filter(o => o.status === 'preparing').length} Preparing
          </div>
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
            style={{ backgroundColor: '#E6F0EF', color: '#103935' }}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#103935' }} />
            {completedOrders.length} Ready
          </div>
        </div>
      )}

      {/* Empty State */}
      {sortedOrders.length === 0 ? (
        <div
          className="text-center py-20 rounded-2xl"
          style={{ backgroundColor: 'white', border: '1px solid #E0ECEA', boxShadow: CARD_SHADOW }}
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ backgroundColor: '#E6F0EF' }}
          >
            <ChefHat size={38} style={{ color: '#103935', opacity: 0.6 }} />
          </div>
          <h3 className="font-bold text-lg mb-1" style={{ color: '#0A1F1E' }}>Kitchen is clear</h3>
          <p className="text-sm" style={{ color: '#4A6B69' }}>No orders yet today</p>
          <p className="text-xs mt-1 mb-6" style={{ color: '#8AADAA' }}>New orders will appear here instantly via real-time sync</p>
          <div className="flex items-center justify-center gap-2">
            {['Pending', 'Preparing', 'Ready'].map((label, i) => (
              <React.Fragment key={label}>
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: '#F7F9F8', color: '#8AADAA', border: '1px solid #E0ECEA' }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: i === 0 ? '#C9973A' : i === 1 ? '#3B82F6' : '#103935' }}
                  />
                  {label}
                </div>
                {i < 2 && <span style={{ color: '#D0E0DE', fontSize: '12px' }}>→</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Active Orders */}
          {activeOrders.length > 0 && (
            <div className="mb-8">
              <p
                className="font-semibold uppercase mb-4"
                style={{ color: '#4A6B69', fontSize: '11px', letterSpacing: '0.06em' }}
              >
                Active Orders · {activeOrders.length}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeOrders.map(order => {
                  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                  const badge = config.badge;
                  return (
                    <div
                      key={order._id}
                      className="card-enter overflow-hidden transition-all duration-200"
                      style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        border: '1px solid #E0ECEA',
                        boxShadow: CARD_SHADOW
                      }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(16,57,53,0.14)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = CARD_SHADOW; e.currentTarget.style.transform = ''; }}
                    >
                      {/* Colored top bar */}
                      <div style={{ height: '6px', backgroundColor: config.topBar }} />

                      <div className="p-5">
                        {/* Token + Badge */}
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p
                              className="font-semibold uppercase mb-0.5"
                              style={{ color: '#8AADAA', fontSize: '11px', letterSpacing: '0.06em' }}
                            >
                              Token
                            </p>
                            <h3
                              className="font-black leading-none"
                              style={{ color: '#0A1F1E', fontSize: '36px', letterSpacing: '-1px' }}
                            >
                              #{order.tokenNumber}
                            </h3>
                            <div className="flex items-center gap-1 mt-2" style={{ color: '#8AADAA' }}>
                              <Timer size={12} />
                              <span className="text-xs">{timeAgo(order.createdAt)}</span>
                            </div>
                          </div>
                          <span
                            className="text-xs px-2.5 py-1 rounded-full font-semibold mt-1"
                            style={{
                              backgroundColor: badge.bg,
                              color: badge.color,
                              border: `1px solid ${badge.border}`
                            }}
                          >
                            {config.label}
                          </span>
                        </div>

                        {/* Items */}
                        <div
                          className="space-y-2 mb-4 pt-3"
                          style={{ borderTop: '1px solid #F0F5F4' }}
                        >
                          {order.items.map((item, idx) => (
                            <div key={`${order._id}-${idx}`} className="flex justify-between items-center">
                              <span className="text-sm font-medium" style={{ color: '#0A1F1E' }}>{item.name}</span>
                              <span
                                className="text-xs font-bold px-2 py-0.5 rounded-lg"
                                style={{ backgroundColor: '#E6F0EF', color: '#103935' }}
                              >
                                ×{item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Action Button */}
                        {order.status === 'pending' && (
                          <button
                            onClick={() => updateStatus(order._id, 'preparing')}
                            className="btn-press w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 text-white"
                            style={{ backgroundColor: '#3B82F6', boxShadow: '0 2px 8px rgba(59,130,246,0.30)' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2563EB'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#3B82F6'}
                          >
                            Start Preparing
                          </button>
                        )}
                        {order.status === 'preparing' && (
                          <button
                            onClick={() => updateStatus(order._id, 'ready')}
                            className="btn-press w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 text-white"
                            style={{ backgroundColor: '#103935', boxShadow: '0 2px 8px rgba(16,57,53,0.25)' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0A2422'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#103935'}
                          >
                            Mark Ready ✓
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Completed Orders */}
          {completedOrders.length > 0 && (
            <div>
              <p
                className="font-semibold uppercase mb-4"
                style={{ color: '#8AADAA', fontSize: '11px', letterSpacing: '0.06em' }}
              >
                Completed · {completedOrders.length}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedOrders.map(order => (
                  <div
                    key={order._id}
                    className="overflow-hidden"
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '16px',
                      border: '1px solid #E0ECEA',
                      boxShadow: CARD_SHADOW,
                      opacity: 0.6
                    }}
                  >
                    <div style={{ height: '6px', backgroundColor: '#103935' }} />
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p
                            className="font-semibold uppercase mb-0.5"
                            style={{ color: '#B0C8C5', fontSize: '11px', letterSpacing: '0.06em' }}
                          >
                            Token
                          </p>
                          <h3
                            className="font-black leading-none"
                            style={{ color: '#8AADAA', fontSize: '32px', letterSpacing: '-1px' }}
                          >
                            #{order.tokenNumber}
                          </h3>
                        </div>
                        <span
                          className="text-xs px-2.5 py-1 rounded-full font-semibold mt-1"
                          style={{ backgroundColor: '#E6F0EF', color: '#103935', border: '1px solid rgba(16,57,53,0.20)' }}
                        >
                          Ready
                        </span>
                      </div>
                      <div
                        className="space-y-1.5 pt-3 mb-3"
                        style={{ borderTop: '1px solid #F0F5F4' }}
                      >
                        {order.items.map((item, idx) => (
                          <div key={`${order._id}-done-${idx}`} className="flex justify-between items-center text-sm">
                            <span style={{ color: '#8AADAA' }}>{item.name}</span>
                            <span className="text-xs" style={{ color: '#B0C8C5' }}>×{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                      <div
                        className="flex items-center justify-center gap-2 text-sm py-2 rounded-xl"
                        style={{ backgroundColor: '#E6F0EF', color: '#103935' }}
                      >
                        <CheckCircle2 size={14} />
                        <span className="font-semibold">Order Served</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default KitchenScreen;
