const mongoose = require('mongoose')

const jobSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status:   { type: String, enum: ['pending', 'processing', 'done', 'failed'], default: 'pending' },
  mode:     { type: String, enum: ['fast', 'balanced', 'strong'], default: 'balanced' },

  // Image file paths on disk
  originalImages: [{ filename: String, filepath: String }],
  cloakedImages:  [{ filename: String, filepath: String }],

  // Results per image
  results: [{
    originalFilename: String,
    cosine_similarity: Number,
    ssim:              Number,
    psnr:              Number,
    verdict:           String,
  }],

  // Timing
  estimatedSeconds: Number,
  createdAt:        { type: Date, default: Date.now },
  completedAt:      Date,
  error:            String,
})

module.exports = mongoose.model('Job', jobSchema)