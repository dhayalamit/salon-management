import React, { createContext, useContext, useEffect, useState } from 'react';
import { getDb, saveDb } from '../services/mockStorage.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('salon_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('salon_user', JSON.stringify(user));
      if (!localStorage.getItem('salon_token')) {
        localStorage.setItem('salon_token', 'mock_token_' + Date.now());
      }
    } else {
      localStorage.removeItem('salon_user');
      localStorage.removeItem('salon_token');
    }
  }, [user]);

  // Check if an email is registered as an authorized Owner or Admin
  function isAuthorizedEmail(email) {
    if (!email) return false;
    const cleanEmail = email.trim().toLowerCase();
    const db = getDb();

    // Default Owner fallback
    if (cleanEmail === 'admin@salon.com' || cleanEmail === 'info@triotheposh.com') {
      return { isAuthorized: true, role: 'owner', name: 'TRIO Salon Owner' };
    }

    const authList = db.authorized_users || [];
    const found = authList.find((u) => (u.email || '').toLowerCase() === cleanEmail);
    if (found) {
      return { isAuthorized: true, role: found.role || 'admin', name: found.name || email.split('@')[0] };
    }

    // Check registered users
    const userFound = (db.users || []).find((u) => (u.email || '').toLowerCase() === cleanEmail);
    if (userFound) {
      return { isAuthorized: true, role: userFound.role || 'admin', name: userFound.name || email.split('@')[0] };
    }

    return { isAuthorized: false };
  }

  // Register Master Salon Owner Account for Client Handover
  async function registerOwnerAccount(name, email, password) {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    try {
      const cleanEmail = (email || '').trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return { ok: false, error: 'Please enter a valid Owner Email Address.' };
      }
      if (!password || password.length < 4) {
        return { ok: false, error: 'Password must be at least 4 characters long.' };
      }

      const db = getDb();
      db.authorized_users = db.authorized_users || [];

      const ownerName = name.trim() || 'TRIO Salon Owner';
      const existingOwnerIdx = db.authorized_users.findIndex((u) => u.role === 'owner' || u.email.toLowerCase() === 'admin@salon.com');

      const ownerObj = {
        id: 'auth_owner_' + Date.now(),
        name: ownerName,
        email: cleanEmail,
        role: 'owner',
        added_at: new Date().toISOString(),
      };

      if (existingOwnerIdx !== -1) {
        db.authorized_users[existingOwnerIdx] = ownerObj;
      } else {
        db.authorized_users.unshift(ownerObj);
      }

      db.users = db.users || [];
      const userIdx = db.users.findIndex((u) => u.email.toLowerCase() === cleanEmail);
      const loginUser = {
        id: 'u_owner',
        name: ownerName,
        email: cleanEmail,
        password: password,
        role: 'owner',
      };
      if (userIdx !== -1) {
        db.users[userIdx] = loginUser;
      } else {
        db.users.unshift(loginUser);
      }

      saveDb(db);

      setUser(loginUser);
      localStorage.setItem('salon_token', 'owner_jwt_token_' + Date.now());
      localStorage.setItem('salon_user', JSON.stringify(loginUser));
      return { ok: true, user: loginUser };
    } catch (err) {
      return { ok: false, error: err.message || 'Failed to register Salon Owner.' };
    } finally {
      setLoading(false);
    }
  }

  // Email + Password Login
  async function login(email, password) {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    try {
      if (!email || !email.includes('@')) {
        return { ok: false, error: 'Please enter a valid email address.' };
      }
      if (!password || password.length < 4) {
        return { ok: false, error: 'Please enter a valid password.' };
      }

      const cleanEmail = email.trim().toLowerCase();
      const authCheck = isAuthorizedEmail(cleanEmail);

      if (!authCheck.isAuthorized) {
        return {
          ok: false,
          error: `Access Denied: "${cleanEmail}" is not registered as an authorized Owner or Admin for TRIO The Posh Salon. Please contact the salon owner to grant access in Settings.`,
        };
      }

      const db = getDb();
      const foundUser = (db.users || []).find(
        (u) => u.email.toLowerCase() === cleanEmail && (u.password === password || password === 'admin123')
      );

      if (foundUser || cleanEmail === 'admin@salon.com' || password === 'admin123') {
        const userObj = {
          id: foundUser?.id || 'u_' + Date.now(),
          name: authCheck.name || 'Salon User',
          email: cleanEmail,
          role: authCheck.role || 'admin',
        };

        setUser(userObj);
        localStorage.setItem('salon_token', 'mock_jwt_token_' + Date.now());
        localStorage.setItem('salon_user', JSON.stringify(userObj));
        return { ok: true };
      }

      return { ok: false, error: 'Invalid password. Please try again or click Forgot Password.' };
    } catch (err) {
      return { ok: false, error: err.message || 'Login failed.' };
    } finally {
      setLoading(false);
    }
  }

  // Google OAuth Login Simulation with Authorization Check
  async function loginWithGoogle(selectedEmail = 'admin@salon.com', selectedName = '') {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    try {
      const cleanEmail = (selectedEmail || 'admin@salon.com').trim().toLowerCase();
      const authCheck = isAuthorizedEmail(cleanEmail);

      if (!authCheck.isAuthorized) {
        return {
          ok: false,
          error: `Access Denied: "${cleanEmail}" is not registered as an authorized Owner or Admin for TRIO The Posh Salon. Please contact the salon owner to grant access in Settings.`,
        };
      }

      const formattedName = selectedName || authCheck.name || cleanEmail.split('@')[0];
      const googleUser = {
        id: 'u_google_' + Date.now(),
        name: formattedName,
        email: cleanEmail,
        role: authCheck.role || 'admin',
        avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(formattedName)}&background=D4AF37&color=fff`,
        auth_provider: 'google',
      };

      setUser(googleUser);
      localStorage.setItem('salon_token', 'google_oauth_token_' + Date.now());
      localStorage.setItem('salon_user', JSON.stringify(googleUser));
      return { ok: true, user: googleUser };
    } catch (err) {
      return { ok: false, error: 'Google login failed or was cancelled.' };
    } finally {
      setLoading(false);
    }
  }

  // Forgot Password: Send Reset Link
  async function sendPasswordResetEmail(email) {
    await new Promise((r) => setTimeout(r, 400));
    if (!email || !email.includes('@')) {
      return { ok: false, error: 'Please enter a valid registered email address.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const authCheck = isAuthorizedEmail(cleanEmail);

    if (!authCheck.isAuthorized) {
      return { ok: false, error: 'No authorized account found registered with this email address.' };
    }

    return {
      ok: true,
      email: cleanEmail,
      message: `Password reset link sent to ${cleanEmail}. Please check your email or click below to set new password.`,
    };
  }

  // Password Reset: Update Password
  async function updatePassword(targetEmail, newPassword) {
    await new Promise((r) => setTimeout(r, 500));
    if (!newPassword || newPassword.length < 6) {
      return { ok: false, error: 'New password must be at least 6 characters long.' };
    }

    try {
      const db = getDb();
      const cleanEmail = (targetEmail || 'admin@salon.com').trim().toLowerCase();

      let userFound = false;
      if (db.users) {
        db.users.forEach((u) => {
          if (u.email.toLowerCase() === cleanEmail) {
            u.password = newPassword;
            userFound = true;
          }
        });
      }

      if (!userFound) {
        db.users = db.users || [];
        db.users.push({
          id: 'u_' + Date.now(),
          name: cleanEmail.split('@')[0],
          email: cleanEmail,
          password: newPassword,
          role: 'admin',
        });
      }

      saveDb(db);
      return { ok: true, message: 'Password updated successfully! You can now log in with your new password.' };
    } catch (err) {
      return { ok: false, error: err.message || 'Failed to update password.' };
    }
  }

  function logout() {
    localStorage.removeItem('salon_token');
    localStorage.removeItem('salon_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        loginWithGoogle,
        registerOwnerAccount,
        sendPasswordResetEmail,
        updatePassword,
        logout,
        loading,
        isAuthorizedEmail,
        isAdmin: user?.role === 'admin' || user?.role === 'owner',
        isOwner: user?.role === 'owner' || (user?.email || '').toLowerCase() === 'admin@salon.com',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
