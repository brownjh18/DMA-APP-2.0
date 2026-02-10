// Test script for user role changing functionality
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testRoleChange() {
  try {
    console.log('🧪 Testing User Role Change Functionality...\n');

    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@doveministriesafrica.org',
      password: 'admin123'
    });

    const adminToken = loginResponse.data.token;
    console.log('✅ Admin login successful');
    console.log('Admin role:', loginResponse.data.user.role);

    // Step 2: Get all users
    console.log('\n2. Fetching all users...');
    const usersResponse = await axios.get(`${BASE_URL}/auth/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const users = usersResponse.data.users;
    console.log(`✅ Found ${users.length} users`);

    // Find a user to test with
    let testUser = users.find(u => u.role === 'user');
    if (!testUser && users.length > 0) {
      testUser = users[0]; // Use first available user if no regular user found
    }

    if (!testUser) {
      console.log('❌ No users found to test with');
      return;
    }

    console.log(`\n3. Testing role change for user: ${testUser.name} (${testUser.email})`);
    console.log('Current role:', testUser.role);

    // Step 3: Change user role to moderator
    console.log('\n4. Changing role to moderator...');
    const updateResponse = await axios.put(`${BASE_URL}/auth/users/${testUser._id}`, {
      role: 'moderator'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const updatedUser = updateResponse.data.user;
    console.log('✅ Role changed successfully!');
    console.log('New role:', updatedUser.role);

    // Step 4: Verify the change persisted
    console.log('\n5. Verifying change persisted...');
    const verifyResponse = await axios.get(`${BASE_URL}/auth/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const verifiedUser = verifyResponse.data.users.find(u => u._id === testUser._id);
    console.log('Verified role:', verifiedUser.role);

    if (verifiedUser.role === 'moderator') {
      console.log('✅ Role change verified successfully!');
    } else {
      console.log('❌ Role change did not persist');
    }

    // Step 5: Change role back to user
    console.log('\n6. Changing role back to user...');
    const revertResponse = await axios.put(`${BASE_URL}/auth/users/${testUser._id}`, {
      role: 'user'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const revertedUser = revertResponse.data.user;
    console.log('✅ Role reverted successfully!');
    console.log('Final role:', revertedUser.role);

    // Step 6: Test invalid role
    console.log('\n7. Testing invalid role (should fail)...');
    try {
      await axios.put(`${BASE_URL}/auth/users/${testUser._id}`, {
        role: 'invalid-role'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('❌ Invalid role was accepted (this should not happen)');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Invalid role correctly rejected');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    console.log('\n🎉 Role change functionality test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

testRoleChange();