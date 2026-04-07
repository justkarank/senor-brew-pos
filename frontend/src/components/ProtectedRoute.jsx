import React, { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  getDefaultRouteForRole,
  clearStoredSession,
  getStoredSession
} from '../utils/session';
import {
  getSessionValidationErrorMessage,
  validateStoredSession
} from '../utils/authSession';

function SessionStatusCard({ title, message, actions }) {
  return (
    <div className="flex items-center justify-center min-h-[240px] p-6" style={{ backgroundColor: '#F7F9F8' }}>
      <div
        className="w-full max-w-md rounded-2xl p-6 text-center"
        style={{ backgroundColor: 'white', border: '1px solid #E0ECEA', boxShadow: '0 8px 24px rgba(16,57,53,0.10)' }}
      >
        <div
          className="w-12 h-12 rounded-full animate-spin mx-auto mb-4"
          style={{ border: '3px solid #E6F0EF', borderTopColor: '#103935', animationPlayState: actions ? 'paused' : 'running' }}
        />
        <p className="text-base font-bold" style={{ color: '#0A1F1E' }}>{title}</p>
        <p className="text-sm mt-2" style={{ color: '#4A6B69' }}>{message}</p>

        {actions && (
          <div className="flex gap-3 justify-center mt-5 flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

function ProtectedRoute({ children, roles }) {
  const storedSession = useMemo(() => getStoredSession(), []);
  const [retryCount, setRetryCount] = useState(0);
  const [state, setState] = useState(() => ({
    status: storedSession ? 'checking' : 'unauthorized',
    user: storedSession?.user || null,
    error: ''
  }));

  useEffect(() => {
    let active = true;

    const verifySession = async () => {
      if (!storedSession) {
        return;
      }

      try {
        const result = await validateStoredSession({ force: retryCount > 0 });

        if (!active) {
          return;
        }

        if (!result.valid) {
          setState({
            status: 'unauthorized',
            user: null,
            error: ''
          });
          return;
        }

        setState({
          status: 'ready',
          user: result.user,
          error: ''
        });
      } catch (error) {
        if (!active) {
          return;
        }

        setState({
          status: 'error',
          user: storedSession.user,
          error: getSessionValidationErrorMessage(error)
        });
      }
    };

    verifySession();

    return () => {
      active = false;
    };
  }, [retryCount, storedSession]);

  if (!storedSession || state.status === 'unauthorized') {
    return <Navigate to="/login" replace />;
  }

  const user = state.user || storedSession.user;

  if (state.status === 'checking') {
    return (
      <SessionStatusCard
        title="Validating your session"
        message="Checking your saved login before opening the page."
      />
    );
  }

  if (state.status === 'error') {
    return (
      <SessionStatusCard
        title="Session check needs attention"
        message={state.error}
        actions={[
          <button
            key="retry"
            type="button"
            onClick={() => {
              setState(current => ({ ...current, status: 'checking', error: '' }));
              setRetryCount(count => count + 1);
            }}
            className="btn-press px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: '#103935' }}
          >
            Retry
          </button>,
          <button
            key="login"
            type="button"
            onClick={() => {
              clearStoredSession();
              setState({ status: 'unauthorized', user: null, error: '' });
            }}
            className="btn-press px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ backgroundColor: 'white', border: '1px solid #E0ECEA', color: '#4A6B69' }}
          >
            Sign in again
          </button>
        ]}
      />
    );
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={getDefaultRouteForRole(user.role)} replace />;
  }

  return children;
}

export default ProtectedRoute;
