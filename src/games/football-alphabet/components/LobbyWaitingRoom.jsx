import React, { useState } from 'react';
import LobbyCodeDisplay from '../../../shared/components/LobbyCodeDisplay.jsx';

const LobbyWaitingRoom = ({ lobbyCode, players, isHost, onStartGame, onLeaveLobby }) => {
  const canStart = players.length >= 2;
  const [roundDuration, setRoundDuration] = useState(60);
  const [categoriesPerRound, setCategoriesPerRound] = useState(5);

  const timeOptions = [
    { value: 30, label: '30 seconds', emoji: '⚡' },
    { value: 45, label: '45 seconds', emoji: '🏃' },
    { value: 60, label: '60 seconds', emoji: '⏱️' },
  ];

  // Category options: 4, 5, or 6 categories
  const categoryOptions = [
    { value: 4, label: '4 categories' },
    { value: 5, label: '5 categories' },
    { value: 6, label: '6 categories' },
  ];

  const handleStartGame = () => {
    onStartGame(roundDuration, categoriesPerRound);
  };

  return (
    <div className="lobby-waiting-room">
      <LobbyCodeDisplay code={lobbyCode} label="Share this code with your friends:" />

      <div className="players-section">
        <h3>Players ({players.length})</h3>
        <div className="players-list">
          {players.map((player, index) => (
            <div key={player.id} className="player-item">
              <span className="player-name">{player.name}</span>
              {index === 0 && <span className="host-badge">👑 Host</span>}
            </div>
          ))}
        </div>
      </div>

      {isHost && (
        <div className="game-settings-section">
          <h3>⚙️ Game Settings</h3>
          
          <div className="setting-item">
            <label className="setting-label">Categories Per Round</label>
            <div className="category-count-selector">
              {categoryOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setCategoriesPerRound(option.value)}
                  className={`category-option ${categoriesPerRound === option.value ? 'selected' : ''}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="setting-item">
            <label className="setting-label">Round Time Limit</label>
            <div className="time-selector">
              {timeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setRoundDuration(option.value)}
                  className={`time-option ${roundDuration === option.value ? 'selected' : ''}`}
                >
                  <span className="time-emoji">{option.emoji}</span>
                  <span className="time-label">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="game-settings-section">
        <h3>📖 How to Play</h3>
        <ul className="how-to-play-list">
          <li>Each round, you'll get a random letter (not Q, X, or Z)</li>
          <li>You'll answer <strong>{categoriesPerRound} random categories</strong> from: Player, Club, Country, Stadium, Manager</li>
          <li>Time limit: <strong>{roundDuration} seconds</strong> per round</li>
          <li>Unique answers score 3 points, duplicates score 1 point</li>
          <li>After each round, review answers and enter your own scores</li>
        </ul>
      </div>

      <div className="lobby-status">
        <div className="waiting-message">
          {isHost ? (
            canStart ? (
              <p>Ready to start! Click "Start Game" when everyone has joined.</p>
            ) : (
              <p>Waiting for more players to join... (minimum 2 players required)</p>
            )
          ) : (
            <p>Waiting for host to start the game...</p>
          )}
        </div>
      </div>

      <div className="lobby-actions">
        {isHost && (
          <button 
            onClick={handleStartGame} 
            className="btn btn-primary"
            disabled={!canStart}
          >
            Start Game
          </button>
        )}
        <button onClick={onLeaveLobby} className="btn btn-secondary">
          Leave Lobby
        </button>
      </div>
    </div>
  );
};

export default LobbyWaitingRoom;
