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
const stateCount = 3;

accentButton?.addEventListener('click', () => {
  const currentState = Number(accentButton.dataset.state ?? 0);
  const nextState = (currentState + 1) % stateCount;

  accentButton.dataset.state = String(nextState);
  accentButton.setAttribute(
    'aria-label',
    nextState === 0 ? 'Rearrange the accent' : `Rearrange the accent, arrangement ${nextState + 1} of ${stateCount}`,
  );
});
