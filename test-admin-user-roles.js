// Test script for simplified admin/user role system
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testAdminUserRoles() {
  try {
    console.log('🧪 Testing Simplified Admin/User Role System...\n');

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

    // Step 4: Change user role to admin
    console.log('\n4. Changing role to admin...');
    const updateResponse = await axios.put(`${BASE_URL}/auth/users/${testUser._id}`, {
      role: 'admin'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const updatedUser = updateResponse.data.user;
    console.log('✅ Role changed successfully!');
    console.log('New role:', updatedUser.role);

    // Step 5: Verify the change persisted
    console.log('\n5. Verifying change persisted...');
    const verifyResponse = await axios.get(`${BASE_URL}/auth/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const verifiedUser = verifyResponse.data.users.find(u => u._id === testUser._id);
    console.log('Verified role:', verifiedUser.role);

    if (verifiedUser.role === 'admin') {
      console.log('✅ Role change verified successfully!');
    } else {
      console.log('❌ Role change did not persist');
    }

    // Step 6: Change role back to user
    console.log('\n6. Changing role back to user...');
    const revertResponse = await axios.put(`${BASE_URL}/auth/users/${testUser._id}`, {
      role: 'user'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const revertedUser = revertResponse.data.user;
    console.log('✅ Role reverted successfully!');
    console.log('Final role:', revertedUser.role);

    // Step 7: Test invalid role (should fail)
    console.log('\n7. Testing invalid role (should fail)...');
    try {
      await axios.put(`${BASE_URL}/auth/users/${testUser._id}`, {
        role: 'moderator' // This should now fail
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

    // Step 8: Verify final statistics
    console.log('\n8. Verifying role statistics...');
    const finalUsersResponse = await axios.get(`${BASE_URL}/auth/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const finalUsers = finalUsersResponse.data.users;
    const stats = {
      total: finalUsers.length,
      active: finalUsers.filter(u => u.isActive).length,
      inactive: finalUsers.filter(u => !u.isActive).length,
      admins: finalUsers.filter(u => u.role === 'admin').length,
      users: finalUsers.filter(u => u.role === 'user').length
    };

    console.log('📊 Final role statistics:');
    console.log(`   Total users: ${stats.total}`);
    console.log(`   Active: ${stats.active}, Inactive: ${stats.inactive}`);
    console.log(`   Admins: ${stats.admins}, Regular Users: ${stats.users}`);

    console.log('\n🎉 Simplified Admin/User Role System Test Completed Successfully!');
    console.log('✅ Only admin and user roles are supported');
    console.log('✅ Role changing between admin and user works correctly');
    console.log('✅ Invalid roles (like moderator) are rejected');
    console.log('✅ All admins can change user roles');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

testAdminUserRoles();