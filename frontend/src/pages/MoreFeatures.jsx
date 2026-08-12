import React from 'react';
import { useNavigate } from 'react-router-dom';

// Tools available to everyone (guests, admins, project users).
// Add new tools here to grow the More Features hub.
const TOOLS = [
  {
    key: 'business-plan',
    title: 'Business Plan',
    icon: '📈',
    description:
      'Answer a few guided questions and let AI generate a complete, professional business plan for you.',
    route: '/more-features/business-plan',
  },
];

export default function MoreFeatures() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <div className="page-header-row">
        <h1 className="page-title">🧰 More Features</h1>
      </div>
      <p className="page-subtitle">
        Extra tools available to everyone — no login restrictions. More tools coming soon.
      </p>

      <div className="more-features-grid">
        {TOOLS.map((tool) => (
          <div
            key={tool.key}
            className="card tool-card"
            onClick={() => navigate(tool.route)}
            style={{ cursor: 'pointer' }}
          >
            <div className="tool-card-icon">{tool.icon}</div>
            <h3 className="tool-card-title">{tool.title}</h3>
            <p className="tool-card-desc">{tool.description}</p>
            <button className="btn btn--primary" onClick={() => navigate(tool.route)}>
              Open
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
