/**
 * HomiesUnlocked - Main JavaScript
 *
 * This file contains the primary functionality for the HomiesUnlocked application
 * which combines user routines to create a comprehensive schedule.
 */

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 HomiesUnlocked initializing...');

  const initializers = [
    { name: 'ThemeSwitcher', icon: '🎨', init: () => ThemeSwitcher.init() },
    { name: 'UserInputManager', icon: '📝', init: () => UserInputManager.init(), retryable: true },
    { name: 'RoutineManager', icon: '🔄', init: () => RoutineManager.init() },
    { name: 'UIManager', icon: '🖥️', init: () => UIManager.init() }
  ];

  let userInputRetryAttempted = false;

  for (const { name, icon, init, retryable } of initializers) {
    try {
      console.log(`${icon} Initializing ${name}...`);
      init();
    } catch (error) {
      console.error(`❌ ${name} initialization failed:`, error);

      if (retryable && name === 'UserInputManager' && !userInputRetryAttempted) {
        userInputRetryAttempted = true;
        console.log('🧹 Resetting cached user data and retrying UserInputManager...');
        localStorage.removeItem('cachedUserInputs');
        localStorage.removeItem('cachedRoutine');

        try {
          UserInputManager.init();
          console.log('✅ UserInputManager retry succeeded');
        } catch (retryError) {
          console.error('❌ UserInputManager retry failed:', retryError);
        }
      }
    }
  }

  // Retrieve any cached routine on page load (only if no current routine exists)
  const routineTableBody = document.getElementById('routine-table-body');
  if (routineTableBody && routineTableBody.children.length === 0) {
    const cachedRoutine = localStorage.getItem('cachedRoutine');
    if (cachedRoutine) {
      console.log('📋 Restoring cached routine...');
      routineTableBody.innerHTML = cachedRoutine;
    }
  }

  console.log('✅ HomiesUnlocked initialization sequence completed');
});