/**
 * RoutineManager
 *
 * Handles all functionality related to routine generation including:
 * - Processing user routine data
 * - Generating the combined routine
 * - Capturing screenshots of routines
 */
const RoutineManager = (() => {
  // Constants
  const timeSlots = [
    '8:00 AM-9:20 AM', '9:30 AM-10:50 AM',
    '11:00 AM-12:20 PM', '12:30 PM-1:50 PM',
    '2:00 PM-3:20 PM', '3:30 PM-4:50 PM',
    '5:00 PM-6:20 PM'
  ];

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
    const sEnd = timeToMinutes(endTime);

    timeSlots.forEach(slot => {
      const [slotStartStr, slotEndStr] = slot.split('-');
      const slotStart = timeToMinutes(slotStartStr.trim());
      const slotEnd = timeToMinutes(slotEndStr.trim());

      if (sStart <= slotEnd && sEnd >= slotStart) {
        schedule[slot][day].push({
          name,
          course: course.Course,
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
  function generateRoutine() {
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
    document.querySelectorAll('#user-inputs > div').forEach((card, idx) => {
      const inputs = card.querySelectorAll('input.input-field');
      const nameInput = inputs[0];
      const jsonInput = inputs[1];
      const color = userColors[idx % userColors.length];

      if (!nameInput.value.trim() || !jsonInput.value.trim()) return;

      try {
        const data = JSON.parse(jsonInput.value.trim());
        data.forEach(course => {
          ['Class', 'Lab'].forEach(type => {
            if (course[type] && course[type] !== 'N/A') {
              course[type].split(', ').forEach(session => {
                processSession(schedule, session, nameInput.value.trim(), course, color);
              });
            }
          });
        });
      } catch (err) {
        console.error('Error processing input:', err);
      }
    });

    // Generate routine table
    const routineTableBody = document.getElementById('routine-table-body');
    routineTableBody.innerHTML = '';

    timeSlots.forEach(slot => {
      const tr = document.createElement('tr');

      const timeTd = document.createElement('td');
      timeTd.className = 'p-2 whitespace-nowrap text-center';
      timeTd.style.border = '1px solid var(--table-border)';
      timeTd.textContent = slot;
      tr.appendChild(timeTd);

      ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
        const td = document.createElement('td');
        td.className = 'p-2 align-top text-center';
        td.style.border = '1px solid var(--table-border)';

        schedule[slot][day].forEach(entry => {
          const div = document.createElement('div');
          div.className = 'routine-entry';
          div.style.backgroundColor = entry.color;
          div.style.color = entry.textColor;
          div.textContent = `${entry.name} - ${entry.course}[${entry.section}] - ${entry.faculty}`;
          td.appendChild(div);
        });

        tr.appendChild(td);
      });

      routineTableBody.appendChild(tr);
    });

    // Cache generated routine in localStorage
    localStorage.setItem('cachedRoutine', routineTableBody.innerHTML);
  }

  /**
   * Capture screenshot of the routine
   */
  function captureScreenshot() {
    // Add screenshot mode class to the routine
    const routineCard = document.getElementById('combined-routine');
    routineCard.classList.add('screenshot-mode');

    // Use html2canvas to capture the screenshot
    html2canvas(routineCard, { scale: 1 }).then(canvas => {
      // Convert canvas to image data and download
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = 'HomiesUnlocked_Routine.png';
      link.click();

      // Remove the screenshot mode class
      setTimeout(() => {
        routineCard.classList.remove('screenshot-mode');
      }, 500);
    }).catch(err => {
      console.error('Error capturing screenshot:', err);
      routineCard.classList.remove('screenshot-mode');
    });
  }

  /**
   * Initialize event listeners for routine-related actions
   */
  function init() {
    // Generate routine button
    const generateBtn = document.getElementById('generate-btn');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => {
        generateBtn.disabled = true;
        const generateIcon = document.getElementById('generate-icon');
        if (generateIcon) generateIcon.classList.add('animate-spin');

        setTimeout(() => {
          generateRoutine();
          if (generateIcon) generateIcon.classList.remove('animate-spin');
          generateBtn.disabled = false;
        }, 500);
      });
    }

    // Screenshot button
    const screenshotBtn = document.getElementById('screenshot-btn');
    if (screenshotBtn) {
      screenshotBtn.addEventListener('click', () => {
        const routineTableBody = document.getElementById('routine-table-body');
        if (routineTableBody.children.length === 0) {
          UIManager.showAlert("Please click 'Generate Routine' first.");
          return;
        }

        screenshotBtn.disabled = true;
        const screenshotSpinner = document.getElementById('screenshot-spinner');
        if (screenshotSpinner) screenshotSpinner.classList.remove('hidden');

        captureScreenshot();

        setTimeout(() => {
          if (screenshotSpinner) screenshotSpinner.classList.add('hidden');
          screenshotBtn.disabled = false;
        }, 1500);
      });
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
    captureScreenshot
  };
})();