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

  /**
   * Cache current user inputs to localStorage
   */
  function cacheUserInputs() {
    const cardsData = [];
    document.querySelectorAll('#user-inputs > div').forEach(card => {
      const inputs = card.querySelectorAll('input.input-field');
      if(inputs.length >= 2) {
        cardsData.push({
          name: inputs[0].value,
          routine: inputs[1].value
        });
      }
    });
    localStorage.setItem('cachedUserInputs', JSON.stringify(cardsData));
  }

  /**
   * Add user input cards to the DOM
   * @param {Array} prefillData - Optional array of objects with name and routine data
   */
  function addUserInputCards(prefillData) {
    const userInputsContainer = document.getElementById('user-inputs');
    const remaining = MAX_USERS - userCount;

    // If prefillData is provided and has entries, add only those cards
    if (prefillData && prefillData.length) {
      prefillData.forEach(entry => {
        const color = userColors[userCount % userColors.length];
        const userCard = document.createElement('div');
        userCard.className = 'input-card rounded-lg';
        userCard.style.borderLeft = `4px solid ${color}`;

        const inputRow = document.createElement('div');
        inputRow.className = 'input-row';

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'input-field';
        nameInput.placeholder = 'Name';
        nameInput.style.flex = '1';
        nameInput.style.lineHeight = '1.25';
        nameInput.value = entry.name;
        nameInput.addEventListener('input', cacheUserInputs);

        const routineInput = document.createElement('input');
        routineInput.type = 'text';
        routineInput.className = 'input-field';
        routineInput.placeholder = 'Paste Routine ID Here';
        routineInput.style.flex = '1';
        routineInput.style.lineHeight = '1.25';
        routineInput.value = entry.routine;
        routineInput.addEventListener('input', cacheUserInputs);

        inputRow.appendChild(nameInput);
        inputRow.appendChild(routineInput);
        userCard.appendChild(inputRow);
        userInputsContainer.appendChild(userCard);
        userCount++;
      });
    } else {
      // Otherwise, add default cards—2 per call (or 1 if only one left)
      const cardsToAdd = remaining >= 2 ? 2 : 1;
      for (let i = 0; i < cardsToAdd; i++) {
        const color = userColors[userCount % userColors.length];
        const userCard = document.createElement('div');
        userCard.className = 'input-card rounded-lg';
        userCard.style.borderLeft = `4px solid ${color}`;

        const inputRow = document.createElement('div');
        inputRow.className = 'input-row';

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'input-field';
        nameInput.placeholder = 'Name';
        nameInput.style.flex = '1';
        nameInput.style.lineHeight = '1.25';
        nameInput.addEventListener('input', cacheUserInputs);

        const routineInput = document.createElement('input');
        routineInput.type = 'text';
        routineInput.className = 'input-field';
        routineInput.placeholder = 'Paste Routine ID Here';
        routineInput.style.flex = '1';
        routineInput.style.lineHeight = '1.25';
        routineInput.addEventListener('input', cacheUserInputs);

        inputRow.appendChild(nameInput);
        inputRow.appendChild(routineInput);
        userCard.appendChild(inputRow);
        userInputsContainer.appendChild(userCard);
        userCount++;
      }
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
  }

  /**
   * Initialize the UserInputManager
   */
  function init() {
    // Load cached input fields if available; otherwise, add default cards
    loadCachedUserInputs();
    if (userCount === 0) {
      if (isMobileDevice()) {
        addUserInputCards();
      } else {
        addUserInputCards();
        addUserInputCards();
      }
    }

    // Add event listener for "Add more users" button
    const addUserBtn = document.getElementById('add-user-btn');
    if (addUserBtn) {
      addUserBtn.addEventListener('click', () => { addUserInputCards(); });
    }
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