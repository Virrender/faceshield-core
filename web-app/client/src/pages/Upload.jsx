import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload as UploadIcon, X, Image, Zap, Scale, Lock, Loader2, Check } from 'lucide-react'
import { submitJob } from '../api'

const modes = [
  {
    id: 'fast',
    name: 'Quick Cloak',
    icon: Zap,
    time: '~45 sec',
    description: 'Fast processing',
    detail: 'Good protection',
    color: '#ffd166',
    estimatedSeconds: 45
  },
  {
    id: 'balanced',
    name: 'Balanced',
    icon: Scale,
    time: '~3 min',
    description: 'Invisible noise',
    detail: 'Strong protection',
    color: '#6c63ff',
    estimatedSeconds: 180,
    popular: true
  },
  {
    id: 'strong',
    name: 'Max Protection',
    icon: Lock,
    time: '~6 min',
    description: 'Best visual quality',
    detail: 'Maximum identity shift',
    color: '#43d9ad',
    estimatedSeconds: 360
  }
]

function Upload() {
  const [files, setFiles] = useState([])
  const [selectedMode, setSelectedMode] = useState('balanced')
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type === 'image/jpeg' || file.type === 'image/png'
    )
    addFiles(droppedFiles)
  }, [])

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files).filter(
      file => file.type === 'image/jpeg' || file.type === 'image/png'
    )
    addFiles(selectedFiles)
    e.target.value = ''
  }

  const addFiles = (newFiles) => {
    setError('')
    const totalFiles = files.length + newFiles.length
    if (totalFiles > 5) {
      setError('Maximum 5 images allowed')
      return
    }
    setFiles(prev => [...prev, ...newFiles])
  }

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (files.length === 0) {
      setError('Please select at least one image')
      return
    }

    setLoading(true)
    setError('')

    const formData = new FormData()
    files.forEach(file => formData.append('images', file))
    formData.append('mode', selectedMode)

    try {
      const res = await submitJob(formData)
      const mode = modes.find(m => m.id === selectedMode)
      navigate(`/progress/${res.data.jobId}`, {
        state: {
          estimatedSeconds: (mode?.estimatedSeconds ?? 180) * files.length,
          mode: selectedMode,
          total: files.length
        }
      })
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to submit job. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f13] pt-8 pb-16 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10 sm:mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Protect your photos</h1>
          <p className="text-[#a1a1aa] text-lg">Upload up to 5 images and make them invisible to AI</p>
        </motion.div>

        {/* Drop zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`relative border-2 border-dashed rounded-2xl px-6 sm:px-10 lg:px-12 py-[1cm] text-center transition-all cursor-pointer flex flex-col min-h-[220px] sm:min-h-[240px] ${
            isDragging
              ? 'border-[#6c63ff] bg-[#6c63ff]/10'
              : 'border-[#2a2a38] hover:border-[#6c63ff]/50 bg-[#1a1a24]'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input').click()}
        >
          <input
            id="file-input"
            type="file"
            accept="image/jpeg,image/png"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          
          <div className="flex flex-col items-center justify-center flex-1">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
              isDragging ? 'bg-[#6c63ff]/20' : 'bg-[#27272a]'
            }`}>
              <UploadIcon className={`w-8 h-8 transition-colors ${isDragging ? 'text-[#6c63ff]' : 'text-[#71717a]'}`} />
            </div>

            <div className="flex flex-col items-center mt-4">
              <p className="text-base sm:text-lg font-medium mb-2">
                {isDragging ? 'Drop your images here' : 'Drag and drop your images'}
              </p>
              <p className="text-[#71717a] text-sm mb-4">or click to browse</p>
              <p className="text-[#71717a] text-xs">JPG or PNG, up to 5 images</p>
            </div>
          </div>
        </motion.div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-4 bg-[#ff6b6b]/10 border border-[#ff6b6b]/20 rounded-xl text-[#ff6b6b] text-sm text-center"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected files */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6"
            >
              <div className="flex flex-wrap gap-3 sm:gap-4">
                {files.map((file, index) => (
                  <motion.div
                    key={`${file.name}-${index}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="min-w-0 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 bg-[#1a1a24] border border-[#2a2a38] rounded-xl"
                  >
                    <Image className="w-4 h-4 text-[#6c63ff]" />
                    <span className="text-sm truncate max-w-[120px] sm:max-w-[170px]">{file.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFile(index)
                      }}
                      className="w-5 h-5 rounded-full bg-[#27272a] hover:bg-[#ff6b6b]/20 flex items-center justify-center transition-colors"
                    >
                      <X className="w-3 h-3 text-[#71717a] hover:text-[#ff6b6b]" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mode selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-10"
        >
          <h2 className="text-lg font-semibold mb-4">Select protection mode</h2>
          <div className="grid md:grid-cols-3 gap-4 sm:gap-5">
            {modes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                className={`relative min-h-[220px] p-5 sm:p-6 pt-[1cm] sm:pt-[1cm] rounded-xl text-center transition-all flex flex-col ${
                  selectedMode === mode.id
                    ? 'bg-[#1a1a24] border-2'
                    : 'bg-[#1a1a24] border border-[#2a2a38] hover:border-[#6c63ff]/30'
                }`}
                style={{
                  borderColor: selectedMode === mode.id ? mode.color : undefined
                }}
              >
                {mode.popular && (
                  <div className="absolute -top-2 right-4 px-2 py-0.5 bg-[#6c63ff] text-white text-xs font-medium rounded-full">
                    Popular
                  </div>
                )}
                
                <div className="flex items-center justify-between mb-4 pt-[0.5cm] px-5">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center p-[0.5cm]"
                    style={{ backgroundColor: `${mode.color}15`, marginLeft: '0px' }}
                  >
                    <mode.icon className="w-5 h-5" style={{ color: mode.color }} />
                  </div>
                  
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors pt-2 ${
                    selectedMode === mode.id ? 'border-transparent' : 'border-[#2a2a38]'
                  }`} style={{ backgroundColor: selectedMode === mode.id ? mode.color : 'transparent', marginRight: '0px' }}>
                    {selectedMode === mode.id && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
                
                <h3 className="font-semibold mb-1 break-words">{mode.name}</h3>
                <p className="text-xl font-bold mb-2" style={{ color: mode.color }}>{mode.time}</p>
                <p className="text-[#71717a] text-sm">{mode.description}</p>
                <p className="text-[#a1a1aa] text-sm mt-1">{mode.detail}</p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Submit button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10"
        >
          <button
            onClick={handleSubmit}
            disabled={loading || files.length === 0}
            className="max-w-md mx-auto p-[0.5cm] mb-[0.5cm] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xl font-medium rounded-xl transition-all flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Start protection
                <span className="text-base opacity-80">({files.length} image{files.length !== 1 ? 's' : ''})</span>
              </>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  )
}

export default Upload
