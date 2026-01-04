const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  churchName: {
    type: String,
    required: true,
    default: 'Dove Ministries Africa'
  },
  address: {
    type: String,
    required: true,
    default: '123 Faith Street, Kampala, Uganda'
  },
  phone: {
    type: String,
    required: true,
    default: '+256 123 456 789'
  },
  email: {
    type: String,
    required: true,
    default: 'info@doveministriesafrica.org'
  },
  serviceTimes: {
    type: String,
    required: true,
    default: 'Sundays: 8:00 AM & 10:30 AM\nWednesdays: 7:00 PM'
  },
  about: {
    type: String,
    required: true,
    default: 'Dove Ministries Africa is a vibrant church community dedicated to spreading God\'s love and serving our community through worship, fellowship, and outreach programs.'
  },
  mission: {
    type: String,
    required: true,
    default: 'To bring hope, healing, and transformation to lives through the power of God\'s love.'
  },
  // Founders information
  founders: [{
    name: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    imageUrl: {
      type: String,
      default: ''
    }
  }],
  isPublished: {
    type: Boolean,
    default: true
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

// Update the updatedAt field before saving
contactSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Contact', contactSchema);