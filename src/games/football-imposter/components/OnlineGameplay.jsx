import React, { useState } from 'react';
import RevealModal from './RevealModal.jsx';

function OnlineGameplay({ lobby, myRole, footballer, footballerImage, currentSocketId, onNewRound, onBackToLobby }) {
  const [showModal, setShowModal] = useState(false);
  const [hasRevealed, setHasRevealed] = useState(false);

  if (!lobby || !myRole) {
    return (
      <div className="online-gameplay">
        <div className="loading">Loading game...</div>
      </div>
    );
  }

  const players = lobby.players || [];
  // Use imposter count from lobby data (provided by backend)
  const imposterCount = lobby.imposterCount || 0;
  
  // Find current player's info by socketId
  const myPlayer = players.find(p => p.socketId === currentSocketId);
  const myName = myPlayer?.name || 'You';

  const isImposter = myRole === 'imposter';

  // Debug logging
  console.log('OnlineGameplay - myRole:', myRole);
  console.log('OnlineGameplay - footballer:', footballer);
  console.log('OnlineGameplay - isImposter:', isImposter);
  console.log('OnlineGameplay - lobby:', lobby);

  // Create reveal object for the modal
  const reveal = {
    isImposter: isImposter,
    word: footballer,
    image: footballerImage,
  };

  const handlePlayerClick = () => {
    // Allow re-clicking to see role again (unlike local mode)
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleMarkRevealed = () => {
    setHasRevealed(true);
    setShowModal(false);
  };

  return (
    <>
      <div className="online-gameplay">
        <div className="game-header-info">
          <h2>Game Started!</h2>
          <div className="lobby-code-small">Lobby: {lobby.code}</div>
        </div>

        {/* Imposter Count Badge - Standalone */}
        <div className="imposter-count-badge">
          <div className="imposter-count-icon">⚠️</div>
          <div className="imposter-count-text">
            <div className="imposter-count-number">{imposterCount}</div>
            <div className="imposter-count-label">IMPOSTER{imposterCount !== 1 ? 'S' : ''}</div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Your Role</h3>
            <p className="card-description">
              Tap your name to see your role.
            </p>
          </div>

          <div className="players-grid">
            <button
              onClick={handlePlayerClick}
              className={`player-button ${hasRevealed ? 'revealed' : ''}`}
            >
              <div className="player-button-content">
                <div className="player-button-name">{myName}</div>
              </div>
            </button>
          </div>
        </div>

        {/* Show all players in the lobby */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Players in Session ({players.length})</h3>
          </div>
          <div className="players-list">
            {players.map((player) => (
              <div key={player.socketId} className="player-item">
                <span className="player-name">{player.name}</span>
                {player.socketId === currentSocketId && <span className="you-badge">(You)</span>}
              </div>
            ))}
          </div>
        </div>

        {hasRevealed && (
          <div className="game-instructions">
            <h3>How to Play:</h3>
            <ol>
              <li>Take turns giving clues about the footballer</li>
              <li>Imposters must try to blend in without knowing who the player is</li>
              <li>Discuss and vote to eliminate suspects</li>
              <li>Crew wins if they find all imposters</li>
              <li>Imposters win if they remain undetected</li>
            </ol>
          </div>
        )}

        <div className="game-actions">
          {/* Only host can start new round */}
          {lobby.hostSocketId === currentSocketId && (
            <button onClick={onNewRound} className="btn btn-primary">
              New Round
            </button>
          )}
          <button onClick={onBackToLobby} className="btn btn-secondary">
            End Game
          </button>
        </div>
      </div>

      {showModal && (
        <RevealModal
          player={{ name: myName }}
          reveal={reveal}
          onClose={handleCloseModal}
          onMarkRevealed={handleMarkRevealed}
        />
      )}
    </>
  );
}

export default OnlineGameplay;
