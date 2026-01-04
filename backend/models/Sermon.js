const mongoose = require('mongoose');

const sermonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  speaker: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  scripture: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  duration: {
    type: String,
    trim: true
  },
  videoUrl: {
    type: String,
    trim: true
  },
  audioUrl: {
    type: String,
    trim: true
  },
  youtubeId: {
    type: String,
    trim: true
  },
  thumbnailUrl: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  series: {
    type: String,
    trim: true
  },
  viewCount: {
    type: Number,
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    enum: ['sermon', 'podcast', 'live_broadcast'],
    default: 'sermon'
  },
  isLive: {
    type: Boolean,
    default: false
  },
  streamUrl: {
    type: String,
    trim: true
  },
  broadcastStartTime: {
    type: Date
  },
  broadcastEndTime: {
    type: Date
  },
  recordingStatus: {
    type: String,
    enum: ['none', 'recording', 'completed', 'failed'],
    default: 'none'
  },
  recordingPid: {
    type: Number
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Temporarily make optional for testing
  },
  lastListenIncrement: {
    type: Number,
    default: 0
  },
  youtubeComments: [{
    author: { type: String, trim: true },
    text: { type: String, trim: true },
    publishedAt: { type: Date },
    authorChannelUrl: { type: String, trim: true },
    likeCount: { type: Number, default: 0 }
  }],
  subscribeUrl: {
    type: String,
    trim: true
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
sermonSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for search
sermonSchema.index({ title: 'text', description: 'text', speaker: 'text', tags: 'text' });

module.exports = mongoose.model('Sermon', sermonSchema);