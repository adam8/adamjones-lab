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

test('presents the approved project content and system in the required order', async ({ page }) => {
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

  const sections = page.locator('.project-sheet section');
  await expect(sections).toHaveCount(2);
  await expect(sections.nth(0)).toHaveClass(/project-overview/);
  await expect(sections.nth(1)).toHaveClass(/project-system/);
  await expect(page.locator('.project-overview + .project-system + .project-navigation--bottom')).toHaveCount(1);

  const system = page.locator('.project-system');
  for (const label of ['System', 'Palette', 'Paper', 'Ink', 'Accent', 'Type', 'Headline', 'Reading', 'Motif']) {
    await expect(system.getByText(label, { exact: true })).toBeVisible();
  }
  await expect(system.getByText('Adam Jones Lab', { exact: true })).toBeVisible();
  await expect(system.getByText('I make things for the web.', { exact: true })).toBeVisible();
  await expect(system.locator('ul.system-swatches > li')).toHaveCount(3);

  await expect(page.locator('img, video, figure')).toHaveCount(0);
  await expect(system.locator('a, button, input, select, textarea, [tabindex]')).toHaveCount(0);
  await expect(page.getByText(/related projects|client|role|technologies|outcome/i)).toHaveCount(0);
});

test('uses the existing palette variables and a static decorative motif', async ({ page }) => {
  await page.goto(projectPath);

  const specimenDetails = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    const details = (selector) => {
      const element = document.querySelector(selector);
      const computed = getComputedStyle(element);
      return {
        backgroundColor: computed.backgroundColor,
        borderColor: computed.borderColor,
        borderStyle: computed.borderStyle,
        borderWidth: computed.borderWidth,
        animationDuration: computed.animationDuration,
        transitionDuration: computed.transitionDuration,
      };
    };

    return {
      variables: {
        paper: style.getPropertyValue('--paper').trim(),
        ink: style.getPropertyValue('--ink').trim(),
        accent: style.getPropertyValue('--accent').trim(),
        line: style.getPropertyValue('--line').trim(),
      },
      paper: details('.system-swatch--paper'),
      ink: details('.system-swatch--ink'),
      accent: details('.system-swatch--accent'),
      specimenMotion: [...document.querySelectorAll('.system-specimen, .system-specimen *')].map((element) => {
        const computed = getComputedStyle(element);
        return {
          animationDuration: computed.animationDuration,
          transitionDuration: computed.transitionDuration,
        };
      }),
      motifCursors: [...document.querySelectorAll('.system-motif-art, .system-motif-art *')].map(
        (element) => getComputedStyle(element).cursor,
      ),
    };
  });

  expect(specimenDetails.variables).toEqual({
    paper: '#f4f0e8',
    ink: '#171713',
    accent: '#ff4f1f',
    line: '#cbc5b8',
  });
  expect(specimenDetails.paper).toMatchObject({
    backgroundColor: 'rgb(244, 240, 232)',
    borderColor: 'rgb(203, 197, 184)',
    borderStyle: 'solid',
    borderWidth: '1px',
  });
  expect(specimenDetails.ink.backgroundColor).toBe('rgb(23, 23, 19)');
  expect(specimenDetails.accent.backgroundColor).toBe('rgb(255, 79, 31)');
  expect(specimenDetails.specimenMotion.every(({ animationDuration, transitionDuration }) =>
    animationDuration === '0s' && transitionDuration === '0s')).toBe(true);
  expect(specimenDetails.motifCursors.every((cursor) => cursor === 'auto')).toBe(true);

  const motif = page.locator('.system-motif-art');
  await expect(motif).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('.system-specimen [aria-hidden="true"]')).toHaveCount(1);
  await expect(motif.locator('.system-motif-disc, .system-motif-bar, .system-motif-dot, .system-motif-ring')).toHaveCount(4);
  await expect(page.locator('.system-specimen [title]')).toHaveCount(0);
  await expect(page.getByText(/shift it/i)).toHaveCount(0);
});

test('loads no cross-origin project resources', async ({ page }) => {
  await page.goto(projectPath);

  const crossOriginResources = await page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .map(({ name }) => new URL(name, location.href))
      .filter(({ origin }) => origin !== location.origin)
      .map(({ href }) => href),
  );

  expect(crossOriginResources).toEqual([]);
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
    const heading = bounds('.project-heading');
    const title = bounds('.project-title');
    const overview = bounds('.project-overview h2');
    const copy = bounds('.project-copy');
    const systemLabel = bounds('.project-system > h2');
    const specimen = bounds('.system-specimen');
    const palette = bounds('.system-palette');
    const systemType = bounds('.system-type');
    const motif = bounds('.system-motif');

    return {
      backLeft: back.left,
      typeLeft: type.left,
      headingRight: heading.right,
      titleLeft: title.left,
      overviewLeft: overview.left,
      copyLeft: copy.left,
      systemLabelLeft: systemLabel.left,
      specimenLeft: specimen.left,
      specimenRight: specimen.right,
      paletteLeft: palette.left,
      paletteRight: palette.right,
      systemTypeTop: systemType.top,
      systemTypeRight: systemType.right,
      motifTop: motif.top,
      motifLeft: motif.left,
      bodyBackground: getComputedStyle(document.body).backgroundImage,
    };
  });

  expect(Math.abs(positions.backLeft - positions.typeLeft)).toBeLessThan(2);
  expect(Math.abs(positions.overviewLeft - positions.typeLeft)).toBeLessThan(2);
  expect(Math.abs(positions.systemLabelLeft - positions.typeLeft)).toBeLessThan(2);
  expect(Math.abs(positions.copyLeft - positions.titleLeft)).toBeLessThan(2);
  expect(Math.abs(positions.specimenLeft - positions.titleLeft)).toBeLessThan(2);
  expect(Math.abs(positions.specimenRight - positions.headingRight)).toBeLessThan(2);
  expect(Math.abs(positions.paletteLeft - positions.specimenLeft)).toBeLessThan(2);
  expect(Math.abs(positions.paletteRight - positions.specimenRight)).toBeLessThan(2);
  expect(Math.abs(positions.systemTypeTop - positions.motifTop)).toBeLessThan(2);
  expect(positions.motifLeft).toBeGreaterThan(positions.systemTypeRight);
  expect(positions.titleLeft).toBeGreaterThan(positions.typeLeft + 100);
  expect(positions.bodyBackground).toContain('linear-gradient');
  await expectNoHorizontalOverflow(page);
});

test('stacks the system cleanly and removes decorative guides on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(projectPath);

  const layout = await page.evaluate(() => {
    const bounds = (selector) => document.querySelector(selector).getBoundingClientRect();
    const type = bounds('.project-type');
    const title = bounds('.project-title');
    const overview = bounds('.project-overview h2');
    const copy = bounds('.project-copy');
    const systemLabel = bounds('.project-system > h2');
    const specimen = bounds('.system-specimen');
    const palette = bounds('.system-palette');
    const systemType = bounds('.system-type');
    const motif = bounds('.system-motif');
    const motifArt = bounds('.system-motif-art');
    const headline = document.querySelector('.system-headline-sample');
    const reading = document.querySelector('.system-reading-sample');

    return {
      typeBottom: type.bottom,
      titleTop: title.top,
      overviewBottom: overview.bottom,
      copyTop: copy.top,
      systemLabelBottom: systemLabel.bottom,
      specimenTop: specimen.top,
      paletteBottom: palette.bottom,
      systemTypeTop: systemType.top,
      systemTypeBottom: systemType.bottom,
      motifTop: motif.top,
      specimenLeft: specimen.left,
      specimenRight: specimen.right,
      motifArtLeft: motifArt.left,
      motifArtRight: motifArt.right,
      headlineFits: headline.scrollWidth <= headline.clientWidth,
      readingFits: reading.scrollWidth <= reading.clientWidth,
      bodyBackground: getComputedStyle(document.body).backgroundImage,
    };
  });

  expect(layout.titleTop).toBeGreaterThanOrEqual(layout.typeBottom);
  expect(layout.copyTop).toBeGreaterThanOrEqual(layout.overviewBottom);
  expect(layout.specimenTop).toBeGreaterThanOrEqual(layout.systemLabelBottom);
  expect(layout.systemTypeTop).toBeGreaterThan(layout.paletteBottom);
  expect(layout.motifTop).toBeGreaterThan(layout.systemTypeBottom);
  expect(layout.motifArtLeft).toBeGreaterThanOrEqual(layout.specimenLeft);
  expect(layout.motifArtRight).toBeLessThanOrEqual(layout.specimenRight);
  expect(layout.headlineFits).toBe(true);
  expect(layout.readingFits).toBe(true);
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
