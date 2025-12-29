import React from 'react';

const GameBoard = ({
  currentLetter,
  categories,
  timeRemaining,
  playerAnswers,
  hasSubmitted,
  onAnswerChange,
  onSubmit,
  onLeaveLobby,
}) => {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const isTimeRunningOut = timeRemaining <= 10 && timeRemaining > 0;
  const isTimeUp = timeRemaining === 0;

  return (
    <div className="game-board">
      {/* Header with Timer */}
      <div className="game-header">
        <h2>Round in Progress</h2>
        <div className={`timer ${isTimeRunningOut ? 'timer-warning' : ''}`}>
          <span className="timer-icon">⏱</span>
          <div className="timer-content">
            <div className="timer-label">Time Remaining</div>
            <div className="timer-value">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="alphabet-game-container">
        {/* Letter Display */}
        <div className="letter-display">
          <div className="letter-box">
            <div className="letter-large">{currentLetter}</div>
            <div className="letter-divider"></div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="categories-grid">
          {categories.map((category) => {
            const answer = playerAnswers[category.id] || '';
            
            return (
              <div key={category.id} className="category-card">
                <div className="category-header">
                  <h3>{category.label}</h3>
                </div>
                <div className="category-input-wrapper">
                  <input
                    type="text"
                    value={answer}
                    onChange={(e) => onAnswerChange(category.id, e.target.value)}
                    placeholder={category.placeholder}
                    disabled={isTimeUp || hasSubmitted}
                    className="category-input"
                    maxLength={50}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Messages */}
      <div className="game-actions">
        {hasSubmitted ? (
          <div className="status-message success">
            <span>✓</span>
            <div>
              <strong>Answers Submitted!</strong>
              <p>Waiting for other players...</p>
            </div>
          </div>
        ) : isTimeUp ? (
          <div className="status-message">
            <strong>Time's Up!</strong>
            <p>Auto-submitting your answers...</p>
          </div>
        ) : (
          <div className="status-message info">
            <strong>Keep typing!</strong>
            <p>Answers will auto-submit when time runs out</p>
          </div>
        )}
      </div>
      
      <div className="game-actions" style={{ marginTop: '0.5rem' }}>
        <button 
          onClick={onLeaveLobby} 
          className="btn btn-secondary btn-large"
        >
          Leave Game
        </button>
      </div>

      {/* Helper Text */}
      <div className="game-tip">
        💡 Tip: Unique answers score 3 points, duplicate answers score 1 point
      </div>
    </div>
  );
};

export default GameBoard;
