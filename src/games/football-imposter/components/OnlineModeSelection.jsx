import React, { useState, useEffect } from 'react';

function OnlineModeSelection({ onCreateLobby, onJoinLobby, onBack, socketError }) {
  const [view, setView] = useState('choice'); // 'choice', 'create', 'join'
  const [name, setName] = useState('');
  const [lobbyCode, setLobbyCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Reset loading state when there's a socket error
  useEffect(() => {
    if (socketError) {
      setIsLoading(false);
      setError(socketError);
    }
  }, [socketError]);

  // Check for ?join= URL parameter on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const joinCode = urlParams.get('join');
    
    if (joinCode) {
      setLobbyCode(joinCode.toUpperCase());
      setView('join');
      // Clean up URL without reloading the page
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleCreateLobby = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    setIsLoading(true);
    onCreateLobby(name.trim());
  };

  const handleJoinLobby = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!lobbyCode.trim()) {
      setError('Please enter a lobby code');
      return;
    }
    setIsLoading(true);
    onJoinLobby(lobbyCode.trim().toUpperCase(), name.trim());
  };

  if (view === 'create') {
    return (
      <div className="online-mode-selection">
        <button onClick={() => setView('choice')} className="btn btn-secondary back-btn">
          ← Back
        </button>
        <h2>Create Lobby</h2>
        <form onSubmit={handleCreateLobby} className="lobby-form">
          <div className="form-group">
            <label htmlFor="name">Your Name:</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="Enter your name"
              maxLength={20}
              autoFocus
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Creating...
              </>
            ) : (
              'Create Lobby'
            )}
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
        <h2>Join Lobby</h2>
        <form onSubmit={handleJoinLobby} className="lobby-form">
          <div className="form-group">
            <label htmlFor="code">Lobby Code:</label>
            <input
              id="code"
              type="text"
              value={lobbyCode}
              onChange={(e) => {
                setLobbyCode(e.target.value.toUpperCase());
                setError('');
              }}
              placeholder="Enter lobby code"
              maxLength={5}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="name">Your Name:</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="Enter your name"
              maxLength={20}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Joining...
              </>
            ) : (
              'Join Lobby'
            )}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="online-mode-selection">
      <button onClick={onBack} className="btn btn-secondary back-btn">
        ← Back
      </button>
      <h2>Play Online</h2>
      <div className="online-choice-buttons">
        <button 
          className="btn btn-primary choice-btn"
          onClick={() => setView('create')}
        >
          <div className="choice-icon">➕</div>
          <div className="choice-title">Create Lobby</div>
          <div className="choice-description">Start a new game and invite friends</div>
        </button>
        
        <button 
          className="btn btn-primary choice-btn"
          onClick={() => setView('join')}
        >
          <div className="choice-icon">🔗</div>
          <div className="choice-title">Join Lobby</div>
          <div className="choice-description">Enter a code to join a friend's game</div>
        </button>
      </div>
    </div>
  );
}

export default OnlineModeSelection;
