export type RuntimeMode = 'development' | 'test' | 'production';

export function getRuntimeMode(): RuntimeMode {
  const mode = String(process.env.NODE_ENV || 'development').toLowerCase();
  if (mode === 'production') return 'production';
  if (mode === 'test') return 'test';
  return 'development';
}

export function isProductionRuntime(): boolean {
  return getRuntimeMode() === 'production';
}

export function requireProductionEnv(name: string): void {
  if (!isProductionRuntime()) return;
  if (!process.env[name] || String(process.env[name]).trim() === '') {
    throw new Error(`[production-config] Missing required env var: ${name}`);
  }
}

export function assertProductionHardening(): void {
  if (!isProductionRuntime()) return;
  requireProductionEnv('DASHBOARD_AUTH_TOKEN');
  const dangerous = [
    ['DEBUG_MODE', 'true'],
    ['PIPELINE_SOFT_MODE', 'true'],
    ['QUALITY_AUDIT_FAIL_OPEN', 'true'],
    ['AI_FACADE_ALLOW_MOCKS', 'true']
  ];
  for (const [key, bad] of dangerous) {
    if (String(process.env[key] || '').toLowerCase() === bad) {
      throw new Error(`[production-config] ${key}=${bad} is not allowed in production`);
    }
  }
}
