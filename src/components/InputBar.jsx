import { useState, useCallback } from 'react'
import { BorderTrail } from './BorderTrail'

export default function InputBar({ onLoad }) {
  const [url, setUrl] = useState('')

  const handleSubmit = useCallback((e) => {
    e.preventDefault()
    if (url.trim()) {
      onLoad(url)
    }
  }, [url, onLoad])

  return (
    <section className="input-section">
      <form className="input-wrapper" onSubmit={handleSubmit}>
        <div className="input-container">
          <label htmlFor="stream-url-input" className="sr-only">YouTube URL or video ID</label>
          <input
            id="stream-url-input"
            type="text"
            className="input-field"
            placeholder="Paste YouTube URL or video ID..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            autoComplete="off"
            spellCheck="false"
          />
          <BorderTrail 
            className="bg-accent" 
            size={100}
            transition={{
              repeat: Infinity,
              duration: 4,
              ease: 'linear'
            }}
          />
        </div>
        <button type="submit" className="load-btn" id="load-stream-btn" aria-label="Load Stream">
          <span className="load-btn__text">Load Stream</span>
          <svg className="load-btn__icon" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </form>
    </section>
  )
}
