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
      await expectNoHorizontalOverflow(page);
    });
  }
});
