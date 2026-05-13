import { config } from '@/config/config';

/** Build absolute URL for API-served uploads or pass through http(s) URLs. */
export function resolveMediaUrl(path?: string | null): string | undefined {
  if (path == null || typeof path !== 'string') return undefined;
  const p = path.trim();
  if (!p) return undefined;
  if (p.startsWith('http://') || p.startsWith('https://')) return p;
  const pathPart = p.startsWith('/') ? p : `/${p}`;
  const base = (config.apiBaseUrl || '').replace(/\/$/, '');
  return base ? `${base}${pathPart}` : pathPart;
}
