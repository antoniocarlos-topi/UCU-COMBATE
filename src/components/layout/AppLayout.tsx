import React from 'react';
import { Outlet } from 'react-router-dom';
import { MobileHeader } from './MobileHeader';
import { BottomNavigation } from './BottomNavigation';

export interface AppLayoutProps {
  children?: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
      }}
    >
      <MobileHeader />

      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          paddingBottom: 'calc(76px + var(--safe-area-bottom))',
          paddingTop: 'var(--space-4)',
        }}
      >
        <div className="app-container">
          {children || <Outlet />}
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
};
