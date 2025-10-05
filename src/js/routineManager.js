/**
 * RoutineManager
 *
 * Handles all functionality related to routine generation including:
 * - Processing user routine data
 * - Generating the combined routine
 * - Capturing screenshots of routines
 * - Fetching online routine data for IDs starting with '#'
 */
const RoutineManager = (() => {
  const timeSlots = [
    '8:00 AM<br>9:20 AM',
    '9:30 AM<br>10:50 AM',
    '11:00 AM<br>12:20 PM',
    '12:30 PM<br>1:50 PM',
    '2:00 PM<br>3:20 PM',
    '3:30 PM<br>4:50 PM',
    '5:00 PM<br>6:20 PM'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

  let cachedSlotBoundaries = null;

  async function processRoutineInput(input) {
    const trimmedInput = input.trim();

    if (trimmedInput.startsWith('#')) {
      if (!window.RoutineDecryptor) {
        throw new Error('RoutineDecryptor not loaded');
      }

      if (typeof window.RoutineDecryptor.processEncryptedRoutine !== 'function') {
        throw new Error('processEncryptedRoutine method not found');
      }

      try {
        return await window.RoutineDecryptor.processEncryptedRoutine(trimmedInput);
      } catch (error) {
        console.error('❌ DEBUG: Error processing encrypted routine:', error);
        throw new Error('Invalid routine format: ' + error.message);
      }
    }

    try {
      return JSON.parse(trimmedInput);
    } catch (error) {
      console.error('Invalid JSON routine format:', error);
      throw new Error('Invalid JSON routine format');
    }
  }

  function timeToMinutes(timeStr) {
    if (!timeStr) {
      return NaN;
    }

    const sanitized = timeStr.toString().trim().replace(/\u00a0/g, ' ');
    const timeRegex = /^(\d{1,2})(?::(\d{2}))?\s*([AP]M)$/i;
    const match = timeRegex.exec(sanitized);

    if (!match) {
      return NaN;
    }

    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2] ?? '0', 10);
    const period = match[3].toUpperCase();

    if (period === 'PM' && hours !== 12) {
      hours += 12;
    }

    if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    return hours * 60 + minutes;
  }

  function createEmptySchedule() {
    const schedule = {};
    for (const slot of timeSlots) {
      schedule[slot] = {};
      for (const day of daysOfWeek) {
        schedule[slot][day] = [];
      }
    }
    return schedule;
  }

  function parseSessionDetails(session) {
    if (!session) {
      return null;
    }

    const normalized = session.replace(/\u00a0/g, ' ').trim();
    const dayRegex = /^([A-Za-z]+)/;
    const sessionMatch = dayRegex.exec(normalized);
    if (!sessionMatch) {
      return null;
    }

    const timePattern = /(\d{1,2}:\d{2}\s*[AP]M)/gi;
    const times = normalized.match(timePattern);
    if (!times || times.length === 0) {
      return null;
    }

    const startTime = times[0];
    const endTime = times[1] ?? times[0];

    return {
      day: formatDay(sessionMatch[1]),
      startTime,
      endTime
    };
  }

  function getSlotBoundaries() {
    if (!cachedSlotBoundaries) {
      cachedSlotBoundaries = timeSlots
        .map(slot => {
          const [slotStartStr, slotEndStr] = slot.split('<br>').map(part => part.trim());
          const startMinutes = timeToMinutes(slotStartStr);
          const endMinutes = timeToMinutes(slotEndStr);

          if (Number.isNaN(startMinutes) || Number.isNaN(endMinutes)) {
            return null;
          }

          return {
            label: slot,
            startMinutes,
            endMinutes
          };
        })
        .filter(Boolean);
    }

    return cachedSlotBoundaries;
  }

  function resolvePalette(index) {
    return USER_COLOR_COMBOS[index % USER_COLOR_COMBOS.length];
  }

  function formatDay(dayStr) {
    const days = { SUN: 'Sun', MON: 'Mon', TUE: 'Tue', WED: 'Wed', THU: 'Thu', FRI: 'Fri', SAT: 'Sat' };
    return days[dayStr.toUpperCase().substring(0, 3)] || dayStr;
  }

  function processSession(schedule, parsedSession, sessionLabel, name, course, color, textColor) {
    if (!parsedSession) {
      console.warn('⚠️ Unable to parse session string:', sessionLabel);
      return;
    }

    const sStart = timeToMinutes(parsedSession.startTime);
    const sEnd = timeToMinutes(parsedSession.endTime);

    if (Number.isNaN(sStart) || Number.isNaN(sEnd)) {
      console.warn('⚠️ Ignoring session with invalid time range:', sessionLabel);
      return;
    }

    const { day } = parsedSession;

    for (const { label, startMinutes, endMinutes } of getSlotBoundaries()) {
      if (sStart <= endMinutes && sEnd >= startMinutes) {
        const isLabSession = course.Lab && course.Lab !== 'N/A' && course.Lab.includes(sessionLabel);
        const displayCourse = isLabSession && course.labCourseCode ? course.labCourseCode : course.Course;

        schedule[label][day].push({
          name,
          course: displayCourse,
          section: course.section.replace(/Section\s*/i, ''),
          faculty: course.faculty,
          color,
          textColor
        });
      }
    }
  }

  function addCourseSessionsToSchedule(schedule, course, name, color, textColor, parsedSessionCache) {
    for (const type of ['Class', 'Lab']) {
      const sessionValue = course[type];
      if (!sessionValue || sessionValue === 'N/A') {
        continue;
      }

      const rawSessions = sessionValue.split(', ');
      for (const rawSession of rawSessions) {
        const cacheKey = `${rawSession}`;
        if (!parsedSessionCache.has(cacheKey)) {
          parsedSessionCache.set(cacheKey, parseSessionDetails(rawSession));
        }

        processSession(
          schedule,
          parsedSessionCache.get(cacheKey),
          rawSession,
          name,
          course,
          color,
          textColor
        );
      }
    }
  }

  function buildScheduleFromRoutineData(schedule, name, routineData, palette) {
    const { background: color, text: textColor } = palette;
    const parsedSessionCache = new Map();
    for (const course of routineData) {
      addCourseSessionsToSchedule(schedule, course, name, color, textColor, parsedSessionCache);
    }
  }

  function renderScheduleTable(schedule, routineTableBody) {
    routineTableBody.innerHTML = '';

    const routineTable = routineTableBody.closest('table');
    if (routineTable) {
      routineTable.style.tableLayout = 'auto';
      routineTable.style.width = 'auto';
      routineTable.style.minWidth = '100%';
      routineTable.style.whiteSpace = 'nowrap';
    }

    for (const slot of timeSlots) {
      const rowElement = document.createElement('tr');
      const timeCell = document.createElement('td');
      timeCell.className = 'p-2 whitespace-nowrap text-center';
      timeCell.style.border = '1px solid var(--table-border)';
      timeCell.style.whiteSpace = 'nowrap';
      timeCell.style.minWidth = 'max-content';
      timeCell.innerHTML = slot;
      rowElement.appendChild(timeCell);

      for (const day of daysOfWeek) {
        const dayCell = document.createElement('td');
        dayCell.className = 'p-2 align-top text-center';
        dayCell.style.border = '1px solid var(--table-border)';
        dayCell.style.whiteSpace = 'nowrap';
        dayCell.style.minWidth = 'max-content';
        dayCell.style.overflow = 'visible';

        for (const entry of schedule[slot][day]) {
          const entryDiv = document.createElement('div');
          entryDiv.className = 'routine-entry';
          entryDiv.style.backgroundColor = entry.color;
          entryDiv.style.color = entry.textColor;
          entryDiv.style.whiteSpace = 'nowrap';
          entryDiv.style.overflow = 'visible';
          entryDiv.style.textOverflow = 'clip';
          entryDiv.style.minWidth = 'max-content';
          entryDiv.textContent = `${entry.name} - ${entry.course}[${entry.section}] - ${entry.faculty}`;
          dayCell.appendChild(entryDiv);
        }

        rowElement.appendChild(dayCell);
      }

      routineTableBody.appendChild(rowElement);
    }
  }

  /**
   * Generate the combined routine from user inputs
   */
  async function generateRoutine() {
    // Initialize schedule object
    const schedule = createEmptySchedule();

    const userCards = Array.from(document.querySelectorAll('#user-inputs > div'));
    const promises = [];
    for (let idx = 0; idx < userCards.length; idx += 1) {
      const card = userCards[idx];
      const inputs = card.querySelectorAll('input.input-field');
      const nameValue = inputs[0]?.value.trim();
      const routineValue = inputs[1]?.value.trim();

      if (!nameValue || !routineValue) {
        continue;
      }

      const palette = resolvePalette(idx);

      const promise = processRoutineInput(routineValue)
        .then(data => {
          buildScheduleFromRoutineData(schedule, nameValue, data, palette);
        })
        .catch(err => {
          console.error(`Error processing input for ${nameValue}:`, err);
          UIManager.showAlert(`Error processing routine for ${nameValue}: ${err.message}`);
        });

      promises.push(promise);
    }

    try {
      // Wait for all routine processing to complete
      await Promise.all(promises);

      // Generate routine table
      const routineTableBody = document.getElementById('routine-table-body');
      renderScheduleTable(schedule, routineTableBody);

      // Cache generated routine in localStorage
      localStorage.setItem('cachedRoutine', routineTableBody.innerHTML);
    } catch (error) {
      console.error('Error generating routine:', error);
      UIManager.showAlert('Error generating routine. Please check your inputs and try again.');
    }
  }

  async function refreshRenderedRoutineColors() {
    try {
      await generateRoutine();
    } catch (error) {
      console.error('Error refreshing routine colors:', error);
    }
  }

  /**
   * Get current theme information for screenshot
   * @returns {Object} Theme configuration object
   */
  function getCurrentThemeConfig() {
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
        textColor: '#000000',
        borderColor: '#ff69b4'
      }
    };

    return themeConfigs[currentTheme] || themeConfigs.dark;
  }

  /**
   * Capture screenshot of the routine using canvas approach
   */
  async function captureScreenshot() {
    try {
      // Check if there's a generated routine
      const routineTableBody = document.getElementById('routine-table-body');
      if (!routineTableBody || routineTableBody.children.length === 0) {
        UIManager.showAlert("Please add some user inputs first.");
        return;
      }

      // Check if CanvasScreenshotCapture is available
      if (typeof window.CanvasScreenshotCapture === 'undefined') {
        console.error('CanvasScreenshotCapture not loaded');
        UIManager.showAlert('Screenshot module not loaded. Please refresh the page.');
        return;
      }

      // Get current theme configuration
      const themeConfig = getCurrentThemeConfig();

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
      console.error('Screenshot capture failed:', error);
      UIManager.showAlert('Screenshot failed: ' + error.message, 'error');
    }
  }

  /**
   * Initialize event listeners for routine-related actions
   */
  function init() {
    if (!window.RoutineDecryptor || typeof window.RoutineDecryptor.processEncryptedRoutine !== 'function') {
      console.error('RoutineDecryptor not found during init. Encrypted routines may be unavailable.');
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
    }

    // Screenshot button - enhanced with routine regeneration
    const screenshotBtn = document.getElementById('screenshot-btn');
    if (screenshotBtn) {
      screenshotBtn.addEventListener('click', async () => {
        // Disable button and show spinner
        screenshotBtn.disabled = true;
        const screenshotSpinner = document.getElementById('screenshot-spinner');
        if (screenshotSpinner) screenshotSpinner.classList.remove('hidden');

        try {
          // Always regenerate routine first to ensure latest data
          UIManager.showAlert('Generating latest routine...', 'info');
          await generateRoutine();

          // Small delay to let the UI update
          await new Promise(resolve => setTimeout(resolve, 300));

          // Then capture screenshot
          await captureScreenshot();
        } catch (error) {
          console.error('Screenshot button error:', error);
          UIManager.showAlert('Screenshot failed: ' + error.message, 'error');
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
    processRoutineInput,
    refreshRenderedRoutineColors
  };
})();