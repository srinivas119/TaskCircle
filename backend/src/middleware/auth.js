import prisma from '../config/db.js';

/**
 * Middleware to require user authentication.
 * Extracts session from signed cookies, validates it against DB, and populates req.user.
 */
export const requireAuth = async (req, res, next) => {
  try {
    const sid = req.signedCookies?.sid;

    if (!sid) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. No session found.',
      });
    }

    // Find valid session
    const session = await prisma.session.findUnique({
      where: { sid },
      include: {
        user: {
          include: {
            accounts: {
              select: {
                provider: true,
              },
            },
          },
        },
      },
    });

    if (!session || !session.isValid) {
      // Clear invalid cookie
      res.clearCookie('sid');
      return res.status(401).json({
        success: false,
        error: 'Invalid session.',
      });
    }

    // Check expiration
    if (session.expiresAt < new Date()) {
      // Invalidate in DB and clear cookie
      await prisma.session.update({
        where: { id: session.id },
        data: { isValid: false },
      });
      res.clearCookie('sid');
      return res.status(401).json({
        success: false,
        error: 'Session has expired.',
      });
    }

    // Attach user and session to request
    req.user = session.user;
    req.session = session;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during authentication.',
    });
  }
};

/**
 * Optional authentication middleware.
 * Attaches req.user if session is valid, but does not block request if session is missing or invalid.
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const sid = req.signedCookies?.sid;

    if (sid) {
      const session = await prisma.session.findUnique({
        where: { sid },
        include: {
          user: {
            include: {
              accounts: {
                select: {
                  provider: true,
                },
              },
            },
          },
        },
      });

      if (session && session.isValid && session.expiresAt > new Date()) {
        req.user = session.user;
        req.session = session;
      }
    }
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next(); // Always proceed for optional auth
  }
};
