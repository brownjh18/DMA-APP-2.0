const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Password required only if not a Google user
    }
  },
  googleId: {
    type: String,
    sparse: true // Allows multiple null values but unique non-null values
  },
  role: {
    type: String,
    enum: ['admin', 'moderator', 'user'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profilePicture: {
    type: String
  },
  phone: {
    type: String,
    trim: true
  },
  lastLogin: {
    type: Date
  },
  subscriptions: [{
    type: String, // Could be ministry/channel names or IDs
    trim: true
  }],
  savedSermons: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sermon'
  }],
  savedPodcasts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Podcast'
  }],
  savedDevotions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Devotion'
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

// Hash password before saving (only for non-Google users)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Update updatedAt on save
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);