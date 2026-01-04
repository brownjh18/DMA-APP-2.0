const mongoose = require('mongoose');
const Sermon = require('../models/Sermon');

require('dotenv').config();

const deleteAllPodcasts = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('Connected to database');

    // Delete all podcasts (sermons with type: 'podcast')
    const result = await Sermon.deleteMany({ type: 'podcast' });

    console.log(`Deleted ${result.deletedCount} podcasts`);

    console.log('Database cleanup completed');
  } catch (error) {
    console.error('Error deleting podcasts:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run if called directly
if (require.main === module) {
  deleteAllPodcasts();
}

module.exports = deleteAllPodcasts;