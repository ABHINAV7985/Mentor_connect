const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:    { type: String, required: true, minlength: 6 },
  role:        { type: String, enum: ['student', 'mentor'], required: true },

  // mentor-only fields
  institution: { type: String, default: '' },
  designation: { type: String, default: '' },
  expertise:   { type: [String], default: [] },
  bio:         { type: String, default: '' },
  experience:  { type: String, default: '' },
  available:   { type: Boolean, default: true },
  sessions:    { type: Number, default: 0 },
  rating:      { type: Number, default: 0 },
  projects:    { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now }
});

// hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// compare password
userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
