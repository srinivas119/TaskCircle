import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  ArrowLeft,
} from 'lucide-react';

function Signup() {
  const {
    signUpWithEmail,
    verifyEmailOtp,
    resendEmailOtp,
    loginWithGoogle,
    error,
    setError,
  } = useAuth();

  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [otp, setOtp] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');

  const [resendTimer, setResendTimer] = useState(0);

  // =========================================================
  // GOOGLE SIGN UP
  // =========================================================

  
  // =========================================================
  // RESEND TIMER
  // =========================================================

  useEffect(() => {
    if (resendTimer <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setResendTimer((previous) =>
        previous > 0 ? previous - 1 : 0
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [resendTimer]);

  // =========================================================
  // CREATE ACCOUNT
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError(null);

    if (
      !name.trim() ||
      !email.trim() ||
      !username.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError('All fields are required.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      setError(
        'Please enter a valid email address.'
      );
      return;
    }

    const usernameRegex =
      /^[a-zA-Z0-9_]{3,20}$/;

    if (!usernameRegex.test(cleanUsername)) {
      setError(
        'Username must be 3-20 characters and contain only letters, numbers, or underscores.'
      );
      return;
    }

    if (password.length < 6) {
      setError(
        'Password must be at least 6 characters long.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setSubmitting(true);

      const result = await signUpWithEmail(
        name.trim(),
        cleanEmail,
        cleanUsername,
        password
      );

      if (result?.success) {
        setVerificationEmail(cleanEmail);
        setShowOtpScreen(true);

        setOtp('');

        setResendTimer(60);
      }
    } catch (err) {
      console.error(
        'Email signup error:',
        err
      );

      setError(
        err?.response?.data?.error ||
          'An unexpected error occurred during signup.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // VERIFY EMAIL OTP
  // =========================================================

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    setError(null);

    if (!otp.trim()) {
      setError('Please enter the OTP.');
      return;
    }

    if (!/^\d{6}$/.test(otp.trim())) {
      setError('OTP must contain 6 digits.');
      return;
    }

    try {
      setVerifying(true);

      const result = await verifyEmailOtp(
        verificationEmail,
        otp.trim()
      );

      if (result?.success) {
        navigate('/login', {
          replace: true,
          state: {
            message:
              'Email verified successfully. You can now login.',
            email: verificationEmail,
          },
        });
      }
    } catch (err) {
      console.error(
        'OTP verification error:',
        err
      );

      setError(
        err?.response?.data?.error ||
          'OTP verification failed.'
      );
    } finally {
      setVerifying(false);
    }
  };

  // =========================================================
  // RESEND OTP
  // =========================================================

  const handleResendOtp = async () => {
    if (resendTimer > 0 || resending) {
      return;
    }

    setError(null);

    try {
      setResending(true);

      const result =
        await resendEmailOtp(
          verificationEmail
        );

      if (result?.success) {
        setOtp('');
        setResendTimer(60);
      }
    } catch (err) {
      console.error(
        'Resend OTP error:',
        err
      );

      setError(
        err?.response?.data?.error ||
          'Unable to resend OTP.'
      );
    } finally {
      setResending(false);
    }
  };

  // =========================================================
  // OTP SCREEN
  // =========================================================

  if (showOtpScreen) {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">

        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

        <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">

          <div className="flex justify-center gap-3 mb-6">

            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
              <span className="text-white font-extrabold text-lg">
                T
              </span>
            </div>

            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Task
              <span className="text-primary-400">
                Circle
              </span>
            </h2>

          </div>

        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">

          <div className="bg-dark-900/40 backdrop-blur-xl border border-dark-800 rounded-2xl p-8 shadow-2xl">

            <button
              type="button"
              onClick={() => {
                setShowOtpScreen(false);
                setOtp('');
                setError(null);
              }}
              className="flex items-center gap-2 text-sm text-dark-400 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <div className="text-center">

              <div className="mx-auto w-16 h-16 rounded-full bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-3xl">
                ✉️
              </div>

              <h1 className="mt-6 text-2xl font-bold text-white">
                Verify your email
              </h1>

              <p className="mt-3 text-sm text-dark-400 leading-6">
                We sent a 6-digit verification
                code to
              </p>

              <p className="mt-1 text-sm font-semibold text-primary-400 break-all">
                {verificationEmail}
              </p>

            </div>

            {error && (
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 text-left">
                {error}
              </div>
            )}

            <form
              onSubmit={handleVerifyOtp}
              className="mt-6 space-y-5"
            >

              <div>

                <label
                  htmlFor="otp"
                  className="block text-xs font-semibold uppercase tracking-wider text-dark-400 mb-2"
                >
                  Verification Code
                </label>

                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => {
                    const value =
                      e.target.value
                        .replace(/\D/g, '')
                        .slice(0, 6);

                    setOtp(value);
                  }}
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-4 text-white text-center text-2xl tracking-[0.5em] font-semibold focus:outline-none focus:border-primary-500 transition-colors placeholder-dark-600"
                />

              </div>

              <button
                type="submit"
                disabled={
                  verifying ||
                  otp.length !== 6
                }
                className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/20"
              >
                {verifying
                  ? 'Verifying...'
                  : 'Verify Email'}
              </button>

            </form>

            <div className="mt-6 text-center">

              <p className="text-sm text-dark-400">
                Didn't receive the code?
              </p>

              {resendTimer > 0 ? (
                <p className="mt-2 text-sm text-dark-500">
                  Resend OTP in{' '}
                  <span className="text-primary-400 font-semibold">
                    {resendTimer}s
                  </span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resending}
                  className="mt-2 text-sm font-semibold text-primary-400 hover:text-primary-300 disabled:opacity-50"
                >
                  {resending
                    ? 'Sending...'
                    : 'Resend OTP'}
                </button>
              )}

            </div>

            <p className="mt-6 text-xs text-dark-500 text-center">
              Check your spam or junk folder if
              you don't see the email.
            </p>

          </div>

        </div>
      </div>
    );
  }

  // =========================================================
  // SIGNUP SCREEN
  // =========================================================

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">

      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">

        <div className="flex justify-center gap-3 mb-6">

          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
            <span className="text-white font-extrabold text-lg">
              T
            </span>
          </div>

          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Task
            <span className="text-primary-400">
              Circle
            </span>
          </h2>

        </div>

        <p className="text-center text-sm text-dark-400">
          Create an account to start collaborating
          with your team.
        </p>

      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">

        <div className="bg-dark-900/40 backdrop-blur-xl border border-dark-800 rounded-2xl p-8 shadow-2xl">

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            {/* NAME */}

            <div>

              <label
                htmlFor="name"
                className="block text-xs font-semibold uppercase tracking-wider text-dark-400 mb-2"
              >
                Full Name
              </label>

              <div className="relative">

                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-dark-500">
                  <User size={16} />
                </div>

                <input
                  id="name"
                  type="text"
                  required
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-primary-500 transition-colors placeholder-dark-500 text-sm"
                />

              </div>

            </div>

            {/* EMAIL */}

            <div>

              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-dark-400 mb-2"
              >
                Email Address
              </label>

              <div className="relative">

                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-dark-500">
                  <Mail size={16} />
                </div>

                <input
                  id="email"
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-primary-500 transition-colors placeholder-dark-500 text-sm"
                />

              </div>

            </div>

            {/* USERNAME */}

            <div>

              <label
                htmlFor="username"
                className="block text-xs font-semibold uppercase tracking-wider text-dark-400 mb-2"
              >
                Username
              </label>

              <div className="relative">

                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-dark-500">
                  <span className="text-xs font-semibold">
                    @
                  </span>
                </div>

                <input
                  id="username"
                  type="text"
                  required
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value)
                  }
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-primary-500 transition-colors placeholder-dark-500 text-sm"
                />

              </div>

            </div>

            {/* PASSWORD */}

            <div>

              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-dark-400 mb-2"
              >
                Password
              </label>

              <div className="relative">

                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-dark-500">
                  <Lock size={16} />
                </div>

                <input
                  id="password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  required
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-10 pr-10 py-3 text-white focus:outline-none focus:border-primary-500 transition-colors placeholder-dark-500 text-sm"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-dark-500 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>

              </div>

            </div>

            {/* CONFIRM PASSWORD */}

            <div>

              <label
                htmlFor="confirmPassword"
                className="block text-xs font-semibold uppercase tracking-wider text-dark-400 mb-2"
              >
                Confirm Password
              </label>

              <div className="relative">

                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-dark-500">
                  <Lock size={16} />
                </div>

                <input
                  id="confirmPassword"
                  type={
                    showConfirmPassword
                      ? 'text'
                      : 'password'
                  }
                  required
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-10 pr-10 py-3 text-white focus:outline-none focus:border-primary-500 transition-colors placeholder-dark-500 text-sm"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-dark-500 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>

              </div>

            </div>

            {/* CREATE ACCOUNT */}

            <button
              type="submit"
              disabled={
                submitting ||
                googleLoading
              }
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-lg shadow-primary-500/20"
            >
              {submitting
                ? 'Sending OTP...'
                : 'Create Account'}
            </button>

          </form>

          {/* GOOGLE */}

          <div className="relative flex items-center py-6">

            <div className="flex-grow border-t border-dark-800" />

            <span className="mx-4 text-xs text-dark-500 uppercase">
              Or
            </span>

            <div className="flex-grow border-t border-dark-800" />

          </div>

          {googleLoading && (
            <div className="mb-3 text-center text-sm text-primary-400">
              Creating Google account...
            </div>
          )}

          <div
            id="google-signup-btn"
            className="w-full flex justify-center"
          />

          {/* LOGIN */}

          <div className="mt-6 text-center text-sm text-dark-400">

            Already have an account?{' '}

            <Link
              to="/login"
              className="text-primary-400 hover:text-primary-300 font-semibold"
            >
              Sign In
            </Link>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Signup;