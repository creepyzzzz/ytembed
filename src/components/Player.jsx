import { useEffect, useRef, useState, useCallback } from 'react'
import Controls from './Controls'

// Load YouTube IFrame API
let apiLoadPromise = null
function loadYouTubeAPI() {
  if (apiLoadPromise) return apiLoadPromise
  apiLoadPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve(window.YT)
      return
    }
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)
    window.onYouTubeIframeAPIReady = () => resolve(window.YT)
  })
  return apiLoadPromise
}

export default function Player({ 
  videoId, 
  streamTitle,
  currentTime,
  setCurrentTime,
  duration,
  setDuration
}) {
  const containerRef = useRef(null)
  const playerRef = useRef(null)
  const playerDivRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const hideTimeout = useRef(null)
  
  const [isBuffering, setIsBuffering] = useState(true)
  const [showRipple, setShowRipple] = useState(null)
  const [isScrubbing, setIsScrubbing] = useState(false)
  const progressBarRef = useRef(null)
  
  const [showSettings, setShowSettings] = useState(false)
  const [settingsView, setSettingsView] = useState('main')
  
  // Local storage memory
  const [quality, setQuality] = useState(() => localStorage.getItem('sv_quality') || '1080p')
  const [playbackRate, setPlaybackRate] = useState(1)
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('sv_volume')
    return saved !== null ? parseInt(saved) : 80
  })
  
  // Chapter markers state
  const [chapters, setChapters] = useState([
    { time: 0, title: 'Introduction' },
    { time: 120, title: 'Early Game' },
    { time: 450, title: 'Mid Game Conflict' },
    { time: 800, title: 'End Game' }
  ])
  
  const RESOLUTIONS = ['1080p', '720p', '480p', '360p', 'Auto']

  // Create / update player
  useEffect(() => {
    if (!videoId) return

    let destroyed = false

    async function initPlayer() {
      const YT = await loadYouTubeAPI()
      if (destroyed) return

      if (playerRef.current) {
        try { playerRef.current.destroy() } catch (e) { /* ignore */ }
        playerRef.current = null
      }

      if (playerDivRef.current) {
        playerDivRef.current.remove()
      }
      const div = document.createElement('div')
      div.id = 'yt-player-target'
      containerRef.current?.querySelector('.video-container')?.appendChild(div)
      playerDivRef.current = div

      playerRef.current = new YT.Player('yt-player-target', {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 1,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          disablekb: 1,
          fs: 0,
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            if (destroyed) return
            setIsReady(true)
            setIsBuffering(false)
            event.target.setVolume(volume)
            
            // Apply loaded quality
            const qMap = { '1080p': 'hd1080', '720p': 'hd720', '480p': 'large', '360p': 'medium', 'Auto': 'default' }
            try { event.target.setPlaybackQuality(qMap[quality]); } catch(e) {}
            
            setDuration(event.target.getDuration() || 0)
          },
          onStateChange: (event) => {
            if (destroyed) return
            
            setIsPlaying(event.data === YT.PlayerState.PLAYING)
            setIsBuffering(event.data === YT.PlayerState.BUFFERING || event.data === -1)
            
            if (event.data === YT.PlayerState.PLAYING) {
              setDuration(event.target.getDuration() || 0)
            }
          },
        },
      })
    }

    setIsReady(false)
    initPlayer()

    return () => {
      destroyed = true
      if (playerRef.current) {
        try { playerRef.current.destroy() } catch (e) { /* ignore */ }
        playerRef.current = null
      }
    }
  }, [videoId])

  // Track progress
  useEffect(() => {
    let interval;
    if (isPlaying && isReady && !isScrubbing) {
      interval = setInterval(() => {
        if (playerRef.current && playerRef.current.getCurrentTime) {
          setCurrentTime(playerRef.current.getCurrentTime() || 0);
          setDuration(playerRef.current.getDuration() || 0);
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isReady, isScrubbing]);

  // Control handlers
  const togglePlay = useCallback(() => {
    if (!playerRef.current) return
    if (isPlaying) {
      playerRef.current.pauseVideo()
    } else {
      playerRef.current.playVideo()
    }
  }, [isPlaying])

  const toggleMute = useCallback(() => {
    if (!playerRef.current) return
    if (isMuted) {
      playerRef.current.unMute()
      playerRef.current.setVolume(volume)
      setIsMuted(false)
    } else {
      playerRef.current.mute()
      setIsMuted(true)
    }
  }, [isMuted, volume])

  const handleVolumeChange = useCallback((val) => {
    if (!playerRef.current) return
    setVolume(val)
    localStorage.setItem('sv_volume', val)
    playerRef.current.setVolume(val)
    if (val === 0) {
      playerRef.current.mute()
      setIsMuted(true)
    } else if (isMuted) {
      playerRef.current.unMute()
      setIsMuted(false)
    }
  }, [isMuted])

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current?.querySelector('.video-container')
    if (!el) return
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(e => console.error(e))
    } else {
      el.requestFullscreen().catch(e => console.error(e))
    }
  }, [])

  // Handle Fullscreen Screen Rotation
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        try { window.screen.orientation.lock('landscape').catch(() => {}) } catch(e) {}
      } else {
        try { window.screen.orientation.unlock() } catch(e) {}
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleScrubStart = useCallback((e) => {
    if (!duration || !playerRef.current) return;
    setIsScrubbing(true);
    
    // Only update visual state on start, don't seek yet
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    if (clientX !== undefined && progressBarRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      setCurrentTime(pos * duration);
    }
  }, [duration, setCurrentTime]);

  const handleScrubMove = useCallback((e) => {
    if (!isScrubbing || !progressBarRef.current || !duration) return;
    
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    if (clientX === undefined) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setCurrentTime(pos * duration);
  }, [isScrubbing, duration, setCurrentTime]);

  const handleScrubEnd = useCallback(() => {
    if (isScrubbing && playerRef.current) {
      // Perform the actual seek only when the user releases
      playerRef.current.seekTo(currentTime, true);
      setIsScrubbing(false);
    }
  }, [isScrubbing, currentTime]);

  useEffect(() => {
    if (isScrubbing) {
      window.addEventListener('mousemove', handleScrubMove);
      window.addEventListener('mouseup', handleScrubEnd);
      window.addEventListener('touchmove', handleScrubMove, { passive: false });
      window.addEventListener('touchend', handleScrubEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleScrubMove);
      window.removeEventListener('mouseup', handleScrubEnd);
      window.removeEventListener('touchmove', handleScrubMove);
      window.removeEventListener('touchend', handleScrubEnd);
    };
  }, [isScrubbing, handleScrubMove, handleScrubEnd]);

  // Auto-hide controls
  const handleMouseMove = useCallback(() => {
    setShowControls(true)
    if (hideTimeout.current) clearTimeout(hideTimeout.current)
    
    if (isScrubbing) return; // Don't hide while scrubbing
    
    hideTimeout.current = setTimeout(() => {
      setShowControls(false)
      setShowSettings(false)
      setSettingsView('main')
    }, 4000)
  }, [isScrubbing])

  const handleMouseLeave = useCallback(() => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current)
    
    if (isScrubbing) return; // Don't hide while scrubbing

    hideTimeout.current = setTimeout(() => {
      setShowControls(false)
      setShowSettings(false)
      setSettingsView('main')
    }, 1500)
  }, [isScrubbing])

  const handleQualitySelect = (res) => {
    setQuality(res);
    localStorage.setItem('sv_quality', res);
    setShowSettings(false);
    setSettingsView('main');
    if (playerRef.current && playerRef.current.setPlaybackQuality) {
      const qMap = { '1080p': 'hd1080', '720p': 'hd720', '480p': 'large', '360p': 'medium', 'Auto': 'default' };
      try { playerRef.current.setPlaybackQuality(qMap[res]); } catch(e) {}
    }
  }

  const handleSpeedSelect = (rate) => {
    setPlaybackRate(rate);
    setShowSettings(false);
    setSettingsView('main');
    if (playerRef.current && playerRef.current.setPlaybackRate) {
      playerRef.current.setPlaybackRate(rate);
    }
  }

  const handleSettingsToggle = useCallback((e) => {
    if (e) e.stopPropagation();
    setShowSettings(prev => {
      if (!prev) setSettingsView('main');
      return !prev;
    });
  }, []);

  const seekBackward = useCallback(() => {
    if (playerRef.current) {
      const time = Math.max(0, playerRef.current.getCurrentTime() - 10);
      playerRef.current.seekTo(time, true);
      setCurrentTime(time);
    }
  }, []);

  const seekForward = useCallback(() => {
    if (playerRef.current) {
      const time = Math.min(duration, playerRef.current.getCurrentTime() + 10);
      playerRef.current.seekTo(time, true);
      setCurrentTime(time);
    }
  }, [duration]);

  const catchLive = useCallback(() => {
    if (playerRef.current && duration) {
      playerRef.current.seekTo(duration, true);
      setCurrentTime(duration);
      if (!isPlaying) togglePlay();
    }
  }, [duration, isPlaying, togglePlay]);

  const handleVideoClick = useCallback((e) => {
    if (e) e.stopPropagation();

    if (showSettings) {
      setShowSettings(false);
      setSettingsView('main');
      return;
    }

    // Double tap detection
    if (e.detail === 2) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const isLeft = clientX - rect.left < rect.width / 2;
      
      if (isLeft) seekBackward();
      else seekForward();

      togglePlay(); // Undo the pause triggered by the first click of the double-tap
      
      setShowRipple(isLeft ? 'left' : 'right');
      setTimeout(() => setShowRipple(null), 500);
      return;
    }

    togglePlay();
  }, [showSettings, togglePlay, seekBackward, seekForward]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing in a chat input or form
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      switch(e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'arrowleft':
        case 'j':
          e.preventDefault();
          seekBackward();
          break;
        case 'arrowright':
        case 'l':
          e.preventDefault();
          seekForward();
          break;
        case 'arrowup':
          e.preventDefault();
          handleVolumeChange(Math.min(100, volume + 10));
          break;
        case 'arrowdown':
          e.preventDefault();
          handleVolumeChange(Math.max(0, volume - 10));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, toggleFullscreen, toggleMute, seekBackward, seekForward, handleVolumeChange, volume]);

  const formatTime = (timeInSeconds) => {
    if (!timeInSeconds) return "0:00";
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="player-card" ref={containerRef}>
      <div
        className="video-container"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={videoId && isReady ? handleVideoClick : undefined}
      >
        {!videoId && (
          <div className="video-placeholder">
            <div className="video-placeholder__icon">
              <svg viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            <span className="video-placeholder__text">
              Paste a YouTube URL below to start
            </span>
          </div>
        )}

        {videoId && isBuffering && (
          <div className="buffering-spinner">
            <div className="spinner-ring"></div>
          </div>
        )}

        {showRipple && (
          <div className={`seek-ripple seek-ripple--${showRipple}`}>
            <svg viewBox="0 0 24 24">
              {showRipple === 'left' 
                ? <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/>
                : <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/>}
            </svg>
            <span>{showRipple === 'left' ? '-10s' : '+10s'}</span>
          </div>
        )}

        {/* Overlay to catch clicks and show big play button when paused (no custom image) */}
        {videoId && isReady && !isPlaying && (
          <div 
            className={`thumbnail-overlay ${!showControls ? 'thumbnail-overlay--hidden' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              handleVideoClick(e);
            }}
          >
            <div className="big-play-btn">
              <svg viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        )}

        {videoId && isReady && (
          <div className={`video-overlay ${showControls ? 'video-overlay--visible' : ''}`}>
            <div className="video-overlay__top"></div>

            <div className="video-overlay__bottom" onClick={(e) => e.stopPropagation()}>
              
              {/* Progress bar & Live Button Row */}
              <div className="progress-row">
                <div 
                  className={`progress-bar ${isScrubbing ? 'scrubbing' : ''}`}
                  ref={progressBarRef}
                  onMouseDown={handleScrubStart}
                  onTouchStart={handleScrubStart}
                >
                  <div 
                    className="progress-bar__fill" 
                    style={{ 
                      width: `${progressPercent}%`,
                      transition: isScrubbing ? 'none' : 'width 0.1s linear'
                    }}
                  >
                    <div className="progress-bar__thumb"></div>
                  </div>

                  {/* Chapter Markers */}
                  {duration > 0 && chapters.map((chapter, index) => (
                    <div 
                      key={index}
                      className="chapter-marker"
                      style={{ left: `${(chapter.time / duration) * 100}%` }}
                      title={chapter.title}
                    />
                  ))}
                </div>

                <button 
                  className={`live-sync-btn ${duration > 0 && (duration - currentTime) < 5 ? 'active' : ''}`} 
                  onClick={catchLive} 
                  title="Catch Live Stream"
                >
                  <span className="live-sync-btn__dot"></span> 
                  {(duration > 0 && (duration - currentTime) < 5) ? 'Synced' : 'Live'}
                </button>
              </div>

              {showSettings && (
                <div className="settings-menu" onClick={e => e.stopPropagation()}>
                  {settingsView === 'main' && (
                    <>
                      <div className="settings-menu__item" onClick={() => setSettingsView('quality')}>
                        <span>Quality</span>
                        <span>{quality} &rsaquo;</span>
                      </div>
                      <div className="settings-menu__item" onClick={() => setSettingsView('speed')}>
                        <span>Playback Speed</span>
                        <span>{playbackRate === 1 ? 'Normal' : `${playbackRate}x`} &rsaquo;</span>
                      </div>
                    </>
                  )}
                  {settingsView === 'quality' && (
                    <>
                      <div className="settings-menu__header" onClick={() => setSettingsView('main')}>
                        &lsaquo; Quality
                      </div>
                      {RESOLUTIONS.map(res => (
                        <div 
                          key={res} 
                          className={`settings-menu__item ${quality === res ? 'active' : ''}`}
                          onClick={() => handleQualitySelect(res)}
                        >
                          {res}
                          {quality === res && (
                            <svg viewBox="0 0 24 24" style={{width: 16, height: 16, fill: 'currentColor'}}>
                              <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                            </svg>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                  {settingsView === 'speed' && (
                    <>
                      <div className="settings-menu__header" onClick={() => setSettingsView('main')}>
                        &lsaquo; Playback Speed
                      </div>
                      {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(rate => (
                        <div 
                          key={rate} 
                          className={`settings-menu__item ${playbackRate === rate ? 'active' : ''}`}
                          onClick={() => handleSpeedSelect(rate)}
                        >
                          {rate === 1 ? 'Normal' : `${rate}x`}
                          {playbackRate === rate && (
                            <svg viewBox="0 0 24 24" style={{width: 16, height: 16, fill: 'currentColor'}}>
                              <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                            </svg>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

              <Controls
                isPlaying={isPlaying}
                isMuted={isMuted}
                volume={volume}
                timeString={`${formatTime(currentTime)} / ${formatTime(duration)}`}
                onTogglePlay={togglePlay}
                onToggleMute={toggleMute}
                onVolumeChange={handleVolumeChange}
                onToggleFullscreen={toggleFullscreen}
                onToggleSettings={handleSettingsToggle}
                onSeekBackward={seekBackward}
                onSeekForward={seekForward}
              />
            </div>
          </div>
        )}
      </div>

      <div className="video-info">
        <h2 className="video-info__title">
          {videoId ? (streamTitle || 'Live Stream') : 'StreamView Player'}
        </h2>
        {videoId ? (
          <>
            <div className="video-info__channel">
              <div className="video-info__avatar"></div>
              <span className="video-info__channel-name">Moonlit Studio</span>
              <svg className="video-info__verified" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <p className="video-info__meta">12.4K views · Started 45m ago</p>
          </>
        ) : (
          <p className="video-info__meta">Enter a YouTube URL to begin streaming</p>
        )}
      </div>
    </div>
  )
}
