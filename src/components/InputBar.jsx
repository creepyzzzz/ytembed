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
        <button type="submit" className="load-btn" id="load-stream-btn">
          Load Stream
        </button>
      </form>
    </section>
  )
}
