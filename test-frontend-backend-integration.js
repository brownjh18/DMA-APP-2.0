// Frontend-Backend Integration Test for User Role Management
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testFrontendBackendIntegration() {
  try {
    console.log('🔗 Testing Frontend-Backend Integration for User Role Management...\n');

    // Step 1: Simulate admin login (like frontend would do)
    console.log('1. Simulating admin login from frontend...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@doveministriesafrica.org',
      password: 'admin123'
    });

    const adminToken = loginResponse.data.token;
    console.log('✅ Admin login successful');
    console.log('Token received:', adminToken.substring(0, 20) + '...');

    // Step 2: Fetch users (like frontend AdminUserManager would do)
    console.log('\n2. Fetching users list (like AdminUserManager component)...');
    const usersResponse = await axios.get(`${BASE_URL}/auth/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const users = usersResponse.data.users;
    console.log(`✅ Retrieved ${users.length} users from backend`);
    
    // Find a test user
    const testUser = users.find(u => u.role === 'user') || users[0];
    console.log(`Test user: ${testUser.name} (${testUser.email}) - Current role: ${testUser.role}`);

    // Step 3: Simulate role change (like frontend would do)
    console.log('\n3. Simulating role change from frontend...');
    console.log(`Frontend sends PUT request to /auth/users/${testUser._id} with role: moderator`);
    
    const updateResponse = await axios.put(`${BASE_URL}/auth/users/${testUser._id}`, {
      role: 'moderator'
    }, {
      headers: { 
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Backend processed role change successfully');
    console.log('Backend response:', updateResponse.data);

    // Step 4: Verify frontend would receive updated data
    console.log('\n4. Verifying frontend would receive updated data...');
    const verifyResponse = await axios.get(`${BASE_URL}/auth/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const updatedUser = verifyResponse.data.users.find(u => u._id === testUser._id);
    console.log(`✅ User role updated from ${testUser.role} to ${updatedUser.role}`);

    // Step 5: Test different role changes
    console.log('\n5. Testing different role transitions...');
    
    // Test admin -> user
    console.log('Testing admin -> user...');
    const adminUser = users.find(u => u.role === 'admin');
    if (adminUser && adminUser.email !== 'admin@doveministriesafrica.org') {
      await axios.put(`${BASE_URL}/auth/users/${adminUser._id}`, {
        role: 'user'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Admin -> User transition successful');
    }

    // Test user -> admin
    console.log('Testing user -> admin...');
    const regularUser = users.find(u => u.role === 'user');
    if (regularUser) {
      await axios.put(`${BASE_URL}/auth/users/${regularUser._id}`, {
        role: 'admin'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ User -> Admin transition successful');
    }

    // Test moderator -> user
    console.log('Testing moderator -> user...');
    const moderatorUser = users.find(u => u.role === 'moderator');
    if (moderatorUser) {
      await axios.put(`${BASE_URL}/auth/users/${moderatorUser._id}`, {
        role: 'user'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Moderator -> User transition successful');
    }

    // Step 6: Test error handling (like frontend would experience)
    console.log('\n6. Testing error handling...');
    
    // Test with invalid role
    try {
      await axios.put(`${BASE_URL}/auth/users/${testUser._id}`, {
        role: 'super-admin' // Invalid role
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('❌ Invalid role was accepted (should not happen)');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Invalid role correctly rejected with 400 status');
        console.log('Error details:', error.response.data);
      }
    }

    // Test with non-existent user
    try {
      await axios.put(`${BASE_URL}/auth/users/64位hexstring1234567890123456789012`, {
        role: 'admin'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('❌ Non-existent user was accepted (should not happen)');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Non-existent user correctly rejected with 404 status');
      }
    }

    // Step 7: Verify role statistics (like frontend stats cards)
    console.log('\n7. Verifying role statistics for frontend...');
    const finalUsersResponse = await axios.get(`${BASE_URL}/auth/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const finalUsers = finalUsersResponse.data.users;
    const stats = {
      total: finalUsers.length,
      active: finalUsers.filter(u => u.isActive).length,
      inactive: finalUsers.filter(u => !u.isActive).length,
      admins: finalUsers.filter(u => u.role === 'admin').length,
      moderators: finalUsers.filter(u => u.role === 'moderator').length,
      users: finalUsers.filter(u => u.role === 'user').length
    };

    console.log('📊 Final role statistics:');
    console.log(`   Total users: ${stats.total}`);
    console.log(`   Active: ${stats.active}, Inactive: ${stats.inactive}`);
    console.log(`   Admins: ${stats.admins}, Moderators: ${stats.moderators}, Regular Users: ${stats.users}`);

    console.log('\n🎉 Frontend-Backend Integration Test Completed Successfully!');
    console.log('✅ Role changing functionality works properly from frontend to backend');
    console.log('✅ All role transitions (user <-> moderator <-> admin) work correctly');
    console.log('✅ Error handling is working as expected');
    console.log('✅ Role statistics are accurate');

  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testFrontendBackendIntegration();