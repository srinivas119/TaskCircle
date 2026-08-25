import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import groupsRoutes from './routes/group.js';
import taskRoutes from './routes/taskRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

import errorHandler from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 5000;

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(morgan('dev'));

app.use(
  cookieParser(
    process.env.SESSION_SECRET ||
      'dev-session-cookie-signing-secret-key'
  )
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

app.use('/api/health', healthRoutes);
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

if (process.env.VERCEL !== '1') {
  const server = app.listen(PORT, () => {
    console.log('\n🚀 TaskCircle API Server');
    console.log(
      `   Environment: ${process.env.NODE_ENV || 'development'}`
    );
    console.log(`   Port:        ${PORT}`);
    console.log(
      `   Health:      http://localhost:${PORT}/api/health`
    );
    console.log(
      `   Started:     ${new Date().toISOString()}\n`
    );
  });

  // ===================================================
  // GRACEFUL SHUTDOWN
  // ===================================================

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
}

// =====================================================
// EXPORT FOR VERCEL
// =====================================================

export default app;
