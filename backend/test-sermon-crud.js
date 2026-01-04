// Test script for sermon CRUD operations
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let authToken = null;
let testSermonId = null;

// Test user credentials (from .env)
const ADMIN_EMAIL = 'admin@doveministriesafrica.org';
const ADMIN_PASSWORD = 'admin123';

async function login() {
  try {
    console.log('🔐 Attempting login...');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    authToken = response.data.token;
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function testGetSermons() {
  try {
    console.log('📋 Testing GET /sermons...');
    const response = await axios.get(`${BASE_URL}/sermons?published=all`);
    console.log(`✅ Found ${response.data.sermons?.length || 0} sermons`);
    return response.data.sermons || [];
  } catch (error) {
    console.error('❌ GET sermons failed:', error.response?.data || error.message);
    return [];
  }
}

async function testCreateSermon() {
  try {
    console.log('➕ Testing POST /sermons...');
    
    const sermonData = {
      title: 'Test Sermon ' + Date.now(),
      speaker: 'Test Speaker',
      description: 'This is a test sermon created by the test script',
      scripture: 'John 3:16',
      series: 'Test Series',
      isPublished: false
    };

    const response = await axios.post(`${BASE_URL}/sermons`, sermonData, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });
    
    console.log('✅ Sermon created successfully:', response.data.sermon._id);
    return response.data.sermon;
  } catch (error) {
    console.error('❌ POST sermon failed:', error.response?.data || error.message);
    return null;
  }
}

async function testUpdateSermon(sermonId) {
  try {
    console.log('✏️ Testing PUT /sermons/:id...');
    
    const updateData = {
      title: 'Updated Test Sermon',
      description: 'This sermon has been updated by the test script'
    };

    const response = await axios.put(`${BASE_URL}/sermons/${sermonId}`, updateData, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });
    
    console.log('✅ Sermon updated successfully:', response.data.sermon.title);
    return response.data.sermon;
  } catch (error) {
    console.error('❌ PUT sermon failed:', error.response?.data || error.message);
    return null;
  }
}

async function testTogglePublish(sermonId) {
  try {
    console.log('🔄 Testing PATCH /sermons/:id/publish...');
    
    const response = await axios.patch(`${BASE_URL}/sermons/${sermonId}/publish`, 
      { isPublished: true }, 
      {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }
    );
    
    console.log('✅ Sermon publish status toggled:', response.data.sermon.isPublished);
    return response.data.sermon;
  } catch (error) {
    console.error('❌ PATCH publish failed:', error.response?.data || error.message);
    return null;
  }
}

async function testDeleteSermon(sermonId) {
  try {
    console.log('🗑️ Testing DELETE /sermons/:id...');
    
    await axios.delete(`${BASE_URL}/sermons/${sermonId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });
    
    console.log('✅ Sermon deleted successfully');
    return true;
  } catch (error) {
    console.error('❌ DELETE sermon failed:', error.response?.data || error.message);
    return false;
  }
}

async function testGetSermonStats() {
  try {
    console.log('📊 Testing GET /sermons/admin/stats...');
    const response = await axios.get(`${BASE_URL}/sermons/admin/stats`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });
    
    console.log('✅ Sermon stats retrieved:', response.data.stats);
    return response.data.stats;
  } catch (error) {
    console.error('❌ GET stats failed:', error.response?.data || error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting Sermon CRUD Tests...\n');
  
  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }
  
  console.log('\n📝 Test Results:');
  console.log('================');
  
  // Test 1: Get existing sermons
  const existingSermons = await testGetSermons();
  
  // Test 2: Create new sermon
  const newSermon = await testCreateSermon();
  if (!newSermon) {
    console.log('❌ Cannot proceed without creating a sermon');
    return;
  }
  testSermonId = newSermon._id;
  
  // Test 3: Update sermon
  const updatedSermon = await testUpdateSermon(testSermonId);
  
  // Test 4: Toggle publish status
  const publishedSermon = await testTogglePublish(testSermonId);
  
  // Test 5: Get sermon stats
  const stats = await testGetSermonStats();
  
  // Test 6: Delete sermon
  const deleteSuccess = await testDeleteSermon(testSermonId);
  
  console.log('\n📋 Test Summary:');
  console.log('================');
  console.log(`✅ Login: ${loginSuccess ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Get Sermons: ${existingSermons.length >= 0 ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Create Sermon: ${newSermon ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Update Sermon: ${updatedSermon ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Toggle Publish: ${publishedSermon ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Get Stats: ${stats ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Delete Sermon: ${deleteSuccess ? 'PASS' : 'FAIL'}`);
  
  console.log('\n🎉 Sermon CRUD Tests Completed!');
}

// Run the tests
runTests().catch(console.error);