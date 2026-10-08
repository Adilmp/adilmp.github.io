// Colour theme toggle. The site opens on the light comic page; the visitor can switch to dark.

export {}; // makes this file a module so its top-level names stay private
const root = document.documentElement;

function current(): 'light' | 'dark' {
  const set = root.dataset.theme;
  if (set === 'light' || set === 'dark') return set;
  return 'light';
}

document.getElementById('theme-toggle')?.addEventListener('click', () => {
  const next = current() === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  try {
    localStorage.setItem('theme', next);
  } catch {
    // Storage can be blocked (private windows); the choice just won't persist.
  }
});
