import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { AdminRoute } from './components/common/AdminRoute';

// Páginas
import { ArenaPublicHome } from './pages/public/ArenaPublicHome';
import { EventLanding } from './pages/public/EventLanding';
import { RegistrationPage } from './pages/public/RegistrationPage';
import { LoginPage } from './pages/auth/LoginPage';
import { AthletePortal } from './pages/athlete/AthletePortal';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { DesignSystemDemo } from './pages/demo/DesignSystemDemo';
import { NotFoundPage } from './pages/feedback/NotFoundPage';

export const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              {/* Página Principal Oficial — Arena U.C.U (Lutas, Categorias, Vídeos) */}
              <Route index element={<ArenaPublicHome />} />

              {/* Índices Separados de Acesso Restrito/Direto via URL */}
              <Route path="convite" element={<EventLanding />} />
              <Route path="convite/:eventSlug" element={<EventLanding />} />
              <Route path="convite/:eventSlug/inscrever" element={<RegistrationPage />} />
              <Route path="inscrever" element={<RegistrationPage />} />
              <Route path="e/:slug" element={<EventLanding />} />
              <Route path="e/:slug/inscrever" element={<RegistrationPage />} />

              {/* Autenticação */}
              <Route path="login" element={<LoginPage />} />
              <Route path="demo-components" element={<DesignSystemDemo />} />

              {/* Rota Protegida do Atleta (Meu Card) */}
              <Route
                path="atleta"
                element={
                  <ProtectedRoute>
                    <AthletePortal />
                  </ProtectedRoute>
                }
              />

              {/* Rota Protegida de Administração (Acesso direto por URL) */}
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
    </HashRouter>
  );
};
