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
  // Constants
  const timeSlots = [
    '8:00 AM-9:20 AM', '9:30 AM-10:50 AM',
    '11:00 AM-12:20 PM', '12:30 PM-1:50 PM',
    '2:00 PM-3:20 PM', '3:30 PM-4:50 PM',
    '5:00 PM-6:20 PM'
  ];

  // API endpoint for online routine data
  const ONLINE_API_URL = 'https://usis-cdn.eniamza.com/connect.json';

  /**
   * Convert time from 24-hour format to 12-hour format with AM/PM
   * @param {string} time24 - Time in 24-hour format (e.g., "14:00:00")
   * @returns {string} Time in 12-hour format (e.g., "2:00 PM")
   */
  function convertTo12Hour(time24) {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  /**
   * Convert day name from API format to display format
   * @param {string} apiDay - Day in API format (e.g., "WEDNESDAY")
   * @returns {string} Day in display format (e.g., "WED")
   */
  function convertDayFormat(apiDay) {
    const dayMap = {
      'SUNDAY': 'SUN',
      'MONDAY': 'MON',
      'TUESDAY': 'TUE',
      'WEDNESDAY': 'WED',
      'THURSDAY': 'THU',
      'FRIDAY': 'FRI',
      'SATURDAY': 'SAT'
    };
    return dayMap[apiDay] || apiDay;
  }

  /**
   * Convert online API data to the existing routine format
   * @param {Array} apiData - Array of course data from the API
   * @returns {Array} Converted data in the existing format
   */
  function convertApiDataToRoutineFormat(apiData) {
    console.log('🔄 DEBUG: Converting API data to routine format');
    
    return apiData.map(course => {
      const schedules = course.sectionSchedule?.classSchedules || [];

      // Convert class schedules to the expected format
      const classScheduleStrings = schedules.map(schedule => {
        const startTime = convertTo12Hour(schedule.startTime);
        const endTime = convertTo12Hour(schedule.endTime);
        const day = convertDayFormat(schedule.day);
        const room = course.roomName || 'TBA';
        return `${day} (${startTime}-${endTime}-${room})`;
      });

      // Handle lab schedules if they exist
      let labScheduleStrings = [];
      let labCourseCode = null;
      
      if (course.labSchedules && course.labSchedules.length > 0) {
        console.log('🧪 DEBUG: Processing lab schedules for course:', course.courseCode);

        // Generate lab course code by adding 'L' to the main course code
        labCourseCode = `${course.courseCode}L`;
        console.log('🧪 DEBUG: Generated lab course code:', labCourseCode);

        labScheduleStrings = course.labSchedules.map(schedule => {
          const startTime = convertTo12Hour(schedule.startTime);
          const endTime = convertTo12Hour(schedule.endTime);
          const day = convertDayFormat(schedule.day);
          const room = course.labRoomName || 'TBA';
          return `${day} (${startTime}-${endTime}-${room})`;
        });

        console.log('🧪 DEBUG: Lab schedule strings:', labScheduleStrings);
      }

      return {
        Course: course.courseCode,
        section: `Section ${course.sectionName}`,
        faculty: course.faculties || 'TBA',
        Class: classScheduleStrings.length > 0 ? classScheduleStrings.join(', ') : 'N/A',
        Lab: labScheduleStrings.length > 0 ? labScheduleStrings.join(', ') : 'N/A',
        // Store lab course code for later use
        labCourseCode: labCourseCode,
        hasLab: labScheduleStrings.length > 0
      };
    });
  }

  /**
   * Fetch routine data from online API for routine IDs starting with #
   * @param {string} routineId - Routine ID starting with # (using BASE69 format)
   * @returns {Promise<Array>} Promise resolving to routine data
   */
  async function fetchOnlineRoutineData(routineId) {
    console.log('🔍 DEBUG: Starting fetchOnlineRoutineData with routineId:', routineId);

    try {
      console.log('📡 DEBUG: Fetching USIS API data...');
      const response = await fetch(ONLINE_API_URL);

      console.log('📡 DEBUG: USIS API response status:', response.status);
      console.log('📡 DEBUG: USIS API response ok:', response.ok);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const allSections = await response.json();
      console.log('📊 DEBUG: Total sections fetched from USIS:', allSections.length);
      console.log('📊 DEBUG: First section sample:', allSections[0]);

      // Import and use BASE69 compressor
      let targetSectionIds = [];

      if (routineId.startsWith('#')) {
        console.log('🔓 DEBUG: Processing routine ID with BASE69:', routineId);
        try {
          // Use the existing compressor from utils
          const compressorModule = await import('../utils/compressor.js');
          const { compressor } = compressorModule;
          console.log('🔧 DEBUG: BASE69 Compressor loaded successfully');

          targetSectionIds = compressor.decompressRoutine(routineId);
          console.log('🔓 DEBUG: BASE69 Decompressed section IDs:', targetSectionIds);
        } catch (error) {
          console.error('❌ DEBUG: Error with BASE69 decompression:', error);
          console.error('❌ DEBUG: Error stack:', error.stack);
          throw new Error('Invalid routine format: ' + error.message);
        }
      } else {
        console.log('📋 DEBUG: Using direct section ID:', routineId);
        targetSectionIds = [routineId];
      }

      console.log('🎯 DEBUG: Looking for section IDs:', targetSectionIds);

      // Filter sections that match our target section IDs
      const matchingSections = allSections.filter(section => {
        const sectionIdStr = section.sectionId.toString();
        const isMatch = targetSectionIds.includes(sectionIdStr);

        if (isMatch) {
          console.log('✅ DEBUG: Found matching section:', sectionIdStr, section.courseCode);
        }

        return isMatch;
      });

      console.log('🎯 DEBUG: Total matching sections found:', matchingSections.length);

      if (matchingSections.length === 0) {
        console.error('❌ DEBUG: No matching sections found');
        console.log('🔍 DEBUG: Available section IDs sample (first 10):');
        allSections.slice(0, 10).forEach(section => {
          console.log('  -', section.sectionId, section.courseCode);
        });
        throw new Error('No matching sections found in USIS data');
      }

      // Log lab information for debugging
      matchingSections.forEach(section => {
        if (section.labSchedules && section.labSchedules.length > 0) {
          console.log('🧪 DEBUG: Section with lab found:', {
            sectionId: section.sectionId,
            courseCode: section.courseCode,
            labSchedules: section.labSchedules,
            labRoomName: section.labRoomName,
            labCourseCode: section.labCourseCode
          });
        }
      });

      const convertedData = convertApiDataToRoutineFormat(matchingSections);
      console.log('✅ DEBUG: Converted routine data:', convertedData);

      return convertedData;

    } catch (error) {
      console.error('❌ DEBUG: Error in fetchOnlineRoutineData:', error);
      console.error('❌ DEBUG: Error type:', error.constructor.name);
      console.error('❌ DEBUG: Error message:', error.message);
      console.error('❌ DEBUG: Error stack:', error.stack);
      throw error;
    }
  }

  /**
   * Parse section IDs from routine ID string (using BASE69 format)
   * @param {string} routineId - Routine ID starting with # (BASE69 compressed format)
   * @returns {Promise<Array>} Promise resolving to array of section IDs
   */
  async function parseSectionIds(routineId) {
    console.log('🔧 DEBUG: parseSectionIds called with:', routineId);
    try {
      // Use BASE69 compressor for decompression
      const compressorModule = await import('../utils/compressor.js');
      const { compressor } = compressorModule;
      console.log('🔧 DEBUG: Compressor loaded in parseSectionIds');

      const sectionIds = compressor.decompressRoutine(routineId);
      console.log('✅ DEBUG: parseSectionIds returning:', sectionIds);
      return sectionIds;
    } catch (error) {
      console.error('❌ DEBUG: Error in parseSectionIds:', error);
      throw new Error('Invalid routine format: ' + error.message);
    }
  }

  /**
   * Process routine input (either JSON or online ID)
   * @param {string} input - Either JSON string or online ID starting with #
   * @returns {Promise<Array>} Promise resolving to routine data
   */
  async function processRoutineInput(input) {
    console.log('🔍 DEBUG: processRoutineInput called with:', input);
    const trimmedInput = input.trim();

    if (trimmedInput.startsWith('#')) {
      console.log('🌐 DEBUG: Processing online routine ID');
      // Online mode - fetch from API
      const sectionIds = await parseSectionIds(trimmedInput);
      console.log('🔍 DEBUG: Got section IDs:', sectionIds);

      if (!sectionIds || sectionIds.length === 0) {
        throw new Error('Invalid routine ID format. No section IDs found.');
      }

      return await fetchOnlineRoutineData(trimmedInput);
    } else {
      console.log('📝 DEBUG: Processing JSON input');
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
    const sEnd = timeToMinutes(endTime);

    timeSlots.forEach(slot => {
      const [slotStartStr, slotEndStr] = slot.split('-');
      const slotStart = timeToMinutes(slotStartStr.trim());
      const slotEnd = timeToMinutes(slotEndStr.trim());

      if (sStart <= slotEnd && sEnd >= slotStart) {
        // Determine if this is a lab session based on the course object
        const isLabSession = course.Lab && course.Lab !== 'N/A' && course.Lab.includes(session);
        const displayCourse = isLabSession && course.labCourseCode ? course.labCourseCode : course.Course;
        
        console.log('🔧 DEBUG: Processing session:', {
          session,
          isLabSession,
          originalCourse: course.Course,
          displayCourse,
          labCourseCode: course.labCourseCode
        });

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
        const tr = document.createElement('tr');

        const timeTd = document.createElement('td');
        timeTd.className = 'p-2 whitespace-nowrap text-center';
        timeTd.style.border = '1px solid var(--table-border)';
        timeTd.style.whiteSpace = 'nowrap';
        timeTd.style.minWidth = 'max-content';
        timeTd.textContent = slot;
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
  }

  /**
   * Capture screenshot of the routine using canvas approach
   */
  async function captureScreenshot() {
    console.log('📸 DEBUG: Starting exact table screenshot capture');
    
    try {
      // Check if there's a generated routine
      const routineTableBody = document.getElementById('routine-table-body');
      if (!routineTableBody || routineTableBody.children.length === 0) {
        UIManager.showAlert("Please click 'Generate Routine' first.");
        return;
      }

      console.log('📊 DEBUG: Found routine table with', routineTableBody.children.length, 'rows');

      // Check if CanvasScreenshotCapture is available
      if (typeof window.CanvasScreenshotCapture === 'undefined') {
        console.error('❌ DEBUG: CanvasScreenshotCapture not loaded');
        UIManager.showAlert('Screenshot module not loaded. Please refresh the page.');
        return;
      }

      // Create canvas screenshot capture instance
      const screenshotCapture = new window.CanvasScreenshotCapture();
      
      // Create exact replica of the table on canvas
      console.log('🎨 DEBUG: Creating exact table replica on canvas');
      const imageDataUrl = await screenshotCapture.createTableFromScratch();
      
      // Create download link
      const link = document.createElement('a');
      link.href = imageDataUrl;
      link.download = `HomiesUnlocked_Routine_${new Date().toISOString().slice(0, 10)}.png`;
      
      // Temporarily add to DOM, click, then remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ DEBUG: Exact table screenshot captured and downloaded');
      UIManager.showAlert('Screenshot saved successfully!', 'success');
      
    } catch (error) {
      console.error('❌ DEBUG: Error capturing exact table screenshot:', error);
      console.error('❌ DEBUG: Error stack:', error.stack);
      UIManager.showAlert('Screenshot failed: ' + error.message, 'error');
    }
  }

  /**
   * Extract routine data from the current DOM table for canvas rendering
   */
  function extractRoutineDataFromDOM() {
    const routineData = {
      sections: []
    };

    // Get all routine entries from the table
    const tableRows = document.querySelectorAll('#routine-table-body tr');
    
    tableRows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length < 8) return; // Skip incomplete rows
      
      const timeSlot = cells[0].textContent.trim();
      
      // Process each day column (Sun-Sat)
      for (let dayIndex = 1; dayIndex < 8; dayIndex++) {
        const dayCell = cells[dayIndex];
        const routineEntries = dayCell.querySelectorAll('.routine-entry');
        
        routineEntries.forEach(entry => {
          const entryText = entry.textContent.trim();
          if (!entryText) return;
          
          // Parse entry text: "Name - Course[Section] - Faculty"
          const match = entryText.match(/^(.+?)\s*-\s*(.+?)\[(.+?)\]\s*-\s*(.+)$/);
          if (match) {
            const [, name, courseCode, section, faculty] = match;
            const dayName = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][dayIndex - 1];
            
            // Convert time slot to start/end times
            const [startTime, endTime] = timeSlot.split('-').map(t => t.trim());
            
            // Determine if it's a lab course
            const isLab = courseCode.endsWith('L');
            
            routineData.sections.push({
              courseCode: courseCode,
              hasLab: false, // We'll handle this in the display
              schedule: [{
                day: dayName,
                startTime: convertTo24Hour(startTime),
                endTime: convertTo24Hour(endTime)
              }],
              labSchedules: [],
              room: 'Room', // Placeholder
              faculty: faculty,
              name: name,
              isLabEntry: isLab
            });
          }
        });
      }
    });

    console.log('📊 DEBUG: Extracted routine data:', routineData);
    return routineData;
  }

  /**
   * Convert 12-hour time format to 24-hour format
   */
  function convertTo24Hour(time12) {
    const [time, period] = time12.split(/\s*(AM|PM)/i);
    const [hours, minutes] = time.split(':').map(Number);
    
    let hour24 = hours;
    if (period.toUpperCase() === 'PM' && hours !== 12) {
      hour24 += 12;
    } else if (period.toUpperCase() === 'AM' && hours === 12) {
      hour24 = 0;
    }
    
    return `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  }

  /**
   * Initialize event listeners for routine-related actions
   */
  function init() {
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

    // Screenshot button - fixed event handling
    const screenshotBtn = document.getElementById('screenshot-btn');
    if (screenshotBtn) {
      screenshotBtn.addEventListener('click', async () => {
        console.log('📸 DEBUG: Screenshot button clicked');
        
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
    processRoutineInput,
    fetchOnlineRoutineData // Export for potential external use
  };
})();