const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donorName: {
    type: String,
    required: true,
    trim: true
  },
  donorEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  type: {
    type: String,
    enum: ['one-time', 'monthly', 'yearly'],
    default: 'one-time'
  },
  purpose: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bank_transfer', 'mobile_money', 'other'],
    default: 'other'
  },
  transactionId: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for efficient queries
donationSchema.index({ donorEmail: 1 });
donationSchema.index({ status: 1 });
donationSchema.index({ type: 1 });
donationSchema.index({ createdAt: -1 });

// Virtual for formatted amount
donationSchema.virtual('formattedAmount').get(function() {
  return `$${this.amount.toFixed(2)}`;
});

// Method to mark as completed
donationSchema.methods.markCompleted = function(transactionId = null) {
  this.status = 'completed';
  if (transactionId) {
    this.transactionId = transactionId;
  }
  return this.save();
};

// Method to cancel donation
donationSchema.methods.cancel = function() {
  this.status = 'cancelled';
  return this.save();
};

// Static method to get total donations
donationSchema.statics.getTotalAmount = function(status = 'completed') {
  return this.aggregate([
    { $match: { status } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
};

module.exports = mongoose.model('Donation', donationSchema);