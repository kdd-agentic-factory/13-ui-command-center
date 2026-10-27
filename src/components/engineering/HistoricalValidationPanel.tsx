import {useEffect, useRef, useState} from 'react';
import type {CrewDesignation, HumanEvent, ValidationInput} from '../../domain/engineeringSession';
import * as api from '../../services/engineeringSession';
import {identitySnapshot} from '../../services/telemetryIdentity';

type Attempt = {target:string; operation:string; body:ValidationInput};
const uuid = (value:string) => /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(value);
const actualTime = (value:string) => Number.isFinite(Date.parse(value)) && Date.parse(value) <= Date.now() && /(Z|[+-]\d\d:\d\d)$/.test(value);

export function HistoricalValidationPanel({sessionId, events, onRefresh}:{sessionId:string; events:HumanEvent[]; onRefresh:()=>void}) {
  const identity = identitySnapshot();
  const applications = events.filter(e => e.kind === 'application' && e.session_id === sessionId);
  const [application, setApplication] = useState('');
  const [designation, setDesignation] = useState<CrewDesignation|null>(null);
  const [evidenceSnapshot, setEvidenceSnapshot] = useState(''), [evidenceIds, setEvidenceIds] = useState('');
  const [validated, setValidated] = useState(''), [outcome, setOutcome] = useState<ValidationInput['outcome']>('inconclusive');
  const [note, setNote] = useState(''), [error, setError] = useState(''), [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false), [uncertain, setUncertain] = useState(false), [revision, setRevision] = useState(0);
  const controller = useRef<AbortController|null>(null), mutationController = useRef<AbortController|null>(null), attempt = useRef<Attempt|null>(null), pending = useRef(false);
  const parent = applications.find(e => e.id === application);
  useEffect(() => {
    const c = new AbortController(); controller.current = c; setDesignation(null);
    if (parent && identity.mode === 'authenticated') {
      void Promise.all([api.getProposal(parent.proposal_id, parent.proposal_revision, c.signal), api.getDesignation(c.signal)]).then(([stored, current]) => {
        if (c.signal.aborted) return;
        if (stored.authority_proposal_id !== parent.authority_proposal_id || stored.generation !== parent.generation || stored.proposal_digest !== parent.proposal_digest || stored.proposal.snapshot_digest !== parent.snapshot_digest) throw new Error('La aplicación no corresponde a su propuesta histórica inmutable.');
        setDesignation(current);
      }).catch(e => {if (!c.signal.aborted) setError(e instanceof Error ? e.message : 'No se pudo consultar la designación vigente.');});
    }
    return () => c.abort();
  }, [application, parent, revision, sessionId, identity.mode]);
  useEffect(() => {
    const reset = () => {controller.current?.abort(); mutationController.current?.abort(); attempt.current = null; pending.current = false; setBusy(false); setDesignation(null); setApplication(''); setUncertain(false);};
    window.addEventListener('telemetry-scope-changed', reset);
    return () => {controller.current?.abort(); mutationController.current?.abort(); window.removeEventListener('telemetry-scope-changed', reset);};
  }, []);
  const designated = identity.mode === 'authenticated' && !!identity.user && ['admin','engineer'].includes(identity.role ?? '') && !!designation && [designation.primary_id, designation.substitute_id].includes(identity.user);
  const ids = evidenceIds.split(/[\s,]+/).filter(Boolean);
  const validEvidence = uuid(evidenceSnapshot) && ids.length > 0 && ids.length <= 30 && new Set(ids).size === ids.length && ids.every(uuid);
  async function submit(next:Attempt, recovering=false) {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError(''); setStatus('');
    const c = new AbortController(); mutationController.current?.abort(); mutationController.current = c;
    let possiblySubmitted = recovering;
    try {
      if (!recovering) {
        const snapshot = await api.getAnalysisSnapshot(next.body.evidence_snapshot_id, c.signal);
        if (!parent || snapshot.id !== next.body.evidence_snapshot_id || snapshot.session_id !== sessionId || !snapshot.selection.comparison || !actualTime(String(parent.payload.mounted_at)) || !Number.isFinite(Date.parse(snapshot.created_at)) || Date.parse(snapshot.created_at) < Date.parse(String(parent.payload.mounted_at)) || Date.parse(next.body.validated_at) < Date.parse(snapshot.created_at)) throw new Error('Selecciona evidencia de la misma sesión posterior al montaje y anterior a la validación.');
      }
      if (c.signal.aborted) return;
      attempt.current = next; possiblySubmitted = true;
      await api.recordValidation(next.target, next.body, next.operation, c.signal);
      if (c.signal.aborted) return;
      attempt.current = null; setUncertain(false); setStatus('Validación humana persistida.'); setApplication(''); onRefresh();
    } catch (e) {
      if (c.signal.aborted) return;
      const ambiguous = possiblySubmitted && (!(e instanceof api.EngineeringRequestError) || e.status >= 500);
      setUncertain(ambiguous); if (!ambiguous) attempt.current = null;
      setError(e instanceof Error ? e.message : 'No se pudo confirmar la validación.');
      if (e instanceof api.EngineeringRequestError && e.status === 409) {setDesignation(null); setRevision(r => r + 1); onRefresh();}
    } finally {if (!c.signal.aborted) {pending.current = false; setBusy(false);}}
  }
  return <section className="engineering-decisions" aria-label="Validación histórica">
    <h3>Validar una aplicación persistida</h3>
    <p>La evidencia debe pertenecer a esta sesión y ser posterior al montaje. Un registro histórico no vuelve a autorizar el setup.</p>
    <label>Aplicación a validar<select disabled={busy || uncertain} value={application} onChange={e => {setApplication(e.target.value); setStatus(''); setError('');}}><option value="">Selecciona aplicación persistida</option>{applications.map(e => <option key={e.id} value={e.id}>{e.id} · {e.created_at}</option>)}</select></label>
    {parent && <p>Propuesta histórica {parent.proposal_id} · r{parent.proposal_revision}. Designación vigente: r{designation?.revision ?? '—'}.</p>}
    {parent && !designated && <p>La firma requiere al titular o sustituto humano vigente y una designación confirmada.</p>}
    <fieldset disabled={busy || uncertain}>
      <label>Snapshot persistido de nueva evidencia<input value={evidenceSnapshot} onChange={e => setEvidenceSnapshot(e.target.value)}/></label>
      <label>IDs de evidencia (1–30 únicos)<textarea value={evidenceIds} onChange={e => setEvidenceIds(e.target.value)}/></label>
      <label>Fecha de validación con zona horaria<input placeholder="AAAA-MM-DDThh:mm:ss+02:00" value={validated} onChange={e => setValidated(e.target.value)}/></label>
      <label>Resultado observado<select value={outcome} onChange={e => setOutcome(e.target.value as ValidationInput['outcome'])}><option value="inconclusive">Inconcluso</option><option value="supported">Respaldado</option><option value="not_supported">No respaldado</option></select></label>
      <label>Nota de validación<textarea maxLength={2000} value={note} onChange={e => setNote(e.target.value)}/></label>
    </fieldset>
    <button className="btn" disabled={!designated || !parent || busy || uncertain || !validEvidence || !actualTime(validated) || !note.trim()} onClick={() => {if (designation && parent && designated) void submit({target:parent.id, operation:crypto.randomUUID(), body:{expected_designation_revision:designation.revision, evidence_snapshot_id:evidenceSnapshot, evidence_ids:ids, validated_at:validated, outcome, note}});}}>Registrar validación</button>
    {busy && <p role="status">Confirmando validación…</p>}{status && <p role="status">{status}</p>}{error && <p role="alert">{error}</p>}
    {uncertain && <button className="btn" disabled={busy || identity.mode !== 'authenticated'} onClick={() => {if (attempt.current) void submit(attempt.current, true);}}>Recuperar validación pendiente</button>}
    {parent && !uncertain && <button className="btn" disabled={busy} onClick={() => setRevision(r => r + 1)}>Recargar designación de validación</button>}
  </section>;
}
