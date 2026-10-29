/** Server-only preview upstream. Browser requests keep the same-origin path. */
export function telemetryProxyTarget(env) {
  const fallback = 'http://127.0.0.1:8180';
  if (env.TDS_TELEMETRY_PROXY_ORIGIN === undefined) return fallback;
  const value = env.TDS_TELEMETRY_PROXY_ORIGIN;
  if (value === fallback) return fallback;
  if (typeof value !== 'string' || !value || /\s/.test(value)) throw new Error('Fixed HTTPS telemetry upstream required');
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('Fixed HTTPS telemetry upstream required');
  }
  return url.origin;
}
