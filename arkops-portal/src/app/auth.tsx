/**
 * Authentication and authorization provider for AllMall portal.
 *
 * Manages:
 * - User session lifecycle (login/logout/token refresh)
 * - Role-based access control
 * - Session persistence via secure token storage
 *
 * For the prototype phase, a mock JWT token is generated on login.
 * In production, this will be replaced with server-issued tokens via OAuth 2.0 / OIDC.
 *
 * Author: AI Optimization
 * Created: 2026-07-16 (refactored from original auth.tsx)
 */

import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type { PropsWithChildren } from 'react';
import type { Role } from './rolePermissions';
import { LOCAL_LOGIN_ACCOUNTS } from './loginAccounts';
import {
  storeTokens,
  clearSession,
  createMockToken,
  shouldRefreshToken,
  getRefreshToken,
  type SessionUser,
  type SessionTokens,
} from './session';

const AUTH_STORAGE_KEY = 'allmall-current-role';
const SESSION_USER_KEY = 'allmall-session-user';
const SESSION_DEPLOYMENT_KEY = 'allmall-session-deployment';

const MOCK_USERS = Object.fromEntries(
  LOCAL_LOGIN_ACCOUNTS.map(account => [account.email, { password: account.password, user: account.user }]),
) as Record<string, { password: string; user: SessionUser }>;

function restoreDeploymentSession(): SessionUser | null {
  try {
    const storedDeployment = sessionStorage.getItem(SESSION_DEPLOYMENT_KEY);
    const storedUser = sessionStorage.getItem(SESSION_USER_KEY);
    if (storedDeployment !== __ALLMALL_DEPLOYMENT_ID__ || !storedUser) {
      sessionStorage.removeItem(SESSION_DEPLOYMENT_KEY);
      sessionStorage.removeItem(SESSION_USER_KEY);
      sessionStorage.removeItem('allmall-demo-mode');
      clearSession();
      return null;
    }

    const user = JSON.parse(storedUser) as SessionUser;
    storeTokens(createMockToken(user, 3600_000));
    return user;
  } catch {
    clearSession();
    return null;
  }
}

export interface AuthContextValue {
  /** Whether the user is currently authenticated */
  isAuthenticated: boolean;
  /** Current user info (null if not logged in) */
  user: SessionUser | null;
  /** Current user's role */
  role: Role | null;
  /** Login with email/password. Returns the authenticated user or throws. */
  login: (email: string, password: string) => Promise<SessionUser>;
  /** Logout and clear session */
  logout: () => void;
  /** Switch role (for demo/testing purposes — only available in prototype mode) */
  setRole: (role: Role) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(restoreDeploymentSession);

  // Fallback to legacy localStorage role (for backward compatibility during migration)
  const [legacyRole, setLegacyRoleState] = useState<Role>(() => {
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return (stored as Role) ?? 'Owner';
  });

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!shouldRefreshToken()) return;
    const refreshToken = getRefreshToken();
    if (!refreshToken) return;

    // In production: call POST /auth/refresh with refreshToken
    // For prototype: extend session with a new mock token
    const currentUser = sessionUser;
    if (currentUser) {
      const newTokens = createMockToken(currentUser, 3600_000);
      storeTokens(newTokens);
    }
  }, [sessionUser]);

  const isAuthenticated = sessionUser !== null;

  const user = sessionUser;

  const role: Role | null = user ? (user.role as Role) : legacyRole;

  const login = useCallback(async (email: string, password: string): Promise<SessionUser> => {
    // Validate credentials against mock users (prototype only)
    const mockUser = MOCK_USERS[email.toLowerCase()];
    if (!mockUser || mockUser.password !== password) {
      throw new Error('账号或密码不正确，请选择体验账号后重试。');
    }

    const tokens = createMockToken(mockUser.user, 3600_000);
    storeTokens(tokens);
    setSessionUser(mockUser.user);

    // Keep the session across refreshes only while the same deployment is running.
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, mockUser.user.role);
      sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(mockUser.user));
      sessionStorage.setItem(SESSION_DEPLOYMENT_KEY, __ALLMALL_DEPLOYMENT_ID__);
    } catch {
      // ignore
    }

    return mockUser.user;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSessionUser(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      sessionStorage.removeItem(SESSION_USER_KEY);
      sessionStorage.removeItem(SESSION_DEPLOYMENT_KEY);
    } catch {
      // ignore
    }
  }, []);

  const setRole = useCallback((next: Role) => {
    window.localStorage.setItem(AUTH_STORAGE_KEY, next);
    setLegacyRoleState(next);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ isAuthenticated, user, role, login, logout, setRole }),
    [isAuthenticated, user, role, login, logout, setRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
