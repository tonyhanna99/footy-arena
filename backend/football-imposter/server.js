const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

// Import player data from local copy
const FOOTBALL_PLAYERS = require('./players.json');

const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.IO
const allowedOrigins = [
  'http://localhost:5173', // Local dev
  'http://localhost:5174', // Local dev (alternate port)
  'https://footyarena.com', // Production
  'https://www.footyarena.com', // Production with www
  'https://footy-arena-*.vercel.app', // Vercel preview deployments
];

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      // Check if origin matches allowed patterns
      const isAllowed = allowedOrigins.some(pattern => {
        if (pattern.includes('*')) {
          const regex = new RegExp(pattern.replace('*', '.*'));
          return regex.test(origin);
        }
        return pattern === origin;
      });
      
      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  },
  // Increase ping timeout to handle phone locks and slow connections
  // Total timeout: pingInterval + pingTimeout = 120s + 60s = 180 seconds (3 minutes)
  pingTimeout: 60000, // 60 seconds - wait time for pong response (up from default 5s)
  pingInterval: 120000, // 120 seconds - how often to send ping (up from default 25s)
});

const PORT = process.env.PORT || 3000;

// Track server uptime
const serverStartTime = Date.now();

// In-memory storage for all lobbies
// Structure: { [lobbyCode]: { code, status, hostSocketId, players: [], footballer: null, lastActivity: Date } }
const lobbies = {};

// Lobby cleanup configuration
const LOBBY_INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

// Rate limiting for lobby creation
const lobbyCreationAttempts = new Map(); // Track attempts per socket
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute window
const MAX_LOBBY_CREATIONS = 5; // Max 5 lobbies per minute per socket

// Track active lobby per socket (prevent joining multiple lobbies)
const socketToLobby = new Map(); // Maps socket ID to lobby code

// Cleanup inactive lobbies every 5 minutes
setInterval(() => {
  const now = Date.now();
  let deletedCount = 0;
  
  for (const code in lobbies) {
    const lobby = lobbies[code];
    const inactiveTime = now - lobby.lastActivity;
    
    if (inactiveTime > LOBBY_INACTIVITY_TIMEOUT) {
      delete lobbies[code];
      deletedCount++;
      console.log(`Lobby ${code} deleted due to inactivity (${Math.floor(inactiveTime / 60000)} minutes)`);
    }
  }
  
  if (deletedCount > 0) {
    console.log(`Cleanup complete: ${deletedCount} inactive lobbies deleted`);
  }
}, 5 * 60 * 1000); // Run every 5 minutes

// Helper function to get a random footballer
function getRandomFootballer() {
  return FOOTBALL_PLAYERS[Math.floor(Math.random() * FOOTBALL_PLAYERS.length)];
}

// Helper function for proper Fisher-Yates shuffle
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Helper function to generate a random lobby code
function generateLobbyCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Check if code already exists (very unlikely but possible)
  return lobbies[code] ? generateLobbyCode() : code;
}

// Helper function to get lobby data to send to clients
// If hideRoles is true, we don't expose individual player roles (for public updates)
function getLobbyData(lobby, hideRoles = false) {
  const players = lobby.players || [];
  
  // During an active game, use the frozen initial counts to prevent role reveals when players disconnect
  // Otherwise, calculate from current players (but this should be 0 during waiting status anyway)
  let imposterCount, crewCount;
  
  if (lobby.status === 'in_progress') {
    // Use frozen counts from game start - NEVER recalculate during active game
    imposterCount = lobby.initialImposterCount || 0;
    crewCount = lobby.initialCrewCount || 0;
  } else {
    // During waiting or finished, counts are 0 (roles not yet assigned or game over)
    imposterCount = 0;
    crewCount = 0;
  }
  
  return {
    code: lobby.code,
    status: lobby.status,
    hostSocketId: lobby.hostSocketId,
    selectedImposterCount: lobby.selectedImposterCount || 1, // Host's selection
    imposterCount: imposterCount,
    crewCount: crewCount,
    players: lobby.players.map(p => ({
      socketId: p.socketId,
      name: p.name,
      isHost: p.isHost,
      role: hideRoles ? null : p.role,
      isAlive: p.isAlive
    }))
  };
}

// Helper function to update lobby activity timestamp
function updateLobbyActivity(lobby) {
  if (lobby) {
    lobby.lastActivity = Date.now();
  }
}

// Helper function to remove a player from a lobby
function removePlayerFromLobby(socketId) {
  for (const code in lobbies) {
    const lobby = lobbies[code];
    const playerIndex = lobby.players.findIndex(p => p.socketId === socketId);
    
    if (playerIndex !== -1) {
      lobby.players.splice(playerIndex, 1);
      console.log(`Player ${socketId} removed from lobby ${code}`);
      
      // Remove from tracking map
      socketToLobby.delete(socketId);
      
      // If lobby is now empty, delete it
      if (lobby.players.length === 0) {
        delete lobbies[code];
        console.log(`Lobby ${code} deleted (empty)`);
        return null;
      }
      
      // If the host left, promote the first remaining player
      if (lobby.hostSocketId === socketId) {
        // Reset all players' host status first
        lobby.players.forEach(p => p.isHost = false);
        
        // Promote first player to host
        const newHost = lobby.players[0];
        lobby.hostSocketId = newHost.socketId;
        newHost.isHost = true;
        console.log(`New host for lobby ${code}: ${newHost.name}`);
        
        // Return both lobby and new host info for notification
        return { lobby, newHostName: newHost.name };
      }
      
      return { lobby, newHostName: null };
    }
  }
  return null;
}

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);
  
  // Event: createLobby
  socket.on('createLobby', ({ name }) => {
    // Check if socket is already in a lobby
    if (socketToLobby.has(socket.id)) {
      socket.emit('error', { message: 'You are already in a lobby. Please leave it first.' });
      console.log(`Create lobby failed: Socket ${socket.id} already in lobby ${socketToLobby.get(socket.id)}`);
      return;
    }
    
    // Rate limiting check
    const now = Date.now();
    const attempts = lobbyCreationAttempts.get(socket.id) || [];
    
    // Filter out old attempts (outside the time window)
    const recentAttempts = attempts.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
    
    if (recentAttempts.length >= MAX_LOBBY_CREATIONS) {
      socket.emit('error', { message: 'Too many lobby creation attempts. Please wait a moment.' });
      console.log(`Rate limit exceeded for socket ${socket.id}`);
      return;
    }
    
    // Track this attempt
    recentAttempts.push(now);
    lobbyCreationAttempts.set(socket.id, recentAttempts);
    
    const code = generateLobbyCode();
    
    const lobby = {
      code,
      status: 'waiting',
      hostSocketId: socket.id,
      footballer: null, // Will be set when game starts
      selectedImposterCount: 1, // Default imposter count
      initialImposterCount: 0, // Frozen count at game start (for preventing role reveals)
      initialCrewCount: 0, // Frozen count at game start (for preventing role reveals)
      lastActivity: Date.now(), // Track last activity for cleanup
      players: [
        {
          socketId: socket.id,
          name,
          isHost: true,
          role: null,
          isAlive: true
        }
      ]
    };
    
    lobbies[code] = lobby;
    socket.join(code);
    
    // Track this socket's lobby membership
    socketToLobby.set(socket.id, code);
    
    console.log(`Lobby created: ${code} by ${name} (${socket.id})`);
    
    // Send lobby data back to the creator
    socket.emit('lobbyUpdate', getLobbyData(lobby));
  });
  
  // Event: rejoinLobby (for reconnection after disconnect/refresh)
  socket.on('rejoinLobby', ({ code, name }) => {
    const lobby = lobbies[code];
    
    // Validate lobby exists
    if (!lobby) {
      console.log(`Rejoin failed: Lobby ${code} not found`);
      return;
    }
    
    // Find player by name in the lobby
    const player = lobby.players.find(p => p.name === name);
    
    if (player) {
      // Update socket ID for this player
      const oldSocketId = player.socketId;
      player.socketId = socket.id;
      
      socket.join(code);
      
      // Track this socket's lobby membership
      socketToLobby.set(socket.id, code);
      
      console.log(`Player ${name} rejoined lobby ${code}. Socket ID updated from ${oldSocketId} to ${socket.id}`);
      
      // Update activity timestamp
      updateLobbyActivity(lobby);
      
      // Send lobby update to the rejoining player
      socket.emit('lobbyUpdate', getLobbyData(lobby, lobby.status === 'waiting'));
      
      // If game is in progress, send role assignment
      if (lobby.status === 'in_progress' && player.role) {
        socket.emit('roleAssigned', {
          role: player.role,
          footballer: player.role === 'crew' ? lobby.footballer : null
        });
      }
      
      // Notify other players in the lobby
      socket.to(code).emit('lobbyUpdate', getLobbyData(lobby, lobby.status === 'waiting'));
    } else {
      console.log(`Rejoin failed: Player ${name} not found in lobby ${code}`);
      // Player not in lobby, treat as new join
      socket.emit('joinError', { message: 'Player not found in lobby. Please join again.' });
    }
  });
  
  // Event: joinLobby
  socket.on('joinLobby', ({ code, name }) => {
    // Check if socket is already in a lobby
    if (socketToLobby.has(socket.id)) {
      socket.emit('joinError', { message: 'You are already in a lobby. Please leave it first.' });
      console.log(`Join lobby failed: Socket ${socket.id} already in lobby ${socketToLobby.get(socket.id)}`);
      return;
    }
    
    const lobby = lobbies[code];
    
    // Validate lobby exists
    if (!lobby) {
      socket.emit('joinError', { message: 'Lobby not found' });
      console.log(`Join failed: Lobby ${code} not found`);
      return;
    }
    
    // Validate lobby is in waiting status
    if (lobby.status !== 'waiting') {
      socket.emit('joinError', { message: 'Game already in progress or finished' });
      console.log(`Join failed: Lobby ${code} not in waiting status`);
      return;
    }
    
    // Add player to lobby
    lobby.players.push({
      socketId: socket.id,
      name,
      isHost: false,
      role: null,
      isAlive: true
    });
    
    socket.join(code);
    
    // Track this socket's lobby membership
    socketToLobby.set(socket.id, code);
    
    console.log(`Player ${name} (${socket.id}) joined lobby ${code}`);
    
    // Update activity timestamp
    updateLobbyActivity(lobby);
    
    // Notify all players in the lobby about the update
    io.to(code).emit('lobbyUpdate', getLobbyData(lobby));
  });
  
  // Event: updateImposterCount (host only)
  socket.on('updateImposterCount', ({ code, imposterCount }) => {
    const lobby = lobbies[code];
    
    if (!lobby) {
      return;
    }
    
    // Only host can update
    if (lobby.hostSocketId !== socket.id) {
      return;
    }
    
    // Update and broadcast
    lobby.selectedImposterCount = imposterCount;
    io.to(code).emit('lobbyUpdate', getLobbyData(lobby));
    
    console.log(`Lobby ${code} imposter count updated to ${imposterCount}`);
  });
  
  // Event: startGame
  socket.on('startGame', ({ code, imposterCount }) => {
    const lobby = lobbies[code];
    
    // Validate lobby exists
    if (!lobby) {
      socket.emit('error', { message: 'Lobby not found' });
      return;
    }
    
    // Validate caller is the host
    if (lobby.hostSocketId !== socket.id) {
      socket.emit('error', { message: 'Only the host can start the game' });
      console.log(`Start game failed: ${socket.id} is not the host of lobby ${code}`);
      return;
    }
    
    // Validate lobby is in waiting status
    if (lobby.status !== 'waiting') {
      socket.emit('error', { message: 'Game already started or finished' });
      return;
    }
    
    // Validate imposter count
    const playerCount = lobby.players.length;
    if (!imposterCount || imposterCount < 1 || imposterCount > 3) {
      socket.emit('error', { message: 'Imposter count must be between 1 and 3' });
      return;
    }
    if (imposterCount >= playerCount) {
      socket.emit('error', { message: 'Imposter count must be less than player count' });
      return;
    }
    
    // Select a random footballer for this game
    const footballer = getRandomFootballer();
    lobby.footballer = footballer;
    
    console.log(`Starting game in lobby ${code} with ${playerCount} players and ${imposterCount} imposter(s)`);
    console.log(`Selected footballer: ${footballer}`);
    
    // Randomly assign roles using Fisher-Yates shuffle (proper randomization)
    const shuffledPlayers = shuffleArray(lobby.players);
    
    for (let i = 0; i < shuffledPlayers.length; i++) {
      const player = shuffledPlayers[i];
      player.role = i < imposterCount ? 'imposter' : 'crewmate';
      player.isAlive = true;
      
      // Send private role assignment to each player
      // Crewmates get the footballer name, imposters do not
      io.to(player.socketId).emit('roleAssigned', {
        role: player.role,
        lobbyCode: code,
        footballer: player.role === 'crewmate' ? footballer : null
      });
      
      console.log(`Role assigned: ${player.name} is ${player.role}`);
    }
    
    // Update lobby status
    lobby.status = 'in_progress';
    
    // Store initial counts at game start - these will NOT change even if players disconnect
    // This prevents revealing roles when someone leaves
    lobby.initialImposterCount = imposterCount;
    lobby.initialCrewCount = playerCount - imposterCount;
    
    // Update activity timestamp
    updateLobbyActivity(lobby);
    
    // Send public lobby update (without exposing roles)
    io.to(code).emit('lobbyUpdate', getLobbyData(lobby, true));
    
    console.log(`Game started in lobby ${code}`);
  });
  
  // Event: newRound
  socket.on('newRound', ({ code }) => {
    const lobby = lobbies[code];
    
    // Validate lobby exists
    if (!lobby) {
      socket.emit('error', { message: 'Lobby not found' });
      return;
    }
    
    // Validate caller is the host
    if (lobby.hostSocketId !== socket.id) {
      socket.emit('error', { message: 'Only the host can start a new round' });
      console.log(`New round failed: ${socket.id} is not the host of lobby ${code}`);
      return;
    }
    
    console.log(`New round started in lobby ${code}`);
    
    // Reset lobby to waiting state
    lobby.status = 'waiting';
    lobby.footballer = null;
    
    // Reset frozen counts (they'll be set again when next game starts)
    lobby.initialImposterCount = 0;
    lobby.initialCrewCount = 0;
    
    // Reset all players' roles but keep them in the lobby
    lobby.players.forEach(player => {
      player.role = null;
      player.isAlive = true;
    });
    
    // Update activity timestamp
    updateLobbyActivity(lobby);
    
    // Notify all players to return to lobby
    io.to(code).emit('lobbyUpdate', getLobbyData(lobby, false));
    
    console.log(`Lobby ${code} reset for new round`);
  });
  
  // ============================================
  // GUESS WHO GAME EVENTS
  // ============================================
  
  // Guess Who: Create Lobby
  socket.on('guessWho:createLobby', ({ name }) => {
    if (socketToLobby.has(socket.id)) {
      socket.emit('guessWho:error', { message: 'You are already in a lobby.' });
      return;
    }

    const code = generateLobbyCode();
    const lobby = {
      code,
      gameType: 'guessWho',
      phase: 'waiting', // 'waiting', 'selecting', 'playing'
      hostSocketId: socket.id,
      sharedPlayerList: null, // Will be set when game starts
      lastActivity: Date.now(),
      players: [
        {
          socketId: socket.id,
          name,
          isHost: true,
          playerLayout: null, // Randomized layout per player
          secretPlayer: null,
          hasSelected: false
        }
      ]
    };

    lobbies[code] = lobby;
    socket.join(code);
    socketToLobby.set(socket.id, code);

    console.log(`Guess Who lobby created: ${code} by ${name}`);
    socket.emit('guessWho:lobbyUpdate', {
      code: lobby.code,
      phase: lobby.phase,
      hostSocketId: lobby.hostSocketId,
      players: lobby.players.map(p => ({
        socketId: p.socketId,
        name: p.name,
        isHost: p.isHost,
        hasSelected: p.hasSelected
      }))
    });
  });

  // Guess Who: Join Lobby
  socket.on('guessWho:joinLobby', ({ code, name }) => {
    if (socketToLobby.has(socket.id)) {
      socket.emit('guessWho:joinError', { message: 'You are already in a lobby.' });
      return;
    }

    const lobby = lobbies[code];
    if (!lobby || lobby.gameType !== 'guessWho') {
      socket.emit('guessWho:joinError', { message: 'Lobby not found' });
      return;
    }

    if (lobby.phase !== 'waiting') {
      socket.emit('guessWho:joinError', { message: 'Game already in progress' });
      return;
    }

    if (lobby.players.length >= 2) {
      socket.emit('guessWho:joinError', { message: 'Lobby is full (max 2 players)' });
      return;
    }

    lobby.players.push({
      socketId: socket.id,
      name,
      isHost: false,
      playerLayout: null,
      secretPlayer: null,
      hasSelected: false
    });

    socket.join(code);
    socketToLobby.set(socket.id, code);
    updateLobbyActivity(lobby);

    console.log(`${name} joined Guess Who lobby ${code}`);
    io.to(code).emit('guessWho:lobbyUpdate', {
      code: lobby.code,
      phase: lobby.phase,
      hostSocketId: lobby.hostSocketId,
      players: lobby.players.map(p => ({
        socketId: p.socketId,
        name: p.name,
        isHost: p.isHost,
        hasSelected: p.hasSelected
      }))
    });
  });

  // Guess Who: Rejoin Lobby
  socket.on('guessWho:rejoinLobby', ({ code, name }) => {
    const lobby = lobbies[code];
    if (!lobby || lobby.gameType !== 'guessWho') {
      return;
    }

    const player = lobby.players.find(p => p.name === name);
    if (player) {
      player.socketId = socket.id;
      socket.join(code);
      socketToLobby.set(socket.id, code);
      updateLobbyActivity(lobby);

      socket.emit('guessWho:lobbyUpdate', {
        code: lobby.code,
        phase: lobby.phase,
        hostSocketId: lobby.hostSocketId,
        players: lobby.players.map(p => ({
          socketId: p.socketId,
          name: p.name,
          isHost: p.isHost,
          hasSelected: p.hasSelected
        }))
      });

      // If game started, resend player's layout and phase
      if (lobby.phase !== 'waiting' && player.playerLayout) {
        socket.emit('guessWho:gameStarted', {
          sharedPlayerList: lobby.sharedPlayerList,
          myPlayerLayout: player.playerLayout
        });
      }
    }
  });

  // Guess Who: Start Game
  socket.on('guessWho:startGame', ({ code }) => {
    const lobby = lobbies[code];
    if (!lobby || lobby.gameType !== 'guessWho') {
      socket.emit('guessWho:error', { message: 'Lobby not found' });
      return;
    }

    if (lobby.hostSocketId !== socket.id) {
      socket.emit('guessWho:error', { message: 'Only host can start game' });
      return;
    }

    if (lobby.players.length !== 2) {
      socket.emit('guessWho:error', { message: 'Need exactly 2 players' });
      return;
    }

    // Select 24 random players for the game (same for both players)
    const allPlayers = shuffleArray(FOOTBALL_PLAYERS);
    const selectedPlayers = allPlayers.slice(0, 24);
    lobby.sharedPlayerList = selectedPlayers;

    // Generate different randomized layouts for each player
    lobby.players.forEach(player => {
      player.playerLayout = shuffleArray([...selectedPlayers]);
    });

    lobby.phase = 'selecting';
    updateLobbyActivity(lobby);

    console.log(`Guess Who game started in lobby ${code}`);

    // Send each player their own randomized layout
    lobby.players.forEach(player => {
      io.to(player.socketId).emit('guessWho:gameStarted', {
        sharedPlayerList: lobby.sharedPlayerList,
        myPlayerLayout: player.playerLayout
      });
    });

    // Update lobby state
    io.to(code).emit('guessWho:lobbyUpdate', {
      code: lobby.code,
      phase: lobby.phase,
      hostSocketId: lobby.hostSocketId,
      players: lobby.players.map(p => ({
        socketId: p.socketId,
        name: p.name,
        isHost: p.isHost,
        hasSelected: p.hasSelected
      }))
    });
  });

  // Guess Who: Select Secret Player
  socket.on('guessWho:selectPlayer', ({ code, playerName }) => {
    const lobby = lobbies[code];
    if (!lobby || lobby.gameType !== 'guessWho') {
      return;
    }

    const player = lobby.players.find(p => p.socketId === socket.id);
    if (!player) {
      return;
    }

    player.secretPlayer = playerName;
    player.hasSelected = true;
    updateLobbyActivity(lobby);

    console.log(`${player.name} selected secret player: ${playerName}`);

    // Check if both players have selected
    const allSelected = lobby.players.every(p => p.hasSelected);
    
    if (allSelected) {
      lobby.phase = 'playing';
      io.to(code).emit('guessWho:playerSelected', { 
        message: 'Both players ready!'
      });
      
      console.log(`Guess Who lobby ${code} - both players ready, game starting`);
    } else {
      // Notify the other player that opponent is ready
      const otherPlayer = lobby.players.find(p => p.socketId !== socket.id);
      if (otherPlayer) {
        io.to(otherPlayer.socketId).emit('guessWho:opponentReady', {
          message: `${player.name} has selected their player`
        });
      }
    }

    // Update lobby state
    io.to(code).emit('guessWho:lobbyUpdate', {
      code: lobby.code,
      phase: lobby.phase,
      hostSocketId: lobby.hostSocketId,
      players: lobby.players.map(p => ({
        socketId: p.socketId,
        name: p.name,
        isHost: p.isHost,
        hasSelected: p.hasSelected
      }))
    });
  });

  // Guess Who: Start New Round
  socket.on('guessWho:newRound', ({ code }) => {
    const lobby = lobbies[code];
    if (!lobby || lobby.gameType !== 'guessWho') {
      socket.emit('guessWho:error', { message: 'Lobby not found' });
      return;
    }

    // Only host can start a new round
    if (socket.id !== lobby.hostSocketId) {
      socket.emit('guessWho:error', { message: 'Only the host can start a new round' });
      return;
    }

    console.log(`New round started in Guess Who lobby ${code}`);

    // Reset player states
    lobby.players.forEach(player => {
      player.secretPlayer = null;
      player.hasSelected = false;
    });

    // Select new random players for the game
    const allPlayers = shuffleArray(FOOTBALL_PLAYERS);
    const selectedPlayers = allPlayers.slice(0, 24);
    lobby.sharedPlayerList = selectedPlayers;

    // Generate different randomized layouts for each player
    lobby.players.forEach(player => {
      player.playerLayout = shuffleArray([...selectedPlayers]);
    });

    // Reset phase to selecting
    lobby.phase = 'selecting';
    updateLobbyActivity(lobby);

    // Send each player their new randomized layout
    lobby.players.forEach(player => {
      io.to(player.socketId).emit('guessWho:newRoundStarted', {
        sharedPlayerList: lobby.sharedPlayerList,
        myPlayerLayout: player.playerLayout
      });
    });

    // Update lobby state
    io.to(code).emit('guessWho:lobbyUpdate', {
      code: lobby.code,
      phase: lobby.phase,
      hostSocketId: lobby.hostSocketId,
      players: lobby.players.map(p => ({
        socketId: p.socketId,
        name: p.name,
        isHost: p.isHost,
        hasSelected: p.hasSelected
      }))
    });
  });

  // Guess Who: Leave Lobby
  socket.on('guessWho:leaveLobby', ({ code }) => {
    const lobby = lobbies[code];
    if (!lobby || lobby.gameType !== 'guessWho') {
      return;
    }

    // Check if game is in progress (selecting or playing phase)
    const gameInProgress = lobby.phase === 'selecting' || lobby.phase === 'playing';
    
    if (gameInProgress) {
      // Game is active - end it for everyone
      const remainingPlayers = lobby.players.filter(p => p.socketId !== socket.id);
      
      // Notify remaining players that the game is ending
      remainingPlayers.forEach(player => {
        io.to(player.socketId).emit('guessWho:gameEnded', {
          reason: 'opponent_left',
          message: 'Your opponent has left the game.'
        });
      });

      // Remove the leaving player and delete the lobby
      removePlayerFromLobby(socket.id);
      delete lobbies[code];
      console.log(`Guess Who lobby ${code} - player left during game, ending for all players`);
    } else {
      // Still in waiting phase - just remove the player, keep lobby open
      const result = removePlayerFromLobby(socket.id);
      if (result && result.lobby) {
        io.to(code).emit('guessWho:lobbyUpdate', {
          code: result.lobby.code,
          phase: result.lobby.phase,
          hostSocketId: result.lobby.hostSocketId,
          players: result.lobby.players.map(p => ({
            socketId: p.socketId,
            name: p.name,
            isHost: p.isHost,
            hasSelected: p.hasSelected
          }))
        });

        if (result.newHostName) {
          io.to(code).emit('guessWho:hostChanged', {
            newHostName: result.newHostName
          });
        }
        
        console.log(`Guess Who lobby ${code} - player left during waiting, lobby remains open`);
      }
    }
  });

  // Event: disconnect
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    
    // Clean up rate limit tracking for this socket
    lobbyCreationAttempts.delete(socket.id);
    
    // Check if player was in a Guess Who lobby before removing
    const lobbyCode = socketToLobby.get(socket.id);
    const wasInGuessWhoLobby = lobbyCode && lobbies[lobbyCode] && lobbies[lobbyCode].gameType === 'guessWho';
    const guessWhoLobby = wasInGuessWhoLobby ? lobbies[lobbyCode] : null;
    
    // Check if game was in progress (not just waiting)
    const gameInProgress = guessWhoLobby && (guessWhoLobby.phase === 'selecting' || guessWhoLobby.phase === 'playing');
    
    // Get remaining players before removal
    const remainingPlayers = guessWhoLobby ? guessWhoLobby.players.filter(p => p.socketId !== socket.id) : [];
    
    const result = removePlayerFromLobby(socket.id);
    
    // If lobby still exists, notify remaining players
    if (result) {
      const { lobby, newHostName } = result;
      
      // Determine game type and send appropriate updates
      if (lobby.gameType === 'guessWho') {
        if (gameInProgress) {
          // Game was active - end it for everyone
          console.log(`Guess Who lobby ${lobby.code} - player disconnected during game, ending for remaining players`);
          
          // Notify remaining players that the game is ending
          remainingPlayers.forEach(player => {
            io.to(player.socketId).emit('guessWho:gameEnded', {
              reason: 'opponent_disconnected',
              message: 'Your opponent has disconnected.'
            });
          });
          
          // Delete the lobby
          delete lobbies[lobby.code];
          console.log(`Guess Who lobby ${lobby.code} deleted due to player disconnect during game`);
        } else {
          // Still in waiting phase - keep lobby open
          console.log(`Guess Who lobby ${lobby.code} - player disconnected during waiting, lobby remains open`);
          
          io.to(lobby.code).emit('guessWho:lobbyUpdate', {
            code: lobby.code,
            phase: lobby.phase,
            hostSocketId: lobby.hostSocketId,
            players: lobby.players.map(p => ({
              socketId: p.socketId,
              name: p.name,
              isHost: p.isHost,
              hasSelected: p.hasSelected
            }))
          });

          if (newHostName) {
            io.to(lobby.code).emit('guessWho:hostChanged', {
              newHostName,
              message: `${newHostName} is now the host`
            });
          }
        }
      } else {
        // Football Imposter game
        io.to(lobby.code).emit('lobbyUpdate', getLobbyData(lobby, lobby.status === 'waiting'));
        
        if (newHostName) {
          io.to(lobby.code).emit('hostChanged', { 
            newHostName,
            message: `${newHostName} is now the host`
          });
        }
      }
    }
  });
});

// Basic health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Football Imposter Server',
    lobbies: Object.keys(lobbies).length
  });
});

// Detailed health endpoint for monitoring
app.get('/health', (req, res) => {
  const uptime = Date.now() - serverStartTime;
  const uptimeMinutes = Math.floor(uptime / 60000);
  const uptimeHours = Math.floor(uptimeMinutes / 60);
  
  res.json({
    status: 'healthy',
    uptime: {
      milliseconds: uptime,
      minutes: uptimeMinutes,
      hours: uptimeHours,
      human: uptimeHours > 0 
        ? `${uptimeHours}h ${uptimeMinutes % 60}m` 
        : `${uptimeMinutes}m`
    },
    timestamp: new Date().toISOString(),
    activeLobbies: Object.keys(lobbies).length,
    totalPlayers: FOOTBALL_PLAYERS.length,
    activeSockets: io.sockets.sockets.size
  });
});

// Ping endpoint (minimal response for cron jobs)
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO ready for connections`);
});
