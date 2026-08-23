import { Router } from 'express';
import prisma from '../config/db.js';

const router = Router();

// GET /api/health — Basic health check
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
  });
});

// GET /api/health/db — Database connection check
router.get('/db', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
