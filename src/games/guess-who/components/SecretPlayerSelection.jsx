import React, { useState } from 'react';

function SecretPlayerSelection({ playerList, onSelectPlayer, waitingForOpponent }) {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  const handlePlayerClick = (playerName) => {
    if (!confirmed) {
      setSelectedPlayer(playerName);
    }
  };

  const handleConfirm = () => {
    if (selectedPlayer) {
      setConfirmed(true);
      onSelectPlayer(selectedPlayer);
    }
  };

  const handleChangeSelection = () => {
    setSelectedPlayer(null);
    setConfirmed(false);
  };

  if (waitingForOpponent && confirmed) {
    return (
      <div className="secret-player-selection">
        <div className="selection-header">
          <h2>Your Secret Player</h2>
          <div className="selected-player-display">
            <div className="selected-player-name">{selectedPlayer}</div>
          </div>
        </div>
        
        <div className="waiting-opponent">
          <div className="spinner"></div>
          <p>Waiting for opponent to select their player...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="secret-player-selection">
      <div className="selection-header">
        <h2>Choose Your Secret Player</h2>
        <p className="selection-instructions">
          Select one player from the board. Your opponent will try to guess who it is!
        </p>
      </div>

      {selectedPlayer && !confirmed && (
        <div className="selected-preview">
          <div className="preview-label">Selected:</div>
          <div className="preview-name">{selectedPlayer}</div>
          <div className="preview-actions">
            <button onClick={handleConfirm} className="btn btn-primary">
              Confirm Selection
            </button>
            <button onClick={handleChangeSelection} className="btn btn-secondary">
              Change
            </button>
          </div>
        </div>
      )}

      <div className="player-selection-grid">
        {playerList.map((player) => {
          const playerName = typeof player === 'string' ? player : player.name;
          const playerImage = typeof player === 'string' ? null : player.image;
          
          return (
            <button
              key={playerName}
              onClick={() => handlePlayerClick(playerName)}
              className={`selection-card ${selectedPlayer === playerName ? 'selected' : ''} ${confirmed ? 'disabled' : ''}`}
              disabled={confirmed}
            >
              <div className="selection-card-content">
                {playerImage && (
                  <div className="selection-card-image">
                    <img 
                      src={playerImage} 
                      alt={playerName}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="selection-card-name">{playerName}</div>
                {selectedPlayer === playerName && (
                  <div className="selection-check">✓</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default SecretPlayerSelection;
