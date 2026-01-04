const mongoose = require('mongoose');
const Sermon = require('../models/Sermon');
const User = require('../models/User');

require('dotenv').config();

const deleteNonAdminSermons = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('Connected to database');

    // Find admin user
    const adminUser = await User.findOne({ email: process.env.ADMIN_EMAIL });
    if (!adminUser) {
      console.error('Admin user not found');
      return;
    }

    console.log(`Admin user found: ${adminUser._id}`);

    // Delete sermons not created by admin
    const result = await Sermon.deleteMany({ createdBy: { $ne: adminUser._id } });

    console.log(`Deleted ${result.deletedCount} sermons not created by admin`);

    console.log('Cleanup completed');
  } catch (error) {
    console.error('Error deleting sermons:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run if called directly
if (require.main === module) {
  deleteNonAdminSermons();
}

module.exports = deleteNonAdminSermons;