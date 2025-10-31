import React from 'react';

function FirstClueModal({ player, onClose }) {
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content first-clue-modal">
        <div className="first-clue-body" style={{ padding: '2.5rem 2rem' }}>
          <div className="first-clue-title">Player to give first clue</div>

          <div className="first-clue-name" style={{ marginTop: '1.25rem', fontSize: '1.5rem', fontWeight: 700 }}>{player.name}</div>
        </div>

        <div style={{ padding: '0 2rem 2rem' }}>
          <button onClick={onClose} className="btn btn-primary btn-full">Okay</button>
        </div>
      </div>
    </div>
  );
}

export default FirstClueModal;
