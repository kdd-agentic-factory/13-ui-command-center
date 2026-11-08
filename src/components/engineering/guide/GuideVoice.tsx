import { useEffect, useRef, useState } from 'react';
import { telemetryFetch } from '../../../services/telemetryIdentity';

type Voice = { id: string; name: string };
type Recognition = {
  lang: string;
  processLocally?: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  abort(): void;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};

const base = (import.meta.env.VITE_TELEMETRY_URL ?? '/api/telemetry') + '/api/v1/engineering/guide';

function preference(key: string, value?: string) {
  try {
    if (value !== undefined) window.localStorage.setItem(key, value);
    return window.localStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
}

function spanishLocalVoices() {
  return window.speechSynthesis?.getVoices().filter(voice => voice.localService && /^es(?:-|$)/i.test(voice.lang)) ?? [];
}

export function GuideVoice({ answer, onDictation, scope = 'device' }: { answer?: string; onDictation?: (text: string) => void; scope?: string }) {
  const localKey = 'cicerone.localVoice:' + scope;
  const previewKey = 'cicerone.previewVoice:' + scope;
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selected, setSelected] = useState(() => preference(previewKey));
  const [localVoices, setLocalVoices] = useState(spanishLocalVoices);
  const [localSelected, setLocalSelected] = useState(() => preference(localKey));
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const request = useRef<AbortController | null>(null);
  const recording = useRef<Recognition | null>(null);
  const player = useRef<{ audio: HTMLAudioElement; url: string } | null>(null);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const synth = window.speechSynthesis;
    const refresh = () => setLocalVoices(spanishLocalVoices());
    synth?.addEventListener?.('voiceschanged', refresh);
    refresh();
    return () => synth?.removeEventListener?.('voiceschanged', refresh);
  }, []);

  function stopAudio() {
    if (player.current) {
      player.current.audio.pause();
      URL.revokeObjectURL(player.current.url);
      player.current = null;
    }
    if (utterance.current) {
      window.speechSynthesis.cancel();
      utterance.current = null;
    }
  }

  useEffect(() => () => {
    request.current?.abort();
    if (recording.current) {
      recording.current.onresult = recording.current.onerror = recording.current.onend = null;
      recording.current.abort();
    }
    stopAudio();
  }, []);

  async function voiceRequest(preview: boolean) {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 20000);
    setBusy(true);
    setStatus('');
    try {
      const response = await telemetryFetch(base + (preview ? '/voice-preview' : '/voices'), {
        cache: 'no-store', signal: controller.signal,
        ...(preview && { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ voice_id: selected }) }),
      });
      if (response.status === 503) throw new Error('ElevenLabs aún no está configurado.');
      if (!response.ok) throw new Error('No se pudo conectar con ElevenLabs.');
      if (preview) {
        const blob = await response.blob();
        controller.signal.throwIfAborted();
        if (blob.type !== 'audio/mpeg' || !blob.size) throw new Error('Audio de prueba no disponible.');
        stopAudio();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        player.current = { audio, url };
        audio.onended = stopAudio;
        try {
          await audio.play();
        } catch {
          stopAudio();
          throw new Error('El navegador no pudo reproducir la voz.');
        }
      } else {
        const page: { voices?: Voice[]; has_more?: boolean } = await response.json();
        controller.signal.throwIfAborted();
        if (!Array.isArray(page.voices)) throw new Error('Catálogo de voces no disponible.');
        setVoices(page.voices);
        setSelected(previous => page.voices?.some(voice => voice.id === previous) ? previous : page.voices?.[0]?.id ?? '');
        setStatus(page.voices.length ? (page.has_more ? 'Se muestran las primeras 100 voces.' : 'Elige una voz para probarla.') : 'La cuenta no tiene voces disponibles.');
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      setStatus(error instanceof Error ? error.message : 'Servicio de voz no disponible.');
    } finally {
      clearTimeout(timeout);
      request.current = null;
      setBusy(false);
    }
  }

  function dictate() {
    if (recording.current) {
      recording.current.abort();
      return;
    }
    const browser = window as SpeechWindow;
    const Engine = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
    const recognizer = Engine && new Engine();
    if (!recognizer || !('processLocally' in recognizer)) {
      setStatus('Este navegador no ofrece dictado local. Puedes escribir tu pregunta.');
      return;
    }
    stopAudio();
    recognizer.lang = 'es-ES';
    recognizer.processLocally = true;
    recognizer.onresult = event => {
      const text = event.results[0]?.[0]?.transcript.trim();
      if (text) onDictation?.(text);
      setStatus('Revisa el dictado antes de guardar la pregunta.');
    };
    recognizer.onerror = () => setStatus('Dictado local no disponible. Comprueba el permiso del micrófono y el idioma instalado.');
    recognizer.onend = () => {
      recording.current = null;
      setListening(false);
    };
    try {
      recognizer.start();
      recording.current = recognizer;
      setListening(true);
      setStatus('Escuchando…');
    } catch {
      setStatus('No se pudo iniciar el dictado local.');
    }
  }

  function readAnswer() {
    const voices = spanishLocalVoices();
    const local = localSelected ? voices.find(voice => voice.voiceURI === localSelected) : voices[0];
    if (!local || !answer) {
      setStatus(voices.length ? 'La voz guardada no está disponible. Elige otra voz local.' : 'Instala una voz local en español para escuchar la respuesta.');
      return;
    }
    stopAudio();
    const message = new SpeechSynthesisUtterance(answer);
    message.voice = local;
    message.lang = local.lang;
    utterance.current = message;
    window.speechSynthesis.speak(message);
  }

  return <details>
    <summary>JARVIS · Voz de Cicerone</summary>
    {onDictation && <button type="button" className="btn" onClick={dictate}>{listening ? 'Detener dictado' : 'Dictar pregunta'}</button>}
    {localVoices.length > 0 && <label>Voz local para respuestas
      <select aria-label="Voz local para respuestas" value={localSelected}
        onChange={event => {
          const value = event.target.value;
          preference(localKey, value);
          setLocalSelected(value);
        }}>
        <option value="">Predeterminada en español</option>
        {localSelected && !localVoices.some(voice => voice.voiceURI === localSelected) &&
          <option value={localSelected} disabled>Voz guardada no disponible</option>}
        {localVoices.map(voice => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} ({voice.lang})</option>)}
      </select>
    </label>}
    {answer && <button type="button" className="btn" disabled={listening || busy} onClick={readAnswer}>Leer última respuesta con voz local</button>}
    <button type="button" className="btn" disabled={busy || listening} onClick={() => void voiceRequest(false)}>Cargar voces de ElevenLabs</button>
    {voices.length > 0 && <label>Voz de ElevenLabs
      <select aria-label="Voz de ElevenLabs" value={selected} disabled={busy} onChange={event => {
        const value = event.target.value;
        preference(previewKey, value);
        setSelected(value);
      }}>
        {voices.map(voice => <option key={voice.id} value={voice.id}>{voice.name}</option>)}
      </select>
    </label>}
    {onDictation && selected && <button type="button" className="btn" disabled={busy || listening} onClick={() => void voiceRequest(true)}>Probar voz</button>}
    <button type="button" className="btn" onClick={stopAudio}>Detener audio</button>
    <small>ElevenLabs lee la frase de prueba. Las respuestas de sesión se leen en el dispositivo.</small>
    {status && <p role="status">{status}</p>}
  </details>;
}
