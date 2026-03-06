import { useState } from 'react';
import RevealModal from './RevealModal.jsx';
import FirstClueModal from './FirstClueModal.jsx';
import { useEffect } from 'react';

function Dashboard({ players, onRevealFor, onMarkRevealed, allPlayersRevealed, crewCount, imposterCount, firstClueGiver, onNewRound }) {
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

  const [showFirstClueModal, setShowFirstClueModal] = useState(false);

  useEffect(() => {
    if (allPlayersRevealed && firstClueGiver) {
      setShowFirstClueModal(true);
    }
  }, [allPlayersRevealed, firstClueGiver]);

  // Find the first clue giver's name
  const firstClueGiverPlayer = players.find(p => p.id === firstClueGiver);

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
            {firstClueGiverPlayer && (
              <p className="mt-2">First Clue: <strong>{firstClueGiverPlayer.name}</strong></p>
            )}
            {onNewRound && (
              <button
                className="btn btn-primary mt-4"
                onClick={onNewRound}
                type="button"
              >
                New Round
              </button>
            )}
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

      {showFirstClueModal && firstClueGiverPlayer && (
        <FirstClueModal
          player={firstClueGiverPlayer}
          onClose={() => setShowFirstClueModal(false)}
        />
      )}
    </>
  );
}

export default Dashboard;
