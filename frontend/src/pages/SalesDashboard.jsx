import React, { useState, useEffect } from 'react';
import api from '../api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { TrendingUp, ClipboardList, Award, BarChart3, RefreshCw, BarChart2 } from 'lucide-react';

const STATUS_BADGE = {
  pending:   { bg: '#FBF3E4', color: '#92400E', border: 'rgba(245,158,11,0.3)' },
  preparing: { bg: '#DBEAFE', color: '#1E40AF', border: 'rgba(59,130,246,0.3)' },
  ready:     { bg: '#E6F0EF', color: '#103935', border: 'rgba(16,57,53,0.3)' }
};

const CARD_SHADOW = '0 2px 8px rgba(16,57,53,0.08)';
const CARD_STYLE = {
  backgroundColor: 'white',
  border: '1px solid #E0ECEA',
  borderRadius: '16px',
  boxShadow: CARD_SHADOW
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

function SalesDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/dashboard/stats');
      setStats(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr) =>
    new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ backgroundColor: '#F7F9F8' }}>
        <div className="text-center">
          <div
            className="w-12 h-12 rounded-full animate-spin mx-auto mb-4"
            style={{ border: '3px solid #E6F0EF', borderTopColor: '#103935' }}
          />
          <p className="text-sm font-medium" style={{ color: '#4A6B69' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div
          className="flex items-center gap-3 p-4 rounded-xl text-sm"
          style={{ backgroundColor: '#FEE2E2', color: '#EF4444', border: '1px solid #FECACA' }}
        >
          {error}
          <button onClick={fetchStats} className="underline font-semibold ml-auto">Retry</button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      label: "Today's Revenue",
      value: `₹${stats.totalRevenue.toFixed(2)}`,
      icon: TrendingUp,
      iconBg: '#E6F0EF',
      iconColor: '#103935',
      trend: 'Total billed today'
    },
    {
      label: 'Total Orders',
      value: stats.totalOrders,
      icon: ClipboardList,
      iconBg: '#DBEAFE',
      iconColor: '#3B82F6',
      trend: 'Orders placed today'
    },
    {
      label: 'Top Item',
      value: stats.mostSoldItem,
      icon: Award,
      iconBg: '#FBF3E4',
      iconColor: '#C9973A',
      trend: 'Most sold item'
    },
    {
      label: 'Avg Order Value',
      value: `₹${stats.avgOrderValue.toFixed(2)}`,
      icon: BarChart3,
      iconBg: '#F3E8FF',
      iconColor: '#8B5CF6',
      trend: 'Per order average'
    }
  ];

  const chartData = stats.hourlyData.filter((_, i) => i >= 6 && i <= 23);
  const hasChartData = chartData.some(d => d.orders > 0);
  const maxOrders = hasChartData ? Math.max(...chartData.map(d => d.orders)) : 0;

  return (
    <div className="page-enter p-6 min-h-full" style={{ backgroundColor: '#F7F9F8' }}>

      {/* Header */}
      <div className="flex justify-between items-start mb-6 flex-wrap gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#8AADAA', letterSpacing: '0.08em' }}>
            {getGreeting()}{user.name ? `, ${user.name.split(' ')[0]}` : ''}
          </p>
          <h2
            className="font-bold"
            style={{ color: '#0A1F1E', fontSize: '28px', letterSpacing: '-0.3px' }}
          >
            Sales Dashboard
          </h2>
          <p className="text-sm mt-1" style={{ color: '#4A6B69' }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="btn-press flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl transition-all duration-200"
          style={{ color: '#4A6B69', backgroundColor: 'white', border: '1px solid #E0ECEA', boxShadow: CARD_SHADOW }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#E6F0EF'; e.currentTarget.style.color = '#103935'; e.currentTarget.style.borderColor = '#103935'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = '#4A6B69'; e.currentTarget.style.borderColor = '#E0ECEA'; }}
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="p-5 transition-all duration-200"
              style={{ ...CARD_STYLE, minHeight: '130px' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(16,57,53,0.14)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = CARD_SHADOW; e.currentTarget.style.transform = ''; }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ backgroundColor: card.iconBg }}
              >
                <Icon size={19} style={{ color: card.iconColor }} strokeWidth={2} />
              </div>
              <p
                className="font-semibold uppercase"
                style={{ color: '#8AADAA', fontSize: '11px', letterSpacing: '0.05em' }}
              >
                {card.label}
              </p>
              <p
                className="font-black mt-1 truncate"
                title={String(card.value)}
                style={{ color: '#0A1F1E', fontSize: '28px', letterSpacing: '-0.5px', lineHeight: 1.1 }}
              >
                {card.value}
              </p>
              <p className="text-xs mt-1.5" style={{ color: '#8AADAA' }}>{card.trend}</p>
            </div>
          );
        })}
      </div>

      {/* Bar Chart */}
      <div className="p-6 mb-5" style={CARD_STYLE}>
        <div className="flex items-start justify-between mb-1 flex-wrap gap-2">
          <div>
            <h3 className="font-bold" style={{ color: '#0A1F1E', fontSize: '18px' }}>Hourly Sales Today</h3>
            <p className="text-xs mt-0.5" style={{ color: '#8AADAA' }}>Orders per hour · 6 AM – 11 PM</p>
          </div>
          {hasChartData && (
            <span
              className="text-xs px-3 py-1 rounded-full font-semibold"
              style={{ backgroundColor: '#E6F0EF', color: '#103935' }}
            >
              {stats.totalOrders} orders
            </span>
          )}
        </div>

        <div className="mt-5">
          {hasChartData ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0ECEA" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#8AADAA' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8AADAA' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #E0ECEA',
                    boxShadow: '0 4px 20px rgba(16,57,53,0.10)',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '13px',
                    padding: '10px 14px'
                  }}
                  labelStyle={{ fontWeight: '700', color: '#0A1F1E', marginBottom: '2px' }}
                  itemStyle={{ color: '#4A6B69', fontWeight: '500' }}
                  cursor={{ fill: 'rgba(16,57,53,0.04)' }}
                />
                <Bar dataKey="orders" radius={[6, 6, 0, 0]} name="Orders">
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.orders === maxOrders && maxOrders > 0 ? '#C9973A' : '#103935'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-56 flex flex-col justify-end gap-1 px-2 pt-6 relative">
              <div className="absolute inset-0 flex flex-col items-center justify-center pb-4">
                <BarChart2 size={44} style={{ color: '#E0ECEA' }} className="mb-3" />
                <p className="text-sm font-semibold" style={{ color: '#8AADAA' }}>No orders placed yet today</p>
                <p className="text-xs mt-1" style={{ color: '#B0C8C5' }}>Start billing to see hourly trends here</p>
              </div>
              <div className="flex items-end gap-2 h-40 opacity-25">
                {[30, 55, 45, 70, 38, 60, 50, 80, 65, 42, 72, 58, 35, 45, 68, 52, 40, 62].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-md"
                    style={{ height: `${h}%`, backgroundColor: '#E0ECEA' }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden" style={CARD_STYLE}>
        <div
          className="px-6 py-4 flex justify-between items-center"
          style={{ borderBottom: '1px solid #E0ECEA' }}
        >
          <h3 className="font-bold" style={{ color: '#0A1F1E', fontSize: '18px' }}>Today's Orders</h3>
          <span
            className="text-xs px-3 py-1.5 rounded-full font-semibold"
            style={{ backgroundColor: '#E6F0EF', color: '#103935' }}
          >
            {stats.orders.length} order{stats.orders.length !== 1 ? 's' : ''}
          </span>
        </div>

        {stats.orders.length === 0 ? (
          <div className="p-16 text-center">
            <ClipboardList size={44} className="mx-auto mb-3" style={{ color: '#E0ECEA' }} />
            <p className="text-sm font-semibold" style={{ color: '#8AADAA' }}>No orders today yet</p>
            <p className="text-xs mt-1" style={{ color: '#B0C8C5' }}>Start billing to see orders here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: '#F7F9F8', borderBottom: '1px solid #E0ECEA' }}>
                <tr>
                  {['Token', 'Items', 'Total', 'Status', 'Time'].map(h => (
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
                {stats.orders.map((order, idx) => {
                  const badge = STATUS_BADGE[order.status] || STATUS_BADGE.pending;
                  return (
                    <tr
                      key={order._id}
                      style={{
                        borderBottom: idx < stats.orders.length - 1 ? '1px solid #F0F5F4' : 'none',
                        height: '56px',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F7F9F8'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; }}
                    >
                      <td className="px-6 font-black text-base" style={{ color: '#0A1F1E' }}>
                        #{order.tokenNumber}
                      </td>
                      <td
                        className="px-6 text-sm"
                        style={{ color: '#4A6B69', maxWidth: '220px' }}
                      >
                        <span className="block truncate">
                          {order.items.map(i => `${i.name} ×${i.quantity}`).join(', ')}
                        </span>
                      </td>
                      <td className="px-6 font-bold text-sm" style={{ color: '#C9973A' }}>
                        ₹{order.total.toFixed(2)}
                      </td>
                      <td className="px-6">
                        <span
                          className="text-xs px-2.5 py-1 rounded-full font-semibold capitalize"
                          style={{
                            backgroundColor: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`
                          }}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 text-sm" style={{ color: '#8AADAA' }}>
                        {formatTime(order.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default SalesDashboard;
