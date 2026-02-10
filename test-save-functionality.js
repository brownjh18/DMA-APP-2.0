const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Test sermon save/unsave functionality with demo admin
async function testSermonSaveFunctionality() {
  try {
    console.log('🧪 Testing Sermon Save/Unsaved Functionality...');
    
    // Step 1: Login with demo admin
    console.log('1. Logging in with demo admin...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@doveministriesafrica.org',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Step 2: Get existing sermons
    console.log('2. Getting existing sermons...');
    const sermonsResponse = await axios.get(`${API_BASE}/sermons?published=true&limit=1`);
    if (sermonsResponse.data.sermons.length === 0) {
      console.log('❌ No sermons found to test with');
      return;
    }
    
    const sermonId = sermonsResponse.data.sermons[0]._id;
    console.log('✅ Found sermon to test with:', sermonId);
    
    // Step 3: Test save sermon
    console.log('3. Testing save sermon...');
    const saveResponse = await axios.post(`${API_BASE}/sermons/${sermonId}/save`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Save response:', saveResponse.data);
    
    // Step 4: Test unsave sermon
    console.log('4. Testing unsave sermon...');
    const unsaveResponse = await axios.post(`${API_BASE}/sermons/${sermonId}/save`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Unsave response:', unsaveResponse.data);
    
    console.log('🎉 Save/unsave functionality test complete - no CastError!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.error || error.message);
    if (error.response?.data?.errors) {
      console.error('Validation errors:', error.response.data.errors);
    }
    if (error.response?.data?.details) {
      console.error('Details:', error.response.data.details);
    }
  }
}

// Run the test
testSermonSaveFunctionality();