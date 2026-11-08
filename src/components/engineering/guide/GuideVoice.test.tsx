import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { GuideVoice } from './GuideVoice';

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
});

it('dictates locally and returns editable text to Cicerone', () => {
  const onDictation = vi.fn();
  class LocalRecognition {
    processLocally = false;
    onresult?: (event: { results: { transcript: string }[][] }) => void;
    start() {
      expect(this.processLocally).toBe(true);
      this.onresult?.({ results: [[{ transcript: 'Revisar la presión' }]] });
    }
    abort() {}
  }
  vi.stubGlobal('SpeechRecognition', LocalRecognition);
  render(<GuideVoice onDictation={onDictation} />);
  fireEvent.click(screen.getByText('JARVIS · Voz de Cicerone'));
  fireEvent.click(screen.getByRole('button', { name: 'Dictar pregunta' }));
  expect(onDictation).toHaveBeenCalledWith('Revisar la presión');
});

it('does not start a browser recognizer that lacks local mode', () => {
  const start = vi.fn();
  vi.stubGlobal('SpeechRecognition', class { start = start });
  render(<GuideVoice onDictation={vi.fn()} />);
  fireEvent.click(screen.getByText('JARVIS · Voz de Cicerone'));
  fireEvent.click(screen.getByRole('button', { name: 'Dictar pregunta' }));
  expect(start).not.toHaveBeenCalled();
  expect(screen.getByRole('status').textContent).toContain('no ofrece dictado local');
});

it('restores the chosen local voice and never sends the answer to a remote voice', () => {
  const remote = { voiceURI: 'cloud', name: 'Cloud', lang: 'es-ES', localService: false };
  const first = { voiceURI: 'first', name: 'Primera', lang: 'es-ES', localService: true };
  const chosen = { voiceURI: 'chosen', name: 'Elegida', lang: 'es-MX', localService: true };
  const speak = vi.fn();
  vi.stubGlobal('speechSynthesis', { getVoices: () => [remote, first, chosen], speak, cancel: vi.fn() });
  vi.stubGlobal('SpeechSynthesisUtterance', class { constructor(public text: string) {} });
  const firstView = render(<GuideVoice scope="voice-test:team" answer="Respuesta privada" />);
  fireEvent.click(screen.getByText('JARVIS · Voz de Cicerone'));
  fireEvent.change(screen.getByLabelText('Voz local para respuestas'), { target: { value: 'chosen' } });
  firstView.unmount();
  render(<GuideVoice scope="voice-test:team" answer="Respuesta privada" />);
  fireEvent.click(screen.getByText('JARVIS · Voz de Cicerone'));
  expect(screen.getByLabelText('Voz local para respuestas')).toHaveProperty('value', 'chosen');
  expect(screen.queryByRole('option', { name: 'Cloud' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Leer última respuesta con voz local' }));
  expect(speak).toHaveBeenCalledWith(expect.objectContaining({ voice: chosen, text: 'Respuesta privada' }));
});
