import React, { useState, useEffect, useRef } from 'react';

function GameBoard({ 
  playerList, 
  secretPlayer, 
  flippedPlayers, 
  onToggleFlip,
  lobby,
  selectionMode = false,
  waitingForOpponent = false,
  onSelectSecretPlayer,
  onStartNewRound
}) {
  const [showPlayersModal, setShowPlayersModal] = useState(false);
  const [tempSelectedPlayer, setTempSelectedPlayer] = useState(null);
  const playerCount = lobby?.players?.length || 0;
  const myPlayer = lobby?.players?.find(p => p.socketId === lobby.mySocketId);
  const isHost = lobby?.hostSocketId === lobby?.mySocketId;
  
  // Track the player list to detect when it changes (new round)
  const prevPlayerListRef = useRef(playerList);
  
  // Reset tempSelectedPlayer when player list changes (new round)
  useEffect(() => {
    if (playerList !== prevPlayerListRef.current && playerList.length > 0) {
      console.log('GameBoard: Player list changed - clearing tempSelectedPlayer for new round');
      setTempSelectedPlayer(null);
      prevPlayerListRef.current = playerList;
    }
  }, [playerList]);
  
  const handleCardClick = (playerName) => {
    if (selectionMode) {
      // In selection mode, clicking selects the secret player
      if (!waitingForOpponent) {
        setTempSelectedPlayer(playerName);
      }
    } else {
      // In playing mode, clicking flips the card
      onToggleFlip(playerName);
    }
  };

  const handleConfirmSelection = () => {
    if (tempSelectedPlayer && onSelectSecretPlayer) {
      onSelectSecretPlayer(tempSelectedPlayer);
    }
  };

  const handleCancelSelection = () => {
    setTempSelectedPlayer(null);
  };
  
  return (
    <div className="guess-who-gameplay">
      {/* Selection Mode Header */}
      {selectionMode && (
        <div className="selection-mode-header">
          <h2>Choose Your Secret Player</h2>
          <p className="selection-instructions">
            Click on a player card below to select your secret player. Your opponent will try to guess who it is!
          </p>
          
          {tempSelectedPlayer && !waitingForOpponent && (
            <div className="selection-confirmation-compact">
              <span className="selected-player-name">{tempSelectedPlayer}</span>
              <div className="selection-icons">
                <button 
                  onClick={handleConfirmSelection} 
                  className="icon-btn icon-btn-confirm"
                  title="Confirm selection"
                >
                  ✓
                </button>
                <button 
                  onClick={handleCancelSelection} 
                  className="icon-btn icon-btn-cancel"
                  title="Cancel selection"
                >
                  ✗
                </button>
              </div>
            </div>
          )}

          {waitingForOpponent && (
            <div className="waiting-message">
              <div className="spinner"></div>
              <p>Waiting for opponent to choose their player...</p>
            </div>
          )}
        </div>
      )}

      {/* Playing Mode Header */}
      {!selectionMode && (
        <>
          {/* Game Info */}
          <div className="game-info">
            <div className="info-item">
              <span className="info-label">Lobby:</span>
              <span className="info-value">{lobby?.code}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Players:</span>
              <span className="info-value">{playerCount}</span>
              <button 
                className="players-info-button"
                onClick={() => setShowPlayersModal(true)}
                title="View players in lobby"
              >
                ?
              </button>
            </div>
            {isHost && onStartNewRound && (
              <button 
                className="btn btn-new-round"
                onClick={onStartNewRound}
                title="Start a new round with different players"
              >
                <span className="new-round-icon">🔄</span>
                <span className="new-round-text-full">New Round</span>
                <span className="new-round-text-short">New</span>
              </button>
            )}
          </div>

          {/* Instructions */}
          <div className="game-instructions">
            <p>💡 Click on cards to flip them up or down as you narrow down your guesses</p>
          </div>
        </>
      )}

      {/* Game Board */}
      <div className="guess-who-board">
        <div className="board-grid">
          {playerList.map((player) => {
            const playerName = typeof player === 'string' ? player : player.name;
            const playerImage = typeof player === 'string' ? null : player.image;
            const isFlipped = flippedPlayers.has(playerName);
            const isSelected = selectionMode && tempSelectedPlayer === playerName;
            const isDisabled = selectionMode && waitingForOpponent;
            
            return (
              <div 
                key={playerName}
                className="board-card-container"
              >
                <button
                  onClick={() => handleCardClick(playerName)}
                  className={`board-card ${isFlipped ? 'flipped' : ''} ${isSelected ? 'selecting' : ''} ${isDisabled ? 'disabled' : ''}`}
                  title={selectionMode ? 'Click to select as your secret player' : `Click to flip ${isFlipped ? 'up' : 'down'}`}
                  disabled={isDisabled}
                >
                  <div className="card-inner">
                    <div className="card-front">
                      <div className="card-image-placeholder">
                        {playerImage ? (
                          <img 
                            src={playerImage} 
                            alt={playerName}
                            className="player-image"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="no-image">?</div>
                        )}
                      </div>
                      <div className="card-name">{playerName}</div>
                    </div>
                    <div className="card-back">
                      <div className="card-back-content"></div>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="selection-indicator">✓</div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Secret Player Card at Bottom - Only show in playing mode */}
      {!selectionMode && secretPlayer && (
        <div className="secret-player-card-container">
          <div className="secret-player-card">
            <div className="card-image-placeholder">
              {(() => {
                const secretPlayerObj = playerList.find(p => 
                  (typeof p === 'string' ? p : p.name) === secretPlayer
                );
                const secretImage = secretPlayerObj && typeof secretPlayerObj !== 'string' 
                  ? secretPlayerObj.image 
                  : null;
                
                return secretImage ? (
                  <img 
                    src={secretImage} 
                    alt={secretPlayer}
                    className="player-image"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="no-image">?</div>
                );
              })()}
            </div>
            <div className="card-name">{secretPlayer}</div>
          </div>
        </div>
      )}

      {/* Players Modal */}
      {showPlayersModal && (
        <div className="modal-overlay" onClick={() => setShowPlayersModal(false)}>
          <div className="players-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Players in Game</h3>
              <button 
                className="modal-close-button"
                onClick={() => setShowPlayersModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-players-list">
              {lobby?.players?.map((player) => (
                <div key={player.socketId} className="modal-player-item">
                  <span className="player-name">{player.name}</span>
                  {player.socketId === lobby.mySocketId && (
                    <span className="you-badge">(You)</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GameBoard;
