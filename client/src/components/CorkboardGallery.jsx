import React from 'react';

/**
 * CorkboardGallery component
 * Displays a bottom corkboard strip with past postcards as taped/pinned thumbnails.
 * Clicking a thumbnail loads it back into the main postcard view.
 */
export default function CorkboardGallery({ postcards = [], onSelectPostcard, activeId }) {
  if (!postcards || postcards.length === 0) {
    return (
      <div className="corkboard-strip">
        <div className="corkboard-empty">
          <span>📌 Your dictated postcards will pin to this board...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="corkboard-strip" aria-label="Postcard Gallery">
      <div className="corkboard-header">
        <span className="corkboard-pin">📌</span>
        <span className="corkboard-title">POSTCARD ARCHIVE</span>
      </div>

      <div className="corkboard-thumbnails-scroll">
        {postcards.map((item) => {
          const isActive = item.id === activeId;
          const displayDate = item.date
            ? new Date(item.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })
            : '';

          return (
            <div
              key={item.id}
              className={`taped-thumbnail-wrapper ${isActive ? 'active-thumbnail' : ''}`}
              onClick={() => onSelectPostcard(item)}
              title={`Load postcard: "${item.caption || item.text}"`}
            >
              {/* Washi / masking tape strip at the top */}
              <div className="washi-tape" />

              {/* Miniature Postcard Paper Card */}
              <div
                className="taped-thumbnail-card"
                style={{
                  backgroundColor: item.postcardData?.palette?.[0] || '#faf7ee',
                }}
              >
                {item.dataUrl ? (
                  <img
                    src={item.dataUrl}
                    alt={item.caption || 'Saved postcard'}
                    className="thumbnail-img"
                  />
                ) : (
                  <div className="thumbnail-fallback">
                    <span className="thumbnail-fallback-mood">
                      {item.postcardData?.mood || 'Postcard'}
                    </span>
                  </div>
                )}
              </div>

              {/* Caption and Date */}
              <div className="thumbnail-label">
                <span className="thumbnail-caption" title={item.caption}>
                  {item.caption || 'Untitled'}
                </span>
                {displayDate && <span className="thumbnail-date">{displayDate}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
