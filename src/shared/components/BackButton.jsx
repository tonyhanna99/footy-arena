import React from 'react';
import './BackButton.css';

function BackButton({ onClick }) {
  return (
    <button onClick={onClick} className="back-button-shared">
      ← Back
    </button>
  );
}

export default BackButton;
