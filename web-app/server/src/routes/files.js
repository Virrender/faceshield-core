const express = require('express')
const path    = require('path')
const fs      = require('fs')
const authMiddleware = require('../middleware/authMiddleware')
const Job     = require('../models/Job')

const router = express.Router()

// GET /api/files/:type/:filename
// type = 'originals' or 'cloaked'
router.get('/:type/:filename', authMiddleware, async (req, res) => {
  const { type, filename } = req.params

  if (!['originals', 'cloaked'].includes(type))
    return res.status(400).json({ error: 'Invalid type' })

  // Security: verify this file belongs to the requesting user
  const job = await Job.findOne({ userId: req.userId })
    .where('originalImages.filename').equals(filename)
    .or([
      { 'originalImages': { $elemMatch: { filepath: { $regex: filename } } } },
      { 'cloakedImages':  { $elemMatch: { filepath: { $regex: filename } } } },
    ])

  const filepath = path.join(
    __dirname, '../../uploads', type, filename
  )

  if (!fs.existsSync(filepath))
    return res.status(404).json({ error: 'File not found' })

  res.sendFile(filepath)
})

module.exports = router