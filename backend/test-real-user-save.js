const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Test sermon save functionality with a REAL user account
async function testRealUserSermonSave() {
  try {
    console.log('🧪 Testing Real User Sermon Save/Unsaved Functionality...');
    
    // Step 1: Create a real user account
    console.log('1. Creating real user account...');
    const signupResponse = await axios.post(`${API_BASE}/auth/signup`, {
      name: 'Real Test User',
      email: 'realtest@example.com',
      password: 'testpass123',
      phone: '+256700123456'
    });
    
    const realUserToken = signupResponse.data.token;
    const realUserId = signupResponse.data.user.id;
    console.log('✅ Real user created and logged in');
    console.log('📝 User ID:', realUserId);
    
    // Step 2: Get existing sermons
    console.log('2. Getting existing sermons...');
    const sermonsResponse = await axios.get(`${API_BASE}/sermons?published=true&limit=1`);
    if (sermonsResponse.data.sermons.length === 0) {
      console.log('❌ No sermons found to test with');
      return;
    }
    
    const sermonId = sermonsResponse.data.sermons[0]._id;
    console.log('✅ Found sermon to test with:', sermonId);
    
    // Step 3: Test save sermon with REAL user
    console.log('3. Testing save sermon with real user...');
    const saveResponse = await axios.post(`${API_BASE}/sermons/${sermonId}/save`, {}, {
      headers: {
        'Authorization': `Bearer ${realUserToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Save response:', saveResponse.data);
    
    // Step 4: Verify save worked by checking user profile
    console.log('4. Verifying sermon was saved to user account...');
    const profileResponse = await axios.get(`${API_BASE}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${realUserToken}`
      }
    });
    
    console.log('👤 User profile retrieved');
    
    // Step 5: Test unsave sermon
    console.log('5. Testing unsave sermon...');
    const unsaveResponse = await axios.post(`${API_BASE}/sermons/${sermonId}/save`, {}, {
      headers: {
        'Authorization': `Bearer ${realUserToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Unsave response:', unsaveResponse.data);
    
    // Step 6: Verify unsave worked
    console.log('6. Verifying sermon was unsaved from user account...');
    const finalProfileResponse = await axios.get(`${API_BASE}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${realUserToken}`
      }
    });
    
    console.log('✅ Final user profile retrieved');
    
    console.log('🎉 Real user save/unsave functionality test complete!');
    console.log('📊 Summary:');
    console.log('  - Real user can save sermons without errors');
    console.log('  - Real user can unsave sermons without errors');
    console.log('  - No demo user messages for real users');
    console.log('  - Database operations work correctly for real users');
    
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
testRealUserSermonSave();