import prisma from '../config/db.js';

/**
 * Middleware to require user authentication.
 * Extracts session using express-session and populates req.user.
 */
export const requireAuth = async (req, res, next) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. No session found.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      include: {
        accounts: {
          select: {
            provider: true,
          },
        },
      },
    });

    if (!user) {
      req.session.destroy();
      return res.status(401).json({
        success: false,
        error: 'Invalid session. User not found.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ success: false, error: 'Server error during authentication.' });
  }
};

/**
 * Optional authentication middleware.
 * Attaches req.user if session is valid, but does not block request if session is missing or invalid.
 */
export const optionalAuth = async (req, res, next) => {
  try {
    if (req.session && req.session.userId) {
      const user = await prisma.user.findUnique({
        where: { id: req.session.userId },
        include: {
          accounts: {
            select: {
              provider: true,
            },
          },
        },
      });

      if (user) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next(); // Always proceed for optional auth
  }
};
