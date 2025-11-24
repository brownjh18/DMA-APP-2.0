const mongoose = require('mongoose');

const devotionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  scripture: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  reflection: {
    type: String,
    required: true
  },
  prayer: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  author: {
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
devotionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for search
devotionSchema.index({ title: 'text', content: 'text', scripture: 'text', reflection: 'text' });

module.exports = mongoose.model('Devotion', devotionSchema);