/**
 * ThemeSwitcher
 *
 * Handles theme switching functionality:
 * - Switches between dark, light, and pink themes
 * - Updates the UI to reflect theme changes
 * - Persists theme preference
 */
const ThemeSwitcher = (() => {
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