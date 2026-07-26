import React from 'react';
import { Link } from 'react-router-dom';

function Header() {
  return (
    <header className="header">
      <div className="header-logo">
        <Link to="/">I&D Hub</Link>
      </div>
      <nav className="header-nav">
        <Link to="/">Dashboard</Link>
        <Link to="/projects">Projects</Link>
        <Link to="/tasks">Tasks</Link>
      </nav>
    </header>
  );
}

export default Header;