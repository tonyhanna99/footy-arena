import { Link } from 'react-router-dom';
import { track } from '@vercel/analytics';

const games = [
  {
    name: 'Football Imposter',
    path: '/games/football-imposter',
    description: 'A social deduction game where players try to identify the imposters who don\'t know the secret football player.',
  },
  {
    name: 'Football Guess Who?',
    path: '/games/guess-who',
    description: 'Play the classic Guess Who board game with football players. Ask yes/no questions and flip cards to find your opponent\'s secret player!',
  },
  {
    name: 'Football Alphabet',
    path: '/games/football-alphabet',
    description: 'Test your football knowledge from A to Z! Race against time to fill categories with football terms starting with a random letter. Unique answers score more points!',
  },
];

function Home() {
  return (
    <div className="home-container">
      <div className="home-header">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <img src="/logo.png" alt="FootyArena" style={{ height: '20rem', width: 'auto' }} />
        </div>
        <p className="home-subtitle">Your ultimate pass-and-play party game hub</p>
      </div>

      <div className="games-grid">
        {games.map((game) => (
          <div key={game.path} className="game-card">
            <h3 className="game-card-title">{game.name}</h3>
            <p className="game-card-description">{game.description}</p>
            <Link to={game.path} className="btn btn-primary btn-large" onClick={() => track('game_opened', { game: game.name, source: 'home' })}>
              Play Now
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;
