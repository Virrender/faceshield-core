import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getHistory } from '../api'

export default function History() {
  const [jobs, setJobs]       = useState([])
  const [loading, setLoading] = useState(true)
  const navigate              = useNavigate()

  useEffect(() => {
    getHistory()
      .then(res => setJobs(res.data.jobs))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Your cloaked photos</h1>

        {loading && <p style={styles.sub}>Loading history...</p>}

        {!loading && jobs.length === 0 && (
          <div style={styles.empty}>
            <p style={{ color: '#888' }}>No jobs yet.</p>
            <button style={styles.btn} onClick={() => navigate('/upload')}>
              Cloak your first photo
            </button>
          </div>
        )}

        {jobs.map(job => (
          <div key={job._id} style={styles.jobCard}>
            <div style={styles.jobTop}>
              <span style={styles.mode}>{job.mode}</span>
              <span style={{ ...styles.status, color: job.status === 'done' ? '#43d9ad' : job.status === 'failed' ? '#ff6b6b' : '#ffd166' }}>
                {job.status}
              </span>
              <span style={styles.date}>
                {new Date(job.createdAt).toLocaleDateString()}
              </span>
            </div>

            {job.results?.map((r, i) => (
              <div key={i} style={styles.result}>
                <span style={styles.filename}>{r.originalFilename}</span>
                {r.verdict && (
                  <span style={{ color: r.verdict === 'Protected' ? '#43d9ad' : '#ff6b6b', fontSize: '13px' }}>
                    {r.verdict} · cos_sim {r.cosine_similarity?.toFixed(3)}
                  </span>
                )}
                {r.error && <span style={{ color: '#ff6b6b', fontSize: '13px' }}>{r.error}</span>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

const styles = {
  page:      { minHeight: '100vh', background: '#0f0f13', padding: '40px 20px' },
  container: { maxWidth: '640px', margin: '0 auto' },
  title:     { color: '#fff', fontSize: '28px', marginBottom: '8px' },
  sub:       { color: '#888' },
  empty:     { textAlign: 'center', padding: '60px 0' },
  jobCard:   { background: '#1a1a24', border: '1px solid #2a2a38', borderRadius: '10px', padding: '18px', marginBottom: '14px' },
  jobTop:    { display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '12px' },
  mode:      { background: '#2a2a38', color: '#a0a0c0', padding: '3px 10px', borderRadius: '12px', fontSize: '12px' },
  status:    { fontSize: '13px', fontWeight: '600' },
  date:      { color: '#666', fontSize: '12px', marginLeft: 'auto' },
  result:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '1px solid #2a2a38' },
  filename:  { color: '#888', fontSize: '13px' },
  btn:       { padding: '12px 24px', background: '#6c63ff', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '16px' },
}