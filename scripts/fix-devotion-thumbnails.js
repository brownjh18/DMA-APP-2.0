/**
 * Script to fix invalid thumbnail URLs for devotions
 * Run this to clear broken thumbnail URLs so the default is shown
 * 
 * Usage: node scripts/fix-devotion-thumbnails.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Devotion = require('../models/Devotion');

// MongoDB connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dma-app';

async function fixDevotionThumbnails() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    
    // Clear thumbnailUrl for all devotions
    // This will make them use the default /hero-evangelism.jpg
    const result = await Devotion.updateMany(
      {},
      { $unset: { thumbnailUrl: "" } }
    );
    
    console.log(`\n✅ Fixed ${result.modifiedCount} devotions`);
    console.log(`   All devotions will now use the default /hero-evangelism.jpg\n`);
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Error fixing devotion thumbnails:', error);
    process.exit(1);
  }
}

fixDevotionThumbnails();
