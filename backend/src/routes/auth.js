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
import transporter from '../utils/mail.js';

const router = Router();

const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error:
      'Too many OTP requests. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// removed createAuthSession
const sendEmailOTP = async (email, otp) => {
  await transporter.sendMail({
    from: `"TaskCircle" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'TaskCircle Email Verification OTP',
    html: `
      <!DOCTYPE html>
      <html>
        <body style="margin:0;padding:0;background:#0f172a;font-family:Arial,sans-serif;">
          <div style="max-width:500px;margin:40px auto;background:#111827;border-radius:16px;padding:35px;color:white;">
            
            <div style="text-align:center;">
              <h1 style="margin:0;font-size:28px;">
                Task<span style="color:#60a5fa;">Circle</span>
              </h1>

              <p style="color:#9ca3af;margin-top:8px;">
                Verify your email address
              </p>
            </div>

            <div style="margin-top:30px;text-align:center;">
              <p style="color:#d1d5db;">
                Your verification code is:
              </p>

              <div style="
                display:inline-block;
                background:#1e293b;
                border:1px solid #334155;
                border-radius:12px;
                padding:18px 30px;
                margin:10px 0;
              ">
                <span style="
                  font-size:32px;
                  font-weight:bold;
                  letter-spacing:8px;
                  color:#60a5fa;
                ">
                  ${otp}
                </span>
              </div>

              <p style="color:#9ca3af;font-size:14px;">
                This OTP is valid for 10 minutes.
              </p>

              <p style="color:#9ca3af;font-size:13px;margin-top:25px;">
                If you did not create a TaskCircle account,
                you can safely ignore this email.
              </p>
            </div>

          </div>
        </body>
      </html>
    `,
  });
};

/*
|--------------------------------------------------------------------------
| GOOGLE AUTH
|--------------------------------------------------------------------------
| Google is available from the Create Account page.
| Google users are automatically email verified.
|--------------------------------------------------------------------------
*/

router.post('/google', async (req, res, next) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        error: 'Google credential is required.',
      });
    }

    const googleUser =
      await verifyGoogleToken(credential);

    if (!googleUser.email) {
      return res.status(400).json({
        success: false,
        error: 'Google account does not contain an email address.',
      });
    }

    const email =
      googleUser.email.trim().toLowerCase();

    let account =
      await prisma.authAccount.findUnique({
        where: {
          provider_providerId: {
            provider: 'GOOGLE',
            providerId: googleUser.sub,
          },
        },
        include: {
          user: true,
        },
      });

    let userId;

    if (account) {
      userId = account.userId;

      if (!account.user.emailVerified) {
        await prisma.user.update({
          where: {
            id: account.userId,
          },
          data: {
            emailVerified: true,
          },
        });
      }
    } else {
      const existingUser =
        await prisma.user.findUnique({
          where: {
            email,
          },
        });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          code: 'EMAIL_ALREADY_IN_USE',
          error:
            'An account with this email already exists. Please use email login.',
        });
      }

      const newUser =
        await prisma.user.create({
          data: {
            email,
            name: googleUser.name || null,
            profileImage:
              googleUser.picture || null,

            emailVerified: true,

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

    req.session.userId = userId;

    const user =
      await prisma.user.findUnique({
        where: {
          id: userId,
        },
        include: {
          accounts: {
            select: {
              provider: true,
            },
          },
        },
      });

    return res.json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
});

/*
|--------------------------------------------------------------------------
| REGISTER
|--------------------------------------------------------------------------
| Creates the account but does NOT allow login.
| Sends a 6-digit email OTP.
|--------------------------------------------------------------------------
*/

router.post('/register', otpRequestLimiter, async (req, res, next) => {
  try {
    const {
      name,
      email,
      username,
      password,
    } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Valid email is required.',
      });
    }

    const cleanEmail =
      email.trim().toLowerCase();

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format.',
      });
    }

    if (
      !username ||
      typeof username !== 'string'
    ) {
      return res.status(400).json({
        success: false,
        error: 'Username is required.',
      });
    }

    const cleanUsername =
      username.trim().toLowerCase();

    const usernameRegex =
      /^[a-zA-Z0-9_]{3,20}$/;

    if (!usernameRegex.test(cleanUsername)) {
      return res.status(400).json({
        success: false,
        error:
          'Username must be between 3 and 20 characters and contain only letters, numbers, or underscores.',
      });
    }

    if (
      !password ||
      typeof password !== 'string' ||
      password.length < 6
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Password must be at least 6 characters long.',
      });
    }

    const existingUser =
      await prisma.user.findFirst({
        where: {
          OR: [
            {
              email: cleanEmail,
            },
            {
              username: cleanUsername,
            },
          ],
        },
      });

    if (existingUser) {
      if (
        existingUser.email === cleanEmail
      ) {
        return res.status(409).json({
          success: false,
          error:
            existingUser.emailVerified
              ? 'An account with this email already exists.'
              : 'An account with this email already exists. Please verify your email or request a new OTP.',
          requiresVerification:
            !existingUser.emailVerified,
        });
      }

      if (
        existingUser.username ===
        cleanUsername
      ) {
        return res.status(409).json({
          success: false,
          error:
            'Username is already taken.',
        });
      }
    }

    const passwordHash =
      await hashValue(password);

    const user =
      await prisma.user.create({
        data: {
          email: cleanEmail,
          username: cleanUsername,
          name: name
            ? name.trim()
            : null,
          passwordHash,
          emailVerified: false,
        },
      });

    const otp = generateOTP();

    const otpHash =
      await hashValue(otp);

    const expiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );

    await prisma.oTPVerification.create({
      data: {
        email: cleanEmail,
        otpHash,
        expiresAt,
      },
    });

    await sendEmailOTP(
      cleanEmail,
      otp
    );

    if (
      process.env.NODE_ENV ===
        'development' ||
      process.env.NODE_ENV === 'test'
    ) {
      console.log(
        `📧 Email OTP for ${cleanEmail}: ${otp}`
      );
    }

    return res.status(201).json({
      success: true,
      requiresVerification: true,
      message:
        'Account created. A verification OTP has been sent to your email.',
      email: cleanEmail,
    });
  } catch (error) {
    next(error);
  }
});

/*
|--------------------------------------------------------------------------
| VERIFY EMAIL OTP
|--------------------------------------------------------------------------
*/

router.post(
  '/verify-email-otp',
  otpRequestLimiter,
  async (req, res, next) => {
    try {
      const { email, otp } =
        req.body;

      if (
        !email ||
        !otp
      ) {
        return res.status(400).json({
          success: false,
          error:
            'Email and OTP are required.',
        });
      }

      const cleanEmail =
        email.trim().toLowerCase();

      const cleanOtp =
        String(otp).trim();

      if (!/^\d{6}$/.test(cleanOtp)) {
        return res.status(400).json({
          success: false,
          error:
            'OTP must be exactly 6 digits.',
        });
      }

      const user =
        await prisma.user.findUnique({
          where: {
            email: cleanEmail,
          },
        });

      if (!user) {
        return res.status(404).json({
          success: false,
          error:
            'Account not found.',
        });
      }

      if (user.emailVerified) {
        return res.json({
          success: true,
          message:
            'Email is already verified.',
        });
      }

      const verification =
        await prisma.oTPVerification.findFirst({
          where: {
            email: cleanEmail,
            verified: false,
            expiresAt: {
              gt: new Date(),
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

      if (!verification) {
        return res.status(400).json({
          success: false,
          error:
            'OTP has expired or is invalid. Please request a new OTP.',
        });
      }

      if (
        verification.attempts >= 5
      ) {
        await prisma.oTPVerification.update({
          where: {
            id: verification.id,
          },
          data: {
            expiresAt:
              new Date(
                Date.now() - 1000
              ),
          },
        });

        return res.status(429).json({
          success: false,
          error:
            'Too many incorrect attempts. Please request a new OTP.',
        });
      }

      const isValid =
        await compareHash(
          cleanOtp,
          verification.otpHash
        );

      if (!isValid) {
        await prisma.oTPVerification.update({
          where: {
            id: verification.id,
          },
          data: {
            attempts: {
              increment: 1,
            },
          },
        });

        return res.status(400).json({
          success: false,
          error:
            'Incorrect OTP.',
        });
      }

      await prisma.$transaction([
        prisma.oTPVerification.update({
          where: {
            id: verification.id,
          },
          data: {
            verified: true,
          },
        }),

        prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            emailVerified: true,
          },
        }),
      ]);

      return res.json({
        success: true,
        message:
          'Email verified successfully. You can now log in.',
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| RESEND EMAIL OTP
|--------------------------------------------------------------------------
*/

router.post(
  '/resend-email-otp',
  otpRequestLimiter,
  async (req, res, next) => {
    try {
      const { email } =
        req.body;

      if (
        !email ||
        typeof email !== 'string'
      ) {
        return res.status(400).json({
          success: false,
          error:
            'Valid email is required.',
        });
      }

      const cleanEmail =
        email.trim().toLowerCase();

      const user =
        await prisma.user.findUnique({
          where: {
            email: cleanEmail,
          },
        });

      if (!user) {
        return res.status(404).json({
          success: false,
          error:
            'Account not found.',
        });
      }

      if (user.emailVerified) {
        return res.status(400).json({
          success: false,
          error:
            'This email is already verified.',
        });
      }

      const latestOtp =
        await prisma.oTPVerification.findFirst({
          where: {
            email: cleanEmail,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

      if (latestOtp) {
        const secondsSinceLastOtp =
          (Date.now() -
            new Date(
              latestOtp.createdAt
            ).getTime()) /
          1000;

        if (
          secondsSinceLastOtp <
          60
        ) {
          return res.status(429).json({
            success: false,
            error:
              `Please wait ${Math.ceil(
                60 -
                  secondsSinceLastOtp
              )} seconds before requesting another OTP.`,
          });
        }
      }

      await prisma.oTPVerification.updateMany({
        where: {
          email: cleanEmail,
          verified: false,
        },
        data: {
          expiresAt:
            new Date(
              Date.now() - 1000
            ),
        },
      });

      const otp = generateOTP();

      const otpHash =
        await hashValue(otp);

      const expiresAt = new Date(
        Date.now() + 10 * 60 * 1000
      );

      await prisma.oTPVerification.create({
        data: {
          email: cleanEmail,
          otpHash,
          expiresAt,
        },
      });

      await sendEmailOTP(
        cleanEmail,
        otp
      );

      if (
        process.env.NODE_ENV ===
          'development' ||
        process.env.NODE_ENV === 'test'
      ) {
        console.log(
          `📧 New Email OTP for ${cleanEmail}: ${otp}`
        );
      }

      return res.json({
        success: true,
        message:
          'A new OTP has been sent to your email.',
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

router.post(
  '/login',
  async (req, res, next) => {
    try {
      const {
        email,
        password,
      } = req.body;

      if (
        !email ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          error:
            'Email and password are required.',
        });
      }

      const cleanEmail =
        email.trim().toLowerCase();

      const user =
        await prisma.user.findUnique({
          where: {
            email: cleanEmail,
          },
          include: {
            accounts: {
              select: {
                provider: true,
              },
            },
          },
        });

      if (
        !user ||
        !user.passwordHash
      ) {
        return res.status(401).json({
          success: false,
          error:
            'Invalid email or password.',
        });
      }

      if (!user.emailVerified) {
        return res.status(403).json({
          success: false,
          code: 'EMAIL_NOT_VERIFIED',
          requiresVerification: true,
          error:
            'Please verify your email before logging in.',
        });
      }

      const isMatch =
        await compareHash(
          password,
          user.passwordHash
        );

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error:
            'Invalid email or password.',
        });
      }

      req.session.userId = user.id;

      return res.json({
        success: true,
        user,
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| LOGOUT
|--------------------------------------------------------------------------
*/

router.post(
  '/logout',
  requireAuth,
  async (req, res, next) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          return next(err);
        }
        res.clearCookie('sid');
        return res.json({
          success: true,
          message:
            'Logged out successfully.',
        });
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| CURRENT USER
|--------------------------------------------------------------------------
*/

router.get(
  '/me',
  requireAuth,
  async (req, res) => {
    return res.json({
      success: true,
      user: req.user,
    });
  }
);

/*
|--------------------------------------------------------------------------
| LINK GOOGLE
|--------------------------------------------------------------------------
*/

router.post(
  '/link-google',
  requireAuth,
  async (req, res, next) => {
    try {
      const { credential } =
        req.body;

      const userId =
        req.user.id;

      if (!credential) {
        return res.status(400).json({
          success: false,
          error:
            'Google credential is required.',
        });
      }

      const googleUser =
        await verifyGoogleToken(
          credential
        );

      const existingAccount =
        await prisma.authAccount.findUnique({
          where: {
            provider_providerId: {
              provider: 'GOOGLE',
              providerId:
                googleUser.sub,
            },
          },
        });

      if (existingAccount) {
        return res.status(409).json({
          success: false,
          code:
            'ACCOUNT_ALREADY_LINKED',
          error:
            'This Google account is already linked.',
        });
      }

      const userGoogleAccount =
        await prisma.authAccount.findUnique({
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
          error:
            'You already have a Google account linked.',
        });
      }

      const updatedUser =
        await prisma.$transaction(
          async (tx) => {
            await tx.user.update({
              where: {
                id: userId,
              },
              data: {
                email:
                  req.user.email ||
                  googleUser.email,
                name:
                  req.user.name ||
                  googleUser.name,
                profileImage:
                  req.user.profileImage ||
                  googleUser.picture,

                emailVerified: true,
              },
            });

            await tx.authAccount.create({
              data: {
                userId,
                provider: 'GOOGLE',
                providerId:
                  googleUser.sub,
              },
            });

            return tx.user.findUnique({
              where: {
                id: userId,
              },
              include: {
                accounts: {
                  select: {
                    provider: true,
                  },
                },
              },
            });
          }
        );

      return res.json({
        success: true,
        user: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| FORGOT PASSWORD
|--------------------------------------------------------------------------
*/

router.post(
  '/forgot-password',
  otpRequestLimiter,
  async (req, res, next) => {
    try {
      const { email } = req.body;

      if (!email || typeof email !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Valid email is required.',
        });
      }

      const cleanEmail = email.trim().toLowerCase();

      const user = await prisma.user.findUnique({
        where: {
          email: cleanEmail,
        },
      });

      // Do not reveal whether an account exists
      if (!user) {
        return res.json({
          success: true,
          message:
            'If the email exists, a password reset OTP has been sent.',
        });
      }

      // Generate 6-digit OTP
      const otp = generateOTP();

      // Hash OTP before storing
      const otpHash = await hashValue(otp);

      // OTP valid for 10 minutes
      const expiresAt = new Date(
        Date.now() + 10 * 60 * 1000
      );

      // Expire previous reset OTPs
      await prisma.oTPVerification.updateMany({
        where: {
          email: cleanEmail,
          verified: false,
        },
        data: {
          expiresAt: new Date(Date.now() - 1000),
        },
      });

      // Store new OTP
      await prisma.oTPVerification.create({
        data: {
          email: cleanEmail,
          otpHash,
          expiresAt,
        },
      });

      // Send through your existing Brevo email function
      await sendEmailOTP(cleanEmail, otp);

      if (
        process.env.NODE_ENV === 'development' ||
        process.env.NODE_ENV === 'test'
      ) {
        console.log(
          `🔐 Password Reset OTP for ${cleanEmail}: ${otp}`
        );
      }

      return res.json({
        success: true,
        message:
          'A password reset OTP has been sent to your email.',
      });
    } catch (error) {
      next(error);
    }
  }
);
router.post(
  '/verify-reset-otp',
  async (req, res, next) => {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(400).json({
          success: false,
          error: 'Email and OTP are required.',
        });
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanOtp = String(otp).trim();

      if (!/^\d{6}$/.test(cleanOtp)) {
        return res.status(400).json({
          success: false,
          error: 'OTP must be exactly 6 digits.',
        });
      }

      const verification =
        await prisma.oTPVerification.findFirst({
          where: {
            email: cleanEmail,
            verified: false,
            expiresAt: {
              gt: new Date(),
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

      if (!verification) {
        return res.status(400).json({
          success: false,
          error:
            'OTP has expired or is invalid. Please request a new OTP.',
        });
      }

      if (verification.attempts >= 5) {
        return res.status(429).json({
          success: false,
          error:
            'Too many incorrect attempts. Please request a new OTP.',
        });
      }

      const isValid = await compareHash(
        cleanOtp,
        verification.otpHash
      );

      if (!isValid) {
        await prisma.oTPVerification.update({
          where: {
            id: verification.id,
          },
          data: {
            attempts: {
              increment: 1,
            },
          },
        });

        return res.status(400).json({
          success: false,
          error: 'Invalid OTP.',
        });
      }

      return res.json({
        success: true,
        message: 'OTP verified successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
);
router.delete('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        createdGroups: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    /*
     * Delete groups created by this user first.
     *
     * Because Group relations use onDelete: Cascade,
     * this also deletes:
     * - GroupMember
     * - JoinRequest
     * - Tasks
     * - Task notifications
     */
    if (user.createdGroups.length > 0) {
      await prisma.group.deleteMany({
        where: {
          creatorId: userId,
        },
      });
    }

    /*
     * Now delete the user.
     *
     * User relations using onDelete: Cascade will remove:
     * - AuthAccount
     * - Session
     * - GroupMember
     * - JoinRequest
     * - Assigned Tasks
     * - Created Tasks
     * - Notifications
     */
    await prisma.user.delete({
      where: {
        id: userId,
      },
    });

    return res.json({
      success: true,
      message:
        'Account and owned groups deleted successfully',
    });
  } catch (error) {
    console.error('Delete account error:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to delete account',
    });
  }
});
/*
|--------------------------------------------------------------------------
| RESET PASSWORD
|--------------------------------------------------------------------------
*/

router.post(
  '/reset-password',
  async (req, res, next) => {
    try {
      const {
        email,
        otp,
        password,
      } = req.body;

      if (!email || !otp || !password) {
        return res.status(400).json({
          success: false,
          error:
            'Email, OTP and new password are required.',
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error:
            'Password must be at least 6 characters long.',
        });
      }

      const cleanEmail =
        email.trim().toLowerCase();

      const cleanOtp =
        String(otp).trim();

      const verification =
        await prisma.oTPVerification.findFirst({
          where: {
            email: cleanEmail,
            verified: false,
            expiresAt: {
              gt: new Date(),
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

      if (!verification) {
        return res.status(400).json({
          success: false,
          error:
            'OTP is invalid or has expired.',
        });
      }

      const isValid =
        await compareHash(
          cleanOtp,
          verification.otpHash
        );

      if (!isValid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid OTP.',
        });
      }

      const user =
        await prisma.user.findUnique({
          where: {
            email: cleanEmail,
          },
        });

      if (!user) {
        return res.status(400).json({
          success: false,
          error: 'Account not found.',
        });
      }

      const passwordHash =
        await hashValue(password);

      await prisma.$transaction([
        prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            passwordHash,
            resetToken: null,
            resetTokenExpires: null,
          },
        }),

        prisma.oTPVerification.update({
          where: {
            id: verification.id,
          },
          data: {
            verified: true,
          },
        }),


      ]);

      return res.json({
        success: true,
        message:
          'Password updated successfully. You can now log in.',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
