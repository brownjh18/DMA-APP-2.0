const mongoose = require('mongoose');
const Devotion = require('../models/Devotion');

require('dotenv').config();

const deleteSeededDevotions = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('Connected to database');

    // Delete devotions with author 'Dove Ministries' (seeded ones)
    const result = await Devotion.deleteMany({ author: 'Dove Ministries' });

    console.log(`Deleted ${result.deletedCount} seeded devotions`);

    console.log('Database cleanup completed');
  } catch (error) {
    console.error('Error deleting seeded devotions:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run if called directly
if (require.main === module) {
  deleteSeededDevotions();
}

module.exports = deleteSeededDevotions;