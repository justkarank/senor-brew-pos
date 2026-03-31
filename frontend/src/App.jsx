import React, { Suspense, lazy, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import { Menu } from 'lucide-react';

const BillingScreen = lazy(() => import('./pages/BillingScreen'));
const KitchenScreen = lazy(() => import('./pages/KitchenScreen'));
const MenuManagement = lazy(() => import('./pages/MenuManagement'));
const InventoryAlerts = lazy(() => import('./pages/InventoryAlerts'));
const SalesDashboard = lazy(() => import('./pages/SalesDashboard'));

function PageLoader({ label = 'Loading page...' }) {
  return (
    <div className="flex items-center justify-center h-full min-h-[240px]" style={{ backgroundColor: '#F7F9F8' }}>
      <div className="text-center">
        <div
          className="w-12 h-12 rounded-full animate-spin mx-auto mb-4"
          style={{ border: '3px solid #E6F0EF', borderTopColor: '#103935' }}
        />
        <p className="text-sm font-medium" style={{ color: '#4A6B69' }}>{label}</p>
      </div>
    </div>
  );
}

function withPageLoader(element, label) {
  return <Suspense fallback={<PageLoader label={label} />}>{element}</Suspense>;
}

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#F7F9F8' }}>
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
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
              <Layout>{withPageLoader(<BillingScreen />, 'Loading billing...')}</Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/kitchen"
          element={
            <ProtectedRoute roles={['admin', 'kitchen']}>
              <Layout>{withPageLoader(<KitchenScreen />, 'Loading kitchen...')}</Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/menu"
          element={
            <ProtectedRoute roles={['admin']}>
              <Layout>{withPageLoader(<MenuManagement />, 'Loading menu...')}</Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory"
          element={
            <ProtectedRoute roles={['admin']}>
              <Layout>{withPageLoader(<InventoryAlerts />, 'Loading inventory...')}</Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={['admin']}>
              <Layout>{withPageLoader(<SalesDashboard />, 'Loading dashboard...')}</Layout>
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
