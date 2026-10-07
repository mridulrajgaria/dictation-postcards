import { useState } from 'react';
import PostcardCanvas from './components/PostcardCanvas';

function App() {
  // User's dictated input text
  const [text, setText] = useState('');
  // Returned JSON data from the backend
  const [postcardData, setPostcardData] = useState(null);
  // Loading state indicator
  const [loading, setLoading] = useState(false);
  // Error state for network/request issues
  const [error, setError] = useState(null);

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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Dictation Postcards</h1>

      {/* Large textarea for dictation input */}
      <div>
        <textarea
          rows={8}
          cols={60}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Dictate or type how your day went..."
          maxLength={1000}
          disabled={loading}
        />
      </div>

      {/* Generate button with loading state */}
      <div style={{ marginTop: '10px' }}>
        <button onClick={handleGenerate} disabled={loading || !text.trim()}>
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </div>

      {/* Display error if server request fails */}
      {error && (
        <div style={{ marginTop: '10px', color: 'red' }}>
          <p>Error: {error}</p>
        </div>
      )}

      {/* Debug view: show the returned JSON */}
      {postcardData && (
        <div style={{ marginTop: '20px' }}>
          <div>
            <strong>Source:</strong> {postcardData.source}
          </div>
          <h3>Returned JSON:</h3>
          <pre>{JSON.stringify(postcardData, null, 2)}</pre>
          <PostcardCanvas postcard={postcardData} text={text} />
        </div>
      )}
    </div>
  );
}

export default App;
