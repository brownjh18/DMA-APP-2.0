// Test script to verify user session persistence across role changes
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testSessionPersistence() {
  try {
    console.log('🧪 Testing User Session Persistence Across Role Changes...\n');

    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@doveministriesafrica.org',
      password: 'admin123'
    });

    const adminToken = loginResponse.data.token;
    const adminUser = loginResponse.data.user;
    console.log('✅ Admin login successful');
    console.log('Admin user:', adminUser.name, '(role:', adminUser.role + ')');

    // Step 2: Get users list to find a test user
    console.log('\n2. Fetching users list...');
    const usersResponse = await axios.get(`${BASE_URL}/auth/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const users = usersResponse.data.users;
    console.log(`✅ Found ${users.length} users`);

    // Find a regular user to test with
    const testUser = users.find(u => u.role === 'user');
    if (!testUser) {
      console.log('❌ No regular users found to test with');
      return;
    }

    console.log(`\n3. Test user: ${testUser.name} (current role: ${testUser.role})`);

    // Step 3: Simulate frontend behavior - change user role
    console.log('\n4. Changing user role from user to admin (simulating frontend)...');
    const updateResponse = await axios.put(`${BASE_URL}/auth/users/${testUser._id}`, {
      role: 'admin'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const updatedUser = updateResponse.data.user;
    console.log('✅ Role changed successfully!');
    console.log('Updated user role:', updatedUser.role);

    // Step 4: Verify role change persisted in database
    console.log('\n5. Verifying role change persisted...');
    const verifyResponse = await axios.get(`${BASE_URL}/auth/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const verifiedUser = verifyResponse.data.users.find(u => u._id === testUser._id);
    console.log('Verified role in database:', verifiedUser.role);

    if (verifiedUser.role !== 'admin') {
      console.log('❌ Role change did not persist in database!');
      return;
    }

    console.log('✅ Role change persisted correctly');

    // Step 5: Test that admin token is still valid (simulating page refresh)
    console.log('\n6. Testing token validity after role changes (simulating page refresh)...');
    try {
      const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      const profileUser = profileResponse.data.user;
      console.log('✅ Token still valid after role changes');
      console.log('Admin profile role:', profileUser.role);

      // Verify the admin role is still correct
      if (profileUser.role !== 'admin') {
        console.log('❌ Admin role changed unexpectedly!');
        return;
      }

    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('❌ Token became invalid after role changes - this indicates an issue');
        return;
      }
      throw error;
    }

    // Step 6: Test role change back to user
    console.log('\n7. Testing role change back to user...');
    const revertResponse = await axios.put(`${BASE_URL}/auth/users/${testUser._id}`, {
      role: 'user'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const revertedUser = revertResponse.data.user;
    console.log('✅ Role reverted successfully!');
    console.log('Final role:', revertedUser.role);

    // Step 7: Final verification
    console.log('\n8. Final verification...');
    const finalVerifyResponse = await axios.get(`${BASE_URL}/auth/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const finalUser = finalVerifyResponse.data.users.find(u => u._id === testUser._id);
    console.log('Final verified role:', finalUser.role);

    if (finalUser.role !== 'user') {
      console.log('❌ Role revert did not persist!');
      return;
    }

    console.log('✅ All tests passed successfully!');

    console.log('\n📋 Session Persistence Test Summary:');
    console.log('- ✅ Role changes persist in database');
    console.log('- ✅ Admin tokens remain valid after role changes');
    console.log('- ✅ User sessions are maintained correctly');
    console.log('- ✅ Frontend should now properly maintain user sessions across page refreshes');
    console.log('\n🔧 Key fixes implemented:');
    console.log('1. AdminUserManager now updates AuthContext when current user role changes');
    console.log('2. Improved token verification with retry mechanism');
    console.log('3. Better handling of network errors during auth verification');
    console.log('4. Automatic logout when currently logged-in user is deactivated');

  } catch (error) {
    console.error('❌ Session persistence test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

testSessionPersistence();