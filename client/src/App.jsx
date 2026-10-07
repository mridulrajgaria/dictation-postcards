import { useState, useRef, useEffect } from 'react';
import PostcardCanvas from './components/PostcardCanvas';
import StampAndPostmark from './components/StampAndPostmark';
import CorkboardGallery from './components/CorkboardGallery';
import {
  playStampSound,
  playRustleSound,
  getInitialMuteState,
  saveMuteState,
} from './utils/sound';
import {
  loadSavedPostcards,
  savePostcardToGallery,
} from './utils/galleryStorage';

function App() {
  // User's dictated input text
  const [text, setText] = useState('');
  // Returned JSON data from backend
  const [postcardData, setPostcardData] = useState(null);
  // Loading state
  const [loading, setLoading] = useState(false);
  // Request error state
  const [error, setError] = useState(null);
  // Debug JSON panel toggle
  const [showDebug, setShowDebug] = useState(false);
  // Key to re-trigger stamp animation on each generation
  const [stampKey, setStampKey] = useState(0);
  // 3D Card flip state: true shows back (dictation/address), false shows front (generative canvas)
  const [isFlipped, setIsFlipped] = useState(true);
  // Mute state for audio (persisted in localStorage)
  const [isMuted, setIsMuted] = useState(getInitialMuteState);
  // Gallery archive of past postcards loaded from localStorage
  const [gallery, setGallery] = useState(() => loadSavedPostcards());
  // Active selected postcard ID in gallery
  const [activeCardId, setActiveCardId] = useState(null);
  // Friendly handwritten error note state
  const [errorNote, setErrorNote] = useState(null);

  // Ref to canvas component for downloading PNG and saving thumbnail
  const canvasRef = useRef(null);

  // Fallback postcard used when server request fails
  const FALLBACK_POSTCARD = {
    source: 'fallback',
    mood: 'peaceful',
    palette: ['#2E4057', '#048A81', '#54C6EB', '#F4D06F'],
    shapes: 'waves',
    density: 0.5,
    caption: 'A gentle rhythm of today',
  };

  // Toggle mute state
  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      saveMuteState(next);
      return next;
    });
  };

  // Send dictation text to backend POST /postcard endpoint
  const handleGenerate = async (e) => {
    if (e) e.stopPropagation();
    if (!text.trim() || loading) return;

    setLoading(true);
    setError(null);
    setErrorNote(null);

    try {
      const response = await fetch('http://localhost:5000/postcard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();
      setPostcardData(data);
      setStampKey((prev) => prev + 1);

      // Play paper rustle and stamp thud sounds
      playRustleSound(isMuted);
      setTimeout(() => {
        playStampSound(isMuted);
      }, 150);

      // Automatically flip to front to show the generative art
      setIsFlipped(false);

      // Save to gallery archive
      const newId = 'postcard_' + Date.now();
      setActiveCardId(newId);

      // Extract canvas PNG data URL and persist to localStorage gallery
      setTimeout(() => {
        const dataUrl = canvasRef.current?.toDataURL?.();
        const updatedGallery = savePostcardToGallery({
          id: newId,
          dataUrl: dataUrl || null,
          postcardData: data,
          text,
          caption: data.caption,
          date: new Date().toISOString(),
        });
        setGallery(updatedGallery);
      }, 350);
    } catch (err) {
      console.warn('Postcard fetch failed, activating fallback:', err);
      setError(err.message);
      // Friendly handwritten error note
      setErrorNote(
        "Couldn't reach the post office server, so we sketched a peaceful fallback postcard for you. Check your connection and try again anytime."
      );
      // Fallback postcard so user can still see art and flip the card
      setPostcardData(FALLBACK_POSTCARD);
      setStampKey((prev) => prev + 1);
      setIsFlipped(false);
      playRustleSound(isMuted);
    } finally {
      setLoading(false);
    }
  };

  // Toggle card flip with rustle sound
  const handleCardClick = () => {
    playRustleSound(isMuted);
    setIsFlipped((prev) => !prev);
  };

  // Download front canvas as PNG file
  const handleDownloadPng = (e) => {
    if (e) e.stopPropagation();
    const dataUrl = canvasRef.current?.toDataURL?.();
    if (!dataUrl) return;

    const safeCaption = (postcardData?.caption || 'postcard')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 24);

    const link = document.createElement('a');
    link.download = `dictation-${safeCaption}-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  // Load a postcard from the corkboard gallery archive
  const handleSelectGalleryItem = (item) => {
    if (!item) return;
    setPostcardData(item.postcardData);
    setText(item.text || '');
    setActiveCardId(item.id);
    setIsFlipped(false); // Show front art
    playRustleSound(isMuted);
  };

  return (
    <div className="desk-scene">
      {/* Friendly handwritten error note if server fails */}
      {errorNote && (
        <div className="error-note-wrapper" onClick={(e) => e.stopPropagation()}>
          <div className="error-note-card">
            <div className="error-note-pin" />
            <button
              className="error-note-close"
              onClick={() => setErrorNote(null)}
              title="Dismiss note"
            >
              ✕
            </button>
            <div className="error-note-title">A quick note from the postmaster...</div>
            <p className="error-note-text">{errorNote}</p>
          </div>
        </div>
      )}

      {/* Audio Mute Toggle Button */}
      <button
        className="mute-toggle-btn"
        onClick={toggleMute}
        title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
        aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}
      >
        {isMuted ? '🔇' : '🔊'}
      </button>

      {/* 3:2 Paper Postcard with 3D Flip */}
      <div className="postcard-wrapper">
        <div
          className={`postcard-flipper ${isFlipped ? 'is-flipped' : ''}`}
          onClick={handleCardClick}
          title="Click to flip card"
        >
          {/* Flip Hint Badge */}
          {postcardData && (
            <div className="flip-hint-badge">
              ↻ {isFlipped ? 'Click to view Front' : 'Click to view Back'}
            </div>
          )}

          {/* FRONT FACE: Generative Art Canvas & Download PNG Button */}
          <div className="postcard-face postcard-face-front">
            {postcardData ? (
              <>
                <PostcardCanvas ref={canvasRef} postcard={postcardData} text={text} />
                <button
                  className="download-front-btn"
                  onClick={handleDownloadPng}
                  title="Download Postcard as PNG"
                >
                  Download PNG ⤓
                </button>
              </>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9c8d80',
                  fontFamily: 'Caveat, cursive',
                  fontSize: '28px',
                  textAlign: 'center',
                  padding: '20px',
                }}
              >
                <span>Dictation Postcards</span>
                <span style={{ fontSize: '18px', marginTop: '8px', color: '#b0a396' }}>
                  Click to write on the back ↻
                </span>
              </div>
            )}
          </div>

          {/* BACK FACE: Handwritten Message, Stamp, and "To: Future Me" */}
          <div className="postcard-face postcard-face-back">
            <div className="postcard-back-body">
              {/* Left Side: Handwritten message area */}
              <div
                className="postcard-back-message"
                onClick={(e) => e.stopPropagation()}
              >
                <textarea
                  className="postcard-textarea"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Press your Wispr Flow hotkey and speak."
                  maxLength={1000}
                  disabled={loading}
                  autoFocus
                />

                {/* Footer with character count and action button */}
                <div className="postcard-footer">
                  <span className="char-indicator">{text.length}/1000</span>
                  <button
                    className="generate-button"
                    onClick={handleGenerate}
                    disabled={loading || !text.trim()}
                  >
                    {loading ? 'Sketching...' : 'Generate'}
                  </button>
                </div>
              </div>

              {/* Center Divider Line */}
              <div className="postcard-back-divider" />

              {/* Right Side: Stamp & "To: Future Me" Address Line */}
              <div className="postcard-back-address">
                <div className="postcard-back-stamp-slot">
                  {postcardData && <StampAndPostmark key={stampKey} show={true} />}
                </div>

                <div className="postcard-address-lines">
                  <div className="address-line recipient-line">
                    <span className="address-label">To:</span> Future Me
                  </div>
                  <div className="address-line" />
                  <div className="address-line" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step 5: Bottom Corkboard Strip with Taped Thumbnails */}
      <CorkboardGallery
        postcards={gallery}
        onSelectPostcard={handleSelectGalleryItem}
        activeId={activeCardId}
      />

      {/* Small toggle for debug JSON in the bottom corner */}
      <button
        className="debug-toggle-btn"
        onClick={() => setShowDebug((prev) => !prev)}
        title="Toggle Debug JSON"
      >
        {showDebug ? '✕ Debug' : '{ } Debug'}
      </button>

      {/* Collapsible Debug Panel */}
      {showDebug && (
        <div className="debug-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>Debug JSON</strong>
            {postcardData?.source && (
              <span style={{ fontSize: '10px', background: '#351d11', padding: '2px 5px', borderRadius: '3px' }}>
                source: {postcardData.source}
              </span>
            )}
          </div>
          {error && <p style={{ color: '#ff6b6b', margin: '6px 0 0' }}>Error: {error}</p>}
          {postcardData ? (
            <pre>{JSON.stringify(postcardData, null, 2)}</pre>
          ) : (
            <p style={{ color: '#888', margin: '6px 0 0' }}>No postcard data yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
