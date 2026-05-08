import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { Zap, Scale, Lock, Clock, Check, X, Loader2, Plus, Shield, Download, ChevronDown } from 'lucide-react'
import { getHistory } from '../api'

const API_ORIGIN = (import.meta.env.VITE_API_ORIGIN || 'http://localhost:5000').replace(/\/$/, '')
const withToken = (url) => {
  if (!url) return url
  const token = localStorage.getItem('token')
  if (!token) return url
  return url.includes('?') ? `${url}&token=${encodeURIComponent(token)}` : `${url}?token=${encodeURIComponent(token)}`
}

const modeConfig = {
  fast: { name: 'Quick Cloak', icon: Zap, color: '#ffd166', bg: 'bg-[#ffd166]/10' },
  balanced: { name: 'Balanced', icon: Scale, color: '#6c63ff', bg: 'bg-[#6c63ff]/10' },
  strong: { name: 'Max Protection', icon: Lock, color: '#43d9ad', bg: 'bg-[#43d9ad]/10' }
}

const statusConfig = {
  done: { label: 'Complete', icon: Check, color: '#43d9ad', bg: 'bg-[#43d9ad]/10' },
  processing: { label: 'Processing', icon: Loader2, color: '#6c63ff', bg: 'bg-[#6c63ff]/10', animate: true },
  failed: { label: 'Failed', icon: X, color: '#ff6b6b', bg: 'bg-[#ff6b6b]/10' }
}

function History() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedJob, setExpandedJob] = useState(null)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const res = await getHistory()
      // Sort by date, newest first
      const sortedJobs = (res.data.jobs || res.data || []).sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      )
      setJobs(sortedJobs)
    } catch (err) {
      setError('Failed to load history')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#6c63ff] animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f0f13] py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10"
        >
          <div>
            <h1 className="text-3xl font-bold mb-2">Your protected photos</h1>
            <p className="text-[#a1a1aa]">{jobs.length} job{jobs.length !== 1 ? 's' : ''} processed</p>
          </div>
          <Link
            to="/upload"
            className="flex items-center gap-2 px-5 py-3 bg-[#6c63ff] hover:bg-[#5a52e0] text-white rounded-xl transition-colors"
          >
            <Plus className="w-5 h-5" />
            New job
          </Link>
        </motion.div>

        {/* Error state */}
        {error && (
          <div className="p-4 bg-[#ff6b6b]/10 border border-[#ff6b6b]/20 rounded-xl text-[#ff6b6b] text-center mb-8">
            {error}
          </div>
        )}

        {/* Empty state */}
        {jobs.length === 0 && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 rounded-2xl bg-[#1a1a24] flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10 text-[#71717a]" />
            </div>
            <h2 className="text-xl font-semibold mb-3">No protected photos yet</h2>
            <p className="text-[#a1a1aa] mb-8">Upload your first image to get started</p>
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#6c63ff] hover:bg-[#5a52e0] text-white rounded-xl transition-colors"
            >
              <Plus className="w-5 h-5" />
              Upload photos
            </Link>
          </motion.div>
        )}

        {/* Jobs grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {jobs.map((job, index) => (
            <JobCard 
              key={job._id || job.id || index} 
              job={job} 
              isExpanded={expandedJob === (job._id || job.id)}
              onToggle={() => setExpandedJob(
                expandedJob === (job._id || job.id) ? null : (job._id || job.id)
              )}
              delay={index * 0.05}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function JobCard({ job, isExpanded, onToggle, delay }) {
  const mode = modeConfig[job.mode] || modeConfig.balanced
  const status = statusConfig[job.status] || statusConfig.processing
  const ModeIcon = mode.icon
  const StatusIcon = status.icon

  const images = job.imageUrls?.originals?.map((orig, i) => ({
    original: withToken(`${API_ORIGIN}${orig.url}`),
    cloaked: withToken(`${API_ORIGIN}${job.imageUrls.cloaked?.[i]?.url}`)
  })) || []

  const firstResult = job.results?.[0] || null

  const formattedDate = job.createdAt 
    ? format(new Date(job.createdAt), 'MMM d, yyyy · h:mm a')
    : 'Unknown date'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="h-full bg-[#1a1a24] border border-[#2a2a38] rounded-2xl overflow-hidden hover:border-[#6c63ff]/30 transition-colors flex flex-col"
    >
      {/* Header */}
      <div className="p-5 flex-1">
        <div className="flex items-center justify-between mb-4">
          {/* Date */}
          <div className="min-w-0 flex items-center gap-2 text-sm text-[#71717a]">
            <Clock className="w-4 h-4" />
            <span className="truncate">{formattedDate}</span>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {/* Mode badge */}
          <div 
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${mode.bg}`}
            style={{ color: mode.color }}
          >
            <ModeIcon className="w-3.5 h-3.5" />
            {mode.name}
          </div>

          {/* Status badge */}
          <div 
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${status.bg}`}
            style={{ color: status.color }}
          >
            <StatusIcon className={`w-3.5 h-3.5 ${status.animate ? 'animate-spin' : ''}`} />
            {status.label}
          </div>

          {/* Image count */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#27272a] text-[#a1a1aa]">
            {images.length || '?'} image{images.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Image compare slider (for done jobs) */}
        {job.status === 'done' && images.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl overflow-hidden border border-[#2a2a38] bg-[#0f0f13]">
              <div className="px-3 py-2 border-b border-[#2a2a38] text-xs font-medium text-[#a1a1aa]">
                Original
              </div>
              <div className="aspect-video">
                <img
                  src={images[0].original}
                  alt="Original"
                  className="h-full w-full object-cover"
                  crossOrigin="anonymous"
                />
              </div>
            </div>
            <div className="rounded-xl overflow-hidden border border-[#2a2a38] bg-[#0f0f13]">
              <div className="px-3 py-2 border-b border-[#2a2a38] text-xs font-medium text-[#a1a1aa]">
                Cloaked
              </div>
              <div className="aspect-video">
                {images[0].cloaked ? (
                  <img
                    src={images[0].cloaked}
                    alt="Cloaked"
                    className="h-full w-full object-cover"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-[#71717a] text-xs">
                    Not available
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Processing state */}
        {job.status === 'processing' && (
          <div className="aspect-video bg-[#27272a] rounded-xl flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-[#6c63ff] animate-spin mx-auto mb-3" />
              <p className="text-sm text-[#71717a]">Processing...</p>
            </div>
          </div>
        )}

        {/* Failed state */}
        {job.status === 'failed' && (
          <div className="aspect-video bg-[#ff6b6b]/5 rounded-xl flex items-center justify-center border border-[#ff6b6b]/10">
            <div className="text-center">
              <X className="w-8 h-8 text-[#ff6b6b] mx-auto mb-3" />
              <p className="text-sm text-[#ff6b6b]">Processing failed</p>
            </div>
          </div>
        )}

        {/* Metrics (for done jobs) */}
        {job.status === 'done' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <div className="text-center p-2 bg-[#27272a] rounded-lg">
              <div className="text-lg font-bold text-[#43d9ad]">
                {typeof firstResult?.cosine_similarity === 'number'
                  ? `${Math.round((1 - firstResult.cosine_similarity) * 100)}%`
                  : '—'}
              </div>
              <div className="text-xs text-[#71717a]">Identity shift</div>
            </div>
            <div className="text-center p-2 bg-[#27272a] rounded-lg">
              <div className="text-lg font-bold text-[#6c63ff]">
                {typeof firstResult?.ssim === 'number'
                  ? `${Math.round(firstResult.ssim * 100)}%`
                  : '—'}
              </div>
              <div className="text-xs text-[#71717a]">Visual quality</div>
            </div>
            <div className="text-center p-2 bg-[#27272a] rounded-lg">
              <div className="text-lg font-bold text-[#ffd166]">
                {typeof firstResult?.psnr === 'number'
                  ? `${firstResult.psnr.toFixed(1)} dB`
                  : '—'}
              </div>
              <div className="text-xs text-[#71717a]">PSNR</div>
            </div>
          </div>
        )}
      </div>

      {/* Expanded view with all images */}
      {isExpanded && images.length > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-[#2a2a38] p-5"
        >
          <p className="text-sm text-[#71717a] mb-4">Original and cloaked images:</p>
          <div className="space-y-4">
            {images.map((img, i) => (
              <div key={i} className="bg-[#0f0f13]/40 border border-[#2a2a38] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-white">Image {i + 1}</div>
                  {img.cloaked && (
                    <a
                      href={img.cloaked}
                      download
                      className="inline-flex items-center gap-2 text-sm text-[#6c63ff] hover:text-white transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download cloaked
                    </a>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg overflow-hidden border border-[#2a2a38] bg-[#0f0f13]">
                    <div className="px-3 py-2 border-b border-[#2a2a38] text-xs font-medium text-[#a1a1aa]">Original</div>
                    <div className="aspect-square">
                      <img
                        src={img.original}
                        alt={`Original ${i + 1}`}
                        className="h-full w-full object-cover"
                        crossOrigin="anonymous"
                      />
                    </div>
                  </div>
                  <div className="rounded-lg overflow-hidden border border-[#2a2a38] bg-[#0f0f13]">
                    <div className="px-3 py-2 border-b border-[#2a2a38] text-xs font-medium text-[#a1a1aa]">Cloaked</div>
                    <div className="aspect-square">
                      {img.cloaked ? (
                        <img
                          src={img.cloaked}
                          alt={`Cloaked ${i + 1}`}
                          className="h-full w-full object-cover"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-[#71717a] text-xs">
                          Not available
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Show more button */}
      {images.length > 0 && (
        <button
          onClick={onToggle}
          className="w-full py-3 text-sm text-[#6c63ff] hover:bg-[#6c63ff]/5 border-t border-[#2a2a38] transition-colors"
        >
          <span className="inline-flex items-center justify-center gap-2">
            {isExpanded ? 'Hide details' : 'View originals & cloaked'}
            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </span>
        </button>
      )}
    </motion.div>
  )
}

export default History
