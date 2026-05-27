/**
 * insforge.ts — Singleton InsForge client for the KDD Command Center
 *
 * Uses VITE_INSFORGE_URL and VITE_INSFORGE_ANON_KEY from .env.local.
 * Falls back to the project's cloud credentials so the app works out-of-the-box
 * in development without manually copying .env.local.
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

export const insforge = createClient({
  baseUrl:
    import.meta.env.VITE_INSFORGE_URL ??
    'https://vdf553wq.eu-central.insforge.app',
  anonKey:
    import.meta.env.VITE_INSFORGE_ANON_KEY ??
    'ik_f3c822ce0b7e51364a7e5799528294c7',
});
