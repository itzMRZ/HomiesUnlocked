/**
 * RoutineManager
 *
 * Handles all functionality related to routine generation including:
 * - Processing user routine data
 * - Generating the combined routine
 * - Capturing screenshots of routines
 * - Fetching online routine data for IDs starting with '#'
 */
const RoutineManager = (() => {  // Constants
  const timeSlots = [
    '8:00 AM<br>9:20 AM', '9:30 AM<br>10:50 AM',
    '11:00 AM<br>12:20 PM', '12:30 PM<br>1:50 PM',
    '2:00 PM<br>3:20 PM', '3:30 PM<br>4:50 PM',
    '5:00 PM<br>6:20 PM'  ];

  /**
   * Process routine input (either JSON or online ID)
   * @param {string} input - Either JSON string or online ID starting with #
   * @returns {Promise<Array>} Promise resolving to routine data
   */  async function processRoutineInput(input) {
    const trimmedInput = input.trim();

    if (trimmedInput.startsWith('#')) {
      // Encrypted mode - use new decryptor
      console.log('🔍 DEBUG: RoutineDecryptor object:', window.RoutineDecryptor);
      console.log('🔍 DEBUG: RoutineDecryptor type:', typeof window.RoutineDecryptor);

      if (!window.RoutineDecryptor) {
        throw new Error('RoutineDecryptor not loaded');
      }

      if (typeof window.RoutineDecryptor.processEncryptedRoutine !== 'function') {
        console.log('🔍 DEBUG: Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(window.RoutineDecryptor)));
        throw new Error('processEncryptedRoutine method not found');
      }

      try {
        return await window.RoutineDecryptor.processEncryptedRoutine(trimmedInput);
      } catch (error) {
        console.error('❌ DEBUG: Error processing encrypted routine:', error);
        throw new Error('Invalid routine format: ' + error.message);
      }
    } else {
      // JSON mode - parse directly
      return JSON.parse(trimmedInput);
    }
  }

  /**
   * Convert time string to minutes for easier comparison
   * @param {string} timeStr - The time string to convert (e.g., "9:30 AM")
   * @returns {number} Total minutes
   */
  function timeToMinutes(timeStr) {
    timeStr = timeStr.trim().replace(/([AP]M)/i, ' $1').replace(/\s+/g, ' ').toUpperCase();
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let total = hours * 60 + (minutes || 0);
    if (period === 'PM' && hours !== 12) total += 12 * 60;
    if (period === 'AM' && hours === 12) total -= 12 * 60;
    return total;
  }

  /**
   * Determine text color based on background color contrast
   * @param {string} hex - Hex color code
   * @returns {string} "black" or "white" depending on contrast
   */
  function getTextColor(hex) {
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.5 ? 'black' : 'white';
  }

  /**
   * Format day string to standard format
   * @param {string} dayStr - Day string to format
   * @returns {string} Formatted day string
   */
  function formatDay(dayStr) {
    const days = { SUN: 'Sun', MON: 'Mon', TUE: 'Tue', WED: 'Wed', THU: 'Thu', FRI: 'Fri', SAT: 'Sat' };
    return days[dayStr.toUpperCase().substring(0, 3)] || dayStr;
  }

  /**
   * Process a single session and add it to the schedule
   * @param {Object} schedule - The schedule object to update
   * @param {string} session - Session string (e.g., "MON (9:30 AM-10:50 AM)")
   * @param {string} name - User name
   * @param {Object} course - Course information
   * @param {string} color - Color for this user
   */
  function processSession(schedule, session, name, course, color) {
    const [dayPart, timePart] = session.split(' (');
    const day = formatDay(dayPart.trim());
    const rawTime = timePart.replace(')', '').replace(/([AP]M)/gi, ' $1').trim();
    const [startTime, endTime] = rawTime.split('-').map(t => t.trim());
    const sStart = timeToMinutes(startTime);
    const sEnd = timeToMinutes(endTime);    timeSlots.forEach(slot => {
      const [slotStartStr, slotEndStr] = slot.replace('<br>', '-').split('-');
      const slotStart = timeToMinutes(slotStartStr.trim());
      const slotEnd = timeToMinutes(slotEndStr.trim());      if (sStart <= slotEnd && sEnd >= slotStart) {
        // Determine if this is a lab session based on the course object
        const isLabSession = course.Lab && course.Lab !== 'N/A' && course.Lab.includes(session);
        const displayCourse = isLabSession && course.labCourseCode ? course.labCourseCode : course.Course;

        schedule[slot][day].push({
          name,
          course: displayCourse,
          section: course.section.replace(/Section\s*/i, ''),
          faculty: course.faculty,
          color,
          textColor: getTextColor(color)
        });
      }
    });
  }

  /**
   * Generate the combined routine from user inputs
   */
  async function generateRoutine() {
    const userColors = [
      '#8e44ad', '#27ae60', '#2980b9', '#d35400', '#c0392b',
      '#f39c12', '#16a085', '#2c3e50', '#7f8c8d', '#e74c3c', '#3498db'
    ];

    // Initialize schedule object
    const schedule = {};
    timeSlots.forEach(slot => {
      schedule[slot] = { Sun: [], Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [] };
    });

    // Process each user's routine data
    const userCards = document.querySelectorAll('#user-inputs > div');
    const promises = [];

    userCards.forEach((card, idx) => {
      const inputs = card.querySelectorAll('input.input-field');
      const nameInput = inputs[0];
      const jsonInput = inputs[1];
      const color = userColors[idx % userColors.length];

      if (!nameInput.value.trim() || !jsonInput.value.trim()) return;

      const promise = processRoutineInput(jsonInput.value.trim())
        .then(data => {
          data.forEach(course => {
            ['Class', 'Lab'].forEach(type => {
              if (course[type] && course[type] !== 'N/A') {
                course[type].split(', ').forEach(session => {
                  processSession(schedule, session, nameInput.value.trim(), course, color);
                });
              }
            });
          });
        })
        .catch(err => {
          console.error(`Error processing input for ${nameInput.value.trim()}:`, err);
          UIManager.showAlert(`Error processing routine for ${nameInput.value.trim()}: ${err.message}`);
        });

      promises.push(promise);
    });

    try {
      // Wait for all routine processing to complete
      await Promise.all(promises);

      // Generate routine table
      const routineTableBody = document.getElementById('routine-table-body');
      routineTableBody.innerHTML = '';

      // Ensure the parent table has proper no-wrap styling
      const routineTable = routineTableBody.closest('table');
      if (routineTable) {
        routineTable.style.tableLayout = 'auto';
        routineTable.style.width = 'auto';
        routineTable.style.minWidth = '100%';
        routineTable.style.whiteSpace = 'nowrap';
      }

      timeSlots.forEach(slot => {
        const tr = document.createElement('tr');        const timeTd = document.createElement('td');
        timeTd.className = 'p-2 whitespace-nowrap text-center';
        timeTd.style.border = '1px solid var(--table-border)';
        timeTd.style.whiteSpace = 'nowrap';
        timeTd.style.minWidth = 'max-content';
        timeTd.innerHTML = slot;
        tr.appendChild(timeTd);

        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
          const td = document.createElement('td');
          td.className = 'p-2 align-top text-center';
          td.style.border = '1px solid var(--table-border)';
          td.style.whiteSpace = 'nowrap';
          td.style.minWidth = 'max-content';
          td.style.overflow = 'visible';

          schedule[slot][day].forEach(entry => {
            const div = document.createElement('div');
            div.className = 'routine-entry';
            div.style.backgroundColor = entry.color;
            div.style.color = entry.textColor;
            div.style.whiteSpace = 'nowrap';
            div.style.overflow = 'visible';
            div.style.textOverflow = 'clip';
            div.style.minWidth = 'max-content';
            div.textContent = `${entry.name} - ${entry.course}[${entry.section}] - ${entry.faculty}`;
            td.appendChild(div);
          });

          tr.appendChild(td);
        });

        routineTableBody.appendChild(tr);
      });

      // Cache generated routine in localStorage
      localStorage.setItem('cachedRoutine', routineTableBody.innerHTML);
    } catch (error) {
      console.error('Error generating routine:', error);
      UIManager.showAlert('Error generating routine. Please check your inputs and try again.');
    }
  }  /**
   * Get current theme information for screenshot
   * @returns {Object} Theme configuration object
   */  function getCurrentThemeConfig() {
    const currentTheme = document.body.getAttribute('data-theme') || 'dark';

    // Theme-specific configurations
    const themeConfigs = {
      dark: {
        name: 'dark',
        backgroundColor: '#34495e', // --routine-bg for dark theme
        textColor: '#e2e8f0',
        borderColor: '#4a5568'
      },
      light: {
        name: 'light',
        backgroundColor: '#ffffff', // --routine-bg for light theme
        textColor: '#333333',
        borderColor: '#cccccc'
      },
      pink: {
        name: 'pink',
        backgroundColor: '#ffe6f2', // --routine-bg for pink theme
        textColor: '#330033',
        borderColor: '#ff69b4'
      }
    };

    return themeConfigs[currentTheme] || themeConfigs.dark;
  }
  function needsRoutineRegeneration() {
    const userCards = document.querySelectorAll('#user-inputs > div');
    const cachedRoutine = localStorage.getItem('cachedRoutine');
    const currentTableBody = document.getElementById('routine-table-body');

    // If no table exists, we need generation
    if (!currentTableBody || currentTableBody.children.length === 0) {
      return true;
    }

    // Check if there are new user inputs since last generation
    let hasValidInputs = false;
    userCards.forEach(card => {
      const inputs = card.querySelectorAll('input.input-field');
      const nameInput = inputs[0];
      const jsonInput = inputs[1];

      if (nameInput.value.trim() && jsonInput.value.trim()) {
        hasValidInputs = true;
      }
    });

    // If no valid inputs, no need to regenerate
    if (!hasValidInputs) {
      return false;
    }
      // Check if cached routine matches current table
    return cachedRoutine !== currentTableBody.innerHTML;
  }

  /**
   * Capture screenshot of the routine using canvas approach
   */
  async function captureScreenshot() {
    try {
      // Check if routine needs regeneration first
      if (needsRoutineRegeneration()) {
        console.log('🔄 DEBUG: Routine needs regeneration, generating first...');
        UIManager.showAlert('Generating latest routine...', 'info');
        await generateRoutine();
        // Small delay to let the UI update
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Check if there's a generated routine
      const routineTableBody = document.getElementById('routine-table-body');
      if (!routineTableBody || routineTableBody.children.length === 0) {
        UIManager.showAlert("Please add some user inputs first.");
        return;
      }

      // Check if CanvasScreenshotCapture is available
      if (typeof window.CanvasScreenshotCapture === 'undefined') {
        console.error('❌ DEBUG: CanvasScreenshotCapture not loaded');
        UIManager.showAlert('Screenshot module not loaded. Please refresh the page.');
        return;
      }      console.log('🎯 DEBUG: Starting screenshot capture...');

      // Get current theme configuration
      const themeConfig = getCurrentThemeConfig();
      console.log('🎨 DEBUG: Using theme config:', themeConfig);

      // Create canvas screenshot capture instance
      const screenshotCapture = new window.CanvasScreenshotCapture();

      // Add timeout protection to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Screenshot generation timed out after 30 seconds')), 30000);
      });

      // Create exact replica of the table on canvas with timeout and theme
      const imageDataUrl = await Promise.race([
        screenshotCapture.createTableFromScratch(themeConfig),
        timeoutPromise
      ]);

      console.log('✅ DEBUG: Screenshot created successfully');

      // Create download link
      const link = document.createElement('a');
      link.href = imageDataUrl;
      link.download = `HomiesUnlocked_Routine_${new Date().toISOString().slice(0, 10)}.png`;

      // Temporarily add to DOM, click, then remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      UIManager.showAlert('Screenshot saved successfully!', 'success');

    } catch (error) {
      console.error('❌ DEBUG: Error capturing exact table screenshot:', error);
      console.error('❌ DEBUG: Error stack:', error.stack);
      UIManager.showAlert('Screenshot failed: ' + error.message, 'error');
    }
  }/**
   * Initialize event listeners for routine-related actions
   */
  function init() {
    // Check if RoutineDecryptor is available
    console.log('🔍 RoutineManager init - RoutineDecryptor available:', !!window.RoutineDecryptor);
    console.log('🔍 RoutineManager init - RoutineDecryptor type:', typeof window.RoutineDecryptor);
    if (window.RoutineDecryptor) {
      console.log('🔍 RoutineDecryptor methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(window.RoutineDecryptor)));
      console.log('🔍 processEncryptedRoutine exists:', typeof window.RoutineDecryptor.processEncryptedRoutine);
    } else {
      console.error('❌ RoutineDecryptor not found during init!');
    }

    // Generate routine button
    const generateBtn = document.getElementById('generate-btn');
    if (generateBtn) {
      generateBtn.addEventListener('click', async () => {
        generateBtn.disabled = true;
        const generateIcon = document.getElementById('generate-icon');
        if (generateIcon) generateIcon.classList.add('animate-spin');

        try {
          await generateRoutine();
        } finally {
          if (generateIcon) generateIcon.classList.remove('animate-spin');
          generateBtn.disabled = false;
        }
      });
    }    // Screenshot button - fixed event handling
    const screenshotBtn = document.getElementById('screenshot-btn');
    if (screenshotBtn) {
      screenshotBtn.addEventListener('click', async () => {
        const routineTableBody = document.getElementById('routine-table-body');
        if (!routineTableBody || routineTableBody.children.length === 0) {
          UIManager.showAlert("Please click 'Generate Routine' first.");
          return;
        }

        // Disable button and show spinner
        screenshotBtn.disabled = true;
        const screenshotSpinner = document.getElementById('screenshot-spinner');
        if (screenshotSpinner) screenshotSpinner.classList.remove('hidden');

        try {
          await captureScreenshot();
        } catch (error) {
          console.error('❌ DEBUG: Screenshot button error:', error);
        } finally {
          // Re-enable button and hide spinner after delay
          setTimeout(() => {
            if (screenshotSpinner) screenshotSpinner.classList.add('hidden');
            screenshotBtn.disabled = false;
          }, 1500);
        }
      });
    } else {
      console.error('❌ DEBUG: Screenshot button not found in DOM');
    }

    // Get Routine ID button
    const getIdBtn = document.getElementById('get-id-btn');
    if (getIdBtn) {
      getIdBtn.addEventListener('click', () => {
        window.location.href = 'https://routine-id.itzmrz.xyz/';
      });
    }
  }
  // Public API
  return {
    init,
    generateRoutine,
    captureScreenshot,
    processRoutineInput
  };
})();