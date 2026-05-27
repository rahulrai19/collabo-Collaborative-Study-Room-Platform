const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  avatar:   { type: String, default: '' },
  totalStudyTime: { type: Number, default: 0 }, // in seconds
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
