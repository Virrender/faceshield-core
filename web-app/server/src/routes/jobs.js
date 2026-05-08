const express = require('express')
const multer  = require('multer')
const axios   = require('axios')
const path    = require('path')
const fs      = require('fs')
const FormData = require('form-data')

const Job            = require('../models/Job')
const authMiddleware = require('../middleware/authMiddleware')

const router = express.Router()




const modeTimings = { fast: [], balanced: [], strong: [] }

function getEta(mode, count) {
  const arr = modeTimings[mode]
  if (arr.length === 0) return { fast: 45, balanced: 180, strong: 360 }[mode] * count
  const avg = arr.reduce((a, b) => a + b, 0) / arr.length
  return Math.round(avg * count)
}

function recordTiming(mode, seconds) {
  modeTimings[mode].push(seconds)
  if (modeTimings[mode].length > 20) modeTimings[mode].shift() // keep last 20
}

function toFileUrl(filepath, type) {
  if (!filepath) return null
  const filename = require('path').basename(filepath)
  return `/api/files/${type}/${filename}`
}

// Multer — save uploads to disk
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/originals')
    fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, unique + path.extname(file.originalname))
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max per file
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowed.includes(ext)) cb(null, true)
    else cb(new Error('Only JPG and PNG files allowed'))
  }
})

// POST /api/jobs — submit 1-5 images
router.post('/', authMiddleware, upload.array('images', 5), async (req, res) => {
  try {
    const files = req.files
    const mode  = req.body.mode || 'balanced'

    if (!files || files.length === 0)
      return res.status(400).json({ error: 'No images uploaded' })

    if (files.length > 5)
      return res.status(400).json({ error: 'Maximum 5 images per batch' })

    // Create job record immediately
    const job = await Job.create({
      userId: req.userId,
      status: 'pending',
      mode,
      originalImages: files.map(f => ({
        filename: f.originalname,
        filepath: f.path
      })),
      estimatedSeconds:getEta(mode, files.length),
    })

    // Return job ID immediately — don't make React wait
    res.status(202).json({
      jobId:            job._id,
      estimatedSeconds: job.estimatedSeconds,
      message:          'Job queued. Poll /api/jobs/:jobId for status.'
    })

    // Process in background (don't await — fire and forget)
    processJob(job._id, files, mode).catch(err => {
      console.error('Background job failed:', err.message)
    })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Background processing function
async function processJob(jobId, files, mode) {
  console.log(`Processing job ${jobId} with ${files.length} files in ${mode} mode`)
  await Job.findByIdAndUpdate(jobId, { status: 'processing' })

  const results       = []
  const cloakedImages = []
  let jobError = null

  for (const file of files) {
    try {
      // Build multipart form for Python API
      const form = new FormData()
      form.append('file', fs.createReadStream(file.path), {
        filename:    file.originalname,
        contentType: file.mimetype || 'application/octet-stream',
      })
      form.append('mode', mode)

      // Call Python FastAPI
      const response = await axios.post(
        `${process.env.PYTHON_SERVICE_URL}/cloak`,
        form,
        {
          headers:      form.getHeaders(),
          responseType: 'arraybuffer',
          timeout:      600000, // 10 min timeout
        }
      )

      // Parse metrics from response header (optional)
      let metrics = null
      const metricsHeader = response.headers?.['x-metrics']
      if (metricsHeader) {
        try {
          metrics = JSON.parse(metricsHeader)
        } catch (e) {
          // keep going; cloaked image may still be valid
          metrics = null
        }
      }
      const elapsed  = parseFloat(response.headers['x-elapsed'] || '0')
      // Record real timing for future ETA estimates
      if (elapsed > 0) recordTiming(mode, elapsed)

      // Save cloaked PNG to disk
      const cloakedDir  = path.join(__dirname, '../../uploads/cloaked')
      fs.mkdirSync(cloakedDir, { recursive: true })
      const cloakedPath = path.join(cloakedDir, 'cloaked-' + path.basename(file.path, path.extname(file.path)) + '.png')
      fs.writeFileSync(cloakedPath, response.data)

      cloakedImages.push({ filename: 'cloaked-' + file.originalname, filepath: cloakedPath })
      results.push({
        originalFilename:  file.originalname,
        cosine_similarity: metrics?.cosine_similarity,
        ssim:              metrics?.ssim,
        psnr:              metrics?.psnr,
        verdict:           metrics?.verdict,
      })

    } catch (err) {
      let detail = err.message
      // If Python returned a JSON error body, surface it.
      if (err.response?.data) {
        try {
          const raw = Buffer.isBuffer(err.response.data)
            ? err.response.data.toString('utf8')
            : String(err.response.data)
          detail = raw
        } catch (e) {
          // ignore decoding issues
        }
      }

      jobError = jobError || detail
      results.push({
        originalFilename: file.originalname,
        error:            detail,
      })
    }
  }

  const update = {
    cloakedImages,
    results,
    completedAt: new Date(),
  }

  // If nothing was actually produced, mark job failed so UI can show a clear error.
  if (cloakedImages.length === 0) {
    await Job.findByIdAndUpdate(jobId, {
      ...update,
      status: 'failed',
      error: jobError || 'No cloaked images were generated',
    })
    return
  }

  await Job.findByIdAndUpdate(jobId, { ...update, status: 'done' })
}

// GET /api/jobs/:jobId — poll for status
router.get('/:jobId', authMiddleware, async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.jobId, userId: req.userId })
    if (!job) return res.status(404).json({ error: 'Job not found' })

    // Attach public URLs for the frontend to display
    const jobObj = job.toObject()
    if (jobObj.status === 'done' && (!jobObj.cloakedImages || jobObj.cloakedImages.length === 0)) {
      jobObj.status = 'failed'
      jobObj.error = jobObj.error || 'Cloaking finished without producing any cloaked images'
    }
    jobObj.imageUrls = {
      originals: job.originalImages.map(img => ({
        filename: img.filename,
        url:      toFileUrl(img.filepath, 'originals')
      })),
      cloaked: job.cloakedImages.map(img => ({
        filename: img.filename,
        url:      toFileUrl(img.filepath, 'cloaked')
      })),
    }

    res.json({ job: jobObj })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/jobs — history
router.get('/', authMiddleware, async (req, res) => {
  try {
    const jobs = await Job.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(100)

    const jobsWithUrls = jobs.map(job => {
      const obj = job.toObject()
      if (obj.status === 'done' && (!obj.cloakedImages || obj.cloakedImages.length === 0)) {
        obj.status = 'failed'
        obj.error = obj.error || 'Cloaking finished without producing any cloaked images'
      }
      obj.imageUrls = {
        originals: job.originalImages.map(img => ({
          filename: img.filename,
          url: toFileUrl(img.filepath, 'originals'),
        })),
        cloaked: job.cloakedImages.map(img => ({
          filename: img.filename,
          url: toFileUrl(img.filepath, 'cloaked'),
        })),
      }
      return obj
    })

    res.json({ jobs: jobsWithUrls })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/files/:type/:filename — serve images
router.get('/files/:type/:filename', authMiddleware, (req, res) => {
  const { type, filename } = req.params

  if (!['originals', 'cloaked'].includes(type))
    return res.status(400).json({ error: 'Invalid file type' })

  const filepath = path.join(__dirname, '../../uploads', type, filename)

  if (!fs.existsSync(filepath))
    return res.status(404).json({ error: 'File not found' })

  res.sendFile(filepath)
})

module.exports = router