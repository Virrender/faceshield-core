import { useEffect, useState, useRef } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { getJob } from '../api'

export default function JobProgress() {
  const { jobId }   = useParams()
  const location    = useLocation()
  const navigate    = useNavigate()
  const { estimatedSeconds, mode, total } = location.state || {}

  const [job, setJob]         = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [dots, setDots]       = useState('')
  const intervalRef           = useRef(null)

  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    getJob(jobId).then(res => setJob(res.data.job))

    intervalRef.current = setInterval(async () => {
      try {
        const res = await getJob(jobId)
        setJob(res.data.job)
        if (['done', 'failed'].includes(res.data.job.status)) {
          clearInterval(intervalRef.current)
        }
      } catch (err) {
        console.error(err)
      }
    }, 4000)

    return () => clearInterval(intervalRef.current)
  }, [jobId])

  const fillPct = estimatedSeconds
    ? Math.min((elapsed / estimatedSeconds) * 100, 95)
    : 50

  const isDone   = job?.status === 'done'
  const isFailed = job?.status === 'failed'
  const remaining = Math.max(0, (estimatedSeconds || 0) - elapsed)

  if (isFailed) return (
    <div style={styles.page}>
      <div style={styles.center}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>✗</div>
        <h2 style={{ color: '#ff6b6b', marginBottom: '10px' }}>Processing failed</h2>
        <p style={{ color: '#888', marginBottom: '28px' }}>{job.error}</p>
        <button style={styles.btn} onClick={() => navigate('/upload')}>Try again</button>
      </div>
    </div>
  )

  if (isDone) return (
    <div style={styles.page}>
      <div style={styles.center}>
        <div style={styles.doneRing}>
          <span style={{ fontSize: '32px' }}>✓</span>
        </div>
        <h2 style={{ color: '#fff', marginTop: '24px', marginBottom: '8px' }}>Done</h2>
        <p style={{ color: '#888', marginBottom: '36px' }}>
          Your {job.results?.length} photo{job.results?.length !== 1 ? 's are' : ' is'} cloaked
        </p>

        {job.results?.map((r, i) => (
          <div key={i} style={styles.resultCard}>
            <ImageCompare
              originalUrl={job.imageUrls?.originals?.[i]?.url}
              cloakedUrl={job.imageUrls?.cloaked?.[i]?.url}
            />
            <div style={styles.metricsRow}>
              <Metric label="Identity shift" value={`${(Math.abs(r.cosine_similarity) * 100).toFixed(1)}%`} color="#6c63ff" />
              <Metric label="Visual quality" value={`${(r.ssim * 100).toFixed(1)}%`} color="#43d9ad" />
              <Metric label="PSNR" value={`${r.psnr?.toFixed(1)} dB`} color="#ffd166" />
              <div style={{
                padding: '4px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600',
                background: r.verdict === 'Protected' ? '#1a3a2a' : '#3a1a1a',
                color: r.verdict === 'Protected' ? '#43d9ad' : '#ff6b6b',
              }}>
                {r.verdict}
              </div>
            </div>
          </div>
        ))}

        <button style={styles.btn} onClick={() => navigate('/history')}>View history</button>
        <button style={{ ...styles.btn, ...styles.btnSec }} onClick={() => navigate('/upload')}>Cloak more</button>
      </div>
    </div>
  )

  // ── Processing — water fill screen ──────────────────────────────────────
  return (
    <div style={styles.page}>
      <style>{`
        @keyframes wave1 {
          0%   { transform: translateX(0) translateY(0); }
          50%  { transform: translateX(-25%) translateY(-6px); }
          100% { transform: translateX(-50%) translateY(0); }
        }
        @keyframes wave2 {
          0%   { transform: translateX(0) translateY(0); }
          50%  { transform: translateX(-25%) translateY(6px); }
          100% { transform: translateX(-50%) translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.7; }
          50%       { opacity: 1; }
        }
        @keyframes floatUp {
          0%   { transform: translateY(0) scale(1); opacity: 0.6; }
          100% { transform: translateY(-120px) scale(0.4); opacity: 0; }
        }
      `}</style>

      <div style={styles.waterPage}>
        {/* Big water vessel */}
        <div style={styles.vessel}>
          {/* Water fill */}
          <div style={{
            ...styles.water,
            height: `${fillPct}%`,
            transition: 'height 1.2s ease',
          }}>
            {/* Wave 1 */}
            <div style={styles.waveWrapper}>
              <svg viewBox="0 0 1200 60" style={{ ...styles.waveSvg, animation: 'wave1 3s linear infinite' }}>
                <path d="M0,30 C150,60 350,0 600,30 C850,60 1050,0 1200,30 L1200,60 L0,60 Z"
                  fill="rgba(108,99,255,0.6)" />
              </svg>
            </div>
            {/* Wave 2 */}
            <div style={{ ...styles.waveWrapper, top: '-8px' }}>
              <svg viewBox="0 0 1200 60" style={{ ...styles.waveSvg, animation: 'wave2 4s linear infinite', animationDelay: '-1s' }}>
                <path d="M0,20 C200,50 400,0 600,20 C800,50 1000,0 1200,20 L1200,60 L0,60 Z"
                  fill="rgba(67,217,173,0.4)" />
              </svg>
            </div>

            {/* Bubbles */}
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{
                position: 'absolute',
                width:  `${8 + i * 4}px`,
                height: `${8 + i * 4}px`,
                background: 'rgba(255,255,255,0.15)',
                borderRadius: '50%',
                bottom: `${10 + i * 8}%`,
                left:   `${10 + i * 15}%`,
                animation: `floatUp ${2 + i * 0.5}s ease-in infinite`,
                animationDelay: `${i * 0.4}s`,
              }} />
            ))}
          </div>

          {/* Percentage label inside vessel */}
          <div style={styles.vesselLabel}>
            <div style={styles.pctNum}>{Math.round(fillPct)}%</div>
          </div>
        </div>

        {/* Text below vessel */}
        <h2 style={styles.waterTitle}>Cloaking in progress{dots}</h2>
        <p style={styles.waterSub}>
          {mode} mode · {total} image{total !== 1 ? 's' : ''}
        </p>
        <p style={styles.waterEta}>
          {remaining > 0
            ? `~${remaining}s remaining`
            : 'Finishing up...'}
        </p>

        <div style={styles.stepList}>
          <Step done={elapsed > 5}  label="Face detected" />
          <Step done={elapsed > 10} label="Target embedding generated" />
          <Step done={elapsed > 15} label="Gradient attack running" />
          <Step done={isDone}       label="Reconstruction complete" />
        </div>
      </div>
    </div>
  )
}

function Step({ done, label }) {
  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
      <div style={{
        width: '18px', height: '18px', borderRadius: '50%',
        background: done ? '#43d9ad' : '#2a2a38',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '11px', color: done ? '#0a1a14' : '#444',
        flexShrink: 0, transition: 'background 0.4s',
      }}>
        {done ? '✓' : '·'}
      </div>
      <span style={{ color: done ? '#a0f0de' : '#555', fontSize: '14px', transition: 'color 0.4s' }}>
        {label}
      </span>
    </div>
  )
}

function ImageCompare({ originalUrl, cloakedUrl }) {
  const [sliderX, setSliderX] = useState(50)
  const containerRef = useRef(null)
  const dragging = useRef(false)
  const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')
  const token = localStorage.getItem('token')
  const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : ''

  function onMouseMove(e) {
    if (!dragging.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    setSliderX(Math.min(Math.max(x, 2), 98))
  }

  if (!originalUrl || !cloakedUrl) return (
    <div style={{ color: '#555', fontSize: '13px', padding: '20px', textAlign: 'center' }}>
      Images loading...
    </div>
  )

  return (
    <div style={{ marginBottom: '16px' }}>
      <p style={{ color: '#666', fontSize: '12px', marginBottom: '8px', textAlign: 'center' }}>
        Drag to compare ← Original · Cloaked →
      </p>
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          height: '260px',
          borderRadius: '8px',
          overflow: 'hidden',
          cursor: 'col-resize',
          userSelect: 'none',
          background: '#0a0a0e',
        }}
        onMouseMove={onMouseMove}
        onMouseDown={() => { dragging.current = true }}
        onMouseUp={() => { dragging.current = false }}
        onMouseLeave={() => { dragging.current = false }}
      >
        {/* Cloaked image — full width, sits underneath */}
        <img
          src={apiBase + cloakedUrl + tokenQuery}
          alt="cloaked"
          style={styles.compareImg}
        />

        {/* Original image — same placement, clipped by reveal mask */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden' }}>
          <img
            src={apiBase + originalUrl + tokenQuery}
            alt="original"
            style={{
              ...styles.compareImg,
              clipPath: `inset(0 ${100 - sliderX}% 0 0)`,
            }}
          />
        </div>

        {/* Divider line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: `${sliderX}%`,
          transform: 'translateX(-1px)',
          width: '2px',
          height: '100%',
          background: 'rgba(255,255,255,0.8)',
          pointerEvents: 'none',
        }}>
          {/* Handle */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            color: '#000',
            boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
            fontWeight: '700',
          }}>
            ⇔
          </div>
        </div>

        {/* Labels */}
        <div style={{
          position: 'absolute', top: '10px', left: '10px',
          background: 'rgba(0,0,0,0.65)', color: '#fff',
          fontSize: '11px', padding: '3px 8px', borderRadius: '4px',
          pointerEvents: 'none',
        }}>
          Original
        </div>
        <div style={{
          position: 'absolute', top: '10px', right: '10px',
          background: 'rgba(108,99,255,0.85)', color: '#fff',
          fontSize: '11px', padding: '3px 8px', borderRadius: '4px',
          pointerEvents: 'none',
        }}>
          Cloaked
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ color, fontSize: '20px', fontWeight: '700' }}>{value}</div>
      <div style={{ color: '#666', fontSize: '11px' }}>{label}</div>
    </div>
  )
}

const styles = {
  page:       { minHeight: '100vh', background: '#0f0f13' },
  center:     { maxWidth: '560px', margin: '0 auto', padding: '48px 20px', textAlign: 'center' },
  doneRing:   { width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(67,217,173,0.15)', border: '2px solid #43d9ad', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', color: '#43d9ad' },
  resultCard: { background: '#1a1a24', border: '1px solid #2a2a38', borderRadius: '12px', padding: '20px', marginBottom: '16px', textAlign: 'left' },
  metricsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', alignItems: 'center', marginTop: '14px' },
  btn:        { display: 'block', width: '100%', padding: '14px', background: '#6c63ff', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginTop: '12px' },
  btnSec:     { background: '#1a1a24', border: '1px solid #2a2a38' },
  compareImg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    objectPosition: 'center',
  },

  // Water screen
  waterPage:  { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '40px 20px' },
  vessel:     { position: 'relative', width: '200px', height: '260px', border: '2px solid #2a2a38', borderRadius: '16px', overflow: 'hidden', background: '#0a0a0e', marginBottom: '36px' },
  water:      { position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(108,99,255,0.3)', overflow: 'hidden' },
  waveWrapper:{ position: 'absolute', top: '-20px', left: 0, right: 0, height: '40px', overflow: 'hidden' },
  waveSvg:    { width: '200%', height: '100%' },
  vesselLabel:{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', zIndex: 10 },
  pctNum:     { color: '#fff', fontSize: '36px', fontWeight: '700', textShadow: '0 2px 8px rgba(0,0,0,0.5)' },
  waterTitle: { color: '#fff', fontSize: '24px', marginBottom: '8px' },
  waterSub:   { color: '#888', fontSize: '15px', marginBottom: '6px' },
  waterEta:   { color: '#6c63ff', fontSize: '14px', marginBottom: '32px', animation: 'pulse 2s ease-in-out infinite' },
  stepList:   { textAlign: 'left', width: '100%', maxWidth: '300px' },
}