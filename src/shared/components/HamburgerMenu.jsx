import './HamburgerMenu.css';

function HamburgerMenu({ isExpanded, onClick }) {
  return (
    <button 
      onClick={onClick}
      className="hamburger-menu-btn"
      aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
    >
      {isExpanded ? (
        <span className="close-icon">×</span>
      ) : (
        <div className="hamburger-icon">
          <div className="hamburger-line"></div>
          <div className="hamburger-line"></div>
          <div className="hamburger-line"></div>
        </div>
      )}
    </button>
  );
}

export default HamburgerMenu;
