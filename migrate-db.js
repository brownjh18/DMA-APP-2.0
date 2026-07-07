const mongoose = require('mongoose');

const BASE = 'mongodb+srv://dove_admin:kQt3f0wk2abekE5x@cluster1.xxt8zzi.mongodb.net';
const SOURCE_URI = `${BASE}/test?appName=Cluster1`;
const TARGET_URI = `${BASE}/dmaApp?appName=Cluster1`;

async function migrate() {
  console.log('🔄 Connecting to source database (test)...');
  const sourceConn = await mongoose.createConnection(SOURCE_URI).asPromise();
  console.log('✅ Source connected');

  console.log('🔄 Connecting to target database (dmaApp)...');
  const targetConn = await mongoose.createConnection(TARGET_URI).asPromise();
  console.log('✅ Target connected');

  const sourceDb = sourceConn.db;
  const targetDb = targetConn.db;

  const collections = await sourceDb.listCollections().toArray();
  console.log(`📂 Found ${collections.length} collections in source: ${collections.map(c => c.name).join(', ')}`);

  let totalDocs = 0;

  for (const coll of collections) {
    const name = coll.name;
    const docs = await sourceDb.collection(name).find({}).toArray();

    if (docs.length === 0) {
      console.log(`   ⏭️  ${name}: 0 docs (skipped)`);
      continue;
    }

    try {
      await targetDb.collection(name).deleteMany({});
      await targetDb.collection(name).insertMany(docs, { ordered: false });
      console.log(`   ✅ ${name}: ${docs.length} docs copied`);
      totalDocs += docs.length;
    } catch (err) {
      console.error(`   ❌ ${name}: error - ${err.message}`);
    }
  }

  console.log(`\n🎉 Migration complete! ${totalDocs} documents copied from test → dmaApp`);

  await sourceConn.close();
  await targetConn.close();
  process.exit(0);
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
