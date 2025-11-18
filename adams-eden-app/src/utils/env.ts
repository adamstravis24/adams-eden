/**
 * Require a build-time environment variable and fail fast if absent.
 * In production builds we throw so we get a clear, actionable crash
 * instead of a downstream opaque Firebase "auth/invalid-api-key" exception.
 */
import Constants from 'expo-constants';

function readFromExpoExtra(key: string): string | undefined {
  const expoConfig = Constants?.expoConfig ?? Constants?.manifest ?? {};
  const extra = (expoConfig as any)?.extra ?? {};
  const read = (container: any) => {
    const val = container?.[key];
    return typeof val === 'string' ? val : undefined;
  };
  return (
    read(extra) ??
    read(extra?.expoPublic) ??
    read(extra?.public) ??
    read(extra?.secure)
  );
}

export function requireEnv(key: string): string {
  const value =
    (process.env[key as keyof NodeJS.ProcessEnv] as string | undefined) ??
    readFromExpoExtra(key);
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
  const value =
    (process.env[key as keyof NodeJS.ProcessEnv] as string | undefined) ??
    readFromExpoExtra(key);
  return value ?? fallback;
}
