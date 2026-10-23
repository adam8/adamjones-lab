import './styles.css';
import { catalogue } from './catalogue.js';

const catalogueMount = document.querySelector('.catalogue');

if (catalogueMount) {
  const entries = document.createDocumentFragment();

  for (const entry of catalogue) {
    const item = document.createElement('li');
    const article = document.createElement('article');
    const type = document.createElement('p');
    const title = document.createElement('h3');
    const summary = document.createElement('p');

    item.className = 'catalogue-item';
    article.className = 'catalogue-entry';
    type.className = 'catalogue-type';
    summary.className = 'catalogue-summary';

    type.textContent = entry.type;
    title.textContent = entry.title;
    summary.textContent = entry.summary;

    article.append(type, title, summary);
    item.append(article);
    entries.append(item);
  }

  catalogueMount.append(entries);
}

const accentButton = document.querySelector('.accent-button');
const accentComposition = accentButton?.querySelector('.accent-composition');
const stateCount = 3;
const movementLimit = 8;
const keyboardStep = 2;
let accentOffset = { x: 0, y: 0 };

function clampOffset(value) {
  return Math.max(-movementLimit, Math.min(movementLimit, value));
}

function setAccentOffset(x, y) {
  if (!accentComposition) return;

  accentOffset = {
    x: clampOffset(x),
    y: clampOffset(y),
  };

  const rotation = (accentOffset.x / movementLimit) * 0.8;

  accentComposition.style.setProperty('--accent-x', `${accentOffset.x}px`);
  accentComposition.style.setProperty('--accent-y', `${accentOffset.y}px`);
  accentComposition.style.setProperty('--accent-rotation', `${rotation}deg`);
}

function resetAccentOffset() {
  setAccentOffset(0, 0);
}

accentButton?.addEventListener('pointermove', (event) => {
  if (event.pointerType !== 'mouse') return;

  const bounds = accentButton.getBoundingClientRect();
  const x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
  const y = ((event.clientY - bounds.top) / bounds.height) * 2 - 1;

  setAccentOffset(x * movementLimit, y * movementLimit);
});

accentButton?.addEventListener('pointerleave', (event) => {
  if (event.pointerType === 'mouse') resetAccentOffset();
});

accentButton?.addEventListener('keydown', (event) => {
  const direction = {
    ArrowLeft: [-keyboardStep, 0],
    ArrowRight: [keyboardStep, 0],
    ArrowUp: [0, -keyboardStep],
    ArrowDown: [0, keyboardStep],
  }[event.key];

  if (direction) {
    event.preventDefault();
    setAccentOffset(accentOffset.x + direction[0], accentOffset.y + direction[1]);
    return;
  }

  if (event.key === 'Escape') {
    event.preventDefault();
    resetAccentOffset();
  }
});

accentButton?.addEventListener('blur', resetAccentOffset);

accentButton?.addEventListener('click', () => {
  const currentState = Number(accentButton.dataset.state ?? 0);
  const nextState = (currentState + 1) % stateCount;

  accentButton.dataset.state = String(nextState);
  accentButton.setAttribute(
    'aria-label',
    nextState === 0 ? 'Rearrange the accent' : `Rearrange the accent, arrangement ${nextState + 1} of ${stateCount}`,
  );
});
