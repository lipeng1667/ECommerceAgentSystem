/**
 * Session management service for AllMall portal.
 *
 * Provides token-based session lifecycle management including:
 * - JWT access/refresh token storage and rotation
 * - Session expiry detection and automatic refresh
 * - Secure token storage with in-memory fallback
 *
 * In production, tokens are stored in httpOnly cookies managed by the backend.
 * For the current prototype phase, tokens are stored in memory with localStorage
 * persistence for refresh tokens only (access tokens are in-memory).
 *
 * Author: AI Optimization
 * Created: 2026-07-16
 */

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
}

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp in milliseconds
}

const REFRESH_TOKEN_KEY = 'allmall-refresh-token';
const TOKEN_REFRESH_THRESHOLD_MS = 5 * 60 * 1000; // Refresh 5 minutes before expiry

// In-memory storage for access token (never persisted to localStorage)
let inMemoryAccessToken: string | null = null;
let inMemoryExpiresAt: number = 0;

/**
 * Parse JWT payload without verification (for client-side use only).
 * Verification must be done server-side.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Store session tokens securely.
 * Access token stays in memory only; refresh token persisted to localStorage.
 */
export function storeTokens(tokens: SessionTokens): void {
  inMemoryAccessToken = tokens.accessToken;
  inMemoryExpiresAt = tokens.expiresAt;
  try {
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  } catch {
    // localStorage unavailable (private browsing, etc.) — tokens remain in-memory only
  }
}

/**
 * Retrieve the current access token from memory.
 * Returns null if no token or token is expired.
 */
export function getAccessToken(): string | null {
  if (!inMemoryAccessToken) return null;
  if (Date.now() >= inMemoryExpiresAt) {
    clearSession();
    return null;
  }
  return inMemoryAccessToken;
}

/**
 * Check if the current session needs a token refresh.
 */
export function shouldRefreshToken(): boolean {
  if (!inMemoryAccessToken) return false;
  return Date.now() >= inMemoryExpiresAt - TOKEN_REFRESH_THRESHOLD_MS;
}

/**
 * Retrieve the stored refresh token.
 */
export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Extract user info from the current access token.
 */
export function getUserFromToken(): SessionUser | null {
  const token = getAccessToken();
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  return {
    id: (payload.sub as string) ?? '',
    email: (payload.email as string) ?? '',
    name: (payload.name as string) ?? '',
    role: (payload.role as string) ?? 'Viewer',
    tenantId: (payload.tenant_id as string) ?? '',
  };
}

/**
 * Check if there is an active (non-expired) session.
 */
export function hasActiveSession(): boolean {
  return getAccessToken() !== null;
}

/**
 * Clear all session data (logout).
 */
export function clearSession(): void {
  inMemoryAccessToken = null;
  inMemoryExpiresAt = 0;
  try {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // ignore
  }
}

/**
 * Create a mock JWT token for prototype/demo use.
 * This produces a structurally valid but cryptographically unsigned token.
 * REPLACE with real server-issued tokens in production.
 */
export function createMockToken(user: SessionUser, ttlMs: number = 3600_000): SessionTokens {
  const now = Date.now();
  const expiresAt = now + ttlMs;

  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenant_id: user.tenantId,
      iat: Math.floor(now / 1000),
      exp: Math.floor(expiresAt / 1000),
    })
  );
  const signature = btoa('mock_signature_placeholder');

  return {
    accessToken: `${header}.${payload}.${signature}`,
    refreshToken: `refresh_${user.id}_${now}`,
    expiresAt,
  };
}
