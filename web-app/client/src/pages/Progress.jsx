import { useState, useEffect, useRef } from 'react'
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Clock, Shield, Zap, Scale, Lock, ArrowRight, Download } from 'lucide-react'
import { getJob } from '../api'

const API_ORIGIN = (import.meta.env.VITE_API_ORIGIN || 'http://localhost:5000').replace(/\/$/, '')
const withToken = (url) => {
  if (!url) return url
  const token = localStorage.getItem('token')
  if (!token) return url
  return url.includes('?') ? `${url}&token=${encodeURIComponent(token)}` : `${url}?token=${encodeURIComponent(token)}`
}

const modeLabels = {
  fast: { name: 'Quick Cloak', icon: Zap, color: '#ffd166' },
  balanced: { name: 'Balanced', icon: Scale, color: '#6c63ff' },
  strong: { name: 'Max Protection', icon: Lock, color: '#43d9ad' }
}

const steps = [
  { id: 1, label: 'Face detected' },
  { id: 2, label: 'Target generated' },
  { id: 3, label: 'Attack running' },
  { id: 4, label: 'Reconstruction complete' }
]

function Progress() {
  const { jobId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { estimatedSeconds = 180, mode = 'balanced', total = 1 } = location.state || {}

  const [status, setStatus] = useState('processing')
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(1)
  const [timeRemaining, setTimeRemaining] = useState(estimatedSeconds)
  const [jobData, setJobData] = useState(null)
  const [showResults, setShowResults] = useState(false)
  const pollRef = useRef(null)
  const startTimeRef = useRef(Date.now())

  // Poll job status
  useEffect(() => {
    const pollJob = async () => {
      try {
        const res = await getJob(jobId)
        const job = res.data?.job || res.data

        if (job.status === 'done') {
          setStatus('done')
          setProgress(100)
          setCurrentStep(4)
          setJobData(job)
          clearInterval(pollRef.current)

          // Show results after a brief celebration
          setTimeout(() => setShowResults(true), 1500)
        } else if (job.status === 'failed') {
          setStatus('failed')
          setJobData(job)
          clearInterval(pollRef.current)
        } else if (job.progress) {
          setProgress(job.progress)
        }
      } catch (err) {
        console.error('Poll error:', err)
      }
    }

    pollRef.current = setInterval(pollJob, 4000)
    pollJob() // Initial poll

    return () => clearInterval(pollRef.current)
  }, [jobId])

  // Simulate progress and time countdown
  useEffect(() => {
    if (status !== 'processing') return

    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      const estimatedProgress = Math.min(95, (elapsed / estimatedSeconds) * 100)

      setProgress(prev => Math.max(prev, estimatedProgress))
      setTimeRemaining(Math.max(0, estimatedSeconds - elapsed))

      // Update step based on progress
      if (estimatedProgress < 25) setCurrentStep(1)
      else if (estimatedProgress < 50) setCurrentStep(2)
      else if (estimatedProgress < 75) setCurrentStep(3)
      else setCurrentStep(4)
    }, 100)

    return () => clearInterval(interval)
  }, [estimatedSeconds, status])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  }

  const ModeIcon = modeLabels[mode]?.icon || Scale
  const modeColor = modeLabels[mode]?.color || '#6c63ff'

  if (showResults && jobData) {
    return <ResultsView jobData={jobData} mode={mode} total={total} />
  }

  return (
    <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#6c63ff]/5 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-lg w-full text-center">
        {/* Vessel animation */}
        <div className="relative w-64 h-64 mx-auto mb-12">
          {/* Outer glow */}
          <div
            className="absolute inset-0 rounded-full blur-3xl opacity-30"
            style={{ backgroundColor: modeColor }}
          />

          {/* Vessel container */}
          <svg viewBox="0 0 200 200" className="w-full h-full">
            {/* Vessel outline */}
            <defs>
              <linearGradient id="vesselGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor={modeColor} stopOpacity="0.8" />
                <stop offset="100%" stopColor={modeColor} stopOpacity="0.3" />
              </linearGradient>
              <clipPath id="vesselClip">
                <circle cx="100" cy="100" r="80" />
              </clipPath>
            </defs>

            {/* Vessel border */}
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="#2a2a38"
              strokeWidth="3"
            />

            {/* Fill level */}
            <g clipPath="url(#vesselClip)">
              <motion.rect
                x="20"
                y="180"
                width="160"
                height="160"
                fill="url(#vesselGradient)"
                initial={{ y: 180 }}
                animate={{ y: 180 - (progress * 1.6) }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />

              {/* Animated waves */}
              <motion.path
                d="M 20,100 Q 50,90 80,100 T 140,100 T 200,100 V 200 H 20 Z"
                fill={modeColor}
                fillOpacity="0.5"
                animate={{
                  d: [
                    "M 20,100 Q 50,90 80,100 T 140,100 T 200,100 V 200 H 20 Z",
                    "M 20,100 Q 50,110 80,100 T 140,100 T 200,100 V 200 H 20 Z",
                    "M 20,100 Q 50,90 80,100 T 140,100 T 200,100 V 200 H 20 Z"
                  ]
                }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                style={{
                  transform: `translateY(${80 - (progress * 0.8)}px)`
                }}
              />
            </g>

            {/* Bubbles */}
            {status === 'processing' && [1, 2, 3, 4, 5].map(i => (
              <motion.circle
                key={i}
                r={3 + Math.random() * 4}
                fill="white"
                fillOpacity={0.4}
                initial={{ cx: 60 + Math.random() * 80, cy: 180 }}
                animate={{
                  cy: [180, 20],
                  opacity: [0.4, 0]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2 + Math.random() * 2,
                  delay: i * 0.5,
                  ease: "easeOut"
                }}
              />
            ))}
          </svg>

          {/* Percentage in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.span
              className="text-4xl font-bold"
              key={Math.floor(progress)}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{ color: modeColor }}
            >
              {Math.floor(progress)}%
            </motion.span>
          </div>
        </div>

        {/* Job info */}
        <div className="flex items-center justify-center gap-6 mb-8">
          <div className="flex items-center gap-2">
            <ModeIcon className="w-5 h-5" style={{ color: modeColor }} />
            <span className="text-[#a1a1aa]">{modeLabels[mode]?.name}</span>
          </div>
          <div className="w-px h-4 bg-[#2a2a38]" />
          <div className="flex items-center gap-2 text-[#a1a1aa]">
            <Shield className="w-4 h-4" />
            <span>{total} image{total !== 1 ? 's' : ''}</span>
          </div>
          <div className="w-px h-4 bg-[#2a2a38]" />
          <div className="flex items-center gap-2 text-[#a1a1aa]">
            <Clock className="w-4 h-4" />
            <span>{formatTime(timeRemaining)}</span>
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <motion.div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all ${
                  currentStep >= step.id
                    ? ''
                    : 'opacity-50'
                }`}
                animate={{
                  scale: currentStep === step.id ? 1.05 : 1,
                  opacity: currentStep >= step.id ? 1 : 0.5
                }}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    currentStep > step.id
                      ? 'bg-[#43d9ad]'
                      : currentStep === step.id
                      ? 'bg-[#6c63ff] animate-pulse'
                      : 'bg-[#71717a]'
                  }`}
                />
                <span className={currentStep >= step.id ? 'text-white' : 'text-[#71717a]'}>
                  {step.label}
                </span>
              </motion.div>
              {index < steps.length - 1 && (
                <div className={`w-4 h-px mx-1 ${currentStep > step.id ? 'bg-[#43d9ad]' : 'bg-[#2a2a38]'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Error state */}
        {status === 'failed' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-6 bg-[#ff6b6b]/10 border border-[#ff6b6b]/20 rounded-xl"
          >
            <p className="text-[#ff6b6b] font-medium mb-4">Processing failed</p>
            {jobData?.error && (
              <pre className="text-left whitespace-pre-wrap break-words text-xs text-[#ffb4b4] bg-[#0f0f13]/60 border border-[#ff6b6b]/20 rounded-lg p-3 mb-4 max-h-40 overflow-auto">
                {jobData.error}
              </pre>
            )}
            <button
              onClick={() => navigate('/upload')}
              className="px-6 py-2 bg-[#ff6b6b] hover:bg-[#e55a5a] text-white rounded-lg transition-colors"
            >
              Try again
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}

function ResultsView({ jobData, mode, total }) {
  const navigate = useNavigate()
  const [selectedIndex, setSelectedIndex] = useState(0)

  const originals = jobData.imageUrls?.originals || []
  const cloaked = jobData.imageUrls?.cloaked || []
  const images = originals.map((orig, i) => ({
    original: orig?.url ? withToken(`${API_ORIGIN}${orig.url}`) : null,
    cloaked: cloaked?.[i]?.url ? withToken(`${API_ORIGIN}${cloaked[i].url}`) : null,
    result: jobData.results?.[i] || null,
  }))

  const ModeIcon = modeLabels[mode]?.icon || Scale
  const modeColor = modeLabels[mode]?.color || '#6c63ff'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#0f0f13] py-12 px-6"
    >
      <div className="max-w-4xl mx-auto">
        {/* Success header */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="flex justify-center mb-8"
        >
          <div className="w-20 h-20 rounded-full bg-[#43d9ad]/20 flex items-center justify-center">
            <Check className="w-10 h-10 text-[#43d9ad]" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl font-bold mb-3">Protection complete</h1>
          <p className="text-[#a1a1aa]">
            {total} image{total !== 1 ? 's' : ''} successfully cloaked with {modeLabels[mode]?.name}
          </p>
        </motion.div>

        {/* Image selector tabs */}
        {images.length > 1 && (
          <div className="flex justify-center gap-2 mb-8">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedIndex === index
                    ? 'bg-[#6c63ff] text-white'
                    : 'bg-[#1a1a24] text-[#a1a1aa] hover:text-white'
                }`}
              >
                Image {index + 1}
              </button>
            ))}
          </div>
        )}

        {/* Image comparison */}
        {images.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <div className="bg-[#1a1a24] border border-[#2a2a38] rounded-2xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-xl overflow-hidden border border-[#2a2a38] bg-[#0f0f13]">
                  <div className="px-4 py-3 border-b border-[#2a2a38] text-sm font-medium text-[#a1a1aa]">
                    Original
                  </div>
                  <div className="aspect-square">
                    {images[selectedIndex].original ? (
                      <img
                        src={images[selectedIndex].original}
                        alt="Original"
                        className="h-full w-full object-cover"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-[#71717a]">
                        Original image not available
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl overflow-hidden border border-[#2a2a38] bg-[#0f0f13]">
                  <div className="px-4 py-3 border-b border-[#2a2a38] text-sm font-medium text-[#a1a1aa] flex items-center justify-between">
                    <span>Cloaked</span>
                    {images[selectedIndex].cloaked && (
                      <a
                        href={images[selectedIndex].cloaked}
                        download
                        className="inline-flex items-center gap-2 text-[#6c63ff] hover:text-white transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </a>
                    )}
                  </div>
                  <div className="aspect-square">
                    {images[selectedIndex].cloaked ? (
                      <img
                        src={images[selectedIndex].cloaked}
                        alt="Cloaked"
                        className="h-full w-full object-cover"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-[#71717a]">
                        Cloaked image not generated. Try running the job again.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Metrics */}
        {images.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-3 gap-4 mb-8"
          >
            <div className="bg-[#1a1a24] border border-[#2a2a38] rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-[#43d9ad] mb-2">
                {typeof images[selectedIndex].result?.cosine_similarity === 'number'
                  ? `${Math.round((1 - images[selectedIndex].result.cosine_similarity) * 100)}%`
                  : '—'}
              </div>
              <div className="text-sm text-[#71717a]">Identity shift</div>
            </div>
            <div className="bg-[#1a1a24] border border-[#2a2a38] rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-[#6c63ff] mb-2">
                {typeof images[selectedIndex].result?.ssim === 'number'
                  ? `${Math.round(images[selectedIndex].result.ssim * 100)}%`
                  : '—'}
              </div>
              <div className="text-sm text-[#71717a]">Visual quality</div>
            </div>
            <div className="bg-[#1a1a24] border border-[#2a2a38] rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-[#ffd166] mb-2">
                {typeof images[selectedIndex].result?.psnr === 'number'
                  ? `${images[selectedIndex].result.psnr.toFixed(1)} dB`
                  : '—'}
              </div>
              <div className="text-sm text-[#71717a]">PSNR</div>
            </div>
          </motion.div>
        )}

        {/* Protected badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center mb-10"
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-full">
            <Shield className="w-4 h-4 text-[#43d9ad]" />
            <span className="text-sm font-medium text-[#43d9ad]">Protected</span>
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            to="/history"
            className="px-8 py-3 text-white rounded-xl transition-all flex items-center gap-2"
          >
            View History
          </Link>
          <Link
            to="/upload"
            className="px-8 py-3 text-white rounded-xl transition-all flex items-center gap-2"
          >
            Cloak More
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default Progress
