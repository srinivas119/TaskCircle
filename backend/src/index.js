import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import healthRoutes from './routes/health.js';
import errorHandler from './middleware/errorHandler.js';

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --------------- Routes ---------------
app.use('/api/health', healthRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'TaskCircle API',
    version: '1.0.0',
    docs: '/api/health',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use(errorHandler);

// --------------- Start Server ---------------
const server = app.listen(PORT, () => {
  console.log(`\n🚀 TaskCircle API Server`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Port:        ${PORT}`);
  console.log(`   Health:      http://localhost:${PORT}/api/health`);
  console.log(`   Started:     ${new Date().toISOString()}\n`);
});

// Graceful shutdown
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
