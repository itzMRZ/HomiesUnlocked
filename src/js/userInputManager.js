/**
 * UserInputManager
 *
 * Handles all functionality related to user input cards including:
 * - Adding and removing user input cards
 * - Caching user inputs in localStorage
 * - Retrieving cached inputs
 */
const UserInputManager = (() => {
  // Constants
  const MAX_USERS = 16;
  const userColors = [
    '#8e44ad', '#27ae60', '#2980b9', '#d35400', '#c0392b',
    '#f39c12', '#16a085', '#2c3e50', '#7f8c8d', '#e74c3c', '#3498db'
  ];

  // Variables
  let userCount = 0;
  let cacheTimeout = null; // For debouncing cache operations
  /**
   * Cache current user inputs to localStorage (heavily optimized)
   * Only saves cards that have at least one non-empty field
   */
  function cacheUserInputs() {
    // Prevent excessive calls - early return if already debouncing
    if (cacheTimeout) {
      clearTimeout(cacheTimeout);
    }
    
    // Debounce for 300ms to prevent excessive operations
    cacheTimeout = setTimeout(() => {
      try {
        const cardsData = [];
        const userInputsContainer = document.getElementById('user-inputs');
        
        // Early return if container doesn't exist
        if (!userInputsContainer) {
          console.warn('UserInputs container not found during caching');
          return;
        }
        
        const allCards = userInputsContainer.children;

        // Use for loop instead of forEach for better performance with HTMLCollection
        for (let i = 0; i < allCards.length; i++) {
          const card = allCards[i];
          const inputs = card.querySelectorAll('input.input-field');
          
          if (inputs.length >= 2) {
            const nameValue = inputs[0].value.trim();
            const routineValue = inputs[1].value.trim();

            // Only save cards that have at least one non-empty field
            if (nameValue || routineValue) {
              cardsData.push({
                name: nameValue,
                routine: routineValue
              });
            }
          }
        }

        // Prevent localStorage thrashing - only update if data actually changed
        const currentCached = localStorage.getItem('cachedUserInputs');
        const newCachedString = cardsData.length > 0 ? JSON.stringify(cardsData) : null;
        
        if (currentCached !== newCachedString) {
          if (newCachedString) {
            localStorage.setItem('cachedUserInputs', newCachedString);
          } else {
            localStorage.removeItem('cachedUserInputs');
          }
        }
      } catch (error) {
        console.error('Cache error:', error);
        // Prevent infinite loops on cache errors
        cacheTimeout = null;
      }
    }, 300);
  }
  /**
   * Create a simple input field (optimized)
   * @param {string} placeholder - Placeholder text for the input
   * @param {string} value - Initial value for the input
   * @returns {HTMLElement} Input element
   */
  function createInputField(placeholder, value = '') {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'input-field';
    input.placeholder = placeholder;
    input.value = value;
    
    // Use debounced caching to prevent excessive calls
    input.addEventListener('input', cacheUserInputs);
    return input;
  }  /**
   * Add user input cards to the DOM (optimized)
   * @param {Array} prefillData - Optional array of objects with name and routine data
   */
  function addUserInputCards(prefillData) {
    const userInputsContainer = document.getElementById('user-inputs');
    if (!userInputsContainer) {
      console.error('❌ User inputs container not found');
      return;
    }

    // If prefillData is provided and has entries, add only those cards
    if (prefillData && prefillData.length) {
      prefillData.forEach(entry => {
        if (userCount >= MAX_USERS) return; // Safety check
        createSingleCard(entry.name, entry.routine);
      });
    } else if (userCount < MAX_USERS) {
      // Add one empty card
      createSingleCard('', '');
    }

    // Cache only once at the end instead of per card
    cacheUserInputs();
  }
  /**
   * Create a single user input card (helper function)
   * @param {string} nameValue - Name value
   * @param {string} routineValue - Routine value
   */
  function createSingleCard(nameValue = '', routineValue = '') {
    // Get container reference - if it doesn't exist, return early
    const userInputsContainer = document.getElementById('user-inputs');
    if (!userInputsContainer) {
      console.error('❌ Cannot create card - user inputs container not found');
      return;
    }
    
    const color = userColors[userCount % userColors.length];
    
    const userCard = document.createElement('div');
    userCard.className = 'input-card rounded-lg';
    userCard.style.borderLeft = `4px solid ${color}`;

    const inputRow = document.createElement('div');
    inputRow.className = 'input-row';

    // Create name row (name input)
    const nameRow = document.createElement('div');
    nameRow.className = 'name-row';
    const nameInput = createInputField('Name', nameValue);

    // Create routine row (routine input)
    const routineRow = document.createElement('div');
    routineRow.className = 'routine-row';
    const routineInput = createInputField('Paste Routine ID Here', routineValue);

    // Create trash can button container
    const trashBtnContainer = document.createElement('div');
    trashBtnContainer.className = 'trash-btn-container';

    // Create trash can button
    const trashBtn = document.createElement('button');
    trashBtn.type = 'button';
    trashBtn.className = 'trash-btn';
    trashBtn.innerHTML = '<i class="fas fa-trash" style="color: #dc2626;"></i>';
    trashBtn.title = 'Clear both fields';

    trashBtn.addEventListener('click', () => {
      nameInput.value = '';
      routineInput.value = '';
      cacheUserInputs();
    });

    trashBtnContainer.appendChild(trashBtn);
    nameRow.appendChild(nameInput);
    routineRow.appendChild(routineInput);
    inputRow.appendChild(nameRow);
    inputRow.appendChild(routineRow);
    inputRow.appendChild(trashBtnContainer);
    userCard.appendChild(inputRow);
    userInputsContainer.appendChild(userCard);
    userCount++;
  }

  /**
   * Load cached user inputs from localStorage
   */
  function loadCachedUserInputs() {
    const cached = localStorage.getItem('cachedUserInputs');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length) {
          addUserInputCards(parsed);
        }
      } catch (err) {
        console.error("Error parsing cached user inputs:", err);
      }
    }
  }  /**
   * Clear potentially corrupted localStorage data
   */
  function clearStorageConflicts() {
    try {
      // Check for corrupted data
      const cachedInputs = localStorage.getItem('cachedUserInputs');
      if (cachedInputs) {
        const parsed = JSON.parse(cachedInputs);
        if (!Array.isArray(parsed)) {
          console.warn('🗑️ Clearing corrupted cachedUserInputs');
          localStorage.removeItem('cachedUserInputs');
        }
      }
    } catch (error) {
      console.warn('🗑️ Clearing corrupted localStorage data');
      localStorage.removeItem('cachedUserInputs');
      localStorage.removeItem('cachedRoutine');
    }
  }  /**
   * Initialize the UserInputManager (optimized)
   */
  function init() {
    // Get container reference once
    const userInputsContainer = document.getElementById('user-inputs');
    if (!userInputsContainer) {
      console.error('❌ User inputs container not found!');
      return;
    }
    
    // Clear any existing content to prevent duplicates
    userInputsContainer.innerHTML = '';
    userCount = 0;

    // Clear storage conflicts before loading
    clearStorageConflicts();

    // Load cached input fields if available
    loadCachedUserInputs();

    // Ensure minimum number of fields based on device type
    const isMobile = isMobileDevice();
    const minFields = isMobile ? 2 : 4;
    
    // Add minimum required fields
    while (userCount < minFields) {
      createSingleCard('', '');
    }

    // Add event listener for "Add more users" button
    const addUserBtn = document.getElementById('add-user-btn');
    if (addUserBtn) {
      addUserBtn.addEventListener('click', () => {
        if (isMobile) {
          // Mobile: Add 1 user at a time
          createSingleCard('', '');
        } else {
          // Desktop: Add 2 users at a time to maintain even number
          createSingleCard('', '');
          createSingleCard('', '');
        }
        
        // Cache after adding
        cacheUserInputs();
      });
    } else {
      console.error('❌ Add user button not found!');
    }
  }
  /**
   * Check if the device is mobile
   * @returns {boolean} True if device is mobile
   */
  function isMobileDevice() {
    return window.innerWidth <= 768 || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  // Public API
  return {
    init,
    addUserInputCards,
    loadCachedUserInputs,
    cacheUserInputs,
    isMobileDevice
  };
})();