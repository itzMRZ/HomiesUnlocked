/**
 * HomiesUnlocked - Main JavaScript
 *
 * This file contains the primary functionality for the HomiesUnlocked application
 * which combines user routines to create a comprehensive schedule.
 */

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize components
  UserInputManager.init();
  ThemeSwitcher.init();
  RoutineManager.init();
  UIManager.init();

  // Retrieve any cached routine on page load
  const cachedRoutine = localStorage.getItem('cachedRoutine');
  if (cachedRoutine) {
    document.getElementById('routine-table-body').innerHTML = cachedRoutine;
  }
});