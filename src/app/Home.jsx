import { Link } from 'react-router-dom';

const games = [
  {
    name: 'Football Imposter',
    path: '/games/football-imposter',
    description: 'A social deduction game where players try to identify the imposters who don\'t know the secret football player.',
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
            <Link to={game.path} className="btn btn-primary btn-large">
              Play Now
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;
