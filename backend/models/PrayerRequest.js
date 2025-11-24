const mongoose = require('mongoose');

const prayerRequestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  request: {
    type: String,
    required: true
  },
  isConfidential: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    enum: ['personal', 'family', 'health', 'spiritual', 'ministry', 'community', 'other'],
    default: 'other'
  },
  isAnswered: {
    type: Boolean,
    default: false
  },
  answeredDate: {
    type: Date
  },
  answeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  response: {
    type: String,
    trim: true
  },
  followUpNeeded: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tags: [{
    type: String,
    trim: true
  }],
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
prayerRequestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for search
prayerRequestSchema.index({ name: 'text', email: 'text', request: 'text', response: 'text' });

module.exports = mongoose.model('PrayerRequest', prayerRequestSchema);