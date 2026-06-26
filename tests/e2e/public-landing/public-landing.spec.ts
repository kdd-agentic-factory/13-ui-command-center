import { test } from '@playwright/test';

import { PublicLandingPage } from './public-landing-page';

test.describe('Public landing', () => {
  test(
    'communicates the KDD decision intelligence layer',
    { tag: ['@critical', '@e2e', '@public-landing', '@PUBLIC-LANDING-E2E-001'] },
    async ({ page }) => {
      const landing = new PublicLandingPage(page);

      await landing.goto();
      await landing.expectEditorialLandingContent();
    },
  );
});
