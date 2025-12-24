import React from 'react';
import LobbyCodeDisplay from '../../../shared/components/LobbyCodeDisplay.jsx';

function LobbyWaitingRoom({ lobby, currentSocketId, onStartGame, onLeaveLobby }) {
  const isHost = lobby.hostSocketId === currentSocketId;
  const playerCount = lobby.players.length;
  const canStart = playerCount === 2; // Exactly 2 players for Guess Who

  return (
    <div className="lobby-waiting-room">
      <div className="lobby-header">
        <h2>Waiting Room</h2>
        <button onClick={onLeaveLobby} className="btn btn-secondary">
          Leave Lobby
        </button>
      </div>

      <LobbyCodeDisplay code={lobby.code} />

      <div className="players-section">
        <h3>Players ({playerCount}/2)</h3>
        <div className="players-list">
          {lobby.players.map((player) => (
            <div key={player.socketId} className="player-item">
              <span className="player-name">{player.name}</span>
              {player.isHost && <span className="host-badge">👑 Host</span>}
              {player.socketId === currentSocketId && <span className="you-badge">(You)</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="lobby-status">
        {playerCount < 2 && (
          <div className="waiting-message">
            <p>⏳ Waiting for another player to join...</p>
            <p className="hint">Share the code or link above with your friend!</p>
          </div>
        )}
        {playerCount === 2 && isHost && (
          <div className="ready-message">
            <p>✓ Both players ready!</p>
            <p>Click "Start Game" to begin.</p>
          </div>
        )}
        {playerCount === 2 && !isHost && (
          <div className="waiting-message">
            <p>✓ Both players ready!</p>
            <p>Waiting for host to start the game...</p>
          </div>
        )}
      </div>

      {isHost && canStart && (
        <button 
          onClick={onStartGame} 
          className="btn btn-primary start-button"
        >
          Start Game
        </button>
      )}
    </div>
  );
}

export default LobbyWaitingRoom;
