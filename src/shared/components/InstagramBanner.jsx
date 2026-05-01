import './InstagramBanner.css';

const INSTAGRAM_URL = 'https://www.instagram.com/playfootyarena';

function InstagramBanner() {
  return (
    <div className="ig-pill-wrap">
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="ig-pill"
        aria-label="Follow @playfootyarena on Instagram"
      >
        <span className="ig-pill-icon">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="2" y="2" width="20" height="20" rx="5.5" ry="5.5" stroke="currentColor" strokeWidth="2.2" fill="none" />
            <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="2.2" fill="none" />
            <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" />
          </svg>
        </span>
        <span className="ig-pill-handle">@playfootyarena</span>
        <span className="ig-pill-sep">·</span>
        <span className="ig-pill-tagline">Stay up to date &amp; take part in fan questions</span>
        <span className="ig-pill-follow">Follow ↗</span>
      </a>
    </div>
  );
}

export default InstagramBanner;
