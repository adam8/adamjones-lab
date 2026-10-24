import { expect, test } from '@playwright/test';

const projectPath = '/projects/adam-jones-lab/';

async function expectNoHorizontalOverflow(page) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));

  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
}

test('the catalogue project link opens the detail page', async ({ page }) => {
  await page.goto('/');

  const projectLink = page.getByRole('link', { name: 'Adam Jones Lab' });
  await expect(projectLink).toHaveAttribute('href', projectPath);
  await projectLink.click();

  await expect(page).toHaveURL(new RegExp(`${projectPath}$`));
  await expect(page.getByRole('heading', { level: 1, name: 'Adam Jones Lab' })).toBeVisible();
});

test('presents the approved project content without empty optional regions', async ({ page }) => {
  await page.goto(projectPath);

  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 1, name: 'Adam Jones Lab' })).toBeVisible();
  await expect(page.getByText('Project', { exact: true })).toBeVisible();
  await expect(
    page.getByText('A lightweight home for projects, prototypes, and small web experiments.'),
  ).toBeVisible();
  await expect(
    page.getByText(
      'A lightweight personal homepage for Adam Jones, a JavaScript developer and designer, and a home for projects and experiments.',
    ),
  ).toBeVisible();

  await expect(page.locator('.project-sheet section')).toHaveCount(1);
  await expect(page.locator('img, video, figure')).toHaveCount(0);
  await expect(page.getByText(/related projects|client|role|technologies|outcome/i)).toHaveCount(0);
});

test('uses root-relative global and return navigation targets', async ({ page }) => {
  await page.goto(projectPath);

  await expect(page.locator('.wordmark')).toHaveAttribute('href', '/');
  await expect(page.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/#about');
  await expect(page.getByRole('link', { name: 'Projects + experiments', exact: true })).toHaveAttribute(
    'href',
    '/#work',
  );
  await expect(page.getByRole('link', { name: 'Back to projects + experiments' })).toHaveAttribute(
    'href',
    '/#work',
  );
  await expect(page.getByRole('link', { name: 'Return to projects + experiments' })).toHaveAttribute(
    'href',
    '/#work',
  );
  await expect(page.getByRole('link', { name: 'Back to top' })).toHaveAttribute('href', '#top');
  await expect(page.locator('#top')).toHaveCount(1);
});

test('supports skip navigation and visible focus on project return links', async ({ page }) => {
  await page.goto(projectPath);

  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toHaveCSS('opacity', '1');

  await skipLink.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();

  for (const name of ['Back to projects + experiments', 'Return to projects + experiments']) {
    const link = page.getByRole('link', { name });
    await link.focus();
    await expect(link).toHaveCSS('outline-style', 'solid');
    await expect(link).toHaveCSS('outline-color', 'rgb(255, 79, 31)');
  }
});

test('uses the narrow and wide project columns on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(projectPath);

  const positions = await page.evaluate(() => {
    const bounds = (selector) => document.querySelector(selector).getBoundingClientRect();
    const back = bounds('.project-navigation a');
    const type = bounds('.project-type');
    const title = bounds('.project-title');
    const overview = bounds('.project-overview h2');
    const copy = bounds('.project-copy');

    return {
      backLeft: back.left,
      typeLeft: type.left,
      titleLeft: title.left,
      overviewLeft: overview.left,
      copyLeft: copy.left,
      bodyBackground: getComputedStyle(document.body).backgroundImage,
    };
  });

  expect(Math.abs(positions.backLeft - positions.typeLeft)).toBeLessThan(2);
  expect(Math.abs(positions.overviewLeft - positions.typeLeft)).toBeLessThan(2);
  expect(Math.abs(positions.copyLeft - positions.titleLeft)).toBeLessThan(2);
  expect(positions.titleLeft).toBeGreaterThan(positions.typeLeft + 100);
  expect(positions.bodyBackground).toContain('linear-gradient');
  await expectNoHorizontalOverflow(page);
});

test('stacks cleanly and removes decorative guides on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(projectPath);

  const layout = await page.evaluate(() => {
    const type = document.querySelector('.project-type').getBoundingClientRect();
    const title = document.querySelector('.project-title').getBoundingClientRect();
    const overview = document.querySelector('.project-overview h2').getBoundingClientRect();
    const copy = document.querySelector('.project-copy').getBoundingClientRect();

    return {
      typeBottom: type.bottom,
      titleTop: title.top,
      overviewBottom: overview.bottom,
      copyTop: copy.top,
      bodyBackground: getComputedStyle(document.body).backgroundImage,
    };
  });

  expect(layout.titleTop).toBeGreaterThanOrEqual(layout.typeBottom);
  expect(layout.copyTop).toBeGreaterThanOrEqual(layout.overviewBottom);
  expect(layout.bodyBackground).toBe('none');
  await expectNoHorizontalOverflow(page);
});

test('allows a long project title to wrap without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(projectPath);

  const titleMetrics = await page.locator('.project-title').evaluate((title) => {
    title.textContent = 'An intentionally long project title with anuninterruptedwordthatmustwrap';
    const styles = getComputedStyle(title);
    const bounds = title.getBoundingClientRect();

    return {
      height: bounds.height,
      lineHeight: Number.parseFloat(styles.lineHeight),
      scrollWidth: title.scrollWidth,
      clientWidth: title.clientWidth,
      right: bounds.right,
    };
  });

  expect(titleMetrics.height).toBeGreaterThan(titleMetrics.lineHeight * 2);
  expect(titleMetrics.scrollWidth).toBeLessThanOrEqual(titleMetrics.clientWidth);
  expect(titleMetrics.right).toBeLessThanOrEqual(375);
  await expectNoHorizontalOverflow(page);
});

test('introduces no project-page motion when reduced motion is preferred', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(projectPath);

  const motion = await page.locator('.project-sheet *').evaluateAll((elements) =>
    elements.map((element) => {
      const styles = getComputedStyle(element);
      return {
        animation: styles.animationDuration,
        transition: styles.transitionDuration,
      };
    }),
  );

  expect(motion.every(({ animation, transition }) => animation === '0s' && transition === '0s')).toBe(true);
});

test('unknown routes return 404 without rendering the homepage', async ({ page }) => {
  const response = await page.goto('/not-a-real-route/');

  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1, name: 'Adam Jones' })).toHaveCount(0);
  await expect(page.locator('.hero')).toHaveCount(0);
});
