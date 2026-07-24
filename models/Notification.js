const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['sermon', 'podcast', 'devotion', 'event', 'ministry', 'prayer', 'general'],
    default: 'general'
  },
  contentType: {
    type: String,
    enum: ['sermon', 'podcast', 'devotion', 'event', 'ministry'],
    default: null
  },
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  thumbnailUrl: {
    type: String,
    default: null
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
