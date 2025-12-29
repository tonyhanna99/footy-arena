import React from 'react';

const ScoresView = ({ players, roundScores, totalScores, onNextRound, onEndGame, isHost }) => {
  // Sort players by total score (descending)
  const sortedPlayers = [...players].sort(
    (a, b) => (totalScores[b.id] || 0) - (totalScores[a.id] || 0)
  );

  const winner = sortedPlayers[0];
  const topScore = totalScores[winner.id] || 0;
  
  // Find all players with the top score (for ties)
  const leaders = sortedPlayers.filter(player => (totalScores[player.id] || 0) === topScore);
  const isTied = leaders.length > 1;

  return (
    <div className="scoreboard-container">
      <div className="scoreboard-header">
        <h2>🏆 Scoreboard</h2>
        <p>{roundScores.length} Round{roundScores.length !== 1 ? 's' : ''} Played</p>
      </div>

      {/* Leader Display */}
      <div className="current-leader">
        <div className="leader-content">
          <span className="leader-icon">👑</span>
          <div className="leader-info">
            <div className="leader-label">{isTied ? 'Tied for Lead' : 'Current Leader'}</div>
            <div className="leader-name">
              {isTied ? leaders.map(p => p.name).join(' & ') : winner.name}
            </div>
            <div className="leader-points">{topScore} points</div>
          </div>
          <span className="leader-icon">👑</span>
        </div>
      </div>

      {/* Scores Table */}
      <div className="scores-table-wrapper">
        <table className="scores-table">
          <thead>
            <tr>
              <th className="sticky-col">Round</th>
              {sortedPlayers.map((player) => {
                const playerScore = totalScores[player.id] || 0;
                
                // Determine rank based on score comparison
                let rank;
                if (playerScore === topScore) {
                  rank = 1; // All players with top score get rank 1
                } else {
                  // Count how many unique scores are higher
                  const higherScores = new Set(
                    sortedPlayers
                      .map(p => totalScores[p.id] || 0)
                      .filter(score => score > playerScore)
                  );
                  rank = higherScores.size + 1;
                }
                
                // Determine medal/display
                let displayContent;
                if (rank === 1) {
                  displayContent = '🥇';
                } else if (rank === 2) {
                  displayContent = '🥈';
                } else if (rank === 3) {
                  displayContent = '🥉';
                } else {
                  displayContent = player.name.charAt(0).toUpperCase();
                }
                
                return (
                  <th key={player.id}>
                    <div className="player-header">
                      <div className={`player-rank rank-${rank}`}>
                        {displayContent}
                      </div>
                      <div className="player-name-small">{player.name}</div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {roundScores.map((round, idx) => (
              <tr key={idx}>
                <td className="sticky-col round-cell">
                  <div className="round-info">
                    <span className="round-letter">{round.letter}</span>
                    <span className="round-number">Round {idx + 1}</span>
                  </div>
                </td>
                {sortedPlayers.map((player) => {
                  const score = round.scores[player.id] || 0;
                  return (
                    <td key={player.id} className="score-cell">
                      <div className="score-value">{score}</div>
                      <div className="score-label">points</div>
                    </td>
                  );
                })}
              </tr>
            ))}
            {/* Total Row */}
            <tr className="total-row">
              <td className="sticky-col">
                <strong>TOTAL</strong>
              </td>
              {sortedPlayers.map((player) => {
                const total = totalScores[player.id] || 0;
                return (
                  <td key={player.id} className="score-cell">
                    <div className="score-value total">{total}</div>
                    <div className="score-label">total</div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="scoreboard-actions">
        {isHost && (
          <>
            <button onClick={onNextRound} className="btn btn-primary btn-large">
              ▶ Play Next Round
            </button>
            <button onClick={onEndGame} className="btn btn-secondary btn-large">
              🏠 End Game
            </button>
          </>
        )}
        {!isHost && (
          <div className="status-message">
            <p>Waiting for host to start next round...</p>
          </div>
        )}
      </div>

      {/* Point Legend */}
      <div className="scoring-legend">
        <h3>Scoring System</h3>
        <div className="legend-grid">
          <div className="legend-item unique">
            <div className="legend-points">+3</div>
            <div className="legend-label">Unique Answer</div>
          </div>
          <div className="legend-item duplicate">
            <div className="legend-points">+1</div>
            <div className="legend-label">Duplicate Answer</div>
          </div>
          <div className="legend-item invalid">
            <div className="legend-points">0</div>
            <div className="legend-label">Invalid/No Answer</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoresView;
