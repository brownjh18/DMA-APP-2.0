/**
 * Script to refresh video durations for sermons with "00:00" duration
 * 
 * Usage: node backend/scripts/refresh-sermon-durations.js
 * 
 * This script will:
 * 1. Find all sermons with duration "00:00" that have Cloudinary video URLs
 * 2. Poll Cloudinary for the actual duration
 * 3. Update the sermon with the correct duration
 */

require('dotenv').config();
const mongoose = require('mongoose');
const cloudStorage = require('../services/cloudStorage');
const Sermon = require('../models/Sermon');

// Cloudinary configuration
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary if not already configured
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('Cloudinary configured');
} else {
  console.error('Cloudinary credentials not found in environment variables');
  process.exit(1);
}

// Helper function to get video duration from Cloudinary with polling
async function getCloudinaryDuration(publicId, maxRetries = 30, initialDelayMs = 2000) {
  let currentDelay = initialDelayMs;
  
  console.log(`🎬 Polling Cloudinary for: ${publicId}`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await cloudinary.api.resource(publicId, { resource_type: 'video' });
      
      if (result && result.duration !== null && result.duration !== undefined) {
        const totalSeconds = Math.floor(result.duration);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        let duration = '';
        if (hours > 0) {
          duration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
          duration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        console.log(`✅ Got duration: ${duration} (${totalSeconds}s)`);
        return duration;
      }
      
      console.log(`⏳ Attempt ${attempt}/${maxRetries}: Video still processing...`);
      
      if (attempt < maxRetries) {
        currentDelay = Math.min(currentDelay * 1.5, 10000);
        await new Promise(resolve => setTimeout(resolve, currentDelay));
      }
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        currentDelay = Math.min(currentDelay * 1.5, 10000);
        await new Promise(resolve => setTimeout(resolve, currentDelay));
      }
    }
  }
  
  console.error(`❌ Failed to get duration after ${maxRetries} attempts`);
  return null;
}

async function refreshSermonDurations() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dma-app';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    
    // Find sermons with "00:00" duration that have Cloudinary URLs
    const sermonsToFix = await Sermon.find({
      duration: '00:00',
      videoUrl: { $regex: /cloudinary\.com/ }
    });
    
    console.log(`\n📋 Found ${sermonsToFix.length} sermons with "00:00" duration\n`);
    
    if (sermonsToFix.length === 0) {
      console.log('No sermons need duration refresh');
      await mongoose.disconnect();
      return;
    }
    
    let fixed = 0;
    let failed = 0;
    
    for (const sermon of sermonsToFix) {
      console.log(`\n📺 Processing: ${sermon.title}`);
      console.log(`   Video URL: ${sermon.videoUrl}`);
      
      // Extract public ID
      let publicId = cloudStorage.extractPublicId(sermon.videoUrl);
      
      if (!publicId) {
        const match = sermon.videoUrl.match(/\/v\d+\/(.+)$/);
        if (match && match[1]) {
          publicId = match[1];
        }
      }
      
      if (!publicId) {
        console.error(`   ❌ Could not extract public ID`);
        failed++;
        continue;
      }
      
      console.log(`   Public ID: ${publicId}`);
      
      // Get duration from Cloudinary
      const newDuration = await getCloudinaryDuration(publicId);
      
      if (newDuration && newDuration !== '00:00') {
        const oldDuration = sermon.duration;
        sermon.duration = newDuration;
        await sermon.save();
        
        console.log(`   ✅ Updated: ${oldDuration} -> ${newDuration}`);
        fixed++;
      } else {
        console.error(`   ❌ Could not get valid duration`);
        failed++;
      }
      
      // Small delay between sermons to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Fixed: ${fixed}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Total: ${sermonsToFix.length}`);
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    
  } catch (error) {
    console.error('Error refreshing sermon durations:', error);
    process.exit(1);
  }
}

// Run the script
refreshSermonDurations();
