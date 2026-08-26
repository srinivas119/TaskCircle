import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';

import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // =========================================================
  // FETCH CURRENT USER
  // =========================================================

  const fetchCurrentUser = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get('/auth/me');

      if (response.data?.success) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // =========================================================
  // LOGIN WITH EMAIL / PASSWORD
  // =========================================================

  const loginWithEmail = async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      const response = await api.post('/auth/login', {
        email,
        password,
      });

      if (response.data?.success) {
        setUser(response.data.user);
        setLoading(false);

        return {
          success: true,
        };
      }

      throw new Error(
        response.data?.error || 'Login failed'
      );
    } catch (err) {
      const errMsg =
        err.response?.data?.error ||
        err.message ||
        'Login failed';

      setError(errMsg);
      setLoading(false);

      return {
        success: false,
        error: errMsg,
        code: err.response?.data?.code,
        requiresVerification:
          err.response?.data?.requiresVerification || false,
      };
    }
  };

  // =========================================================
  // SIGN UP WITH EMAIL / PASSWORD
  // =========================================================

  const signUpWithEmail = async (
    name,
    email,
    username,
    password
  ) => {
    try {
      setError(null);
      setLoading(true);

      const response = await api.post('/auth/register', {
        name,
        email,
        username,
        password,
      });

      if (response.data?.success) {
        setLoading(false);

        return {
          success: true,
          requiresVerification:
            response.data?.requiresVerification ?? true,
          email:
            response.data?.email || email,
          message:
            response.data?.message ||
            'Verification OTP sent to your email.',
        };
      }

      throw new Error(
        response.data?.error ||
          'Registration failed'
      );
    } catch (err) {
      const errMsg =
        err.response?.data?.error ||
        err.message ||
        'Registration failed';

      setError(errMsg);
      setLoading(false);

      return {
        success: false,
        error: errMsg,
        code: err.response?.data?.code,
        requiresVerification:
          err.response?.data?.requiresVerification ||
          false,
      };
    }
  };

  // =========================================================
  // VERIFY EMAIL OTP
  // =========================================================

  const verifyEmailOtp = async (
    email,
    otp
  ) => {
    try {
      setError(null);
      setLoading(true);

      const response = await api.post(
        '/auth/verify-email-otp',
        {
          email,
          otp,
        }
      );

      if (response.data?.success) {
        // If backend auto-logged in the user after OTP verification,
        // set the user in context immediately so no separate login is needed.
        if (response.data?.autoLoggedIn && response.data?.user) {
          setUser(response.data.user);
        }

        setLoading(false);

        return {
          success: true,
          autoLoggedIn: response.data?.autoLoggedIn || false,
          user: response.data?.user || null,
          message:
            response.data?.message ||
            'Email verified successfully.',
        };
      }

      throw new Error(
        response.data?.error ||
          'OTP verification failed'
      );
    } catch (err) {
      const errMsg =
        err.response?.data?.error ||
        err.message ||
        'OTP verification failed';

      setError(errMsg);
      setLoading(false);

      return {
        success: false,
        error: errMsg,
      };
    }
  };

  // =========================================================
  // RESEND EMAIL OTP
  // =========================================================

  const resendEmailOtp = async (email) => {
    try {
      setError(null);

      const response = await api.post(
        '/auth/resend-email-otp',
        {
          email,
        }
      );

      if (response.data?.success) {
        return {
          success: true,
          message:
            response.data?.message ||
            'A new OTP has been sent.',
        };
      }

      throw new Error(
        response.data?.error ||
          'Failed to resend OTP'
      );
    } catch (err) {
      const errMsg =
        err.response?.data?.error ||
        err.message ||
        'Failed to resend OTP';

      setError(errMsg);

      return {
        success: false,
        error: errMsg,
      };
    }
  };

  // =========================================================
  // LOGIN / SIGN UP WITH GOOGLE
  // =========================================================

  const loginWithGoogle = async (
    credential
  ) => {
    try {
      setError(null);
      setLoading(true);

      const response = await api.post(
        '/auth/google',
        {
          credential,
        }
      );

      if (response.data?.success) {
        setUser(response.data.user);
        setLoading(false);

        return {
          success: true,
        };
      }

      throw new Error(
        response.data?.error ||
          'Google authentication failed'
      );
    } catch (err) {
      const errMsg =
        err.response?.data?.error ||
        err.message ||
        'Google authentication failed';

      setError(errMsg);
      setLoading(false);

      return {
        success: false,
        error: errMsg,
        code:
          err.response?.data?.code,
      };
    }
  };

  // =========================================================
  // FORGOT PASSWORD
  // =========================================================

  const forgotPassword = async (
    email
  ) => {
    try {
      setError(null);
      setLoading(true);

      const response = await api.post(
        '/auth/forgot-password',
        {
          email,
        }
      );

      if (response.data?.success) {
        setLoading(false);

        return {
          success: true,
          message:
            response.data?.message,
        };
      }

      throw new Error(
        response.data?.error ||
          'Password reset request failed'
      );
    } catch (err) {
      const errMsg =
        err.response?.data?.error ||
        err.message ||
        'Password reset request failed';

      setError(errMsg);
      setLoading(false);

      return {
        success: false,
        error: errMsg,
      };
    }
  };

  // =========================================================
  // RESET PASSWORD
  // =========================================================

  const resetPassword = async (
    token,
    password
  ) => {
    try {
      setError(null);
      setLoading(true);

      const response = await api.post(
        '/auth/reset-password',
        {
          token,
          password,
        }
      );

      if (response.data?.success) {
        setLoading(false);

        return {
          success: true,
          message:
            response.data?.message,
        };
      }

      throw new Error(
        response.data?.error ||
          'Password reset failed'
      );
    } catch (err) {
      const errMsg =
        err.response?.data?.error ||
        err.message ||
        'Password reset failed';

      setError(errMsg);
      setLoading(false);

      return {
        success: false,
        error: errMsg,
      };
    }
  };

  // =========================================================
  // LINK GOOGLE ACCOUNT
  // =========================================================

  const linkGoogle = async (
    credential
  ) => {
    try {
      setError(null);

      const response = await api.post(
        '/auth/link-google',
        {
          credential,
        }
      );

      if (response.data?.success) {
        setUser(response.data.user);

        return {
          success: true,
        };
      }

      throw new Error(
        response.data?.error ||
          'Linking Google account failed'
      );
    } catch (err) {
      const errMsg =
        err.response?.data?.error ||
        err.message ||
        'Linking Google account failed';

      setError(errMsg);

      return {
        success: false,
        error: errMsg,
        code:
          err.response?.data?.code,
      };
    }
  };

  // =========================================================
  // UPDATE PROFILE
  // =========================================================

  const updateProfile = async (
    data
  ) => {
    try {
      setError(null);

      const response = await api.put(
        '/profile',
        data
      );

      if (response.data?.success) {
        setUser(response.data.user);

        return {
          success: true,
        };
      }

      throw new Error(
        response.data?.error ||
          'Profile update failed'
      );
    } catch (err) {
      const errMsg =
        err.response?.data?.error ||
        err.message ||
        'Profile update failed';

      setError(errMsg);

      return {
        success: false,
        error: errMsg,
      };
    }
  };

  // =========================================================
  // UPLOAD AVATAR
  // =========================================================

  const uploadAvatar = async (
    file
  ) => {
    try {
      setError(null);

      const formData = new FormData();

      formData.append(
        'avatar',
        file
      );

      const response = await api.post(
        '/profile/avatar',
        formData,
        {
          headers: {
            'Content-Type':
              'multipart/form-data',
          },
        }
      );

      if (response.data?.success) {
        setUser(response.data.user);

        return {
          success: true,
          profileImage:
            response.data.profileImage,
        };
      }

      throw new Error(
        response.data?.error ||
          'Avatar upload failed'
      );
    } catch (err) {
      const errMsg =
        err.response?.data?.error ||
        err.message ||
        'Avatar upload failed';

      setError(errMsg);

      return {
        success: false,
        error: errMsg,
      };
    }
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const logout = async () => {
    try {
      setLoading(true);

      await api.post(
        '/auth/logout'
      );
    } catch (err) {
      console.error(
        'Logout error:',
        err.message
      );
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  // =========================================================
  // CONTEXT VALUE
  // =========================================================

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        setError,

        loginWithEmail,

        signUpWithEmail,

        verifyEmailOtp,

        resendEmailOtp,

        loginWithGoogle,

        forgotPassword,

        resetPassword,

        linkGoogle,

        updateProfile,

        uploadAvatar,

        logout,

        refreshSession:
          fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider'
    );
  }

  return context;
};