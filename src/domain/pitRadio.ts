/**
 * pitRadio.ts — Voice / Pit-Radio.
 *
 * The pit-to-rider channel as a timestamped transcript (pit, rider, Oracle),
 * plus the canned messages the crew can push and the voice commands the engineer
 * can speak to drive the cockpit hands-free. Honest: there is no live audio in
 * this dataset — this is the radio LOG and the command grammar, not a mic feed.
 *
 * Deterministic and personalised to the active rider/session.
 */

export type RadioFrom = 'Pit' | 'Rider' | 'Oracle';

export interface RadioMessage {
  t: string;            // mm:ss into the stint
  from: RadioFrom;
  text: string;
  priority: 'normal' | 'high';
}

export interface CannedMessage { id: string; label: string; text: string; }
export interface VoiceCommand { phrase: string; action: string; }

export interface PitRadio {
  combo: string;
  transcript: RadioMessage[];
  canned: CannedMessage[];
  commands: VoiceCommand[];
}

const FROM_COLOR: Record<RadioFrom, string> = {
  Pit: 'var(--cyan)', Rider: 'var(--text)', Oracle: '#8B5CF6',
};
export function radioColor(f: RadioFrom): string { return FROM_COLOR[f]; }

export function buildPitRadio(rider: string, circuit: string): PitRadio {
  const first = rider.split(' ')[0];
  return {
    combo: `${rider} · ${circuit}`,
    transcript: [
      { t: '00:42', from: 'Pit',    text: `${first}, push now, track is in the window.`, priority: 'normal' },
      { t: '01:10', from: 'Rider',  text: 'Rear is moving on the Bucine exit.', priority: 'normal' },
      { t: '01:14', from: 'Oracle', text: 'Rear slip 14% at T15 — recommend rebound +2, confidence 84%.', priority: 'high' },
      { t: '01:22', from: 'Pit',    text: 'Copy. Box this lap, we make the change.', priority: 'high' },
      { t: '03:05', from: 'Pit',    text: 'Change done. Throttle only after lean under 54°.', priority: 'normal' },
      { t: '05:48', from: 'Rider',  text: 'Much better, rear is settled now.', priority: 'normal' },
      { t: '05:55', from: 'Oracle', text: 'Confirmed: slip 9.8%, exit +5 km/h, lap −0.31s. Decision validated.', priority: 'high' },
    ],
    canned: [
      { id: 'm1', label: 'Push now',     text: 'Push now — track is in the window.' },
      { id: 'm2', label: 'Box this lap', text: 'Box this lap for the setup change.' },
      { id: 'm3', label: 'Save tyre',    text: 'Manage the rear — two laps, then we re-assess.' },
      { id: 'm4', label: 'Abort lap',    text: 'Abort the push lap, bring it home safe.' },
      { id: 'm5', label: 'Mode change',  text: 'Switch engine map to 3 on the next straight.' },
    ],
    commands: [
      { phrase: '“Mark this corner”',     action: 'Tags the current corner for post-stint review' },
      { phrase: '“Open Crash-Risk”',      action: 'Brings up the Safety Guardian panel' },
      { phrase: '“Start experiment”',     action: 'Opens the active experiment validation' },
      { phrase: '“Send: box this lap”',   action: 'Pushes the canned radio message to the rider' },
      { phrase: '“What’s the verdict?”',  action: 'Reads the latest Oracle recommendation' },
    ],
  };
}
