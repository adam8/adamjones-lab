// Layout selection only. Native HTML and conservative CSS are always the fallback.
export async function startAbout() {
  const section = document.querySelector('#about');
  if (!section) return;
  const frame = section.querySelector('.about-forme');
  const cleanups = [];
  let pending = 0, disabled = false;
  const fallback = () => {
    disabled = true;
    cancelAnimationFrame(pending);
    pending = 0;
    for (const stop of cleanups.splice(0)) { try { stop(); } catch { /* best effort */ } }
    section.removeAttribute('data-layout');
  };
  try {
    const { prepare, layout, measureNaturalWidth, clearCache } = await import('@chenglou/pretext');
    await document.fonts.ready;
    const prepared = new Map();
    let lastKey = '', epoch = 0;
    const textOf = el => {
      let text = '';
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node.nodeType === Node.TEXT_NODE) text += node.textContent;
        else if (node.nodeName === 'WBR') text += '\u200b';
      }
      return text;
    };
    const getPrepared = (text, font, spacing) => {
      const key = JSON.stringify([text, font, spacing]);
      if (!prepared.has(key)) prepared.set(key, prepare(text, font, { letterSpacing: spacing }));
      return prepared.get(key);
    };
    const render = () => {
      pending = 0;
      if (disabled) return;
      try {
        const width = frame.clientWidth;
        // All reads precede the single mode write. Proposed widths never depend on mode.
        const mobile = innerWidth <= 800;
        const fields = [...section.querySelectorAll('.about-fact')].map(field => {
          const el = field.querySelector('dd'), css = getComputedStyle(el), box = getComputedStyle(field);
          return {
            field, text: textOf(el),
            term: mobile ? (() => {
              const term = field.querySelector('dt'), css = getComputedStyle(term);
              const text = textOf(term);
              return { text: css.textTransform === 'uppercase' ? text.toUpperCase() : text,
                font: `${css.fontStyle} ${css.fontWeight} ${css.fontSize} ${css.fontFamily}`,
                spacing: parseFloat(css.letterSpacing) || 0, lineHeight: parseFloat(css.lineHeight) };
            })() : null, font: `${css.fontStyle} ${css.fontWeight} ${css.fontSize} ${css.fontFamily}`,
            spacing: parseFloat(css.letterSpacing) || 0, lineHeight: parseFloat(css.lineHeight),
            maxWidth: parseFloat(css.maxWidth), pad: parseFloat(box.paddingLeft) + parseFloat(box.paddingRight),
          };
        });
        const key = JSON.stringify([width, innerWidth, innerHeight <= 640, devicePixelRatio,
          getComputedStyle(document.documentElement).fontSize, epoch,
          fields.map(({ field, ...metrics }) => metrics)]);
        if (key === lastKey) return;
        lastKey = key;
        let fits = (mobile ? innerWidth >= 375 : width >= 800) && innerHeight > 640;
        // Mobile budgets bound reading density, not total viewport height. Four
        // Location/Tools lines, seven Work, nine Explorations, three Background;
        // labels may wrap to two lines. Widths include the proposed shared rule.
        // Typography/padding are identical in reading and grid modes.
        const mobileShares = [.4, .6, .48, .52, .48];
        const mobileLimits = [4, 7, 4, 9, 3];
        if (mobile) for (const [i, m] of fields.entries()) {
          const target = Math.floor((width * mobileShares[i] - m.pad - ([0,3].includes(i) ? 1 : 0)) * 4) / 4;
          for (const [metrics, limit] of [[m, mobileLimits[i]], [m.term, 2]]) {
            const handle = getPrepared(metrics.text, metrics.font, metrics.spacing);
            const lines = target > 0 ? layout(handle, target, metrics.lineHeight).lineCount : Infinity;
            const widest = Math.max(0, ...metrics.text.split(/[\s\u200b]+/).filter(Boolean)
              .map(word => measureNaturalWidth(getPrepared(word, metrics.font, metrics.spacing))));
            fits &&= target > 0 && widest + 2 <= target && lines <= limit;
          }
        }
        else
        for (const m of fields) {
          const narrow = m.field.matches('.about-location, .about-current');
          const target = Math.floor(Math.min(width * (narrow ? 1/3 : 2/3) - m.pad - (narrow ? 1 : 0),
            Number.isFinite(m.maxWidth) ? m.maxWidth : Infinity) * 4) / 4;
          const handle = getPrepared(m.text, m.font, m.spacing);
          const lines = target > 0 ? layout(handle, target, m.lineHeight).lineCount : Infinity;
          const widest = Math.max(0, ...m.text.split(/[\s\u200b]+/).filter(Boolean)
            .map(word => measureNaturalWidth(getPrepared(word, m.font, m.spacing))));
          const limit = m.field.matches('.about-current') ? 6 : m.field.matches('.about-work') ? 4 : 3;
          fits &&= target > 0 && widest + 2 <= target && lines <= limit;
        }
        const mode = fits ? 'grid' : 'reading';
        if (section.dataset.layout !== mode) section.dataset.layout = mode;
      } catch { fallback(); }
    };
    const schedule = () => {
      if (!disabled && !pending) pending = requestAnimationFrame(render);
    };
    const guarded = callback => () => { if (!disabled) { try { callback(); } catch { fallback(); } } };
    const invalidate = guarded(() => { epoch++; clearCache(); prepared.clear(); schedule(); });
    const sentinel = document.createElement('span');
    sentinel.className = 'about-font-sentinel';
    sentinel.setAttribute('aria-hidden', 'true');
    section.append(sentinel);
    cleanups.push(() => sentinel.remove());
    // Ignore height-only changes caused by our own layout selection.
    const widths = new WeakMap();
    const observer = new ResizeObserver(guarded(() => {
      const values = [frame, sentinel].map(el => [el, el.getBoundingClientRect().width]);
      if (values.some(([el, width]) => widths.get(el) !== width)) {
        values.forEach(([el, width]) => widths.set(el, width)); schedule();
      }
    }));
    observer.observe(frame); observer.observe(sentinel);
    cleanups.push(() => observer.disconnect());
    addEventListener('resize', schedule, { passive: true });
    cleanups.push(() => removeEventListener('resize', schedule));
    document.fonts.addEventListener('loadingdone', invalidate);
    cleanups.push(() => document.fonts.removeEventListener('loadingdone', invalidate));
    // Root motion is written by the scene scheduler on animation frames. Compare
    // declarations without computed-style/layout reads; ignore only these known
    // non-font properties, not arbitrary custom properties (which may feed fonts).
    const root = document.documentElement;
    const motionProperties = new Set(['--hero-object-y', '--hero-object-rotate', 'scroll-behavior']);
    const previousStyle = document.createElement('span').style;
    const relevantMutation = record => {
      if (record.target !== root || record.attributeName !== 'style') return true;
      previousStyle.cssText = record.oldValue || '';
      const current = root.style;
      const properties = new Set([...previousStyle, ...current]);
      return [...properties].some(property => !motionProperties.has(property) &&
        (previousStyle.getPropertyValue(property) !== current.getPropertyValue(property) ||
         previousStyle.getPropertyPriority(property) !== current.getPropertyPriority(property)));
    };
    const mutations = new MutationObserver(guardedRecords => {
      if (disabled) return;
      try { if (guardedRecords.some(relevantMutation)) schedule(); } catch { fallback(); }
    });
    // Only About, its font-affecting ancestors, and stylesheet changes are owned.
    // In particular, sibling scene/progress mutations cannot schedule About reads.
    for (let ancestor = section.parentElement; ancestor; ancestor = ancestor.parentElement) {
      mutations.observe(ancestor, { attributes: true, attributeOldValue: true, attributeFilter: ['style', 'class'] });
    }
    mutations.observe(section, { attributes: true, subtree: true, attributeFilter: ['style', 'class'] });
    mutations.observe(document.head, { childList: true, subtree: true, characterData: true,
      attributes: true, attributeFilter: ['href', 'media', 'disabled'] });
    cleanups.push(() => mutations.disconnect());
    let resolution;
    const dprChanged = guarded(() => { armDPR(); invalidate(); });
    const armDPR = () => {
      resolution?.removeEventListener('change', dprChanged);
      resolution = matchMedia(`(resolution: ${devicePixelRatio}dppx)`);
      resolution.addEventListener('change', dprChanged);
    };
    armDPR();
    cleanups.push(() => resolution?.removeEventListener('change', dprChanged));
    schedule();
  } catch { fallback(); }
}
