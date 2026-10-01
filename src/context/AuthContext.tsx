import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured, configureSupabase } from '../lib/supabase.ts';
import { UserProfile } from '../types.ts';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  phoneNumber?: string | null;
}

interface AuthContextType {
  user: AppUser | null;
  profile: UserProfile | null;
  loading: boolean;
  token: string | null;
  isAdmin: boolean;
  adminToken: string | null;
  signUpWithEmail: (data: { name: string; email: string; password: string; phone?: string }) => Promise<{ success: boolean; error?: string; suggestMode?: 'login' | 'signup' | 'forgot_password' }>;
  loginWithEmail: (credentials: { email: string; password: string }) => Promise<{ success: boolean; error?: string; isAdmin?: boolean; suggestMode?: 'login' | 'signup' | 'forgot_password' }>;
  loginWithGoogle: () => Promise<void>;
  loginAsAdmin: (credentials: { email?: string; password?: string; secretKey?: string }) => Promise<{ success: boolean; error?: string }>;
  logoutAdmin: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateLocalProfile: (data: Partial<UserProfile>) => void;
  sendForgotPasswordOtp: (email: string) => Promise<{ success: boolean; message?: string; error?: string; demoOtp?: string; expiresAt?: number; maskedEmail?: string; resetToken?: string }>;
  verifyForgotPasswordOtp: (email: string, otp: string, resetToken?: string) => Promise<{ success: boolean; message?: string; error?: string; resetToken?: string }>;
  resetPasswordWithOtp: (email: string, otp: string, newPassword: string, resetToken?: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to encode a client-side stateless token
function createClientSessionToken(data: { uid: string; email: string; name: string; role: string }): string {
  try {
    const payload = {
      ...data,
      iat: Date.now(),
      exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
    };
    return `gip_sess_${btoa(unescape(encodeURIComponent(JSON.stringify(payload))))}`;
  } catch {
    return `gip_sess_${btoa(JSON.stringify(data))}`;
  }
}

// Helper to decode a stateless token
function decodeClientSessionToken(token: string): { uid: string; email: string; name: string; role: string } | null {
  if (!token || !token.startsWith('gip_sess_')) return null;
  try {
    const b64 = token.replace('gip_sess_', '');
    const jsonStr = decodeURIComponent(escape(atob(b64)));
    return JSON.parse(jsonStr);
  } catch {
    try {
      const b64 = token.replace('gip_sess_', '');
      return JSON.parse(atob(b64));
    } catch {
      return null;
    }
  }
}

// Helper to check admin status
const checkIfAdmin = (email: string | null | undefined, role?: string): boolean => {
  if (!email) return role === 'admin';
  const clean = email.toLowerCase().trim();
  return (
    role === 'admin' ||
    clean === 'admin@grandimperialpalace.in' ||
    clean === 'davekaran2006@gmail.com' ||
    clean === 'admin@palace.com' ||
    clean === 'admin'
  );
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('grand_imperial_user_token');
    } catch {
      return null;
    }
  });
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('grand_imperial_admin_token');
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Authenticated fetch wrapper that attaches Bearer token & Admin token
  const apiFetch = async (url: string, options: RequestInit = {}) => {
    let currentToken = token;

    // Check if Supabase has fresh session token
    if (isSupabaseConfigured()) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          currentToken = session.access_token;
        }
      } catch (e) {
        console.warn('Failed to get Supabase session in apiFetch:', e);
      }
    }

    const headers = new Headers(options.headers || {});
    if (currentToken) {
      headers.set('Authorization', `Bearer ${currentToken}`);
    }
    if (adminToken) {
      headers.set('x-admin-token', adminToken);
    }
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    return fetch(url, {
      ...options,
      headers,
    });
  };

  // Helper to load or create profile for Supabase user
  const syncSupabaseProfile = async (supaUser: any, customName?: string, customPhone?: string) => {
    const cleanEmail = supaUser.email?.toLowerCase() || '';
    const isAdm = checkIfAdmin(cleanEmail);

    let loadedProfile: UserProfile | null = null;

    try {
      const { data: profileRow, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supaUser.id)
        .single();

      if (profileRow && !profileErr) {
        loadedProfile = {
          id: Date.now(),
          uid: supaUser.id,
          email: cleanEmail,
          name: profileRow.name || customName || supaUser.user_metadata?.name || cleanEmail.split('@')[0],
          role: profileRow.role || (isAdm ? 'admin' : 'guest'),
          phone: profileRow.phone || customPhone || supaUser.user_metadata?.phone || null,
          address: profileRow.address || null,
          country: profileRow.country || 'India',
          avatar: profileRow.avatar || supaUser.user_metadata?.avatar_url || null,
          loyaltyPoints: profileRow.loyalty_points || (isAdm ? 5000 : 100),
          createdAt: profileRow.created_at || new Date().toISOString(),
          updatedAt: profileRow.updated_at || new Date().toISOString(),
        };
      }
    } catch (err) {
      console.warn('Supabase profile query notice:', err);
    }

    if (!loadedProfile) {
      const fallbackName = customName || supaUser.user_metadata?.name || supaUser.user_metadata?.full_name || cleanEmail.split('@')[0];
      loadedProfile = {
        id: Date.now(),
        uid: supaUser.id,
        email: cleanEmail,
        name: fallbackName,
        role: isAdm ? 'admin' : 'guest',
        phone: customPhone || supaUser.user_metadata?.phone || null,
        address: null,
        country: 'India',
        avatar: supaUser.user_metadata?.avatar_url || supaUser.user_metadata?.picture || null,
        loyaltyPoints: isAdm ? 5000 : 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Upsert into Supabase profiles table
      try {
        await supabase.from('profiles').upsert({
          id: supaUser.id,
          name: loadedProfile.name,
          email: cleanEmail,
          role: loadedProfile.role,
          phone: loadedProfile.phone,
          loyalty_points: loadedProfile.loyaltyPoints,
          updated_at: new Date().toISOString(),
        });
      } catch (upsertErr) {
        console.warn('Supabase profile upsert notice:', upsertErr);
      }
    }

    const appUser: AppUser = {
      uid: supaUser.id,
      email: cleanEmail,
      displayName: loadedProfile.name,
      phoneNumber: loadedProfile.phone,
      photoURL: loadedProfile.avatar,
    };

    setUser(appUser);
    setProfile(loadedProfile);

    // Synchronize Google / Supabase user to backend database
    try {
      fetch('/api/auth/sync-oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: supaUser.id,
          email: cleanEmail,
          name: loadedProfile.name,
          avatar: loadedProfile.avatar,
          role: loadedProfile.role,
          phone: loadedProfile.phone,
        }),
      }).catch(() => null);
    } catch {}

    return { appUser, loadedProfile };
  };

  const [supabaseConfiguredState, setSupabaseConfiguredState] = useState(() => isSupabaseConfigured());

  // Restore stored session on mount
  useEffect(() => {
    const restoreSession = async () => {
      // 0. Auto-sync Supabase Config from Backend API if not statically configured
      try {
        const configRes = await fetch('/api/auth/config');
        if (configRes.ok) {
          const cfg = await configRes.json();
          if (cfg.supabaseUrl && cfg.supabaseAnonKey) {
            configureSupabase(cfg.supabaseUrl, cfg.supabaseAnonKey);
            setSupabaseConfiguredState(true);
          }
        }
      } catch {}

      // 1. Check Supabase active session
      if (isSupabaseConfigured()) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const cleanEmail = session.user.email?.toLowerCase() || '';
            const isAdm = checkIfAdmin(cleanEmail);

            setToken(session.access_token);
            try {
              localStorage.setItem('grand_imperial_user_token', session.access_token);
            } catch {}

            await syncSupabaseProfile(session.user);

            if (isAdm) {
              setAdminToken(session.access_token);
              try {
                localStorage.setItem('grand_imperial_admin_token', session.access_token);
              } catch {}
            }

            setLoading(false);
            return;
          }
        } catch (supabaseErr) {
          console.warn('Supabase session check notice:', supabaseErr);
        }
      }

      // 2. Fallback: Restore from stored JWT / Backend session
      const storedToken = localStorage.getItem('grand_imperial_user_token');
      const storedAdminToken = localStorage.getItem('grand_imperial_admin_token');

      if (storedToken) {
        let verified = false;
        try {
          const res = await fetch('/api/auth/me', {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          });

          if (res.ok) {
            const data = await res.json();
            setToken(storedToken);
            setProfile(data.profile || data.user);
            setUser({
              uid: data.user.uid,
              email: data.user.email,
              displayName: data.user.name || data.user.email?.split('@')[0],
              photoURL: data.profile?.avatar || data.user?.picture,
              phoneNumber: data.profile?.phone,
            });
            if (data.isAdmin || storedAdminToken) {
              setAdminToken(storedAdminToken || storedToken);
            }
            verified = true;
          }
        } catch (e) {
          console.warn('Session verification notice (server starting or offline):', e);
        }

        if (!verified) {
          // Fallback: decode local stateless session token
          const decoded = decodeClientSessionToken(storedToken);
          if (decoded && decoded.email) {
            const isAdm = checkIfAdmin(decoded.email, decoded.role);
            setToken(storedToken);
            setUser({
              uid: decoded.uid,
              email: decoded.email,
              displayName: decoded.name || decoded.email.split('@')[0],
            });
            setProfile({
              id: Date.now(),
              uid: decoded.uid,
              email: decoded.email,
              name: decoded.name || decoded.email.split('@')[0],
              role: isAdm ? 'admin' : 'guest',
              loyaltyPoints: isAdm ? 5000 : 100,
            } as any);
            if (isAdm || storedAdminToken) {
              setAdminToken(storedAdminToken || storedToken);
            }
          }
        }
      } else if (storedAdminToken) {
        try {
          const res = await fetch('/api/admin/verify', {
            headers: {
              'x-admin-token': storedAdminToken,
            },
          });
          if (res.ok) {
            setAdminToken(storedAdminToken);
            setUser({
              uid: 'admin_master_uid',
              email: 'admin@grandimperialpalace.in',
              displayName: 'Palace General Manager',
            });
            setProfile({
              id: 1,
              uid: 'admin_master_uid',
              email: 'admin@grandimperialpalace.in',
              name: 'Palace General Manager',
              role: 'admin',
              loyaltyPoints: 5000,
            } as any);
          } else {
            localStorage.removeItem('grand_imperial_admin_token');
            setAdminToken(null);
          }
        } catch (e) {
          console.warn('Admin token check:', e);
        }
      }

      setLoading(false);
    };

    restoreSession();
  }, []);

  // Supabase Auth State Change Listener (Handles OAuth redirects & auto-refresh)
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION')) {
        const cleanEmail = session.user.email?.toLowerCase() || '';
        const isAdm = checkIfAdmin(cleanEmail);

        setToken(session.access_token);
        try {
          localStorage.setItem('grand_imperial_user_token', session.access_token);
        } catch (e) {
          console.warn(e);
        }

        await syncSupabaseProfile(session.user);

        if (isAdm) {
          setAdminToken(session.access_token);
          try {
            localStorage.setItem('grand_imperial_admin_token', session.access_token);
          } catch {}
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setToken(null);
        setAdminToken(null);
        try {
          localStorage.removeItem('grand_imperial_user_token');
          localStorage.removeItem('grand_imperial_admin_token');
        } catch {}
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabaseConfiguredState]);

  // Sign Up with Email & Password (Pure Supabase Auth + Database sync)
  const signUpWithEmail = async (data: { name: string; email: string; password: string; phone?: string }) => {
    try {
      setLoading(true);
      const cleanEmail = data.email.trim().toLowerCase();
      const isAdm = checkIfAdmin(cleanEmail);
      let sessionToken: string | null = null;
      let userProfile: UserProfile | null = null;
      let userUid: string | null = null;
      let alreadyExistsError: string | null = null;

      // 1. Backend Database Registration Check
      try {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.name.trim(),
            email: cleanEmail,
            password: data.password.trim(),
            phone: data.phone?.trim(),
          }),
        });

        const resData = await res.json();
        if (res.status === 409 || resData.code === 'USER_ALREADY_EXISTS' || resData.error?.toLowerCase().includes('already exists')) {
          alreadyExistsError = resData.error || 'An account with this email address already exists. Please sign in instead.';
        } else if (res.ok && resData.success) {
          sessionToken = resData.token;
          userProfile = resData.profile;
          userUid = resData.user?.uid;
        }
      } catch (backendErr) {
        console.warn('Backend sign-up endpoint notice:', backendErr);
      }

      if (alreadyExistsError) {
        return {
          success: false,
          error: 'An account with this email address already exists. Please sign in instead.',
          suggestMode: 'login',
        };
      }

      // 2. Supabase Auth Registration
      if (isSupabaseConfigured()) {
        try {
          const { data: supaData, error: supaError } = await supabase.auth.signUp({
            email: cleanEmail,
            password: data.password.trim(),
            options: {
              data: {
                name: data.name.trim(),
                phone: data.phone?.trim() || null,
              },
            },
          });

          if (supaError) {
            if (supaError.message?.toLowerCase().includes('already registered')) {
              return {
                success: false,
                error: 'An account with this email address already exists. Please sign in instead.',
                suggestMode: 'login',
              };
            }
            console.warn('Supabase sign-up notice:', supaError.message);
          } else if (supaData?.user) {
            userUid = supaData.user.id;
            if (supaData.session?.access_token) {
              sessionToken = supaData.session.access_token;
            }

            // Sync profile
            const synced = await syncSupabaseProfile(supaData.user, data.name.trim(), data.phone?.trim());
            userProfile = synced.loadedProfile;
          }
        } catch (err: any) {
          console.warn('Supabase sign-up exception:', err);
        }
      }

      const uid = userUid || userProfile?.uid || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      if (!sessionToken) {
        sessionToken = createClientSessionToken({
          uid,
          email: cleanEmail,
          name: data.name,
          role: isAdm ? 'admin' : 'guest',
        });
      }

      if (!userProfile) {
        userProfile = {
          id: Date.now(),
          uid,
          email: cleanEmail,
          name: data.name,
          phone: data.phone || null,
          address: null,
          country: 'India',
          avatar: null,
          role: isAdm ? 'admin' : 'guest',
          loyaltyPoints: isAdm ? 5000 : 100,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      setToken(sessionToken);
      try {
        localStorage.setItem('grand_imperial_user_token', sessionToken);
      } catch (err) {
        console.warn(err);
      }

      const appUser: AppUser = {
        uid,
        email: cleanEmail,
        displayName: data.name,
        phoneNumber: data.phone || null,
        photoURL: null,
      };

      setUser(appUser);
      setProfile(userProfile);

      if (isAdm) {
        setAdminToken(sessionToken);
        try {
          localStorage.setItem('grand_imperial_admin_token', sessionToken);
        } catch (err) {
          console.warn(err);
        }
      }

      // Notify window of auth state update
      window.dispatchEvent(new CustomEvent('auth:change', { detail: { user: appUser, profile: userProfile } }));

      return { success: true };
    } catch (err: any) {
      console.error('Sign up error:', err);
      return { success: false, error: err.message || 'Error during sign up.' };
    } finally {
      setLoading(false);
    }
  };

  // Login with Email & Password (Pure Supabase Auth + Database API)
  const loginWithEmail = async (credentials: { email: string; password: string }) => {
    try {
      setLoading(true);
      const cleanEmail = credentials.email.trim().toLowerCase();
      let isAdm = checkIfAdmin(cleanEmail);

      let authSuccess = false;
      let sessionToken: string | null = null;
      let userUid: string | null = null;
      let loadedProfile: UserProfile | null = null;
      let backendErrorData: { error: string; code?: string; suggestMode?: 'login' | 'signup' | 'forgot_password' } | null = null;

      // 1. Try Supabase Auth Login
      if (isSupabaseConfigured()) {
        try {
          const { data: supaData, error: supaError } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: credentials.password,
          });

          if (!supaError && supaData?.user) {
            authSuccess = true;
            userUid = supaData.user.id;
            sessionToken = supaData.session?.access_token || null;

            const synced = await syncSupabaseProfile(supaData.user);
            loadedProfile = synced.loadedProfile;
            if (loadedProfile.role === 'admin') isAdm = true;
          }
        } catch (supaErr) {
          console.warn('Supabase login notice:', supaErr);
        }
      }

      // 2. Primary / Fallback: Authenticate with Backend Database API (/api/auth/login)
      if (!authSuccess) {
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail, password: credentials.password }),
          });

          const backendData = await res.json();
          if (res.ok && backendData.success) {
            authSuccess = true;
            sessionToken = backendData.token;
            loadedProfile = backendData.profile || backendData.user;
            userUid = backendData.user?.uid || backendData.profile?.uid;
            if (backendData.isAdmin) isAdm = true;
          } else if (!res.ok) {
            backendErrorData = {
              error: backendData.error || 'Authentication error',
              code: backendData.code,
              suggestMode: backendData.suggestMode,
            };
          }
        } catch (backendErr) {
          console.warn('Backend login endpoint notice:', backendErr);
        }
      }

      // 3. Fallback for Master Admin login with designated ImperialAdmin key
      if (!authSuccess) {
        const pass = credentials.password.trim();
        const validAdminKeys = ['ImperialAdmin', 'ImperialAdmin2026!'];
        if ((cleanEmail === 'admin@grandimperialpalace.in' || cleanEmail === 'davekaran2006@gmail.com') && validAdminKeys.includes(pass)) {
          isAdm = true;
          userUid = 'admin_master_uid';
          sessionToken = createClientSessionToken({
            uid: 'admin_master_uid',
            email: cleanEmail,
            name: 'Palace General Manager',
            role: 'admin',
          });
          loadedProfile = {
            id: 1,
            uid: 'admin_master_uid',
            email: cleanEmail,
            name: 'Palace General Manager',
            role: 'admin',
            phone: '+91 22 6665 3300',
            address: '108 Heritage Bay, Mumbai',
            country: 'India',
            avatar: null,
            loyaltyPoints: 5000,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          authSuccess = true;
        }
      }

      if (authSuccess) {
        const uid = userUid || loadedProfile?.uid || `usr_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const finalToken = sessionToken || createClientSessionToken({
          uid,
          email: cleanEmail,
          name: loadedProfile?.name || cleanEmail.split('@')[0],
          role: isAdm ? 'admin' : 'guest',
        });

        if (!loadedProfile) {
          const namePart = cleanEmail.split('@')[0];
          const displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
          loadedProfile = {
            id: Date.now(),
            uid,
            email: cleanEmail,
            name: displayName,
            role: isAdm ? 'admin' : 'guest',
            phone: null,
            address: null,
            country: 'India',
            avatar: null,
            loyaltyPoints: isAdm ? 5000 : 250,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }

        setToken(finalToken);
        try {
          localStorage.setItem('grand_imperial_user_token', finalToken);
        } catch (err) {
          console.warn(err);
        }

        const appUser: AppUser = {
          uid,
          email: cleanEmail,
          displayName: loadedProfile.name || cleanEmail.split('@')[0],
          phoneNumber: loadedProfile.phone || null,
          photoURL: loadedProfile.avatar || null,
        };

        setUser(appUser);
        setProfile(loadedProfile);

        if (isAdm) {
          setAdminToken(finalToken);
          try {
            localStorage.setItem('grand_imperial_admin_token', finalToken);
          } catch (err) {
            console.warn(err);
          }
        }

        // Notify window of auth state update
        window.dispatchEvent(new CustomEvent('auth:change', { detail: { user: appUser, profile: loadedProfile } }));

        return { success: true, isAdmin: isAdm };
      }

      if (backendErrorData) {
        return {
          success: false,
          error: backendErrorData.error,
          suggestMode: backendErrorData.suggestMode,
        };
      }

      return {
        success: false,
        error: 'No account found with this email address. Please create a new account by signing up.',
        suggestMode: 'signup',
      };
    } catch (err: any) {
      console.error('Login error:', err);
      return { success: false, error: err.message || 'Error during login.' };
    } finally {
      setLoading(false);
    }
  };

  // Admin Portal Login
  const loginAsAdmin = async (credentials: { email?: string; password?: string; secretKey?: string }) => {
    try {
      const pass = credentials.password || credentials.secretKey || '';
      const email = credentials.email || 'admin@grandimperialpalace.in';

      // 1. Try server admin login
      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.token) {
            setAdminToken(data.token);
            setToken(data.token);
            try {
              localStorage.setItem('grand_imperial_admin_token', data.token);
              localStorage.setItem('grand_imperial_user_token', data.token);
            } catch (err) {
              console.warn('Could not persist admin token to localStorage:', err);
            }

            const appUser: AppUser = {
              uid: 'admin_master_uid',
              email: credentials.email || 'admin@grandimperialpalace.in',
              displayName: 'Palace General Manager',
            };
            const appProfile: UserProfile = {
              id: 1,
              uid: 'admin_master_uid',
              email: credentials.email || 'admin@grandimperialpalace.in',
              name: 'Palace General Manager',
              role: 'admin',
              loyaltyPoints: 5000,
            } as any;

            setUser(appUser);
            setProfile(appProfile);

            window.dispatchEvent(new CustomEvent('auth:change', { detail: { user: appUser, profile: appProfile } }));

            return { success: true };
          }
        }
      } catch {
        // Backend not reached, fall back
      }

      // 2. Local Admin Key Validation (only for recognized admin key and admin email)
      const validAdminKeys = ['ImperialAdmin', 'ImperialAdmin2026!'];
      if (validAdminKeys.includes(pass) && (email.toLowerCase() === 'admin@grandimperialpalace.in' || email.toLowerCase() === 'davekaran2006@gmail.com')) {
        const tokenStr = createClientSessionToken({
          uid: 'admin_master_uid',
          email,
          name: 'Palace General Manager',
          role: 'admin',
        });
        setAdminToken(tokenStr);
        setToken(tokenStr);
        try {
          localStorage.setItem('grand_imperial_admin_token', tokenStr);
          localStorage.setItem('grand_imperial_user_token', tokenStr);
        } catch (err) {
          console.warn(err);
        }

        const appUser: AppUser = {
          uid: 'admin_master_uid',
          email: email,
          displayName: 'Palace General Manager',
        };
        const appProfile: UserProfile = {
          id: 1,
          uid: 'admin_master_uid',
          email: email,
          name: 'Palace General Manager',
          role: 'admin',
          loyaltyPoints: 5000,
        } as any;

        setUser(appUser);
        setProfile(appProfile);

        window.dispatchEvent(new CustomEvent('auth:change', { detail: { user: appUser, profile: appProfile } }));

        return { success: true };
      }

      return { success: false, error: 'Invalid master key or credentials.' };
    } catch (err: any) {
      console.error('Admin login error:', err);
      return { success: false, error: err.message || 'Network error during admin login' };
    }
  };

  const logoutAdmin = async () => {
    try {
      if (adminToken) {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: adminToken }),
        });
      }
    } catch (e) {
      console.warn('Error during admin logout:', e);
    } finally {
      setAdminToken(null);
      try {
        localStorage.removeItem('grand_imperial_admin_token');
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const refreshProfile = async () => {
    if (user?.uid && isSupabaseConfigured()) {
      try {
        const { data: profileRow } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.uid)
          .single();

        if (profileRow) {
          setProfile((prev) => ({
            ...prev,
            id: prev?.id || Date.now(),
            uid: user.uid,
            email: user.email || '',
            name: profileRow.name || user.displayName || '',
            role: profileRow.role || 'guest',
            phone: profileRow.phone || null,
            address: profileRow.address || null,
            country: profileRow.country || 'India',
            avatar: profileRow.avatar || null,
            loyaltyPoints: profileRow.loyalty_points || 100,
            createdAt: profileRow.created_at || new Date().toISOString(),
            updatedAt: profileRow.updated_at || new Date().toISOString(),
          }));
          return;
        }
      } catch (e) {
        console.warn('Supabase refresh profile:', e);
      }
    }

    if (!token) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile || data.user);
      }
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  };

  const updateLocalProfile = (data: Partial<UserProfile>) => {
    if (profile) {
      const updated = { ...profile, ...data };
      setProfile(updated);
      window.dispatchEvent(new CustomEvent('auth:change', { detail: { user, profile: updated } }));
    }
  };

  // Google OAuth Login via Supabase
  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      if (!isSupabaseConfigured()) {
        try {
          const configRes = await fetch('/api/auth/config');
          if (configRes.ok) {
            const cfg = await configRes.json();
            if (cfg.supabaseUrl && cfg.supabaseAnonKey) {
              configureSupabase(cfg.supabaseUrl, cfg.supabaseAnonKey);
            }
          }
        } catch {}
      }

      if (isSupabaseConfigured()) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (error) throw error;
      } else {
        throw new Error('Supabase URL & Anon Key not found. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your Vercel Environment Variables.');
      }
    } catch (error: any) {
      console.error('Google Sign In Error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Send Forgot Password OTP
  const sendForgotPasswordOtp = async (email: string) => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await fetch('/api/auth/forgot-password/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to send password reset code.' };
      }

      return {
        success: true,
        message: data.message,
        demoOtp: data.demoOtp,
        expiresAt: data.expiresAt,
        maskedEmail: data.maskedEmail,
        resetToken: data.resetToken,
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error while requesting password reset OTP.' };
    }
  };

  // Verify Forgot Password OTP
  const verifyForgotPasswordOtp = async (email: string, otp: string, resetToken?: string) => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await fetch('/api/auth/forgot-password/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, otp: otp.trim(), resetToken }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Invalid or expired verification code.' };
      }

      return { success: true, message: data.message, resetToken: data.resetToken || resetToken };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error while verifying OTP code.' };
    }
  };

  // Reset Password with OTP
  const resetPasswordWithOtp = async (email: string, otp: string, newPassword: string, resetToken?: string) => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await fetch('/api/auth/forgot-password/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          otp: otp.trim(),
          newPassword: newPassword.trim(),
          resetToken,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to reset password.' };
      }

      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error while resetting password.' };
    }
  };

  const logout = async () => {
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut().catch(() => null);
      }
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        }).catch(() => null);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setProfile(null);
      setToken(null);
      setAdminToken(null);
      try {
        localStorage.removeItem('grand_imperial_user_token');
        localStorage.removeItem('grand_imperial_admin_token');
      } catch (err) {
        console.warn(err);
      }
      window.dispatchEvent(new CustomEvent('auth:change', { detail: { user: null, profile: null } }));
    }
  };

  const isAdmin = Boolean(
    adminToken ||
    profile?.role === 'admin' ||
    checkIfAdmin(user?.email, profile?.role)
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        token,
        isAdmin,
        adminToken,
        signUpWithEmail,
        loginWithEmail,
        loginWithGoogle,
        loginAsAdmin,
        logoutAdmin,
        logout,
        refreshProfile,
        updateLocalProfile,
        sendForgotPasswordOtp,
        verifyForgotPasswordOtp,
        resetPasswordWithOtp,
        apiFetch,
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
