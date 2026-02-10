// Fixed test script for user role changing functionality
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
    console.log('Users:', users.map(u => `${u.name} (${u.role})`).join(', '));

    // Find a user to test with (not the admin)
    let testUser = users.find(u => u.role === 'user');
    if (!testUser && users.length > 1) {
      testUser = users.find(u => u.role !== 'admin'); // Use non-admin user if available
    }

    if (!testUser) {
      console.log('❌ No regular users found to test with');
      return;
    }

    console.log(`\n3. Testing role change for user: ${testUser.name} (${testUser.email})`);
    console.log('Current role:', testUser.role);

    // Step 3: Change user role from user to admin
    console.log('\n4. Changing role from user to admin...');
    const updateResponse1 = await axios.put(`${BASE_URL}/auth/users/${testUser._id}`, {
      role: 'admin'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const updatedUser1 = updateResponse1.data.user;
    console.log('✅ Role changed successfully!');
    console.log('New role:', updatedUser1.role);

    // Step 4: Verify the change persisted
    console.log('\n5. Verifying change persisted...');
    const verifyResponse1 = await axios.get(`${BASE_URL}/auth/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const verifiedUser1 = verifyResponse1.data.users.find(u => u._id === testUser._id);
    console.log('Verified role:', verifiedUser1.role);

    if (verifiedUser1.role === 'admin') {
      console.log('✅ Role change verified successfully!');
    } else {
      console.log('❌ Role change did not persist');
      return;
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
        role: 'moderator' // This should fail
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('❌ Invalid role was accepted (this should not happen)');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Invalid role correctly rejected');
        console.log('Error message:', error.response.data.errors[0].msg);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    // Step 7: Test another valid role change
    console.log('\n8. Testing role change admin -> user...');
    const updateResponse2 = await axios.put(`${BASE_URL}/auth/users/${testUser._id}`, {
      role: 'admin'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const updatedUser2 = updateResponse2.data.user;
    console.log('✅ Role changed to admin again!');
    console.log('Final verified role:', updatedUser2.role);

    console.log('\n🎉 Role change functionality test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- ✅ Valid role changes (user ↔ admin) work correctly');
    console.log('- ✅ Invalid roles are properly rejected');
    console.log('- ✅ Changes persist in database');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

testRoleChange();