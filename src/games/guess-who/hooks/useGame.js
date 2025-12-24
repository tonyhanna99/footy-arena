import { useState, useCallback } from 'react';

export function useGame() {
  const [flippedPlayers, setFlippedPlayers] = useState(new Set());
  const [selectedSecretPlayer, setSelectedSecretPlayer] = useState(null);

  // Toggle flip state for a player card
  const toggleFlip = useCallback((playerName) => {
    setFlippedPlayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playerName)) {
        newSet.delete(playerName);
      } else {
        newSet.add(playerName);
      }
      return newSet;
    });
  }, []);

  // Check if a player is flipped
  const isFlipped = useCallback((playerName) => {
    return flippedPlayers.has(playerName);
  }, [flippedPlayers]);

  // Select secret player
  const selectPlayer = useCallback((playerName) => {
    setSelectedSecretPlayer(playerName);
  }, []);

  // Reset game state
  const resetGame = useCallback(() => {
    setFlippedPlayers(new Set());
    setSelectedSecretPlayer(null);
  }, []);

  // Reset only the board (keep secret player)
  const resetBoard = useCallback(() => {
    setFlippedPlayers(new Set());
  }, []);

  return {
    flippedPlayers,
    selectedSecretPlayer,
    toggleFlip,
    isFlipped,
    selectPlayer,
    resetGame,
    resetBoard,
  };
}
