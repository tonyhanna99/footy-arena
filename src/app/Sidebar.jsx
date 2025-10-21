import { NavLink, Link } from 'react-router-dom';
import { useState } from 'react';

const games = [
  {
    name: 'Football Imposter',
    path: '/games/football-imposter',
  },
];

function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`} style={{ position: 'relative' }}>
      {/* Toggle button positioned on the border */}
      <button 
        onClick={toggleSidebar}
        className="sidebar-toggle-border"
        aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        style={{
          position: 'absolute',
          top: '50%',
          right: '-15px',
          transform: 'translateY(-50%)',
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          backgroundColor: 'var(--accent)',
          color: 'white',
          border: '2px solid var(--border)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          fontWeight: 'bold',
          zIndex: 20,
          transition: 'all 0.2s ease'
        }}
      >
        {isExpanded ? '‹' : '›'}
      </button>

      <div className="sidebar-header">
        {isExpanded ? (
          <Link to="/" style={{ display: 'block', cursor: 'pointer' }}>
            <img src="/logo.png" alt="FootyArena" style={{ height: '13rem', width: 'auto' }} />
          </Link>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem 0' }}>
            <Link to="/" style={{ display: 'block', cursor: 'pointer' }}>
              <img src="/logo.png" alt="FootyArena" style={{ height: '5rem', width: 'auto' }} />
            </Link>
          </div>
        )}
      </div>
      
      <nav className="sidebar-nav">
        <ul>
          <li>
            <NavLink 
              to="/" 
              className={({ isActive }) => isActive ? 'active' : ''}
              title="Home"
            >
              {isExpanded ? (
                'Home'
              ) : (
                <span className="sidebar-icon">🏠</span>
              )}
            </NavLink>
          </li>
          {games.map((game) => (
            <li key={game.path}>
              <NavLink 
                to={game.path} 
                className={({ isActive }) => isActive ? 'active' : ''}
                title={game.name}
              >
                {isExpanded ? (
                  game.name
                ) : (
                  <span className="sidebar-icon">🔍</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {isExpanded && (
        <div className="sidebar-footer">
          Made with ♥ at footyarena.com by Tony H
        </div>
      )}
    </div>
  );
}

export default Sidebar;
