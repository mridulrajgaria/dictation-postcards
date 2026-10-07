import React from 'react';

/**
 * StampAndPostmark component
 * Renders an animated vintage postage stamp reading "Dictated with Wispr Flow"
 * and a circular postmark with today's date landing on the postcard corner.
 */
export default function StampAndPostmark({ show = true }) {
  if (!show) return null;

  // Format today's date for postmark: e.g. "07 OCT 2026"
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = today.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const year = today.getFullYear();
  const formattedDate = `${day} ${month} ${year}`;

  return (
    <div className="stamp-postmark-container" aria-label="Stamp and Postmark">
      {/* Postage Stamp */}
      <div className="vintage-stamp">
        <div className="stamp-inner">
          <div className="stamp-header">AIR MAIL</div>
          <div className="stamp-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
            <div className="stamp-title">WISPR FLOW</div>
          </div>
          <div className="stamp-caption">DICTATED</div>
        </div>
      </div>

      {/* Circular Postmark / Postal Cancellation Mark */}
      <div className="circular-postmark">
        <div className="postmark-outer-ring">
          <div className="postmark-inner-ring">
            <div className="postmark-city">POSTAL SERVICE</div>
            <div className="postmark-date">{formattedDate}</div>
            <div className="postmark-sub">VERIFIED</div>
          </div>
        </div>
        {/* Postal cancellation waves extending across the stamp */}
        <div className="postmark-waves">
          <svg width="65" height="42" viewBox="0 0 65 42" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M0,7 Q16,0 32,7 T64,7" />
            <path d="M0,17 Q16,10 32,17 T64,17" />
            <path d="M0,27 Q16,20 32,27 T64,27" />
            <path d="M0,37 Q16,30 32,37 T64,37" />
          </svg>
        </div>
      </div>
    </div>
  );
}
