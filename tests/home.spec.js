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

test('uses semantic paragraphs with a bounded, readable introduction', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const intro = page.locator('#about.prose');
  const paragraphs = intro.locator(':scope > p');

  await expect(paragraphs).toHaveCount(2);
  await expect(paragraphs.nth(0)).toHaveText('I make things for the web.');
  await expect(paragraphs.nth(1)).toHaveText(
    'This site is a home for projects, prototypes, and small experiments.',
  );

  const desktopMetrics = await intro.evaluate((element) => {
    const styles = getComputedStyle(element);
    const fontSize = Number.parseFloat(styles.fontSize);
    const lineHeight = Number.parseFloat(styles.lineHeight);
    const bounds = element.getBoundingClientRect();
    const containerWidth = element.parentElement?.getBoundingClientRect().width ?? bounds.width;

    return {
      width: bounds.width,
      containerWidth,
      leadingRatio: lineHeight / fontSize,
    };
  });

  expect(desktopMetrics.width).toBeLessThanOrEqual(600);
  expect(desktopMetrics.width).toBeLessThan(desktopMetrics.containerWidth * 0.8);
  expect(desktopMetrics.leadingRatio).toBeGreaterThanOrEqual(1.5);

  await page.setViewportSize({ width: 375, height: 812 });

  const mobileMetrics = await paragraphs.evaluateAll((elements) =>
    elements.map((element) => {
      const bounds = element.getBoundingClientRect();
      return { left: bounds.left, right: bounds.right, top: bounds.top, bottom: bounds.bottom };
    }),
  );

  expect(mobileMetrics[0].left).toBeGreaterThanOrEqual(0);
  expect(mobileMetrics[1].left).toBeGreaterThanOrEqual(0);
  expect(mobileMetrics[0].right).toBeLessThanOrEqual(375);
  expect(mobileMetrics[1].right).toBeLessThanOrEqual(375);
  expect(mobileMetrics[1].top - mobileMetrics[0].bottom).toBeGreaterThan(8);
  await expectNoHorizontalOverflow(page);
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

  const projectLink = entries.nth(0).getByRole('link', { name: 'Adam Jones Lab' });
  await expect(catalogue.getByRole('link')).toHaveCount(1);
  await expect(projectLink).toHaveAttribute('href', '/projects/adam-jones-lab/');
  await expect(projectLink).toHaveCSS('text-decoration-line', 'underline');
  await expect(entries.nth(1).getByRole('link')).toHaveCount(0);
  await expect(page.getByText(/first entries are still taking shape/i)).toHaveCount(0);
});

test('supports visible keyboard navigation and skip navigation', async ({ page }) => {
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

  const catalogueLink = page.getByRole('link', { name: 'Adam Jones Lab' });
  await catalogueLink.focus();
  await expect(catalogueLink).toHaveCSS('outline-style', 'solid');
  await expect(catalogueLink).toHaveCSS('outline-color', 'rgb(255, 79, 31)');
});

test('accent pointer movement is subtle, bounded, and resets on exit', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const accent = page.getByRole('button', { name: 'Rearrange the accent' });
  const composition = page.locator('.accent-composition');
  const bounds = await accent.boundingBox();

  expect(bounds).not.toBeNull();
  if (!bounds) return;

  const readOffset = () =>
    composition.evaluate((element) => {
      const styles = getComputedStyle(element);
      return {
        x: Number.parseFloat(styles.getPropertyValue('--accent-x')) || 0,
        y: Number.parseFloat(styles.getPropertyValue('--accent-y')) || 0,
      };
    });

  await page.mouse.move(bounds.x + bounds.width - 2, bounds.y + bounds.height / 2);
  let offset = await readOffset();
  expect(offset.x).toBeGreaterThan(6);
  expect(Math.abs(offset.x)).toBeLessThanOrEqual(8);
  expect(Math.abs(offset.y)).toBeLessThanOrEqual(8);

  await page.mouse.move(bounds.x + 2, bounds.y + bounds.height / 2);
  offset = await readOffset();
  expect(offset.x).toBeLessThan(-6);
  expect(Math.abs(offset.x)).toBeLessThanOrEqual(8);
  expect(Math.abs(offset.y)).toBeLessThanOrEqual(8);

  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + 2);
  offset = await readOffset();
  expect(offset.y).toBeLessThan(-6);
  expect(Math.abs(offset.x)).toBeLessThanOrEqual(8);
  expect(Math.abs(offset.y)).toBeLessThanOrEqual(8);

  await page.mouse.move(0, 0);
  await expect.poll(readOffset).toEqual({ x: 0, y: 0 });
});

test('accent keyboard input nudges without scrolling and native activation cycles once', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const accent = page.getByRole('button', { name: 'Rearrange the accent' });
  const composition = page.locator('.accent-composition');
  const instructions = page.locator('#accent-instructions');
  const readOffset = () =>
    composition.evaluate((element) => {
      const styles = getComputedStyle(element);
      return {
        x: Number.parseFloat(styles.getPropertyValue('--accent-x')) || 0,
        y: Number.parseFloat(styles.getPropertyValue('--accent-y')) || 0,
      };
    });

  await expect(accent).toHaveAttribute('aria-describedby', 'accent-instructions');
  await expect(instructions).toContainText(/arrow keys.*Activate.*Escape/s);

  await accent.focus();
  await expect(accent).toBeFocused();
  await expect(accent).toHaveCSS('outline-style', 'solid');
  const initialScroll = await page.evaluate(() => window.scrollY);

  await accent.press('ArrowRight');
  await expect.poll(readOffset).toEqual({ x: 2, y: 0 });
  await accent.press('ArrowDown');
  await expect.poll(readOffset).toEqual({ x: 2, y: 2 });
  await accent.press('ArrowLeft');
  await expect.poll(readOffset).toEqual({ x: 0, y: 2 });
  await accent.press('ArrowUp');
  await expect.poll(readOffset).toEqual({ x: 0, y: 0 });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(initialScroll);

  for (let step = 0; step < 10; step += 1) await accent.press('ArrowRight');
  await expect.poll(readOffset).toEqual({ x: 8, y: 0 });

  await accent.press('Escape');
  await expect.poll(readOffset).toEqual({ x: 0, y: 0 });

  await accent.press('Enter');
  await expect(accent).toHaveAttribute('data-state', '1');
  await accent.press('Space');
  await expect(accent).toHaveAttribute('data-state', '2');
  await accent.click();
  await expect(accent).toHaveAttribute('data-state', '0');
});

test('accent ignores touch movement while ordinary activation remains available', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');

  const accent = page.getByRole('button', { name: 'Rearrange the accent' });
  const composition = page.locator('.accent-composition');
  const bounds = await accent.boundingBox();

  expect(bounds).not.toBeNull();
  if (!bounds) return;

  await accent.dispatchEvent('pointermove', {
    pointerType: 'touch',
    clientX: bounds.x + bounds.width,
    clientY: bounds.y + bounds.height,
  });
  await expect(composition).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');

  await accent.click();
  await expect(accent).toHaveAttribute('data-state', '1');
});

test('accent and shape transitions are removed when reduced motion is preferred', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  await expect(page.locator('.accent-composition')).toHaveCSS('transition-duration', '0s');
  await expect(page.locator('.accent-shape--disc')).toHaveCSS('transition-duration', '0s');
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
