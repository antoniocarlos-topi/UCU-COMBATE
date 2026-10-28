import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { UserProfile } from '../types/app.types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  loginWithNickname: (nickname: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Carregar perfil e privilégios administrativos
  const fetchProfileAndRole = async (userId: string) => {
    try {
      // 1. Buscar perfil do atleta
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_user_id', userId)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData as UserProfile);
      }

      // 2. Verificar se o usuário possui registro na tabela admin_users
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('role, is_active')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      setIsAdmin(!!adminData);
    } catch (err) {
      console.error('[AuthContext] Erro ao carregar dados do usuário:', err);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    // 1. Obter sessão inicial
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.user) {
        fetchProfileAndRole(initialSession.user.id).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    // 2. Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        fetchProfileAndRole(currentSession.user.id);
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loginWithNickname = async (nickname: string, password: string): Promise<{ error?: string }> => {
    try {
      setIsLoading(true);

      const isSupabaseConfigured = Boolean(
        import.meta.env.VITE_SUPABASE_URL &&
        !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')
      );

      // Modo resiliente para preview e testes locais sem conexão com Supabase
      if (!isSupabaseConfigured) {
        if (password.length < 6) {
          return { error: 'A senha deve conter no mínimo 6 caracteres.' };
        }

        const mockUser: User = {
          id: 'auth-demo-user',
          app_metadata: {},
          user_metadata: { nickname },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        } as any;

        setUser(mockUser);
        if (nickname.toLowerCase().includes('admin')) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
        return {};
      }

      // Chamada à Edge Function ou endpoint seguro de login por apelido
      const { data, error: funcError } = await supabase.functions.invoke('auth-login', {
        body: { nickname: nickname.trim(), password },
      });

      if (funcError || !data?.session) {
        return { error: data?.message || 'Apelido ou senha incorretos.' };
      }

      // Definir a sessão recebida
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      return {};
    } catch (err) {
      return { error: 'Falha de comunicação com o servidor de autenticação.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
    setIsLoading(false);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfileAndRole(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAdmin,
        isLoading,
        loginWithNickname,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
