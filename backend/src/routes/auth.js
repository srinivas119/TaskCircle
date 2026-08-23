import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import prisma from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import { verifyGoogleToken } from '../utils/google.js';
import {
  generateOTP,
  hashValue,
  compareHash,
  generateSessionToken,
} from '../utils/crypto.js';

const router = Router();

// Rate limiter for OTP requests (max 5 requests per 15 minutes per IP)
const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: 'Too many OTP requests from this IP. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Helper: Create a session and set signed cookie
const createAuthSession = async (req, res, userId) => {
  const sid = generateSessionToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Save session to database
  await prisma.session.create({
    data: {
      sid,
      userId,
      expiresAt,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.connection.remoteAddress,
    },
  });

  // Set secure signed cookie
  res.cookie('sid', sid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    signed: true,
    expires: expiresAt,
  });
};

/**
 * POST /api/auth/google
 * Google Sign-in and Sign-up (ID Token flow)
 */
router.post('/google', async (req, res, next) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        error: 'Google credential (ID Token) is required.',
      });
    }

    // Verify Google ID token
    const googleUser = await verifyGoogleToken(credential);

    // Check if AuthAccount for GOOGLE and sub exists
    let account = await prisma.authAccount.findUnique({
      where: {
        provider_providerId: {
          provider: 'GOOGLE',
          providerId: googleUser.sub,
        },
      },
      include: { user: true },
    });

    let userId;

    if (account) {
      // Existing Google account -> log in
      userId = account.userId;
    } else {
      // New Google account -> check if email already registered to another user
      if (googleUser.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: googleUser.email },
        });

        if (existingUser) {
          return res.status(409).json({
            success: false,
            code: 'EMAIL_ALREADY_IN_USE',
            error: 'An account with this email already exists. Please log in with your original method, then link Google from your profile.',
          });
        }
      }

      // Create new User and Google AuthAccount
      const newUser = await prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name,
          profileImage: googleUser.picture,
          accounts: {
            create: {
              provider: 'GOOGLE',
              providerId: googleUser.sub,
            },
          },
        },
      });
      userId = newUser.id;
    }

    // Start session
    await createAuthSession(req, res, userId);

    // Fetch user to return
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        accounts: {
          select: { provider: true },
        },
      },
    });

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/phone/request-otp
 * Generates and stores OTP. Emulates sending SMS.
 */
router.post('/phone/request-otp', otpRequestLimiter, async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Valid phone number is required.',
      });
    }

    // Cooldown check: max 1 OTP request per phone number every 60 seconds
    const latestOtp = await prisma.oTPVerification.findFirst({
      where: { phone },
      orderBy: { createdAt: 'desc' },
    });

    if (latestOtp) {
      const msSinceLastOtp = Date.now() - new Date(latestOtp.createdAt).getTime();
      if (msSinceLastOtp < 60 * 1000) {
        return res.status(429).json({
          success: false,
          error: 'Please wait 60 seconds before requesting another OTP.',
        });
      }
    }

    // Invalidate/expire any previous active OTPs for this phone number
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    await prisma.oTPVerification.updateMany({
      where: {
        phone,
        createdAt: { gte: fiveMinutesAgo },
        verified: false,
        expiresAt: { gte: new Date() },
      },
      data: {
        expiresAt: new Date(Date.now() - 1000), // set to past
      },
    });

    // Generate secure 6-digit OTP
    const otp = generateOTP();
    const otpHash = await hashValue(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

    // Store in DB
    await prisma.oTPVerification.create({
      data: {
        phone,
        otpHash,
        expiresAt,
      },
    });

    // Development Console Logging (Mock SMS sending)
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      console.log(`📱 [SMS Mock] Sent OTP to ${phone}: ${otp}`);
    }

    // In production, we'd fire off to AWS SNS, Twilio, or another provider here.
    // Ensure we do NOT log the raw OTP code in production.

    res.json({
      success: true,
      message: 'OTP sent successfully.',
      // Return OTP in dev/test ONLY for programmatic verification tests (never in production)
      ...(process.env.NODE_ENV === 'test' && { _devOtp: otp }),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/phone/verify-otp
 * Verifies OTP and logs in / signs up user.
 */
router.post('/phone/verify-otp', async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and OTP code are required.',
      });
    }

    // Find the latest active verification attempt
    const verification = await prisma.oTPVerification.findFirst({
      where: {
        phone,
        verified: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification) {
      return res.status(400).json({
        success: false,
        error: 'OTP has expired or is invalid. Please request a new one.',
      });
    }

    // Enforce attempt limits
    if (verification.attempts >= 5) {
      // Invalidate the OTP
      await prisma.oTPVerification.update({
        where: { id: verification.id },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });

      return res.status(429).json({
        success: false,
        error: 'Too many incorrect attempts. Please request a new OTP.',
      });
    }

    // Increment attempts count
    await prisma.oTPVerification.update({
      where: { id: verification.id },
      data: { attempts: { increment: 1 } },
    });

    // Verify OTP code match
    const isValid = await compareHash(otp, verification.otpHash);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: 'Incorrect OTP code.',
      });
    }

    // OTP is valid -> mark it verified
    await prisma.oTPVerification.update({
      where: { id: verification.id },
      data: { verified: true },
    });

    // Check if user already exists with this phone AuthAccount
    let account = await prisma.authAccount.findUnique({
      where: {
        provider_providerId: {
          provider: 'PHONE',
          providerId: phone,
        },
      },
      include: { user: true },
    });

    let userId;

    if (account) {
      userId = account.userId;
    } else {
      // Check if user table has phone number linked without AuthAccount (edge case)
      const existingUser = await prisma.user.findUnique({
        where: { phone },
      });

      if (existingUser) {
        // Link to existing user by creating AuthAccount
        await prisma.authAccount.create({
          data: {
            userId: existingUser.id,
            provider: 'PHONE',
            providerId: phone,
          },
        });
        userId = existingUser.id;
      } else {
        // Create new User and Phone AuthAccount
        const newUser = await prisma.user.create({
          data: {
            phone,
            accounts: {
              create: {
                provider: 'PHONE',
                providerId: phone,
              },
            },
          },
        });
        userId = newUser.id;
      }
    }

    // Start session
    await createAuthSession(req, res, userId);

    // Fetch user to return
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        accounts: {
          select: { provider: true },
        },
      },
    });

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * Log out and invalidate session
 */
router.post('/logout', requireAuth, async (req, res, next) => {
  try {
    const sessionId = req.session.id;

    // Invalidate session in DB
    await prisma.session.update({
      where: { id: sessionId },
      data: { isValid: false },
    });

    // Clear signed cookie
    res.clearCookie('sid');

    res.json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user details
 */
router.get('/me', requireAuth, async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

/**
 * POST /api/auth/link-phone
 * Links phone authentication method to current authenticated user
 */
router.post('/link-phone', requireAuth, async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    const userId = req.user.id;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and OTP code are required.',
      });
    }

    // Verify phone account already linked to another User
    const existingAccount = await prisma.authAccount.findUnique({
      where: {
        provider_providerId: {
          provider: 'PHONE',
          providerId: phone,
        },
      },
    });

    if (existingAccount) {
      return res.status(409).json({
        success: false,
        code: 'ACCOUNT_ALREADY_LINKED',
        error: 'This phone number is already linked to another TaskCircle account.',
      });
    }

    // Also check if current user already has a phone linked
    const userPhoneAccount = await prisma.authAccount.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: 'PHONE',
        },
      },
    });

    if (userPhoneAccount) {
      return res.status(400).json({
        success: false,
        error: 'You already have a phone number linked to this account.',
      });
    }

    // Verify the OTP
    const verification = await prisma.oTPVerification.findFirst({
      where: {
        phone,
        verified: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification) {
      return res.status(400).json({
        success: false,
        error: 'OTP has expired or is invalid. Please request a new one.',
      });
    }

    const isValid = await compareHash(otp, verification.otpHash);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: 'Incorrect OTP code.',
      });
    }

    // Invalidate OTP
    await prisma.oTPVerification.update({
      where: { id: verification.id },
      data: { verified: true },
    });

    // Run in transaction to update user phone and add AuthAccount
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Update phone field on user if it was empty
      await tx.user.update({
        where: { id: userId },
        data: { phone },
      });

      // Create new AuthAccount relation
      await tx.authAccount.create({
        data: {
          userId,
          provider: 'PHONE',
          providerId: phone,
        },
      });

      return tx.user.findUnique({
        where: { id: userId },
        include: {
          accounts: {
            select: { provider: true },
          },
        },
      });
    });

    res.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/link-google
 * Links Google authentication method to current authenticated user
 */
router.post('/link-google', requireAuth, async (req, res, next) => {
  try {
    const { credential } = req.body;
    const userId = req.user.id;

    if (!credential) {
      return res.status(400).json({
        success: false,
        error: 'Google credential (ID Token) is required.',
      });
    }

    // Verify Google ID token
    const googleUser = await verifyGoogleToken(credential);

    // Verify Google account already linked to another User
    const existingAccount = await prisma.authAccount.findUnique({
      where: {
        provider_providerId: {
          provider: 'GOOGLE',
          providerId: googleUser.sub,
        },
      },
    });

    if (existingAccount) {
      return res.status(409).json({
        success: false,
        code: 'ACCOUNT_ALREADY_LINKED',
        error: 'This Google account is already linked to another TaskCircle account.',
      });
    }

    // Also check if current user already has Google linked
    const userGoogleAccount = await prisma.authAccount.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: 'GOOGLE',
        },
      },
    });

    if (userGoogleAccount) {
      return res.status(400).json({
        success: false,
        error: 'You already have a Google account linked to this account.',
      });
    }

    // Run in transaction to update user email/name/picture and add AuthAccount
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Update email/name/profileImage if not already set
      await tx.user.update({
        where: { id: userId },
        data: {
          email: req.user.email || googleUser.email,
          name: req.user.name || googleUser.name,
          profileImage: req.user.profileImage || googleUser.picture,
        },
      });

      // Create AuthAccount
      await tx.authAccount.create({
        data: {
          userId,
          provider: 'GOOGLE',
          providerId: googleUser.sub,
        },
      });

      return tx.user.findUnique({
        where: { id: userId },
        include: {
          accounts: {
            select: { provider: true },
          },
        },
      });
    });

    res.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
