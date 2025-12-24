import { useState, useEffect, useRef } from 'react';
import { useSocket } from './hooks/useSocket.js';
import { useGame } from './hooks/useGame.js';
import ModeSelection from './components/ModeSelection.jsx';
import OnlineModeSelection from './components/OnlineModeSelection.jsx';
import LobbyWaitingRoom from './components/LobbyWaitingRoom.jsx';
import SecretPlayerSelection from './components/SecretPlayerSelection.jsx';
import GameBoard from './components/GameBoard.jsx';
import './GuessWho.css';

function Game() {
  const [gameMode, setGameMode] = useState(null); // null, 'online'
  const cleanupRef = useRef({ leaveLobby: null, disconnect: null, lobby: null });

  // Check for ?join= URL parameter on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const joinCode = urlParams.get('join');
    
    if (joinCode && gameMode === null) {
      setGameMode('online');
    }
  }, [gameMode]);

  // Socket hook for online multiplayer
  const {
    socket,
    connected,
    lobby,
    error,
    sharedPlayerList,
    myPlayerLayout,
    gamePhase,
    roundCounter,
    createLobby,
    joinLobby,
    startGame,
    selectSecretPlayer,
    startNewRound,
    leaveLobby,
    disconnect,
    clearError,
  } = useSocket(gameMode === 'online');

  // Local game state hook
  const {
    flippedPlayers,
    selectedSecretPlayer,
    toggleFlip,
    selectPlayer,
    resetGame,
  } = useGame();

  // Track previous round counter to detect new rounds
  const prevRoundCounterRef = useRef(roundCounter);

  // Keep cleanup functions updated in ref
  useEffect(() => {
    cleanupRef.current = { leaveLobby, disconnect, lobby };
  }, [leaveLobby, disconnect, lobby]);

  // Reset game state when round counter changes (new round started)
  useEffect(() => {
    if (roundCounter > 0 && roundCounter !== prevRoundCounterRef.current) {
      resetGame();
      prevRoundCounterRef.current = roundCounter;
    } else if (roundCounter === 0) {
      // Initialize the ref on first render
      prevRoundCounterRef.current = roundCounter;
    }
  }, [roundCounter, resetGame, selectedSecretPlayer]);

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

  // Handlers
  const handleSelectMode = (mode) => {
    setGameMode(mode);
  };

  const handleBackToModeSelection = () => {
    disconnect();
    setGameMode(null);
    resetGame();
  };

  const handleBackFromError = () => {
    // Clear error and reset to mode selection
    clearError();
    setGameMode(null);
    resetGame();
    // Don't need to disconnect here as socket was already disconnected
  };

  const handleCreateLobby = (name) => {
    createLobby(name);
  };

  const handleJoinLobby = (code, name) => {
    joinLobby(code, name);
  };

  const handleStartGame = () => {
    startGame();
  };

  const handleLeaveLobby = () => {
    leaveLobby();
    // Clear local state to go back to mode selection
    clearError(); // This also clears lobby, gamePhase, and player lists
    setGameMode('online');
    resetGame();
  };

  const handleSelectSecretPlayer = (playerName) => {
    selectPlayer(playerName);
    selectSecretPlayer(playerName);
  };

  // Check if error is a join error (show in OnlineModeSelection) or game ended error (show in error screen)
  const isJoinError = error && !lobby && gameMode === 'online';
  const isGameEndedError = error && (lobby || gamePhase !== 'waiting');

  // Render game-ended error state (opponent left/disconnected during game)
  if (isGameEndedError) {
    return (
      <div className="guess-who-game">
        <div className="error-container">
          <h2>Game Ended</h2>
          <p>{error}</p>
          <button onClick={handleBackFromError} className="btn btn-primary">
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  // Mode selection screen
  if (!gameMode) {
    return (
      <div className="guess-who-game">
        <ModeSelection onSelectMode={handleSelectMode} />
      </div>
    );
  }

  // Online mode flow
  if (gameMode === 'online') {
    // Not in a lobby yet - show lobby selection/creation
    if (!lobby) {
      return (
        <div className="guess-who-game">
          <OnlineModeSelection
            onCreateLobby={handleCreateLobby}
            onJoinLobby={handleJoinLobby}
            onBack={handleBackToModeSelection}
            error={isJoinError ? error : null}
            onClearError={clearError}
          />
        </div>
      );
    }

    // In lobby, waiting for players
    if (gamePhase === 'waiting') {
      return (
        <div className="guess-who-game">
          <LobbyWaitingRoom
            lobby={lobby}
            currentSocketId={socket?.id}
            onStartGame={handleStartGame}
            onLeaveLobby={handleLeaveLobby}
          />
        </div>
      );
    }

    // Secret player selection phase - Show board immediately for selection
    if (gamePhase === 'selecting') {
      const waitingForOpponent = selectedSecretPlayer !== null;
      
      return (
        <div className="guess-who-game">
          <GameBoard
            playerList={myPlayerLayout}
            secretPlayer={selectedSecretPlayer}
            flippedPlayers={flippedPlayers}
            onToggleFlip={toggleFlip}
            lobby={{ ...lobby, mySocketId: socket?.id }}
            selectionMode={true}
            waitingForOpponent={waitingForOpponent}
            onSelectSecretPlayer={handleSelectSecretPlayer}
          />
        </div>
      );
    }

    // Playing phase
    if (gamePhase === 'playing') {
      return (
        <div className="guess-who-game">
          <GameBoard
            playerList={myPlayerLayout}
            secretPlayer={selectedSecretPlayer}
            flippedPlayers={flippedPlayers}
            onToggleFlip={toggleFlip}
            lobby={{ ...lobby, mySocketId: socket?.id }}
            selectionMode={false}
            onStartNewRound={startNewRound}
          />
        </div>
      );
    }
  }

  // Fallback loading state
  return (
    <div className="guess-who-game">
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    </div>
  );
}

export default Game;
