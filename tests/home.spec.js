import { expect, test } from '@playwright/test';

async function expectNoHorizontalOverflow(page) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));

  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
}

test('presents the supplied identity and introductory content', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Adam Jones/);
  await expect(page.getByRole('heading', { level: 1, name: 'Adam Jones' })).toBeVisible();
  await expect(page.getByText('JavaScript developer & designer')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Projects + experiments' })).toBeVisible();
  await expect(page.getByText(/home for projects/i).first()).toBeVisible();
});

test('renders the project and experiment catalogue as a labelled semantic list', async ({ page }) => {
  await page.goto('/');

  const catalogue = page.getByRole('list', { name: 'Project and experiment catalogue' });
  const entries = catalogue.getByRole('listitem');

  await expect(entries).toHaveCount(2);
  await expect(entries.nth(0).getByText('Project', { exact: true })).toBeVisible();
  await expect(entries.nth(0).getByRole('heading', { level: 3, name: 'Adam Jones Lab' })).toBeVisible();
  await expect(
    entries.nth(0).getByText('A lightweight home for projects, prototypes, and small web experiments.'),
  ).toBeVisible();
  await expect(entries.nth(1).getByText('Experiment', { exact: true })).toBeVisible();
  await expect(entries.nth(1).getByRole('heading', { level: 3, name: 'Interactive accent' })).toBeVisible();
  await expect(entries.nth(1).getByText('A composition that rearranges when activated.')).toBeVisible();
  await expect(catalogue.getByRole('article')).toHaveCount(2);
  await expect(catalogue.getByRole('link')).toHaveCount(0);
  await expect(page.getByText(/first entries are still taking shape/i)).toHaveCount(0);
});

test('supports pointer use, visible keyboard navigation, and native button activation', async ({ page }) => {
  await page.goto('/');

  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toHaveCSS('opacity', '1');

  await skipLink.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();

  const projectsLink = page.getByRole('link', { name: 'Projects + experiments' });
  await projectsLink.focus();
  await expect(projectsLink).toHaveCSS('outline-style', 'solid');

  const accent = page.getByRole('button', { name: 'Rearrange the accent' });
  await accent.click();
  await expect(accent).toHaveAttribute('data-state', '1');

  await projectsLink.focus();
  await page.keyboard.press('Tab');
  await expect(accent).toBeFocused();
  await expect(accent).toHaveCSS('outline-style', 'solid');
  await accent.press('Enter');
  await expect(accent).toHaveAttribute('data-state', '2');
  await accent.press('Space');
  await expect(accent).toHaveAttribute('data-state', '0');
});

test('removes decorative transitions when reduced motion is preferred', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  const disc = page.locator('.accent-shape--disc');
  await expect(disc).toHaveCSS('transition-duration', '0s');
});

test.describe('responsive layout', () => {
  for (const viewport of [
    { name: 'mobile', width: 375, height: 812 },
    { name: 'desktop', width: 1440, height: 900 },
  ]) {
    test(`has no horizontal overflow at ${viewport.name} size`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/');

      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('.catalogue-item')).toHaveCount(2);
      await expectNoHorizontalOverflow(page);

      if (viewport.name === 'mobile') {
        const positions = await page.locator('.catalogue-item').evaluateAll((items) =>
          items.map((item) => {
            const bounds = item.getBoundingClientRect();
            return { top: bounds.top, bottom: bounds.bottom };
          }),
        );

        expect(positions[1].top).toBeGreaterThanOrEqual(positions[0].bottom);
      }
    });
  }
});
