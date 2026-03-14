/**
 * Session and auth types.
 * Kept separate so backend auth can replace mock without changing call sites.
 */

export interface AuthSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    shopId: string;
    avatarUrl?: string;
    isActive: boolean;
  };
  expiresAt?: number;
}

export function isSessionExpired(session: AuthSession | null): boolean {
  if (!session) return true;
  if (session.expiresAt == null) return false;
  return Date.now() > session.expiresAt;
}
