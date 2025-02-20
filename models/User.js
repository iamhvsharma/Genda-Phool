const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  whatsappNumber: {
    type: String,
    required: true,
    unique: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);