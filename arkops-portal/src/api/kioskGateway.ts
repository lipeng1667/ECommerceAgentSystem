/**
 * Client for the kiosk-gateway service (OpenClaw-hosted remote browser login),
 * per docs/pdd-login-method2.md. The gateway serves its own /login-stream page
 * (CDP screencast canvas + input relay + IME) — this client only needs to
 * request a session token and poll status; the streaming UI is embedded via
 * iframe, not reimplemented here.
 */

/** Session state machine, per pdd-login-method2.md §2.6. */
export type KioskSessionState =
  | 'created'
  | 'launching'
  | 'waiting_user'
  | 'logged_in'
  | 'capturing'
  | 'captured'
  | 'closed'
  | 'timeout'
  | 'failed';

export interface KioskSession {
  token: string;
  storeId: string;
  ttlMs: number;
  mode: 'cdp';
  shortCode: string;
  shortPath: string;
}

export interface KioskStatus {
  storeId: string;
  state: KioskSessionState;
}

export class KioskGatewayNotConfiguredError extends Error {
  constructor() {
    super('VITE_KIOSK_GATEWAY_URL is not configured');
    this.name = 'KioskGatewayNotConfiguredError';
  }
}

function getGatewayBaseUrl(): string | null {
  const url = import.meta.env.VITE_KIOSK_GATEWAY_URL as string | undefined;
  return url ? url.replace(/\/$/, '') : null;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getGatewayBaseUrl();
  if (!base) throw new KioskGatewayNotConfiguredError();
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`kiosk-gateway ${path} failed: HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

/** Opaque per-wizard-session handle used to bind the gateway session before an
 * AllMall store record exists yet (the store is only created once sync finishes). */
export function generateGatewaySessionId(): string {
  return `store_wiz_${Math.random().toString(36).slice(2, 10)}`;
}

export const kioskGatewayApi = {
  isConfigured: () => getGatewayBaseUrl() !== null,

  /** URL for the gateway's own bundled canvas-streaming login page. */
  loginStreamUrl: (token: string) => `${getGatewayBaseUrl()}/login-stream?token=${encodeURIComponent(token)}`,

  createSession: (input: { userId: string; storeId: string; loginUrl: string }) =>
    request<KioskSession>('/api/session', {
      method: 'POST',
      body: JSON.stringify({ mode: 'cdp', ...input }),
    }),

  getStatus: (storeId: string) => request<KioskStatus>(`/api/status?storeId=${encodeURIComponent(storeId)}`),
};
