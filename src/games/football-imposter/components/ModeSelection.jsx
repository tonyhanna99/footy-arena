import React from 'react';
import { ModeSelectionButtons } from '../../../shared/components';

function ModeSelection({ onSelectMode }) {
  return (
    <div className="mode-selection">
      <h2>Choose Game Mode</h2>
      <ModeSelectionButtons
        onSelectLocal={() => onSelectMode('local')}
        onSelectOnline={() => onSelectMode('online')}
      />
    </div>
  );
}

export default ModeSelection;
