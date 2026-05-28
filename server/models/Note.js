const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  year: { type: String, required: true },
  fileUrl: { type: String }, // Now optional, generated dynamically
  fileName: { type: String, required: true },
  fileType: { type: String, required: true },
  fileData: { type: Buffer }, // Store binary data
  fileContentType: { type: String }, // Store mimetype
  uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  downloads: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Note', noteSchema);
