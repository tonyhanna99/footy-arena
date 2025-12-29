import { NavLink, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { HamburgerMenu } from '../shared/components';

const games = [
  {
    name: 'Football Imposter',
    path: '/games/football-imposter',
    icon: '🕵️',
  },
  {
    name: 'Guess Who',
    path: '/games/guess-who',
    icon: '❓',
  },
  {
    name: 'Football Alphabet',
    path: '/games/football-alphabet',
    icon: '🔤',
  },
];

function Sidebar() {
  // Default to collapsed on mobile, expanded on desktop
  const [isExpanded, setIsExpanded] = useState(false);
  
  useEffect(() => {
    // Set initial state based on screen size
    const isMobile = window.innerWidth <= 768;
    setIsExpanded(!isMobile);
  }, []);

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  const handleNavClick = () => {
    // Close sidebar on mobile when navigation item is clicked
    if (window.innerWidth <= 768 && isExpanded) {
      setIsExpanded(false);
    }
  };

  return (
    <div className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`} style={{ position: 'relative' }}>
      {/* Hamburger Menu Button */}
      <HamburgerMenu isExpanded={isExpanded} onClick={toggleSidebar} />

      <div className="sidebar-header">
        {isExpanded ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem 0' }}>
            <Link to="/" style={{ display: 'block', cursor: 'pointer' }}>
              <img src="/logo.png" alt="FootyArena" style={{ height: '15rem', width: 'auto' }} />
            </Link>
          </div>
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
              onClick={handleNavClick}
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
                onClick={(e) => {
                  handleNavClick();
                  // If already on this path, force a reload by navigating to same path
                  if (window.location.pathname === game.path) {
                    e.preventDefault();
                    // Force reload by navigating away and back
                    window.location.href = game.path;
                  }
                }}
              >
                {isExpanded ? (
                  game.name
                ) : (
                  <span className="sidebar-icon">{game.icon}</span>
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
