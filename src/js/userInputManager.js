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
  }  /**
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
      });    } else if (remaining > 0) {
      // Add one card per call
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
  }
  /**
   * Initialize the UserInputManager
   */
  function init() {
    // Load cached input fields if available; otherwise, add default cards
    loadCachedUserInputs();
    if (userCount === 0) {
      if (isMobileDevice()) {
        // Mobile: Add 2 users initially
        addUserInputCards();
        addUserInputCards();
      } else {
        // Desktop: Add 4 users initially for 2x2 grid
        addUserInputCards();
        addUserInputCards();
        addUserInputCards();
        addUserInputCards();
      }
    }

    // Add event listener for "Add more users" button
    const addUserBtn = document.getElementById('add-user-btn');
    if (addUserBtn) {
      addUserBtn.addEventListener('click', () => {
        // Add 2 users at a time to maintain grid pattern
        addUserInputCards();
        addUserInputCards();
      });
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