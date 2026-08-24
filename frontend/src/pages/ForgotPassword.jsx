import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  ArrowLeft,
  HelpCircle,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function ForgotPassword() {
  const { forgotPassword, error, setError } = useAuth();

  const [step, setStep] = useState(1);

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [submitting, setSubmitting] =
    useState(false);

  const [successMsg, setSuccessMsg] =
    useState(null);

  // AI Help Widget
  const [showHelp, setShowHelp] =
    useState(false);

  const [chatHistory, setChatHistory] =
    useState([
      {
        sender: 'assistant',
        text:
          'Hello! I am your TaskCircle login assistant. How can I help you today?',
      },
    ]);

  const helpTopics = [
    {
      question: 'I forgot my password',
      answer:
        'Enter your registered email address and click "Send OTP". We will send a 6-digit OTP to your email.',
    },
    {
      question: 'How do I reset my password?',
      answer:
        'Enter your email, verify the OTP sent to your email, and then create a new password.',
    },
    {
      question: "I didn't receive the OTP",
      answer:
        'Please check your spam or junk folder and make sure you entered the correct email address.',
    },
    {
      question: 'What should I do if my email is not recognized?',
      answer:
        'Make sure there are no typos in your email address and that you are using the email associated with your TaskCircle account.',
    },
  ];

  const handleHelpClick = (topic) => {
    setChatHistory((prev) => [
      ...prev,
      {
        sender: 'user',
        text: topic.question,
      },
      {
        sender: 'assistant',
        text: topic.answer,
      },
    ]);
  };

  const handleCustomQuestion = (e) => {
    e.preventDefault();

    const query =
      e.target.elements.customQuery.value.trim();

    if (!query) return;

    let response =
      'I can help with login and password reset questions. Please select one of the standard help topics.';

    const normalizedQuery =
      query.toLowerCase();

    if (
      normalizedQuery.includes('forgot') ||
      normalizedQuery.includes('password')
    ) {
      response = helpTopics[0].answer;
    } else if (
      normalizedQuery.includes('reset')
    ) {
      response = helpTopics[1].answer;
    } else if (
      normalizedQuery.includes('otp') ||
      normalizedQuery.includes('email') ||
      normalizedQuery.includes('mail')
    ) {
      response = helpTopics[2].answer;
    }

    setChatHistory((prev) => [
      ...prev,
      {
        sender: 'user',
        text: query,
      },
      {
        sender: 'assistant',
        text: response,
      },
    ]);

    e.target.reset();
  };

  // STEP 1
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setError('Email is required.');
      return;
    }

    try {
      setSubmitting(true);

      const response =
        await forgotPassword(email.trim());

      if (response?.success) {
        setStep(2);

        setSuccessMsg(
          'A 6-digit OTP has been sent to your email.'
        );
      }
    } catch (err) {
      console.error(
        'Send reset OTP error:',
        err
      );

      setError(
        err.response?.data?.error ||
          'Failed to send OTP.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // STEP 2
  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    setError(null);
    setSuccessMsg(null);

    if (!/^\d{6}$/.test(otp)) {
      setError(
        'Please enter a valid 6-digit OTP.'
      );
      return;
    }

    try {
      setSubmitting(true);

      const response =
        await api.post(
          '/auth/verify-reset-otp',
          {
            email: email.trim(),
            otp,
          }
        );

      if (response.data?.success) {
        setStep(3);

        setSuccessMsg(
          'OTP verified successfully. Create your new password.'
        );
      }
    } catch (err) {
      console.error(
        'Verify reset OTP error:',
        err
      );

      setError(
        err.response?.data?.error ||
          'Invalid or expired OTP.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // STEP 3
  const handleResetPassword = async (e) => {
    e.preventDefault();

    setError(null);
    setSuccessMsg(null);

    if (password.length < 6) {
      setError(
        'Password must be at least 6 characters long.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        'Passwords do not match.'
      );
      return;
    }

    try {
      setSubmitting(true);

      const response =
        await api.post(
          '/auth/reset-password',
          {
            email: email.trim(),
            otp,
            password,
          }
        );

      if (response.data?.success) {
        setSuccessMsg(
          'Password updated successfully. Redirecting to login...'
        );

        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
    } catch (err) {
      console.error(
        'Reset password error:',
        err
      );

      setError(
        err.response?.data?.error ||
          'Failed to update password.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">

      {/* Background */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

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
          Reset your password securely.
        </p>

      </div>

      {/* Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg relative z-10 px-4">

        <div className="bg-dark-900/40 backdrop-blur-xl border border-dark-800 rounded-2xl p-8 shadow-2xl">

          {/* Heading */}
          <div className="text-center mb-7">

            <div className="mx-auto w-14 h-14 rounded-full bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-2xl">
              🔐
            </div>

            <h1 className="mt-4 text-2xl font-bold text-white">
              {step === 1 &&
                'Forgot Password'}

              {step === 2 &&
                'Verify OTP'}

              {step === 3 &&
                'Create New Password'}
            </h1>

            <p className="mt-2 text-sm text-dark-400">
              {step === 1 &&
                'Enter your email to receive a password reset OTP.'}

              {step === 2 &&
                'Enter the 6-digit OTP sent to your email.'}

              {step === 3 &&
                'Choose a new password for your account.'}
            </p>

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

          {/* STEP 1 */}
          {step === 1 && (
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >

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

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/20"
              >
                {submitting
                  ? 'Sending OTP...'
                  : 'Send OTP'}
              </button>

            </form>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <form
              onSubmit={handleVerifyOtp}
              className="space-y-4"
            >

              <div>

                <label
                  htmlFor="otp"
                  className="block text-xs font-semibold uppercase tracking-wider text-dark-400 mb-2"
                >
                  Enter OTP
                </label>

                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="123456"
                  value={otp}
                  onChange={(e) =>
                    setOtp(
                      e.target.value.replace(
                        /\D/g,
                        ''
                      )
                    )
                  }
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-white text-center text-xl tracking-[0.5em] font-mono focus:outline-none focus:border-primary-500 placeholder-dark-600"
                />

              </div>

              <button
                type="submit"
                disabled={
                  submitting ||
                  otp.length !== 6
                }
                className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/20"
              >
                {submitting
                  ? 'Verifying...'
                  : 'Verify OTP'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setOtp('');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="w-full text-sm text-dark-400 hover:text-white"
              >
                ← Change Email
              </button>

            </form>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <form
              onSubmit={handleResetPassword}
              className="space-y-4"
            >

              <div>

                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-dark-400 mb-2"
                >
                  New Password
                </label>

                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500"
                />

              </div>

              <div>

                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-semibold uppercase tracking-wider text-dark-400 mb-2"
                >
                  Confirm Password
                </label>

                <input
                  id="confirmPassword"
                  type="password"
                  required
                  minLength={6}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500"
                />

              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/20"
              >
                {submitting
                  ? 'Updating Password...'
                  : 'Update Password'}
              </button>

            </form>
          )}

          {/* Bottom navigation */}
          <div className="mt-6 flex justify-between items-center text-sm">

            <Link
              to="/login"
              className="text-dark-400 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft size={16} />
              Back to Login
            </Link>

            <button
              type="button"
              onClick={() =>
                setShowHelp(!showHelp)
              }
              className="text-primary-400 hover:text-primary-300 font-semibold flex items-center gap-1.5"
            >
              <HelpCircle size={16} />
              {showHelp
                ? 'Hide Assistant'
                : 'Need Help?'}
            </button>

          </div>

        </div>

        {/* AI Help */}
        {showHelp && (
          <div className="mt-6 bg-dark-900/40 backdrop-blur-xl border border-dark-800 rounded-2xl p-6 shadow-2xl">

            <div className="mb-4">
              <h3 className="font-bold text-white text-sm">
                Login Support Assistant
              </h3>

              <p className="text-[10px] text-dark-500">
                Password reset assistance
              </p>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-3 p-2 bg-dark-950/50 rounded-xl border border-dark-800">

              {chatHistory.map(
                (chat, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col max-w-[85%] rounded-2xl px-4 py-2.5 text-xs ${
                      chat.sender === 'user'
                        ? 'bg-primary-600 text-white ml-auto rounded-tr-none'
                        : 'bg-dark-800 text-dark-200 mr-auto rounded-tl-none border border-dark-700'
                    }`}
                  >
                    <p>{chat.text}</p>
                  </div>
                )
              )}

            </div>

            <div className="flex flex-wrap gap-2 mt-4">

              {helpTopics.map(
                (topic, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() =>
                      handleHelpClick(topic)
                    }
                    className="text-[11px] font-medium bg-dark-800 hover:bg-dark-700 border border-dark-700 text-dark-300 hover:text-white px-3 py-1.5 rounded-full transition-all text-left"
                  >
                    {topic.question}
                  </button>
                )
              )}

            </div>

            <form
              onSubmit={handleCustomQuestion}
              className="flex gap-2 mt-4"
            >

              <input
                type="text"
                name="customQuery"
                placeholder="Ask support a question..."
                className="flex-1 bg-dark-800 border border-dark-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-primary-500 placeholder-dark-500"
              />

              <button
                type="submit"
                className="bg-dark-700 hover:bg-dark-600 border border-dark-600 text-white font-semibold text-xs px-4 py-2 rounded-xl"
              >
                Ask
              </button>

            </form>

          </div>
        )}

      </div>

    </div>
  );
}

export default ForgotPassword;