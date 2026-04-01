import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getApiErrorMessage } from '../api';
import { Mail, Lock, Activity, LineChart, Wallet } from 'lucide-react';
import { API_URL, IS_LOCAL_HOST, NEEDS_REMOTE_API_CONFIGURATION } from '../config';
import {
  getBackendConnectionMessage,
  getMissingApiConfigurationMessage,
  isRecoverableNetworkError,
  warmUpBackend
} from '../utils/backendConnection';
import { getDefaultRouteForRole, getStoredToken, getStoredUser } from '../utils/session';

const LOGIN_TIMEOUT_MS = 30000;
const BACKEND_STATUS_STYLES = {
  checking: {
    bg: '#FFFBEB',
    border: '#FDE68A',
    accent: '#C9973A',
    label: 'Checking backend connection...'
  },
  waking: {
    bg: '#EFF6FF',
    border: '#BFDBFE',
    accent: '#2563EB',
    label: 'Waking up backend on Render free tier...'
  },
  ready: {
    bg: '#ECFDF5',
    border: '#A7F3D0',
    accent: '#10B981',
    label: 'Backend connected'
  },
  error: {
    bg: '#FEF2F2',
    border: '#FECACA',
    accent: '#EF4444',
    label: 'Backend connection issue'
  }
};

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [backendState, setBackendState] = useState({ status: 'checking', message: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const token = getStoredToken();
    const user = getStoredUser();
    if (token && user) {
      navigate(getDefaultRouteForRole(user.role));
    }
  }, [navigate]);

  useEffect(() => {
    let active = true;

    const primeBackend = async () => {
      if (NEEDS_REMOTE_API_CONFIGURATION) {
        if (active) {
          setBackendState({
            status: 'error',
            message: getMissingApiConfigurationMessage()
          });
        }
        return;
      }

      if (active) {
        setBackendState({
          status: 'checking',
          message: IS_LOCAL_HOST
            ? 'Checking local backend connection.'
            : 'Checking Render backend status before you sign in.'
        });
      }

      try {
        await warmUpBackend({ timeout: IS_LOCAL_HOST ? 8000 : 45000 });
        if (active) {
          setBackendState({
            status: 'ready',
            message: `${API_URL || 'Current origin'} responded successfully.`
          });
        }
      } catch (err) {
        if (active) {
          setBackendState({
            status: 'error',
            message: getBackendConnectionMessage(
              err,
              'Unable to confirm the backend connection right now.'
            )
          });
        }
      }
    };

    primeBackend();

    return () => {
      active = false;
    };
  }, []);

  const saveSessionAndNavigate = (res) => {
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    navigate(getDefaultRouteForRole(res.data.user.role));
  };

  const submitLogin = (credentials) =>
    api.post('/api/auth/login', credentials, { timeout: LOGIN_TIMEOUT_MS });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (NEEDS_REMOTE_API_CONFIGURATION) {
        const configError = new Error(getMissingApiConfigurationMessage());
        configError.code = 'MISSING_API_CONFIGURATION';
        throw configError;
      }

      if (backendState.status !== 'ready') {
        setBackendState({
          status: 'waking',
          message: IS_LOCAL_HOST
            ? 'Connecting to the local backend before logging in.'
            : 'Waking up the Render backend. The first request can take up to a minute on the free plan.'
        });

        await warmUpBackend();
        setBackendState({
          status: 'ready',
          message: 'Backend is awake and ready for login.'
        });
      }

      const res = await submitLogin({ email, password });
      saveSessionAndNavigate(res);
    } catch (err) {
      if (isRecoverableNetworkError(err)) {
        try {
          setBackendState({
            status: 'waking',
            message: 'Retrying after a backend warm-up check.'
          });

          await warmUpBackend();
          const retryRes = await submitLogin({ email, password });
          setBackendState({
            status: 'ready',
            message: 'Backend recovered successfully.'
          });
          saveSessionAndNavigate(retryRes);
          return;
        } catch (retryErr) {
          setBackendState({
            status: 'error',
            message: getBackendConnectionMessage(
              retryErr,
              'The backend is still unreachable after retrying.'
            )
          });
          setError(
            getApiErrorMessage(
              retryErr,
              'Login failed because the backend could not be reached.'
            )
          );
          return;
        }
      }

      setBackendState(current =>
        current.status === 'ready'
          ? current
          : {
              status: 'error',
              message: getBackendConnectionMessage(
                err,
                'The backend connection could not be confirmed.'
              )
            }
      );
      setError(getApiErrorMessage(err, 'Login failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    const creds = {
      admin: { email: 'admin@senorbrew.com', password: 'admin123' },
      counter: { email: 'counter@senorbrew.com', password: 'counter123' },
      kitchen: { email: 'kitchen@senorbrew.com', password: 'kitchen123' }
    };
    setEmail(creds[role].email);
    setPassword(creds[role].password);
    setError('');
  };

  const statusStyle = BACKEND_STATUS_STYLES[backendState.status] || BACKEND_STATUS_STYLES.checking;

  return (
    <div className="min-h-screen flex">
      <div
        className="hidden lg:flex lg:w-[58%] flex-col justify-center p-16 relative overflow-hidden"
        style={{ backgroundColor: '#103935' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'repeating-linear-gradient(135deg, rgba(10,36,34,0.22) 0px, rgba(10,36,34,0.22) 1px, transparent 1px, transparent 32px)'
          }}
        />

        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="float-anim absolute"
            style={{
              top: '12%', right: '10%',
              width: '100px', height: '100px',
              borderRadius: '50%',
              border: '2px solid rgba(201,151,58,0.20)',
              background: 'rgba(201,151,58,0.05)'
            }}
          />
          <div
            className="float-anim-2 absolute"
            style={{
              top: '55%', right: '6%',
              width: '60px', height: '60px',
              borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.07)',
              background: 'rgba(255,255,255,0.03)'
            }}
          />
          <div
            className="float-anim-3 absolute"
            style={{
              top: '28%', right: '4%',
              width: '28px', height: '28px',
              borderRadius: '50%',
              background: 'rgba(201,151,58,0.12)'
            }}
          />
          <div
            className="float-anim absolute"
            style={{
              bottom: '22%', left: '6%',
              width: '56px', height: '56px',
              borderRadius: '12px',
              border: '2px solid rgba(201,151,58,0.12)',
              transform: 'rotate(20deg)'
            }}
          />
          <div
            className="float-anim-2 absolute"
            style={{
              top: '42%', left: '2%',
              width: '16px', height: '16px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)'
            }}
          />
        </div>

        <div className="absolute inset-0 flex items-end justify-start pointer-events-none overflow-hidden">
          <span
            className="font-black leading-none select-none"
            style={{
              fontSize: '200px',
              color: 'rgba(255,255,255,0.025)',
              letterSpacing: '-4px',
              lineHeight: 1,
              whiteSpace: 'nowrap'
            }}
          >
            BREW
          </span>
        </div>

        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-3 mb-12">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(201,151,58,0.22)', border: '1px solid rgba(201,151,58,0.35)' }}
            >
              <span className="text-sm font-black tracking-tight leading-none" style={{ color: '#C9973A' }}>SB</span>
            </div>
            <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.50)', fontSize: '14px' }}>Senor Brew Club</span>
          </div>

          <p
            className="font-semibold uppercase mb-3"
            style={{ color: '#C9973A', fontSize: '12px', letterSpacing: '0.12em' }}
          >
            Welcome to
          </p>
          <h1
            className="font-black text-white leading-none mb-4"
            style={{ fontSize: '58px', letterSpacing: '-1.5px' }}
          >
            Senor
            <br />
            Brew Club
          </h1>
          <p className="font-medium mb-12" style={{ color: 'rgba(255,255,255,0.45)', fontSize: '18px' }}>
            POS &amp; Management System
          </p>

          <div
            className="mb-8"
            style={{ width: '48px', height: '2px', backgroundColor: '#C9973A', borderRadius: '2px' }}
          />

          <div className="flex flex-col gap-5">
            {[
              { icon: Activity, label: 'Real-time Orders', desc: 'Live kitchen updates via Socket.io' },
              { icon: Wallet, label: 'Smart Billing', desc: 'Auto GST, discounts & token system' },
              { icon: LineChart, label: 'Sales Analytics', desc: 'Hourly charts and daily insights' }
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-4">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: 'rgba(201,151,58,0.15)', border: '1px solid rgba(201,151,58,0.20)' }}
                >
                  <Icon size={15} style={{ color: '#C9973A' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white leading-tight">{label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        className="flex-1 flex items-center justify-center p-6 sm:p-8"
        style={{ backgroundColor: 'white' }}
      >
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-8">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ backgroundColor: '#E6F0EF', border: '1px solid rgba(16,57,53,0.15)' }}
            >
              <span className="text-base font-black tracking-tight leading-none" style={{ color: '#103935' }}>SB</span>
            </div>
            <h1 className="text-xl font-bold" style={{ color: '#0A1F1E' }}>Senor Brew Club</h1>
          </div>

          <h2
            className="font-bold mb-1"
            style={{ color: '#0A1F1E', fontSize: '26px', letterSpacing: '-0.3px' }}
          >
            Sign in to continue
          </h2>
          <p className="text-sm mb-8" style={{ color: '#4A6B69' }}>Enter your credentials to access the system</p>

          <div
            className="rounded-2xl px-4 py-3 mb-5"
            style={{ backgroundColor: statusStyle.bg, border: `1px solid ${statusStyle.border}` }}
          >
            <div className="flex items-start gap-3">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 mt-1"
                style={{ backgroundColor: statusStyle.accent }}
              />
              <div>
                <p className="text-sm font-semibold" style={{ color: '#0A1F1E' }}>
                  {statusStyle.label}
                </p>
                <p className="text-xs mt-1" style={{ color: '#4A6B69' }}>
                  {backendState.message}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                className="block font-medium mb-1.5"
                style={{ color: '#0A1F1E', fontSize: '14px' }}
              >
                Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#8AADAA' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 h-12 border rounded-xl text-sm transition-all duration-200 outline-none"
                  style={{ borderColor: '#E0ECEA', color: '#0A1F1E', fontFamily: 'inherit' }}
                  onFocus={e => { e.target.style.borderColor = '#103935'; e.target.style.boxShadow = '0 0 0 3px rgba(16,57,53,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = '#E0ECEA'; e.target.style.boxShadow = 'none'; }}
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label
                className="block font-medium mb-1.5"
                style={{ color: '#0A1F1E', fontSize: '14px' }}
              >
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#8AADAA' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 h-12 border rounded-xl text-sm transition-all duration-200 outline-none"
                  style={{ borderColor: '#E0ECEA', color: '#0A1F1E', fontFamily: 'inherit' }}
                  onFocus={e => { e.target.style.borderColor = '#103935'; e.target.style.boxShadow = '0 0 0 3px rgba(16,57,53,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = '#E0ECEA'; e.target.style.boxShadow = 'none'; }}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                style={{ backgroundColor: '#FEE2E2', color: '#EF4444', border: '1px solid #FECACA' }}
              >
                <span className="w-1 h-4 rounded-full shrink-0" style={{ backgroundColor: '#EF4444' }} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-press w-full h-12 rounded-xl font-bold text-sm text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              style={{
                backgroundColor: '#103935',
                boxShadow: loading ? 'none' : '0 4px 14px rgba(16,57,53,0.30)'
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#0A2422'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#103935'; }}
            >
              {loading ? 'Signing in...' : 'Sign In ->'}
            </button>
          </form>

          <div className="mt-6 pt-5" style={{ borderTop: '1px solid #F0F5F4' }}>
            <p
              className="font-semibold uppercase text-center mb-3"
              style={{ color: '#8AADAA', fontSize: '11px', letterSpacing: '0.08em' }}
            >
              Quick Demo Access
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { role: 'admin', label: 'Admin', color: '#103935' },
                { role: 'counter', label: 'Counter', color: '#1E40AF' },
                { role: 'kitchen', label: 'Kitchen', color: '#5B21B6' }
              ].map(({ role, label, color }) => (
                <button
                  key={role}
                  onClick={() => fillDemo(role)}
                  className="btn-press flex-1 text-xs py-2.5 px-2 rounded-xl font-semibold transition-all duration-200 border"
                  style={{ borderColor: color, color: color, backgroundColor: 'white' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = `${color}12`; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; }}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-center mt-3" style={{ color: '#B0C8C5' }}>
              Tap a role to prefill credentials
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
