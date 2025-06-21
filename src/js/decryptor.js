/**
 * BASE69 SECTION ID DECRYPTOR
 * ===========================
 *
 * Decodes compressed routine IDs (starting with #) and fetches section data
 * from the USIS API to generate routine information.
 */

class RoutineDecryptor {
    constructor() {
        // Base69 charset: 69 ultra-safe characters (matching the encryptor)
        this.charset = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+.%@*$!';
        this.base = 69;
        this.base2 = this.base * this.base; // 69² = 4761
        this.apiUrl = 'https://usis-cdn.eniamza.com/connect.json';
    }

    /**
     * Decode a 3-character encoded string back to section ID
     */
    decode(encoded) {
        if (encoded.length !== 3) {
            throw new Error('Encoded string must be exactly 3 characters');
        }

        const index1 = this.charset.indexOf(encoded[0]);
        const index2 = this.charset.indexOf(encoded[1]);
        const index3 = this.charset.indexOf(encoded[2]);

        if (index1 === -1 || index2 === -1 || index3 === -1) {
            throw new Error('Invalid characters in encoded string');
        }

        const remaining = index1 * this.base2 + index2 * this.base + index3;
        return '17' + remaining.toString().padStart(4, '0');
    }

    /**
     * Decompress routine string (starting with #) to section IDs
     */
    decompressRoutine(routineString) {
        if (!routineString.startsWith('#')) {
            throw new Error('Routine string must start with #');
        }

        const encoded = routineString.substring(1);

        if (encoded.length % 3 !== 0) {
            throw new Error('Invalid routine string length');
        }

        const sectionIds = [];
        for (let i = 0; i < encoded.length; i += 3) {
            const triplet = encoded.substring(i, i + 3);
            sectionIds.push(this.decode(triplet));
        }

        return sectionIds;
    }

    /**
     * Fetch section data from API
     */
    async fetchSectionData() {
        try {
            const response = await fetch(this.apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch section data:', error);
            throw error;
        }
    }

    /**
     * Transform API section data to routine format
     */
    transformToRoutineFormat(sectionData) {
        const routineData = [];

        for (const section of sectionData) {
            if (!section.sectionSchedule || !section.sectionSchedule.classSchedules) {
                continue;
            }

            for (const schedule of section.sectionSchedule.classSchedules) {
                // Convert day to proper format
                const dayMap = {
                    'SUNDAY': 'SUN',
                    'MONDAY': 'MON',
                    'TUESDAY': 'TUE',
                    'WEDNESDAY': 'WED',
                    'THURSDAY': 'THU',
                    'FRIDAY': 'FRI',
                    'SATURDAY': 'SAT'
                };

                // Convert 24-hour time to 12-hour format
                const formatTime = (time24) => {
                    const [hours, minutes] = time24.split(':');
                    const hour = parseInt(hours);
                    const ampm = hour >= 12 ? 'PM' : 'AM';
                    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                    return `${hour12}:${minutes} ${ampm}`;
                };

                const routineEntry = {
                    Course: section.courseCode,
                    section: `Section ${section.sectionName}`,
                    faculty: section.faculties || 'TBA',
                    Class: `${dayMap[schedule.day]} (${formatTime(schedule.startTime)}-${formatTime(schedule.endTime)}-${section.roomName || section.roomNumber || 'TBA'})`,
                    Lab: 'N/A' // Handle labs separately if needed
                };

                routineData.push(routineEntry);
            }

            // Handle lab schedules if they exist
            if (section.labSchedules && section.labSchedules.length > 0) {
                for (const labSchedule of section.labSchedules) {
                    const dayMap = {
                        'SUNDAY': 'SUN',
                        'MONDAY': 'MON',
                        'TUESDAY': 'TUE',
                        'WEDNESDAY': 'WED',
                        'THURSDAY': 'THU',
                        'FRIDAY': 'FRI',
                        'SATURDAY': 'SAT'
                    };

                    const formatTime = (time24) => {
                        const [hours, minutes] = time24.split(':');
                        const hour = parseInt(hours);
                        const ampm = hour >= 12 ? 'PM' : 'AM';
                        const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                        return `${hour12}:${minutes} ${ampm}`;
                    };

                    const labEntry = {
                        Course: `${section.courseCode}L`, // Add L for lab
                        section: `Section ${section.sectionName}`,
                        faculty: section.labFaculties || section.faculties || 'TBA',
                        Class: 'N/A',
                        Lab: `${dayMap[labSchedule.day]} (${formatTime(labSchedule.startTime)}-${formatTime(labSchedule.endTime)}-${section.labRoomName || 'TBA'})`
                    };

                    routineData.push(labEntry);
                }
            }
        }

        return routineData;
    }

    /**
     * Process encrypted routine ID and return routine data
     */
    async processEncryptedRoutine(routineId) {
        try {
            // Decompress the routine ID to get section IDs
            const sectionIds = this.decompressRoutine(routineId);
            console.log('Decoded section IDs:', sectionIds);

            // Fetch all section data from API
            const allSectionData = await this.fetchSectionData();

            // Filter sections that match our decoded IDs
            const matchingSections = allSectionData.filter(section =>
                sectionIds.includes(section.sectionId.toString())
            );

            if (matchingSections.length === 0) {
                throw new Error('No matching sections found for the provided routine ID');
            }

            // Transform to routine format
            const routineData = this.transformToRoutineFormat(matchingSections);

            console.log(`Found ${matchingSections.length} matching sections, generated ${routineData.length} routine entries`);

            return routineData;

        } catch (error) {
            console.error('Error processing encrypted routine:', error);
            throw error;
        }
    }
}

// Create a global instance
console.log('🔄 Creating RoutineDecryptor instance...');
window.RoutineDecryptor = new RoutineDecryptor();
console.log('✅ RoutineDecryptor loaded successfully');
console.log('✅ Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(window.RoutineDecryptor)));
console.log('✅ processEncryptedRoutine type:', typeof window.RoutineDecryptor.processEncryptedRoutine);
