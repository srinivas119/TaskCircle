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

import {
  startNotificationScheduler,
} from './utils/notificationScheduler.js';

const app = express();
const PORT = process.env.PORT || 5000;

// --------------- Middleware ---------------

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

// Serve static profile image uploads
app.use('/uploads', express.static('uploads'));

// --------------- Routes ---------------

app.use('/api/health', healthRoutes);

app.use('/api/auth', authRoutes);

app.use('/api/profile', profileRoutes);

// IMPORTANT:
// Groups must be registered before generic /api routes.
// Otherwise /api/groups can be interpreted as a task ID.
app.use('/api/groups', groupsRoutes);

// Notifications
app.use('/api', notificationRoutes);

// Tasks
app.use('/api', taskRoutes);

// --------------- Root route ---------------

app.get('/', (req, res) => {
  res.json({
    message: 'TaskCircle API',
    version: '1.0.0',
    docs: '/api/health',
  });
});

// --------------- 404 Handler ---------------

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
  });
});

// --------------- Global Error Handler ---------------

app.use(errorHandler);

// --------------- Start Server ---------------

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

// --------------- Graceful Shutdown ---------------

const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;