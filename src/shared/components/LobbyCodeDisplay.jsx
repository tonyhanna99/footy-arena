import React from 'react';

/**
 * Shared component for displaying and sharing lobby codes across all games
 * @param {string} code - The lobby code to display
 * @param {string} label - Optional custom label (defaults to "Share this code with your friend:")
 */
function LobbyCodeDisplay({ code, label = "Share this code with your friend:" }) {
  const copyLobbyCode = () => {
    navigator.clipboard.writeText(code);
  };

  const copyLobbyUrl = () => {
    const url = `${window.location.origin}${window.location.pathname}?join=${code}`;
    navigator.clipboard.writeText(url);
  };

  return (
    <div className="lobby-code-display">
      <div className="code-label">{label}</div>
      <div className="code-value">{code}</div>
      <div className="copy-buttons">
        <button onClick={copyLobbyCode} className="btn btn-secondary" title="Copy lobby code">
          📋 Copy Code
        </button>
        <button onClick={copyLobbyUrl} className="btn btn-secondary" title="Copy invite link">
          🔗 Copy Link
        </button>
      </div>
    </div>
  );
}

export default LobbyCodeDisplay;
