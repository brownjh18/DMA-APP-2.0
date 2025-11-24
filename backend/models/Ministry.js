const mongoose = require('mongoose');

const ministrySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  leader: {
    type: String,
    trim: true
  },
  activities: [{
    type: String,
    trim: true
  }],
  meetingSchedule: {
    type: String,
    trim: true
  },
  contactEmail: {
    type: String,
    trim: true
  },
  contactPhone: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['worship', 'youth', 'children', 'evangelism', 'intercessions', 'married-couples', 'other'],
    default: 'other'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  memberCount: {
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
ministrySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for search
ministrySchema.index({ name: 'text', description: 'text', leader: 'text', activities: 'text' });

module.exports = mongoose.model('Ministry', ministrySchema);