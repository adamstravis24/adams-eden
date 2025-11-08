/**
 * Require a build-time environment variable (EXPO_PUBLIC_*) and fail fast if absent.
 * In production builds we now also throw so we get a clear, actionable crash
 * instead of a downstream opaque Firebase "auth/invalid-api-key" exception.
 */
export function requireEnv(key: string): string {
  const value = process.env[key as keyof NodeJS.ProcessEnv] as string | undefined;
  if (value === undefined || value.trim() === '') {
    const hint = key.startsWith('EXPO_PUBLIC_')
      ? `Define ${key} via one of: (a) eas secret:create, (b) eas.json build profile "env" block, or (c) add to app.config.(ts|js) extra + prefix with EXPO_PUBLIC_.` 
      : 'Set this variable in a secure secret store (never commit private keys).';
    const msg = `[env] Missing required env var: ${key}. ${hint}`;
    throw new Error(msg);
  }
  return value;
}

export function optionalEnv(key: string, fallback?: string): string | undefined {
  const value = process.env[key as keyof NodeJS.ProcessEnv] as string | undefined;
  return value ?? fallback;
}
