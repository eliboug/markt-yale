import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { authService } from '../services/authService';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // TEMPORARILY DISABLED YALE EMAIL RESTRICTION FOR TESTING
      if (user && user.email && user.emailVerified) {
        setUser(user);
        setLoading(false);
      } else if (user && user.email && false) { // Disabled Yale check
        // Sign out non-Yale users
        authService.signOut();
        setUser(null);
      } else if (user && user.email && !user.emailVerified) {
        // User exists but email not verified - don't set as authenticated
        setUser(null);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email, password, displayName) => {
    try {
      setLoading(true);
      const result = await authService.signUp(email, password, displayName);
      return result;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      const user = await authService.signIn(email, password);
      return user;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resendEmailVerification = async () => {
    try {
      await authService.resendEmailVerification();
      return true;
    } catch (error) {
      console.error('Resend verification error:', error);
      throw error;
    }
  };

  const checkEmailVerification = async () => {
    try {
      return await authService.checkEmailVerification();
    } catch (error) {
      console.error('Check verification error:', error);
      return false;
    }
  };

  const signOut = async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    resendEmailVerification,
    checkEmailVerification
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
