import React, { useState } from 'react';

const ManualScoring = ({ 
  currentLetter, 
  categories, 
  allAnswers, 
  players,
  playerName,
  myAnswers,
  hasSubmitted: initialHasSubmitted = false,
  onSubmitScores,
  onLeaveLobby
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState(players[0]?.id);
  const [myScores, setMyScores] = useState({});
  const [hasSubmitted, setHasSubmitted] = useState(initialHasSubmitted);

  // Sync if the parent tells us we already submitted (e.g. after reconnect)
  React.useEffect(() => {
    if (initialHasSubmitted) setHasSubmitted(true);
  }, [initialHasSubmitted]);

  const handleScoreSelect = (categoryId, value) => {
    setMyScores(prev => ({
      ...prev,
      [categoryId]: value
    }));
  };

  const handleSubmit = () => {
    onSubmitScores(myScores);
    setHasSubmitted(true);
  };

  const selectedPlayerData = players.find(p => p.id === selectedPlayer);
  const selectedPlayerAnswers = allAnswers[selectedPlayer] || {};

  // Calculate total points entered
  const totalPoints = Object.values(myScores).reduce((sum, val) => sum + val, 0);

  return (
    <div className="manual-scoring-container">
      <div className="manual-scoring-header">
        <h2>Round Complete - Letter {currentLetter}</h2>
        <p>Review everyone's answers and enter your own scores</p>
      </div>

      {/* Player Selection - Horizontal scrollable on mobile */}
      <div className="player-selector-horizontal">
        <h3>View Players</h3>
        <div className="player-tabs">
          {players.map((player) => (
            <button
              key={player.id}
              onClick={() => setSelectedPlayer(player.id)}
              className={`player-tab ${selectedPlayer === player.id ? 'active' : ''}`}
            >
              <span className="player-avatar">
                {player.name.charAt(0).toUpperCase()}
              </span>
              <span className="player-tab-name">{player.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Answers Display */}
      <div className="answers-section">
        <h3>{selectedPlayerData?.name}'s Answers</h3>

        <div className="answers-grid-compact">
          {categories.map((category) => {
            const answer = selectedPlayerAnswers[category.id];
            const hasAnswer = answer && answer.trim() !== '';

            return (
              <div key={category.id} className="answer-item-compact">
                <div className="answer-category-label">{category.label}</div>
                <div className="answer-text">
                  {hasAnswer ? answer : 'No answer'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Score Entry Panel - Redesigned with buttons */}
      <div className="score-entry-section">
        <h3>Enter Your Scores</h3>
        
        <div className="scoring-guide-top">
          <div className="guide-item"><span className="guide-badge unique">3</span> Unique</div>
          <div className="guide-item"><span className="guide-badge duplicate">1</span> Duplicate</div>
          <div className="guide-item"><span className="guide-badge invalid">0</span> Invalid/None</div>
        </div>

        <div className="score-entry-grid">
          {categories.map((category) => {
            const selectedScore = myScores[category.id];
            const myAnswer = myAnswers[category.id] || '';
            return (
              <div key={category.id} className="score-entry-item">
                <div className="score-entry-header">
                  <div className="score-category-name">{category.label}</div>
                  {myAnswer && (
                    <div className="my-answer-display">
                      {myAnswer}
                    </div>
                  )}
                </div>
                <div className="score-buttons">
                  <button
                    onClick={() => handleScoreSelect(category.id, 0)}
                    disabled={hasSubmitted}
                    className={`score-btn score-0 ${selectedScore === 0 ? 'selected' : ''}`}
                  >
                    0
                  </button>
                  <button
                    onClick={() => handleScoreSelect(category.id, 1)}
                    disabled={hasSubmitted}
                    className={`score-btn score-1 ${selectedScore === 1 ? 'selected' : ''}`}
                  >
                    1
                  </button>
                  <button
                    onClick={() => handleScoreSelect(category.id, 3)}
                    disabled={hasSubmitted}
                    className={`score-btn score-3 ${selectedScore === 3 ? 'selected' : ''}`}
                  >
                    3
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="score-total-display">
          <span>Total Points:</span>
          <strong>{totalPoints}</strong>
        </div>

        {hasSubmitted ? (
          <div className="submitted-status">
            <span className="check-icon">✓</span>
            <div>
              <strong>Scores Submitted!</strong>
              <p>Waiting for other players...</p>
            </div>
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            className="btn btn-primary btn-large btn-submit"
            disabled={Object.keys(myScores).length < categories.length}
          >
            {Object.keys(myScores).length < categories.length
              ? `Select scores for all categories (${Object.keys(myScores).length}/${categories.length})`
              : 'Submit My Scores'}
          </button>
        )}
      </div>
      
      <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
        <button 
          onClick={onLeaveLobby} 
          className="btn btn-secondary btn-large"
        >
          Leave Game
        </button>
      </div>
    </div>
  );
};

export default ManualScoring;
