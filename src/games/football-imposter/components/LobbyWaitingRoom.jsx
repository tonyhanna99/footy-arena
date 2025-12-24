import React, { useState, useEffect } from 'react';
import LobbyCodeDisplay from '../../../shared/components/LobbyCodeDisplay.jsx';

function LobbyWaitingRoom({ lobby, currentSocketId, onStartGame, onLeaveLobby, socket }) {
  const isHost = lobby.hostSocketId === currentSocketId;
  const playerCount = lobby.players.length;
  const canStart = playerCount >= 3; // Minimum 3 players like local mode
  
  const [imposterCount, setImposterCount] = useState(lobby.selectedImposterCount || 1);
  const [error, setError] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  // Sync with lobby's selectedImposterCount when it changes
  useEffect(() => {
    if (lobby.selectedImposterCount) {
      setImposterCount(lobby.selectedImposterCount);
    }
  }, [lobby.selectedImposterCount]);

  const handleImposterChange = (e) => {
    const value = parseInt(e.target.value);
    setImposterCount(value);
    
    // Validate
    if (value < 1 || value > 3) {
      setError('Imposter count must be between 1 and 3');
    } else if (value >= playerCount) {
      setError('Imposter count must be less than player count');
    } else {
      setError('');
    }
    
    // Broadcast to other players if host
    if (isHost && socket) {
      socket.emit('updateImposterCount', { 
        code: lobby.code, 
        imposterCount: value 
      });
    }
  };

  const handleStartGame = () => {
    // Validate before starting
    if (imposterCount < 1 || imposterCount > 3) {
      setError('Imposter count must be between 1 and 3');
      return;
    }
    if (imposterCount >= playerCount) {
      setError('Imposter count must be less than player count');
      return;
    }
    
    setIsStarting(true);
    onStartGame(imposterCount);
  };

  return (
    <div className="lobby-waiting-room">
      <LobbyCodeDisplay code={lobby.code} label="Share this code with your friends:" />

      <div className="players-section">
        <h3>Players ({playerCount})</h3>
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

      {lobby.status === 'waiting' && (
        <div className="game-settings-section">
          <h3>Game Settings</h3>
          <div className="form-group">
            <label htmlFor="imposters">Number of Imposters:</label>
            {isHost ? (
              <select
                id="imposters"
                value={imposterCount}
                onChange={handleImposterChange}
                className="form-select"
              >
                <option value="1">1 Imposter</option>
                <option value="2">2 Imposters</option>
                <option value="3">3 Imposters</option>
              </select>
            ) : (
              <div className="imposter-count-display">
                {imposterCount} {imposterCount === 1 ? 'Imposter' : 'Imposters'}
              </div>
            )}
          </div>
          {error && <div className="error-message">{error}</div>}
        </div>
      )}

      <div className="lobby-status">
        {lobby.status === 'waiting' && (
          <div className="waiting-message">
            {isHost ? (
              canStart ? (
                <p>Ready to start! Click "Start Game" when everyone has joined.</p>
              ) : (
                <p>Waiting for more players to join... (minimum 3 players required)</p>
              )
            ) : (
              <p>Waiting for host to start the game...</p>
            )}
          </div>
        )}
      </div>

      <div className="lobby-actions">
        {isHost && lobby.status === 'waiting' && (
          <button 
            onClick={handleStartGame} 
            className="btn btn-primary"
            disabled={!canStart || !!error || isStarting}
          >
            {isStarting ? (
              <>
                <span className="spinner"></span>
                Starting...
              </>
            ) : (
              'Start Game'
            )}
          </button>
        )}
        <button onClick={onLeaveLobby} className="btn btn-secondary">
          Leave Lobby
        </button>
      </div>
    </div>
  );
}

export default LobbyWaitingRoom;
