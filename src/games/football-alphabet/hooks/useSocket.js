import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.PROD 
  ? 'https://footy-arena-backend.vercel.app'
  : 'http://localhost:3000';

// LocalStorage keys
const STORAGE_KEYS = {
  LOBBY_CODE: 'football_alphabet_lobby_code',
  PLAYER_NAME: 'football_alphabet_player_name',
  IS_HOST: 'football_alphabet_is_host',
};

export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const reconnectAttemptRef = useRef(0);
  const maxReconnectAttempts = 10;
  const isUnloadingRef = useRef(false);

  useEffect(() => {
    // Handle tab close / window close - explicitly leave lobby
    const handleBeforeUnload = (e) => {
      isUnloadingRef.current = true;
      
      // Emit leave-lobby event when tab/window is closing
      const storedLobbyCode = localStorage.getItem(STORAGE_KEYS.LOBBY_CODE);
      if (storedLobbyCode && socketRef.current && socketRef.current.connected) {
        // Use volatile emit for reliability during page unload
        socketRef.current.volatile.emit('leave-lobby');
        
        // Also disconnect the socket explicitly to trigger server-side cleanup
        socketRef.current.disconnect();
        
        // Clear storage immediately when closing
        localStorage.removeItem(STORAGE_KEYS.LOBBY_CODE);
        localStorage.removeItem(STORAGE_KEYS.PLAYER_NAME);
        localStorage.removeItem(STORAGE_KEYS.IS_HOST);
      }
    };
    
    // Handle tab visibility changes (switching tabs, minimizing)
    // We DON'T want to disconnect on tab switch - just maintain connection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('Tab hidden - maintaining connection');
        // Connection stays alive, player remains in lobby
      } else {
        console.log('Tab visible again');
        // Socket.IO will automatically reconnect if needed
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Create socket connection with enhanced reconnection settings
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
      reconnectAttemptRef.current = 0;
      
      // Auto-rejoin lobby if we have stored lobby info
      const storedLobbyCode = localStorage.getItem(STORAGE_KEYS.LOBBY_CODE);
      const storedPlayerName = localStorage.getItem(STORAGE_KEYS.PLAYER_NAME);
      
      if (storedLobbyCode && storedPlayerName) {
        console.log('Auto-rejoining lobby:', storedLobbyCode);
        newSocket.emit('join-lobby', { 
          lobbyCode: storedLobbyCode, 
          playerName: storedPlayerName 
        });
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      setIsConnected(false);
      
      // Don't clear storage on disconnect - we want to rejoin
      if (reason === 'io server disconnect') {
        // Server initiated disconnect - try to reconnect
        newSocket.connect();
      }
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log('Reconnection attempt', attemptNumber);
      reconnectAttemptRef.current = attemptNumber;
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('Reconnection failed after max attempts');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
    });

    // Cleanup on unmount
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Only disconnect if component is unmounting, not if tab is closing
      // (beforeunload will have already handled tab close)
      if (newSocket && !isUnloadingRef.current) {
        newSocket.disconnect();
      }
    };
  }, []);

  // Join a lobby
  const joinLobby = useCallback((lobbyCode, playerName) => {
    if (socket) {
      // Store lobby info for auto-rejoin
      localStorage.setItem(STORAGE_KEYS.LOBBY_CODE, lobbyCode);
      localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, playerName);
      socket.emit('join-lobby', { lobbyCode, playerName });
    }
  }, [socket]);

  // Create a new lobby
  const createLobby = useCallback((playerName) => {
    if (socket) {
      // Store player name for auto-rejoin
      localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, playerName);
      localStorage.setItem(STORAGE_KEYS.IS_HOST, 'true');
      socket.emit('create-lobby', { playerName });
    }
  }, [socket]);

  // Start the game
  const startGame = useCallback((duration = 60, categoriesPerRound = 5) => {
    if (socket) {
      socket.emit('start-game', { duration, categoriesPerRound });
    }
  }, [socket]);

  // Submit answers
  const submitAnswers = useCallback((answers) => {
    if (socket) {
      socket.emit('submit-answers', answers);
    }
  }, [socket]);

  // Request next round
  const nextRound = useCallback(() => {
    if (socket) {
      socket.emit('next-round');
    }
  }, [socket]);

  // Leave lobby
  const leaveLobby = useCallback(() => {
    if (socket) {
      socket.emit('leave-lobby');
      // Clear stored lobby info when explicitly leaving
      localStorage.removeItem(STORAGE_KEYS.LOBBY_CODE);
      localStorage.removeItem(STORAGE_KEYS.PLAYER_NAME);
      localStorage.removeItem(STORAGE_KEYS.IS_HOST);
    }
  }, [socket]);

  // Submit manual scores
  const submitManualScores = useCallback((scores) => {
    if (socket) {
      socket.emit('submit-manual-scores', scores);
    }
  }, [socket]);

  // Clear lobby storage (useful for manual cleanup)
  const clearLobbyStorage = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.LOBBY_CODE);
    localStorage.removeItem(STORAGE_KEYS.PLAYER_NAME);
    localStorage.removeItem(STORAGE_KEYS.IS_HOST);
  }, []);

  return {
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
  };
};
