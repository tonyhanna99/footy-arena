import React, { useState, useEffect } from 'react';
import { BackButton } from '../../../shared/components';

function OnlineModeSelection({ onCreateLobby, onJoinLobby, onBack, error, onClearError }) {
  const [mode, setMode] = useState(null); // null, 'create', 'join'
  const [name, setName] = useState('');
  const [lobbyCode, setLobbyCode] = useState('');
  const [cameFromLink, setCameFromLink] = useState(false);

  // Check for ?join= URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const joinCode = urlParams.get('join');
    
    if (joinCode) {
      setLobbyCode(joinCode.toUpperCase());
      setCameFromLink(true);
      setMode('join');
      // Clean up URL so it doesn't persist on back/re-visit
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('Please enter your name');
      return;
    }

    if (mode === 'create') {
      onCreateLobby(name.trim());
    } else if (mode === 'join') {
      if (!lobbyCode.trim()) {
        alert('Please enter a lobby code');
        return;
      }
      onJoinLobby(lobbyCode.trim().toUpperCase(), name.trim());
    }
  };

  if (!mode) {
    return (
      <div className="online-mode-selection">
        <BackButton onClick={onBack} />

        <h2>Play Online</h2>
        <p className="mode-description">
          Create a lobby or join your friend's game
        </p>

        <div className="online-options">
          <button
            onClick={() => setMode('create')}
            className="online-option-button"
          >
            <div className="option-icon">➕</div>
            <div className="option-label">Create Lobby</div>
            <div className="option-desc">Start a new game session</div>
          </button>

          <button
            onClick={() => setMode('join')}
            className="online-option-button"
          >
            <div className="option-icon">🔗</div>
            <div className="option-label">Join Lobby</div>
            <div className="option-desc">Join with a lobby code</div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="online-mode-selection">
      <BackButton onClick={() => setMode(null)} />

      <h2>{mode === 'create' ? 'Create Lobby' : 'Join Lobby'}</h2>

      {error && (
        <div className="error-message-inline">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="lobby-form">
        <div className="form-group">
          <label htmlFor="name">Your Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            maxLength={20}
            autoFocus
            className="form-input"
          />
        </div>

        {mode === 'join' && (
          <div className="form-group">
            <label htmlFor="code">Lobby Code:</label>
            <input
              type="text"
              id="code"
              value={lobbyCode}
              onChange={(e) => {
                setLobbyCode(e.target.value.toUpperCase());
                setCameFromLink(false);
              }}
              placeholder="Enter 5-character code"
              maxLength={5}
              className="form-input lobby-code-input"
            />
            {cameFromLink && (
              <div className="auto-join-notice">
                ✓ Joining lobby from invite link
              </div>
            )}
          </div>
        )}

        <button type="submit" className="btn btn-primary submit-button">
          {mode === 'create' ? 'Create Lobby' : 'Join Lobby'}
        </button>
      </form>
    </div>
  );
}

export default OnlineModeSelection;
