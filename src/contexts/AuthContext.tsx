import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { UserProfile } from '../types/app.types';
import {
  authenticateInUnifiedStore,
  getUnifiedStore,
} from '../services/storeSync';

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
const SESSION_STORAGE_KEY = 'ucu_arena_current_session_v2';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Carregar perfil e privilégios administrativos no Supabase
  const fetchProfileAndRole = async (userId: string) => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_user_id', userId)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData as UserProfile);
      }

      const { data: adminData } = await supabase
        .from('admin_users')
        .select('role, is_active')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      setIsAdmin(!!adminData);
    } catch (err) {
      console.error('[AuthContext] Erro ao carregar dados do usuário no Supabase:', err);
      setIsAdmin(false);
    }
  };

  // Restaurar sessão local a partir do store unificado
  const restoreLocalSession = () => {
    try {
      const savedUserId = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!savedUserId) {
        setIsLoading(false);
        return;
      }

      const store = getUnifiedStore();
      const storedUser = store.users.find((u) => u.id === savedUserId);

      if (storedUser) {
        const mockUser: User = {
          id: storedUser.id,
          app_metadata: {},
          user_metadata: { nickname: storedUser.nickname, full_name: storedUser.fullName },
          aud: 'authenticated',
          created_at: storedUser.createdAt,
        } as any;

        setUser(mockUser);
        setIsAdmin(storedUser.isAdmin);

        // Buscar perfil correspondente no store
        const reg = store.registrations.find(
          (r) => r.profile?.id === storedUser.profileId || r.profile?.auth_user_id === storedUser.id
        );
        if (reg?.profile) {
          setProfile(reg.profile);
        } else if (storedUser.isAdmin) {
          setProfile({
            id: storedUser.profileId,
            auth_user_id: storedUser.id,
            full_name: storedUser.fullName,
            nickname: storedUser.nickname,
            recovery_email: storedUser.recoveryEmail,
            phone: '',
            birth_date: '1990-01-01',
            is_minor: false,
            image_consent: true,
            terms_consent: true,
            created_at: storedUser.createdAt,
            updated_at: storedUser.createdAt,
          });
        }
      }
    } catch (err) {
      console.warn('[AuthContext] Erro ao restaurar sessão local:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const isSupabaseConfigured = Boolean(
      import.meta.env.VITE_SUPABASE_URL &&
      !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')
    );

    if (!isSupabaseConfigured) {
      restoreLocalSession();
      return;
    }

    // Fluxo com Supabase configurado
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.user) {
        fetchProfileAndRole(initialSession.user.id).finally(() => setIsLoading(false));
      } else {
        restoreLocalSession();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        fetchProfileAndRole(currentSession.user.id);
      } else {
        restoreLocalSession();
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

      // Validação Real no Store Unificado (Modo Local / Demo / Resiliente)
      if (!isSupabaseConfigured) {
        const authRes = authenticateInUnifiedStore(nickname, password);
        if (!authRes.success || !authRes.user) {
          return { error: authRes.error || 'Credenciais inválidas.' };
        }

        const authUser: User = {
          id: authRes.user.id,
          app_metadata: {},
          user_metadata: {
            nickname: authRes.user.nickname,
            full_name: authRes.user.fullName,
          },
          aud: 'authenticated',
          created_at: authRes.user.createdAt,
        } as any;

        setUser(authUser);
        setProfile(authRes.profile || null);
        setIsAdmin(Boolean(authRes.isAdmin));

        try {
          localStorage.setItem(SESSION_STORAGE_KEY, authRes.user.id);
        } catch {
          // localStorage pode falhar em contexto estrito
        }

        return {};
      }

      // Chamada à Edge Function ou endpoint do Supabase
      const { data, error: funcError } = await supabase.functions.invoke('auth-login', {
        body: { nickname: nickname.trim(), password },
      });

      if (funcError || !data?.session) {
        return { error: data?.message || 'Apelido ou senha incorretos.' };
      }

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
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {}

    const isSupabaseConfigured = Boolean(
      import.meta.env.VITE_SUPABASE_URL &&
      !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')
    );

    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }

    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
    setIsLoading(false);
  };

  const refreshProfile = async () => {
    if (user) {
      const isSupabaseConfigured = Boolean(
        import.meta.env.VITE_SUPABASE_URL &&
        !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')
      );

      if (isSupabaseConfigured) {
        await fetchProfileAndRole(user.id);
      } else {
        restoreLocalSession();
      }
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
