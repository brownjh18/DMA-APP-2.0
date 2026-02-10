/**
 * Quick server start test
 * Tests MongoDB connection and server startup
 */

require('dotenv').config();
const app = require('./server.js');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 5000;

console.log('🧪 Testing server startup...');
console.log('📡 MongoDB URI:', (process.env.MONGODB_URI || '').replace(/:([^:@]+)@/, ':****@'));
console.log(`📍 Starting server on port ${PORT}...`);

// Wait a bit to see if MongoDB connects
setTimeout(async () => {
  const state = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  console.log(`📊 MongoDB state: ${states[state] || state}`);
  
  if (state === 1) {
    console.log('✅ Server started successfully with MongoDB connection!');
    console.log(`🌐 Server URL: http://localhost:${PORT}`);
    console.log(`📊 Database: ${mongoose.connection.name}`);
  } else {
    console.log('⚠️  MongoDB not connected yet. Check connection settings.');
  }
  
  // Exit after test
  process.exit(state === 1 ? 0 : 1);
}, 3000);
