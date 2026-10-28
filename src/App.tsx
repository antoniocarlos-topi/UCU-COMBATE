import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { AdminRoute } from './components/common/AdminRoute';

// Páginas
import { EventLanding } from './pages/public/EventLanding';
import { RegistrationPage } from './pages/public/RegistrationPage';
import { LoginPage } from './pages/auth/LoginPage';
import { AthletePortal } from './pages/athlete/AthletePortal';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { DesignSystemDemo } from './pages/demo/DesignSystemDemo';
import { NotFoundPage } from './pages/feedback/NotFoundPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              {/* Rotas Públicas */}
              <Route index element={<EventLanding />} />
              <Route path="convite/:eventSlug" element={<EventLanding />} />
              <Route path="convite/:eventSlug/inscrever" element={<RegistrationPage />} />
              <Route path="e/:slug" element={<EventLanding />} />
              <Route path="e/:slug/inscrever" element={<RegistrationPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="demo-components" element={<DesignSystemDemo />} />

              {/* Rota Protegida do Atleta */}
              <Route
                path="atleta"
                element={
                  <ProtectedRoute>
                    <AthletePortal />
                  </ProtectedRoute>
                }
              />

              {/* Rota Protegida de Administração */}
              <Route
                path="admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />

              {/* 404 Not Found */}
              <Route path="404" element={<NotFoundPage />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};
