import { expect, test, type Page } from '@playwright/test';

interface CriticalRoute {
  path: string;
  title: RegExp;
  visibleText: RegExp;
  expectedUrl?: RegExp;
}

const productionTitle = /KDD Knowledge Network|KDD Hub by Keedio/i;

const criticalRoutes: CriticalRoute[] = [
  {
    path: '/',
    title: productionTitle,
    visibleText: /Keedio Knowledge Circuit|KDD Command Center|PitWall/i,
  },
  {
    path: '/pit-wall/',
    title: productionTitle,
    visibleText: /KDD|Keedio|PitWall|Aplicación/i,
  },
  {
    path: '/pit-wall/app',
    title: productionTitle,
    visibleText: /KDD|Keedio|PitWall|Aplicación|Command Center/i,
  },
  {
    path: '/pit-wall/app/',
    title: productionTitle,
    visibleText: /KDD|Keedio|PitWall|Aplicación|Command Center/i,
  },
  {
    path: '/nodes',
    title: productionTitle,
    visibleText: /Knowledge Nodes|Private, team and academy nodes|Open nodes in PitWall OS/i,
  },
  {
    path: '/federation',
    title: productionTitle,
    visibleText: /Federation|validated learning between nodes|Open federation cockpit/i,
  },
  {
    path: '/copilot',
    title: productionTitle,
    visibleText: /KDD Copilot|not generic chat|Open Copilot in PitWall OS/i,
  },
  {
    path: '/research-lab',
    title: productionTitle,
    visibleText: /KDD Research Lab|reproducible protocols|Open research cockpit/i,
  },
  {
    path: '/platform',
    title: productionTitle,
    visibleText: /Platform|coordinates services|Open platform cockpit/i,
  },
  {
    path: '/status/',
    title: productionTitle,
    visibleText: /Operational Status|Frontends|service health|Estado/i,
  },
  {
    path: '/command-center/',
    title: productionTitle,
    visibleText: /KDD|Keedio|PitWall|Aplicación|Command Center/i,
  },
  {
    path: '/copilot/',
    title: productionTitle,
    visibleText: /KDD Copilot|not generic chat|Open Copilot in PitWall OS/i,
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
        if (route.expectedUrl !== undefined) {
          await expect(page).toHaveURL(route.expectedUrl);
        }
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

      const pitWallLink = page.locator('a[href="/pit-wall/app"]').first();
      await expect(pitWallLink).toBeVisible();
      await expect(pitWallLink).toHaveAttribute('href', '/pit-wall/app');
      await expect(page.locator('a[href="/nodes"]').first()).toBeVisible();
      await expect(page.locator('a[href="/federation"]').first()).toBeVisible();
      await expect(page.locator('a[href="/copilot"]').first()).toBeVisible();
      await expect(page.locator('a[href="/research-lab"]').first()).toBeVisible();
      await expect(page.locator('a[href="/platform"]').first()).toBeVisible();
      await page.waitForTimeout(5500);
      await expect(page).toHaveURL(/\/$/);
      await expect(page.locator('body')).toContainText(/canonical|PitWall|KDD Command Center|decisión/i);
      await expect(page.locator('body')).not.toContainText(/InsForge Managed/i);
    },
  );
});
