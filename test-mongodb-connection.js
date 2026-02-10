/**
 * Test MongoDB Atlas Connection - Using Native Driver
 */

const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://dove_admin:kQt3f0wk2abekE5x@cluster1.xxt8zzi.mongodb.net/?appName=Cluster1';

async function testConnection() {
  console.log('🧪 Testing MongoDB Atlas Connection with native driver...');
  console.log('📡 URI:', uri.replace(/:([^:@]+)@/, ':****@'));
  
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB!');
    
    const adminDb = client.db('admin');
    await adminDb.command({ ping: 1 });
    console.log('✅ Ping successful!');
    
    // List databases
    const dbList = await client.db().admin().listDatabases();
    console.log('📊 Databases:', dbList.databases.map(d => d.name).join(', '));
    
    // Check if dove-ministries exists
    const dbExists = dbList.databases.find(d => d.name === 'dove-ministries');
    if (dbExists) {
      console.log('✅ Database "dove-ministries" exists');
    } else {
      console.log('⚠️  Database "dove-ministries" does not exist yet (will be created automatically)');
    }
    
    await client.close();
    console.log('✅ Connection closed');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Connection failed!');
    console.error('Error:', error.message);
    
    if (error.message.includes('bad auth')) {
      console.log('');
      console.log('💡 Authentication failed. Please check:');
      console.log('   1. Username: dove_admin');
      console.log('   2. Password: kQt3f0wk2abekE5x');
      console.log('   3. Try resetting the password in MongoDB Atlas');
    }
    
    process.exit(1);
  }
}

testConnection();
