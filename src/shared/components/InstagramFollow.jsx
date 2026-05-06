import './InstagramFollow.css';

const INSTAGRAM_URL = 'https://www.instagram.com/playfootyarena';

function InstagramIcon({ size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5.5" ry="5.5" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  );
}

function InstagramFollow({ isExpanded, compact }) {
  if (!isExpanded) {
    return (
      <div className="instagram-follow-collapsed">
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="instagram-follow-icon-btn"
          title="Follow @playfootyarena on Instagram"
          aria-label="Follow us on Instagram"
        >
          <InstagramIcon size={22} />
        </a>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="instagram-follow-compact">
        <div className="instagram-follow-compact-top">
          <span className="instagram-follow-icon-wrap" style={{ width: 28, height: 28 }}>
            <InstagramIcon size={16} />
          </span>
          <span className="instagram-follow-handle">@playfootyarena</span>
        </div>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="instagram-follow-btn"
          aria-label="Follow us on Instagram"
        >
          Follow on Instagram
        </a>
      </div>
    );
  }

  return (
    <div className="instagram-follow-card">
      <div className="instagram-follow-header">
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="instagram-follow-icon-link"
          aria-label="Follow us on Instagram"
        >
          <span className="instagram-follow-icon-wrap">
            <InstagramIcon size={20} />
          </span>
        </a>
        <span className="instagram-follow-handle">@playfootyarena</span>
      </div>
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="instagram-follow-btn"
      >
        Follow on Instagram
      </a>
    </div>
  );
}

export default InstagramFollow;
