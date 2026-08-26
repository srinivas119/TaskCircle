import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import session from 'express-session';
import { createClient } from 'redis';
import { RedisStore } from 'connect-redis';

import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import groupsRoutes from './routes/group.js';
import taskRoutes from './routes/taskRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

import errorHandler from './middleware/errorHandler.js';

const app = express();
app.set('trust proxy', 1); // Trust the Render reverse proxy for secure cookies
const PORT = process.env.PORT || 5000;

// =====================================================
// REDIS SETUP
// =====================================================

let sessionStore;

if (process.env.REDIS_URL) {
  const redisClient = createClient({
    url: process.env.REDIS_URL
  });

  redisClient.on('error', (err) => console.log('Redis Client Error:', err.message));
  redisClient.connect()
    .then(() => console.log('✅ Redis connected successfully'))
    .catch(console.error);

  sessionStore = new RedisStore({ client: redisClient });
  console.log('📦 Session Store: Redis');
} else {
  console.warn('⚠️ No REDIS_URL provided. Falling back to MemoryStore (Not for production).');
  // sessionStore remains undefined, which makes express-session use its default MemoryStore
}

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Render health checks)
      if (!origin) return callback(null, true);
      const allowed = [
        process.env.FRONTEND_URL,
        'http://localhost:5173',
        'http://localhost:3000',
      ].filter(Boolean);
      if (allowed.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS: Origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

app.use(morgan('dev'));

app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'dev-session-cookie-signing-secret-key',
    resave: false,
    saveUninitialized: false,
    name: 'sid',
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================================================
// STATIC FILES
// =====================================================

app.use('/uploads', express.static('uploads'));

// =====================================================
// ROUTES
// =====================================================
app.get('/api/test-health', (req, res) => {
  res.json({
    success: true,
    message: 'API path works'
  });
});
app.get('/api/test-route', (req, res) => {
  res.json({
    success: true,
    message: 'API routing works',
    path: req.originalUrl
  });
});

app.use('/api/health', healthRoutes);

app.use('/api/auth', authRoutes);

app.use('/api/profile', profileRoutes);

app.use('/api/groups', groupsRoutes);

app.use('/api', notificationRoutes);

app.use('/api', taskRoutes);

// =====================================================
// ROOT ROUTE
// =====================================================

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'TaskCircle API',
    version: '1.0.0',
    docs: '/api/health',
  });
});

// =====================================================
// 404 HANDLER
// =====================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
  });
});

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use(errorHandler);

// =====================================================
// LOCAL SERVER
// =====================================================

// =====================================================
// SERVER
// =====================================================

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('\n🚀 TaskCircle API Server');
  console.log(
    `   Environment: ${process.env.NODE_ENV || 'development'}`
  );
  console.log(`   Port:        ${PORT}`);
  console.log(`   Frontend URL: ${process.env.FRONTEND_URL || '(not set)'}`);
  console.log(`   Redis URL set: ${!!process.env.REDIS_URL}`);
  console.log(
    `   Health:      http://localhost:${PORT}/api/health`
  );
  console.log(
    `   Started:     ${new Date().toISOString()}\n`
  );
});

// =====================================================
// GRACEFUL SHUTDOWN
// =====================================================

const gracefulShutdown = (signal) => {
  console.log(
    `\n${signal} received. Shutting down gracefully...`
  );

  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
