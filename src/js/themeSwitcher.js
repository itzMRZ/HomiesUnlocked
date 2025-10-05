/**
 * ThemeSwitcher
 *
 * Handles theme switching functionality:
 * - Switches between dark, light, and pink themes
 * - Updates the UI to reflect theme changes
 * - Persists theme preference
 */
const ThemeSwitcher = (() => {
  const PINK_COLOR_COMBOS = [
    { background: '#FF6B6B', accent: '#E63946', text: '#000000' },
    { background: '#FFA94D', accent: '#F3722C', text: '#000000' },
    { background: '#FFD93D', accent: '#F4B400', text: '#000000' },
    { background: '#6EE7B7', accent: '#34D399', text: '#000000' },
    { background: '#3DCCC7', accent: '#119DA4', text: '#000000' },
    { background: '#4EA8DE', accent: '#1D4ED8', text: '#000000' },
    { background: '#9D79BC', accent: '#6C4AB6', text: '#000000' },
    { background: '#CBAACB', accent: '#9F7E9F', text: '#000000' },
    { background: '#F28482', accent: '#E05658', text: '#000000' },
    { background: '#81B29A', accent: '#467864', text: '#000000' }
  ];

  const VIBRANT_COLOR_COMBOS = [
    { background: '#2196F3', accent: '#1976D2', text: '#FFFFFF' },
    { background: '#E91E63', accent: '#C2185B', text: '#FFFFFF' },
    { background: '#00BCD4', accent: '#0097A7', text: '#FFFFFF' },
    { background: '#FF9800', accent: '#F57C00', text: '#FFFFFF' },
    { background: '#9C27B0', accent: '#7B1FA2', text: '#FFFFFF' },
    { background: '#4CAF50', accent: '#388E3C', text: '#FFFFFF' },
    { background: '#FF4081', accent: '#F50057', text: '#FFFFFF' },
    { background: '#26C6DA', accent: '#0097A7', text: '#FFFFFF' },
    { background: '#AB47BC', accent: '#8E24AA', text: '#FFFFFF' },
    { background: '#FFEB3B', accent: '#FBC02D', text: '#333333' }
  ];

  const THEME_COLOR_COMBOS = {
    dark: VIBRANT_COLOR_COMBOS,
    light: VIBRANT_COLOR_COMBOS,
    pink: PINK_COLOR_COMBOS
  };

  window.THEME_USER_COLOR_COMBOS = THEME_COLOR_COMBOS;

  function clonePalette(palette) {
    return palette.map(combo => ({ ...combo }));
  }

  function syncGlobalPalette(theme) {
    const palette = THEME_COLOR_COMBOS[theme] ?? THEME_COLOR_COMBOS.dark;
    if (Array.isArray(window.USER_COLOR_COMBOS)) {
      window.USER_COLOR_COMBOS.splice(0, window.USER_COLOR_COMBOS.length, ...clonePalette(palette));
    } else {
      window.USER_COLOR_COMBOS = clonePalette(palette);
    }

    if (typeof UserInputManager !== 'undefined' && typeof UserInputManager.refreshCardColors === 'function') {
      UserInputManager.refreshCardColors();
    }

    if (typeof RoutineManager !== 'undefined' && typeof RoutineManager.refreshRenderedRoutineColors === 'function') {
      RoutineManager.refreshRenderedRoutineColors();
    }
  }

  if (!Array.isArray(window.USER_COLOR_COMBOS)) {
    window.USER_COLOR_COMBOS = clonePalette(THEME_COLOR_COMBOS.dark);
  }

  // Available themes
  const themes = ['dark', 'light', 'pink'];
  let currentThemeIndex = 0;

  /**
   * Apply a theme to the document
   * @param {string} theme - The theme to apply ('dark', 'light', or 'pink')
   */
  function applyTheme(theme) {
  // Set theme attribute on the document body
    document.body.setAttribute('data-theme', theme);

  syncGlobalPalette(theme);

    // Update theme switcher button text
    const themeText = document.querySelector('.theme-text');
    if (themeText) {
      themeText.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);
    }

    // Update theme switcher button icon
    const themeSwitcher = document.getElementById('theme-switcher');
    if (themeSwitcher) {
      let iconHTML = '';

      if (theme === 'dark') {
        iconHTML = '<i class="bi bi-moon theme-icon"></i>';
      } else if (theme === 'light') {
        iconHTML = '<i class="bi bi-sun theme-icon"></i>';
      } else if (theme === 'pink') {
        iconHTML = '<i class="bi bi-fire theme-icon"></i>';
      }

      const existingIcon = themeSwitcher.querySelector('.theme-icon');
      if (existingIcon) {
        existingIcon.remove();
      }

      themeSwitcher.insertAdjacentHTML('afterbegin', iconHTML);
    }

    // Store theme preference in localStorage
    localStorage.setItem('preferredTheme', theme);
  }

  /**
   * Initialize the theme switcher
   */
  function init() {
    // Get stored theme preference or use default (dark)
    const storedTheme = localStorage.getItem('preferredTheme');
    if (storedTheme && themes.includes(storedTheme)) {
      currentThemeIndex = themes.indexOf(storedTheme);
      applyTheme(storedTheme);
    } else {
      applyTheme('dark');
    }

    // Add click event to theme switcher button
    const themeSwitcher = document.getElementById('theme-switcher');
    if (themeSwitcher) {
      themeSwitcher.addEventListener('click', () => {
        currentThemeIndex = (currentThemeIndex + 1) % themes.length;
        applyTheme(themes[currentThemeIndex]);
      });
    }
  }

  // Public API
  return {
    init,
    applyTheme
  };
})();