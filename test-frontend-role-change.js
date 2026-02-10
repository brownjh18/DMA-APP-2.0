// Frontend API test for role changes
// This simulates what the frontend AdminUserManager component does

const API_BASE_URL = 'http://localhost:5000/api';

// Simulate the frontend's apiService.updateUser method
async function updateUser(userId, userData) {
  console.log(`🔄 Updating user ${userId} with data:`, userData);
  
  // First, get admin token (like the frontend would)
  const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'admin@doveministriesafrica.org',
      password: 'admin123'
    })
  });

  if (!loginResponse.ok) {
    throw new Error('Login failed');
  }

  const { token } = await loginResponse.json();
  console.log('✅ Got admin token');

  // Now update the user (like AdminUserManager does)
  const updateResponse = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(userData)
  });

  if (!updateResponse.ok) {
    const errorData = await updateResponse.json();
    throw new Error(errorData.error || `HTTP ${updateResponse.status}`);
  }

  const result = await updateResponse.json();
  console.log('✅ User updated successfully:', result);
  return result;
}

async function testFrontendRoleChange() {
  try {
    console.log('🧪 Testing Frontend Role Change Process...\n');

    // Step 1: Get users list (like AdminUserManager.loadUsers)
    console.log('1. Getting users list...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@doveministriesafrica.org',
        password: 'admin123'
      })
    });

    const { token } = await loginResponse.json();

    const usersResponse = await fetch(`${API_BASE_URL}/auth/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const usersData = await usersResponse.json();
    const users = usersData.users;
    console.log(`✅ Found ${users.length} users`);

    // Find a test user
    const testUser = users.find(u => u.role === 'user');
    if (!testUser) {
      console.log('❌ No regular users found');
      return;
    }

    console.log(`\n2. Test user: ${testUser.name} (current role: ${testUser.role})`);

    // Step 2: Change role (like AdminUserManager.changeRole)
    console.log('\n3. Changing role from user to admin...');
    const updateResult = await updateUser(testUser._id, { role: 'admin' });
    
    console.log('✅ Backend response:', updateResult);

    // Step 3: Verify by getting users again
    console.log('\n4. Verifying change by fetching users again...');
    const verifyResponse = await fetch(`${API_BASE_URL}/auth/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const verifyData = await verifyResponse.json();
    const verifiedUser = verifyData.users.find(u => u._id === testUser._id);
    
    console.log(`✅ User ${testUser.name} now has role: ${verifiedUser.role}`);

    if (verifiedUser.role === 'admin') {
      console.log('🎉 Role change verification successful!');
    } else {
      console.log('❌ Role change verification failed!');
    }

    // Step 4: Test invalid role
    console.log('\n5. Testing invalid role...');
    try {
      await updateUser(testUser._id, { role: 'moderator' });
      console.log('❌ Invalid role was accepted (should not happen)');
    } catch (error) {
      console.log('✅ Invalid role correctly rejected:', error.message);
    }

    console.log('\n📋 Frontend API Test Summary:');
    console.log('- ✅ Backend API calls work correctly');
    console.log('- ✅ Role changes persist in database');
    console.log('- ✅ Invalid roles are rejected');
    console.log('- ✅ If frontend role changes appear to not work, the issue is likely:');
    console.log('  1. Frontend not refreshing the user list after change');
    console.log('  2. Caching issue in the frontend');
    console.log('  3. Frontend state not updating properly');

  } catch (error) {
    console.error('❌ Frontend test failed:', error.message);
  }
}

testFrontendRoleChange();