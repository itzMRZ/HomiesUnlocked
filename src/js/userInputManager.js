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
  let userCount = 0;  /**
   * Cache current user inputs to localStorage
   * Only saves cards that have at least one non-empty field
   * Also manages field optimization based on device type
   */
  function cacheUserInputs() {
    const cardsData = [];
    const allCards = document.querySelectorAll('#user-inputs > div');

    // Count filled cards and collect data
    allCards.forEach(card => {
      const inputs = card.querySelectorAll('input.input-field');
      if(inputs.length >= 2) {
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
    });

    // Smart field management based on device type
    const filledCount = cardsData.length;
    const totalCards = allCards.length;
    const emptyCards = totalCards - filledCount;

    if (isMobileDevice()) {
      // Mobile: Remove excessive empty cards (keep at least 1 empty)
      if (emptyCards > 1) {
        removeEmptyCards(emptyCards - 1);
      }
    } else {
      // Desktop: Maintain even number of total cards
      const targetTotal = filledCount + (filledCount % 2 === 0 ? 2 : 1); // Always even, with buffer
      if (totalCards > targetTotal) {
        removeEmptyCards(totalCards - targetTotal);
      }
    }

    localStorage.setItem('cachedUserInputs', JSON.stringify(cardsData));
  }

  /**
   * Remove empty cards from the DOM
   * @param {number} countToRemove - Number of empty cards to remove
   */
  function removeEmptyCards(countToRemove) {
    const allCards = document.querySelectorAll('#user-inputs > div');
    let removed = 0;

    // Remove from the end, only if cards are empty
    for (let i = allCards.length - 1; i >= 0 && removed < countToRemove; i--) {
      const card = allCards[i];
      const inputs = card.querySelectorAll('input.input-field');

      if (inputs.length >= 2) {
        const nameValue = inputs[0].value.trim();
        const routineValue = inputs[1].value.trim();

        // Only remove if completely empty
        if (!nameValue && !routineValue) {
          card.remove();
          userCount--;
          removed++;
        }
      }
    }
  }/**
   * Create a simple input field
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
    input.addEventListener('input', cacheUserInputs);
    return input;
  }  /**
   * Add user input cards to the DOM
   * @param {Array} prefillData - Optional array of objects with name and routine data
   */
  function addUserInputCards(prefillData) {
    const userInputsContainer = document.getElementById('user-inputs');

    // If prefillData is provided and has entries, add only those cards
    if (prefillData && prefillData.length) {
      prefillData.forEach(entry => {
        if (userCount >= MAX_USERS) return; // Safety check

        const color = userColors[userCount % userColors.length];
        const userCard = document.createElement('div');
        userCard.className = 'input-card rounded-lg';
        userCard.style.borderLeft = `4px solid ${color}`;        const inputRow = document.createElement('div');
        inputRow.className = 'input-row';

        // Create name row (name input)
        const nameRow = document.createElement('div');
        nameRow.className = 'name-row';

        // Create name input
        const nameInput = createInputField('Name', entry.name);

        // Create routine row (routine input)
        const routineRow = document.createElement('div');
        routineRow.className = 'routine-row';

        // Create routine input
        const routineInput = createInputField('Paste Routine ID Here', entry.routine);

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
        });        trashBtnContainer.appendChild(trashBtn);
        nameRow.appendChild(nameInput);
        routineRow.appendChild(routineInput);
        inputRow.appendChild(nameRow);
        inputRow.appendChild(routineRow);
        inputRow.appendChild(trashBtnContainer);
        userCard.appendChild(inputRow);
        userInputsContainer.appendChild(userCard);
        userCount++;
      });    } else if (userCount < MAX_USERS) {
      // Add one card per call (changed condition to be simpler)
      const color = userColors[userCount % userColors.length];
      const userCard = document.createElement('div');
      userCard.className = 'input-card rounded-lg';
      userCard.style.borderLeft = `4px solid ${color}`;

      const inputRow = document.createElement('div');
        inputRow.className = 'input-row';

        // Create name row (name input)
        const nameRow = document.createElement('div');
        nameRow.className = 'name-row';

        // Create name input
        const nameInput = createInputField('Name');

        // Create routine row (routine input)
        const routineRow = document.createElement('div');
        routineRow.className = 'routine-row';

        // Create routine input
        const routineInput = createInputField('Paste Routine ID Here');

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
        inputRow.appendChild(trashBtnContainer);        userCard.appendChild(inputRow);
        userInputsContainer.appendChild(userCard);
        userCount++;
    }

    // Update cache after adding new cards
    cacheUserInputs();
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
   * Initialize the UserInputManager
   */
  function init() {
    // Load cached input fields if available
    loadCachedUserInputs();

    // Ensure minimum number of fields based on device type
    if (isMobileDevice()) {
      // Mobile: Ensure at least 2 fields
      while (userCount < 2) {
        addUserInputCards();
      }
    } else {
      // Desktop: Ensure at least 4 fields for 2x2 grid
      while (userCount < 4) {
        addUserInputCards();
      }
    }    // Add event listener for "Add more users" button
    const addUserBtn = document.getElementById('add-user-btn');
    if (addUserBtn) {
      addUserBtn.addEventListener('click', () => {
        console.log('🔘 DEBUG: Add user button clicked, current userCount:', userCount);
        console.log('🔘 DEBUG: Is mobile device:', isMobileDevice());

        if (isMobileDevice()) {
          // Mobile: Add 1 user at a time
          console.log('🔘 DEBUG: Adding 1 user for mobile');
          addUserInputCards();
        } else {
          // Desktop: Add 2 users at a time to maintain even number
          console.log('🔘 DEBUG: Adding 2 users for desktop');
          addUserInputCards();
          addUserInputCards();
        }

        console.log('🔘 DEBUG: After adding, userCount:', userCount);
      });
    } else {
      console.error('❌ DEBUG: Add user button not found!');
    }

    startPeriodicCleanup();
  }

  /**
   * Periodic cleanup to maintain optimal field count
   * Runs every 30 seconds to clean up unused fields
   */
  function startPeriodicCleanup() {
    setInterval(() => {
      // Only run cleanup if there are input fields
      const allCards = document.querySelectorAll('#user-inputs > div');
      if (allCards.length > 0) {
        cacheUserInputs(); // This will trigger the smart field management
      }
    }, 30000); // Run every 30 seconds
  }

  /**
   * Check if the device is mobile
   * @returns {boolean} True if device is mobile
   */
  function isMobileDevice() {
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
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