import { config } from '@/config/config';

/** Build absolute URL for API-served uploads or pass through http(s) URLs. */
export function resolveMediaUrl(path?: string | null): string | undefined {
  if (path == null || typeof path !== 'string') return undefined;
  const p = path.trim();
  if (!p) return undefined;

  const cdnUrl = (import.meta.env.VITE_CDN_URL as string)?.replace(/\/+$/, '');
  const s3Pattern = 'my-together-moonlight201.s3';

  if (p.includes(s3Pattern)) {
    try {
      const parsed = new URL(p);
      const pathname = parsed.pathname.startsWith('/') ? parsed.pathname.substring(1) : parsed.pathname;
      return cdnUrl ? `${cdnUrl}/${pathname}` : p;
    } catch {
      // ignore
    }
  }

  if (p.startsWith('http://') || p.startsWith('https://')) return p;
  const pathPart = p.startsWith('/') ? p : `/${p}`;
  const base = (cdnUrl || config.apiBaseUrl || '').replace(/\/$/, '');
  return base ? `${base}${pathPart}` : pathPart;
}
