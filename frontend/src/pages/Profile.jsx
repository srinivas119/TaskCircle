import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function Profile() {
  const { user, linkGoogle, requestOtp, linkPhone, logout, error, setError } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  // Link Phone form state
  const [showPhoneForm, setShowPhoneForm] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [devOtpCode, setDevOtpCode] = useState('');

  // Checks if a provider is linked
  const isProviderLinked = (provider) => {
    return user?.accounts?.some((acc) => acc.provider === provider) || false;
  };

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Setup Google Identity Services for account linking
  useEffect(() => {
    if (window.google && user && !isProviderLinked('GOOGLE')) {
      window.google.accounts.id.initialize({
        client_id: 'mock-google-client-id',
        callback: async (response) => {
          setSubmitting(true);
          setError(null);
          setSuccessMsg(null);
          const res = await linkGoogle(response.credential);
          setSubmitting(false);
          if (res.success) {
            setSuccessMsg('Google account linked successfully!');
          }
        },
      });
      window.google.accounts.id.renderButton(
        document.getElementById('google-link-btn'),
        { theme: 'outline', size: 'medium' }
      );
    }
  }, [user, linkGoogle, isProviderLinked, setError]);

  const handlePhoneLinkRequest = async (e) => {
    e.preventDefault();
    if (!phone) {
      setError('Phone number is required.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    const res = await requestOtp(phone);
    setSubmitting(false);

    if (res.success) {
      setOtpSent(true);
      setCooldown(60);
      if (res._devOtp) {
        setDevOtpCode(res._devOtp);
      }
    }
  };

  const handlePhoneLinkVerify = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError('OTP code is required.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    const res = await linkPhone(phone, otp);
    setSubmitting(false);

    if (res.success) {
      setSuccessMsg('Phone number linked successfully!');
      setShowPhoneForm(false);
      setPhone('');
      setOtp('');
      setOtpSent(false);
      setDevOtpCode('');
    }
  };

  const handleDevMockLink = async (provider) => {
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    if (provider === 'GOOGLE') {
      const res = await linkGoogle('valid-mock-google-token');
      setSubmitting(false);
      if (res.success) {
        setSuccessMsg('Mock Google account linked successfully!');
      }
    } else {
      // Mock link phone flow
      const phoneMock = '+15559876';
      const reqRes = await requestOtp(phoneMock);
      if (reqRes.success) {
        const mockCode = reqRes._devOtp || '123456';
        const verifyRes = await linkPhone(phoneMock, mockCode);
        setSubmitting(false);
        if (verifyRes.success) {
          setSuccessMsg('Mock Phone account linked successfully!');
        }
      } else {
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            User Profile
          </h1>
          <p className="text-sm text-dark-400 mt-1">
            Manage your account info and linked identity authentication methods.
          </p>
        </div>
        <button
          onClick={logout}
          className="btn-secondary self-start sm:self-center py-2 px-4 text-sm font-semibold flex items-center gap-2 border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/30"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Log Out
        </button>
      </div>

      {/* Error & Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-sm text-green-400">
          {successMsg}
        </div>
      )}

      {submitting && (
        <div className="mb-6 flex justify-center items-center gap-2 text-sm text-primary-400">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Processing...
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* User Card */}
        <div className="card md:col-span-1 flex flex-col items-center text-center">
          <div className="relative mb-4">
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.name || 'User Profile'}
                className="w-24 h-24 rounded-full border-2 border-primary-500 object-cover shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center text-3xl font-extrabold text-white shadow-lg">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
            )}
            <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-green-500 border-4 border-dark-800 flex items-center justify-center"></div>
          </div>

          <h3 className="text-xl font-bold text-white">{user?.name || 'Anonymous User'}</h3>
          <p className="text-xs text-dark-500 font-mono mt-1 select-all">UID: {user?.id}</p>

          <hr className="w-full border-dark-700 my-6" />

          <div className="w-full space-y-4 text-left text-sm">
            <div>
              <span className="block text-xs text-dark-500 uppercase tracking-wider font-semibold">Email Address</span>
              <span className="text-dark-100 font-medium break-all">{user?.email || 'Not connected'}</span>
            </div>
            <div>
              <span className="block text-xs text-dark-500 uppercase tracking-wider font-semibold">Phone Number</span>
              <span className="text-dark-100 font-medium">{user?.phone || 'Not connected'}</span>
            </div>
          </div>
        </div>

        {/* Linked Accounts / Providers */}
        <div className="card md:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-white border-b border-dark-800 pb-4">
            Security & Authentication Methods
          </h2>

          <div className="space-y-4">
            {/* Google Provider Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-dark-700/30 border border-dark-700 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.579-7.859-8s3.529-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 5.92 1 1 5.92 1 12.24s4.92 11.24 11.24 11.24c6.6 0 11.01-4.64 11.01-11.24 0-.756-.08-1.333-.18-1.955H12.24z"/>
                  </svg>
                </div>
                <div>
                  <span className="font-semibold text-white block text-sm">Google Authentication</span>
                  <span className="text-xs text-dark-400">Sign in with Google OAuth credentials</span>
                </div>
              </div>

              {isProviderLinked('GOOGLE') ? (
                <span className="bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-semibold px-3 py-1.5 rounded-lg self-start sm:self-center">
                  Linked
                </span>
              ) : (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div id="google-link-btn"></div>
                  <button
                    onClick={() => handleDevMockLink('GOOGLE')}
                    className="btn-secondary py-1.5 px-3 text-xs flex items-center justify-center gap-1"
                  >
                    🛠️ Mock Link
                  </button>
                </div>
              )}
            </div>

            {/* Phone Provider Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-dark-700/30 border border-dark-700 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <span className="font-semibold text-white block text-sm">Phone Verification</span>
                  <span className="text-xs text-dark-400">Receive an OTP message to verify access</span>
                </div>
              </div>

              {isProviderLinked('PHONE') ? (
                <span className="bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-semibold px-3 py-1.5 rounded-lg self-start sm:self-center">
                  Linked
                </span>
              ) : (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  {!showPhoneForm ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowPhoneForm(true)}
                        className="btn-primary py-1.5 px-3 text-xs"
                      >
                        Link Phone
                      </button>
                      <button
                        onClick={() => handleDevMockLink('PHONE')}
                        className="btn-secondary py-1.5 px-3 text-xs"
                      >
                        🛠️ Mock Link
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowPhoneForm(false)}
                      className="btn-secondary py-1.5 px-3 text-xs text-dark-400 border-transparent hover:text-white"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Linking Forms Container */}
            {showPhoneForm && !isProviderLinked('PHONE') && (
              <div className="mt-4 p-5 bg-dark-800 border border-dark-700 rounded-xl space-y-4">
                <h4 className="text-sm font-bold text-white">Link Phone Number</h4>
                {!otpSent ? (
                  <form onSubmit={handlePhoneLinkRequest} className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="tel"
                      required
                      placeholder="+15559876"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="flex-1 bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 placeholder-dark-500"
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-primary py-2 px-4 text-xs font-semibold"
                    >
                      Send OTP
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handlePhoneLinkVerify} className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="Enter 6-digit code"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="flex-1 bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-sm text-center font-mono tracking-widest text-white focus:outline-none focus:border-primary-500 placeholder-dark-500"
                      />
                      <button
                        type="submit"
                        disabled={submitting}
                        className="btn-primary py-2 px-4 text-xs font-semibold"
                      >
                        Verify & Link
                      </button>
                    </div>

                    {devOtpCode && (
                      <div className="p-2 bg-primary-500/10 border border-primary-500/20 rounded-lg text-center text-xs text-primary-400">
                        🛠️ Dev OTP Code: <strong>{devOtpCode}</strong>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-xs text-dark-500">
                      <button type="button" onClick={() => setOtpSent(false)} className="hover:text-dark-300">
                        ← Change number
                      </button>
                      <button
                        type="button"
                        disabled={cooldown > 0 || submitting}
                        onClick={handlePhoneLinkRequest}
                        className={cooldown > 0 ? 'text-dark-600' : 'text-primary-400 hover:text-primary-300'}
                      >
                        {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
