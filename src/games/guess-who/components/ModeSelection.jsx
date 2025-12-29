import React from 'react';
import { GameHeader, ModeSelectionButtons } from '../../../shared/components';

function ModeSelection({ onSelectMode }) {
  return (
    <div className="guess-who-mode-selection">
      <div className="mode-container">
        <GameHeader 
          title="Football Guess Who?"
          subtitle="Play the classic Guess Who game with football players!"
          icon="❓"
        />

        <ModeSelectionButtons
          onSelectOnline={() => onSelectMode('online')}
          showLocal={false}
          onlineLabel="Online Mode"
          onlineDesc="Play with a friend online"
        />

        <div className="how-to-play">
          <h3>How to Play</h3>
          <ul>
            <li>Each player selects a secret footballer</li>
            <li>Take turns asking yes/no questions</li>
            <li>Flip down cards to eliminate players</li>
            <li>First to guess the opponent's player wins!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ModeSelection;
