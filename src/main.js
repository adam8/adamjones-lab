import './styles.css';

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
