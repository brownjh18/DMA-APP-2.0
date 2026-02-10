const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true
  },
  contentId: {
    type: mongoose.Schema.Types.Mixed, // Can be ObjectId for database content or String for YouTube videos
    required: true
  },
  contentType: {
    type: String,
    enum: ['sermon', 'podcast', 'live_broadcast'],
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isApproved: {
    type: Boolean,
    default: true // For moderation, but default to true for now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt on save
commentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
commentSchema.index({ contentId: 1, contentType: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);