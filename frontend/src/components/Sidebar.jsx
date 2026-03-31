import React, { useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, ChefHat, UtensilsCrossed, Package, LogOut, X } from 'lucide-react';
import { clearStoredSession, getStoredUser } from '../utils/session';

const navItems = [
  { path: '/dashboard', label: 'Sales Dashboard', icon: LayoutDashboard, roles: ['admin'] },
  { path: '/billing', label: 'Billing', icon: ShoppingCart, roles: ['admin', 'counter'] },
  { path: '/kitchen', label: 'Kitchen (KOT)', icon: ChefHat, roles: ['admin', 'kitchen'] },
  { path: '/menu', label: 'Menu Management', icon: UtensilsCrossed, roles: ['admin'] },
  { path: '/inventory', label: 'Inventory Alerts', icon: Package, roles: ['admin'] }
];

function Sidebar({ isOpen, setIsOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredUser() || {};

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname, setIsOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') setIsOpen(false); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, setIsOpen]);

  const handleLogout = () => {
    clearStoredSession();
    navigate('/login');
  };

  const visibleItems = navItems.filter(item => item.roles.includes(user.role));

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const sidebarContent = (
    <div
      className="w-60 flex flex-col h-full"
      style={{
        backgroundColor: '#103935',
        borderRight: '1px solid rgba(255,255,255,0.08)'
      }}
    >
      <div className="px-5 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.10)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'rgba(201,151,58,0.22)', border: '1px solid rgba(201,151,58,0.30)' }}
          >
            <span className="text-xs font-black tracking-tight leading-none" style={{ color: '#C9973A' }}>SB</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">Senor Brew Club</h1>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.40)' }}>POS System</p>
          </div>
        </div>
        <button
          className="lg:hidden w-7 h-7 flex items-center justify-center rounded-lg transition-colors duration-200"
          style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
          onClick={() => setIsOpen(false)}
          aria-label="Close menu"
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}
        >
          <X size={14} style={{ color: 'rgba(255,255,255,0.7)' }} />
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {visibleItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={() =>
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium relative'
              }
              style={({ isActive }) => isActive
                ? {
                    backgroundColor: 'white',
                    color: '#103935',
                    fontWeight: '600',
                    boxShadow: '0 2px 8px rgba(16,57,53,0.18)'
                  }
                : {
                    color: 'rgba(255,255,255,0.70)'
                  }
              }
              onMouseEnter={(e) => {
                if (e.currentTarget.style.backgroundColor !== 'white') {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.10)';
                  e.currentTarget.style.color = 'white';
                }
              }}
              onMouseLeave={(e) => {
                if (e.currentTarget.style.backgroundColor === 'rgba(255, 255, 255, 0.1)') {
                  e.currentTarget.style.backgroundColor = '';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.70)';
                }
              }}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                      style={{ backgroundColor: '#C9973A' }}
                    />
                  )}
                  <Icon
                    size={17}
                    strokeWidth={isActive ? 2.5 : 2}
                    style={{ color: isActive ? '#103935' : 'inherit', flexShrink: 0 }}
                  />
                  <span className="truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="mx-3" style={{ borderTop: '1px solid rgba(255,255,255,0.10)' }} />

      <div className="p-3 space-y-2">
        <div className="flex items-center gap-3 px-2 py-2">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'rgba(201,151,58,0.20)' }}
          >
            <span className="text-xs font-bold" style={{ color: '#C9973A' }}>{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate leading-tight">{user.name || 'User'}</p>
            <span
              className="inline-block text-xs px-2 py-0.5 rounded-full font-medium capitalize mt-0.5"
              style={{ backgroundColor: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.80)' }}
            >
              {user.role}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="btn-press w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-200"
          style={{ color: 'rgba(255,255,255,0.50)' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#EF4444'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = 'rgba(255,255,255,0.50)'; }}
        >
          <LogOut size={14} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden lg:flex lg:shrink-0">
        {sidebarContent}
      </div>

      <div
        className={`lg:hidden fixed inset-0 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-50 flex transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
}

export default Sidebar;
