/**
 * usePartStorage — React hook wrapping insforgeStorage.
 *
 * Exposes:
 *   savedParts   — list loaded from localStorage + InsForge DB
 *   loading      — true while the initial cloud sync is running
 *   saving       — true while a save is in-flight
 *   save(payload)— save a new AI-generated part
 *   remove(id)   — delete from local list (optimistic)
 *   refresh()    — re-fetch from InsForge
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  saveGeneratedPart,
  loadSavedParts,
  deleteLocalPart,
  type SavedPartMeta,
  type PartSavePayload,
} from '../services/insforgeStorage';

export type { SavedPartMeta };

export function usePartStorage() {
  const [savedParts, setSavedParts] = useState<SavedPartMeta[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const refresh = useCallback(async () => {
    if (!mountedRef.current) return;
    setLoading(true);
    try {
      const parts = await loadSavedParts();
      if (mountedRef.current) setSavedParts(parts);
    } catch {
      /* silently degrade — localStorage already loaded */
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => { refresh(); }, [refresh]);

  const save = useCallback(async (payload: PartSavePayload): Promise<string> => {
    setSaving(true);
    try {
      const id = await saveGeneratedPart(payload);
      // Optimistic update — don't wait for cloud
      setSavedParts(prev => {
        if (prev.find(p => p.part_id === id)) return prev;
        return [{
          part_id:            id,
          name:               `AI-Gen ${payload.material} ${id.slice(-6)}`,
          material:           payload.material,
          mass_kg:            payload.mass,
          peak_stress:        payload.peakStress,
          safety_factor:      payload.safetyFactor,
          drag_coeff:         payload.dragCoeff,
          prompt:             payload.prompt,
          dim_x:              payload.dimX,
          dim_y:              payload.dimY,
          dim_z:              payload.dimZ,
          load_kg:            payload.load,
          mesh_nodes:         payload.meshNodes,
          mesh_elements:      payload.meshElements,
          negotiation_rounds: payload.rounds,
          created_at:         new Date().toISOString(),
          synced_to_cloud:    false,
        }, ...prev];
      });
      return id;
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  }, []);

  const remove = useCallback((partId: string) => {
    deleteLocalPart(partId);
    setSavedParts(prev => prev.filter(p => p.part_id !== partId));
  }, []);

  return { savedParts, loading, saving, save, refresh, remove };
}
