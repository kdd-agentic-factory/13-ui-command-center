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

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

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
  const leadAlertTo = Deno.env.get('LEAD_ALERT_TO')?.trim();

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

  const emailResult = await client.emails.send({
    to: email,
    from: 'KDD Founding Nodes',
    subject: 'KDD recibió tu solicitud de acceso fundador',
    html: `
      <div style="font-family: Inter, Arial, sans-serif; line-height: 1.6; color: #0f172a; background: #f8fafc; padding: 24px;">
        <h1 style="margin: 0 0 12px; font-size: 28px;">Tu solicitud quedó registrada</h1>
        <p style="margin: 0 0 12px;">Hola ${escapeHtml(name)},</p>
        <p style="margin: 0 0 12px;">Gracias por abrir la puerta a KDD Knowledge Network. Ya recibimos tu perfil y vamos a revisar el mejor modo de entrada para tu nodo.</p>
        <ul style="margin: 16px 0; padding-left: 20px;">
          <li><strong>Rol:</strong> ${escapeHtml(role)}</li>
          <li><strong>Organización:</strong> ${escapeHtml(body.organization?.trim() || '—')}</li>
          <li><strong>Privacidad:</strong> ${escapeHtml(body.privacy_mode?.trim() || '—')}</li>
        </ul>
        <p style="margin: 0 0 12px;">Si el perfil encaja, te devolvemos una propuesta con el mejor camino: Private, Team o Federated.</p>
        <p style="margin: 20px 0 0; color: #475569; font-size: 13px;">KDD learns with you. The network makes it smarter.</p>
      </div>
    `,
  });

  if (emailResult.error) {
    return json({ ok: true, lead_id: leadId, email_sent: false, email_error: emailResult.error.message }, 201);
  }

  let leadAlertSent = false;
  let leadAlertError: string | null = null;

  if (leadAlertTo) {
    const alertResult = await client.emails.send({
      to: leadAlertTo,
      from: 'KDD Lead Alerts',
      subject: `Nuevo lead fundador: ${name}`,
      html: `
        <div style="font-family: Inter, Arial, sans-serif; line-height: 1.6; color: #0f172a; background: #f8fafc; padding: 24px;">
          <h1 style="margin: 0 0 12px; font-size: 24px;">Nuevo lead de Founding Nodes</h1>
          <p style="margin: 0 0 12px;"><strong>Nombre:</strong> ${escapeHtml(name)}</p>
          <p style="margin: 0 0 12px;"><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p style="margin: 0 0 12px;"><strong>Rol:</strong> ${escapeHtml(role)}</p>
          <p style="margin: 0 0 12px;"><strong>Organización:</strong> ${escapeHtml(body.organization?.trim() || '—')}</p>
          <p style="margin: 0 0 12px;"><strong>Privacidad:</strong> ${escapeHtml(body.privacy_mode?.trim() || '—')}</p>
          <p style="margin: 0 0 12px;"><strong>Objetivo:</strong> ${escapeHtml(body.goal?.trim() || '—')}</p>
          <p style="margin: 0 0 12px;"><strong>Datos:</strong> ${escapeHtml(body.data_inventory?.trim() || '—')}</p>
        </div>
      `,
      replyTo: email,
    });

    leadAlertSent = !alertResult.error;
    leadAlertError = alertResult.error ? alertResult.error.message : null;
  }

  return json({ ok: true, lead_id: leadId, email_sent: true, lead_alert_sent: leadAlertSent, lead_alert_error: leadAlertError }, 201);
}
