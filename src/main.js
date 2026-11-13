const root = document.documentElement;
const chapterNav = document.querySelector('.chapter-index');
const mobileHeader = document.querySelector('.site-header');
const mobileChapters = document.querySelector('#mobile-chapters');
const chapterFills = [...document.querySelectorAll('[data-chapter-progress]')].map(segment => ({ key: segment.dataset.chapterProgress, fill: segment.querySelector('[data-chapter-fill]') }));
const heroTrack = document.querySelector('.hero-track');
const chapterIndexSlot = document.querySelector('.chapter-index-slot');
const chapterItems = [...document.querySelectorAll('[data-chapter-item]')];
const chapterTargets = [
  { key: 'introduction', element: document.querySelector('.introduction') },
  { key: 'work', element: document.querySelector('#work') },
  { key: 'outside', element: document.querySelector('#outside') },
  { key: 'about', element: document.querySelector('#about') },
  { key: 'elsewhere', element: document.querySelector('#elsewhere') },
].filter(({ element }) => element);
const projectButtons = [...document.querySelectorAll('[data-project-button]')];
const projectPanels = [...document.querySelectorAll('[data-project-panel]')];
const projectPermalinks = [...document.querySelectorAll('.project-permalink')];
const projectIndexByFragment = new Map([
  ['#project-boss-hog', 0],
  ['#project-agents', 1],
  ['#project-interface', 2],
]);
const enhancementQuery = window.matchMedia('(min-width: 961px) and (min-height: 641px)');

const geometry = {
  documentRange: 1,
  heroStart: 0,
  heroRange: 1,
};

let frameRequest = 0;
let needsMeasurement = true;
let motionEnabled = false;
let activeProject = 0;
let pendingProjectIndex = projectIndexByFragment.get(window.location.hash) ?? null;
let previousScrollY = window.scrollY;

const clamp = (value, minimum = 0, maximum = 1) => Math.min(maximum, Math.max(minimum, value));

// Scroll-only paints consume these cached native arrivals; no chapter reads.
let chapterStarts = [];
let persistenceStart = Infinity;
let desktopFits = false;
let currentChapter;
const mobileItems = [...document.querySelectorAll('[data-mobile-chapter]')];
function setCurrentChapter(key) {
  if (currentChapter === key) return;
  currentChapter = key;
  [...chapterItems, ...mobileItems].forEach(item => {
    if ((item.dataset.chapterItem || item.dataset.mobileChapter) === key) item.setAttribute('aria-current', 'location');
    else item.removeAttribute('aria-current');
  });
  scrollActiveMobileChapterIntoView();
}
function scrollActiveMobileChapterIntoView() {
  if (!mobileChapters?.offsetParent) return;
  const active = mobileChapters.querySelector('a[aria-current="location"]');
  if (!active) return;
  const container = mobileChapters;
  const linkRect = active.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const overflow = linkRect.left < containerRect.left || linkRect.right > containerRect.right;
  if (overflow) {
    const target = Math.max(0, active.offsetLeft - (container.clientWidth - active.clientWidth) / 2);
    container.scrollTo({ left: target, behavior: 'smooth' });
  }
}
function updateMobileOverflowIndicator() {
  if (!mobileChapters?.offsetParent) return;
  const hasOverflow = mobileChapters.scrollWidth > mobileChapters.clientWidth + 1;
  const atEnd = hasOverflow && mobileChapters.scrollLeft + mobileChapters.clientWidth >= mobileChapters.scrollWidth - 1;
  mobileChapters.classList.toggle('has-overflow', hasOverflow);
  mobileChapters.classList.toggle('at-end', atEnd);
}
function updateChapterPersistence() {
  chapterIndexSlot?.classList.toggle('is-persistent', desktopFits && scrollY > persistenceStart);
}
function setLocalProperty(element, name, value) {
  if (element.style.getPropertyValue(name) !== value) element.style.setProperty(name, value);
}
function measureNavigation() {
  const mobile = innerWidth <= 800;
  const row = mobileChapters.offsetHeight;
  const safeArea = parseFloat(getComputedStyle(mobileHeader).paddingTop) || 0;
  // Stable budget: wordmark + one row of horizontal pills + progress rule.
  const tall = row * 3 + safeArea + 8 > innerHeight * .5;
  mobileHeader.classList.toggle('is-tall', tall);
  mobileHeader.classList.add('chapters-ready');
  chapterIndexSlot.classList.remove('is-persistent');
  const navHeight = chapterNav.offsetHeight;
  const navWidth = chapterNav.getBoundingClientRect().width;
  desktopFits = enhancementQuery.matches && navHeight + 32 < innerHeight * .35;
  chapterIndexSlot.classList.toggle('can-persist', desktopFits);
  if (!mobile) {
    const style = getComputedStyle(chapterIndexSlot);
    setLocalProperty(chapterIndexSlot, 'min-height', `${navHeight + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)}px`);
    setLocalProperty(chapterNav, '--index-width', `${navWidth}px`);
  }
  persistenceStart = chapterIndexSlot.getBoundingClientRect().top + scrollY - 16;
  const mobilePersistent = mobile && !tall;
  const mobileHeaderHeight = mobilePersistent ? mobileHeader.offsetHeight : 0;
  setLocalProperty(root, '--mobile-sticky-header-height', `${mobileHeaderHeight}px`);
  const mobileProjectControls = document.querySelector('.project-controls');
  setLocalProperty(root, '--mobile-project-controls-height', `${mobile && mobileProjectControls ? mobileProjectControls.offsetHeight : 0}px`);
  const clearance = mobilePersistent ? row + safeArea + 8 + 16 : (!mobile && desktopFits ? navHeight + 32 : Math.min(96, innerHeight * .2));
  chapterTargets.forEach(({ element }) => setLocalProperty(element, '--chapter-clearance', `${clearance}px`));
  updateChapterPersistence();
  updateMobileOverflowIndicator();
}
function paintChapterProgress(y) {
  const terminal = y >= geometry.documentRange;
  let key = null;
  chapterStarts.forEach((start, index) => {
    if (y + .5 >= start) key = chapterTargets[index].key;
  });
  if (terminal) key = chapterTargets.at(-1).key;
  setCurrentChapter(key);
  chapterFills.forEach(({ key: segmentKey, fill }) => {
    const index = chapterTargets.findIndex(chapter => chapter.key === segmentKey);
    const start = chapterStarts[index];
    const end = chapterStarts[index + 1] ?? geometry.documentRange;
    const value = terminal ? 1 : y < start ? 0 : end <= start ? 1 : clamp((y - start) / (end - start));
    const transform = `scaleX(${value})`;
    if (fill.style.transform !== transform) fill.style.transform = transform;
  });
  if (!root.classList.contains('progress-ready')) root.classList.add('progress-ready');
}

function measureGeometry() {
  measureNavigation();
  const scrollY = window.scrollY;
  const viewportHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  const heroBounds = heroTrack?.getBoundingClientRect();

  geometry.documentRange = Math.max(0, documentHeight - viewportHeight);

  if (heroBounds) {
    geometry.heroStart = heroBounds.top + scrollY;
    geometry.heroRange = Math.max(1, heroBounds.height - viewportHeight);
  }

  let previous = 0;
  chapterStarts = chapterTargets.map(({ element }) => {
    const arrival = element.getBoundingClientRect().top + scrollY - (parseFloat(getComputedStyle(element).scrollMarginBlockStart) || 0);
    previous = Math.max(previous, clamp(arrival, 0, geometry.documentRange));
    return previous;
  });
  needsMeasurement = false;
}

function projectScrollPosition(index) {
  const panel = projectPanels[index];
  return panel.getBoundingClientRect().top + window.scrollY - parseFloat(getComputedStyle(panel).scrollMarginBlockStart);
}

function scrollToProject(index, behavior) {
  const top = projectScrollPosition(index);

  if (behavior === 'smooth') {
    window.scrollTo({ top, behavior });
    return;
  }

  const previousScrollBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = 'auto';
  window.scrollTo({ top, behavior: 'auto' });
  root.style.scrollBehavior = previousScrollBehavior;
}

function setActiveProject(nextIndex) {
  const boundedIndex = clamp(nextIndex, 0, projectPanels.length - 1);
  activeProject = boundedIndex;

  projectButtons.forEach((button, index) => {
    button.setAttribute('aria-pressed', String(index === boundedIndex));
  });

  projectPanels.forEach((panel, index) => {
    panel.classList.toggle('is-active', index === boundedIndex);
  });
}

function applyPendingProject() {
  if (pendingProjectIndex === null) return;

  const nextIndex = pendingProjectIndex;
  pendingProjectIndex = null;
  setActiveProject(nextIndex);
  scrollToProject(nextIndex, 'auto');
}

function paint() {
  frameRequest = 0;
  if (needsMeasurement) measureGeometry();
  applyPendingProject();
  // Instant native navigation can jump over the one-pixel sentinel without
  // changing its intersection state. Resolve persistence on scheduled scroll
  // updates too, rather than depending on intermediate smooth-scroll frames.
  updateChapterPersistence();

  const scrollY = window.scrollY;
  const direction = Math.sign(scrollY - previousScrollY);
  previousScrollY = scrollY;

  if (direction !== 0) {
    // Resize/reflow without scroll keeps explicit link selections stable.
    let next = 0;
    projectPanels.forEach((panel, index) => {
      if (panel.getBoundingClientRect().top <= innerHeight * .5) next = index;
    });
    if (next !== activeProject) setActiveProject(next);
  }

  paintChapterProgress(scrollY);

  if (motionEnabled) {
    const heroProgress = clamp((scrollY - geometry.heroStart) / geometry.heroRange);
    root.style.setProperty('--hero-object-y', `${(heroProgress * 4).toFixed(3)}vh`);
    root.style.setProperty('--hero-object-rotate', `${(heroProgress * 4).toFixed(3)}deg`);
  }
}

function scheduleUpdate({ measure = false } = {}) {
  needsMeasurement ||= measure;
  if (!frameRequest) frameRequest = window.requestAnimationFrame(paint);
}

function queueCurrentProjectFragment() {
  const index = projectIndexByFragment.get(window.location.hash);
  if (index !== undefined) pendingProjectIndex = index;
  scheduleUpdate({ measure: true });
}

function updateProjectFragment(index) {
  const hash = `#${projectPanels[index].id}`;
  if (window.location.hash !== hash) history.pushState(null, '', hash);
}

function activateProject(index, behavior = 'smooth') {
  if (needsMeasurement) measureGeometry();
  setActiveProject(index);
  scrollToProject(index, behavior);
}

function applyEnhancementState() {
  motionEnabled = enhancementQuery.matches;
  root.classList.toggle('motion-ok', motionEnabled);
  updateChapterPersistence();

  if (!motionEnabled) {
    root.style.removeProperty('--hero-object-y');
    root.style.removeProperty('--hero-object-rotate');
  } else {
    pendingProjectIndex = projectIndexByFragment.get(window.location.hash) ?? null;
  }

  setActiveProject(activeProject);
  scheduleUpdate({ measure: true });
}

projectButtons.forEach((button, index) => {
  button.addEventListener('click', () => {
    updateProjectFragment(index);
    activateProject(index);
  });
});

projectPermalinks.forEach((permalink) => {
  permalink.addEventListener('click', (event) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) return;

    const index = projectIndexByFragment.get(permalink.hash);
    if (index === undefined) return;

    event.preventDefault();
    updateProjectFragment(index);
    activateProject(index);
  });
});

// Native anchors own scrolling, focus and history; the header pills scroll horizontally with the active chapter.

window.addEventListener('scroll', scheduleUpdate, { passive: true });
window.addEventListener('resize', () => scheduleUpdate({ measure: true }), { passive: true });
mobileChapters?.addEventListener('scroll', updateMobileOverflowIndicator, { passive: true });
window.addEventListener('hashchange', queueCurrentProjectFragment);
window.addEventListener('popstate', queueCurrentProjectFragment);
window.addEventListener('pageshow', () => scheduleUpdate({ measure: true }));
window.addEventListener('orientationchange', () => scheduleUpdate({ measure: true }));
document.fonts?.ready.then(() => scheduleUpdate({ measure: true }));
document.fonts?.addEventListener('loadingdone', () => scheduleUpdate({ measure: true }));
enhancementQuery.addEventListener('change', applyEnhancementState);

// Observe content, not the stretched panel boxes. Guard equality to avoid
// observation loops from our own probe and mode changes; never poll at idle.
const observedSizes = new WeakMap();
const contentObserver = new ResizeObserver(entries => {
  let changed = false;
  for (const entry of entries) {
    const size = `${entry.contentRect.width}:${entry.contentRect.height}`;
    if (observedSizes.get(entry.target) !== size) changed = true;
    observedSizes.set(entry.target, size);
  }
  if (changed) scheduleUpdate({ measure: true });
});
document.querySelectorAll('.project-copy, .project-object, .project-controls, .about-forme, .chapter-index, #mobile-chapters, .hero-track, .introduction, #work, #outside, #about, #elsewhere').forEach(el => contentObserver.observe(el));

root.classList.add('js');
applyEnhancementState();

// Establish project geometry before the browser resolves its initial native chapter anchor.
measureGeometry();

// About is an independent progressive enhancement, never a startup dependency.
import('./about-typesetter.js').then(module => module.startAbout()).catch(() => {
  document.querySelector('#about')?.removeAttribute('data-layout');
});
