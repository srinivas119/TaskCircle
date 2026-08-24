import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
function Profile() {
  const navigate = useNavigate();
  const { 
    user, 
    linkGoogle, 
    requestOtp, 
    linkPhone, 
    updateProfile, 
    uploadAvatar, 
    logout, 
    error, 
    setError 
  } = useAuth();

  const fileInputRef = useRef(null);

  // Active tab state: 'general' | 'notifications' | 'accounts'
  const [activeTab, setActiveTab] = useState('general');

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  // General details form state
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');

  // Notification preferences form state
  const [notifyNewTask, setNotifyNewTask] = useState(true);
  const [notifyDueDate, setNotifyDueDate] = useState(true);
  const [notifyOverdue, setNotifyOverdue] = useState(true);
  const [notifyDailyReminder, setNotifyDailyReminder] = useState(true);

  // Link Phone state
  const [showPhoneForm, setShowPhoneForm] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [devOtpCode, setDevOtpCode] = useState('');

  // Populate state on load
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setUsername(user.username || '');
      setNotifyNewTask(user.notifyNewTask ?? true);
      setNotifyDueDate(user.notifyDueDate ?? true);
      setNotifyOverdue(user.notifyOverdue ?? true);
      setNotifyDailyReminder(user.notifyDailyReminder ?? true);
    }
  }, [user]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Setup Google Identity Services for account linking
  useEffect(() => {
    const initGoogleLink = () => {
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
    };

    initGoogleLink();
  }, [user, linkGoogle, activeTab]);

  const isProviderLinked = (provider) => {
    return user?.accounts?.some((acc) => acc.provider === provider) || false;
  };

  const handleUpdateGeneral = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    const res = await updateProfile({ name, username });
    setSubmitting(false);

    if (res.success) {
      setSuccessMsg('Profile details updated successfully!');
    }
  };

  const handleUpdateNotifications = async () => {
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    const res = await updateProfile({
      notifyNewTask,
      notifyDueDate,
      notifyOverdue,
      notifyDailyReminder,
    });
    setSubmitting(false);

    if (res.success) {
      setSuccessMsg('Notification preferences updated successfully!');
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Client-side validations
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, JPEG, GIF, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be under 5MB.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    const res = await uploadAvatar(file);
    setSubmitting(false);

    if (res.success) {
      setSuccessMsg('Avatar updated successfully!');
    }
  };
const handleDeleteAccount = async () => {
  const confirmed = window.confirm(
    'Are you sure you want to permanently delete your account? Your groups and all related data will also be deleted. This action cannot be undone.'
  );

  if (!confirmed) return;

  try {
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    await api.delete('/auth/me');

    localStorage.removeItem('token');
    logout();

    navigate('/login');

  } catch (error) {
    console.error(
      'Delete account error:',
      error
    );

    setError(
      error.response?.data?.error ||
      'Failed to delete account'
    );
  } finally {
    setSubmitting(false);
  }
};
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Account Settings
          </h1>
          <p className="text-sm text-dark-400 mt-1">
            Customize your details, avatar image, preferences, and connected providers.
          </p>
        </div>
        <button
          onClick={logout}
          className="btn-secondary self-start sm:self-center py-2 px-4 text-sm font-semibold flex items-center gap-2 border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/30"
        >
          Log Out
        </button>
      </div>

      {/* Message Banners */}
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left column: Avatar card */}
        <div className="card md:col-span-1 flex flex-col items-center text-center self-start">
          <div className="relative group cursor-pointer mb-4" onClick={() => fileInputRef.current?.click()}>
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.name || 'Profile'}
                className="w-28 h-28 rounded-full border-2 border-primary-500 object-cover shadow-lg group-hover:opacity-75 transition-all"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center text-4xl font-extrabold text-white shadow-lg group-hover:opacity-75 transition-all">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
            )}
            {/* Hover overlay */}
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs text-white font-medium">Change Photo</span>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          <h3 className="text-lg font-bold text-white">{user?.name || 'User'}</h3>
          <p className="text-xs text-dark-500 font-mono mt-1 break-all">UID: {user?.id}</p>

          <hr className="w-full border-dark-700 my-4" />

          <div className="w-full text-left space-y-3 text-xs">
            <div>
              <span className="text-dark-500 uppercase tracking-wider block font-semibold">Email</span>
              <span className="text-dark-100 font-medium break-all">{user?.email || 'Not linked'}</span>
            </div>
            <div>
              <span className="text-dark-500 uppercase tracking-wider block font-semibold">Phone</span>
              <span className="text-dark-100 font-medium">{user?.phone || 'Not linked'}</span>
            </div>
          </div>
        </div>

        {/* Right column: Form Tabs */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {/* Tabs Navigation */}
          <div className="flex bg-dark-900 border border-dark-800 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('general')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'general'
                  ? 'bg-dark-800 text-primary-400'
                  : 'text-dark-400 hover:text-dark-200'
              }`}
            >
              General Details
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'notifications'
                  ? 'bg-dark-800 text-primary-400'
                  : 'text-dark-400 hover:text-dark-200'
              }`}
            >
              Preferences
            </button>
            <button
              onClick={() => setActiveTab('accounts')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'accounts'
                  ? 'bg-dark-800 text-primary-400'
                  : 'text-dark-400 hover:text-dark-200'
              }`}
            >
              Auth Providers
            </button>
          </div>

          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="card space-y-6">
              <h2 className="text-lg font-bold text-white border-b border-dark-800 pb-3">
                Profile Details
              </h2>
              <form onSubmit={handleUpdateGeneral} className="space-y-4">
                <div>
                  <label htmlFor="edit-name" className="block text-xs font-semibold uppercase tracking-wider text-dark-400 mb-2">
                    Name
                  </label>
                  <input
                    id="edit-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="edit-username" className="block text-xs font-semibold uppercase tracking-wider text-dark-400 mb-2">
                    Username
                  </label>
                  <input
                    id="edit-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors font-mono"
                  />
                  <p className="text-[10px] text-dark-500 mt-1">
                    Alphanumeric and underscores only (3-20 characters).
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary py-2.5 px-4 text-xs font-semibold"
                >
                  Save Settings
                </button>
              </form>
            </div>
          )}

          {/* Notifications Preferences Tab */}
          {activeTab === 'notifications' && (
            <div className="card space-y-6">
              <div className="flex items-center justify-between border-b border-dark-800 pb-3">
                <h2 className="text-lg font-bold text-white">
                  Notification Settings
                </h2>
                <button
                  onClick={handleUpdateNotifications}
                  disabled={submitting}
                  className="btn-primary py-1.5 px-3 text-xs font-semibold"
                >
                  Save Changes
                </button>
              </div>

              <div className="space-y-4">
                <label className="flex items-center justify-between p-3 bg-dark-800/40 border border-dark-800 rounded-xl cursor-pointer hover:border-dark-700 transition-all">
                  <div>
                    <span className="font-semibold text-white block text-sm">New Task Assignments</span>
                    <span className="text-xs text-dark-400">Receive alert when added to a team task</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyNewTask}
                    onChange={(e) => setNotifyNewTask(e.target.checked)}
                    className="w-4 h-4 rounded border-dark-700 bg-dark-900 text-primary-500 focus:ring-primary-500/20"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-dark-800/40 border border-dark-800 rounded-xl cursor-pointer hover:border-dark-700 transition-all">
                  <div>
                    <span className="font-semibold text-white block text-sm">Task Due Dates</span>
                    <span className="text-xs text-dark-400">Receive alerts before task deadlines</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyDueDate}
                    onChange={(e) => setNotifyDueDate(e.target.checked)}
                    className="w-4 h-4 rounded border-dark-700 bg-dark-900 text-primary-500 focus:ring-primary-500/20"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-dark-800/40 border border-dark-800 rounded-xl cursor-pointer hover:border-dark-700 transition-all">
                  <div>
                    <span className="font-semibold text-white block text-sm">Overdue Warnings</span>
                    <span className="text-xs text-dark-400">Receive notification when task remains incomplete past due date</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyOverdue}
                    onChange={(e) => setNotifyOverdue(e.target.checked)}
                    className="w-4 h-4 rounded border-dark-700 bg-dark-900 text-primary-500 focus:ring-primary-500/20"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-dark-800/40 border border-dark-800 rounded-xl cursor-pointer hover:border-dark-700 transition-all">
                  <div>
                    <span className="font-semibold text-white block text-sm">Daily Reminder Digest</span>
                    <span className="text-xs text-dark-400">Receive a daily agenda summary</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyDailyReminder}
                    onChange={(e) => setNotifyDailyReminder(e.target.checked)}
                    className="w-4 h-4 rounded border-dark-700 bg-dark-900 text-primary-500 focus:ring-primary-500/20"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Accounts Tab */}
          {activeTab === 'accounts' && (
            <div className="card space-y-6">
              <h2 className="text-lg font-bold text-white border-b border-dark-800 pb-3">
                Link Login Providers
              </h2>

              <div className="space-y-4">
                {/* Google Provider Link */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-dark-800/40 border border-dark-850 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.579-7.859-8s3.529-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 5.92 1 1 5.92 1 12.24s4.92 11.24 11.24 11.24c6.6 0 11.01-4.64 11.01-11.24 0-.756-.08-1.333-.18-1.955H12.24z"/>
                      </svg>
                    </div>
                    <div>
                      <span className="font-semibold text-white block text-sm">Google Login</span>
                      <span className="text-xs text-dark-400">Google OAuth authentication</span>
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

                {/* Phone Provider Link */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-dark-800/40 border border-dark-850 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <span className="font-semibold text-white block text-sm">Phone OTP Login</span>
                      <span className="text-xs text-dark-400">Phone number verification</span>
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

                {/* Inline Phone Link Form */}
                {showPhoneForm && !isProviderLinked('PHONE') && (
                  <div className="mt-4 p-5 bg-dark-850 border border-dark-800 rounded-xl space-y-4">
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
          )}
        </div>
              </div>

      {/* =========================
          DANGER ZONE
      ========================== */}
      <div className="mt-8 bg-red-500/5 border border-red-500/20 rounded-2xl p-6">

        <h2 className="text-lg font-bold text-red-400">
          Danger Zone
        </h2>

        <p className="text-dark-400 text-sm mt-2">
          Permanently delete your TaskCircle account.
        </p>

        <p className="text-dark-500 text-xs mt-2">
          If you are an admin of any group, that group and
          all its tasks, members, and related data will also
          be deleted.
        </p>

        <button
          type="button"
          onClick={handleDeleteAccount}
          disabled={submitting}
          className="mt-5 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors disabled:opacity-50"
        >
          {submitting
            ? 'Deleting Account...'
            : 'Delete Account'}
        </button>

      </div>
    </div>
  );
}
    

export default Profile;
