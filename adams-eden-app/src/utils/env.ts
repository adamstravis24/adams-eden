export function requireEnv(key: string): string {
  const value = process.env[key as keyof NodeJS.ProcessEnv] as string | undefined;
  if (value === undefined || value === '') {
    const msg = `[env] Missing required env var: ${key}. Check your .env and app config.`;
    // Throwing helps surface misconfig early in dev; in production you likely have EAS secrets set
    if (__DEV__) {
      throw new Error(msg);
    } else {
      console.warn(msg);
    }
    return '' as any;
  }
  return value;
}

export function optionalEnv(key: string, fallback?: string): string | undefined {
  const value = process.env[key as keyof NodeJS.ProcessEnv] as string | undefined;
  return value ?? fallback;
}
