import React from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, UserPlus, Shield, Sparkles, Lock } from 'lucide-react';

export const BottomNavigation: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Convite', icon: <Calendar size={20} /> },
    { to: '/convite/arena-inaugural/inscrever', label: 'Inscrição', icon: <UserPlus size={20} /> },
    { to: '/atleta', label: 'Meu Card', icon: <Shield size={20} /> },
    { to: '/admin', label: 'Admin', icon: <Lock size={20} /> },
    { to: '/demo-components', label: 'Design', icon: <Sparkles size={20} /> },
  ];

  return (
    <nav
      aria-label="Navegação inferior mobile"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 'var(--z-bottom-nav)',
        backgroundColor: 'rgba(10, 10, 14, 0.94)',
        backdropFilter: 'var(--glass-backdrop)',
        borderTop: '1px solid var(--color-border-subtle)',
        paddingBottom: 'max(var(--safe-area-bottom), 6px)',
        paddingTop: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
      }}
    >
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `interactive-tap ${isActive ? 'active-nav' : ''}`}
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            padding: '6px 12px',
            borderRadius: 'var(--radius-md)',
            color: isActive ? 'var(--color-gold-primary)' : 'var(--color-text-muted)',
            transition: 'color var(--transition-fast)',
            textDecoration: 'none',
            minWidth: '56px',
          })}
        >
          {({ isActive }) => (
            <>
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: isActive ? 'translateY(-2px)' : 'none',
                  transition: 'transform var(--transition-fast)',
                }}
              >
                {item.icon}
                {isActive && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '-6px',
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-gold-primary)',
                      boxShadow: '0 0 8px var(--color-gold-primary)',
                    }}
                  />
                )}
              </div>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: isActive ? 700 : 500,
                  fontFamily: 'var(--font-family-heading)',
                  letterSpacing: '0.02em',
                }}
              >
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};
