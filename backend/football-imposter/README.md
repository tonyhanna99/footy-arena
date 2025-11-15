# Football Imposter - Online Multiplayer

## Testing the Online Multiplayer Feature

### Prerequisites
1. Make sure you have both the frontend and backend running

### Starting the Servers

#### Backend Server
```bash
cd backend/football-imposter
npm start
```
The server should start on `http://localhost:3000`

#### Frontend Server
```bash
# From the root directory
npm run dev
```
The frontend should start on `http://localhost:5173`

### Testing the Full Flow

1. **Open your browser** to `http://localhost:5173`

2. **Click "Football Imposter"** from the home screen

3. **Choose "Play with Friends Online"**

4. **Player 1 - Create a Lobby:**
   - Click "Create Lobby"
   - Enter your name (e.g., "Alice")
   - Click "Create Lobby"
   - You'll see a lobby code (e.g., "ABC12")
   - Copy this code to share with friends

5. **Player 2 - Join the Lobby:**
   - Open a new browser tab (or use a different device/browser)
   - Go to `http://localhost:5173`
   - Click "Football Imposter" → "Play with Friends Online"
   - Click "Join Lobby"
   - Enter the lobby code from Player 1
   - Enter your name (e.g., "Bob")
   - Click "Join Lobby"

6. **Add More Players (Optional):**
   - Repeat step 5 in additional tabs/browsers
   - All players will see the lobby update in real-time

7. **Start the Game:**
   - Player 1 (the host) clicks "Start Game"
   - All players receive their role (Imposter or Crewmate)
   - With 2-6 players: 1 imposter
   - With 7+ players: 2 imposters

8. **Test Disconnect Handling:**
   - Close a player's tab
   - Other players should see the lobby update
   - If the host disconnects, another player becomes host

### Backend Features Tested

- ✅ Lobby creation with unique codes
- ✅ Multiple players joining the same lobby
- ✅ Real-time lobby updates
- ✅ Host-only game start
- ✅ Role assignment (1-2 imposters based on player count)
- ✅ Private role reveal to each player
- ✅ Disconnect handling
- ✅ Host promotion when original host leaves

### Frontend Features Tested

- ✅ Mode selection (Local vs Online)
- ✅ Create/Join lobby UI
- ✅ Lobby waiting room with player list
- ✅ Lobby code display and copy
- ✅ Real-time lobby updates
- ✅ Role reveal screen
- ✅ Error handling for invalid lobby codes

## Environment Variables

The frontend uses the following environment variable:
- `VITE_SOCKET_URL` - The Socket.IO backend URL (default: `http://localhost:3000`)

For production, update this in your `.env` file or Vercel environment variables.

## Production Deployment Notes

### Backend (Socket.IO Server)
- Deploy the `backend/football-imposter` folder to a Node.js hosting service
- Update the CORS settings in `server.js` to only allow your Vercel domain
- Set the `PORT` environment variable

### Frontend (Vite/React)
- Update `VITE_SOCKET_URL` to point to your deployed backend URL
- Deploy to Vercel as normal

## Troubleshooting

**Can't connect to server?**
- Make sure the backend is running on port 3000
- Check browser console for connection errors
- Verify CORS settings in `backend/football-imposter/server.js`

**Lobby not updating?**
- Check the backend terminal for logs
- Verify Socket.IO connection in browser DevTools → Network → WS tab

**Role not assigned?**
- Make sure you have at least 2 players
- Only the host can start the game
- Check backend logs for role assignment messages
