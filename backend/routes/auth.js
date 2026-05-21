const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { getBooleanEnv } = require('../utils/env');
const { getConfiguredDemoPassword } = require('../services/demoDataService');

const DEMO_ROLES = new Set(['admin', 'counter', 'kitchen']);
const AUTH_RATE_LIMIT_WINDOW_MS = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const AUTH_RATE_LIMIT_MAX = Number(process.env.AUTH_RATE_LIMIT_MAX || 25);
const authAttempts = new Map();

const isDemoAccessEnabled = () => getBooleanEnv('DEMO_ACCESS_ENABLED', false);
const isDemoPasswordLoginEnabled = () => getBooleanEnv('DEMO_PASSWORD_LOGIN_ENABLED', false);
const isDemoWriteAllowed = () => getBooleanEnv('DEMO_WRITE_ACCESS', false);
const canUseDemoPasswordLogin = (role) =>
  isDemoPasswordLoginEnabled() && Boolean(getConfiguredDemoPassword(role));

const getClientKey = (req) => {
  const identifier = String(req.body?.email || req.body?.role || 'auth').trim().toLowerCase();
  return `${req.ip || req.socket?.remoteAddress || 'unknown'}:${identifier}`;
};

const rateLimitAuth = (req, res, next) => {
  const now = Date.now();
  const key = getClientKey(req);
  const attempt = authAttempts.get(key);

  if (!attempt || attempt.expiresAt <= now) {
    authAttempts.set(key, { count: 1, expiresAt: now + AUTH_RATE_LIMIT_WINDOW_MS });
    return next();
  }

  if (attempt.count >= AUTH_RATE_LIMIT_MAX) {
    return res.status(429).json({ message: 'Too many login attempts. Please wait a few minutes and try again.' });
  }

  attempt.count += 1;
  authAttempts.set(key, attempt);
  return next();
};

const clearAuthAttempts = (req) => {
  authAttempts.delete(getClientKey(req));
};

const buildUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isDemo: Boolean(user.demoKey),
  canWrite: !user.demoKey || isDemoWriteAllowed()
});

const createToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      role: user.role,
      name: user.name,
      email: user.email,
      isDemo: Boolean(user.demoKey)
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

// POST /api/auth/login
router.post('/login', rateLimitAuth, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      // Return 401 so we do not reveal whether the email exists.
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.demoKey && !canUseDemoPasswordLogin(user.role)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    clearAuthAttempts(req);

    res.json({
      token: createToken(user),
      user: buildUserResponse(user)
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/demo
router.post('/demo', rateLimitAuth, async (req, res) => {
  try {
    if (!isDemoAccessEnabled()) {
      return res.status(403).json({ message: 'Demo access is not enabled on this deployment.' });
    }

    const role = String(req.body?.role || '').trim().toLowerCase();
    if (!DEMO_ROLES.has(role)) {
      return res.status(400).json({ message: 'Invalid demo role.' });
    }

    const user = await User.findOne({ demoKey: `demo-${role}`, role }).select('_id name email role demoKey');
    if (!user) {
      return res.status(404).json({ message: 'Demo user is not available. Enable demo bootstrap and reseed.' });
    }

    clearAuthAttempts(req);

    res.json({
      token: createToken(user),
      user: buildUserResponse(user)
    });
  } catch (err) {
    console.error('Demo login error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
