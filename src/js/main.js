/**
 * HomiesUnlocked - Main JavaScript
 *
 * This file contains the primary functionality for the HomiesUnlocked application
 * which combines user routines to create a comprehensive schedule.
 */

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 HomiesUnlocked initializing...');
  
  try {
    // Initialize components in order (avoid race conditions)
    console.log('🎨 Initializing ThemeSwitcher...');
    ThemeSwitcher.init();
    
    console.log('📝 Initializing UserInputManager...');
    UserInputManager.init();
    
    console.log('🔄 Initializing RoutineManager...');
    RoutineManager.init();
    
    console.log('🖥️ Initializing UIManager...');
    UIManager.init();

    // Retrieve any cached routine on page load (only if no current routine exists)
    const routineTableBody = document.getElementById('routine-table-body');
    if (routineTableBody && routineTableBody.children.length === 0) {
      const cachedRoutine = localStorage.getItem('cachedRoutine');
      if (cachedRoutine) {
        console.log('📋 Restoring cached routine...');
        routineTableBody.innerHTML = cachedRoutine;
      }
    }
    
    console.log('✅ HomiesUnlocked initialized successfully');
  } catch (error) {
    console.error('❌ Error during initialization:', error);
  }
});