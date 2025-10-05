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
  const USER_COLOR_COMBOS = window.USER_COLOR_COMBOS ?? [
    { background: '#FF6B6B', accent: '#E63946', text: '#FFFFFF' },
    { background: '#FFA94D', accent: '#F3722C', text: '#FFFFFF' },
    { background: '#FFD93D', accent: '#F4B400', text: '#FFFFFF' },
    { background: '#6EE7B7', accent: '#34D399', text: '#FFFFFF' },
    { background: '#3DCCC7', accent: '#119DA4', text: '#FFFFFF' },
    { background: '#4EA8DE', accent: '#1D4ED8', text: '#FFFFFF' },
    { background: '#9D79BC', accent: '#6C4AB6', text: '#FFFFFF' },
    { background: '#CBAACB', accent: '#9F7E9F', text: '#FFFFFF' },
    { background: '#F28482', accent: '#E05658', text: '#FFFFFF' },
    { background: '#81B29A', accent: '#467864', text: '#FFFFFF' }
  ];

  window.USER_COLOR_COMBOS = USER_COLOR_COMBOS;

  function resolvePalette(index) {
    return USER_COLOR_COMBOS[index % USER_COLOR_COMBOS.length];
  }

  function refreshCardColors() {
    const userInputsContainer = document.getElementById('user-inputs');
    if (!userInputsContainer) {
      return;
    }

    const cards = Array.from(userInputsContainer.querySelectorAll('.input-card'));
    cards.forEach((card, index) => {
      const { background, accent } = resolvePalette(index);
      const accentColor = accent ?? background;
      card.style.borderLeft = `4px solid ${accentColor}`;
      card.dataset.userColor = background;
    });
  }

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

        if (!userInputsContainer) {
          console.warn('UserInputs container not found during caching');
          return;
        }

        const allCards = Array.from(userInputsContainer.children);

        for (const card of allCards) {
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
  }

  /**
   * Sync the userCount variable with the current number of cards in the DOM
   * @returns {number} The number of input cards currently rendered
   */
  function syncUserCountFromDom() {
    const userInputsContainer = document.getElementById('user-inputs');
    userCount = userInputsContainer
      ? userInputsContainer.querySelectorAll('.input-card').length
      : 0;
    return userCount;
  }

  /**
   * Find an existing empty card (both fields blank)
   * @returns {HTMLElement|null} Empty card element if available
   */
  function findEmptyCard() {
    const userInputsContainer = document.getElementById('user-inputs');
    if (!userInputsContainer) {
      return null;
    }

    return Array.from(userInputsContainer.querySelectorAll('.input-card')).find(card => {
      const inputs = card.querySelectorAll('input.input-field');
      if (inputs.length < 2) {
        return false;
      }

      const nameValue = inputs[0].value.trim();
      const routineValue = inputs[1].value.trim();
      return !nameValue && !routineValue;
    }) || null;
  }

  /**
   * Populate an available empty card or create a new one for the given entry
   * @param {Object} entry - Prefilled data (name and routine)
   */
  function populateCardWithEntry(entry = {}) {
    if (userCount >= MAX_USERS) {
      return;
    }

    const emptyCard = findEmptyCard();
    const nameValue = entry?.name ?? '';
    const routineValue = entry?.routine ?? '';

    if (emptyCard) {
      const inputs = emptyCard.querySelectorAll('input.input-field');
      if (inputs.length >= 2) {
        inputs[0].value = nameValue;
        inputs[1].value = routineValue;
      }
      return;
    }

    createSingleCard(nameValue, routineValue);
  }

  /**
   * Ensure at least one card exists (used as safeguard when no data present)
   */
  function ensureAtLeastOneCardExists() {
    const userInputsContainer = document.getElementById('user-inputs');
    if (!userInputsContainer) {
      return;
    }

    const existingCards = userInputsContainer.querySelectorAll('.input-card').length;
    if (existingCards === 0 && userCount < MAX_USERS) {
      createSingleCard('', '');
    }
  }

  /**
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
    syncUserCountFromDom();

    if (Array.isArray(prefillData) && prefillData.length) {
      prefillData.forEach(entry => {
        populateCardWithEntry(entry);
      });
    } else {
      ensureAtLeastOneCardExists();
    }

    // Refresh the userCount to reflect the current DOM state
    syncUserCountFromDom();

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

  const { background, accent } = resolvePalette(userCount);
  const accentColor = accent ?? background;

    const userCard = document.createElement('div');
    userCard.className = 'input-card rounded-lg';
  userCard.style.borderLeft = `4px solid ${accentColor}`;
  userCard.dataset.userColor = background;

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
  }

  /**
   * Ensure the interface always displays at least a minimum number of cards.
   * @param {number} minCount - Minimum total card count to maintain.
   */
  function ensureMinimumCardCount(minCount = 2) {
    const userInputsContainer = document.getElementById('user-inputs');
    if (!userInputsContainer) {
      return;
    }

    let currentCount = syncUserCountFromDom();
    const targetCount = Math.min(minCount, MAX_USERS);

    while (currentCount < targetCount) {
      createSingleCard('', '');
      currentCount += 1;
    }

    syncUserCountFromDom();
  }

  /**
   * Ensure a minimum number of empty cards remain available for new inputs.
   * @param {number} minEmpty - Minimum empty card count to maintain.
   */
  function ensureMinimumEmptyCards(minEmpty = 2) {
    const userInputsContainer = document.getElementById('user-inputs');
    if (!userInputsContainer) {
      return;
    }

    const cards = Array.from(userInputsContainer.querySelectorAll('.input-card'));
    let emptyCardCount = 0;

    for (const card of cards) {
      const inputs = card.querySelectorAll('input.input-field');
      if (inputs.length >= 2) {
        const nameValue = inputs[0].value.trim();
        const routineValue = inputs[1].value.trim();
        if (!nameValue && !routineValue) {
          emptyCardCount += 1;
        }
      }
    }

    let totalCards = cards.length;

    while (emptyCardCount < minEmpty && totalCards < MAX_USERS) {
      createSingleCard('', '');
      emptyCardCount += 1;
      totalCards += 1;
    }

    syncUserCountFromDom();
  }

  /**
   * Clear potentially corrupted localStorage data
   */
  function clearStorageConflicts() {
    try {
      const cachedInputs = localStorage.getItem('cachedUserInputs');
      if (!cachedInputs) {
        return;
      }

      const parsed = JSON.parse(cachedInputs);
      if (!Array.isArray(parsed)) {
        console.warn('🗑️ Clearing corrupted cachedUserInputs');
        localStorage.removeItem('cachedUserInputs');
      }
    } catch (error) {
      console.warn('🗑️ Clearing corrupted localStorage data', error);
      localStorage.removeItem('cachedUserInputs');
      localStorage.removeItem('cachedRoutine');
    }
  }

  /**
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

  // Ensure baseline empty cards are rendered immediately
  ensureMinimumCardCount(2);

  // Load cached input fields if available (fills existing cards first)
  loadCachedUserInputs();

  // Recalculate userCount based on actual cards in DOM
    syncUserCountFromDom();

    // Ensure exactly two empty fields are available on initial load
    ensureMinimumEmptyCards(2);

  // Final sync and cache update after automatic adjustments
  syncUserCountFromDom();
  cacheUserInputs();

    // Add event listener for "Add more users" button
    const addUserBtn = document.getElementById('add-user-btn');
    if (addUserBtn) {
      addUserBtn.addEventListener('click', () => {
        const isMobile = isMobileDevice();
        if (isMobile) {
          // Mobile: Add 1 user at a time
          createSingleCard('', '');
        } else {
          // Desktop: Add 2 users at a time to maintain even number
          if (userCount < MAX_USERS) {
            createSingleCard('', '');
          }
          if (userCount < MAX_USERS) {
            createSingleCard('', '');
          }
        }

        // After adding new cards keep cache and counters in sync
        syncUserCountFromDom();
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
    isMobileDevice,
    refreshCardColors
  };
})();