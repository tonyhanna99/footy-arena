import React from 'react';

function ModeSelection({ onSelectMode }) {
  return (
    <div className="mode-selection">
      <h2>Choose Game Mode</h2>
      <div className="mode-buttons">
        <button 
          className="btn btn-primary mode-btn"
          onClick={() => onSelectMode('local')}
        >
          <div className="mode-icon">🎮</div>
          <div className="mode-title">Play on Single Device</div>
          <div className="mode-description">Pass and play with friends locally</div>
        </button>
        
        <button 
          className="btn btn-primary mode-btn"
          onClick={() => onSelectMode('online')}
        >
          <div className="mode-icon">🌐</div>
          <div className="mode-title">Play with Friends Online</div>
          <div className="mode-description">Create or join a lobby</div>
        </button>
      </div>
    </div>
  );
}

export default ModeSelection;
