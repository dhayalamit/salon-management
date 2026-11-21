import React, { createContext, useContext, useEffect, useState } from 'react';
import { getDb, saveDb, createCleanTenantDb } from '../services/mockStorage.js';

const AuthContext = createContext(null);
const GLOBAL_USERS_KEY = 'salon_global_users_v1';

function getGlobalUsers() {
  try {
    const raw = localStorage.getItem(GLOBAL_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveGlobalUsers(users) {
  localStorage.setItem(GLOBAL_USERS_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem('salon_token');
      const stored = localStorage.getItem('salon_user');
      if (!token || !stored || stored === 'undefined' || stored === 'null') {
        return null;
      }
      return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to parse salon_user from localStorage, resetting:', e);
      localStorage.removeItem('salon_user');
      localStorage.removeItem('salon_token');
      return null;
    }
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

  // Check if an email is registered as an authorized Owner or Staff
  function isAuthorizedEmail(email) {
    if (!email) return false;
    const cleanEmail = email.trim().toLowerCase();

    // Default Demo Owner
    if (cleanEmail === 'admin@salon.com' || cleanEmail === 'owner@salon.com' || cleanEmail === 'info@triotheposh.com') {
      return { isAuthorized: true, role: 'owner', name: 'TRIO Salon Owner' };
    }

    // Default Demo Staff
    if (cleanEmail === 'staff@salon.com' || cleanEmail === 'stylist@salon.com') {
      return { isAuthorized: true, role: 'staff', name: 'Rahul Sharma (Stylist)' };
    }

    // Check Global Users registry
    const globalUsers = getGlobalUsers();
    const globalMatch = globalUsers.find((u) => (u.email || '').toLowerCase() === cleanEmail);
    if (globalMatch) {
      return { isAuthorized: true, role: globalMatch.role || 'owner', name: globalMatch.name };
    }

    const db = getDb();
    const authList = db.authorized_users || [];
    const found = authList.find((u) => (u.email || '').toLowerCase() === cleanEmail);
    if (found) {
      return { isAuthorized: true, role: found.role || 'owner', name: found.name || email.split('@')[0] };
    }

    const staffFound = (db.staff || []).find(
      (s) =>
        (s.email && s.email.toLowerCase() === cleanEmail) ||
        (s.phone && s.phone.replace(/\D/g, '') === cleanEmail.replace(/\D/g, ''))
    );
    if (staffFound) {
      return { isAuthorized: true, role: 'staff', name: staffFound.name };
    }

    return { isAuthorized: false };
  }

  // Register exclusively as a new Salon Owner with their own clean isolated database
  async function signupOwner({ salonName, name, email, phone = '', password }) {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 450));
    try {
      const cleanName = (name || '').trim();
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanPhone = (phone || '').trim();
      const cleanSalonName = (salonName || '').trim() || `${cleanName}'s Salon`;

      if (!cleanSalonName) {
        return { ok: false, error: 'Please enter your Salon Name.' };
      }
      if (!cleanName) {
        return { ok: false, error: 'Please enter your Full Name.' };
      }
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return { ok: false, error: 'Please enter a valid email address.' };
      }
      if (!password || password.length < 4) {
        return { ok: false, error: 'Password must be at least 4 characters long.' };
      }

      // Ensure email does not collide with reserved demo accounts
      if (cleanEmail === 'admin@salon.com' || cleanEmail === 'owner@salon.com' || cleanEmail === 'staff@salon.com') {
        return { ok: false, error: 'This email is reserved for demo access. Please use your personal or business email.' };
      }

      const globalUsers = getGlobalUsers();
      if (globalUsers.some((u) => (u.email || '').toLowerCase() === cleanEmail)) {
        return { ok: false, error: `An account with "${cleanEmail}" is already registered. Please Sign In.` };
      }

      const newOwner = {
        id: 'u_' + Date.now(),
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        password: password,
        role: 'owner',
        salon_id: cleanEmail,
        salon_name: cleanSalonName,
      };

      globalUsers.push(newOwner);
      saveGlobalUsers(globalUsers);

      // Create isolated tenant database with 0 foreign staff, 0 visits, and clean settings
      const tenantDb = createCleanTenantDb(newOwner);
      const tenantKey = 'salon_db_tenant_' + encodeURIComponent(cleanEmail);
      localStorage.setItem(tenantKey, JSON.stringify(tenantDb));

      setUser(newOwner);
      localStorage.setItem('salon_token', 'jwt_owner_' + Date.now());
      localStorage.setItem('salon_user', JSON.stringify(newOwner));

      return { ok: true, user: newOwner };
    } catch (err) {
      return { ok: false, error: err.message || 'Failed to register Salon Owner account.' };
    } finally {
      setLoading(false);
    }
  }

  // Backwards compatibility alias for signup
  async function signup(params) {
    return signupOwner(params);
  }

  // Email / Phone + Password Login with Strict Role Enforcement
  async function login(identifier, password, portalMode = 'owner') {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    try {
      if (!identifier) {
        return {
          ok: false,
          error: portalMode === 'owner' ? 'Please enter your Salon Owner Email.' : 'Please enter your Staff Email or Phone.',
        };
      }
      if (!password) {
        return { ok: false, error: 'Please enter your password.' };
      }

      const cleanInput = identifier.trim().toLowerCase();

      // 1. Built-in Demo Owner Login
      if (cleanInput === 'admin@salon.com' || cleanInput === 'owner@salon.com') {
        if (portalMode === 'staff') {
          return {
            ok: false,
            error: 'This is a Salon Owner account. Please select "👑 Salon Owner" above to login.',
          };
        }
        if (password !== 'admin123' && password !== 'owner123') {
          return { ok: false, error: 'Incorrect password for Salon Owner Demo. Use "admin123".' };
        }
        const userObj = {
          id: 'u_owner',
          name: 'TRIO Salon Owner',
          email: 'admin@salon.com',
          role: 'owner',
          salon_id: 'default',
          salon_name: 'TRIO THE POSH',
        };
        setUser(userObj);
        localStorage.setItem('salon_token', 'jwt_owner_' + Date.now());
        localStorage.setItem('salon_user', JSON.stringify(userObj));
        return { ok: true, user: userObj };
      }

      // 2. Built-in Demo Staff Login
      if (cleanInput === 'staff@salon.com') {
        if (portalMode === 'owner') {
          return {
            ok: false,
            error: 'staff@salon.com is a Staff account. Please select "✂️ Staff Portal" above to login.',
          };
        }
        if (password !== 'staff123') {
          return { ok: false, error: 'Incorrect password for Staff Demo. Use "staff123".' };
        }
        const userObj = {
          id: 'u_staff',
          name: 'Rahul Sharma (Stylist)',
          email: 'staff@salon.com',
          role: 'staff',
          salon_id: 'default',
          salon_name: 'TRIO THE POSH',
        };
        setUser(userObj);
        localStorage.setItem('salon_token', 'jwt_staff_' + Date.now());
        localStorage.setItem('salon_user', JSON.stringify(userObj));
        return { ok: true, user: userObj };
      }

      // 3. Registered Global Users Search
      const globalUsers = getGlobalUsers();
      const matched = globalUsers.find(
        (u) =>
          (u.email || '').toLowerCase() === cleanInput ||
          (u.phone && u.phone.replace(/\D/g, '') === cleanInput.replace(/\D/g, ''))
      );

      if (matched) {
        if (matched.password && matched.password !== password) {
          return { ok: false, error: 'Incorrect password. Please try again.' };
        }

        if (portalMode === 'staff' && matched.role === 'owner') {
          return {
            ok: false,
            error: `"${matched.email}" is a Salon Owner account. Please switch to "👑 Salon Owner" tab to log in.`,
          };
        }
        if (portalMode === 'owner' && matched.role === 'staff') {
          return {
            ok: false,
            error: `"${matched.email}" is a Staff account. Please switch to "✂️ Staff Portal" tab to log in.`,
          };
        }

        setUser(matched);
        localStorage.setItem('salon_token', 'jwt_' + matched.role + '_' + Date.now());
        localStorage.setItem('salon_user', JSON.stringify(matched));
        return { ok: true, user: matched };
      }

      // 4. Search inside tenant databases for staff accounts created by an owner
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('salon_db_tenant_')) {
          try {
            const tenantDb = JSON.parse(localStorage.getItem(key));
            const staffMatch = (tenantDb.staff || []).find(
              (s) =>
                (s.email && s.email.toLowerCase() === cleanInput) ||
                (s.phone && s.phone.replace(/\D/g, '') === cleanInput.replace(/\D/g, ''))
            );
            if (staffMatch) {
              if (portalMode === 'owner') {
                return {
                  ok: false,
                  error: `"${cleanInput}" is a Staff Stylist. Please switch to "✂️ Staff Portal" to log in.`,
                };
              }
              const staffUser = {
                id: staffMatch.id,
                name: staffMatch.name,
                email: staffMatch.email || cleanInput,
                phone: staffMatch.phone,
                role: 'staff',
                salon_id: tenantDb.settings?.email || key.replace('salon_db_tenant_', ''),
                salon_name: tenantDb.settings?.salon_name || 'Salon',
              };
              setUser(staffUser);
              localStorage.setItem('salon_token', 'jwt_staff_' + Date.now());
              localStorage.setItem('salon_user', JSON.stringify(staffUser));
              return { ok: true, user: staffUser };
            }
          } catch (e) {}
        }
      }

      return {
        ok: false,
        error: `No registered account found for "${cleanInput}". If you are a Salon Owner, please click "Register Salon" to create your account. Staff accounts must be created by their Salon Owner.`,
      };
    } catch (err) {
      return { ok: false, error: err.message || 'Login failed.' };
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
      const cleanEmail = (targetEmail || 'admin@salon.com').trim().toLowerCase();
      const globalUsers = getGlobalUsers();
      const idx = globalUsers.findIndex((u) => (u.email || '').toLowerCase() === cleanEmail);
      if (idx !== -1) {
        globalUsers[idx].password = newPassword;
        saveGlobalUsers(globalUsers);
      }

      const db = getDb();
      if (db.users) {
        db.users.forEach((u) => {
          if ((u.email || '').toLowerCase() === cleanEmail) {
            u.password = newPassword;
          }
        });
        saveDb(db);
      }

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

  const isOwner = user?.role === 'owner' || user?.role === 'admin';
  const isStaff = user?.role === 'staff';

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        signup,
        signupOwner,
        sendPasswordResetEmail,
        updatePassword,
        logout,
        loading,
        isAuthorizedEmail,
        isOwner,
        isAdmin: isOwner, // Backwards-compatible alias so existing components don't break
        isStaff,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
