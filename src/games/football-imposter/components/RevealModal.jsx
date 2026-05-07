import { useState } from 'react';

function RevealModal({ player, reveal, onClose, onMarkRevealed }) {
  const [isRevealed, setIsRevealed] = useState(false);

  const handleReveal = () => {
    // Haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(15);
    }
    setIsRevealed(true);
  };

  const handleDone = () => {
    onMarkRevealed(player.id);
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !isRevealed) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>
          {player.name}
        </h3>

        {!isRevealed ? (
          <div className="modal-reveal" onClick={handleReveal}>
            <div className="modal-reveal-text">Tap to Reveal</div>
            <div className="modal-reveal-hint">Your role will be shown</div>
          </div>
        ) : (
          <div className="reveal-content">
            {reveal.isImposter ? (
              <>
                <div className="imposter-text">IMPOSTER</div>
                <div className="role-label">You don't know the secret player</div>
              </>
            ) : (
              <>
                {reveal.image && (
                  <img
                    src={reveal.image}
                    alt={reveal.word}
                    style={{
                      width: '140px',
                      height: '140px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      objectPosition: 'top',
                      marginBottom: '0.75rem',
                      border: '3px solid #3b82f6',
                    }}
                  />
                )}
                <div className="secret-word">{reveal.word}</div>
                <div className="role-label">SECRET PLAYER</div>
              </>
            )}
          </div>
        )}

        {isRevealed && (
          <button onClick={handleDone} className="btn btn-primary btn-full">
            Done
          </button>
        )}

        {!isRevealed && (
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export default RevealModal;
