const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Test sermon creation with demo admin
async function testSermonCreation() {
  try {
    console.log('🧪 Testing Sermon Creation...');
    
    // Step 1: Login with demo admin
    console.log('1. Logging in with demo admin...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@doveministriesafrica.org',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Step 2: Create a sermon
    console.log('2. Creating sermon...');
    const sermonData = {
      title: 'Fix Verification Sermon',
      speaker: 'Pastor Test',
      description: 'This sermon was created to verify the fix for sermon saving issues',
      scripture: 'Psalm 119:2',
      date: new Date().toISOString(),
      isPublished: true,
      tags: ['fix', 'verification', 'test']
    };
    
    const createResponse = await axios.post(`${API_BASE}/sermons`, sermonData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Sermon created successfully!');
    console.log('📝 Sermon ID:', createResponse.data.sermon._id);
    console.log('📝 Sermon Title:', createResponse.data.sermon.title);
    console.log('📝 Created By:', createResponse.data.sermon.createdBy);
    
    // Step 3: Verify the sermon was saved
    console.log('3. Verifying sermon was saved...');
    const getResponse = await axios.get(`${API_BASE}/sermons/${createResponse.data.sermon._id}`);
    
    if (getResponse.data.sermon && getResponse.data.sermon.title === sermonData.title) {
      console.log('✅ Sermon successfully saved and retrieved!');
      console.log('🎉 Fix verification complete - sermon saving is working!');
    } else {
      console.log('❌ Sermon verification failed');
    }
    
    // Cleanup: Delete the test sermon
    console.log('4. Cleaning up test sermon...');
    await axios.delete(`${API_BASE}/sermons/${createResponse.data.sermon._id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Test sermon cleaned up');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.error || error.message);
    if (error.response?.data?.errors) {
      console.error('Validation errors:', error.response.data.errors);
    }
  }
}

// Run the test
testSermonCreation();