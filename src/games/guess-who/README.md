# Football Guess Who?

A 2-player online game based on the classic Guess Who board game, featuring football players.

## Game Flow

1. **Mode Selection**: Players choose to play online
2. **Lobby**: Create or join a lobby with a friend (exactly 2 players required)
3. **Secret Player Selection**: Each player selects their secret footballer from a randomized board
4. **Gameplay**: Players flip cards up/down to narrow down possibilities

## Features

- **Shared Player List**: Both players see the same 24 footballers on their board
- **Randomized Layout**: Each player's board has a different arrangement
- **Flip Card Interaction**: Click cards to flip them up or down (like physical Guess Who)
- **3D Flip Animation**: Cards flip with a realistic 3D rotation effect
- **Secret Player Display**: Your chosen player is pinned at the top for reference

## Technical Details

### Frontend Components
- `Game.jsx` - Main game orchestrator
- `ModeSelection.jsx` - Initial game mode selection
- `OnlineModeSelection.jsx` - Create/join lobby interface
- `LobbyWaitingRoom.jsx` - Wait for both players to join
- `SecretPlayerSelection.jsx` - Choose secret player phase
- `GameBoard.jsx` - Main gameplay with flip cards

### Hooks
- `useSocket.js` - WebSocket connection and game state sync
- `useGame.js` - Local game state (flipped cards, secret player)

### Backend
The backend extends the existing Football Imposter server (`backend/football-imposter/server.js`) with Guess Who specific events:
- `guessWho:createLobby`
- `guessWho:joinLobby`
- `guessWho:startGame`
- `guessWho:selectPlayer`
- `guessWho:leaveLobby`

## Game Rules

1. Each player selects a secret footballer
2. Players take turns asking yes/no questions about their opponent's player
3. Click cards to flip them down when they're eliminated
4. First player to correctly guess the opponent's secret player wins!

## Styling

The game features:
- Board-like appearance with card tray styling
- 3D flip animations using CSS transforms
- Responsive grid layout
- Color-coded secret player indicator
- Mobile-friendly design

## Future Enhancements

Possible improvements:
- Win condition detection
- Question/answer system
- Chat functionality
- Game statistics
- More player customization options
