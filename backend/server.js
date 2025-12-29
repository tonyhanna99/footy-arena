const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

// Import Football Alphabet dependencies
const { FOOTBALL_CATEGORIES, AVAILABLE_LETTERS, GAME_SETTINGS } = require('./football-alphabet/categories');

// Import Football Imposter/Guess Who player data
const FOOTBALL_PLAYERS = require('./football-imposter/players.json');

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
  pingTimeout: 60000, // 60 seconds
  pingInterval: 120000, // 120 seconds
});

const PORT = process.env.PORT || 3000;

// Track server uptime
const serverStartTime = Date.now();

// ============================================
// SHARED LOBBY STORAGE
// All games use the same lobbies object
// ============================================
const lobbies = {};

// ============================================
// FOOTBALL ALPHABET SPECIFIC STATE
// ============================================
const alphabetUsedLetters = new Map(); // Track used letters per lobby

// Football Alphabet Configuration
const ROUND_DURATION = GAME_SETTINGS.ROUND_DURATION;
const POINTS_UNIQUE = GAME_SETTINGS.POINTS_UNIQUE;
const POINTS_DUPLICATE = GAME_SETTINGS.POINTS_DUPLICATE;
const POINTS_INVALID = GAME_SETTINGS.POINTS_INVALID;

// ============================================
// FOOTBALL IMPOSTER/GUESS WHO CONFIG
// ============================================
const LOBBY_INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const lobbyCreationAttempts = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_LOBBY_CREATIONS = 5;
const socketToLobby = new Map();

// ============================================
// FOOTBALL ALPHABET HELPER FUNCTIONS
// ============================================

function generateAlphabetLobbyCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code;
  do {
    code = Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (lobbies[code]);
  return code;
}

function getRandomLetter(lobbyCode) {
  const used = alphabetUsedLetters.get(lobbyCode) || [];
  const available = AVAILABLE_LETTERS.filter(letter => !used.includes(letter));
  
  if (available.length === 0) {
    alphabetUsedLetters.set(lobbyCode, []);
    return AVAILABLE_LETTERS[Math.floor(Math.random() * AVAILABLE_LETTERS.length)];
  }
  
  const letter = available[Math.floor(Math.random() * available.length)];
  alphabetUsedLetters.get(lobbyCode).push(letter);
  return letter;
}

function getRandomCategories(count) {
  const maxCount = Math.min(count, FOOTBALL_CATEGORIES.length);
  const shuffled = [...FOOTBALL_CATEGORIES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, maxCount);
}

function endAlphabetRound(lobbyCode) {
  const lobby = lobbies[lobbyCode];
  if (!lobby) return;
  
  lobby.gameState = 'revealing';
  lobby.manualScoresSubmitted = {};
  
  io.to(lobbyCode).emit('round-ended', {
    allAnswers: lobby.playerAnswers,
  });
  
  console.log(`Alphabet round ended in lobby: ${lobbyCode}`);
}

function leaveAlphabetLobby(socket, explicitLeave = false) {
  const lobbyCode = socket.lobbyCode;
  if (!lobbyCode) return;
  
  const lobby = lobbies[lobbyCode];
  if (!lobby || lobby.gameType !== 'alphabet') return;
  
  const playerToRemove = lobby.players.find(p => p.socketId === socket.id);
  if (!playerToRemove) return;
  
  lobby.players = lobby.players.filter(p => p.id !== socket.id);
  
  console.log(`Removing ${playerToRemove.name} from alphabet lobby ${lobbyCode}`);
  
  // Delete lobby if empty OR only 1 player left (can't play with 1 player)
  if (lobby.players.length === 0) {
    if (lobby.timer) clearInterval(lobby.timer);
    delete lobbies[lobbyCode];
    alphabetUsedLetters.delete(lobbyCode);
    console.log(`Alphabet lobby deleted: ${lobbyCode} (empty)`);
  } else if (lobby.players.length === 1) {
    // Notify the last remaining player and send them back to menu
    const lastPlayer = lobby.players[0];
    io.to(lastPlayer.socketId).emit('lobby-error', {
      message: 'The other player left. You need at least 2 players to continue.'
    });
    
    // Clean up and delete the lobby
    if (lobby.timer) clearInterval(lobby.timer);
    delete lobbies[lobbyCode];
    alphabetUsedLetters.delete(lobbyCode);
    console.log(`Alphabet lobby deleted: ${lobbyCode} (insufficient players)`);
  } else {
    if (lobby.host === socket.id) {
      lobby.host = lobby.players[0].id;
      io.to(lobbyCode).emit('player-left', {
        players: lobby.players,
        newHost: lobby.host,
      });
    } else {
      io.to(lobbyCode).emit('player-left', {
        players: lobby.players,
      });
    }
  }
  
  if (explicitLeave) {
    socket.leave(lobbyCode);
  }
}

// ============================================
// FOOTBALL IMPOSTER/GUESS WHO HELPERS
// ============================================

function generateLobbyCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return lobbies[code] ? generateLobbyCode() : code;
}

function getRandomFootballer() {
  return FOOTBALL_PLAYERS[Math.floor(Math.random() * FOOTBALL_PLAYERS.length)];
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getLobbyData(lobby, hideRoles = false) {
  const players = lobby.players || [];
  
  let imposterCount, crewCount;
  
  if (lobby.status === 'in_progress') {
    imposterCount = lobby.initialImposterCount || 0;
    crewCount = lobby.initialCrewCount || 0;
  } else {
    imposterCount = 0;
    crewCount = 0;
  }
  
  return {
    code: lobby.code,
    status: lobby.status,
    hostSocketId: lobby.hostSocketId,
    selectedImposterCount: lobby.selectedImposterCount || 1,
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

function updateLobbyActivity(lobby) {
  if (lobby) {
    lobby.lastActivity = Date.now();
  }
}

function removePlayerFromLobby(socketId) {
  for (const code in lobbies) {
    const lobby = lobbies[code];
    
    // Skip alphabet lobbies (handled separately)
    if (lobby.gameType === 'alphabet') continue;
    
    const playerIndex = lobby.players.findIndex(p => p.socketId === socketId);
    
    if (playerIndex !== -1) {
      lobby.players.splice(playerIndex, 1);
      console.log(`Player ${socketId} removed from lobby ${code}`);
      
      socketToLobby.delete(socketId);
      
      if (lobby.players.length === 0) {
        console.log(`Lobby ${code} is now empty but will persist for inactivity timeout`);
        updateLobbyActivity(lobby);
        return null;
      }
      
      if (lobby.hostSocketId === socketId) {
        lobby.players.forEach(p => p.isHost = false);
        const newHost = lobby.players[0];
        lobby.hostSocketId = newHost.socketId;
        newHost.isHost = true;
        console.log(`New host for lobby ${code}: ${newHost.name}`);
        return { lobby, newHostName: newHost.name };
      }
      
      return { lobby, newHostName: null };
    }
  }
  return null;
}

// Cleanup inactive lobbies every 5 minutes
setInterval(() => {
  const now = Date.now();
  let deletedCount = 0;
  
  for (const code in lobbies) {
    const lobby = lobbies[code];
    
    // Skip alphabet lobbies (they have their own cleanup)
    if (lobby.gameType === 'alphabet') continue;
    
    const inactiveTime = now - lobby.lastActivity;
    
    if (inactiveTime > LOBBY_INACTIVITY_TIMEOUT) {
      delete lobbies[code];
      deletedCount++;
      console.log(`Lobby ${code} deleted due to inactivity`);
    }
  }
  
  if (deletedCount > 0) {
    console.log(`Cleanup: ${deletedCount} inactive lobbies deleted`);
  }
}, 5 * 60 * 1000);

// ============================================
// SOCKET.IO CONNECTION HANDLER
// ============================================

io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);
  
  // ============================================
  // FOOTBALL ALPHABET EVENTS
  // ============================================
  
  socket.on('create-lobby', ({ playerName }) => {
    const lobbyCode = generateAlphabetLobbyCode();
    const player = {
      id: socket.id,
      name: playerName,
      socketId: socket.id,
    };
    
    const lobby = {
      code: lobbyCode,
      gameType: 'alphabet',
      host: socket.id,
      players: [player],
      gameState: 'lobby',
      currentLetter: null,
      currentRound: 0,
      playerAnswers: {},
      manualScoresSubmitted: {},
      roundScores: [],
      totalScores: {},
      timer: null,
      categoriesPerRound: GAME_SETTINGS.DEFAULT_CATEGORIES_PER_ROUND,
      selectedCategories: null,
    };
    
    lobbies[lobbyCode] = lobby;
    alphabetUsedLetters.set(lobbyCode, []);
    socket.join(lobbyCode);
    socket.lobbyCode = lobbyCode;
    
    socket.emit('lobby-created', {
      lobbyCode,
      players: lobby.players,
    });
    
    console.log(`Alphabet lobby created: ${lobbyCode} by ${playerName}`);
  });
  
  socket.on('join-lobby', ({ lobbyCode, playerName }) => {
    const lobby = lobbies[lobbyCode];
    
    if (!lobby || lobby.gameType !== 'alphabet') {
      socket.emit('lobby-error', { message: 'Lobby not found. It may have ended or expired.' });
      return;
    }
    
    const existingPlayer = lobby.players.find(p => p.name === playerName);
    
    if (existingPlayer) {
      console.log(`${playerName} rejoining alphabet lobby: ${lobbyCode}`);
      existingPlayer.socketId = socket.id;
      existingPlayer.id = socket.id;
      
      socket.join(lobbyCode);
      socket.lobbyCode = lobbyCode;
      
      socket.emit('lobby-joined', {
        lobbyCode,
        players: lobby.players,
        isHost: socket.id === lobby.host,
      });
      
      if (lobby.gameState === 'playing') {
        socket.emit('game-started', {
          letter: lobby.currentLetter,
          categories: lobby.selectedCategories,
          duration: lobby.roundDuration,
        });
      } else if (lobby.gameState === 'revealing') {
        socket.emit('round-ended', {
          allAnswers: lobby.playerAnswers,
        });
      } else if (lobby.gameState === 'scores') {
        socket.emit('scores-updated', {
          roundScores: lobby.roundScores,
          totalScores: lobby.totalScores,
        });
      }
      
      socket.to(lobbyCode).emit('player-rejoined', {
        players: lobby.players,
        playerName: playerName,
      });
      
      return;
    }
    
    if (lobby.gameState !== 'lobby') {
      socket.emit('lobby-error', { 
        message: 'Game already in progress. Please create or join a new game.' 
      });
      return;
    }
    
    const player = {
      id: socket.id,
      name: playerName,
      socketId: socket.id,
    };
    
    lobby.players.push(player);
    socket.join(lobbyCode);
    socket.lobbyCode = lobbyCode;
    
    socket.emit('lobby-joined', {
      lobbyCode,
      players: lobby.players,
      isHost: socket.id === lobby.host,
    });
    
    socket.to(lobbyCode).emit('player-joined', {
      players: lobby.players,
    });
    
    console.log(`${playerName} joined alphabet lobby: ${lobbyCode}`);
  });
  
  socket.on('start-game', ({ duration = ROUND_DURATION, categoriesPerRound = GAME_SETTINGS.DEFAULT_CATEGORIES_PER_ROUND }) => {
    const lobby = lobbies[socket.lobbyCode];
    
    if (!lobby || lobby.gameType !== 'alphabet' || socket.id !== lobby.host) {
      return;
    }
    
    if (lobby.players.length < 2) {
      socket.emit('lobby-error', { message: 'Need at least 2 players' });
      return;
    }
    
    lobby.roundDuration = duration;
    lobby.categoriesPerRound = categoriesPerRound;
    lobby.gameState = 'playing';
    lobby.currentLetter = getRandomLetter(socket.lobbyCode);
    lobby.currentRound = 1;
    lobby.playerAnswers = {};
    lobby.manualScoresSubmitted = {};
    
    // Generate categories once at the start - they'll stay the same for all rounds
    if (!lobby.selectedCategories) {
      lobby.selectedCategories = getRandomCategories(lobby.categoriesPerRound);
    }
    
    io.to(socket.lobbyCode).emit('game-started', {
      letter: lobby.currentLetter,
      categories: lobby.selectedCategories,
      duration: lobby.roundDuration,
    });
    
    let timeRemaining = lobby.roundDuration;
    lobby.timer = setInterval(() => {
      timeRemaining--;
      
      io.to(socket.lobbyCode).emit('timer-update', {
        timeRemaining,
      });
      
      if (timeRemaining <= 0) {
        clearInterval(lobby.timer);
        endAlphabetRound(socket.lobbyCode);
      }
    }, 1000);
    
    console.log(`Alphabet game started in lobby: ${socket.lobbyCode}`);
  });
  
  socket.on('submit-answers', (answers) => {
    const lobby = lobbies[socket.lobbyCode];
    if (!lobby || lobby.gameType !== 'alphabet') return;
    
    lobby.playerAnswers[socket.id] = answers;
    console.log(`${socket.id} submitted alphabet answers`);
  });

  socket.on('submit-manual-scores', (scores) => {
    const lobby = lobbies[socket.lobbyCode];
    if (!lobby || lobby.gameType !== 'alphabet' || lobby.gameState !== 'revealing') return;
    
    lobby.manualScoresSubmitted[socket.id] = scores;
    
    io.to(socket.lobbyCode).emit('manual-scores-submitted', {
      playerId: socket.id,
      submitted: true,
    });
    
    const allSubmitted = lobby.players.every(player => 
      lobby.manualScoresSubmitted[player.id] !== undefined
    );
    
    if (allSubmitted) {
      const roundScores = {};
      lobby.players.forEach(player => {
        const playerScores = lobby.manualScoresSubmitted[player.id];
        roundScores[player.id] = Object.values(playerScores).reduce((sum, score) => sum + score, 0);
      });
      
      lobby.players.forEach(player => {
        if (!lobby.totalScores[player.id]) {
          lobby.totalScores[player.id] = 0;
        }
        lobby.totalScores[player.id] += roundScores[player.id];
      });
      
      lobby.roundScores.push({
        letter: lobby.currentLetter,
        scores: roundScores,
      });
      
      lobby.gameState = 'scores';
      
      io.to(socket.lobbyCode).emit('scores-updated', {
        roundScores: lobby.roundScores,
        totalScores: lobby.totalScores,
      });
    }
  });
  
  socket.on('next-round', () => {
    const lobby = lobbies[socket.lobbyCode];
    if (!lobby || lobby.gameType !== 'alphabet' || socket.id !== lobby.host) {
      return;
    }
    
    lobby.gameState = 'playing';
    lobby.currentLetter = getRandomLetter(socket.lobbyCode);
    lobby.currentRound++;
    lobby.playerAnswers = {};
    lobby.manualScoresSubmitted = {};
    // Keep using the same categories from the first round
    
    const roundDuration = lobby.roundDuration || ROUND_DURATION;
    
    io.to(socket.lobbyCode).emit('next-round-started', {
      letter: lobby.currentLetter,
      categories: lobby.selectedCategories,
      duration: roundDuration,
    });
    
    let timeRemaining = roundDuration;
    lobby.timer = setInterval(() => {
      timeRemaining--;
      
      io.to(socket.lobbyCode).emit('timer-update', {
        timeRemaining,
      });
      
      if (timeRemaining <= 0) {
        clearInterval(lobby.timer);
        endAlphabetRound(socket.lobbyCode);
      }
    }, 1000);
    
    console.log(`Next alphabet round started: ${socket.lobbyCode}`);
  });
  
  socket.on('leave-lobby', () => {
    const lobby = lobbies[socket.lobbyCode];
    if (lobby && lobby.gameType === 'alphabet') {
      // Mark this socket as explicitly leaving (no grace period)
      socket.explicitLeave = true;
      leaveAlphabetLobby(socket, true);
    }
  });

  // Handle intentional disconnects (tab close)
  socket.on('disconnecting', () => {
    // If beforeunload set the explicitLeave flag, maintain it
    if (socket.explicitLeave) {
      console.log(`Socket ${socket.id} disconnecting with explicit leave flag`);
    }
  });
  
  // ============================================
  // FOOTBALL IMPOSTER EVENTS
  // ============================================
  
  socket.on('createLobby', ({ name }) => {
    if (socketToLobby.has(socket.id)) {
      socket.emit('error', { message: 'You are already in a lobby. Please leave it first.' });
      return;
    }
    
    const now = Date.now();
    const attempts = lobbyCreationAttempts.get(socket.id) || [];
    const recentAttempts = attempts.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
    
    if (recentAttempts.length >= MAX_LOBBY_CREATIONS) {
      socket.emit('error', { message: 'Too many lobby creation attempts. Please wait a moment.' });
      return;
    }
    
    recentAttempts.push(now);
    lobbyCreationAttempts.set(socket.id, recentAttempts);
    
    const code = generateLobbyCode();
    
    const lobby = {
      code,
      gameType: 'imposter',
      status: 'waiting',
      hostSocketId: socket.id,
      footballer: null,
      selectedImposterCount: 1,
      initialImposterCount: 0,
      initialCrewCount: 0,
      lastActivity: Date.now(),
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
    socketToLobby.set(socket.id, code);
    
    console.log(`Imposter lobby created: ${code} by ${name}`);
    socket.emit('lobbyUpdate', getLobbyData(lobby));
  });
  
  socket.on('rejoinLobby', ({ code, name }) => {
    const lobby = lobbies[code];
    
    if (!lobby || lobby.gameType !== 'imposter') {
      return;
    }
    
    const player = lobby.players.find(p => p.name === name);
    
    if (player) {
      const oldSocketId = player.socketId;
      player.socketId = socket.id;
      
      socket.join(code);
      socketToLobby.set(socket.id, code);
      
      console.log(`Player ${name} rejoined imposter lobby ${code}`);
      updateLobbyActivity(lobby);
      
      socket.emit('lobbyUpdate', getLobbyData(lobby, lobby.status === 'waiting'));
      
      if (lobby.status === 'in_progress' && player.role) {
        socket.emit('roleAssigned', {
          role: player.role,
          footballer: player.role === 'crew' ? lobby.footballer : null
        });
      }
      
      socket.to(code).emit('lobbyUpdate', getLobbyData(lobby, lobby.status === 'waiting'));
    } else {
      socket.emit('joinError', { message: 'Player not found in lobby. Please join again.' });
    }
  });
  
  socket.on('joinLobby', ({ code, name }) => {
    if (socketToLobby.has(socket.id)) {
      socket.emit('joinError', { message: 'You are already in a lobby. Please leave it first.' });
      return;
    }
    
    const lobby = lobbies[code];
    
    if (!lobby || lobby.gameType !== 'imposter') {
      socket.emit('joinError', { message: 'Lobby not found' });
      return;
    }
    
    if (lobby.status !== 'waiting') {
      socket.emit('joinError', { message: 'Game already in progress or finished' });
      return;
    }
    
    lobby.players.push({
      socketId: socket.id,
      name,
      isHost: false,
      role: null,
      isAlive: true
    });
    
    socket.join(code);
    socketToLobby.set(socket.id, code);
    
    console.log(`Player ${name} joined imposter lobby ${code}`);
    updateLobbyActivity(lobby);
    
    io.to(code).emit('lobbyUpdate', getLobbyData(lobby));
  });
  
  socket.on('updateImposterCount', ({ code, imposterCount }) => {
    const lobby = lobbies[code];
    
    if (!lobby || lobby.gameType !== 'imposter') {
      return;
    }
    
    if (lobby.hostSocketId !== socket.id) {
      return;
    }
    
    lobby.selectedImposterCount = imposterCount;
    io.to(code).emit('lobbyUpdate', getLobbyData(lobby));
    
    console.log(`Lobby ${code} imposter count updated to ${imposterCount}`);
  });
  
  socket.on('startGame', ({ code, imposterCount }) => {
    const lobby = lobbies[code];
    
    if (!lobby || lobby.gameType !== 'imposter') {
      socket.emit('error', { message: 'Lobby not found' });
      return;
    }
    
    if (lobby.hostSocketId !== socket.id) {
      socket.emit('error', { message: 'Only the host can start the game' });
      return;
    }
    
    if (lobby.status !== 'waiting') {
      socket.emit('error', { message: 'Game already started or finished' });
      return;
    }
    
    const playerCount = lobby.players.length;
    if (!imposterCount || imposterCount < 1 || imposterCount > 3) {
      socket.emit('error', { message: 'Imposter count must be between 1 and 3' });
      return;
    }
    if (imposterCount >= playerCount) {
      socket.emit('error', { message: 'Imposter count must be less than player count' });
      return;
    }
    
    const footballerObj = getRandomFootballer();
    const footballer = footballerObj.name;
    lobby.footballer = footballer;
    
    console.log(`Starting imposter game in ${code} with ${imposterCount} imposter(s)`);
    console.log(`Selected footballer: ${footballer}`);
    
    const shuffledPlayers = shuffleArray(lobby.players);
    
    for (let i = 0; i < shuffledPlayers.length; i++) {
      const player = shuffledPlayers[i];
      player.role = i < imposterCount ? 'imposter' : 'crewmate';
      player.isAlive = true;
      
      io.to(player.socketId).emit('roleAssigned', {
        role: player.role,
        lobbyCode: code,
        footballer: player.role === 'crewmate' ? footballer : null
      });
    }
    
    lobby.status = 'in_progress';
    lobby.initialImposterCount = imposterCount;
    lobby.initialCrewCount = playerCount - imposterCount;
    
    updateLobbyActivity(lobby);
    io.to(code).emit('lobbyUpdate', getLobbyData(lobby, true));
    
    console.log(`Imposter game started in ${code}`);
  });
  
  socket.on('newRound', ({ code }) => {
    const lobby = lobbies[code];
    
    if (!lobby || lobby.gameType !== 'imposter') {
      socket.emit('error', { message: 'Lobby not found' });
      return;
    }
    
    if (lobby.hostSocketId !== socket.id) {
      socket.emit('error', { message: 'Only the host can start a new round' });
      return;
    }
    
    console.log(`New imposter round started in ${code}`);
    
    lobby.status = 'waiting';
    lobby.footballer = null;
    lobby.initialImposterCount = 0;
    lobby.initialCrewCount = 0;
    
    lobby.players.forEach(player => {
      player.role = null;
      player.isAlive = true;
    });
    
    updateLobbyActivity(lobby);
    io.to(code).emit('lobbyUpdate', getLobbyData(lobby, false));
    
    console.log(`Imposter lobby ${code} reset for new round`);
  });
  
  // ============================================
  // GUESS WHO EVENTS
  // ============================================
  
  socket.on('guessWho:createLobby', ({ name }) => {
    if (socketToLobby.has(socket.id)) {
      socket.emit('guessWho:error', { message: 'You are already in a lobby.' });
      return;
    }

    const code = generateLobbyCode();
    const lobby = {
      code,
      gameType: 'guessWho',
      phase: 'waiting',
      hostSocketId: socket.id,
      sharedPlayerList: null,
      lastActivity: Date.now(),
      players: [
        {
          socketId: socket.id,
          name,
          isHost: true,
          playerLayout: null,
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

      if (lobby.phase !== 'waiting' && player.playerLayout) {
        socket.emit('guessWho:gameStarted', {
          sharedPlayerList: lobby.sharedPlayerList,
          myPlayerLayout: player.playerLayout
        });
      }
    }
  });

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

    const allPlayers = shuffleArray(FOOTBALL_PLAYERS);
    const selectedPlayers = allPlayers.slice(0, 24);
    lobby.sharedPlayerList = selectedPlayers;

    lobby.players.forEach(player => {
      player.playerLayout = shuffleArray([...selectedPlayers]);
    });

    lobby.phase = 'selecting';
    updateLobbyActivity(lobby);

    console.log(`Guess Who game started in ${code}`);

    lobby.players.forEach(player => {
      io.to(player.socketId).emit('guessWho:gameStarted', {
        sharedPlayerList: lobby.sharedPlayerList,
        myPlayerLayout: player.playerLayout
      });
    });

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

    const allSelected = lobby.players.every(p => p.hasSelected);
    
    if (allSelected) {
      lobby.phase = 'playing';
      io.to(code).emit('guessWho:playerSelected', { 
        message: 'Both players ready!'
      });
    } else {
      const otherPlayer = lobby.players.find(p => p.socketId !== socket.id);
      if (otherPlayer) {
        io.to(otherPlayer.socketId).emit('guessWho:opponentReady', {
          message: `${player.name} has selected their player`
        });
      }
    }

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

  socket.on('guessWho:newRound', ({ code }) => {
    const lobby = lobbies[code];
    if (!lobby || lobby.gameType !== 'guessWho') {
      socket.emit('guessWho:error', { message: 'Lobby not found' });
      return;
    }

    if (socket.id !== lobby.hostSocketId) {
      socket.emit('guessWho:error', { message: 'Only the host can start a new round' });
      return;
    }

    console.log(`New round started in Guess Who lobby ${code}`);

    lobby.players.forEach(player => {
      player.secretPlayer = null;
      player.hasSelected = false;
    });

    const allPlayers = shuffleArray(FOOTBALL_PLAYERS);
    const selectedPlayers = allPlayers.slice(0, 24);
    lobby.sharedPlayerList = selectedPlayers;

    lobby.players.forEach(player => {
      player.playerLayout = shuffleArray([...selectedPlayers]);
    });

    lobby.phase = 'selecting';
    updateLobbyActivity(lobby);

    lobby.players.forEach(player => {
      io.to(player.socketId).emit('guessWho:newRoundStarted', {
        sharedPlayerList: lobby.sharedPlayerList,
        myPlayerLayout: player.playerLayout
      });
    });

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

  socket.on('guessWho:leaveLobby', ({ code }) => {
    const lobby = lobbies[code];
    if (!lobby || lobby.gameType !== 'guessWho') {
      return;
    }

    const gameInProgress = lobby.phase === 'selecting' || lobby.phase === 'playing';
    
    if (gameInProgress) {
      const remainingPlayers = lobby.players.filter(p => p.socketId !== socket.id);
      
      remainingPlayers.forEach(player => {
        io.to(player.socketId).emit('guessWho:gameEnded', {
          reason: 'opponent_left',
          message: 'Your opponent has left the game.'
        });
      });

      removePlayerFromLobby(socket.id);
      delete lobbies[code];
      console.log(`Guess Who lobby ${code} ended - player left during game`);
    } else {
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
      }
    }
  });

  // ============================================
  // DISCONNECT HANDLER (ALL GAMES)
  // ============================================
  
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    
    lobbyCreationAttempts.delete(socket.id);
    
    // Check for Alphabet lobby first
    if (socket.lobbyCode) {
      const lobby = lobbies[socket.lobbyCode];
      if (lobby && lobby.gameType === 'alphabet') {
        const playerToRemove = lobby.players.find(p => p.socketId === socket.id);
        if (playerToRemove) {
          // If this was an explicit leave (tab close), remove immediately
          if (socket.explicitLeave) {
            console.log(`Player ${playerToRemove.name} explicitly left - removing immediately`);
            leaveAlphabetLobby(socket, false);
          } else {
            // Network disconnect - give grace period for reconnection
            setTimeout(() => {
              const currentLobby = lobbies[socket.lobbyCode];
              if (currentLobby) {
                const currentPlayer = currentLobby.players.find(p => p.name === playerToRemove.name);
                if (currentPlayer && currentPlayer.socketId === socket.id) {
                  console.log(`Grace period expired for ${playerToRemove.name} - removing from lobby`);
                  leaveAlphabetLobby(socket, false);
                }
              }
            }, 180000); // 3 minute grace period for accidental disconnects
          }
        }
        return;
      }
    }
    
    // Check for Guess Who or Imposter lobby
    const lobbyCode = socketToLobby.get(socket.id);
    const wasInGuessWhoLobby = lobbyCode && lobbies[lobbyCode] && lobbies[lobbyCode].gameType === 'guessWho';
    const guessWhoLobby = wasInGuessWhoLobby ? lobbies[lobbyCode] : null;
    
    const gameInProgress = guessWhoLobby && (guessWhoLobby.phase === 'selecting' || guessWhoLobby.phase === 'playing');
    const remainingPlayers = guessWhoLobby ? guessWhoLobby.players.filter(p => p.socketId !== socket.id) : [];
    
    const result = removePlayerFromLobby(socket.id);
    
    if (result) {
      const { lobby, newHostName } = result;
      
      if (lobby.gameType === 'guessWho') {
        if (gameInProgress) {
          console.log(`Guess Who lobby ${lobby.code} - player disconnected during game`);
          
          remainingPlayers.forEach(player => {
            io.to(player.socketId).emit('guessWho:gameEnded', {
              reason: 'opponent_disconnected',
              message: 'Your opponent has disconnected.'
            });
          });
          
          delete lobbies[lobby.code];
          console.log(`Guess Who lobby ${lobby.code} deleted`);
        } else {
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
      } else if (lobby.gameType === 'imposter') {
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

// ============================================
// HTTP ENDPOINTS
// ============================================

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Footy Arena Unified Server - All Games',
    games: ['Football Alphabet', 'Football Imposter', 'Football Guess Who'],
    lobbies: Object.keys(lobbies).length
  });
});

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

app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Footy Arena Unified Server running on port ${PORT}`);
  console.log(`📡 Socket.IO ready for all games:`);
  console.log(`   - Football Alphabet`);
  console.log(`   - Football Imposter`);
  console.log(`   - Football Guess Who`);
});
