/**
 * Theme Management Module
 * Handles light/dark/system theme switching with localStorage persistence
 */

// Theme constants
const THEME_KEY = 'kudos-theme-preference';
const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};

// Theme state
let currentPreference = null;
let systemPreference = null;

/**
 * Get the system's preferred color scheme
 * @returns {string} 'dark' or 'light'
 */
function getSystemPreference() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Initialize theme system
 * MUST be called early to prevent flash
 */
function initTheme() {
  // Detect system preference
  systemPreference = getSystemPreference();

  // Load saved preference or default to system
  try {
    currentPreference = localStorage.getItem(THEME_KEY) || THEMES.SYSTEM;
  } catch (e) {
    console.warn('Failed to read theme preference from localStorage:', e);
    currentPreference = THEMES.SYSTEM;
  }

  // Apply theme immediately
  applyTheme(getEffectiveTheme());

  // Watch for system preference changes
  watchSystemPreference();

  // Watch for changes in other tabs
  watchStorageChanges();
}

/**
 * Get the effective theme (resolves "system" to actual theme)
 * @returns {string} 'dark' or 'light'
 */
function getEffectiveTheme() {
  if (currentPreference === THEMES.SYSTEM) {
    return systemPreference;
  }
  return currentPreference;
}

/**
 * Apply theme to document
 * @param {string} theme - 'dark' or 'light'
 */
function applyTheme(theme) {
  const html = document.documentElement;
  if (theme === THEMES.DARK) {
    html.dataset.theme = 'dark';
  } else {
    delete html.dataset.theme;
  }
}

/**
 * Set theme preference
 * @param {string} preference - 'light', 'dark', or 'system'
 */
function setTheme(preference) {
  if (!Object.values(THEMES).includes(preference)) {
    console.error('Invalid theme preference:', preference);
    return;
  }

  currentPreference = preference;

  // Persist to localStorage
  try {
    localStorage.setItem(THEME_KEY, preference);
  } catch (e) {
    console.warn('Failed to save theme preference to localStorage:', e);
  }

  // Apply theme
  applyTheme(getEffectiveTheme());

  // Dispatch custom event for UI updates
  window.dispatchEvent(new CustomEvent('themechange', {
    detail: {
      preference: preference,
      effective: getEffectiveTheme()
    }
  }));
}

/**
 * Get current theme preference
 * @returns {string} 'light', 'dark', or 'system'
 */
function getTheme() {
  return currentPreference || THEMES.SYSTEM;
}

/**
 * Listen for system preference changes
 */
function watchSystemPreference() {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', handleSystemPreferenceChange);
}

/**
 * Handle system preference changes
 * @param {MediaQueryListEvent} e - Media query change event
 */
function handleSystemPreferenceChange(e) {
  systemPreference = e.matches ? 'dark' : 'light';

  // Only apply if current preference is "system"
  if (currentPreference === THEMES.SYSTEM) {
    applyTheme(systemPreference);

    // Notify UI of change
    window.dispatchEvent(new CustomEvent('themechange', {
      detail: {
        preference: THEMES.SYSTEM,
        effective: systemPreference
      }
    }));
  }
}

/**
 * Watch for theme changes in other tabs
 */
function watchStorageChanges() {
  window.addEventListener('storage', (e) => {
    // Only respond to theme preference changes
    if (e.key === THEME_KEY && e.newValue !== currentPreference) {
      currentPreference = e.newValue || THEMES.SYSTEM;
      applyTheme(getEffectiveTheme());

      // Notify UI of change
      window.dispatchEvent(new CustomEvent('themechange', {
        detail: {
          preference: currentPreference,
          effective: getEffectiveTheme()
        }
      }));
    }
  });
}

/**
 * Initialize theme toggle UI
 * Call this after DOM is ready
 */
function initThemeToggle() {
  const options = document.querySelectorAll('.theme-option');
  if (options.length === 0) {
    // No theme toggle on this page (e.g., might be login page without toggle yet)
    return;
  }

  const currentTheme = getTheme();

  // Set initial state
  options.forEach(option => {
    const theme = option.dataset.theme;
    option.setAttribute('aria-checked', theme === currentTheme ? 'true' : 'false');
  });

  // Add click handlers
  options.forEach(option => {
    option.addEventListener('click', () => {
      const theme = option.dataset.theme;
      setTheme(theme);

      // Update UI
      options.forEach(opt => {
        opt.setAttribute('aria-checked', opt === option ? 'true' : 'false');
      });
    });
  });

  // Listen for theme changes from other sources (system, other tabs)
  window.addEventListener('themechange', (e) => {
    options.forEach(option => {
      const theme = option.dataset.theme;
      option.setAttribute('aria-checked', theme === e.detail.preference ? 'true' : 'false');
    });
  });
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initThemeToggle);
} else {
  initThemeToggle();
}

// Export functions to window
if (typeof window !== 'undefined') {
  window.themeManager = {
    init: initTheme,
    set: setTheme,
    get: getTheme,
    getEffective: getEffectiveTheme,
    THEMES: THEMES
  };
}
