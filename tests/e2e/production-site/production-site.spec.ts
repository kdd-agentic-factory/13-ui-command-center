import { expect, test, type Page } from '@playwright/test';

const criticalRoutes = [
  {
    path: '/',
    title: /KDD Knowledge Network|KDD Agentic Factory/i,
    visibleText: /Telemetry measures|KDD Agentic Factory/i,
  },
  {
    path: '/pit-wall/',
    title: /KDD Knowledge Network/i,
    visibleText: /KDD|Knowledge|Decision/i,
  },
  {
    path: '/pit-wall/app',
    title: /KDD Knowledge Network/i,
    visibleText: /KDD|Race|Engineer|Mission|Dashboard|Oracle|Telemetry/i,
  },
  {
    path: '/pit-wall/app/',
    title: /KDD Knowledge Network/i,
    visibleText: /KDD|Race|Engineer|Mission|Dashboard|Oracle|Telemetry/i,
  },
  {
    path: '/status/',
    title: /KDD System Status|KDD Agentic Factory/i,
    visibleText: /Frontends and service health|Infrastructure Health/i,
  },
  {
    path: '/command-center/',
    title: /Race Command Center/i,
    visibleText: /Race|Command|Telemetry|Circuit|Dashboard/i,
  },
  {
    path: '/copilot/',
    title: /Race AI Copilot/i,
    visibleText: /Copilot|AI|Telemetry|Ask/i,
  },
];

const knownWarnings = [
  /PostHog was initialized without a token/i,
];

async function collectConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      const text = message.text();
      const isKnown = knownWarnings.some((re) => re.test(text));
      if (isKnown) return;
      errors.push(text);
    }
  });
  page.on('pageerror', (error) => {
    errors.push(error.message);
  });
  return errors;
}

test.describe('Production site composition', () => {
  for (const route of criticalRoutes) {
    test(
      `loads ${route.path} without critical frontend failures`,
      { tag: ['@critical', '@e2e', '@production', '@composition'] },
      async ({ page }) => {
        const errors = await collectConsoleErrors(page);
        const response = await page.goto(route.path, { waitUntil: 'load' });

        expect(response?.ok(), `${route.path} should return a successful HTTP response`).toBe(true);
        await expect(page).toHaveTitle(route.title);
        await expect(page.locator('body')).toContainText(route.visibleText);

        const brokenAssetErrors = errors.filter((error) =>
          /failed to load module script|loading chunk|net::ERR_ABORTED|mime type|\.(js|css|woff2?|html)\b/i.test(error),
        );
        expect(brokenAssetErrors, `${route.path} should not have missing critical assets`).toEqual([]);
      },
    );
  }

  test(
    'keeps product home focused on the canonical Pit Wall instead of service-launcher copy',
    { tag: ['@critical', '@e2e', '@production', '@home'] },
    async ({ page }) => {
      await page.goto('/', { waitUntil: 'networkidle' });

      const pitWallLink = page.getByRole('link', { name: /Open the canonical Pit Wall|KDD Command Center/i }).first();
      await expect(pitWallLink).toBeVisible();
      await expect(pitWallLink).toHaveAttribute('href', '/pit-wall/app');
      await expect(page.locator('body')).toContainText(/canonical|Pit Wall|Decision/i);
      await expect(page.locator('body')).not.toContainText(/InsForge Managed/i);
    },
  );
});
