import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const { user, loginWithGoogle, requestOtp, verifyOtp, error, setError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  const from = location.state?.from?.pathname || '/';
  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  // Auth Method: 'google' | 'phone'
  const [authMethod, setAuthMethod] = useState('google');
  
  // Phone OTP state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [devOtpCode, setDevOtpCode] = useState(''); // Shown in dev mode only

  // Google OAuth Client setup
  useEffect(() => {
    const initGoogle = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: 'mock-google-client-id', // Placeholder, replaced by actual variable
          callback: async (response) => {
            setSubmitting(true);
            const res = await loginWithGoogle(response.credential);
            setSubmitting(false);
            if (res.success) {
              navigate(from, { replace: true });
            }
          },
        });
        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-btn'),
          { theme: 'filled_blue', size: 'large', width: '100%' }
        );
      }
    };

    // Attempt initialization
    initGoogle();
    
    // Inject script if missing
    if (!document.getElementById('google-jssdk')) {
      const script = document.createElement('script');
      script.id = 'google-jssdk';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.head.appendChild(script);
    }
  }, [loginWithGoogle, navigate, from]);

  // Cooldown timer for resending OTP
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!phone) {
      setError('Phone number is required.');
      return;
    }

    setSubmitting(true);
    setError(null);
    
    const res = await requestOtp(phone);
    setSubmitting(false);
    
    if (res.success) {
      setOtpSent(true);
      setCooldown(60);
      // If mock test exposes devOtp, display it for local developer flow ease
      if (res._devOtp) {
        setDevOtpCode(res._devOtp);
      }
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError('OTP is required.');
      return;
    }

    setSubmitting(true);
    setError(null);
    const res = await verifyOtp(phone, otp);
    setSubmitting(false);
    
    if (res.success) {
      navigate(from, { replace: true });
    }
  };

  // Mock Developer Login helper for quick local tests
  const handleDevMockLogin = async (provider) => {
    setSubmitting(true);
    setError(null);
    
    if (provider === 'GOOGLE') {
      const res = await loginWithGoogle('valid-mock-google-token');
      setSubmitting(false);
      if (res.success) {
        navigate(from, { replace: true });
      }
    } else {
      // Simulate phone flow
      const phoneMock = '+15550199';
      const reqRes = await requestOtp(phoneMock);
      if (reqRes.success) {
        // Fetch code (defaults to 123456 or the generated mock code)
        const mockCode = reqRes._devOtp || '123456';
        const verifyRes = await verifyOtp(phoneMock, mockCode);
        setSubmitting(false);
        if (verifyRes.success) {
          navigate(from, { replace: true });
        }
      } else {
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background blobs for premium glassmorphism aesthetic */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
            <span className="text-white font-extrabold text-lg">T</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Task<span className="text-primary-400">Circle</span>
          </h2>
        </div>
        <p className="text-center text-sm text-dark-400">
          Collaborative tasks, linked profiles, secure access.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-dark-900/40 backdrop-blur-xl border border-dark-800 rounded-2xl p-8 shadow-2xl">
          {/* Tabs */}
          <div className="flex border-b border-dark-800 mb-6">
            <button
              onClick={() => {
                setAuthMethod('google');
                setError(null);
              }}
              className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors ${
                authMethod === 'google'
                  ? 'border-primary-500 text-primary-400'
                  : 'border-transparent text-dark-400 hover:text-dark-200'
              }`}
            >
              Google Auth
            </button>
            <button
              onClick={() => {
                setAuthMethod('phone');
                setError(null);
              }}
              className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors ${
                authMethod === 'phone'
                  ? 'border-primary-500 text-primary-400'
                  : 'border-transparent text-dark-400 hover:text-dark-200'
              }`}
            >
              Phone Code
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
              {error}
            </div>
          )}

          {submitting && (
            <div className="mb-6 flex justify-center items-center gap-2 text-sm text-primary-400">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Verifying...
            </div>
          )}

          {/* Google Auth Option */}
          {authMethod === 'google' && (
            <div className="space-y-6">
              <p className="text-sm text-dark-400 text-center">
                Sign in with your Google account to access your workspace.
              </p>
              
              {/* Native Google SDK Button container */}
              <div id="google-jssdk-btn-wrapper" className="flex justify-center min-h-[44px]">
                <div id="google-signin-btn" className="w-full"></div>
              </div>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-dark-800"></div>
                <span className="flex-shrink mx-4 text-dark-500 text-xs uppercase">Or Sandbox</span>
                <div className="flex-grow border-t border-dark-800"></div>
              </div>

              {/* Developer Bypass */}
              <button
                type="button"
                onClick={() => handleDevMockLogin('GOOGLE')}
                className="w-full btn-secondary py-2.5 text-sm flex items-center justify-center gap-2"
              >
                🛠️ Bypass with Mock Google account
              </button>
            </div>
          )}

          {/* Phone Auth Option */}
          {authMethod === 'phone' && (
            <div className="space-y-6">
              {!otpSent ? (
                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div>
                    <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-dark-400 mb-2">
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      required
                      placeholder="+15550199"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition-colors placeholder-dark-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full btn-primary py-3 font-semibold text-sm shadow-lg shadow-primary-500/20"
                  >
                    Request OTP Code
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label htmlFor="otp" className="block text-xs font-semibold uppercase tracking-wider text-dark-400 mb-2">
                      OTP Code
                    </label>
                    <input
                      id="otp"
                      type="text"
                      required
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-white text-center text-lg tracking-widest font-mono focus:outline-none focus:border-primary-500 transition-colors placeholder-dark-500"
                    />
                  </div>

                  {devOtpCode && (
                    <div className="p-3 bg-primary-500/10 border border-primary-500/20 rounded-xl text-center text-xs text-primary-400">
                      🛠️ Dev OTP Code: <strong>{devOtpCode}</strong>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full btn-primary py-3 font-semibold text-sm shadow-lg shadow-primary-500/20"
                  >
                    Verify & Login
                  </button>

                  <div className="flex justify-between items-center text-xs text-dark-400 mt-2">
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="hover:text-white transition-colors"
                    >
                      ← Change number
                    </button>
                    <button
                      type="button"
                      disabled={cooldown > 0 || submitting}
                      onClick={handleRequestOtp}
                      className={`font-semibold ${
                        cooldown > 0
                          ? 'text-dark-600 cursor-not-allowed'
                          : 'text-primary-400 hover:text-primary-300 transition-colors'
                      }`}
                    >
                      {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                    </button>
                  </div>
                </form>
              )}

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-dark-800"></div>
                <span className="flex-shrink mx-4 text-dark-500 text-xs uppercase">Or Sandbox</span>
                <div className="flex-grow border-t border-dark-800"></div>
              </div>

              {/* Developer Bypass */}
              <button
                type="button"
                onClick={() => handleDevMockLogin('PHONE')}
                className="w-full btn-secondary py-2.5 text-sm flex items-center justify-center gap-2"
              >
                🛠️ Bypass with Mock Phone account
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
