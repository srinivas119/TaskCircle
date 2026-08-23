import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch current user (session restoration)
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
      // 401 is expected if not logged in
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // Login/Sign up with Google
  const loginWithGoogle = async (credential) => {
    try {
      setError(null);
      setLoading(true);
      const response = await api.post('/auth/google', { credential });
      if (response.data?.success) {
        setUser(response.data.user);
        return { success: true };
      }
      throw new Error(response.data?.error || 'Google login failed');
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      setError(errMsg);
      setLoading(false);
      return { success: false, error: errMsg, code: err.response?.data?.code };
    }
  };

  // Request Phone OTP
  const requestOtp = async (phone) => {
    try {
      setError(null);
      const response = await api.post('/auth/phone/request-otp', { phone });
      if (response.data?.success) {
        return { 
          success: true, 
          // Exposed in test mode only
          _devOtp: response.data._devOtp 
        };
      }
      throw new Error(response.data?.error || 'Requesting OTP failed');
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  // Verify Phone OTP (and Login/Sign up)
  const verifyOtp = async (phone, otp) => {
    try {
      setError(null);
      setLoading(true);
      const response = await api.post('/auth/phone/verify-otp', { phone, otp });
      if (response.data?.success) {
        setUser(response.data.user);
        return { success: true };
      }
      throw new Error(response.data?.error || 'OTP verification failed');
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      setError(errMsg);
      setLoading(false);
      return { success: false, error: errMsg };
    }
  };

  // Link Google Account to existing user
  const linkGoogle = async (credential) => {
    try {
      setError(null);
      const response = await api.post('/auth/link-google', { credential });
      if (response.data?.success) {
        setUser(response.data.user);
        return { success: true };
      }
      throw new Error(response.data?.error || 'Linking Google account failed');
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      setError(errMsg);
      return { success: false, error: errMsg, code: err.response?.data?.code };
    }
  };

  // Link Phone Account to existing user
  const linkPhone = async (phone, otp) => {
    try {
      setError(null);
      const response = await api.post('/auth/link-phone', { phone, otp });
      if (response.data?.success) {
        setUser(response.data.user);
        return { success: true };
      }
      throw new Error(response.data?.error || 'Linking phone account failed');
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      setError(errMsg);
      return { success: false, error: errMsg, code: err.response?.data?.code };
    }
  };

  // Logout
  const logout = async () => {
    try {
      setLoading(true);
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error API request failed:', err.message);
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        setError,
        loginWithGoogle,
        requestOtp,
        verifyOtp,
        linkGoogle,
        linkPhone,
        logout,
        refreshSession: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
