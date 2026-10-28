const root = document.documentElement;
const progressRule = document.querySelector('.reading-progress');
const heroTrack = document.querySelector('.hero-track');
const chapterIndexSlot = document.querySelector('.chapter-index-slot');
const chapterIndexSentinel = document.querySelector('.chapter-index-sentinel');
const chapterItems = [...document.querySelectorAll('[data-chapter-item]')];
const chapterTargets = [
  { key: 'introduction', element: document.querySelector('.introduction') },
  { key: 'work', element: document.querySelector('#work') },
  { key: 'outside', element: document.querySelector('#outside') },
  { key: 'about', element: document.querySelector('#about') },
  { key: 'elsewhere', element: document.querySelector('#elsewhere') },
].filter(({ element }) => element);
const projectTrack = document.querySelector('.project-track');
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
  projectStart: 0,
  projectRange: 1,
};

let frameRequest = 0;
let needsMeasurement = true;
let motionEnabled = false;
let activeProject = 0;
let projectSelectionReady = false;
let pendingProjectIndex = projectIndexByFragment.get(window.location.hash) ?? null;
let previousScrollY = window.scrollY;

const clamp = (value, minimum = 0, maximum = 1) => Math.min(maximum, Math.max(minimum, value));

function setCurrentChapter(key) {
  chapterItems.forEach((item) => item.removeAttribute('aria-current'));
  chapterItems.find((item) => item.dataset.chapterItem === key)?.setAttribute('aria-current', 'location');
}

function resolveCurrentChapter() {
  const referenceLine = window.innerHeight * 0.22;
  let currentKey = 'introduction';

  chapterTargets.forEach(({ key, element }) => {
    if (element.getBoundingClientRect().top <= referenceLine) currentKey = key;
  });

  setCurrentChapter(currentKey);
}

function updateChapterPersistence() {
  const shouldPersist = Boolean(
    enhancementQuery.matches &&
    chapterIndexSentinel &&
    chapterIndexSentinel.getBoundingClientRect().top < 16
  );
  chapterIndexSlot?.classList.toggle('is-persistent', shouldPersist);
}

function measureGeometry() {
  const scrollY = window.scrollY;
  const viewportHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  const heroBounds = heroTrack?.getBoundingClientRect();
  const projectBounds = projectTrack?.getBoundingClientRect();

  geometry.documentRange = Math.max(1, documentHeight - viewportHeight);

  if (heroBounds) {
    geometry.heroStart = heroBounds.top + scrollY;
    geometry.heroRange = Math.max(1, heroBounds.height - viewportHeight);
  }

  if (projectBounds) {
    geometry.projectStart = projectBounds.top + scrollY;
    geometry.projectRange = Math.max(1, projectBounds.height - viewportHeight);
  }

  needsMeasurement = false;
}

function projectScrollPosition(index) {
  return geometry.projectStart + (index / Math.max(1, projectPanels.length - 1)) * geometry.projectRange;
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
    const active = index === boundedIndex;
    panel.classList.toggle('is-active', active);

    if (motionEnabled) {
      panel.toggleAttribute('inert', !active);
      panel.setAttribute('aria-hidden', String(!active));
    } else {
      panel.removeAttribute('inert');
      panel.removeAttribute('aria-hidden');
    }
  });
}

function projectIndexForProgress(progress, direction) {
  if (!projectSelectionReady) {
    projectSelectionReady = true;
    return clamp(Math.floor(progress * projectPanels.length), 0, projectPanels.length - 1);
  }

  const hysteresis = 0.035;
  let nextIndex = activeProject;

  if (direction >= 0) {
    while (
      nextIndex < projectPanels.length - 1 &&
      progress > (nextIndex + 1) / projectPanels.length + hysteresis
    ) {
      nextIndex += 1;
    }
  } else {
    while (nextIndex > 0 && progress < nextIndex / projectPanels.length - hysteresis) {
      nextIndex -= 1;
    }
  }

  return nextIndex;
}

function applyPendingProject() {
  if (!motionEnabled || pendingProjectIndex === null) return;

  const nextIndex = pendingProjectIndex;
  pendingProjectIndex = null;
  setActiveProject(nextIndex);
  projectSelectionReady = true;
  scrollToProject(nextIndex, 'auto');
}

function paint() {
  frameRequest = 0;
  if (needsMeasurement) measureGeometry();
  applyPendingProject();

  const scrollY = window.scrollY;
  const direction = Math.sign(scrollY - previousScrollY);
  previousScrollY = scrollY;

  if (!motionEnabled) return;

  if (progressRule) {
    progressRule.style.transform = `scaleX(${clamp(scrollY / geometry.documentRange)})`;
  }

  const heroProgress = clamp((scrollY - geometry.heroStart) / geometry.heroRange);
  root.style.setProperty('--hero-name-y', `${(-heroProgress * 10).toFixed(3)}vh`);
  root.style.setProperty('--hero-name-scale', (1 - heroProgress * 0.08).toFixed(4));
  root.style.setProperty('--hero-object-y', `${(heroProgress * 8).toFixed(3)}vh`);
  root.style.setProperty('--hero-object-rotate', `${(heroProgress * 4).toFixed(3)}deg`);

  const projectProgress = clamp((scrollY - geometry.projectStart) / geometry.projectRange);
  const nextProject = projectIndexForProgress(projectProgress, direction);
  if (nextProject !== activeProject) setActiveProject(nextProject);
}

function scheduleUpdate({ measure = false } = {}) {
  needsMeasurement ||= measure;
  if (!frameRequest) frameRequest = window.requestAnimationFrame(paint);
}

function queueCurrentProjectFragment() {
  const index = projectIndexByFragment.get(window.location.hash);
  if (index === undefined || !motionEnabled) return;

  pendingProjectIndex = index;
  scheduleUpdate();
}

function updateProjectFragment(index) {
  const hash = `#${projectPanels[index].id}`;
  if (window.location.hash !== hash) history.pushState(null, '', hash);
}

function activateProject(index, behavior = 'smooth') {
  setActiveProject(index);
  projectSelectionReady = true;
  scrollToProject(index, behavior);
}

function applyEnhancementState() {
  motionEnabled = enhancementQuery.matches;
  root.classList.toggle('motion-ok', motionEnabled);
  updateChapterPersistence();
  projectSelectionReady = false;

  if (!motionEnabled) {
    pendingProjectIndex = null;
    progressRule?.style.removeProperty('transform');
    root.style.removeProperty('--hero-name-y');
    root.style.removeProperty('--hero-name-scale');
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
    if (!motionEnabled) return;

    updateProjectFragment(index);
    activateProject(index);
  });
});

projectPermalinks.forEach((permalink) => {
  permalink.addEventListener('click', (event) => {
    if (
      !motionEnabled ||
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

window.addEventListener('scroll', scheduleUpdate, { passive: true });
window.addEventListener('resize', () => scheduleUpdate({ measure: true }), { passive: true });
window.addEventListener('hashchange', queueCurrentProjectFragment);
window.addEventListener('popstate', queueCurrentProjectFragment);
enhancementQuery.addEventListener('change', applyEnhancementState);

const chapterObserver = new IntersectionObserver(resolveCurrentChapter, {
  rootMargin: '-22% 0px -77% 0px',
  threshold: 0,
});
chapterTargets.forEach(({ element }) => chapterObserver.observe(element));

if (chapterIndexSentinel) {
  const persistenceObserver = new IntersectionObserver(updateChapterPersistence, {
    rootMargin: '-16px 0px 0px',
    threshold: 0,
  });
  persistenceObserver.observe(chapterIndexSentinel);
}

root.classList.add('js');
setCurrentChapter('introduction');
applyEnhancementState();
