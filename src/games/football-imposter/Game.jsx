import { useState, useEffect } from 'react';
import { useGame } from './hooks/useGame.js';
import { useSocket } from './hooks/useSocket.js';
import SetupForm from './components/SetupForm.jsx';
import Dashboard from './components/Dashboard.jsx';
import ModeSelection from './components/ModeSelection.jsx';
import OnlineModeSelection from './components/OnlineModeSelection.jsx';
import LobbyWaitingRoom from './components/LobbyWaitingRoom.jsx';
import OnlineGameplay from './components/OnlineGameplay.jsx';

function Game() {
  const [gameMode, setGameMode] = useState(null); // null, 'local', 'online'
  
  // Check for ?join= URL parameter on component mount and auto-select online mode
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const joinCode = urlParams.get('join');
    
    if (joinCode && gameMode === null) {
      setGameMode('online');
    }
  }, [gameMode]);
  
  // Local game hook
  const {
    screen,
    players,
    settings,
    startRound,
    revealFor,
    markRevealed,
    resetToSetup,
    validateSettings,
    allPlayersRevealed,
    crewCount,
    imposterCount,
    firstClueGiver,
  } = useGame();

  // Online game hook - only connect when in online mode
  const {
    socket,
    connected,
    lobby,
    myRole,
    footballer,
    error,
    createLobby,
    joinLobby,
    startGame,
    newRound,
    leaveLobby,
    disconnect,
  } = useSocket(gameMode === 'online');

  const handleNewRound = () => {
    resetToSetup(true); // Preserve names
  };

  const handleSelectMode = (mode) => {
    setGameMode(mode);
  };

  const handleBackToModeSelection = () => {
    disconnect(); // Disconnect socket when leaving online mode
    setGameMode(null);
  };

  const handleCreateLobby = (name) => {
    createLobby(name);
  };

  const handleJoinLobby = (code, name) => {
    joinLobby(code, name);
  };

  const handleStartGame = (imposterCount) => {
    if (lobby) {
      startGame(lobby.code, imposterCount);
    }
  };

  const handleLeaveLobby = () => {
    leaveLobby();
    setGameMode('online'); // Back to online mode selection
  };

  const handleOnlineNewRound = () => {
    if (lobby) {
      newRound(lobby.code);
    }
  };

  const handleBackToLobby = () => {
    // For now, just leave the lobby
    handleLeaveLobby();
  };

  return (
    <div>
      <div className="game-header">
        <h1 className="game-title">Football Imposter</h1>
        {screen === 'dashboard' && gameMode === 'local' && (
          <button onClick={handleNewRound} className="btn btn-secondary">
            New Round
          </button>
        )}
      </div>

      {/* Mode Selection Screen */}
      {!gameMode && (
        <ModeSelection onSelectMode={handleSelectMode} />
      )}

      {/* Local Game Mode */}
      {gameMode === 'local' && (
        <>
          {screen === 'setup' && (
            <SetupForm
              settings={settings}
              onStartRound={startRound}
              validateSettings={validateSettings}
              onBack={handleBackToModeSelection}
            />
          )}

          {screen === 'dashboard' && (
            <Dashboard
              players={players}
              onRevealFor={revealFor}
              onMarkRevealed={markRevealed}
              allPlayersRevealed={allPlayersRevealed}
              crewCount={crewCount}
              imposterCount={imposterCount}
              firstClueGiver={firstClueGiver}
            />
          )}
        </>
      )}

      {/* Online Game Mode */}
      {gameMode === 'online' && (
        <>
          {error && (
            <div className="error-banner">
              {error}
            </div>
          )}

          {!connected && !error && (
            <div className="connecting-message">
              Connecting to server...
            </div>
          )}

          {connected && !lobby && (
            <OnlineModeSelection
              onCreateLobby={handleCreateLobby}
              onJoinLobby={handleJoinLobby}
              onBack={handleBackToModeSelection}
              socketError={error}
            />
          )}

          {connected && lobby && lobby.status === 'waiting' && (
            <LobbyWaitingRoom
              lobby={lobby}
              currentSocketId={socket?.id}
              socket={socket}
              onStartGame={handleStartGame}
              onLeaveLobby={handleLeaveLobby}
            />
          )}

          {connected && lobby && lobby.status === 'in_progress' && (
            <OnlineGameplay
              lobby={lobby}
              myRole={myRole}
              footballer={footballer}
              currentSocketId={socket?.id}
              onNewRound={handleOnlineNewRound}
              onBackToLobby={handleBackToLobby}
            />
          )}
        </>
      )}
    </div>
  );
}

export default Game;
