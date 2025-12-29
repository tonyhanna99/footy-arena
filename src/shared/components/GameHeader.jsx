import './GameHeader.css';

/**
 * GameHeader - A shared header component for all games
 * 
 * @param {string} title - The game title (e.g., "Football Alphabet")
 * @param {string} subtitle - Optional subtitle/description
 * @param {string} icon - Optional emoji icon
 * @param {boolean} centered - Whether to center the header (default: true)
 */
function GameHeader({ title, subtitle, icon, centered = true }) {
  return (
    <div className={`game-header-component ${centered ? 'centered' : ''}`}>
      {icon && <div className="game-header-icon">{icon}</div>}
      <h1 className="game-header-title">{title}</h1>
      {subtitle && <p className="game-header-subtitle">{subtitle}</p>}
    </div>
  );
}

export default GameHeader;
