import React, { useState, useEffect } from 'react';
import { GameHeader, ModeSelectionButtons } from '../../../shared/components';

const MainMenu = ({ onCreateLobby, onJoinLobby, isConnected, lobbyError }) => {
  const [view, setView] = useState('choice'); // 'choice', 'create', or 'join'
  const [playerName, setPlayerName] = useState('');
  const [lobbyCode, setLobbyCode] = useState('');
  const [errors, setErrors] = useState({});

  // Check for join code in URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get('join');
    if (joinCode) {
      setLobbyCode(joinCode.toUpperCase());
      setView('join');
    }
  }, []);

  const validateForm = () => {
    const newErrors = {};
    
    if (!playerName.trim()) {
      newErrors.playerName = 'Please enter your name';
    } else if (playerName.trim().length < 2) {
      newErrors.playerName = 'Name must be at least 2 characters';
    }
    
    if (view === 'join') {
      if (!lobbyCode.trim()) {
        newErrors.lobbyCode = 'Please enter a lobby code';
      } else if (lobbyCode.trim().length !== 5) {
        newErrors.lobbyCode = 'Lobby code must be 5 characters';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (view === 'create') {
      onCreateLobby(playerName.trim());
    } else if (view === 'join') {
      onJoinLobby(lobbyCode.trim().toUpperCase(), playerName.trim());
    }
  };

  if (!isConnected) {
    return (
      <div className="online-mode-selection">
        <div className="connecting-container">
          <div className="football-spinner">⚽</div>
          <p className="connecting-message">Connecting to server...</p>
        </div>
      </div>
    );
  }

  if (view === 'create') {
    return (
      <div className="online-mode-selection">
        <button onClick={() => setView('choice')} className="btn btn-secondary back-btn">
          ← Back
        </button>
        <GameHeader title="Create Lobby" />
        <form onSubmit={handleSubmit} className="lobby-form">
          <div className="form-group">
            <label htmlFor="name">Your Name:</label>
            <input
              id="name"
              type="text"
              value={playerName}
              onChange={(e) => {
                setPlayerName(e.target.value);
                setErrors(prev => ({ ...prev, playerName: '' }));
              }}
              placeholder="Enter your name"
              maxLength={20}
              autoFocus
              className={errors.playerName ? 'input-error' : ''}
            />
            {errors.playerName && (
              <span className="error-message">{errors.playerName}</span>
            )}
          </div>
          <button type="submit" className="btn btn-primary">
            Create Lobby
          </button>
        </form>
      </div>
    );
  }

  if (view === 'join') {
    return (
      <div className="online-mode-selection">
        <button onClick={() => setView('choice')} className="btn btn-secondary back-btn">
          ← Back
        </button>
        <GameHeader title="Join Lobby" />
        <form onSubmit={handleSubmit} className="lobby-form">
          <div className="form-group">
            <label htmlFor="name">Your Name:</label>
            <input
              id="name"
              type="text"
              value={playerName}
              onChange={(e) => {
                setPlayerName(e.target.value);
                setErrors(prev => ({ ...prev, playerName: '' }));
              }}
              placeholder="Enter your name"
              maxLength={20}
              className={errors.playerName ? 'input-error' : ''}
            />
            {errors.playerName && (
              <span className="error-message">{errors.playerName}</span>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="code">Lobby Code:</label>
            <input
              id="code"
              type="text"
              value={lobbyCode}
              onChange={(e) => {
                setLobbyCode(e.target.value.toUpperCase());
                setErrors(prev => ({ ...prev, lobbyCode: '' }));
              }}
              placeholder="Enter 5-character code"
              maxLength={5}
              style={{ textTransform: 'uppercase', textAlign: 'center', letterSpacing: '0.2em' }}
              className={errors.lobbyCode ? 'input-error' : ''}
            />
            {errors.lobbyCode && (
              <span className="error-message">{errors.lobbyCode}</span>
            )}
          </div>
          
          {lobbyError && (
            <div className="lobby-error-alert">
              <span className="error-icon">⚠️</span>
              <span>{lobbyError}</span>
            </div>
          )}
          
          <button type="submit" className="btn btn-primary">
            Join Lobby
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mode-selection">
      <GameHeader 
        title="Football Alphabet"
        subtitle="Test your football knowledge from A to Z!"
        icon="🔤"
      />
      
      {lobbyError && (
        <div className="lobby-error-alert" style={{ marginBottom: '1.5rem' }}>
          <span className="error-icon">⚠️</span>
          <span>{lobbyError}</span>
        </div>
      )}
      
      <div className="mode-selection-buttons">
        <button 
          className="btn btn-primary mode-btn"
          onClick={() => setView('create')}
        >
          <div className="mode-icon">🎮</div>
          <div className="mode-title">Create New Game</div>
          <div className="mode-description">Start a lobby and invite friends</div>
        </button>
        
        <button 
          className="btn btn-primary mode-btn"
          onClick={() => setView('join')}
        >
          <div className="mode-icon">🌐</div>
          <div className="mode-title">Join Existing Game</div>
          <div className="mode-description">Enter a lobby code to join</div>
        </button>
      </div>
      
      <div className="game-rules" style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'var(--surface)', borderRadius: '8px' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Quick Rules:</h3>
        <ul style={{ fontSize: '0.875rem', color: 'var(--muted)', listStyle: 'none', padding: 0 }}>
          <li>✓ Answer with football terms starting with the chosen letter</li>
          <li>✓ Fill in players, clubs, countries, stadiums & managers</li>
          <li>✓ Unique answers score 3 points, duplicates score 1 point</li>
        </ul>
      </div>
    </div>
  );
};

export default MainMenu;
