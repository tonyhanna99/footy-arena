import { useState } from 'react';
import RevealModal from './RevealModal.jsx';

function Dashboard({ players, onRevealFor, onMarkRevealed, allPlayersRevealed, crewCount, imposterCount }) {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [reveal, setReveal] = useState(null);

  const handlePlayerClick = (player) => {
    if (player.revealed) return;
    
    const playerReveal = onRevealFor(player.id);
    if (playerReveal) {
      setSelectedPlayer(player);
      setReveal(playerReveal);
    }
  };

  const handleCloseModal = () => {
    setSelectedPlayer(null);
    setReveal(null);
  };

  return (
    <>
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Game Dashboard</h3>
          <p className="card-description">
            Tap your name to see your role. {crewCount} crew members, {imposterCount} imposter{imposterCount !== 1 ? 's' : ''}.
          </p>
        </div>

        <div className="players-grid">
          {players.map((player) => (
            <button
              key={player.id}
              onClick={() => handlePlayerClick(player)}
              disabled={player.revealed}
              className="player-button"
              type="button"
            >
              {player.name}
            </button>
          ))}
        </div>

        {allPlayersRevealed && (
          <div className="text-center">
            <p className="text-muted mb-2">
              All players have revealed their roles. Ready for discussion!
            </p>
          </div>
        )}
      </div>

      {selectedPlayer && reveal && (
        <RevealModal
          player={selectedPlayer}
          reveal={reveal}
          onClose={handleCloseModal}
          onMarkRevealed={onMarkRevealed}
        />
      )}
    </>
  );
}

export default Dashboard;
