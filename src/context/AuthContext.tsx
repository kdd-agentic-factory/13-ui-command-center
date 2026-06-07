import { createContext, useContext, useState, ReactNode } from 'react';

export type TabId = 'overview' | 'telemetry' | 'circuit' | 'corners' | 'replay' | 'tires' | 'setup' | 'advisor' | 'parts' | 'twin' | 'pre-gp' | 'crew' | 'copilot' | 'settings';
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
}

export const PROFILES: Profile[] = [
  {
    id: 'race-engineer',
    nameKey: 'profiles.raceEngineer.name',
    descKey: 'profiles.raceEngineer.desc',
    color: '#E03737',
    icon: '⚙️',
    accessCount: '14',
    allowedTabs: ['overview','telemetry','circuit','corners','replay','tires','setup','advisor','parts','twin','pre-gp','crew','copilot','settings'],
    defaultTab: 'overview',
  },
  {
    id: 'team-principal',
    nameKey: 'profiles.teamPrincipal.name',
    descKey: 'profiles.teamPrincipal.desc',
    color: '#F59E0B',
    icon: '👔',
    accessCount: '7',
    allowedTabs: ['overview','corners','pre-gp','copilot','circuit','tires','settings'],
    defaultTab: 'overview',
  },
  {
    id: 'data-analyst',
    nameKey: 'profiles.dataAnalyst.name',
    descKey: 'profiles.dataAnalyst.desc',
    color: '#3B82F6',
    icon: '📊',
    accessCount: '7',
    allowedTabs: ['telemetry','corners','replay','tires','circuit','twin','settings'],
    defaultTab: 'telemetry',
  },
  {
    id: 'mechanic',
    nameKey: 'profiles.mechanic.name',
    descKey: 'profiles.mechanic.desc',
    color: '#22C55E',
    icon: '🔧',
    accessCount: '6',
    allowedTabs: ['setup','advisor','parts','pre-gp','tires','settings'],
    defaultTab: 'setup',
  },
  {
    id: 'spectator',
    nameKey: 'profiles.spectator.name',
    descKey: 'profiles.spectator.desc',
    color: '#A855F7',
    icon: '👁️',
    accessCount: '1',
    allowedTabs: ['overview'],
    defaultTab: 'overview',
  },
];

interface AuthContextValue {
  profile: Profile | null;
  login: (id: ProfileId) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  profile: null,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profileId, setProfileId] = useState<ProfileId | null>(
    () => (localStorage.getItem('kdd-profile') as ProfileId | null)
  );

  const profile = profileId ? PROFILES.find(p => p.id === profileId) ?? null : null;

  function login(id: ProfileId) {
    localStorage.setItem('kdd-profile', id);
    setProfileId(id);
  }

  function logout() {
    localStorage.removeItem('kdd-profile');
    setProfileId(null);
  }

  return (
    <AuthContext.Provider value={{ profile, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useProfile() {
  return useContext(AuthContext);
}
