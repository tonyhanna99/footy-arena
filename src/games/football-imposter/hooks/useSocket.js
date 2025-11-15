import { useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

// Use environment variable or default to localhost
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export function useSocket(shouldConnect = false) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [lobby, setLobby] = useState(null);
  const [myRole, setMyRole] = useState(null);
  const [footballer, setFootballer] = useState(null);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  const setupSocketHandlers = useCallback((socketInstance) => {
    // Connection event handlers
    socketInstance.on('connect', () => {
      console.log('Connected to server:', socketInstance.id);
      setConnected(true);
      setError(null);
      
      // Check if we have a lobby to rejoin (from localStorage)
      const savedLobby = localStorage.getItem('footballImposter_lobby');
      const savedName = localStorage.getItem('footballImposter_playerName');
      
      if (savedLobby && savedName) {
        console.log('Attempting to rejoin lobby:', savedLobby);
        socketInstance.emit('rejoinLobby', { 
          code: savedLobby, 
          name: savedName 
        });
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('Connection error:', err);
      setError('Failed to connect to server.');
    });

    // Lobby event handlers
    socketInstance.on('lobbyUpdate', (data) => {
      console.log('Lobby update:', data);
      setLobby(data);
      // Save lobby code to localStorage for reconnection
      if (data && data.code) {
        localStorage.setItem('footballImposter_lobby', data.code);
      }
    });

    socketInstance.on('joinError', (data) => {
      console.error('Join error:', data);
      setError(data.message);
      // Clear saved lobby data if join fails
      localStorage.removeItem('footballImposter_lobby');
      localStorage.removeItem('footballImposter_playerName');
    });

    socketInstance.on('roleAssigned', (data) => {
      console.log('Role assigned:', data);
      
      // Validate that we have a lobby before setting role
      if (!data) {
        console.error('Received roleAssigned with no data');
        return;
      }
      
      setMyRole(data.role);
      setFootballer(data.footballer); // Will be null for imposters
    });

    socketInstance.on('hostChanged', (data) => {
      console.log('Host changed:', data);
      // Just log it - no alert needed, the crown will update automatically
    });

    socketInstance.on('error', (data) => {
      console.error('Server error:', data);
      setError(data.message);
    });
  }, []);

  useEffect(() => {
    // Only create socket connection if shouldConnect is true
    if (shouldConnect && !socketRef.current) {
      const newSocket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
      });

      socketRef.current = newSocket;
      setSocket(newSocket);
      setupSocketHandlers(newSocket);
    }

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [shouldConnect, setupSocketHandlers]);

  const createLobby = (name) => {
    if (socket && connected) {
      setError(null);
      localStorage.setItem('footballImposter_playerName', name);
      socket.emit('createLobby', { name });
    }
  };

  const joinLobby = (code, name) => {
    if (socket && connected) {
      setError(null);
      localStorage.setItem('footballImposter_playerName', name);
      socket.emit('joinLobby', { code, name });
    }
  };

  const startGame = (code, imposterCount) => {
    if (socket && connected) {
      setError(null);
      socket.emit('startGame', { code, imposterCount });
    }
  };

  const newRound = (code) => {
    if (socket && connected) {
      setError(null);
      setMyRole(null);
      setFootballer(null);
      socket.emit('newRound', { code });
    }
  };

  const leaveLobby = () => {
    // Clear localStorage when intentionally leaving
    localStorage.removeItem('footballImposter_lobby');
    localStorage.removeItem('footballImposter_playerName');
    
    setLobby(null);
    setMyRole(null);
    setFootballer(null);
    setError(null);
    // Disconnect and reconnect to clear state
    if (socketRef.current) {
      socketRef.current.close();
      const newSocket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
      });
      socketRef.current = newSocket;
      setSocket(newSocket);
      setupSocketHandlers(newSocket);
    }
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
      setLobby(null);
      setMyRole(null);
      setFootballer(null);
      setError(null);
    }
  };

  return {
    socket,
    connected,
    lobby,
    myRole,
    footballer,
    error,
    createLobby,
    joinLobby,
    startGame,
    newRound,
    leaveLobby,
    disconnect,
  };
}
