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
import {
  hasActiveSession,
  getUserFromToken,
  storeTokens,
  clearSession,
  createMockToken,
  shouldRefreshToken,
  getRefreshToken,
  type SessionUser,
  type SessionTokens,
} from './session';

const AUTH_STORAGE_KEY = 'allmall-current-role';

/** Mock demo users for prototype login */
const MOCK_USERS: Record<string, { password: string; user: SessionUser }> = {
  'owner@allmall.io': {
    password: 'demo123',
    user: { id: 'u_001', email: 'owner@allmall.io', name: '张明', role: 'Owner', tenantId: 't_001' },
  },
  'operator@allmall.io': {
    password: 'demo123',
    user: { id: 'u_002', email: 'operator@allmall.io', name: '李华', role: 'Operator', tenantId: 't_001' },
  },
  'approver@allmall.io': {
    password: 'demo123',
    user: { id: 'u_003', email: 'approver@allmall.io', name: '王芳', role: 'Approver', tenantId: 't_001' },
  },
  'finance@allmall.io': {
    password: 'demo123',
    user: { id: 'u_004', email: 'finance@allmall.io', name: '赵强', role: 'Finance', tenantId: 't_001' },
  },
  'viewer@allmall.io': {
    password: 'demo123',
    user: { id: 'u_005', email: 'viewer@allmall.io', name: '陈静', role: 'Viewer', tenantId: 't_001' },
  },
};

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
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(() => {
    // Restore session from existing token on mount
    if (hasActiveSession()) {
      return getUserFromToken();
    }
    return null;
  });

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
    const currentUser = getUserFromToken();
    if (currentUser) {
      const newTokens = createMockToken(currentUser, 3600_000);
      storeTokens(newTokens);
    }
  }, []);

  const isAuthenticated = sessionUser !== null || hasActiveSession();

  const user = sessionUser ?? getUserFromToken();

  const role: Role | null = user ? (user.role as Role) : legacyRole;

  const login = useCallback(async (email: string, password: string): Promise<SessionUser> => {
    // Validate credentials against mock users (prototype only)
    const mockUser = MOCK_USERS[email.toLowerCase()];
    if (!mockUser || mockUser.password !== password) {
      throw new Error('Invalid email or password');
    }

    const tokens = createMockToken(mockUser.user, 3600_000);
    storeTokens(tokens);
    setSessionUser(mockUser.user);

    // Sync legacy role storage for backward compatibility
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, mockUser.user.role);
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
