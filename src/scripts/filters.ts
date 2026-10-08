// Generic chip filters. A container with [data-filterable] holds buttons
// ([data-filter-key] + [data-filter-value]) and items ([data-item] carrying matching data-* attributes).
// Without JavaScript every item stays visible, which is the safe default.

export {}; // makes this file a module so its top-level names stay private

document.querySelectorAll<HTMLElement>('[data-filterable]').forEach((root) => {
  const state: Record<string, string> = {};
  const items = [...root.querySelectorAll<HTMLElement>('[data-item]')];
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-filter-key]')];
  const collapsible = root.querySelector<HTMLElement>('[data-collapsible]');
  const showAll = root.querySelector<HTMLButtonElement>('[data-show-all]');

  const apply = () => {
    let active = false;
    for (const el of items) {
      const ok = Object.entries(state).every(([k, v]) => v === 'all' || el.dataset[k] === v);
      el.hidden = !ok;
    }
    for (const v of Object.values(state)) if (v !== 'all') active = true;
    for (const b of buttons) {
      const key = b.dataset.filterKey!;
      b.setAttribute('aria-pressed', String((state[key] ?? 'all') === b.dataset.filterValue));
    }
    if (collapsible && showAll) {
      if (active) {
        collapsible.classList.remove('is-collapsed');
        showAll.hidden = true;
      } else if (!showAll.dataset.expanded) {
        collapsible.classList.add('is-collapsed');
        showAll.hidden = false;
      }
    }
  };

  for (const b of buttons) {
    b.addEventListener('click', () => {
      state[b.dataset.filterKey!] = b.dataset.filterValue!;
      apply();
    });
  }
  showAll?.addEventListener('click', () => {
    showAll.dataset.expanded = '1';
    collapsible?.classList.remove('is-collapsed');
    showAll.hidden = true;
  });
  apply();
});
