import { useGame } from './hooks/useGame.js';
import SetupForm from './components/SetupForm.jsx';
import Dashboard from './components/Dashboard.jsx';

function Game() {
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

  const handleNewRound = () => {
    resetToSetup(true); // Preserve names
  };

  return (
    <div>
      <div className="game-header">
        <h1 className="game-title">Football Imposter</h1>
        {screen === 'dashboard' && (
          <button onClick={handleNewRound} className="btn btn-secondary">
            New Round
          </button>
        )}
      </div>

      {screen === 'setup' && (
        <SetupForm
          settings={settings}
          onStartRound={startRound}
          validateSettings={validateSettings}
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
    </div>
  );
}

export default Game;
