const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const API_URL = BASE_URL;

// Test data
const testUser = {
  email: 'demo-admin@email.com',
  password: 'admin123',
  name: 'Demo Admin'
};

const testChannel = 'demo-admin-channel-123';

const testSermon = {
  title: 'Test Sermon - Save Functionality',
  description: 'This is a test sermon to verify the save functionality works correctly',
  scripture: 'John 3:16',
  preacher: 'Demo Admin',
  videoUrl: 'https://www.youtube.com/watch?v=test-video-id',
  audioUrl: 'https://example.com/test-audio.mp3',
  thumbnailUrl: 'https://example.com/test-thumbnail.jpg'
};

let authToken = '';
let testUserId = '';

// Helper function to make authenticated requests
function makeAuthRequest(method, url, data = null) {
  return axios({
    method,
    url: `${API_URL}${url}`,
    data,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  });
}

// Test authentication and get token
async function testAuthentication() {
  console.log('\n=== Testing Authentication ===');
  try {
    const response = await axios.post(`${API_URL}/auth/login`, testUser);
    authToken = response.data.token;
    testUserId = response.data.user.id;
    console.log('✅ Authentication successful');
    console.log('User ID:', testUserId);
    console.log('Token obtained:', authToken.substring(0, 20) + '...');
    return true;
  } catch (error) {
    console.error('❌ Authentication failed:', error.response?.data?.message || error.message);
    return false;
  }
}

// Test sermon creation/saving
async function testSermonSaving() {
  console.log('\n=== Testing Sermon Saving ===');
  try {
    const response = await makeAuthRequest('POST', '/sermons', testSermon);
    
    if (response.status === 201) {
      console.log('✅ Sermon saved successfully');
      console.log('Sermon ID:', response.data.sermon._id);
      console.log('Title:', response.data.sermon.title);
      console.log('Creator:', response.data.sermon.creator);
      
      // Clean up - delete the test sermon
      try {
        await makeAuthRequest('DELETE', `/sermons/${response.data.sermon._id}`);
        console.log('✅ Test sermon cleaned up');
      } catch (deleteError) {
        console.warn('⚠️  Could not clean up test sermon:', deleteError.response?.data?.message || deleteError.message);
      }
      
      return true;
    } else {
      console.error('❌ Unexpected response status:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Sermon saving failed:', error.response?.data?.message || error.message);
    
    // Log detailed error information for debugging
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
    
    return false;
  }
}

// Test subscription functionality
async function testSubscription() {
  console.log('\n=== Testing Subscription Functionality ===');
  try {
    // Test subscribing
    console.log('Testing subscribe...');
    const subscribeResponse = await makeAuthRequest('POST', `/subscribe/${testChannel}`);
    
    if (subscribeResponse.status === 200) {
      console.log('✅ Subscription successful');
      console.log('Subscriptions:', subscribeResponse.data.subscriptions);
      
      // Verify the subscription was added
      if (subscribeResponse.data.subscriptions.includes(testChannel)) {
        console.log('✅ Channel correctly added to subscriptions');
      } else {
        console.error('❌ Channel not found in subscriptions');
        return false;
      }
    } else {
      console.error('❌ Unexpected subscribe response status:', subscribeResponse.status);
      return false;
    }
    
    // Test unsubscribing
    console.log('Testing unsubscribe...');
    const unsubscribeResponse = await makeAuthRequest('POST', `/subscribe/${testChannel}`);
    
    if (unsubscribeResponse.status === 200) {
      console.log('✅ Unsubscription successful');
      console.log('Subscriptions:', unsubscribeResponse.data.subscriptions);
      
      // Verify the subscription was removed
      if (!unsubscribeResponse.data.subscriptions.includes(testChannel)) {
        console.log('✅ Channel correctly removed from subscriptions');
      } else {
        console.error('❌ Channel still found in subscriptions after unsubscribe');
        return false;
      }
    } else {
      console.error('❌ Unexpected unsubscribe response status:', unsubscribeResponse.status);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Subscription test failed:', error.response?.data?.message || error.message);
    
    // Log detailed error information for debugging
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
    
    return false;
  }
}

// Test edge cases
async function testEdgeCases() {
  console.log('\n=== Testing Edge Cases ===');
  
  // Test with invalid channel
  try {
    console.log('Testing invalid channel...');
    const response = await makeAuthRequest('POST', '/subscribe/invalid-channel-name!');
    console.error('❌ Should have failed with invalid channel');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Correctly rejected invalid channel name');
    } else {
      console.error('❌ Unexpected error for invalid channel:', error.response?.data?.message || error.message);
      return false;
    }
  }
  
  // Test with empty sermon data
  try {
    console.log('Testing empty sermon data...');
    const response = await makeAuthRequest('POST', '/sermons', {});
    console.error('❌ Should have failed with empty sermon data');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Correctly rejected empty sermon data');
    } else {
      console.error('❌ Unexpected error for empty sermon:', error.response?.data?.message || error.message);
      return false;
    }
  }
  
  return true;
}

// Main test runner
async function runTests() {
  console.log('🧪 Starting Save and Subscribe Functionality Tests');
  console.log('='.repeat(50));
  
  // Check if server is running
  try {
    await axios.get(`${BASE_URL}/health`);
  } catch (error) {
    console.error('❌ Backend server is not running on localhost:5000');
    console.log('Please start the backend server with: cd backend && npm start');
    process.exit(1);
  }
  
  const tests = [
    { name: 'Authentication', test: testAuthentication },
    { name: 'Sermon Saving', test: testSermonSaving },
    { name: 'Subscription', test: testSubscription },
    { name: 'Edge Cases', test: testEdgeCases }
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    try {
      const result = await test.test();
      if (result) {
        passedTests++;
      }
    } catch (error) {
      console.error(`❌ ${test.name} test failed with error:`, error.message);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Results Summary:');
  console.log(`Passed: ${passedTests}/${totalTests}`);
  console.log(`Failed: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Save and subscribe functionality is working correctly.');
    process.exit(0);
  } else {
    console.log('💥 Some tests failed. Please check the errors above.');
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('💥 Test runner failed:', error.message);
  process.exit(1);
});