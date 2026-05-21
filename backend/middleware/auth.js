const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getBooleanEnv } = require('../utils/env');

const isDemoWriteAllowed = () => getBooleanEnv('DEMO_WRITE_ACCESS', false);

const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required. Please log in again.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('_id name email role demoKey');

    if (!user) {
      return res.status(401).json({ message: 'Authentication failed. User no longer exists.' });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isDemo: Boolean(user.demoKey),
      canWrite: !user.demoKey || isDemoWriteAllowed()
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const allowRoles = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required. Please log in again.' });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'You do not have permission to perform this action.' });
  }

  next();
};

const requireWriteAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required. Please log in again.' });
  }

  if (req.user.isDemo && !isDemoWriteAllowed()) {
    return res.status(403).json({
      message: 'Demo access is read-only. Sign in with a private staff account to make changes.'
    });
  }

  next();
};

module.exports = {
  requireAuth,
  allowRoles,
  requireWriteAccess
};
