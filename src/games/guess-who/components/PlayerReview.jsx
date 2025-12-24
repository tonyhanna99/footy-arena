import React, { useState, useEffect } from 'react';
import { FOOTBALL_PLAYERS } from '../../../shared/data/players.js';
import './PlayerReview.css';

function PlayerReview() {
  const [hiddenPlayers, setHiddenPlayers] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'with-image', 'no-image'

  // Load hidden players from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('hiddenPlayers');
    if (saved) {
      setHiddenPlayers(new Set(JSON.parse(saved)));
    }
  }, []);

  // Save hidden players to localStorage
  useEffect(() => {
    localStorage.setItem('hiddenPlayers', JSON.stringify([...hiddenPlayers]));
  }, [hiddenPlayers]);

  const toggleHidePlayer = (playerName) => {
    setHiddenPlayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playerName)) {
        newSet.delete(playerName);
      } else {
        newSet.add(playerName);
      }
      return newSet;
    });
  };

  const clearAllHidden = () => {
    if (window.confirm('Are you sure you want to show all hidden players?')) {
      setHiddenPlayers(new Set());
    }
  };

  // Filter players
  const filteredPlayers = FOOTBALL_PLAYERS.filter(player => {
    const playerName = typeof player === 'string' ? player : player.name;
    const playerImage = typeof player === 'string' ? null : player.image;
    
    // Check if hidden
    if (hiddenPlayers.has(playerName)) {
      return false;
    }

    // Search filter
    if (searchTerm && !playerName.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Image filter
    if (filterMode === 'with-image' && !playerImage) {
      return false;
    }
    if (filterMode === 'no-image' && playerImage) {
      return false;
    }

    return true;
  });

  const totalPlayers = FOOTBALL_PLAYERS.length;
  const hiddenCount = hiddenPlayers.size;
  const visibleCount = totalPlayers - hiddenCount;
  const withImageCount = FOOTBALL_PLAYERS.filter(p => (typeof p === 'string' ? false : p.image)).length;
  const noImageCount = totalPlayers - withImageCount;

  return (
    <div className="player-review">
      <div className="review-header">
        <h1>Player Image Review</h1>
        <p className="review-subtitle">Review and verify player images. Hide correct ones to focus on missing/incorrect images.</p>
      </div>

      <div className="review-stats">
        <div className="stat-card">
          <div className="stat-value">{totalPlayers}</div>
          <div className="stat-label">Total Players</div>
        </div>
        <div className="stat-card stat-success">
          <div className="stat-value">{withImageCount}</div>
          <div className="stat-label">With Images</div>
        </div>
        <div className="stat-card stat-warning">
          <div className="stat-value">{noImageCount}</div>
          <div className="stat-label">No Images</div>
        </div>
        <div className="stat-card stat-info">
          <div className="stat-value">{hiddenCount}</div>
          <div className="stat-label">Hidden</div>
        </div>
        <div className="stat-card stat-primary">
          <div className="stat-value">{visibleCount}</div>
          <div className="stat-label">Visible</div>
        </div>
      </div>

      <div className="review-controls">
        <input
          type="text"
          placeholder="Search players..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterMode === 'all' ? 'active' : ''}`}
            onClick={() => setFilterMode('all')}
          >
            All ({visibleCount})
          </button>
          <button
            className={`filter-btn ${filterMode === 'with-image' ? 'active' : ''}`}
            onClick={() => setFilterMode('with-image')}
          >
            With Image
          </button>
          <button
            className={`filter-btn ${filterMode === 'no-image' ? 'active' : ''}`}
            onClick={() => setFilterMode('no-image')}
          >
            No Image
          </button>
        </div>

        {hiddenCount > 0 && (
          <button className="btn-clear-hidden" onClick={clearAllHidden}>
            Show All Hidden ({hiddenCount})
          </button>
        )}
      </div>

      <div className="review-grid">
        {filteredPlayers.map((player, index) => {
          const playerName = typeof player === 'string' ? player : player.name;
          const playerImage = typeof player === 'string' ? null : player.image;
          
          return (
            <div key={`${playerName}-${index}`} className="player-review-card">
              <div className="player-image-container">
                {playerImage ? (
                  <img 
                    src={playerImage} 
                    alt={playerName}
                    className="player-review-image"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="no-image-placeholder" 
                  style={{ display: playerImage ? 'none' : 'flex' }}
                >
                  <span className="no-image-icon">?</span>
                  <span className="no-image-text">No Image</span>
                </div>
              </div>
              <div className="player-review-info">
                <div className="player-review-name">{playerName}</div>
                <div className="player-index">#{index + 1}</div>
                <button
                  className="btn-hide-player"
                  onClick={() => toggleHidePlayer(playerName)}
                >
                  ✓ Hide (Correct)
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredPlayers.length === 0 && (
        <div className="no-results">
          <p>No players found matching your filters.</p>
          {hiddenCount > 0 && (
            <button className="btn-show-all" onClick={clearAllHidden}>
              Show All Hidden Players
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default PlayerReview;
