import { useState } from 'react';
import PostcardCanvas from './components/PostcardCanvas';
import StampAndPostmark from './components/StampAndPostmark';

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

  // Send dictation text to backend POST /postcard endpoint
  const handleGenerate = async () => {
    if (!text.trim()) return;

    setLoading(true);
    setError(null);

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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="desk-scene">
      {/* 3:2 Paper Postcard in the Center of the Desk */}
      <div className="postcard-wrapper">
        <div className="postcard-card">
          {/* Step 2: Animated stamp & postmark landing on corner after generate succeeds */}
          {postcardData && <StampAndPostmark key={stampKey} show={true} />}

          {/* Handwritten message area with Caveat font */}
          <textarea
            className="postcard-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Press your Wispr Flow hotkey and speak."
            maxLength={1000}
            disabled={loading}
            autoFocus
          />

          {/* Postcard footer with character counter and action button */}
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
      </div>

      {/* Render generative art canvas when postcard is generated */}
      {postcardData && (
        <div style={{ marginTop: '28px', width: '100%', maxWidth: '820px' }}>
          <PostcardCanvas postcard={postcardData} text={text} />
        </div>
      )}

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
