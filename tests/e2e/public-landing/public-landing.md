### E2E Tests: Public Landing

**Suite ID:** `PUBLIC-LANDING-E2E`
**Feature:** Public KDD landing communication

---

## Test Case: `PUBLIC-LANDING-E2E-001` - Communicates the KDD decision intelligence layer

**Priority:** `critical`

**Tags:**
- type → @e2e
- feature → @public-landing

**Description/Objective:** Verify the public landing presents KDD as a sober decision intelligence layer above telemetry.

**Preconditions:**
- Vite dev server can serve the app locally.
- Chromium browser is installed for Playwright.

### Flow Steps:
1. Open the public landing page.
2. Verify the document title, hero and core positioning copy.
3. Verify the decision loop, non-telemetry positioning, node concepts and primary CTAs.
4. Verify the application manual download link is present.

### Expected Result:
- The page communicates KDD Moto Intelligence and the Knowledge Network clearly.
- Early Access, Founding Node and manual links target the expected public paths.

### Key verification points:
- Title, hero lead, decision loop and node concept sections are visible.
- CTA links point to `/trial`, `/founding-nodes` and `/kdd-application-manual.md`.
