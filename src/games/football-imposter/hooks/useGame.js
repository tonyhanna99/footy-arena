import { useState, useCallback, useEffect } from 'react';
import { FOOTBALL_PLAYERS } from '../data/players.js';

const STORAGE_KEY = 'football-imposter-game';

// Utility functions with clean, reliable randomness
const shuffleArray = (array) => {
  const shuffled = [...array];
  // Standard Fisher-Yates shuffle - proven algorithm
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const generateId = () => Math.random().toString(36).substr(2, 9);

const getRandomPlayer = () => {
  const randomIndex = Math.floor(Math.random() * FOOTBALL_PLAYERS.length);
  return FOOTBALL_PLAYERS[randomIndex];
};

const assignRoles = (playerNames, imposterCount) => {
  // First, shuffle the actual player names to break input order dependency
  const shuffledNames = shuffleArray([...playerNames]);
  
  // Then randomly select which positions in the shuffled array become imposters
  const allIndices = Array.from({ length: shuffledNames.length }, (_, i) => i);
  const shuffledIndices = shuffleArray(allIndices);
  const imposterIndices = shuffledIndices.slice(0, imposterCount);
  
  return shuffledNames.map((name, index) => ({
    id: generateId(),
    name,
    role: imposterIndices.includes(index) ? 'imposter' : 'crew',
    revealed: false,
  }));
};

export function useGame() {
  const [screen, setScreen] = useState('setup');
  const [players, setPlayers] = useState([]);
  const [secretWord, setSecretWord] = useState('');
  const [settings, setSettings] = useState({
    count: '',
    names: [],
    imposters: '',
  });
  const [roundId, setRoundId] = useState('');

  // Load saved data from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.settings) {
          setSettings(prev => ({
            ...prev,
            names: data.settings.names || [],
            imposters: data.settings.imposters || '',
          }));
        }
      }
    } catch (error) {
      console.warn('Failed to load saved game data:', error);
    }
  }, []);

  // Save important data to localStorage
  const saveToStorage = useCallback((newSettings) => {
    try {
      const dataToSave = {
        settings: {
          names: newSettings.names,
          imposters: newSettings.imposters,
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.warn('Failed to save game data:', error);
    }
  }, []);

  const startRound = useCallback((newSettings) => {
    const { count, names, imposters } = newSettings;
    
    // Validate settings
    if (names.length !== count || imposters >= count) {
      return false;
    }

    // Generate new round
    const newPlayers = assignRoles(names, imposters);
    const newSecretWord = getRandomPlayer();
    const newRoundId = generateId();

    setPlayers(newPlayers);
    setSecretWord(newSecretWord);
    setSettings(newSettings);
    setRoundId(newRoundId);
    setScreen('dashboard');

    // Save to localStorage
    saveToStorage(newSettings);

    return true;
  }, [saveToStorage]);

  const revealFor = useCallback((playerId) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return null;

    return {
      word: player.role === 'crew' ? secretWord : null,
      role: player.role,
      isImposter: player.role === 'imposter',
    };
  }, [players, secretWord]);

  const markRevealed = useCallback((playerId) => {
    setPlayers(prev => prev.map(player => 
      player.id === playerId 
        ? { ...player, revealed: true }
        : player
    ));
  }, []);

  const resetToSetup = useCallback((preserveNames = true) => {
    setScreen('setup');
    setPlayers([]);
    setSecretWord('');
    setRoundId('');
    
    if (!preserveNames) {
      setSettings(prev => ({
        ...prev,
        names: [],
      }));
    }
  }, []);

  // Validation helpers
  const validateSettings = useCallback((settingsToValidate) => {
    const errors = {};
    
    const count = parseInt(settingsToValidate.count);
    const imposters = parseInt(settingsToValidate.imposters);
    
    if (!count || count < 3 || count > 12) {
      errors.count = 'Player count must be between 3 and 12';
    }
    
    if (!imposters || imposters < 1 || imposters > 3) {
      errors.imposters = 'Imposter count must be between 1 and 3';
    }
    
    if (count && imposters && imposters >= count) {
      errors.imposters = 'Imposter count must be less than player count';
    }
    
    if (count && settingsToValidate.names.length > 0) {
      const names = settingsToValidate.names.filter(name => name.trim());
      if (names.length !== count) {
        errors.names = `You need exactly ${count} player names`;
      }
      
      const uniqueNames = new Set(names.map(name => name.trim().toLowerCase()));
      if (uniqueNames.size !== names.length) {
        errors.names = 'All player names must be unique';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }, []);

  return {
    // State
    screen,
    players,
    secretWord,
    settings,
    roundId,
    
    // Actions
    startRound,
    revealFor,
    markRevealed,
    resetToSetup,
    
    // Validation
    validateSettings,
    
    // Computed values
    allPlayersRevealed: players.length > 0 && players.every(p => p.revealed),
    crewCount: players.filter(p => p.role === 'crew').length,
    imposterCount: players.filter(p => p.role === 'imposter').length,
  };
}
