import './ModeSelectionButtons.css';

/**
 * ModeSelectionButtons - Shared mode selection component for games
 * 
 * @param {function} onSelectLocal - Handler for local/single device mode (optional)
 * @param {function} onSelectOnline - Handler for online mode
 * @param {boolean} showLocal - Whether to show the local mode button (default: true)
 * @param {string} localLabel - Custom label for local mode (default: "Play on Single Device")
 * @param {string} localDesc - Custom description for local mode
 * @param {string} onlineLabel - Custom label for online mode (default: "Play with Friends Online")
 * @param {string} onlineDesc - Custom description for online mode
 */
function ModeSelectionButtons({ 
  onSelectLocal, 
  onSelectOnline,
  showLocal = true,
  localLabel = "Play on Single Device",
  localDesc = "Pass and play with friends locally",
  onlineLabel = "Play with Friends Online",
  onlineDesc = "Create or join a lobby"
}) {
  return (
    <div className="mode-selection-buttons">
      {showLocal && onSelectLocal && (
        <button 
          className="btn btn-primary mode-btn"
          onClick={onSelectLocal}
        >
          <div className="mode-icon">🎮</div>
          <div className="mode-title">{localLabel}</div>
          <div className="mode-description">{localDesc}</div>
        </button>
      )}
      
      <button 
        className="btn btn-primary mode-btn"
        onClick={onSelectOnline}
      >
        <div className="mode-icon">🌐</div>
        <div className="mode-title">{onlineLabel}</div>
        <div className="mode-description">{onlineDesc}</div>
      </button>
    </div>
  );
}

export default ModeSelectionButtons;
