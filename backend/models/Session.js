const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  mentor:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  student:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentEmail: { type: String, required: true },
  slot:         { type: String, default: 'TBD' },
  message:      { type: String, default: '' },
  status:       { type: String, enum: ['pending','confirmed','cancelled','completed'], default: 'pending' },
  createdAt:    { type: Date, default: Date.now }
});

module.exports = mongoose.model('Session', sessionSchema);
