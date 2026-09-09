import React, { Component } from 'react';

// Draft keys for the questionnaire tools (kept in sync with the page files)
const DRAFT_KEYS_BY_ROUTE = [
  {
    route: '/more-features/commercialization',
    keys: ['pmis_commercialization_draft'],
    label: 'Commercialization Plan 問卷',
  },
  {
    route: '/more-features/business-plan',
    keys: ['pmis_business_plan_draft', 'pmis_business_plan_result'],
    label: 'Business Plan 問卷',
  },
];

/**
 * Global error boundary. Without it, any uncaught render error unmounts the
 * whole React tree and leaves the user with a blank white page. This shows a
 * friendly recovery screen with the actual error message instead.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (typeof this.props.onError === 'function') {
      this.props.onError(error, info);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleRetry = () => {
    this.setState({ error: null });
  };

  handleResetQuestionnaire = () => {
    try {
      const current = window.location.pathname;
      DRAFT_KEYS_BY_ROUTE.forEach(({ route, keys }) => {
        if (current.startsWith(route)) {
          keys.forEach((k) => localStorage.removeItem(k));
        }
      });
    } catch (e) {
      /* storage may be unavailable — ignore */
    }
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    const msg = this.state.error && this.state.error.message
      ? String(this.state.error.message)
      : String(this.state.error || 'Unknown error');

    const currentPath = window.location.pathname;
    const onQuestionnaire = DRAFT_KEYS_BY_ROUTE.some(({ route }) =>
      currentPath.startsWith(route)
    );

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f4f6fb',
          padding: '1rem',
          fontFamily: "'Segoe UI', system-ui, Arial, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: '580px',
            width: '100%',
            background: '#fff',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(26,35,126,0.12)',
            padding: '2rem',
          }}
        >
          <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.4rem', color: '#1a237e' }}>
            ⚠️ 頁面出咗問題 (Something went wrong)
          </h1>
          <p style={{ margin: '0 0 1rem', color: '#475569', lineHeight: 1.5 }}>
            呢版意外出咗個 error，令頁面顯示唔到。你嘅資料仍然安全——
            可以試吓重新載入，或者（如果係問卷頁）重置份問卷嘅暫存資料再試。
          </p>

          <div
            style={{
              background: '#fbe9e7',
              border: '1px solid #ffccbc',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              margin: '0 0 1.25rem',
              color: '#b71c1c',
              fontSize: '0.85rem',
              overflowWrap: 'anywhere',
              maxHeight: '160px',
              overflow: 'auto',
            }}
          >
            {msg || 'Unknown error'}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                background: '#1a237e',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.6rem 1.25rem',
                fontSize: '0.95rem',
                cursor: 'pointer',
              }}
            >
              🔄 重新載入 (Reload)
            </button>
            <button
              type="button"
              onClick={this.handleRetry}
              style={{
                background: '#e8eaf6',
                color: '#1a237e',
                border: 'none',
                borderRadius: '8px',
                padding: '0.6rem 1.25rem',
                fontSize: '0.95rem',
                cursor: 'pointer',
              }}
            >
              ↻ 再試一次 (Try again)
            </button>
            {onQuestionnaire && (
              <button
                type="button"
                onClick={this.handleResetQuestionnaire}
                style={{
                  background: '#fff',
                  color: '#c62828',
                  border: '1px solid #ef9a9a',
                  borderRadius: '8px',
                  padding: '0.6rem 1.25rem',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                }}
              >
                🗑 重置問卷暫存資料 (Reset draft)
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
}
