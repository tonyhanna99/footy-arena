import { NavLink, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

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
];

function Sidebar() {
  // Default to collapsed on mobile, expanded on desktop
  const [isExpanded, setIsExpanded] = useState(false);
  // Counter to force re-render and clear stuck states
  const [buttonKey, setButtonKey] = useState(0);
  
  useEffect(() => {
    // Set initial state based on screen size
    const isMobile = window.innerWidth <= 768;
    setIsExpanded(!isMobile);
  }, []);

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
    // Force re-render to clear any stuck focus/hover states
    setButtonKey(prev => prev + 1);
  };

  const handleNavClick = () => {
    // Close sidebar on mobile when navigation item is clicked
    if (window.innerWidth <= 768 && isExpanded) {
      setIsExpanded(false);
    }
  };

  return (
    <div className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`} style={{ position: 'relative' }}>
      {/* Toggle button positioned on the border */}
      <button 
        key={buttonKey}
        onClick={toggleSidebar}
        className="sidebar-toggle-border"
        aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {isExpanded ? (
          <span style={{ fontSize: '32px', lineHeight: '1' }}>×</span>
        ) : (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '3px',
            width: '20px',
            height: '20px'
          }}>
            <div style={{ width: '16px', height: '2px', backgroundColor: 'currentColor' }}></div>
            <div style={{ width: '16px', height: '2px', backgroundColor: 'currentColor' }}></div>
            <div style={{ width: '16px', height: '2px', backgroundColor: 'currentColor' }}></div>
          </div>
        )}
      </button>

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
