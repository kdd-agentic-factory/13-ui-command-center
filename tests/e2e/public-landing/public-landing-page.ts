import { expect, type Locator, type Page } from '@playwright/test';

import { BasePage } from '../base-page';

export class PublicLandingPage extends BasePage {
  readonly earlyAccessLink: Locator;
  readonly foundingNodeLink: Locator;
  readonly manualLink: Locator;
  readonly resultsSummaryLink: Locator;
  readonly experimentalDesignLink: Locator;

  constructor(page: Page) {
    super(page);
    this.earlyAccessLink = page.getByRole('link', { name: 'Request early access' }).first();
    this.foundingNodeLink = page.getByRole('link', { name: 'Become a founding node' }).first();
    this.manualLink = page.getByRole('link', { name: 'Download application manual' }).first();
    this.resultsSummaryLink = page.getByRole('link', { name: /Download results summary PDF/i });
    this.experimentalDesignLink = page.getByRole('link', { name: /Download experimental design PDF/i });
  }

  async goto(): Promise<void> {
    await super.goto('/');
  }

  async expectEditorialLandingContent(): Promise<void> {
    await expect(this.page).toHaveTitle('KDD Knowledge Network — Decision Intelligence Layer for Motorcycle Performance');
    await expect(this.page.getByRole('heading', { name: 'KDD' })).toBeVisible();
    await expect(this.page.getByText('We do not replace your telemetry. We turn it into actionable knowledge.')).toBeVisible();
    await expect(this.page.getByRole('heading', { name: 'The Decision Loop' })).toBeVisible();
    await expect(this.page.getByRole('heading', { name: 'T15 Bucine — How the circuit works' })).toBeVisible();
    await expect(this.earlyAccessLink).toHaveAttribute('href', '/trial');
    await expect(this.foundingNodeLink).toHaveAttribute('href', '/founding-nodes');
    await expect(this.page.getByRole('heading', { name: 'Raw data protected, learning travels' })).toBeVisible();
    await expect(this.page.getByRole('heading', { name: 'Node Modes' })).toBeVisible();
    await expect(this.page.getByRole('heading', { name: 'Application Manual' })).toBeVisible();
    await expect(this.manualLink).toHaveAttribute('href', '/kdd-application-manual.md');
    await expect(this.page.getByRole('heading', { name: 'Paper Reproducibility Kit' })).toBeVisible();
    await expect(this.page.getByText('build/main.pdf')).toBeVisible();
    await expect(this.page.getByRole('heading', { name: /Accepted operating point: int4_32b_trackside/ })).toBeVisible();
    await expect(this.resultsSummaryLink).toHaveAttribute('href', '/paper-kit/results-summary.pdf');
    await expect(this.resultsSummaryLink).toHaveAttribute('download', '');
    await expect(this.experimentalDesignLink).toHaveAttribute('href', '/paper-kit/experimental-design.pdf');
    await expect(this.experimentalDesignLink).toHaveAttribute('download', '');
  }
}
