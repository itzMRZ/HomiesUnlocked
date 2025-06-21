// Simple test of the decryptor functionality
const RoutineDecryptor = require('./src/js/decryptor.js');

// Test the decoding
try {
    const decryptor = new RoutineDecryptor();
    console.log('Testing decode function...');
    const result = decryptor.decode('000');
    console.log('Decode result:', result);
} catch (error) {
    console.error('Error:', error.message);
}
