import React from 'react';

function ModeSelection({ onSelectMode }) {
  return (
    <div className="guess-who-mode-selection">
      <div className="mode-container">
        <h1 className="game-title">Football Guess Who?</h1>
        <p className="game-description">
          Play the classic Guess Who game with football players!
        </p>

        <div className="mode-options">
          <button
            onClick={() => onSelectMode('online')}
            className="mode-button mode-button-online"
          >
            <div className="mode-icon">🌐</div>
            <div className="mode-label">Online Mode</div>
            <div className="mode-desc">Play with a friend online</div>
          </button>
        </div>

        <div className="how-to-play">
          <h3>How to Play</h3>
          <ul>
            <li>Each player selects a secret footballer</li>
            <li>Take turns asking yes/no questions</li>
            <li>Flip down cards to eliminate players</li>
            <li>First to guess the opponent's player wins!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ModeSelection;
