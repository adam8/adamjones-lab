import './styles.css';

const root = document.documentElement;
const progressRule = document.querySelector('.reading-progress');
const heroTrack = document.querySelector('.hero-track');
const projectTrack = document.querySelector('.project-track');
const projectButtons = [...document.querySelectorAll('[data-project-button]')];
const projectPanels = [...document.querySelectorAll('[data-project-panel]')];
const motionQuery = window.matchMedia(
  '(min-width: 801px) and (min-height: 641px) and (prefers-reduced-motion: no-preference)',
);

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
let previousScrollY = window.scrollY;

const clamp = (value, minimum = 0, maximum = 1) => Math.min(maximum, Math.max(minimum, value));

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

function paint() {
  frameRequest = 0;
  if (needsMeasurement) measureGeometry();

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

function applyMotionPreference() {
  motionEnabled = motionQuery.matches;
  root.classList.toggle('motion-ok', motionEnabled);
  projectSelectionReady = false;

  if (!motionEnabled) {
    progressRule?.style.removeProperty('transform');
    root.style.removeProperty('--hero-name-y');
    root.style.removeProperty('--hero-name-scale');
    root.style.removeProperty('--hero-object-y');
    root.style.removeProperty('--hero-object-rotate');
  }

  setActiveProject(activeProject);
  scheduleUpdate({ measure: true });
}

projectButtons.forEach((button, index) => {
  button.addEventListener('click', () => {
    if (!motionEnabled) return;

    setActiveProject(index);
    projectSelectionReady = true;
    const targetY = geometry.projectStart + (index / Math.max(1, projectPanels.length - 1)) * geometry.projectRange;
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  });
});

window.addEventListener('scroll', scheduleUpdate, { passive: true });
window.addEventListener('resize', () => scheduleUpdate({ measure: true }), { passive: true });
motionQuery.addEventListener('change', applyMotionPreference);

root.classList.add('js');
applyMotionPreference();
