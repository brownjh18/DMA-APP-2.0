/**
 * Cloud Storage Service using Cloudinary
 * Required for production deployments (Render, Railway, etc.)
 * because they have ephemeral file systems
 * 
 * Install: npm install cloudinary multer-storage-cloudinary
 */

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Check if Cloudinary is configured
 */
const isConfigured = () => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

/**
 * Get Cloudinary configuration status
 */
const getConfigStatus = () => {
  const configured = isConfigured();
  return {
    configured,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ? '✓ Configured' : '✗ Not configured',
    apiKey: process.env.CLOUDINARY_API_KEY ? '✓ Configured' : '✗ Not configured',
    apiSecret: process.env.CLOUDINARY_API_SECRET ? '✓ Configured' : '✗ Not configured'
  };
};

// Storage configuration for videos
const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'dove-ministries/videos',
    allowed_formats: ['mp4', 'webm', 'mov', 'avi'],
    resource_type: 'video'
  }
});

// Storage configuration for thumbnails
const thumbnailStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'dove-ministries/thumbnails',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    resource_type: 'image'
  }
});

// Storage configuration for audio (podcasts)
const audioStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'dove-ministries/podcasts',
    allowed_formats: ['mp3', 'wav', 'webm', 'm4a'],
    resource_type: 'video' // Cloudinary uses 'video' for audio files
  }
});

// Storage configuration for profile images
const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'dove-ministries/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    resource_type: 'image',
    transformation: [
      { width: 200, height: 200, crop: 'fill', gravity: 'face' }
    ]
  }
});

// Multer upload instances
const uploadVideo = multer({ 
  storage: videoStorage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit for videos
  }
});

const uploadThumbnail = multer({ 
  storage: thumbnailStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for thumbnails
  }
});

const uploadAudio = multer({ 
  storage: audioStorage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for audio
  }
});

const uploadProfile = multer({ 
  storage: profileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for profile images
  }
});

/**
 * Upload file to Cloudinary
 * @param {string} filePath - Local file path
 * @param {object} options - Cloudinary upload options
 * @returns {Promise<object>} Upload result
 */
const uploadFile = async (filePath, options = {}) => {
  if (!isConfigured()) {
    throw new Error('Cloudinary is not configured');
  }

  const defaultOptions = {
    folder: 'dove-ministries',
    resource_type: 'auto'
  };

  const result = await cloudinary.uploader.upload(filePath, {
    ...defaultOptions,
    ...options
  });

  return result;
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<object>} Delete result
 */
const deleteFile = async (publicId) => {
  if (!isConfigured()) {
    throw new Error('Cloudinary is not configured');
  }

  const result = await cloudinary.uploader.destroy(publicId);
  return result;
};

/**
 * Get file URL from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @param {object} options - Transformation options
 * @returns {string} File URL
 */
const getFileUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, options);
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string|null} Public ID or null if not a Cloudinary URL
 */
const extractPublicId = (url) => {
  if (!url || !url.includes('cloudinary.com')) {
    return null;
  }

  try {
    // Extract public ID from Cloudinary URL
    // Format: https://res.cloudinary.com/<cloud_name>/<resource_type>/upload/v<version>/<folder>/<filename>
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    // Find "upload" in the path and take everything after it
    const uploadIndex = pathParts.findIndex(part => part === 'upload');
    if (uploadIndex === -1) return null;

    // Skip "upload", "v<version>" and join the rest
    const publicIdParts = pathParts.slice(uploadIndex + 2);
    const publicId = publicIdParts.join('/').replace(/\.[^/.]+$/, ''); // Remove extension
    
    return publicId;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
};

/**
 * Delete multiple files from Cloudinary
 * @param {string[]} urls - Array of Cloudinary URLs
 * @returns {Promise<void>}
 */
const deleteFiles = async (urls) => {
  if (!isConfigured()) {
    return;
  }

  const deletePromises = urls.map(async (url) => {
    if (!url || !url.includes('cloudinary.com')) {
      return null;
    }
    const publicId = extractPublicId(url);
    if (publicId) {
      try {
        const result = await cloudinary.uploader.destroy(publicId);
        console.log(`☁️ Deleted from Cloudinary: ${publicId}`);
        return result;
      } catch (error) {
        console.error(`☁️ Failed to delete from Cloudinary: ${publicId}`, error.message);
        return null;
      }
    }
    return null;
  });

  await Promise.all(deletePromises);
};

module.exports = {
  cloudinary,
  isConfigured,
  getConfigStatus,
  uploadVideo,
  uploadThumbnail,
  uploadAudio,
  uploadProfile,
  uploadFile,
  deleteFile,
  deleteFiles,
  getFileUrl,
  extractPublicId
};
