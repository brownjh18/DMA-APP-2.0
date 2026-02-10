const mongoose = require('mongoose');
const Sermon = require('../models/Sermon');

require('dotenv').config();

const deleteAllSermons = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('Connected to database');

    // Delete all sermons
    const result = await Sermon.deleteMany({});

    console.log(`Deleted ${result.deletedCount} sermons`);

    console.log('Database cleanup completed');
  } catch (error) {
    console.error('Error deleting sermons:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run if called directly
if (require.main === module) {
  deleteAllSermons();
}

module.exports = deleteAllSermons;