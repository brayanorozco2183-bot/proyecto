import type { Request, Response, NextFunction } from 'express';
import { vault } from '../tools/vault.js';

export interface ValidationResult<T> {
  ok: boolean;
  value?: T;
  error?: string;
}

type CommandPayload = {
  command: string;
  publish_mode?: 'publish' | 'draft' | 'preview' | 'dry-run';
  site_type?: 'static' | 'wordpress';
  is_cluster?: boolean;
  scope?: string;
  enable_wordpress?: boolean;
  debug_mode?: boolean;
};

const WINDOW_MS = Number(process.env.DASHBOARD_RATE_WINDOW_MS || 60_000);
const MAX_REQUESTS = Number(process.env.DASHBOARD_RATE_MAX || 120);
const MAX_COMMAND_LEN = 240;
const SAFE_COMMAND = /^[\p{L}\p{N}\s,.;:()[\]_+\-\/áéíóúÁÉÍÓÚñÑüÜ]+$/u;
const buckets = new Map<string, { count: number; resetAt: number }>();

function isProd(): boolean {
  return process.env.NODE_ENV === 'production';
}

function allowedOrigins(): string[] {
  return (process.env.DASHBOARD_ALLOWED_ORIGINS || 'http://localhost:8081,http://127.0.0.1:8081')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

function requestKey(req: Request): string {
  return String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'local').split(',')[0].trim();
}

function checkRateLimit(req: Request, res: Response): boolean {
  const key = requestKey(req);
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  current.count += 1;
  if (current.count > MAX_REQUESTS) {
    res.status(429).json({ success: false, error: 'Dashboard rate limit exceeded' });
    return false;
  }
  return true;
}

function checkOrigin(req: Request, res: Response): boolean {
  const origin = req.headers.origin;
  if (!origin) return true;
  const allowed = allowedOrigins();
  if (allowed.includes('*') && !isProd()) return true;
  if (!allowed.includes(origin)) {
    res.status(403).json({ success: false, error: 'Dashboard origin not allowed' });
    return false;
  }
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  return true;
}

function checkAuth(req: Request, res: Response): boolean {
  const token = vault.DASHBOARD_AUTH_TOKEN;
  const isDev = process.env.NODE_ENV !== 'production' || vault.DEBUG_MODE === true;
  const protectedPath = req.path.startsWith('/api/command') || req.path.startsWith('/api/agent/interact');
  
  if (!protectedPath) return true;

  // Si estamos en modo debug/dev, permitimos el paso siempre para no bloquear al usuario local
  if (isDev) return true;

  if (!token) {
    if (isProd()) {
      res.status(503).json({ success: false, error: 'DASHBOARD_AUTH_TOKEN is required in production' });
      return false;
    }
    return true;
  }

  const bearer = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  const headerToken = String(req.headers['x-dashboard-token'] || '').trim();
  
  if (bearer === token || headerToken === token) return true;
  
  res.status(401).json({ success: false, error: 'Dashboard authentication required' });
  return false;
}

export function dashboardSecurity() {
  return (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    if (!checkOrigin(req, res)) return;
    if (!checkRateLimit(req, res)) return;
    if (!checkAuth(req, res)) return;
    next();
  };
}

function cleanString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

export function validateDashboardCommandPayload(raw: any): ValidationResult<CommandPayload> {
  const command = cleanString(raw?.command);
  if (!command) return { ok: false, error: 'command is required' };
  if (command.length > MAX_COMMAND_LEN) return { ok: false, error: `command exceeds ${MAX_COMMAND_LEN} chars` };
  if (!SAFE_COMMAND.test(command)) return { ok: false, error: 'command contains unsafe characters' };

  const publishMode = cleanString(raw?.publish_mode, 'publish') as CommandPayload['publish_mode'];
  if (!['publish', 'draft', 'preview', 'dry-run'].includes(publishMode || '')) {
    return { ok: false, error: 'publish_mode is not allowed' };
  }

  const siteType = cleanString(raw?.site_type, 'static') as CommandPayload['site_type'];
  if (!['static', 'wordpress'].includes(siteType || '')) {
    return { ok: false, error: 'site_type is not allowed' };
  }

  return {
    ok: true,
    value: {
      command,
      publish_mode: publishMode,
      site_type: siteType,
      is_cluster: raw?.is_cluster === true,
      scope: cleanString(raw?.scope, 'auto') || 'auto',
      enable_wordpress: raw?.enable_wordpress === true,
      debug_mode: raw?.debug_mode === true && !isProd()
    }
  };
}

export function validateAgentInteractPayload(raw: any): ValidationResult<{ role: string; input: string; sessionId?: string }> {
  const role = cleanString(raw?.role);
  const input = cleanString(raw?.input);
  if (!role) return { ok: false, error: 'role is required' };
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(role)) return { ok: false, error: 'role is invalid' };
  if (!input) return { ok: false, error: 'input is required' };
  if (input.length > 4000) return { ok: false, error: 'input exceeds 4000 chars' };
  return { ok: true, value: { role, input, sessionId: cleanString(raw?.sessionId) || undefined } };
}
