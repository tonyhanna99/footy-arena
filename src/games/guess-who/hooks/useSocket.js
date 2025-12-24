import { useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export function useSocket(shouldConnect = false) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [lobby, setLobby] = useState(null);
  const [error, setError] = useState(null);
  const [sharedPlayerList, setSharedPlayerList] = useState([]);
  const [myPlayerLayout, setMyPlayerLayout] = useState([]);
  const [gamePhase, setGamePhase] = useState('waiting'); // 'waiting', 'selecting', 'playing'
  const [roundCounter, setRoundCounter] = useState(0); // Track round number for detecting new rounds
  const socketRef = useRef(null);
  const hasLeftLobby = useRef(false); // Track if user intentionally left

  const setupSocketHandlers = useCallback((socketInstance) => {
    // Connection event handlers
    socketInstance.on('connect', () => {
      console.log('Connected to Guess Who server:', socketInstance.id);
      setConnected(true);
      setError(null);
      
      // Check if we have a lobby to rejoin
      const savedLobby = localStorage.getItem('guessWho_lobby');
      const savedName = localStorage.getItem('guessWho_playerName');
      
      if (savedLobby && savedName) {
        console.log('Attempting to rejoin lobby:', savedLobby);
        socketInstance.emit('guessWho:rejoinLobby', { 
          code: savedLobby, 
          name: savedName 
        });
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from Guess Who server');
      setConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('Connection error:', err);
      setError('Failed to connect to server.');
    });

    // Lobby event handlers
    socketInstance.on('guessWho:lobbyUpdate', (data) => {
      console.log('Guess Who lobby update:', data);
      // Ignore lobby updates if user has intentionally left
      if (hasLeftLobby.current) {
        console.log('Ignoring lobby update - user has left lobby');
        return;
      }
      setLobby(data);
      if (data && data.code) {
        localStorage.setItem('guessWho_lobby', data.code);
      }
      if (data && data.phase) {
        setGamePhase(data.phase);
      }
    });

    socketInstance.on('guessWho:joinError', (data) => {
      console.error('Join error:', data);
      setError(data.message);
      localStorage.removeItem('guessWho_lobby');
      localStorage.removeItem('guessWho_playerName');
    });

    // Game start event - receive shared player list
    socketInstance.on('guessWho:gameStarted', (data) => {
      console.log('Guess Who game started:', data);
      setSharedPlayerList(data.sharedPlayerList);
      setMyPlayerLayout(data.myPlayerLayout);
      setGamePhase('selecting');
    });

    // Player selection events
    socketInstance.on('guessWho:playerSelected', (data) => {
      console.log('All players have selected:', data);
      setGamePhase('playing');
    });

    socketInstance.on('guessWho:opponentReady', (data) => {
      console.log('Opponent is ready:', data);
    });

    socketInstance.on('guessWho:gameEnded', (data) => {
      console.log('Game ended:', data);
      // Show error to user FIRST (before clearing state)
      // This ensures the error screen can detect it's a game-ended error
      setError(data.message || 'Game ended');
      
      // Clear lobby state and player data
      setSharedPlayerList([]);
      setMyPlayerLayout([]);
      
      // Keep lobby and gamePhase for now so error screen can detect game-ended state
      // These will be cleared when user clicks "Back to Menu"
    });

    socketInstance.on('guessWho:hostChanged', (data) => {
      console.log('Host changed:', data);
    });

    socketInstance.on('guessWho:error', (data) => {
      console.error('Server error:', data);
      setError(data.message);
    });

    // New round event
    socketInstance.on('guessWho:newRoundStarted', (data) => {
      console.log('New round started:', data);
      setSharedPlayerList(data.sharedPlayerList);
      setMyPlayerLayout(data.myPlayerLayout);
      setGamePhase('selecting');
      setError(null); // Clear any previous game-ended error
      setRoundCounter(prev => prev + 1); // Increment round counter
    });
  }, []);

  useEffect(() => {
    if (shouldConnect && !socketRef.current) {
      const newSocket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
      });

      socketRef.current = newSocket;
      setSocket(newSocket);
      setupSocketHandlers(newSocket);
    }

    return () => {
      if (socketRef.current && !shouldConnect) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setConnected(false);
      }
    };
  }, [shouldConnect, setupSocketHandlers]);

  // Create a new lobby
  const createLobby = useCallback((name) => {
    if (!socket) return;
    
    // Reset the flag when creating a new lobby
    hasLeftLobby.current = false;
    
    socket.emit('guessWho:createLobby', { name });
    localStorage.setItem('guessWho_playerName', name);
  }, [socket]);

  // Join an existing lobby
  const joinLobby = useCallback((code, name) => {
    if (!socket) return;
    
    // Reset the flag when joining a new lobby
    hasLeftLobby.current = false;
    
    socket.emit('guessWho:joinLobby', { code, name });
    localStorage.setItem('guessWho_playerName', name);
  }, [socket]);

  // Start the game (host only)
  const startGame = useCallback(() => {
    if (!socket || !lobby) return;
    
    socket.emit('guessWho:startGame', { code: lobby.code });
  }, [socket, lobby]);

  // Select your secret player
  const selectSecretPlayer = useCallback((playerName) => {
    if (!socket || !lobby) return;
    
    socket.emit('guessWho:selectPlayer', { 
      code: lobby.code, 
      playerName 
    });
  }, [socket, lobby]);

  // Start a new round (host only)
  const startNewRound = useCallback(() => {
    if (!socket || !lobby) return;
    
    socket.emit('guessWho:newRound', { code: lobby.code });
  }, [socket, lobby]);

  // Leave the lobby
  const leaveLobby = useCallback(() => {
    if (!socket || !lobby) return;
    
    // Set flag to ignore future lobby updates
    hasLeftLobby.current = true;
    
    socket.emit('guessWho:leaveLobby', { code: lobby.code });
    setLobby(null);
    setSharedPlayerList([]);
    setMyPlayerLayout([]);
    setGamePhase('waiting');
    localStorage.removeItem('guessWho_lobby');
  }, [socket, lobby]);

  // Disconnect socket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
      setLobby(null);
      setSharedPlayerList([]);
      setMyPlayerLayout([]);
      setGamePhase('waiting');
      setError(null); // Clear any errors
    }
  }, []);

  // Clear error and reset game state
  const clearError = useCallback(() => {
    setError(null);
    setLobby(null);
    setGamePhase('waiting');
    setSharedPlayerList([]);
    setMyPlayerLayout([]);
  }, []);

  return {
    socket,
    connected,
    lobby,
    error,
    sharedPlayerList,
    myPlayerLayout,
    gamePhase,
    roundCounter,
    createLobby,
    joinLobby,
    startGame,
    selectSecretPlayer,
    startNewRound,
    leaveLobby,
    disconnect,
    clearError,
  };
}
