import { useState, useCallback } from 'react'
import Header from './components/Header'
import Player from './components/Player'
import InputBar from './components/InputBar'

function extractVideoId(input) {
  if (!input) return null
  const trimmed = input.trim()

  // Try full YouTube URL patterns
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ]

  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    if (match) return match[1]
  }

  // If it looks like a raw video ID (11 chars, alphanumeric + dash/underscore)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed
  }

  return null
}

export default function App() {
  const [videoId, setVideoId] = useState(null)
  const [streamTitle, setStreamTitle] = useState('')
  const [showChat, setShowChat] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const handleLoadStream = useCallback((url) => {
    const id = extractVideoId(url)
    if (id) {
      setVideoId(id)
      setStreamTitle('Live Stream')
    }
  }, [])

  const isAtLiveEdge = duration > 0 && (duration - currentTime) < 5;

  return (
    <div className="app">
      <Header />

      <div className={`status-bar ${!showChat ? 'status-bar--centered' : ''}`}>
        <div className="status-bar__left">
          {videoId && (
            <>
              <span className={`live-badge ${isAtLiveEdge ? 'live-badge--synced' : ''}`}>
                <span className="live-badge__dot"></span>
                {isAtLiveEdge ? 'SYNCED' : 'LIVE'}
              </span>
              <span className="status-bar__viewers">Streaming</span>
            </>
          )}
        </div>
        <div className="status-bar__right">
          {videoId && (
            <>
              <button 
                className="action-btn" 
                title={showChat ? "Hide Chat" : "Show Chat"}
                onClick={() => setShowChat(!showChat)}
                style={{ background: showChat ? 'var(--accent-soft)' : '', color: showChat ? 'var(--accent)' : '' }}
              >
                <svg viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                </svg>
              </button>
              <button className="action-btn" title="Share" id="share-btn">
                <svg viewBox="0 0 24 24">
                  <path d="M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z"/>
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      <div className={`main-content ${!showChat ? 'main-content--centered' : ''}`}>
        <div className="player-section">
          <Player 
            videoId={videoId} 
            streamTitle={streamTitle}
            currentTime={currentTime}
            setCurrentTime={setCurrentTime}
            duration={duration}
            setDuration={setDuration}
          />
          <InputBar onLoad={handleLoadStream} />
        </div>
        
        {videoId && showChat && (
          <div className="chat-section">
            <div className="chat-header">
              <h3>Live Chat</h3>
              <button className="action-btn" onClick={() => setShowChat(false)} style={{ width: 32, height: 32 }}>
                <svg viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
            <iframe 
              className="chat-iframe"
              src={`https://www.youtube.com/live_chat?v=${videoId}&embed_domain=${window.location.hostname}`}
            ></iframe>
          </div>
        )}
      </div>
    </div>
  )
}
