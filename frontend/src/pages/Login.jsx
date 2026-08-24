import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

function Login() {
  const {
    user,
    loginWithEmail,
    error,
    setError,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const [successMsg, setSuccessMsg] = useState(
    location.state?.message || null
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();

    setError(null);
    setSuccessMsg(null);

    if (!email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setSubmitting(true);

      const res = await loginWithEmail(
        email.trim(),
        password
      );

      if (res.success) {
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.error('Login error:', err);

      setError(
        err?.response?.data?.error ||
          'Failed to sign in. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">

      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      {/* Logo */}
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
          Collaborative tasks, linked profiles, secure access.
        </p>

      </div>

      {/* Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">

        <div className="bg-dark-900/40 backdrop-blur-xl border border-dark-800 rounded-2xl p-8 shadow-2xl">

          {/* Email Login Header */}
          <div className="border-b border-dark-800 mb-6">

            <div className="pb-3 text-sm font-semibold text-primary-400 border-b-2 border-primary-500 text-center">
              Email Login
            </div>

          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Success */}
          {successMsg && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-sm text-green-400">
              {successMsg}
            </div>
          )}

          {/* Loading */}
          {submitting && (
            <div className="mb-6 flex justify-center items-center gap-2 text-sm text-primary-400">

              <svg
                className="animate-spin h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />

                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>

              Signing in...
            </div>
          )}

          {/* Email Login Form */}
          <form
            onSubmit={handleEmailLogin}
            className="space-y-4"
          >

            {/* Email */}
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
                  autoComplete="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-primary-500 transition-colors placeholder-dark-500 text-sm"
                />

              </div>

            </div>

            {/* Password */}
            <div>

              <div className="flex justify-between items-center mb-2">

                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-dark-400"
                >
                  Password
                </label>

                <Link
                  to="/forgot-password"
                  className="text-xs text-primary-400 hover:text-primary-300 transition-colors font-medium"
                >
                  Forgot Password?
                </Link>

              </div>

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
                  autoComplete="current-password"
                  placeholder="••••••••"
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
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>

              </div>

            </div>

            {/* Sign In */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/20 mt-2"
            >
              {submitting
                ? 'Signing In...'
                : 'Sign In'}
            </button>

            {/* Signup */}
            <div className="mt-6 text-center text-sm text-dark-400">

              New to TaskCircle?{' '}

              <Link
                to="/signup"
                className="text-primary-400 hover:text-primary-300 font-semibold"
              >
                Create Account
              </Link>

            </div>

          </form>

        </div>

      </div>

    </div>
  );
}

export default Login;