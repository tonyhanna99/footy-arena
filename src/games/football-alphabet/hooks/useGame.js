import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';

export const useGame = () => {
  const {
    socket,
    isConnected,
    joinLobby,
    createLobby,
    startGame,
    submitAnswers,
    submitManualScores,
    nextRound,
    leaveLobby,
    clearLobbyStorage,
  } = useSocket();

  // Game state
  const [gameState, setGameState] = useState('menu'); // menu, lobby, playing, revealing, scores
  const [lobbyCode, setLobbyCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [lobbyError, setLobbyError] = useState('');
  
  // Round state
  const [currentLetter, setCurrentLetter] = useState('');
  const [categories, setCategories] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [playerAnswers, setPlayerAnswers] = useState({});
  const [allAnswers, setAllAnswers] = useState({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  // Scores state
  const [roundScores, setRoundScores] = useState([]);
  const [totalScores, setTotalScores] = useState({});

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Lobby events
    socket.on('lobby-created', (data) => {
      setLobbyCode(data.lobbyCode);
      setIsHost(true);
      setPlayers(data.players);
      setGameState('lobby');
    });

    socket.on('lobby-joined', (data) => {
      setLobbyCode(data.lobbyCode);
      setIsHost(data.isHost);
      setPlayers(data.players);
      setGameState('lobby');
    });

    socket.on('player-joined', (data) => {
      setPlayers(data.players);
    });

    socket.on('player-left', (data) => {
      setPlayers(data.players);
      if (data.newHost) {
        setIsHost(data.newHost === socket.id);
      }
    });

    socket.on('lobby-error', (data) => {
      // Set error message to display on screen
      setLobbyError(data.message);
      
      // Clear localStorage and reset to menu if lobby is not found, game in progress, or insufficient players
      if (data.message.includes('not found') || 
          data.message.includes('already in progress') ||
          data.message.includes('other player left') ||
          data.message.includes('need at least')) {
        clearLobbyStorage();
        setGameState('menu');
        setLobbyCode('');
        setPlayers([]);
        setIsHost(false);
      }
    });

    // Game events
    socket.on('game-started', (data) => {
      setCurrentLetter(data.letter);
      setCategories(data.categories);
      setTimeRemaining(data.duration);
      setPlayerAnswers({});
      setHasSubmitted(false);
      setGameState('playing');
    });

    socket.on('timer-update', (data) => {
      setTimeRemaining(data.timeRemaining);
    });

    socket.on('round-ended', (data) => {
      setAllAnswers(data.allAnswers);
      setGameState('revealing');
    });

    socket.on('manual-scores-submitted', (data) => {
      // You could track who has submitted scores if needed
      console.log('Player submitted manual scores:', data);
    });

    socket.on('scores-updated', (data) => {
      setRoundScores(data.roundScores);
      setTotalScores(data.totalScores);
      setGameState('scores');
    });

    socket.on('next-round-started', (data) => {
      setCurrentLetter(data.letter);
      setCategories(data.categories);
      setTimeRemaining(data.duration);
      setPlayerAnswers({});
      setHasSubmitted(false);
      setAllAnswers({});
      setGameState('playing');
    });

    // Cleanup listeners
    return () => {
      socket.off('lobby-created');
      socket.off('lobby-joined');
      socket.off('player-joined');
      socket.off('player-left');
      socket.off('lobby-error');
      socket.off('game-started');
      socket.off('timer-update');
      socket.off('round-ended');
      socket.off('manual-scores-submitted');
      socket.off('scores-updated');
      socket.off('next-round-started');
    };
  }, [socket]);

  // Handle answer change
  const handleAnswerChange = useCallback((categoryId, value) => {
    setPlayerAnswers((prev) => ({
      ...prev,
      [categoryId]: value,
    }));
  }, []);

  // Handle submit
  const handleSubmit = useCallback(() => {
    submitAnswers(playerAnswers);
    setHasSubmitted(true);
  }, [playerAnswers, submitAnswers]);

  // Handle create lobby
  const handleCreateLobby = useCallback((name) => {
    setPlayerName(name);
    createLobby(name);
  }, [createLobby]);

  // Handle join lobby
  const handleJoinLobby = useCallback((code, name) => {
    setPlayerName(name);
    joinLobby(code, name);
  }, [joinLobby]);

  // Handle leave lobby
  const handleLeaveLobby = useCallback(() => {
    leaveLobby();
    setGameState('menu');
    setLobbyCode('');
    setPlayers([]);
    setIsHost(false);
  }, [leaveLobby]);

  // Handle submit manual scores
  const handleSubmitManualScores = useCallback((scores) => {
    submitManualScores(scores);
  }, [submitManualScores]);

  return {
    // Connection
    isConnected,
    
    // Game state
    gameState,
    lobbyCode,
    playerName,
    players,
    isHost,
    lobbyError,
    
    // Round state
    currentLetter,
    categories,
    timeRemaining,
    playerAnswers,
    allAnswers,
    hasSubmitted,
    
    // Scores
    roundScores,
    totalScores,
    
    // Actions
    handleCreateLobby,
    handleJoinLobby,
    handleLeaveLobby,
    startGame,
    handleAnswerChange,
    handleSubmit,
    handleSubmitManualScores,
    nextRound,
  };
};
