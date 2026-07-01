import '../i18n'; // must be first — initialises i18next before any component renders
import { useEffect, useRef, useState } from 'react';

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
import { KddHubPage, PublicModulePage } from '../pages/public/KddHubPage';
import { LoginPage } from '../pages/public/LoginPage';
import { TrialHomePage } from '../pages/public/TrialHomePage';
import { ThanksPage } from '../pages/public/ThanksPage';
import { FoundingNodesPage } from '../pages/public/FoundingNodesPage';

function getPathname(): string {
  if (typeof window === 'undefined') return '/';

  const pathname = window.location.pathname;
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

  if (basePath && basePath !== '/' && (pathname === basePath || pathname.startsWith(`${basePath}/`))) {
    return pathname.slice(basePath.length) || '/';
  }

  return pathname;
}

type AppRoute =
  | 'home'
  | 'hub'
  | 'core'
  | 'login'
  | 'trial'
  | 'thanks'
  | 'founding-nodes'
  | 'app'
  | 'research'
  | 'architecture'
  | 'status'
  | 'admin';

function getAppRoute(pathname: string): AppRoute {
  if (pathname === '/hub' || pathname.startsWith('/hub/')) return 'hub';

  if (
    pathname === '/core' ||
    pathname.startsWith('/core/') ||
    pathname === '/profiles' ||
    pathname.startsWith('/profiles/') ||
    pathname === '/modules' ||
    pathname.startsWith('/modules/')
  ) return 'core';

  if (
    pathname === '/app' ||
    pathname.startsWith('/app/') ||
    pathname === '/pitwall' ||
    pathname.startsWith('/pitwall/') ||
    pathname === '/pit-wall' ||
    pathname.startsWith('/pit-wall/') ||
    pathname === '/pit-wall/app' ||
    pathname.startsWith('/pit-wall/app/') ||
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/') ||
    pathname === '/copilot' ||
    pathname.startsWith('/copilot/') ||
    pathname === '/command' ||
    pathname.startsWith('/command/') ||
    pathname === '/command-center' ||
    pathname.startsWith('/command-center/')
  ) return 'app';
  if (pathname === '/login') return 'login';
  if (pathname === '/trial' || pathname.startsWith('/trial/')) return 'trial';
  if (pathname === '/founding-node-thanks') return 'thanks';
  if (pathname === '/founding-nodes') return 'founding-nodes';
  if (pathname === '/research' || pathname.startsWith('/research/')) return 'research';
  if (pathname === '/architecture' || pathname.startsWith('/architecture/')) return 'architecture';
  if (pathname === '/status' || pathname.startsWith('/status/')) return 'status';
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return 'admin';
  return 'home';
}

function AppEntryFlowContent({ autoLaunchDemo = true }: { autoLaunchDemo?: boolean }) {
  const { profile, login, user, authLoading } = useProfile();
  const [pendingProfile, setPendingProfile] = useState<ProfileId | null>(null);
  type Stage = 'restoring' | 'mission' | 'circuit' | 'garage' | 'mode' | 'data' | 'launch' | 'booting' | 'dashboard';
  const [stage, setStage] = useState<Stage>('restoring');
  const [createOnOpen, setCreateOnOpen] = useState(false);
  const [gateCircuit, setGateCircuit] = useState<CircuitRecord | null>(null);
  const [sessionCtx, setSessionCtx] = useState<SessionContext | null>(null);
  const [resumeSnapshot, setResumeSnapshot] = useState<import('./sessionResume').SessionResumeSnapshot | null>(null);

  /** Tracks whether we auto-launched the demo for first-time visitors (pit-wall mode). */
  const autoDemoLaunched = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function resumeLatestSession() {
      if (authLoading) return;
      if (!profile) return;

      // Auto-demo launched — don't override the stage to 'mission'
      if (autoDemoLaunched.current) return;

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
      setResumeSnapshot(snapshot);
      setStage(snapshot.stage);
    }

    void resumeLatestSession();
    return () => { cancelled = true; };
  }, [authLoading, profile?.id, user?.id]);

  // ── Auto-demo for first-time visitors (pit-wall / no saved profile) ──
  useEffect(() => {
    if (!autoLaunchDemo) return;
    if (autoDemoLaunched.current) return;

    const savedProfile = localStorage.getItem('kdd-profile');
    if (!savedProfile) {
      autoDemoLaunched.current = true;
      login('founding-node');
      presetGuidedDemo(); // jump to LaunchBriefPage → BootSequence → DashboardShell
    }
  }, [autoLaunchDemo, login]);

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

  // Do not block the public demo on remote auth. If the auto-demo effect has not
  // run yet, fall through to the intro instead of freezing on a loading screen.

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
        onLoadLatest={resumeSnapshot ? () => {
          // Resume the actual persisted session data
          if (resumeSnapshot.gateCircuit) {
            setActiveCircuit(resumeSnapshot.gateCircuit);
            setGateCircuit(resumeSnapshot.gateCircuit);
          }
          if (resumeSnapshot.garageProfile) {
            setGarageProfile(resumeSnapshot.garageProfile);
          }
          setSessionContext(resumeSnapshot.sessionCtx);
          setSessionCtx(resumeSnapshot.sessionCtx);
          setStage('launch');
        } : presetLatestSession}
        onDemo={presetGuidedDemo}
        resumeContext={resumeSnapshot}
        onNewSession={() => {
          clearSessionContext();
          setSessionCtx(null);
          setResumeSnapshot(null);
          setStage('mission');
        }}
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

function AppEntryFlow({ autoLaunchDemo = true }: { autoLaunchDemo?: boolean }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppEntryFlowContent autoLaunchDemo={autoLaunchDemo} />
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
    case 'hub':
      return <KddHubPage />;
    case 'core':
      return <AppEntryFlow autoLaunchDemo={false} />;
    case 'research':
      return (
        <PublicModulePage
          eyebrow="Applied Research Layer"
          title="KDD Research Lab"
          body="ORCID-backed applied research powering KDD modules, validation methods, reproducibility evidence and the governance model behind the Knowledge Circuit. Module not connected yet; this public page keeps the route stable while the research surface is integrated."
          primaryHref="/hub"
          primaryLabel="Back to Hub"
        />
      );
    case 'architecture':
      return (
        <PublicModulePage
          eyebrow="Technical Architecture"
          title="Architecture"
          body="Route map, routing contract, entity model and architecture documentation live here instead of the public home. The home orients the product; this page documents the system. Module not connected yet."
          primaryHref="/hub"
          primaryLabel="Back to Hub"
        />
      );
    case 'status':
      return (
        <PublicModulePage
          eyebrow="Operational Status"
          title="Status"
          body="Runtime health, incidents, blocked services and operational snapshots belong in status — not in the public home. Module not connected yet."
          primaryHref="/hub"
          primaryLabel="Back to Hub"
        />
      );
    case 'admin':
      return (
        <PublicModulePage
          eyebrow="Admin Layer"
          title="Admin"
          body="Module health, learning signals, audit events, model updates and operator-only context belong in Admin. Module not connected yet."
          primaryHref="/hub"
          primaryLabel="Back to Hub"
        />
      );
    case 'app':
      return <AppEntryFlow />;
    case 'home':
    default:
      return <KddHubPage autoRedirectTo="/core" />;
  }
}

export function App() {
  return <AppRouter />;
}
