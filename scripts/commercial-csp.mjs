/** Build-time policy: exact configured authentication origin, same-origin telemetry. */
export function applyCommercialCsp(html, env) {
  const origins = new Set(["'self'"]);
  const add = (value, fixedOrigin) => {
    if (!value) return;
    if (/[\s;"'<>]/.test(value)) throw new Error('Invalid public connection origin');
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.hash ||
        (fixedOrigin && (url.search || !['','/'].includes(url.pathname)))) {
      throw new Error('Public connection requires a fixed HTTPS origin');
    }
    origins.add(url.origin);
  };
  add(env.VITE_INSFORGE_URL, true);
  add(env.VITE_LEAD_CAPTURE_URL, false);
  if (env.VITE_POSTHOG_KEY) {
    origins.add('https://us.i.posthog.com');
    origins.add('https://us-assets.i.posthog.com');
  }
  if ((html.match(/connect-src\s+[^;"]+;/g) ?? []).length !== 1) {
    throw new Error('Expected exactly one connection policy in the HTML template');
  }
  return html.replace(/connect-src\s+[^;"]+;/, 'connect-src '+[...origins].join(' ')+';');
}
