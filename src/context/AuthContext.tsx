import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { insforge } from '../lib/insforge';

export type TabId = 'cockpit' | 'overview' | 'raceday' | 'live' | 'telemetry' | 'circuit' | 'corners' | 'replay' | 'compare' | 'ghost-lap' | 'studio' | 'track-evo' | 'surface' | 'weather' | 'risk' | 'predict' | 'strategy' | 'rivals' | 'quali' | 'tires' | 'pressure' | 'setup' | 'advisor' | 'electronics' | 'aero' | 'fuel' | 'chassis' | 'gearing' | 'engctrl' | 'setup-lab' | 'parts' | 'brakes' | 'bike-compare' | 'twin' | 'sandbox' | 'sim-lab' | 'experiments' | 'events' | 'causal' | 'history' | 'pre-gp' | 'crew' | 'copilot' | 'learning-path' | 'human' | 'pit-radio' | 'team' | 'workbench' | 'orchestrator' | 'season' | 'stewards' | 'report' | 'research' | 'debrief' | 'black-box' | 'knowledge' | 'patterns' | 'federated' | 'ai-crew' | 'style' | 'cube' | 'trust' | 'platform' | 'edge' | 'lakehouse' | 'devhub' | 'data' | 'settings';
export type ProfileId = 'race-engineer' | 'team-principal' | 'data-analyst' | 'mechanic' | 'spectator' | 'founding-node';

export interface Profile {
  id: ProfileId;
  nameKey: string;
  descKey: string;
  color: string;
  icon: string;
  accessCount: string;
  allowedTabs: TabId[];
  defaultTab: TabId;
  /** When true, selecting this profile requires an authenticated InsForge user. */
  requiresAuth: boolean;
}

export const PROFILES: Profile[] = [
  {
    id: 'race-engineer',
    nameKey: 'profiles.raceEngineer.name',
    descKey: 'profiles.raceEngineer.desc',
    color: 'var(--accent)',
    icon: '⚙™🏎️',
    accessCount: '23',
    allowedTabs: ['cockpit','overview','live','telemetry','circuit','corners','replay','compare','ghost-lap','studio','track-evo','surface','weather','risk','predict','raceday','strategy','rivals','quali','tires','pressure','setup','advisor','electronics','aero','fuel','chassis','gearing','engctrl','setup-lab','parts','brakes','bike-compare','twin','sandbox','sim-lab','experiments','events','causal','history','pre-gp','crew','copilot','learning-path','human','pit-radio','team','workbench','orchestrator','season','stewards','report','research','ai-crew','style','cube','trust','platform','patterns','federated','edge','lakehouse','devhub','data','settings'],
    defaultTab: 'overview',
    requiresAuth: true,
  },
  {
    id: 'team-principal',
    nameKey: 'profiles.teamPrincipal.name',
    descKey: 'profiles.teamPrincipal.desc',
    color: 'var(--yellow)',
    icon: '👤',
    accessCount: '14',
    allowedTabs: ['cockpit','overview','live','corners','compare','ghost-lap','track-evo','surface','weather','risk','predict','raceday','strategy','rivals','quali','report','debrief','black-box','experiments','history','pre-gp','copilot','learning-path','human','pit-radio','team','orchestrator','season','stewards','ai-crew','circuit','tires','cube','trust','settings'],
    defaultTab: 'overview',
    requiresAuth: true,
  },
  {
    id: 'data-analyst',
    nameKey: 'profiles.dataAnalyst.name',
    descKey: 'profiles.dataAnalyst.desc',
    color: 'var(--blue)',
    icon: '📊',
    accessCount: '14',
    allowedTabs: ['cockpit','telemetry','corners','replay','compare','ghost-lap','studio','track-evo','surface','weather','predict','raceday','strategy','rivals','quali','tires','pressure','circuit','twin','sandbox','sim-lab','experiments','events','causal','history','report','research','debrief','black-box','knowledge','patterns','learning-path','human','team','workbench','season','stewards','ai-crew','style','bike-compare','setup-lab','brakes','electronics','aero','fuel','chassis','gearing','engctrl','cube','trust','platform','federated','edge','lakehouse','devhub','data','settings'],
    defaultTab: 'telemetry',
    requiresAuth: true,
  },
  {
    id: 'mechanic',
    nameKey: 'profiles.mechanic.name',
    descKey: 'profiles.mechanic.desc',
    color: 'var(--green)',
    icon: '🔧',
    accessCount: '7',
    allowedTabs: ['setup','advisor','electronics','aero','fuel','chassis','gearing','engctrl','setup-lab','parts','brakes','bike-compare','pre-gp','tires','pressure','track-evo','weather','team','trust','data','settings'],
    defaultTab: 'setup',
    requiresAuth: true,
  },
  {
    id: 'spectator',
    nameKey: 'profiles.spectator.name',
    descKey: 'profiles.spectator.desc',
    color: 'var(--purple)',
    icon: '👁️',
    accessCount: '2',
    allowedTabs: ['overview','live'],
    defaultTab: 'overview',
    requiresAuth: false, // public read-only showcase – no login required
  },
  {
    id: 'founding-node',
    nameKey: 'profiles.foundingNode.name',
    descKey: 'profiles.foundingNode.desc',
    color: 'var(--violet)',
    icon: '✨',
    accessCount: '23',
    allowedTabs: ['cockpit','overview','raceday','live','telemetry','circuit','corners','replay','compare','ghost-lap','studio','track-evo','surface','weather','risk','predict','strategy','rivals','quali','tires','pressure','setup','advisor','electronics','aero','fuel','chassis','gearing','engctrl','setup-lab','parts','brakes','bike-compare','twin','sandbox','sim-lab','experiments','events','causal','history','pre-gp','crew','copilot','learning-path','human','pit-radio','team','workbench','orchestrator','season','stewards','report','research','debrief','black-box','knowledge','patterns','federated','ai-crew','style','cube','trust','platform','edge','lakehouse','devhub','data','settings'],
    defaultTab: 'overview',
    requiresAuth: false,
  },
];

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
}

function getProfileName(profile: unknown): string | undefined {
  if (typeof profile !== 'object' || profile === null || !('name' in profile)) return undefined;
  const name = profile.name;
  return typeof name === 'string' && name.trim().length > 0 ? name : undefined;
}

interface AuthContextValue {
  // Profile (role) state
  profile: Profile | null;
  login: (id: ProfileId) => void;
  logout: () => void;
  // Real identity state (InsForge)
  user: AuthUser | null;
  authLoading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  profile: null,
  login: () => {},
  logout: () => {},
  user: null,
  authLoading: true,
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profileId, setProfileId] = useState<ProfileId | null>(
    () => (localStorage.getItem('kdd-profile') as ProfileId | null)
  );
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const profile = profileId ? PROFILES.find(p => p.id === profileId) ?? null : null;

  const refreshUser = useCallback(async () => {
    try {
      const { data, error } = await insforge.auth.getCurrentUser();
      const u = !error ? (data?.user ?? null) : null;
      setUser(u ? { id: u.id, email: u.email, name: getProfileName(u.profile) } : null);
    } catch {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // Rehydrate the InsForge session on cold load (uses the httpOnly refresh cookie).
  useEffect(() => { void refreshUser(); }, [refreshUser]);

  function login(id: ProfileId) {
    localStorage.setItem('kdd-profile', id);
    setProfileId(id);
  }

  async function logout() {
    localStorage.removeItem('kdd-profile');
    setProfileId(null);
    try { await insforge.auth.signOut(); } catch { /* ignore */ }
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ profile, login, logout, user, authLoading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useProfile() {
  return useContext(AuthContext);
}

/** Alias that reads better where identity (not just the profile) is the concern. */
export function useAuth() {
  return useContext(AuthContext);
}
