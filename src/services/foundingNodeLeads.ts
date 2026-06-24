import { posthog } from '../lib/analytics';

export type LeadSource = 'home' | 'trial' | 'login';

export interface LeadCaptureInput {
  name: string;
  organization?: string;
  role: string;
  email: string;
  goal?: string;
  privacyMode?: string;
  dataInventory?: string;
  source: LeadSource;
  page: string;
  metadata?: Record<string, unknown>;
}

export interface LeadCaptureResponse {
  ok: boolean;
  lead_id?: string;
  error?: string;
}

const DEFAULT_ENDPOINT = 'https://vdf553wq.functions.insforge.app/founding-node-leads';
const CAPTURE_ENDPOINT = import.meta.env.VITE_LEAD_CAPTURE_URL ?? DEFAULT_ENDPOINT;

export async function submitLeadCapture(input: LeadCaptureInput): Promise<LeadCaptureResponse> {
  const response = await fetch(CAPTURE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: input.name,
      organization: input.organization ?? '',
      role: input.role,
      email: input.email,
      goal: input.goal ?? '',
      privacy_mode: input.privacyMode ?? '',
      data_inventory: input.dataInventory ?? '',
      source: input.source,
      page: input.page,
      metadata: input.metadata ?? {},
    }),
  });

  const raw = await response.text();
  let payload: LeadCaptureResponse = { ok: response.ok };

  if (raw) {
    try {
      payload = JSON.parse(raw) as LeadCaptureResponse;
    } catch {
      payload = { ok: response.ok, error: raw };
    }
  }

  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error ?? `Lead capture failed (${response.status})`);
  }

  posthog.capture('founding_lead_submitted', {
    source: input.source,
    role: input.role,
    privacy_mode: input.privacyMode ?? 'unknown',
    page: input.page,
  });

  return payload;
}
