import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { insforge } from '../lib/insforge';

export type TabId = 'cockpit' | 'overview' | 'live' | 'telemetry' | 'circuit' | 'corners' | 'replay' | 'compare' | 'ghost-lap' | 'studio' | 'track-evo' | 'surface' | 'risk' | 'predict' | 'tires' | 'setup' | 'advisor' | 'setup-lab' | 'parts' | 'bike-compare' | 'twin' | 'sandbox' | 'experiments' | 'events' | 'history' | 'pre-gp' | 'crew' | 'copilot' | 'learning-path' | 'pit-radio' | 'team' | 'report' | 'debrief' | 'black-box' | 'knowledge' | 'patterns' | 'ai-crew' | 'style' | 'cube' | 'trust' | 'platform' | 'data' | 'settings';
export type ProfileId = 'race-engineer' | 'team-principal' | 'data-analyst' | 'mechanic' | 'spectator';

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
    color: '#E03737',
    icon: '⚙️',
    accessCount: '23',
    allowedTabs: ['cockpit','overview','live','telemetry','circuit','corners','replay','compare','ghost-lap','studio','track-evo','surface','risk','predict','tires','setup','advisor','setup-lab','parts','bike-compare','twin','sandbox','experiments','events','history','pre-gp','crew','copilot','learning-path','pit-radio','team','report','ai-crew','style','cube','trust','platform','patterns','data','settings'],
    defaultTab: 'overview',
    requiresAuth: true,
  },
  {
    id: 'team-principal',
    nameKey: 'profiles.teamPrincipal.name',
    descKey: 'profiles.teamPrincipal.desc',
    color: '#F59E0B',
    icon: '👔',
    accessCount: '14',
    allowedTabs: ['cockpit','overview','live','corners','compare','ghost-lap','track-evo','surface','risk','predict','report','debrief','black-box','experiments','history','pre-gp','copilot','learning-path','pit-radio','team','ai-crew','circuit','tires','cube','trust','settings'],
    defaultTab: 'overview',
    requiresAuth: true,
  },
  {
    id: 'data-analyst',
    nameKey: 'profiles.dataAnalyst.name',
    descKey: 'profiles.dataAnalyst.desc',
    color: '#3B82F6',
    icon: '📊',
    accessCount: '14',
    allowedTabs: ['cockpit','telemetry','corners','replay','compare','ghost-lap','studio','track-evo','surface','predict','tires','circuit','twin','sandbox','experiments','events','history','report','debrief','black-box','knowledge','patterns','learning-path','team','ai-crew','style','bike-compare','setup-lab','cube','trust','platform','data','settings'],
    defaultTab: 'telemetry',
    requiresAuth: true,
  },
  {
    id: 'mechanic',
    nameKey: 'profiles.mechanic.name',
    descKey: 'profiles.mechanic.desc',
    color: '#22C55E',
    icon: '🔧',
    accessCount: '7',
    allowedTabs: ['setup','advisor','setup-lab','parts','bike-compare','pre-gp','tires','track-evo','team','trust','data','settings'],
    defaultTab: 'setup',
    requiresAuth: true,
  },
  {
    id: 'spectator',
    nameKey: 'profiles.spectator.name',
    descKey: 'profiles.spectator.desc',
    color: '#A855F7',
    icon: '👁️',
    accessCount: '2',
    allowedTabs: ['overview','live'],
    defaultTab: 'overview',
    requiresAuth: false, // public read-only showcase — no login required
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
