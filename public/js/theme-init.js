/**
 * Theme Initialization Script
 * MUST be loaded synchronously in <head> before stylesheets to prevent flash
 */
(function() {
  try {
    const THEME_KEY = 'kudos-theme-preference';
    const preference = localStorage.getItem(THEME_KEY) || 'system';
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const effectiveTheme = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;

    if (effectiveTheme === 'dark') {
      document.documentElement.dataset.theme = 'dark';
    }
  } catch (e) {
    // localStorage may be unavailable (private browsing, etc.)
    // Silently fall back to light theme
  }
})();
