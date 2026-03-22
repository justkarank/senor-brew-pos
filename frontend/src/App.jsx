import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import BillingScreen from './pages/BillingScreen';
import KitchenScreen from './pages/KitchenScreen';
import MenuManagement from './pages/MenuManagement';
import InventoryAlerts from './pages/InventoryAlerts';
import SalesDashboard from './pages/SalesDashboard';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import { Menu } from 'lucide-react';

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#F7F9F8' }}>
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile top bar — only visible below lg breakpoint */}
        <div
          className="lg:hidden flex items-center px-4 h-14 shrink-0"
          style={{ backgroundColor: '#103935', borderBottom: '1px solid rgba(255,255,255,0.10)' }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors duration-200"
            style={{ backgroundColor: 'rgba(255,255,255,0.10)' }}
            aria-label="Open navigation menu"
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.18)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.10)'}
          >
            <Menu size={18} style={{ color: 'white' }} />
          </button>
          <div className="flex items-center gap-2.5 ml-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgba(201,151,58,0.25)', border: '1px solid rgba(201,151,58,0.35)' }}
            >
              <span className="text-xs font-black" style={{ color: '#C9973A' }}>SB</span>
            </div>
            <span className="font-bold text-white text-sm">Senor Brew Club</span>
          </div>
        </div>

        <main
          className="flex-1 overflow-y-auto"
          style={{ borderTop: '3px solid #103935' }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/billing"
          element={
            <ProtectedRoute roles={['admin', 'counter']}>
              <Layout><BillingScreen /></Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/kitchen"
          element={
            <ProtectedRoute roles={['admin', 'kitchen']}>
              <Layout><KitchenScreen /></Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/menu"
          element={
            <ProtectedRoute roles={['admin']}>
              <Layout><MenuManagement /></Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory"
          element={
            <ProtectedRoute roles={['admin']}>
              <Layout><InventoryAlerts /></Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={['admin']}>
              <Layout><SalesDashboard /></Layout>
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
