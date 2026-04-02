// frontend/src/components/Navbar.tsx
// Shared navigation bar — appears on every page
// Logo links to home, shows user name and account link if logged in

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/AuthStore';

const Navbar: React.FC = () => {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { user, isAuthenticated } = useAuthStore();

  // Don't show navbar on the game board — it takes up full screen
  if (location.pathname.startsWith('/game/')) return null;

  return (
    <nav style={{
      position:       'fixed',
      top:            0,
      left:           0,
      right:          0,
      zIndex:         50,
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'space-between',
      padding:        '10px 24px',
      background:     'rgba(255,255,255,0.08)',
      backdropFilter: 'blur(16px)',
      borderBottom:   '1px solid rgba(255,255,255,0.12)',
    }}>

      {/* Logo — always goes home */}
      <button
        onClick={() => navigate('/')}
        style={{
          display:    'flex',
          alignItems: 'center',
          gap:        '10px',
          background: 'none',
          border:     'none',
          cursor:     'pointer',
          padding:    '4px 0',
        }}
      >
        <img
          src="/logo.png"
          alt="LevelUp"
          style={{
            height:  '36px',
            width:   'auto',
            filter:  'brightness(0) invert(1)',  // makes dark logo white for dark bg
            opacity: 0.95,
          }}
        />
        <span style={{
          color:      '#fff',
          fontWeight: 700,
          fontSize:   '16px',
          letterSpacing: '0.02em',
          opacity:    0.9,
        }}>
          LevelUp
        </span>
      </button>

      {/* Right side nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

        {/* Home button — only show when not on homepage */}
        {location.pathname !== '/' && (
          <button
            onClick={() => navigate('/')}
            style={{
              display:        'flex',
              alignItems:     'center',
              gap:            '6px',
              background:     'rgba(255,255,255,0.1)',
              border:         '1px solid rgba(255,255,255,0.2)',
              borderRadius:   '8px',
              padding:        '7px 14px',
              color:          '#fff',
              fontSize:       '13px',
              fontWeight:     500,
              cursor:         'pointer',
              transition:     'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.18)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.35)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.2)';
            }}
          >
            ← Home
          </button>
        )}

        {/* Account button — only when logged in */}
        {isAuthenticated && user && (
          <button
            onClick={() => navigate('/account')}
            style={{
              display:        'flex',
              alignItems:     'center',
              gap:            '8px',
              background:     location.pathname === '/account'
                ? 'rgba(103,232,249,0.15)'
                : 'rgba(255,255,255,0.08)',
              border:         location.pathname === '/account'
                ? '1px solid rgba(103,232,249,0.4)'
                : '1px solid rgba(255,255,255,0.15)',
              borderRadius:   '8px',
              padding:        '7px 14px',
              color:          '#fff',
              fontSize:       '13px',
              fontWeight:     500,
              cursor:         'pointer',
              transition:     'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(103,232,249,0.15)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(103,232,249,0.35)';
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== '/account') {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.15)';
              }
            }}
          >
            <div style={{
              width:        '24px',
              height:       '24px',
              borderRadius: '50%',
              background:   'rgba(103,232,249,0.3)',
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              fontSize:     '11px',
              fontWeight:   700,
              color:        '#67e8f9',
              flexShrink:   0,
            }}>
              {user.displayName?.[0]?.toUpperCase() || 'U'}
            </div>
            <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.displayName}
            </span>
          </button>
        )}

        {/* Login button — only when logged out */}
        {!isAuthenticated && location.pathname !== '/login' && (
          <button
            onClick={() => navigate('/login')}
            style={{
              background:   '#67e8f9',
              border:       'none',
              borderRadius: '8px',
              padding:      '7px 16px',
              color:        '#1e3a8a',
              fontSize:     '13px',
              fontWeight:   700,
              cursor:       'pointer',
              transition:   'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#a5f3fc';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#67e8f9';
            }}
          >
            Log In
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
