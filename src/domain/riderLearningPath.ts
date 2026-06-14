/**
 * riderLearningPath.ts — Rider Learning Path.
 *
 * Turns each session's telemetry into a medium-term development plan: not
 * "what went wrong this stint" but the recurring pattern, the skill to train,
 * the drills, how the riding evolves and when the rider levels up.
 *
 * Deterministic and personalised to the active rider+bike+circuit. The weakest
 * MEASURABLE skill drives the active training block; on GPS-only bikes the
 * throttle/slip skills are flagged estimated (honest about what we can't see),
 * so a measurable skill is always the one chosen to train.
 */

export type SkillName =
  | 'Braking Control' | 'Corner Entry' | 'Mid-Corner Patience' | 'Exit Drive'
  | 'Throttle Smoothness' | 'Lean Management' | 'Racecraft'
  | 'Tyre Management' | 'Consistency' | 'Risk Control';

export interface SkillScore {
  skill: SkillName;
  score: number;        // 0–100
  target: number;       // goal for this block cycle
  /** GPS-only bikes can't measure throttle/slip — score is inferred, not read. */
  estimated: boolean;
}

export interface TrainingBlock {
  id: string;
  title: string;
  focus: string;
  trains: SkillName;          // the skill this block moves
  drills: string[];
  successCriteria: string[];
}

export interface ProgressUpdate {
  skill: SkillName;
  previous: number;
  current: number;
  delta: number;
  status: string;
  nextRecommendation: string;
}

export interface OracleTrainingVerdict {
  doNot: string;
  priority: string;
  reason: string;
  expectedGain: string;
  risk: string;
}

export interface LearningPath {
  combo: string;
  level: string;
  archetype: string;
  primaryWeakness: string;
  primaryStrength: string;
  currentTarget: string;
  skills: SkillScore[];
  activeBlock: TrainingBlock;
  nextBlock: TrainingBlock;
  progress: ProgressUpdate;
  oracle: OracleTrainingVerdict;
  nextMilestone: string;
  telemetryLimited: boolean;
}

const BLOCKS: Record<string, TrainingBlock> = {
  exitDrive: {
    id: 'exit-drive', title: 'Exit Drive Mastery',
    focus: 'Pick the bike up before opening the throttle.',
    trains: 'Exit Drive',
    drills: ['Bucine exit drill', 'Correntaio exit drill', 'Smooth throttle ramp drill'],
    successCriteria: ['Rear slip <10%', 'Throttle pickup +0.3s earlier', 'Exit speed +5 km/h', 'Risk index not increased'],
  },
  brakeRelease: {
    id: 'brake-release', title: 'Brake Release Control',
    focus: 'Brake earlier, release smoother, improve rotation.',
    trains: 'Braking Control',
    drills: ['San Donato progressive release', 'Correntaio entry stability', 'No-chatter braking run'],
    successCriteria: ['Brake chatter <12 Hz', 'Line deviation <0.3 m', 'Apex speed +3 km/h'],
  },
};

/**
 * Base skill profile for the rider arc. Exit drive / throttle smoothness / lean
 * management are the lows (the point-and-shoot archetype's signature), braking
 * and line repeatability the highs.
 */
function baseSkills(): SkillScore[] {
  return [
    { skill: 'Braking Control',    score: 82, target: 85, estimated: false },
    { skill: 'Corner Entry',       score: 74, target: 80, estimated: false },
    { skill: 'Mid-Corner Patience',score: 63, target: 72, estimated: false },
    { skill: 'Exit Drive',         score: 54, target: 70, estimated: false },
    { skill: 'Throttle Smoothness',score: 52, target: 70, estimated: false },
    { skill: 'Lean Management',    score: 58, target: 72, estimated: false },
    { skill: 'Racecraft',          score: 68, target: 75, estimated: false },
    { skill: 'Tyre Management',    score: 61, target: 72, estimated: false },
    { skill: 'Consistency',        score: 71, target: 80, estimated: false },
    { skill: 'Risk Control',       score: 77, target: 80, estimated: false },
  ];
}

/** Skills that need ECU/IMU data — unmeasurable on a GPS-only bike. */
const TELEMETRY_SKILLS: SkillName[] = ['Throttle Smoothness', 'Exit Drive', 'Lean Management'];

export function buildLearningPath(rider: string, bike: string, circuit: string, telemetryLimited = false): LearningPath {
  const skills = baseSkills().map(s =>
    telemetryLimited && TELEMETRY_SKILLS.includes(s.skill) ? { ...s, estimated: true } : s
  );

  // The active block trains a MEASURABLE skill so the plan only ever commits to
  // something we can verify session to session. Among the blocks whose trained
  // skill we can actually read, pick the one addressing the lowest score.
  const scoreOf = (name: SkillName) => skills.find(s => s.skill === name)!;
  const trainable = Object.values(BLOCKS).filter(b => !scoreOf(b.trains).estimated);
  const ordered = trainable.sort((a, b) => scoreOf(a.trains).score - scoreOf(b.trains).score);
  const activeBlock = ordered[0];
  const nextBlock = ordered[1] ?? Object.values(BLOCKS).find(b => b.id !== activeBlock.id)!;

  return {
    combo: `${rider} · ${bike} · ${circuit}`,
    level: 'Advanced Amateur',
    archetype: 'Point-and-shoot · aggressive entry',
    primaryWeakness: 'Throttle pickup while leaned',
    primaryStrength: 'Late braking and line repeatability',
    currentTarget: `Improve ${circuit === 'Mugello' ? 'T15 Bucine' : 'the slowest exit'} drive`,
    skills,
    activeBlock,
    nextBlock,
    progress: {
      skill: 'Throttle Smoothness',
      previous: 49, current: 54, delta: 5,
      status: 'Improving, but still below target.',
      nextRecommendation: `Repeat ${activeBlock.title} for one more stint.`,
    },
    oracle: {
      doNot: 'Do not chase more braking performance yet.',
      priority: activeBlock.title,
      reason: 'Braking is already above the ideal window, but exit drive remains the biggest limiter.',
      expectedGain: '-0.6s to -0.9s over 3 sessions',
      risk: 'Low-medium',
    },
    nextMilestone: 'Complete 3 validation laps with rear slip <10%',
    telemetryLimited,
  };
}
