import { expect, test } from '@playwright/test';

const projects = [
  { hash: '#project-boss-hog', index: 0, name: 'Boss Hog', permalink: 'Permalink to Boss Hog' },
  { hash: '#project-agents', index: 1, name: 'Agent experiments', permalink: 'Permalink to Agent experiments' },
  { hash: '#project-interface', index: 2, name: 'Interface studies', permalink: 'Permalink to Interface studies' },
];

async function expectActiveProject(page, project) {
  const buttons = page.locator('[data-project-button]');
  await expect(buttons.nth(project.index)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator(project.hash)).toHaveClass(/is-active/);
  await expect(page.locator(project.hash)).toBeInViewport();
}

test('without JavaScript the complete story and project fragments remain available', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.route('**/', async (route) => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace('</head>', '<style>html{scroll-behavior:auto}</style></head>') });
  });
  await page.goto(baseURL);

  for (const heading of ['Adam Jones', 'I design interfaces. And build them.', 'Boss Hog', 'Agent experiments', 'Interface studies', 'Island time', 'A short specification']) {
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
  }
  await expect(page.locator('.project-controls')).toBeHidden();

  for (const project of projects) {
    await page.goto(`${baseURL}/${project.hash}`);
    await expect(page.locator(project.hash)).toBeInViewport();
    await expect(page.getByRole('link', { name: project.permalink })).toHaveAttribute('href', project.hash);
  }
  await context.close();
});

test('enhanced direct project fragments restore the selected passage', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const project of projects) {
    await page.goto(`/${project.hash}`);
    await expect(page).toHaveURL(new RegExp(`${project.hash}$`));
    await expectActiveProject(page, project);
    expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
  }
});

test('project permalinks have meaningful names, visible focus, and full targets', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  for (const project of projects) {
    const permalink = page.getByRole('link', { name: project.permalink });
    await expect(permalink).toHaveAttribute('href', project.hash);
    await permalink.focus();
    await expect(permalink).toHaveCSS('outline-style', 'solid');
    const bounds = await permalink.boundingBox();
    expect(bounds.width).toBeGreaterThanOrEqual(44);
    expect(bounds.height).toBeGreaterThanOrEqual(44);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('project controls update selection and history without moving focus', async ({ page }) => {
  await page.addInitScript(() => {
    const focus = HTMLElement.prototype.focus;
    window.focusCalls = 0;
    HTMLElement.prototype.focus = function (...args) {
      window.focusCalls++;
      return focus.apply(this, args);
    };
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#project-boss-hog');
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });

  const buttons = page.locator('[data-project-button]');
  const initialHistory = await page.evaluate(() => history.length);
  await buttons.nth(1).focus();
  await buttons.nth(1).press('Enter');
  await expect(buttons.nth(1)).toBeFocused();
  await expectActiveProject(page, projects[1]);
  expect(await page.evaluate(() => history.length)).toBe(initialHistory + 1);

  await buttons.nth(2).click();
  await expectActiveProject(page, projects[2]);
  const calls = await page.evaluate(() => window.focusCalls);
  await page.goBack();
  await expectActiveProject(page, projects[1]);
  await page.goForward();
  await expectActiveProject(page, projects[2]);
  expect(await page.evaluate(() => window.focusCalls)).toBe(calls);
});

test('same-hash permalinks do not add history and unknown fragments remain untouched', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#project-boss-hog');
  const historyLength = await page.evaluate(() => history.length);
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollBy(0, 240); });
  await page.getByRole('link', { name: projects[0].permalink }).click();
  await expectActiveProject(page, projects[0]);
  expect(await page.evaluate(() => history.length)).toBe(historyLength);

  await page.goto('/#not-a-project');
  await expect(page).toHaveURL(/#not-a-project$/);
  const position = await page.evaluate(() => ({
    y: scrollY,
    projectTop: document.querySelector('.project-track').getBoundingClientRect().top + scrollY,
  }));
  expect(position.y).toBeLessThan(position.projectTop - 10);
});

test('enhancement boundaries only affect the hero and visible controls', async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 900 });
  await page.goto('/');
  await expect(page.locator('html')).not.toHaveClass(/motion-ok/);
  await expect(page.locator('.hero-scene')).toHaveCSS('position', 'relative');
  await expect(page.locator('.project-controls')).toHaveCSS('display', 'none');

  await page.setViewportSize({ width: 961, height: 641 });
  await expect(page.locator('html')).toHaveClass(/motion-ok/);
  await expect(page.locator('.hero-scene')).toHaveCSS('position', 'sticky');
  await expect(page.locator('.project-controls')).toHaveCSS('display', 'flex');
  for (const panel of await page.locator('[data-project-panel]').all()) {
    await expect(panel).not.toHaveAttribute('aria-hidden');
    await expect(panel).not.toHaveAttribute('inert');
  }

  await page.setViewportSize({ width: 1440, height: 640 });
  await expect(page.locator('html')).not.toHaveClass(/motion-ok/);
  await expect(page.locator('.hero-scene')).toHaveCSS('position', 'relative');
  await expect(page.locator('.project-controls')).toHaveCSS('display', 'none');
});

test('intermediate and short layouts keep every project in normal document flow', async ({ page }) => {
  for (const viewport of [{ width: 844, height: 900 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveClass(/motion-ok/);
    await expect(page.locator('.project-stage')).not.toHaveCSS('position', 'sticky');
    await expect(page.locator('[data-project-panel]')).toHaveCount(3);
    for (const panel of await page.locator('[data-project-panel]').all()) await expect(panel).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
