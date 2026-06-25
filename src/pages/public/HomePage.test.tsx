import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import en from '../../i18n/locales/en';
import es from '../../i18n/locales/es';

let currentLocale: Record<string, unknown> = en;
let currentUser: { id: string } | null = null;
let currentReducedMotion = false;
let activeCanvases = {
  designs: false,
  privacy: false,
  workflow: false,
};

type CanvasMockProps = {
  active?: boolean;
  mode?: string;
  selectedId?: string | null;
  reducedMotion?: boolean;
  isActive?: boolean;
  emphasis?: string;
  motionState?: string;
  [key: string]: unknown;
};

type MatchMediaMock = MediaQueryList & {
  matches: boolean;
  dispatchChange: (matches: boolean) => void;
};

function createMatchMediaMock(matches: boolean): MatchMediaMock {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  const mock = {
    matches,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener: vi.fn((type: string, listener: EventListenerOrEventListenerObject) => {
      if (type !== 'change' || typeof listener === 'function') return;
      listeners.add(listener as unknown as (event: MediaQueryListEvent) => void);
    }),
    removeEventListener: vi.fn((type: string, listener: EventListenerOrEventListenerObject) => {
      if (type !== 'change' || typeof listener === 'function') return;
      listeners.delete(listener as unknown as (event: MediaQueryListEvent) => void);
    }),
    addListener: vi.fn((listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    }),
    removeListener: vi.fn((listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    }),
    dispatchChange(nextMatches: boolean) {
      mock.matches = nextMatches;
      mock.onchange?.({ matches: nextMatches, media: mock.media } as MediaQueryListEvent);
      listeners.forEach(listener => listener({ matches: nextMatches, media: mock.media } as MediaQueryListEvent));
    },
  } as unknown as MatchMediaMock;

  return mock;
}

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];

  readonly observed = new Set<Element>();

  constructor(private readonly callback: IntersectionObserverCallback) {
    MockIntersectionObserver.instances.push(this);
  }

  observe = (target: Element) => {
    this.observed.add(target);
  };

  unobserve = (target: Element) => {
    this.observed.delete(target);
  };

  disconnect = () => {
    this.observed.clear();
  };

  takeRecords = (): IntersectionObserverEntry[] => [];

  trigger(target: Element, isIntersecting = true, intersectionRatio = 1) {
    this.callback([
      {
        target,
        isIntersecting,
        intersectionRatio,
      } as IntersectionObserverEntry,
    ], this as unknown as IntersectionObserver);
  }
}

vi.mock('../../components/public/KddHeroVisual', () => ({
  KddHeroVisual: (props: CanvasMockProps) => (
    <div
      data-testid="hero-visual"
      data-active={String(Boolean(props.active ?? props.isActive))}
      data-mode={String(props.mode ?? props.emphasis ?? 'unknown')}
      data-emphasis={String(props.emphasis ?? props.mode ?? 'unknown')}
      data-motion-state={String(props.motionState ?? (props.reducedMotion ? 'reduced' : 'live'))}
      data-selected-id={props.selectedId ?? ''}
      data-reduced-motion={String(Boolean(props.reducedMotion))}
    />
  ),
}));

vi.mock('../../components/public/DesignsCanvas', () => ({
  DesignsCanvas: (props: CanvasMockProps) => {
    activeCanvases.designs = Boolean(props.active ?? props.isActive);
    return (
      <div
        data-testid="designs-canvas"
        data-active={String(Boolean(props.active ?? props.isActive))}
        data-mode={String(props.mode ?? props.emphasis ?? 'unknown')}
        data-selected-id={props.selectedId ?? ''}
        data-reduced-motion={String(Boolean(props.reducedMotion))}
      />
    );
  },
}));

vi.mock('../../components/public/PrivacyCanvas', () => ({
  PrivacyCanvas: (props: CanvasMockProps) => {
    activeCanvases.privacy = Boolean(props.active ?? props.isActive);
    return (
      <div
        data-testid="privacy-canvas"
        data-active={String(Boolean(props.active ?? props.isActive))}
        data-mode={String(props.mode ?? props.emphasis ?? 'unknown')}
        data-selected-id={props.selectedId ?? ''}
        data-reduced-motion={String(Boolean(props.reducedMotion))}
      />
    );
  },
}));

vi.mock('../../components/public/WorkflowCanvas', () => ({
  WorkflowCanvas: (props: CanvasMockProps) => {
    activeCanvases.workflow = Boolean(props.active ?? props.isActive);
    return (
      <div
        data-testid="workflow-canvas"
        data-active={String(Boolean(props.active ?? props.isActive))}
        data-mode={String(props.mode ?? props.emphasis ?? 'unknown')}
        data-selected-id={props.selectedId ?? ''}
        data-reduced-motion={String(Boolean(props.reducedMotion))}
      />
    );
  },
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: currentUser, authLoading: false }),
}));

vi.mock('../../components/LanguageSwitcher', () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher" />,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: createTranslator(currentLocale) }),
}));

import { HomePage } from './HomePage';

function createTranslator(locale: Record<string, unknown>) {
  return (path: string, options?: { returnObjects?: boolean }) => {
    const value = path.split('.').reduce<unknown>((current, key) => {
      if (typeof current !== 'object' || current === null || !(key in current)) return undefined;
      return (current as Record<string, unknown>)[key];
    }, locale);

    if (options?.returnObjects) return value;
    return typeof value === 'string' ? value : path;
  };
}

beforeEach(() => {
  currentLocale = en;
  currentUser = null;
  currentReducedMotion = false;
  activeCanvases = {
    designs: false,
    privacy: false,
    workflow: false,
  };
  MockIntersectionObserver.instances = [];
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  vi.stubGlobal('matchMedia', vi.fn(() => createMatchMediaMock(currentReducedMotion)));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('HomePage resume session CTA', () => {
  it('shows a signed-in cue in the landing header for authenticated visitors', () => {
    currentLocale = en;
    currentUser = { id: 'user-1' };

    render(<HomePage />);

    const header = screen.getByRole('banner');

    expect(within(header).getByText('Welcome back')).toBeInTheDocument();
    expect(within(header).getByTestId('language-switcher')).toBeInTheDocument();
  });

  it('keeps public ordering for visitors who are not authenticated', () => {
    currentLocale = en;
    currentUser = null;

    render(<HomePage />);

    const resumeLink = screen.getByRole('link', { name: /resume last session/i });
    const heroLinks = within(resumeLink.closest('div')!).getAllByRole('link');

    expect(heroLinks.map(link => link.getAttribute('href'))).toEqual(['/founding-nodes', '/app', '/login']);
  });

  it('routes sign in from the header to the login page', () => {
    currentLocale = en;

    render(<HomePage />);

    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login');
  });

  it('shows a welcome back indicator for authenticated visitors', () => {
    currentLocale = en;
    currentUser = { id: 'user-1' };

    render(<HomePage />);

    expect(screen.getByText('Welcome back — resume your last session')).toBeInTheDocument();
    expect(screen.getByText(/resume your last session/i)).toBeInTheDocument();
  });

  it('keeps the indicator hidden for guests', () => {
    currentLocale = en;
    currentUser = null;

    render(<HomePage />);

    expect(screen.queryByText(/welcome back/i)).not.toBeInTheDocument();
  });

  it('promotes resume last session to the first CTA for authenticated visitors', () => {
    currentLocale = es;
    currentUser = { id: 'user-1' };

    render(<HomePage />);

    const resumeLink = screen.getByRole('link', { name: /reanudar la última sesión/i });
    const heroLinks = within(resumeLink.closest('div')!).getAllByRole('link');

    expect(heroLinks.map(link => link.getAttribute('href'))).toEqual(['/app', '/founding-nodes', '/login']);
  });

  it('renders the wider platform-design section', () => {
    currentLocale = en;

    render(<HomePage />);

    expect(screen.getByText(/decision intelligence layer/i)).toBeInTheDocument();
    expect(screen.getByText(/federated knowledge network/i)).toBeInTheDocument();
    expect(screen.getByText(/sense → decide → federate → validate/i)).toBeInTheDocument();
    expect(screen.getByTestId('designs-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('privacy-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument();
  });

  it('passes shared activation state and reduced motion to the live diagrams', () => {
    currentLocale = en;
    currentReducedMotion = true;

    render(<HomePage />);

    const designsSection = screen.getByTestId('section-designs');
    const privacySection = screen.getByTestId('section-privacy');
    const workflowSection = screen.getByTestId('section-workflow');

    expect(screen.getByTestId('designs-canvas')).toHaveAttribute('data-active', 'true');
    expect(screen.getByTestId('designs-canvas')).toHaveAttribute('data-mode', 'active');
    expect(screen.getByTestId('designs-canvas')).toHaveAttribute('data-selected-id', 'designs');
    expect(screen.getByTestId('designs-canvas')).toHaveAttribute('data-reduced-motion', 'true');
    expect(screen.getByTestId('privacy-canvas')).toHaveAttribute('data-active', 'false');
    expect(screen.getByTestId('privacy-canvas')).toHaveAttribute('data-mode', 'recede');
    expect(screen.getByTestId('privacy-canvas')).toHaveAttribute('data-selected-id', 'designs');
    expect(screen.getByTestId('workflow-canvas')).toHaveAttribute('data-active', 'false');
    expect(screen.getByTestId('workflow-canvas')).toHaveAttribute('data-mode', 'recede');
    expect(screen.getByTestId('workflow-canvas')).toHaveAttribute('data-reduced-motion', 'true');
    expect(screen.getByTestId('hero-visual')).toHaveAttribute('data-selected-id', 'designs');
    expect(screen.getByTestId('hero-visual')).toHaveAttribute('data-emphasis', 'active');
    expect(screen.getByTestId('hero-visual')).toHaveAttribute('data-motion-state', 'reduced');

    const observer = MockIntersectionObserver.instances[0];
    expect(observer).toBeDefined();

    act(() => {
      observer?.trigger(privacySection);
    });
    expect(screen.getByTestId('privacy-canvas')).toHaveAttribute('data-active', 'true');
    expect(screen.getByTestId('privacy-canvas')).toHaveAttribute('data-mode', 'active');
    expect(screen.getByTestId('privacy-canvas')).toHaveAttribute('data-selected-id', 'privacy');
    expect(screen.getByTestId('designs-canvas')).toHaveAttribute('data-active', 'false');
    expect(screen.getByTestId('designs-canvas')).toHaveAttribute('data-mode', 'recede');
    expect(screen.getByTestId('hero-visual')).toHaveAttribute('data-emphasis', 'recede');

    const privacyButton = screen.getByRole('button', { name: /activate privacy diagram/i });
    expect(privacyButton).toHaveAccessibleName('Activate privacy diagram');

    act(() => {
      privacyButton.focus();
    });
    expect(privacyButton).toHaveFocus();
    expect(privacyButton).toHaveStyle({ outline: '2px solid rgba(165, 180, 252, 0.8)', outlineOffset: '3px' });
    expect(screen.getByTestId('privacy-canvas')).toHaveAttribute('data-active', 'true');

    act(() => {
      fireEvent.click(privacyButton);
    });
    expect(screen.getByTestId('privacy-canvas')).toHaveAttribute('data-selected-id', 'privacy');
    expect(privacyButton).toHaveAttribute('aria-pressed', 'true');

    const workflowButton = screen.getByRole('button', { name: /activate workflow diagram/i });

    act(() => {
      fireEvent.touchStart(workflowButton);
    });
    expect(screen.getByTestId('workflow-canvas')).toHaveAttribute('data-selected-id', 'workflow');
    expect(screen.getByTestId('workflow-canvas')).toHaveAttribute('data-active', 'true');
    expect(workflowButton).toHaveAttribute('aria-pressed', 'true');

    expect(screen.getByRole('button', { name: /activate designs diagram/i })).toBeVisible();
    expect(screen.getByRole('button', { name: /activate privacy diagram/i })).toBeVisible();
    expect(screen.getByRole('button', { name: /activate workflow diagram/i })).toBeVisible();

    fireEvent.mouseLeave(designsSection);
  });

  it('keeps the landing diagram controls visible and keyboard-friendly', () => {
    currentLocale = en;

    render(<HomePage />);

    const designsButton = screen.getByRole('button', { name: /activate designs diagram/i });
    expect(designsButton).toBeVisible();
    expect(designsButton).toHaveAttribute('aria-pressed', 'true');

    const privacyButton = screen.getByRole('button', { name: /activate privacy diagram/i });
    expect(privacyButton).toBeVisible();
    expect(privacyButton).toHaveAttribute('aria-pressed', 'false');

    act(() => {
      fireEvent.keyDown(privacyButton, { key: 'Enter' });
    });

    expect(screen.getByTestId('privacy-canvas')).toHaveAttribute('data-selected-id', 'privacy');
    expect(privacyButton).toHaveAttribute('aria-pressed', 'true');
  });
});
