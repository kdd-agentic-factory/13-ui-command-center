export type ProductModuleStatus = 'verified' | 'partial' | 'demo' | 'unverified' | 'external-blocker';
export interface ProductModule { id:string; label:string; status:ProductModuleStatus; ownerRepo:string; evidence:string[]; reason:string }
export const productModules: readonly ProductModule[] = [
  {
    "id": "overview",
    "label": "overview",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "pre-gp",
    "label": "pre gp",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "raceday",
    "label": "raceday",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "live",
    "label": "live",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "chassis",
    "label": "chassis",
    "status": "partial",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx",
      "docs/chassis-operation.md",
      "src/components/engineering/AnalysisRunPanel.tsx",
      "src/components/engineering/AnalysisRunPanel.test.tsx"
    ],
    "reason": "Preparación de sesión, snapshot persistido, estados de análisis, contraste, autoridad humana e informe guardado conectados a API; pruebas de UI controladas. Smoke vivo, dominios científicos y contraste externo pendientes."
  },
  {
    "id": "data",
    "label": "data",
    "status": "partial",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx",
      "docs/chassis-operation.md"
    ],
    "reason": "Flujo real con límites de fuente, física o activación comercial pendientes."
  },
  {
    "id": "cockpit",
    "label": "cockpit",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "telemetry",
    "label": "telemetry",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "circuit",
    "label": "circuit",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "corners",
    "label": "corners",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "setup",
    "label": "setup",
    "status": "partial",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/pages/ChassisSessionPage.tsx",
      "tests/chassisProductUI.test.tsx",
      "tests/e2e/chassis-product-workspace.spec.ts"
    ],
    "reason": "Vista de sesión real y revisiones autorizadas; contexto multimodal y validación comercial pendientes."
  },
  {
    "id": "parts",
    "label": "parts",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "twin",
    "label": "twin",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "tires",
    "label": "tires",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "pressure",
    "label": "pressure",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "crew",
    "label": "crew",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "replay",
    "label": "replay",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "compare",
    "label": "compare",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "ghost-lap",
    "label": "ghost lap",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "studio",
    "label": "studio",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "report",
    "label": "report",
    "status": "partial",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/pages/ChassisSessionPage.tsx",
      "tests/chassisProductUI.test.tsx",
      "tests/e2e/chassis-product-workspace.spec.ts"
    ],
    "reason": "Vista de sesión real y revisiones autorizadas; contexto multimodal y validación comercial pendientes."
  },
  {
    "id": "debrief",
    "label": "debrief",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "copilot",
    "label": "copilot",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "advisor",
    "label": "advisor",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "strategy",
    "label": "strategy",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "predict",
    "label": "predict",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "risk",
    "label": "risk",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "weather",
    "label": "weather",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "knowledge",
    "label": "knowledge",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "federated",
    "label": "federated",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "learning-path",
    "label": "learning path",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "patterns",
    "label": "patterns",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "research",
    "label": "research",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "sandbox",
    "label": "sandbox",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "sim-lab",
    "label": "sim lab",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "experiments",
    "label": "experiments",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "causal",
    "label": "causal",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "platform",
    "label": "platform",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "settings",
    "label": "settings",
    "status": "partial",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx",
      "docs/chassis-operation.md"
    ],
    "reason": "Flujo real con límites de fuente, física o activación comercial pendientes."
  },
  {
    "id": "edge",
    "label": "edge",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "lakehouse",
    "label": "lakehouse",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "devhub",
    "label": "devhub",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "trust",
    "label": "trust",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "orchestrator",
    "label": "orchestrator",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "stewards",
    "label": "stewards",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "pit-radio",
    "label": "pit radio",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "team",
    "label": "team",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "workbench",
    "label": "workbench",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "human",
    "label": "human",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "ai-crew",
    "label": "ai crew",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "black-box",
    "label": "black box",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "style",
    "label": "style",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "engctrl",
    "label": "engctrl",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "electronics",
    "label": "electronics",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "aero",
    "label": "aero",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "fuel",
    "label": "fuel",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "gearing",
    "label": "gearing",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "setup-lab",
    "label": "setup lab",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "brakes",
    "label": "brakes",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "bike-compare",
    "label": "bike compare",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "track-evo",
    "label": "track evo",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "surface",
    "label": "surface",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "events",
    "label": "events",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "history",
    "label": "history",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "cube",
    "label": "cube",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "season",
    "label": "season",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "quali",
    "label": "quali",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  },
  {
    "id": "rivals",
    "label": "rivals",
    "status": "unverified",
    "ownerRepo": "13-ui-command-center",
    "evidence": [
      "src/app/DashboardShell.tsx"
    ],
    "reason": "Módulo histórico restringido en sesiones reales; falta verificar su integración, persistencia y autorización."
  }
];
