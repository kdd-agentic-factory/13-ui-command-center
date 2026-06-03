/**
 * insforge.ts — Singleton InsForge client for the KDD Command Center
 *
 * Reads VITE_INSFORGE_URL and VITE_INSFORGE_ANON_KEY from .env.local.
 * No key is hardcoded — copy .env.local.example to .env.local and fill in the
 * project's *anon* (publishable) key. Never embed the service_role key here:
 * anything in this bundle is downloadable by every browser visitor.
 *
 * Available on the client object:
 *   insforge.database  — PostgREST-compatible query builder (Supabase API)
 *   insforge.realtime  — WebSocket pub/sub (subscribe / publish / on)
 *   insforge.auth      — Email/password + OAuth authentication
 *   insforge.storage   — File upload/download (S3-compatible buckets)
 *   insforge.ai        — OpenRouter model gateway
 *   insforge.functions — Serverless function invocation
 */
import { createClient } from '@insforge/sdk';

const baseUrl = import.meta.env.VITE_INSFORGE_URL ?? '';
const anonKey = import.meta.env.VITE_INSFORGE_ANON_KEY ?? '';

if (!baseUrl || !anonKey) {
  console.warn(
    '[InsForge] VITE_INSFORGE_URL / VITE_INSFORGE_ANON_KEY not set — ' +
    'cloud features disabled. Copy .env.local.example to .env.local.',
  );
}

export const insforge = createClient({ baseUrl, anonKey });
