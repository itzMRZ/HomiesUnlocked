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
        this.base2 = this.base * this.base; // 69² = 4,761
        this.base3 = this.base2 * this.base; // 69³ = 328,509
        this.base4 = this.base3 * this.base; // 69⁴ = 22,244,961
        this.minSectionId = 100000;
        this.maxSectionId = 999999;
        this.apiUrl = 'https://usis-cdn.eniamza.com/connect.json';
        this.sectionDataPromise = null;
    }

    /**
     * Decode a four-character token back to the original six-digit section ID
     */
    decode(encoded) {
        if (encoded.length !== 4) {
            throw new Error('Encoded string must be exactly 4 characters');
        }

        const index1 = this.charset.indexOf(encoded[0]);
        const index2 = this.charset.indexOf(encoded[1]);
        const index3 = this.charset.indexOf(encoded[2]);
        const index4 = this.charset.indexOf(encoded[3]);

        if (index1 === -1 || index2 === -1 || index3 === -1 || index4 === -1) {
            throw new Error('Invalid characters in encoded string');
        }

        const remaining =
            index1 * this.base3 +
            index2 * this.base2 +
            index3 * this.base +
            index4;

        const originalId = this.minSectionId + remaining;

        if (originalId > this.maxSectionId) {
            throw new Error('Decoded section ID exceeds supported range');
        }

        return originalId.toString().padStart(6, '0');
    }

    /**
     * Decompress routine string (starting with #) to section IDs
     */
    decompressRoutine(routineString) {
        if (!routineString?.startsWith('#')) {
            throw new Error('Routine string must start with #');
        }

        const normalized = routineString.trim().substring(1);
        const [encoded] = normalized.split('~');

        if (!encoded || encoded === '0000') {
            return [];
        }

        if (encoded.length % 4 !== 0) {
            throw new Error('Invalid routine string length');
        }

        const sectionIds = [];
        for (let i = 0; i < encoded.length; i += 4) {
            const token = encoded.substring(i, i + 4);
            sectionIds.push(this.decode(token));
        }

        return sectionIds;
    }

    /**
     * Fetch section data from API
     */
    async fetchSectionData() {
        if (this.sectionDataPromise) {
            return this.sectionDataPromise;
        }

        this.sectionDataPromise = fetch(this.apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .catch(error => {
                console.error('Failed to fetch section data:', error);
                this.sectionDataPromise = null;
                throw error;
            });

        return this.sectionDataPromise;
    }

    /**
     * Transform API section data to routine format
     */
    transformToRoutineFormat(sectionData) {
        const routineData = [];
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
            const [hours = '0', minutes = '00'] = time24.split(':');
            let hour = parseInt(hours, 10);
            const minute = minutes.padEnd(2, '0');
            const period = hour >= 12 ? 'PM' : 'AM';

            if (hour === 0) {
                hour = 12;
            } else if (hour > 12) {
                hour -= 12;
            }

            return `${hour}:${minute} ${period}`;
        };

        for (const section of sectionData) {
            if (!section.sectionSchedule?.classSchedules) {
                continue;
            }

            for (const schedule of section.sectionSchedule.classSchedules) {
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

            return routineData;

        } catch (error) {
            console.error('Error processing encrypted routine:', error);
            throw error;
        }
    }
}

// Create a global instance
window.RoutineDecryptor = new RoutineDecryptor();
