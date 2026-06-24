import '../i18n'; // must be first — initialises i18next before any component renders
import { useEffect, useState } from 'react';

import { AuthProvider, useProfile, PROFILES, type ProfileId } from '../context/AuthContext';
import { IntroExperience } from '../components/intro/IntroExperience';
import { LoginModal } from '../components/auth/LoginModal';
import { ToastProvider } from '../components/ToastProvider';
import { Loader2 } from 'lucide-react';

import { CircuitGatePage } from '../pages/CircuitGatePage';
import { MissionControlPage } from '../pages/MissionControlPage';
import { DataSourceGatePage } from '../pages/DataSourceGatePage';
import { LaunchBriefPage } from '../pages/LaunchBriefPage';
import { GarageProfileGatePage } from '../pages/GarageProfileGatePage';
import { SessionModeGatePage } from '../pages/SessionModeGatePage';
import { BootSequence } from '../components/BootSequence';

import { setGarageProfile, getGarageProfile, buildGarageProfile, RIDERS, BIKES } from '../domain/garageProfile';
import { CircuitRecord, setActiveCircuit, getCircuitLibrary } from '../domain/circuits';
import {
  clearSessionContext,
  buildSessionContext,
  DEMO_PACKAGES,
  type SessionContext,
  loadLatestSessionContextForCurrentUser,
  persistSessionContext,
  setSessionContext,
} from '../domain/sessionContext';
import { buildSessionResumeSnapshot } from './sessionResume';

import { DashboardShell } from './DashboardShell';
import { HomePage } from '../pages/public/HomePage';
import { LoginPage } from '../pages/public/LoginPage';
import { TrialHomePage } from '../pages/public/TrialHomePage';
import { ThanksPage } from '../pages/public/ThanksPage';
import { FoundingNodesPage } from '../pages/public/FoundingNodesPage';

function getPathname(): string {
  if (typeof window === 'undefined') return '/';
  return window.location.pathname;
}

function getAppRoute(pathname: string): 'home' | 'login' | 'trial' | 'thanks' | 'founding-nodes' | 'app' {
  if (pathname === '/app' || pathname.startsWith('/app/')) return 'app';
  if (pathname === '/login') return 'login';
  if (pathname === '/trial' || pathname.startsWith('/trial/')) return 'trial';
  if (pathname === '/founding-node-thanks') return 'thanks';
  if (pathname === '/founding-nodes') return 'founding-nodes';
  return 'home';
}

function AppEntryFlowContent() {
  const { profile, login, user, authLoading } = useProfile();
  const [pendingProfile, setPendingProfile] = useState<ProfileId | null>(null);
  type Stage = 'restoring' | 'mission' | 'circuit' | 'garage' | 'mode' | 'data' | 'launch' | 'booting' | 'dashboard';
  const [stage, setStage] = useState<Stage>('restoring');
  const [createOnOpen, setCreateOnOpen] = useState(false);
  const [gateCircuit, setGateCircuit] = useState<CircuitRecord | null>(null);
  const [sessionCtx, setSessionCtx] = useState<SessionContext | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function resumeLatestSession() {
      if (authLoading) return;
      if (!profile) return;

      if (!user) {
        setStage('mission');
        return;
      }

      setStage('restoring');
      const row = await loadLatestSessionContextForCurrentUser();
      if (cancelled) return;

      if (!row) {
        setStage('mission');
        return;
      }

      const snapshot = buildSessionResumeSnapshot(row);
      if (snapshot.gateCircuit) {
        setActiveCircuit(snapshot.gateCircuit);
        setGateCircuit(snapshot.gateCircuit);
      }
      if (snapshot.garageProfile) {
        setGarageProfile(snapshot.garageProfile);
      }
      setSessionContext(snapshot.sessionCtx);
      setSessionCtx(snapshot.sessionCtx);
      setStage(snapshot.stage);
    }

    void resumeLatestSession();
    return () => { cancelled = true; };
  }, [authLoading, profile?.id, user?.id]);

  function presetLatestSession() {
    const mugello = getCircuitLibrary().find(c => c.id === 'mugello')!;
    setActiveCircuit(mugello);
    setGateCircuit(mugello);
    const ctx = buildSessionContext('mugello', 'Mugello', 'replay', {
      session: 'Mugello · Stint 03 · 14:32 · Yamaha R1',
      channels: 'GPS · IMU · ECU · Video · CSV',
      analysis: 'Full session',
      rider: 'Rubén Juárez',
      bike: 'Yamaha R1',
      dataSource: 'upload',
    });
    setGarageProfile(buildGarageProfile(RIDERS[0], BIKES[0], 'mugello'));
    setSessionContext(ctx);
    setSessionCtx(ctx);
    setStage('launch');
  }

  function presetGuidedDemo() {
    const mugello = getCircuitLibrary().find(c => c.id === 'mugello')!;
    setActiveCircuit(mugello);
    setGateCircuit(mugello);
    const pkg = DEMO_PACKAGES.find(p => p.id === 'trackday')!;
    const ctx = buildSessionContext('mugello', 'Mugello', 'demo', {
      demoId: pkg.id,
      demoPackage: pkg.title,
      dataType: pkg.dataType,
      dataSource: 'demo',
    });
    setGarageProfile(buildGarageProfile(RIDERS[0], BIKES[0], 'mugello'));
    setSessionContext(ctx);
    setSessionCtx(ctx);
    setStage('launch');
  }

  function handleEnter(id: ProfileId) {
    const def = PROFILES.find(p => p.id === id);
    if (def && def.requiresAuth && !user) {
      setPendingProfile(id);
      return;
    }
    login(id);
  }

  if (authLoading && profile?.requiresAuth && !user) {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg, #0c0e14)', color: 'var(--text-muted, #8b8fa3)', fontSize: 13 }}>
        <Loader2 size={18} className="spin" style={{ marginRight: 8 }} /> Loading session…
      </div>
    );
  }

  if (!profile) {
    const pendingLabel = pendingProfile
      ? PROFILES.find(p => p.id === pendingProfile)?.id
      : undefined;
    return (
      <>
        <IntroExperience onEnter={handleEnter} />
        {pendingProfile && !user && (
          <LoginModal
            profileLabel={pendingLabel}
            onClose={() => setPendingProfile(null)}
            onSuccess={() => {
              const id = pendingProfile;
              setPendingProfile(null);
              if (id) login(id);
            }}
          />
        )}
      </>
    );
  }

  if (profile.requiresAuth && !user && !authLoading) {
    return <IntroExperience onEnter={handleEnter} />;
  }

  if (stage === 'restoring') {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg, #0c0e14)', color: 'var(--text-muted, #8b8fa3)', fontSize: 13 }}>
        <Loader2 size={18} className="spin" style={{ marginRight: 8 }} /> Restoring your latest session…
      </div>
    );
  }

  if (stage === 'mission') {
    return (
      <MissionControlPage
        onSelectCircuit={() => { setCreateOnOpen(false); setStage('circuit'); }}
        onCreateCircuit={() => { setCreateOnOpen(true); setStage('circuit'); }}
        onLoadLatest={presetLatestSession}
        onDemo={presetGuidedDemo}
      />
    );
  }

  if (stage === 'circuit' || !gateCircuit) {
    return (
      <CircuitGatePage
        startCreating={createOnOpen}
        onBack={() => setStage('mission')}
        onOpenDashboard={(c) => { setActiveCircuit(c); setGateCircuit(c); setStage('garage'); }}
      />
    );
  }

  if (stage === 'garage') {
    return (
      <GarageProfileGatePage
        circuit={gateCircuit}
        onBack={() => setStage('circuit')}
        onContinue={() => setStage('mode')}
      />
    );
  }

  if (stage === 'mode' || !sessionCtx) {
    return (
      <SessionModeGatePage
        circuit={gateCircuit}
        onBack={() => { clearSessionContext(); setSessionCtx(null); setStage('garage'); }}
        onOpen={(ctx) => {
          const gp = getGarageProfile();
          const merged = gp
            ? { ...ctx, setup: { rider: gp.rider.name, bike: `${gp.bike.brand} ${gp.bike.model}`, ...ctx.setup } }
            : ctx;
          setSessionContext(merged);
          setSessionCtx(merged);
          setStage('data');
        }}
      />
    );
  }

  if (stage === 'data') {
    return (
      <DataSourceGatePage
        ctx={sessionCtx}
        onBack={() => setStage('mode')}
        onContinue={(dataSource) => {
          const updated = { ...sessionCtx, setup: { ...sessionCtx.setup, dataSource } };
          setSessionContext(updated);
          setSessionCtx(updated);
          setStage('launch');
        }}
      />
    );
  }

  if (stage === 'booting') {
    return <BootSequence ctx={sessionCtx} onDone={() => setStage('dashboard')} />;
  }

  if (stage === 'launch') {
    return (
      <LaunchBriefPage
        circuit={gateCircuit}
        ctx={sessionCtx}
        onBack={() => setStage('data')}
        onLaunch={() => { void persistSessionContext(sessionCtx); setStage('booting'); }}
      />
    );
  }

  return <DashboardShell />;
}

function AppEntryFlow() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppEntryFlowContent />
      </ToastProvider>
    </AuthProvider>
  );
}

function AppRouter() {
  const route = getAppRoute(getPathname());

  switch (route) {
    case 'login':
      return <LoginPage />;
    case 'trial':
      return <TrialHomePage />;
    case 'thanks':
      return <ThanksPage />;
    case 'founding-nodes':
      return <FoundingNodesPage />;
    case 'app':
      return <AppEntryFlow />;
    case 'home':
    default:
      return <AuthProvider><HomePage /></AuthProvider>;
  }
}

export function App() {
  return <AppRouter />;
}
