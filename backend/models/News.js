const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    trim: true
  },
  author: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['announcement', 'ministry-update', 'event', 'testimony', 'community', 'other'],
    default: 'other'
  },
  imageUrl: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPublished: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  publishDate: {
    type: Date,
    default: Date.now
  },
  viewCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
newsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for search
newsSchema.index({ title: 'text', content: 'text', excerpt: 'text', author: 'text' });

module.exports = mongoose.model('News', newsSchema);