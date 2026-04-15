import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { submitJob } from '../api'

const MODES = [
  { id: 'fast',     label: 'Fast',     desc: '~45 sec · subtle protection',    steps: 40  },
  { id: 'balanced', label: 'Balanced', desc: '~3 min · good protection',       steps: 150 },
  { id: 'strong',   label: 'Strong',   desc: '~6 min · maximum protection',    steps: 300 },
]

export default function Upload() {
  const [files, setFiles]     = useState([])
  const [mode, setMode]       = useState('balanced')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const navigate              = useNavigate()

  function handleFiles(newFiles) {
    const arr = Array.from(newFiles).slice(0, 5)
    const valid = arr.filter(f => f.type.startsWith('image/'))
    if (valid.length !== arr.length) setError('Only image files allowed')
    else setError('')
    setFiles(valid)
  }

  const onDrop = useCallback(e => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [])

  async function handleSubmit() {
    if (files.length === 0) return setError('Please select at least one image')
    setError('')
    setLoading(true)

    try {
      const formData = new FormData()
      files.forEach(f => formData.append('images', f))
      formData.append('mode', mode)

      const res = await submitJob(formData)
      navigate(`/progress/${res.data.jobId}`, {
        state: { estimatedSeconds: res.data.estimatedSeconds, mode, total: files.length }
      })
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit job')
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Cloak your face</h1>
        <p style={styles.sub}>Upload 1–5 photos. We make them invisible to face recognition AI.</p>

        {/* Drop zone */}
        <div
          style={{ ...styles.dropzone, ...(dragging ? styles.dropzoneActive : {}) }}
          onDrop={onDrop}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onClick={() => document.getElementById('fileInput').click()}
        >
          <input
            id="fileInput"
            type="file"
            multiple
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => handleFiles(e.target.files)}
          />
          {files.length === 0 ? (
            <>
              <div style={styles.uploadIcon}>↑</div>
              <p style={styles.dropText}>Drop images here or click to browse</p>
              <p style={styles.dropSub}>Max 5 images · JPG or PNG</p>
            </>
          ) : (
            <div style={styles.fileList}>
              {files.map((f, i) => (
                <div key={i} style={styles.fileChip}>
                  {f.name}
                </div>
              ))}
              <p style={styles.dropSub}>{files.length}/5 images selected</p>
            </div>
          )}
        </div>

        {/* Mode selector */}
        <div style={styles.modeSection}>
          <p style={styles.modeLabel}>Protection mode</p>
          <div style={styles.modeGrid}>
            {MODES.map(m => (
              <div
                key={m.id}
                style={{ ...styles.modeCard, ...(mode === m.id ? styles.modeCardActive : {}) }}
                onClick={() => setMode(m.id)}
              >
                <div style={styles.modeName}>{m.label}</div>
                <div style={styles.modeDesc}>{m.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <button
          style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }}
          onClick={handleSubmit}
          disabled={loading || files.length === 0}
        >
          {loading ? 'Submitting...' : `Cloak ${files.length || ''} image${files.length !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  )
}

const styles = {
  page:       { minHeight: '100vh', background: '#0f0f13', padding: '40px 20px' },
  container:  { maxWidth: '600px', margin: '0 auto' },
  title:      { color: '#fff', fontSize: '32px', marginBottom: '8px' },
  sub:        { color: '#888', marginBottom: '32px' },
  dropzone:   { border: '2px dashed #2a2a38', borderRadius: '12px', padding: '48px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '28px' },
  dropzoneActive: { borderColor: '#6c63ff', background: 'rgba(108,99,255,0.05)' },
  uploadIcon: { fontSize: '36px', color: '#6c63ff', marginBottom: '12px' },
  dropText:   { color: '#fff', fontSize: '16px', marginBottom: '6px' },
  dropSub:    { color: '#666', fontSize: '13px' },
  fileList:   { display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' },
  fileChip:   { background: '#2a2a38', color: '#a0a0c0', padding: '6px 12px', borderRadius: '20px', fontSize: '13px' },
  modeSection:{ marginBottom: '28px' },
  modeLabel:  { color: '#888', fontSize: '13px', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' },
  modeGrid:   { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' },
  modeCard:   { background: '#1a1a24', border: '1px solid #2a2a38', borderRadius: '10px', padding: '16px', cursor: 'pointer', transition: 'all 0.2s' },
  modeCardActive: { borderColor: '#6c63ff', background: 'rgba(108,99,255,0.1)' },
  modeName:   { color: '#fff', fontSize: '15px', fontWeight: '600', marginBottom: '4px' },
  modeDesc:   { color: '#666', fontSize: '12px' },
  error:      { background: '#2d1515', color: '#ff6b6b', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  btn:        { width: '100%', padding: '14px', background: '#6c63ff', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
  btnDisabled:{ opacity: 0.5, cursor: 'not-allowed' },
}