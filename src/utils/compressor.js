/**
 * BASE69 SECTION ID COMPRESSOR & DECRYPTOR
 * ========================================
 * [Full documentation comment from your code]
 */

class SectionCompressor {
    constructor() {
        // Base69 charset: 69 ultra-safe characters (using @ instead of comma)
        this.charset = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+.%@*$!';
        this.base = 69;
        this.base2 = this.base * this.base; // 69² = 4761
    }

    encode(sectionId) {
        const idStr = String(sectionId).trim().replace(/[^\d]/g, '');

        if (idStr.length !== 6 || !idStr.startsWith('17')) {
            console.error('Invalid section ID:', idStr);
            return '000';
        }

        // Remove "17" prefix (0000-9999 range)
        const remaining = parseInt(idStr.substring(2), 10);

        // Convert to exactly 3 characters using base69
        const char1Index = Math.floor(remaining / this.base2);
        const char2Index = Math.floor((remaining % this.base2) / this.base);
        const char3Index = remaining % this.base;

        return this.charset[char1Index] + this.charset[char2Index] + this.charset[char3Index];
    }

    decode(encoded) {
        console.log('🔓 DEBUG: Decoding string:', encoded);

        if (encoded.length !== 3) {
            console.error('❌ DEBUG: Invalid encoded length:', encoded.length);
            throw new Error('Encoded string must be exactly 3 characters');
        }

        const index1 = this.charset.indexOf(encoded[0]);
        const index2 = this.charset.indexOf(encoded[1]);
        const index3 = this.charset.indexOf(encoded[2]);

        console.log('🔢 DEBUG: Character indices:', {
            char1: encoded[0], index1,
            char2: encoded[1], index2,
            char3: encoded[2], index3
        });

        if (index1 === -1 || index2 === -1 || index3 === -1) {
            console.error('❌ DEBUG: Invalid characters found');
            throw new Error('Invalid characters in encoded string');
        }

        const remaining = index1 * this.base2 + index2 * this.base + index3;
        const result = '17' + remaining.toString().padStart(4, '0');

        console.log('🔢 DEBUG: Calculation:', `${index1} * ${this.base2} + ${index2} * ${this.base} + ${index3} = ${remaining}`);
        console.log('✅ DEBUG: Decoded result:', result);

        return result;
    }

    compressForCopy(sectionIds) {
        const validIds = sectionIds.filter(id => {
            const idStr = String(id).trim().replace(/[^\d]/g, '');
            return idStr.length === 6 && idStr.startsWith('17');
        });

        if (validIds.length === 0) {
            return '#000';
        }

        const encoded = validIds.map(id => this.encode(id));
        return '#' + encoded.join('');
    }

    decompressRoutine(routineString) {
        console.log('🔓 DEBUG: Decompressing routine:', routineString);

        if (!routineString.startsWith('#')) {
            console.error('❌ DEBUG: Routine string must start with #');
            throw new Error('Routine string must start with #');
        }

        const encoded = routineString.substring(1);
        console.log('🔤 DEBUG: Encoded part:', encoded);

        if (encoded.length % 3 !== 0) {
            console.error('❌ DEBUG: Invalid encoded length:', encoded.length);
            throw new Error('Invalid routine string length');
        }

        const sectionIds = [];
        for (let i = 0; i < encoded.length; i += 3) {
            const triplet = encoded.substring(i, i + 3);
            console.log('🔤 DEBUG: Processing triplet:', triplet);

            const decodedId = this.decode(triplet);
            sectionIds.push(decodedId);
        }

        console.log('✅ DEBUG: All decoded section IDs:', sectionIds);
        return sectionIds;
    }
}

export const compressor = new SectionCompressor();
export default SectionCompressor;
