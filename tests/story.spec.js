import { expect, test } from '@playwright/test';

const projects = [
  { hash: '#project-boss-hog', index: 0, name: 'Boss Hog', permalink: 'Permalink to Boss Hog' },
  { hash: '#project-agents', index: 1, name: 'Agent experiments', permalink: 'Permalink to Agent experiments' },
  { hash: '#project-interface', index: 2, name: 'Interface studies', permalink: 'Permalink to Interface studies' },
];

async function expectProjectAtEnhancedSlot(page, project) {
  const buttons = page.locator('[data-project-button]');
  const panel = page.locator(project.hash);

  await expect(buttons.nth(project.index)).toHaveAttribute('aria-pressed', 'true');
  await expect(panel).toHaveClass(/is-active/);
  await expect(panel).toBeInViewport();
  await expect(panel.locator('h3')).toBeInViewport();

  for (let index = 0; index < projects.length; index += 1) {
    if (index === project.index) continue;
    await expect(buttons.nth(index)).toHaveAttribute('aria-pressed', 'false');
  }

}

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('keeps the full story, project copy, and links available', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: 'Adam Jones' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'I design interfaces. And build them.' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Boss Hog' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Agent experiments' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Interface studies' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Island time' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'A short specification' })).toBeVisible();
    await expect(page.locator('.project-controls')).toBeHidden();
    await expect(page.getByRole('link', { name: /View repository/ })).toBeVisible();
    await expect(page.getByRole('link', { name: 'GitHub' })).toBeVisible();
  });

  for (const project of projects) {
    test(`uses native fragment navigation for ${project.name}`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`/${project.hash}`);

      await expect(page).toHaveURL(new RegExp(`${project.hash}$`));
      await expect(page.locator(project.hash)).toBeInViewport();
      await expect(page.getByRole('link', { name: project.permalink })).toHaveAttribute('href', project.hash);
    });
  }
});

for (const project of projects) {
  test(`direct enhanced load restores ${project.name}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/${project.hash}`);

    await expect(page.locator('html')).toHaveClass(/motion-ok/);
    await expect(page).toHaveURL(new RegExp(`${project.hash}$`));
    await expectProjectAtEnhancedSlot(page, project);
    expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);

    const settledY = await page.evaluate(() => window.scrollY);
    await page.waitForTimeout(250);
    expect(Math.abs((await page.evaluate(() => window.scrollY)) - settledY)).toBeLessThan(2);
  });
}

test('project permalinks have meaningful names, visible focus, and 44px targets', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  for (const project of projects) {
    const permalink = page.getByRole('link', { name: project.permalink });
    await expect(permalink).toHaveAttribute('href', project.hash);
    await permalink.focus();
    await expect(permalink).toBeFocused();
    await expect(permalink).toHaveCSS('outline-style', 'solid');
    const bounds = await permalink.boundingBox();
    expect(bounds?.width).toBeGreaterThanOrEqual(44);
    expect(bounds?.height).toBeGreaterThanOrEqual(44);
  }

  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
});

test('long project headings keep their permalink beside the first line', async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/');

    for (const project of projects.slice(1)) {
      const layout = await page.locator(`${project.hash} .project-heading`).evaluate((row) => {
        const heading = row.querySelector('h3').getBoundingClientRect();
        const permalink = row.querySelector('.project-permalink').getBoundingClientRect();
        return {
          headingTop: heading.top,
          headingRight: heading.right,
          permalinkTop: permalink.top,
          permalinkLeft: permalink.left,
        };
      });

      expect(Math.abs(layout.permalinkTop - layout.headingTop)).toBeLessThanOrEqual(1);
      expect(layout.permalinkLeft).toBeGreaterThanOrEqual(layout.headingRight - 1);
    }
  }
});

test('project buttons activate chapters, retain focus, update history once, and synchronize with native scroll', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
  });

  const buttons = page.locator('[data-project-button]');
  const second = buttons.nth(1);
  const initialHistoryLength = await page.evaluate(() => history.length);
  await second.focus();
  await second.press('Enter');
  await expect(second).toBeFocused();
  await expect(page).toHaveURL(/#project-agents$/);
  expect(await page.evaluate(() => history.length)).toBe(initialHistoryLength + 1);
  await second.press('Enter');
  expect(await page.evaluate(() => history.length)).toBe(initialHistoryLength + 1);
  await expect(second).toHaveAttribute('aria-pressed', 'true');
  await expect(buttons.nth(0)).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#project-agents')).toHaveClass(/is-active/);
  await expect(page.locator('#project-boss-hog')).not.toHaveClass(/is-active/);

  const track = page.locator('.project-track');
  const geometry = await track.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const start = bounds.top + window.scrollY;
    return { start, range: bounds.height - window.innerHeight };
  });

  await page.evaluate(({ start, range }) => window.scrollTo(0, start + range * 0.86), geometry);
  await expect(buttons.nth(2)).toHaveAttribute('aria-pressed', 'true');

  await page.evaluate(({ start, range }) => window.scrollTo(0, start + range * 0.2), geometry);
  await expect(buttons.nth(0)).toHaveAttribute('aria-pressed', 'true');
  await expect(page).toHaveURL(/#project-agents$/);
  expect(await page.evaluate(() => history.length)).toBe(initialHistoryLength + 1);
});

test('back and forward restore project fragments without programmatic focus movement', async ({ page }) => {
  await page.addInitScript(() => {
    const nativeFocus = HTMLElement.prototype.focus;
    window.__focusCalls = 0;
    HTMLElement.prototype.focus = function focus(...args) {
      window.__focusCalls += 1;
      return nativeFocus.apply(this, args);
    };
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#project-boss-hog');
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
  await expectProjectAtEnhancedSlot(page, projects[0]);

  const buttons = page.locator('[data-project-button]');
  await buttons.nth(1).click();
  await expectProjectAtEnhancedSlot(page, projects[1]);
  await buttons.nth(2).click();
  await expectProjectAtEnhancedSlot(page, projects[2]);
  const focusCalls = await page.evaluate(() => window.__focusCalls);

  await page.goBack();
  await expect(page).toHaveURL(/#project-agents$/);
  await expectProjectAtEnhancedSlot(page, projects[1]);
  expect(await page.evaluate(() => window.__focusCalls)).toBe(focusCalls);

  await page.goForward();
  await expect(page).toHaveURL(/#project-interface$/);
  await expectProjectAtEnhancedSlot(page, projects[2]);
  expect(await page.evaluate(() => window.__focusCalls)).toBe(focusCalls);
});

test('same-hash permalink returns to its enhanced scroll slot without adding history', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#project-boss-hog');
  await expectProjectAtEnhancedSlot(page, projects[0]);
  const historyLength = await page.evaluate(() => history.length);

  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollBy(0, 240); });
  await page.getByRole('link', { name: projects[0].permalink }).click();

  await expectProjectAtEnhancedSlot(page, projects[0]);
  expect(await page.evaluate(() => history.length)).toBe(historyLength);
});

test('unknown fragments remain unchanged and do not force the project stage', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#not-a-project');

  await expect(page).toHaveURL(/#not-a-project$/);
  const position = await page.evaluate(() => ({
    scrollY: window.scrollY,
    projectStart: document.querySelector('.project-track').getBoundingClientRect().top + window.scrollY,
  }));
  expect(position.scrollY).toBeLessThan(position.projectStart - 10);
});

test('enhancement boundaries switch sticky scenes and clear hidden project state', async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 900 });
  await page.goto('/');

  await expect(page.locator('html')).not.toHaveClass(/motion-ok/);
  await expect(page.locator('.hero-scene')).toHaveCSS('position', 'relative');
  await expect(page.locator('.project-stage')).not.toHaveCSS('position', 'sticky');
  await expect(page.locator('.project-controls')).toHaveCSS('display', 'none');
  await expect(page.locator('.reading-progress')).toHaveCount(0);

  await page.setViewportSize({ width: 961, height: 641 });
  await expect(page.locator('html')).toHaveClass(/motion-ok/);
  await expect(page.locator('.hero-scene')).toHaveCSS('position', 'sticky');
  await expect(page.locator('.project-controls')).toHaveCSS('position', 'sticky');
  await expect(page.locator('.project-controls')).toHaveCSS('display', 'flex');
  await expect(page.locator('.chapter-index [data-chapter-progress]').first()).toHaveCSS('visibility', 'visible');
  await expect(page.locator('#project-agents')).not.toHaveAttribute('aria-hidden');
  await expect(page.locator('#project-agents')).not.toHaveAttribute('inert');

  // Project fit is independent of the wide/tall hero enhancement.
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await expect(page.locator('.hero-scene')).toHaveCSS('position', 'sticky');
  await expect(page.locator('.project-controls')).toHaveCSS('display', 'flex');
  for (const panel of await page.locator('[data-project-panel]').all()) {
    await expect(panel).not.toHaveAttribute('aria-hidden');
    await expect(panel).not.toHaveAttribute('inert');
  }
  await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
  await expect(page.locator('.project-controls')).toHaveCSS('position', 'sticky');

  await page.setViewportSize({ width: 1440, height: 640 });
  await expect(page.locator('html')).not.toHaveClass(/motion-ok/);
  await expect(page.locator('.hero-scene')).toHaveCSS('position', 'relative');
  await expect(page.locator('.project-controls')).toHaveCSS('display', 'none');
  await expect(page.locator('.hero-invitation')).toHaveCSS('position', 'relative');
  await expect(page.locator('.scroll-cue')).toHaveCSS('display', 'none');

  for (const panel of await page.locator('[data-project-panel]').all()) {
    await expect(panel).not.toHaveAttribute('aria-hidden');
    await expect(panel).not.toHaveAttribute('inert');
  }
});

for (const mode of [
  { name: 'narrow', viewport: { width: 390, height: 844 } },
  { name: 'short', viewport: { width: 844, height: 390 } },
]) {
  for (const project of projects) {
    test(`${mode.name} uses native anchoring for ${project.name}`, async ({ page }) => {
      await page.setViewportSize(mode.viewport);
      await page.goto(`/${project.hash}`);

      await expect(page.locator('html')).not.toHaveClass(/motion-ok/);
      await expect(page).toHaveURL(new RegExp(`${project.hash}$`));
      await expect(page.locator(project.hash)).toBeInViewport();
      await expect(page.locator(project.hash)).not.toHaveAttribute('aria-hidden');
      await expect(page.locator(project.hash)).not.toHaveAttribute('inert');
    });
  }
}

test('intermediate widths stack project content without clipping illustrations', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 900 });
  await page.goto('/');

  await expect(page.locator('html')).not.toHaveClass(/motion-ok/);
  await expect(page.locator('.project-stage')).toHaveCSS('grid-template-columns', /844|[7-8]\d\d/);
  await expect(page.locator('#project-boss-hog')).toHaveCSS('grid-template-columns', /\d+px/);

  const bounds = await page.locator('#project-boss-hog .project-object').evaluate((object) => {
    const objectBounds = object.getBoundingClientRect();
    const stageBounds = object.closest('.project-stage').getBoundingClientRect();
    return {
      objectLeft: objectBounds.left,
      objectRight: objectBounds.right,
      stageLeft: stageBounds.left,
      stageRight: stageBounds.right,
    };
  });
  expect(bounds.objectLeft).toBeGreaterThanOrEqual(bounds.stageLeft - 1);
  expect(bounds.objectRight).toBeLessThanOrEqual(bounds.stageRight + 1);
});

test('short viewports use normal flow rather than sticky storytelling', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/');

  await expect(page.locator('html')).not.toHaveClass(/motion-ok/);
  await expect(page.locator('.project-stage')).not.toHaveCSS('position', 'sticky');
  await expect(page.locator('[data-project-panel]')).toHaveCount(3);
  await expect(page.locator('[data-project-panel]').nth(2)).toBeVisible();
});

for (const mode of [
  { name: 'narrow', viewport: { width: 390, height: 844 } },
  { name: 'short', viewport: { width: 844, height: 390 } },
]) {
  test(`${mode.name} fallback retains attached chapter progress without hero motion`, async ({ page }) => {
    await page.setViewportSize(mode.viewport);
    await page.goto('/');

    const progress = page.locator(mode.name === 'narrow' ? '.mobile-chapter-progress [data-chapter-fill]' : '.chapter-index [data-chapter-fill]').first();
    await expect(progress).toHaveCSS('transform', 'matrix(0, 0, 0, 1, 0, 0)');
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(progress).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
    await expect(page.locator('html')).not.toHaveClass(/motion-ok/);
  });
}

test('the requestAnimationFrame scheduler becomes idle after updates settle', async ({ page }) => {
  await page.addInitScript(() => {
    const nativeRequest = window.requestAnimationFrame.bind(window);
    window.__rafCount = 0;
    window.requestAnimationFrame = (callback) => {
      window.__rafCount += 1;
      return nativeRequest(callback);
    };
  });
  await page.goto('/');
  await page.waitForTimeout(150);

  const settledCount = await page.evaluate(() => window.__rafCount);
  await page.waitForTimeout(250);
  const idleCount = await page.evaluate(() => window.__rafCount);
  expect(idleCount).toBe(settledCount);

  await page.evaluate(() => window.scrollBy(0, 120));
  await expect.poll(() => page.evaluate(() => window.__rafCount)).toBeGreaterThan(idleCount);
  await page.waitForTimeout(150);
  const resettledCount = await page.evaluate(() => window.__rafCount);
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => window.__rafCount)).toBe(resettledCount);
});
