// Simple in-memory cache for storing original passwords
// This is a temporary solution - in production, you might want to use Redis or similar

interface PasswordCache {
  [clientId: string]: {
    password: string;
    email: string;
    timestamp: number;
  };
}

const passwordCache: PasswordCache = {};

export function storePassword(
  clientId: string,
  password: string,
  email: string
): void {
  passwordCache[clientId] = {
    password,
    email,
    timestamp: Date.now(),
  };
}

export function getPassword(
  clientId: string
): { password: string; email: string } | null {
  const cached = passwordCache[clientId];
  if (!cached) {
    return null;
  }

  // Optional: Add expiration (e.g., 30 days)
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  if (cached.timestamp < thirtyDaysAgo) {
    delete passwordCache[clientId];
    return null;
  }

  return {
    password: cached.password,
    email: cached.email,
  };
}

export function removePassword(clientId: string): void {
  delete passwordCache[clientId];
}
