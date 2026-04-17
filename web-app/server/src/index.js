require('dotenv').config()
const express  = require('express')
const mongoose = require('mongoose')
const cors     = require('cors')
const path     = require('path')

const authRoutes = require('./routes/auth')
const jobRoutes  = require('./routes/jobs')

const app = express()

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
]

app.use(cors({
  origin(origin, callback) {
    // Allow same-origin or non-browser requests (no Origin header)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`))
  }
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/jobs', jobRoutes)
app.use('/api/files', require('./routes/files'))

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

// Connect to MongoDB then start server
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected')
    app.listen(process.env.PORT, () => {
      console.log(`Node server running on http://localhost:${process.env.PORT}`)
    })
  })
  .catch(err => {
    console.error('MongoDB connection failed:', err.message)
    process.exit(1)
  })