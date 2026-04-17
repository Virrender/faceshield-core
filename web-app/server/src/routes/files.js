const express = require('express')
const path    = require('path')
const fs      = require('fs')
const jwt     = require('jsonwebtoken')
const Job     = require('../models/Job')

const router = express.Router()

// GET /api/files/:type/:filename
// type = 'originals' or 'cloaked'
router.get('/:type/:filename', async (req, res) => {
  // Browser <img> requests do not send Authorization headers.
  // Accept token from either Bearer header or ?token= query.
  const authHeader = req.headers['authorization']
  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null
  const token = bearerToken || req.query.token

  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = decoded.userId
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }

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