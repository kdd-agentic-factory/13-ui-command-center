import { createClient } from 'npm:@insforge/sdk';

type LeadPayload = {
  name?: string;
  organization?: string;
  role?: string;
  email?: string;
  goal?: string;
  privacy_mode?: string;
  data_inventory?: string;
  source?: string;
  page?: string;
  metadata?: Record<string, unknown>;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body: LeadPayload;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const role = body.role?.trim();

  if (!name || !email || !role) {
    return json({ error: 'Missing required fields: name, email, role' }, 400);
  }

  const baseUrl = Deno.env.get('INSFORGE_BASE_URL');
  const anonKey = Deno.env.get('ANON_KEY');

  if (!baseUrl || !anonKey) {
    return json({ error: 'Function misconfigured' }, 500);
  }

  const client = createClient({ baseUrl, anonKey });
  const leadId = crypto.randomUUID();

  const { error } = await client.database.from('founding_node_leads').insert([
    {
      id: leadId,
      source: body.source?.trim() || 'public-landing',
      page: body.page?.trim() || '/',
      name,
      organization: body.organization?.trim() || null,
      role,
      email,
      goal: body.goal?.trim() || null,
      privacy_mode: body.privacy_mode?.trim() || null,
      data_inventory: body.data_inventory?.trim() || null,
      metadata: body.metadata ?? {},
      status: 'new',
    },
  ]);

  if (error) {
    return json({ error: 'Lead capture failed' }, 500);
  }

  return json({ ok: true, lead_id: leadId }, 201);
}
