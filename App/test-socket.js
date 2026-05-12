// Test file to verify socket.io-client can be imported
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

try {
  const { io } = require('socket.io-client');
  console.log('✅ socket.io-client imported successfully!');
  console.log('io function:', typeof io);
} catch (error) {
  console.error('❌ Failed to import socket.io-client:', error.message);
}
