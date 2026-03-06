import React from 'react';
import { useGame } from './hooks/useGame';
import MainMenu from './components/MainMenu';
import LobbyWaitingRoom from './components/LobbyWaitingRoom';
import GameBoard from './components/GameBoard';
import ManualScoring from './components/ManualScoring';
import ScoresView from './components/ScoresView';

const Game = () => {
  const {
    // Connection
    isConnected,
    
    // Game state
    gameState,
    lobbyCode,
    playerName,
    players,
    isHost,
    lobbyError,
    
    // Round state
    currentLetter,
    categories,
    timeRemaining,
    playerAnswers,
    allAnswers,
    hasSubmitted,
    
    // Scores
    roundScores,
    totalScores,
    hasSubmittedScores,
    
    // Actions
    handleCreateLobby,
    handleJoinLobby,
    handleLeaveLobby,
    startGame,
    handleAnswerChange,
    handleSubmit,
    handleSubmitManualScores,
    nextRound,
  } = useGame();

  // Render appropriate screen based on game state
  switch (gameState) {
    case 'menu':
      return (
        <MainMenu
          onCreateLobby={handleCreateLobby}
          onJoinLobby={handleJoinLobby}
          isConnected={isConnected}
          lobbyError={lobbyError}
        />
      );

    case 'lobby':
      return (
        <LobbyWaitingRoom
          lobbyCode={lobbyCode}
          players={players}
          isHost={isHost}
          onStartGame={startGame}
          onLeaveLobby={handleLeaveLobby}
        />
      );

    case 'playing':
      return (
        <GameBoard
          currentLetter={currentLetter}
          categories={categories}
          timeRemaining={timeRemaining}
          playerAnswers={playerAnswers}
          hasSubmitted={hasSubmitted}
          onAnswerChange={handleAnswerChange}
          onSubmit={handleSubmit}
          onLeaveLobby={handleLeaveLobby}
        />
      );

    case 'revealing':
      return (
        <ManualScoring
          currentLetter={currentLetter}
          categories={categories}
          allAnswers={allAnswers}
          players={players}
          playerName={playerName}
          myAnswers={playerAnswers}
          hasSubmitted={hasSubmittedScores}
          onSubmitScores={handleSubmitManualScores}
          onLeaveLobby={handleLeaveLobby}
        />
      );

    case 'scores':
      return (
        <ScoresView
          players={players}
          roundScores={roundScores}
          totalScores={totalScores}
          onNextRound={nextRound}
          onEndGame={handleLeaveLobby}
          isHost={isHost}
        />
      );

    default:
      return (
        <div className="mode-selection">
          <div className="connecting-container">
            <div className="football-spinner">⚽</div>
            <p className="connecting-message">Loading...</p>
          </div>
        </div>
      );
  }
};

export default Game;
