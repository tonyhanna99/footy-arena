import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useGame } from './hooks/useGame.js';
import { useSocket } from './hooks/useSocket.js';
import { GameHeader, ModeSelectionButtons } from '../../shared/components';
import SetupForm from './components/SetupForm.jsx';
import Dashboard from './components/Dashboard.jsx';
import ModeSelection from './components/ModeSelection.jsx';
import OnlineModeSelection from './components/OnlineModeSelection.jsx';
import LobbyWaitingRoom from './components/LobbyWaitingRoom.jsx';
import OnlineGameplay from './components/OnlineGameplay.jsx';

function Game() {
  const [gameMode, setGameMode] = useState(null); // null, 'local', 'online'
  const cleanupRef = useRef({ leaveLobby: null, disconnect: null, lobby: null });
  
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
    footballerImage,
    error,
    createLobby,
    joinLobby,
    startGame,
    newRound,
    leaveLobby,
    disconnect,
  } = useSocket(gameMode === 'online');

  // Keep cleanup functions updated in ref
  useEffect(() => {
    cleanupRef.current = { leaveLobby, disconnect, lobby };
  }, [leaveLobby, disconnect, lobby]);

  // Cleanup on unmount only - disconnect from game when leaving
  useEffect(() => {
    return () => {
      // Use ref to get current values at cleanup time
      const { leaveLobby: leave, disconnect: disc, lobby: currentLobby } = cleanupRef.current;
      if (currentLobby && leave) {
        leave();
        // Give backend time to process leave event before disconnecting
        setTimeout(() => {
          if (disc) {
            disc();
          }
        }, 200);
      } else if (disc) {
        disc();
      }
    };
  }, []); // Empty deps - only run on unmount

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

      {/* Mode Selection Screen */}
      {!gameMode && (
        <div className="mode-selection">
          <GameHeader 
            title="Football Imposter"
            subtitle="Find the Imposter in the group by giving clues about footballers!"
            icon="🕵️"
          />
          <h2>Choose Game Mode</h2>
          <ModeSelectionButtons
            onSelectLocal={() => handleSelectMode('local')}
            onSelectOnline={() => handleSelectMode('online')}
          />
        </div>
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
              onNewRound={handleNewRound}
            />
          )}
        </>
      )}

      {/* Online Game Mode */}
      {gameMode === 'online' && (
        <div className="mode-selection">
          {error && (
            <div className="error-banner">
              {error}
            </div>
          )}

          {!connected && !error && (
            <div className="connecting-container">
              <div className="football-spinner">⚽</div>
              <p className="connecting-message">Connecting to server...</p>
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
              footballerImage={footballerImage}
              currentSocketId={socket?.id}
              onNewRound={handleOnlineNewRound}
              onBackToLobby={handleBackToLobby}
            />
          )}
        </div>
      )}

      {/* SEO Content Section */}
      <section style={{ maxWidth: '640px', margin: '3rem auto 1rem', padding: '0 1rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem' }}>What is Football Imposter?</h2>
        <p style={{ marginBottom: '1.5rem', lineHeight: '1.6', color: 'var(--text-secondary, #aaa)' }}>
          Football Imposter is a football-themed social deduction party game. One or more players are secretly the imposters — they don't know the footballer everyone else is discussing. The crew must give clues about the footballer without making it too obvious, while the imposter tries to blend in and guess who it is before being exposed.
        </p>

        <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem' }}>How many players can play?</h2>
        <p style={{ marginBottom: '1.5rem', lineHeight: '1.6', color: 'var(--text-secondary, #aaa)' }}>
          Football Imposter works best with 4 to 10 players, though you can play with as few as 3. Larger groups make it easier for the imposter to hide and create more chaotic, entertaining rounds. One device is all you need.
        </p>

        <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem' }}>Can you play Football Imposter online?</h2>
        <p style={{ lineHeight: '1.6', color: 'var(--text-secondary, #aaa)' }}>
          Yes! FootyArena supports an online multiplayer mode so you can play Football Imposter with friends remotely. Create a lobby, share the code, and play from different devices in real time.
        </p>
      </section>

      {/* Internal Links – More Football Games */}
      <section style={{ maxWidth: '640px', margin: '2rem auto 3rem', padding: '0 1rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem' }}>More Football Games</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link
            to="/games/guess-who"
            style={{
              display: 'block',
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              border: '1px solid var(--border, #333)',
              textDecoration: 'none',
              color: 'inherit',
              fontWeight: '600',
            }}
          >
            ⚽ Football Guess Who?
          </Link>
          <Link
            to="/games/football-alphabet"
            style={{
              display: 'block',
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              border: '1px solid var(--border, #333)',
              textDecoration: 'none',
              color: 'inherit',
              fontWeight: '600',
            }}
          >
            🔤 Football Alphabet
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Game;
