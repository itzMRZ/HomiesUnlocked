/**
 * SECTION ID DECOMPRESSOR
 * =======================
 *
 * PURPOSE:
 * - Decompresses 2-character codes back to 6-digit section IDs
 * - Handles both compressed format (#1Ba+3K9) and standard format (#177609-178000)
 * - Provides seamless integration with existing RoutineManager
 *
 * SUPPORTED FORMATS:
 * - Compressed: #1Ba+3K9 (each 2-char pair = one section ID)
 * - Standard: #177609-178000 (hyphen-separated section IDs)
 *
 * DECODING PROCESS:
 * 1. Detect format type (compressed vs standard)
 * 2. For compressed: decode 2-character pairs back to section IDs
 * 3. For standard: parse hyphen-separated IDs directly
 * 4. Return array of section IDs ready for API consumption
 */
const RoutineDecompressor = (() => {
  // Base64 charset matching the compressor
  const CHARSET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+';
  const BASE = 64;

  /**
   * Decode a 2-character compressed string back to section ID
   * @param {string} encoded - 2-character encoded string
   * @returns {string} - Original 6-digit section ID
   */
  function decodePair(encoded) {
    if (encoded.length !== 2) {
      throw new Error(`Invalid encoded pair length: ${encoded}. Expected 2 characters.`);
    }

    const index1 = CHARSET.indexOf(encoded[0]);
    const index2 = CHARSET.indexOf(encoded[1]);

    if (index1 === -1) {
      throw new Error(`Invalid character '${encoded[0]}' in encoded string`);
    }
    if (index2 === -1) {
      throw new Error(`Invalid character '${encoded[1]}' in encoded string`);
    }

    // Convert back to decimal
    const remaining = index1 * BASE + index2;

    // Validate range (0000-9999)
    if (remaining >= 10000) {
      throw new Error(`Decoded value ${remaining} is out of valid range (0-9999)`);
    }

    // Add "17" prefix back and pad to 4 digits
    const sectionId = '17' + remaining.toString().padStart(4, '0');

    return sectionId;
  }

  /**
   * Detect if routine string uses compressed format or standard format
   * @param {string} routineString - Routine string starting with #
   * @returns {string} - 'compressed', 'standard', or 'routine_id'
   */
  function detectFormat(routineString) {
    if (!routineString.startsWith('#')) {
      throw new Error('Routine string must start with #');
    }

    const content = routineString.substring(1);

    // Check if it's a routine ID (contains letters/mixed alphanumeric that's not pure compression)
    if (/^[a-zA-Z0-9]+$/.test(content) && content.length <= 10 && !/^[0-9-]+$/.test(content)) {
      return 'routine_id';
    }

    // Standard format contains hyphens
    if (content.includes('-')) {
      return 'standard';
    }

    // Check if it's valid compressed format (even length, valid chars)
    if (content.length % 2 === 0 && content.length > 0) {
      // Verify all characters are in charset
      for (let char of content) {
        if (CHARSET.indexOf(char) === -1) {
          return 'routine_id'; // If invalid chars for compression, treat as routine ID
        }
      }
      return 'compressed';
    }

    return 'routine_id'; // Default to routine ID format
  }

  /**
   * Decompress a compressed routine string to array of section IDs
   * @param {string} routineString - Compressed routine string like "#1Ba+3K9"
   * @returns {Array<number>} - Array of section IDs as numbers
   */
  function decompressRoutine(routineString) {
    if (!routineString.startsWith('#')) {
      throw new Error('Routine string must start with #');
    }

    const encoded = routineString.substring(1);

    if (encoded.length === 0) {
      throw new Error('Empty routine string');
    }

    if (encoded.length % 2 !== 0) {
      throw new Error(`Invalid compressed routine length: ${encoded.length}. Must be even.`);
    }

    const sectionIds = [];
    for (let i = 0; i < encoded.length; i += 2) {
      const pair = encoded.substring(i, i + 2);
      try {
        const sectionId = decodePair(pair);
        sectionIds.push(parseInt(sectionId, 10));
      } catch (error) {
        throw new Error(`Error decoding pair '${pair}' at position ${i}: ${error.message}`);
      }
    }

    return sectionIds;
  }

  /**
   * Parse standard routine format to array of section IDs
   * @param {string} routineString - Standard routine string like "#177609-178000"
   * @returns {Array<number>} - Array of section IDs as numbers
   */
  function parseStandardRoutine(routineString) {
    if (!routineString.startsWith('#')) {
      throw new Error('Routine string must start with #');
    }

    const idsString = routineString.substring(1);
    const sectionIds = idsString.split('-').map(id => {
      const trimmedId = id.trim();
      const numericId = parseInt(trimmedId, 10);

      if (isNaN(numericId)) {
        throw new Error(`Invalid section ID: ${trimmedId}`);
      }

      // Validate 6-digit section ID starting with 17
      if (trimmedId.length !== 6 || !trimmedId.startsWith('17')) {
        throw new Error(`Invalid section ID format: ${trimmedId}. Must be 6 digits starting with '17'.`);
      }

      return numericId;
    });

    if (sectionIds.length === 0) {
      throw new Error('No valid section IDs found');
    }

    return sectionIds;
  }

  /**
   * Main function to parse any routine format and return section IDs
   * @param {string} routineString - Routine string in any supported format
   * @returns {Array<number>|string} - Array of section IDs for compressed/standard, or routine ID string for routine_id format
   */
  function parseRoutineString(routineString) {
    try {
      const format = detectFormat(routineString);

      console.log(`Detected routine format: ${format}`);
      console.log(`Processing routine string: ${routineString}`);

      let result;
      if (format === 'compressed') {
        result = decompressRoutine(routineString);
        console.log(`Decompressed ${result.length} section IDs:`, result);
      } else if (format === 'standard') {
        result = parseStandardRoutine(routineString);
        console.log(`Parsed ${result.length} section IDs:`, result);
      } else if (format === 'routine_id') {
        result = routineString; // Return the full routine ID string
        console.log(`Detected routine ID: ${result}`);
      }

      return result;
    } catch (error) {
      console.error('Error parsing routine string:', error.message);
      throw error;
    }
  }

  /**
   * Validate that a routine string is properly formatted
   * @param {string} routineString - Routine string to validate
   * @returns {boolean} - True if valid, false otherwise
   */
  function isValidRoutineString(routineString) {
    try {
      parseRoutineString(routineString);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get format information about a routine string
   * @param {string} routineString - Routine string to analyze
   * @returns {Object} - Format information object
   */
  function getFormatInfo(routineString) {
    try {
      const format = detectFormat(routineString);
      const result = parseRoutineString(routineString);

      if (format === 'routine_id') {
        return {
          format: format,
          routineId: result,
          isValid: true
        };
      } else {
        return {
          format: format,
          sectionCount: result.length,
          sectionIds: result,
          isValid: true
        };
      }
    } catch (error) {
      return {
        format: 'unknown',
        sectionCount: 0,
        sectionIds: [],
        isValid: false,
        error: error.message
      };
    }
  }

  // Public API
  return {
    parseRoutineString,
    isValidRoutineString,
    getFormatInfo,
    decompressRoutine,
    parseStandardRoutine,
    detectFormat
  };
})();
