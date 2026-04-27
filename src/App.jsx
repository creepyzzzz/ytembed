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
    <div className="app-container">
      <Header />
      <main className="app-content">

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
                aria-label={showChat ? "Hide Chat" : "Show Chat"}
                onClick={() => setShowChat(!showChat)}
                style={{ background: showChat ? 'var(--accent-soft)' : '', color: showChat ? 'var(--accent)' : '' }}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
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
        </div>
        
        {videoId && showChat && (
          <div className="chat-section">
            <div className="chat-header">
              <h3>Live Chat</h3>
              <div className="chat-header__actions">
                <button 
                  className="action-btn" 
                  title="Popout Chat"
                  aria-label="Popout Chat"
                  onClick={() => window.open(`https://www.youtube.com/live_chat?v=${videoId}`, '_blank', 'width=400,height=600')}
                >
                  <svg viewBox="0 0 24 24" style={{ width: 16, height: 16 }} aria-hidden="true">
                    <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                  </svg>
                </button>
                <button className="action-btn" onClick={() => setShowChat(false)} title="Close Chat" aria-label="Close Chat">
                  <svg viewBox="0 0 24 24" style={{ width: 16, height: 16 }} aria-hidden="true">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              </div>
            </div>
            <iframe 
              className="chat-iframe"
              title="YouTube Live Chat"
              src={`https://www.youtube.com/live_chat?v=${videoId}&embed_domain=${window.location.hostname}`}
            ></iframe>
          </div>
        )}

        <InputBar onLoad={handleLoadStream} />
      </div>
    </main>
    </div>
  )
}
