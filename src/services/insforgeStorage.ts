/**
 * insforgeStorage.ts — Thin client for InsForge Storage + PostgREST.
 *
 * Persistence strategy (two layers):
 *   1. localStorage  — immediate, offline-capable (key: kdd-parts-v1)
 *   2. InsForge      — cloud sync: gateway /api/database/records/parts + Storage bucket
 *
 * Credentials come from VITE_INSFORGE_URL / VITE_INSFORGE_ANON_KEY (.env.local) —
 * never hardcode a key here: this bundle ships to every browser visitor, so an
 * embedded service_role key would hand anyone RLS-bypassing admin access. Use
 * the anon (publishable) key and rely on RLS policies for write access.
 *
 * Callers never crash: every cloud call is wrapped in try/catch and
 * degrades gracefully to localStorage only.
 */

// ── Config ─────────────────────────────────────────────────────────────────────

const BASE = import.meta.env.VITE_INSFORGE_URL ?? '';
const KEY  = import.meta.env.VITE_INSFORGE_ANON_KEY ?? '';
const LS_KEY = 'kdd-parts-v1';

const HEADERS = {
  apikey:        KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
  Prefer:        'return=representation',
};

// ── Types ───────────────────────────────────────────────────────────────────────

export interface SavedPartMeta {
  part_id:            string;
  name:               string;
  material:           string;
  mass_kg:            number;
  peak_stress:        number;
  safety_factor:      number;
  drag_coeff:         number;
  prompt:             string;
  dim_x:              number;
  dim_y:              number;
  dim_z:              number;
  load_kg:            number;
  mesh_nodes:         number;
  mesh_elements:      number;
  negotiation_rounds: number;
  created_at:         string;
  synced_to_cloud:    boolean;
}

// ── localStorage helpers ───────────────────────────────────────────────────────

export function localLoad(): SavedPartMeta[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as SavedPartMeta[]) : [];
  } catch {
    return [];
  }
}

function localSave(parts: SavedPartMeta[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(parts));
  } catch { /* quota exceeded — silently skip */ }
}

function localUpsert(part: SavedPartMeta): void {
  const existing = localLoad();
  const idx = existing.findIndex(p => p.part_id === part.part_id);
  if (idx >= 0) existing[idx] = part;
  else existing.unshift(part);
  localSave(existing);
}

// ── PostgREST ─────────────────────────────────────────────────────────────────

async function dbInsert(table: string, row: Record<string, unknown>): Promise<boolean> {
  const endpoints = [
    `${BASE}/api/database/records/${table}`,
  ];
  try {
    for (const url of endpoints) {
      const res = await fetch(url, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify(row),
      });
      if (res.ok) return true;
      console.warn(`[InsForge] POST ${new URL(url).pathname} → ${res.status}`);
    }
    return false;
  } catch (err) {
    console.warn('[InsForge] dbInsert error:', err);
    return false;
  }
}

async function dbSelect(table: string, qs: string): Promise<Record<string, unknown>[]> {
  const endpoints = [
    `${BASE}/api/database/records/${table}?${qs}`,
  ];
  try {
    for (const url of endpoints) {
      const res = await fetch(url, {
        method: 'GET',
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
      });
      if (!res.ok) {
        console.warn(`[InsForge] GET ${new URL(url).pathname} → ${res.status}`);
        continue;
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
    return [];
  } catch {
    return [];
  }
}

// ── Storage (object storage) ──────────────────────────────────────────────────

async function storageUpload(
  bucket: string,
  path: string,
  payload: Record<string, unknown>,
): Promise<boolean> {
  const body = JSON.stringify(payload);
  // Try Supabase-style endpoint first, then InsForge REST variant
  const endpoints = [
    `${BASE}/storage/v1/object/${bucket}/${path}`,
    `${BASE}/api/storage/buckets/${bucket}/objects/${path}`,
  ];
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method:  'POST',
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', 'x-upsert': 'true' },
        body,
      });
      if (res.ok || res.status === 200 || res.status === 201) return true;
    } catch { /* try next */ }
  }
  return false;
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface PartSavePayload {
  partId:    string;
  prompt:    string;
  dimX:      number;
  dimY:      number;
  dimZ:      number;
  load:      number;
  material:  string;
  mass:      number;
  peakStress: number;
  safetyFactor: number;
  dragCoeff: number;
  meshNodes: number;
  meshElements: number;
  rounds:    number;
  gcode:     string;
}

/**
 * Save an AI-generated part to localStorage (sync) and InsForge (async).
 * Returns the part_id.
 */
export async function saveGeneratedPart(p: PartSavePayload): Promise<string> {
  const now  = new Date().toISOString();
  const meta: SavedPartMeta = {
    part_id:            p.partId,
    name:               `AI-Gen ${p.material} ${p.partId.slice(-6)}`,
    material:           p.material,
    mass_kg:            p.mass,
    peak_stress:        p.peakStress,
    safety_factor:      p.safetyFactor,
    drag_coeff:         p.dragCoeff,
    prompt:             p.prompt,
    dim_x:              p.dimX,
    dim_y:              p.dimY,
    dim_z:              p.dimZ,
    load_kg:            p.load,
    mesh_nodes:         p.meshNodes,
    mesh_elements:      p.meshElements,
    negotiation_rounds: p.rounds,
    created_at:         now,
    synced_to_cloud:    false,
  };

  // 1. Local immediately
  localUpsert(meta);

  // 2. Cloud in background — don't await, don't block UI
  const maxLaps = p.material === 'titanium' ? 1500 : p.material === 'carbon' ? 800 : 500;
  const dbRow = {
    part_id:      p.partId,
    bike_id:      'kdd-47',
    name:         meta.name,
    part_type:    'ai-generated',
    status:       'nominal',
    usage_laps:   0,
    max_laps:     maxLaps,
    installed_at: now,
    metadata: {
      prompt:             p.prompt,
      dim_x:              p.dimX,
      dim_y:              p.dimY,
      dim_z:              p.dimZ,
      load_kg:            p.load,
      material:           p.material,
      mass_kg:            p.mass,
      peak_stress:        p.peakStress,
      safety_factor:      p.safetyFactor,
      drag_coeff:         p.dragCoeff,
      mesh_nodes:         p.meshNodes,
      mesh_elements:      p.meshElements,
      negotiation_rounds: p.rounds,
      gcode_preview:      p.gcode.slice(0, 800),
      generator_version:  '2.1',
      created_at:         now,
    },
  };

  Promise.all([
    dbInsert('parts', dbRow),
    storageUpload('simulation-results', `parts/${p.partId}.json`, { ...dbRow, gcode_full: p.gcode }),
  ]).then(([dbOk, stOk]) => {
    if (dbOk || stOk) {
      // Mark as synced in localStorage
      const all = localLoad();
      const idx = all.findIndex(x => x.part_id === p.partId);
      if (idx >= 0) { all[idx].synced_to_cloud = true; localSave(all); }
    }
    console.info(`[InsForge] part ${p.partId} — DB:${dbOk} Storage:${stOk}`);
  }).catch(console.warn);

  return p.partId;
}

/**
 * Load saved parts: merge localStorage + InsForge DB, dedup by part_id.
 */
export async function loadSavedParts(): Promise<SavedPartMeta[]> {
  // Always start with localStorage (instant)
  const local = localLoad();
  const localMap = new Map(local.map(p => [p.part_id, p]));

  // Try to enrich from DB
  try {
    const rows = await dbSelect(
      'parts',
      'part_type=eq.ai-generated&order=installed_at.desc&limit=100',
    );
    for (const r of rows) {
      const m = r.metadata as Record<string, unknown> | undefined ?? {};
      const id = r.part_id as string;
      if (!localMap.has(id)) {
        localMap.set(id, {
          part_id:            id,
          name:               r.name as string,
          material:           (m.material as string) ?? 'carbon',
          mass_kg:            (m.mass_kg as number)  ?? 0,
          peak_stress:        (m.peak_stress as number) ?? 0,
          safety_factor:      (m.safety_factor as number) ?? 0,
          drag_coeff:         (m.drag_coeff as number) ?? 0,
          prompt:             (m.prompt as string) ?? '',
          dim_x:              (m.dim_x as number) ?? 0,
          dim_y:              (m.dim_y as number) ?? 0,
          dim_z:              (m.dim_z as number) ?? 0,
          load_kg:            (m.load_kg as number) ?? 0,
          mesh_nodes:         (m.mesh_nodes as number) ?? 0,
          mesh_elements:      (m.mesh_elements as number) ?? 0,
          negotiation_rounds: (m.negotiation_rounds as number) ?? 0,
          created_at:         (r.installed_at as string) ?? '',
          synced_to_cloud:    true,
        });
      } else {
        // Mark local entry as synced
        const entry = localMap.get(id)!;
        localMap.set(id, { ...entry, synced_to_cloud: true });
      }
    }
    // Persist the enriched list back to localStorage
    const merged = Array.from(localMap.values())
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    localSave(merged);
    return merged;
  } catch {
    return local;
  }
}

/**
 * Delete a saved part from localStorage (DB delete left to service_role admin).
 */
export function deleteLocalPart(partId: string): void {
  localSave(localLoad().filter(p => p.part_id !== partId));
}
