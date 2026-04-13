const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const { ensureDemoData } = require('./services/demoDataService');

const app = express();
const server = http.createServer(app);
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]?.trim());
const PORT = process.env.PORT || 5000;
const MONGO_RETRY_DELAY_MS = Number(process.env.MONGO_RETRY_DELAY_MS || 15000);
const enableDemoBootstrap = process.env.ENABLE_DEMO_BOOTSTRAP !== 'false';
const DB_STATE_LABELS = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting'
};

let mongoConnectPromise = null;
let mongoReconnectTimer = null;
let shuttingDown = false;
let serverStarted = false;

const localOriginHosts = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const normalizeOrigin = (origin) => {
  try {
    return new URL(origin).origin;
  } catch {
    return origin.trim().replace(/\/+$/, '');
  }
};

const parseOriginRule = (value) => {
  const trimmedValue = value.trim().replace(/\/+$/, '');
  if (!trimmedValue) {
    return null;
  }

  const wildcardMatch = trimmedValue.match(/^(https?):\/\/\*\.(.+)$/i);

  if (wildcardMatch) {
    return {
      type: 'wildcard',
      protocol: `${wildcardMatch[1].toLowerCase()}:`,
      hostnameSuffix: `.${wildcardMatch[2].toLowerCase()}`
    };
  }

  return {
    type: 'exact',
    origin: normalizeOrigin(trimmedValue)
  };
};

const configuredOriginRules = (process.env.CLIENT_URLS || process.env.CLIENT_URL || '')
  .split(',')
  .map(origin => parseOriginRule(origin))
  .filter(Boolean);
const allowVercelPreviews = process.env.ALLOW_VERCEL_PREVIEWS !== 'false';
const allowAllHttpsOrigins = configuredOriginRules.length === 0;

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('Create backend/.env from backend/.env.example and restart the server.');
  process.exit(1);
}

mongoose.set('bufferCommands', false);

if (allowAllHttpsOrigins) {
  console.warn('CLIENT_URLS is not configured. Allowing any HTTPS frontend origin until explicit origins are provided.');
}

const isLocalOrigin = (origin) => {
  try {
    const { protocol, hostname } = new URL(origin);
    return (protocol === 'http:' || protocol === 'https:') && localOriginHosts.has(hostname);
  } catch {
    return false;
  }
};

const matchesConfiguredOrigin = (origin) => configuredOriginRules.some((rule) => {
  if (rule.type === 'exact') {
    return rule.origin === origin;
  }

  try {
    const { protocol, hostname } = new URL(origin);
    return protocol === rule.protocol && hostname.toLowerCase().endsWith(rule.hostnameSuffix);
  } catch {
    return false;
  }
});

const isHttpsOrigin = (origin) => {
  try {
    return new URL(origin).protocol === 'https:';
  } catch {
    return false;
  }
};

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  const normalizedOrigin = normalizeOrigin(origin);
  if (isLocalOrigin(normalizedOrigin)) return true;
  if (matchesConfiguredOrigin(normalizedOrigin)) return true;
  if (allowVercelPreviews && /^https:\/\/.+\.vercel\.app$/.test(normalizedOrigin)) return true;
  if (allowAllHttpsOrigins && isHttpsOrigin(normalizedOrigin)) return true;
  return false;
};

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control']
};

const io = new Server(server, { cors: corsOptions });
const getDatabaseStatus = () => DB_STATE_LABELS[mongoose.connection.readyState] || 'unknown';
const getDatabaseUnavailableMessage = () =>
  'Database unavailable. The backend is running but cannot reach MongoDB Atlas right now. Check Atlas Network Access and MONGO_URI, then retry.';

const logMongoConnectionHint = (err) => {
  if (/whitelist|network access/i.test(err.message)) {
    console.error('MongoDB Atlas is rejecting this connection. Add your current IP or 0.0.0.0/0 in Atlas Network Access.');
  }
  console.error('Check your MONGO_URI in backend/.env or Render env vars and verify Atlas Network Access settings.');
};

const scheduleMongoReconnect = () => {
  if (shuttingDown || mongoReconnectTimer || mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return;
  }

  console.warn(`Retrying MongoDB connection in ${Math.round(MONGO_RETRY_DELAY_MS / 1000)}s...`);
  mongoReconnectTimer = setTimeout(() => {
    mongoReconnectTimer = null;
    connectToMongo().catch(() => {});
  }, MONGO_RETRY_DELAY_MS);
  mongoReconnectTimer.unref?.();
};

async function connectToMongo() {
  if (shuttingDown) {
    return null;
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (mongoConnectPromise) {
    return mongoConnectPromise;
  }

  mongoConnectPromise = mongoose
    .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 })
    .then(async () => {
      console.log('Connected to MongoDB Atlas');

      if (enableDemoBootstrap) {
        try {
          await ensureDemoData({ log: console.log });
        } catch (seedError) {
          console.error('Demo bootstrap failed:', seedError.message);
        }
      }

      return mongoose.connection;
    })
    .catch((err) => {
      console.error('MongoDB connection failed:', err.message);
      logMongoConnectionHint(err);
      scheduleMongoReconnect();
      throw err;
    })
    .finally(() => {
      mongoConnectPromise = null;
    });

  return mongoConnectPromise;
}

const requireDatabaseConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: getDatabaseUnavailableMessage() });
  }

  return next();
};

mongoose.connection.on('disconnected', () => {
  if (shuttingDown) {
    return;
  }

  console.warn('MongoDB disconnected.');
  scheduleMongoReconnect();
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected.');
});

mongoose.connection.on('error', (err) => {
  if (!shuttingDown) {
    console.error('MongoDB connection error:', err.message);
  }
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Basic request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

// Make io accessible to route handlers
app.set('io', io);

// Health check
app.get('/api/health', (req, res) => res.json({
  status: getDatabaseStatus() === 'connected' ? 'ok' : 'degraded',
  database: getDatabaseStatus(),
  message: getDatabaseStatus() === 'connected'
    ? 'MongoDB Atlas connection is healthy.'
    : getDatabaseUnavailableMessage(),
  timestamp: new Date().toISOString()
}));

// Routes
app.use('/api/auth', requireDatabaseConnection, require('./routes/auth'));
app.use('/api/menu', requireDatabaseConnection, require('./routes/menu'));
app.use('/api/orders', requireDatabaseConnection, require('./routes/orders'));
app.use('/api/dashboard', requireDatabaseConnection, require('./routes/dashboard'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.url} not found` });
});

// Global error handling middleware (must be last)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Graceful shutdown
const shutdown = () => {
  shuttingDown = true;
  if (mongoReconnectTimer) {
    clearTimeout(mongoReconnectTimer);
    mongoReconnectTimer = null;
  }

  console.log('\nShutting down gracefully...');

  const closeResources = () => {
    mongoose.connection.close().then(() => {
      console.log('Server and DB connection closed');
      process.exit(0);
    }).catch(() => process.exit(1));
  };

  if (serverStarted) {
    server.close(closeResources);
  } else {
    closeResources();
  }

  // Force exit after 10s if graceful shutdown hangs
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

server.listen(PORT, () => {
  serverStarted = true;
  console.log(`Server running on http://localhost:${PORT}`);
  connectToMongo().catch(() => {});
});
