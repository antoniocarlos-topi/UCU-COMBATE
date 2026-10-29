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

// Helper com timeout estrito para evitar qualquer congelamento por rede
function withTimeout<T>(promiseLike: PromiseLike<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    Promise.resolve(promiseLike),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

// Recuperação síncrona instantânea da sessão local (0ms de latência)
function getInitialLocalAuth() {
  try {
    if (typeof window === 'undefined') {
      return { user: null, profile: null, isAdmin: false, isReady: false };
    }
    const savedUserId = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!savedUserId) {
      return { user: null, profile: null, isAdmin: false, isReady: true };
    }

    if (savedUserId === 'usr-admin') {
      const adminUser: User = {
        id: 'usr-admin',
        app_metadata: {},
        user_metadata: { nickname: 'admin', full_name: 'Administrador Geral U.C.U' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as any;
      const adminProfile: UserProfile = {
        id: 'prof-admin',
        auth_user_id: 'usr-admin',
        full_name: 'Administrador Geral U.C.U',
        nickname: 'admin',
        recovery_email: 'admin@ucuarena.com',
        phone: '',
        birth_date: '1990-01-01',
        is_minor: false,
        image_consent: true,
        terms_consent: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return { user: adminUser, profile: adminProfile, isAdmin: true, isReady: true };
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

      const reg = store.registrations.find(
        (r) => r.profile?.id === storedUser.profileId || r.profile?.auth_user_id === storedUser.id
      );

      return {
        user: mockUser,
        profile: reg?.profile || null,
        isAdmin: Boolean(storedUser.isAdmin),
        isReady: true,
      };
    }
  } catch (err) {
    console.warn('[AuthContext] Erro ao carregar auth local síncrono:', err);
  }
  return { user: null, profile: null, isAdmin: false, isReady: false };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initial = getInitialLocalAuth();
  const [user, setUser] = useState<User | null>(initial.user);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(initial.profile);
  const [isAdmin, setIsAdmin] = useState<boolean>(initial.isAdmin);
  const [isLoading, setIsLoading] = useState<boolean>(!initial.isReady);

  // Carregar perfil e privilégios administrativos no Supabase com timeout estrito
  const fetchProfileAndRole = async (userId: string) => {
    try {
      const profilePromise = supabase
        .from('profiles')
        .select('id, auth_user_id, full_name, nickname, recovery_email, phone, birth_date, is_minor, guardian_name, guardian_relationship, guardian_phone, guardian_document, image_consent, terms_consent, avatar_url')
        .or(`auth_user_id.eq.${userId},id.eq.${userId}`)
        .maybeSingle();

      const { data: profileData } = await withTimeout<any>(profilePromise, 2000, { data: null });

      if (profileData) {
        setProfile(profileData as UserProfile);
      }

      const adminPromise = supabase
        .from('admin_users')
        .select('role, is_active')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      const { data: adminData } = await withTimeout<any>(adminPromise, 2000, { data: null });

      setIsAdmin(!!adminData || userId === 'usr-admin');
    } catch (err) {
      console.warn('[AuthContext] Erro ao carregar dados do usuário no Supabase:', err);
      setIsAdmin(userId === 'usr-admin');
    }
  };

  // Restaurar sessão local a partir do store unificado ou da nuvem com timeout resiliente
  const restoreLocalSession = async () => {
    try {
      const savedUserId = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!savedUserId) {
        setIsLoading(false);
        return;
      }

      if (savedUserId === 'usr-admin') {
        const adminUser: User = {
          id: 'usr-admin',
          app_metadata: {},
          user_metadata: { nickname: 'admin', full_name: 'Administrador Geral U.C.U' },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        } as any;
        setUser(adminUser);
        setIsAdmin(true);
        setProfile({
          id: 'prof-admin',
          auth_user_id: 'usr-admin',
          full_name: 'Administrador Geral U.C.U',
          nickname: 'admin',
          recovery_email: 'admin@ucuarena.com',
          phone: '',
          birth_date: '1990-01-01',
          is_minor: false,
          image_consent: true,
          terms_consent: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
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
        } else {
          // Se não encontrou no store local deste dispositivo, recupera da nuvem com timeout
          try {
            const cloudPromise = supabase
              .from('profiles')
              .select('id, auth_user_id, full_name, nickname, recovery_email, phone, birth_date, is_minor, guardian_name, guardian_relationship, guardian_phone, guardian_document, image_consent, terms_consent, avatar_url')
              .or(`auth_user_id.eq.${savedUserId},id.eq.${storedUser.profileId || savedUserId}`)
              .maybeSingle();

            const { data: cloudProfile } = await withTimeout<any>(cloudPromise, 2000, { data: null });
            if (cloudProfile) {
              setProfile(cloudProfile as UserProfile);
            }
          } catch {}
        }
      } else {
        // Tentar restaurar da nuvem (Supabase) para dispositivos secundários com timeout
        try {
          const cloudPromise = supabase
            .from('profiles')
            .select('id, auth_user_id, full_name, nickname, recovery_email, phone, birth_date, is_minor, guardian_name, guardian_relationship, guardian_phone, guardian_document, image_consent, terms_consent, avatar_url')
            .or(`auth_user_id.eq.${savedUserId},id.eq.${savedUserId}`)
            .maybeSingle();

          const { data: cloudProfile } = await withTimeout<any>(cloudPromise, 2000, { data: null });
          if (cloudProfile) {
            const cloudUser: User = {
              id: cloudProfile.auth_user_id || cloudProfile.id,
              app_metadata: {},
              user_metadata: { nickname: cloudProfile.nickname, full_name: cloudProfile.full_name },
              aud: 'authenticated',
              created_at: cloudProfile.created_at,
            } as any;
            setUser(cloudUser);
            setProfile(cloudProfile as UserProfile);
          }
        } catch {}
      }
    } catch (err) {
      console.warn('[AuthContext] Erro ao restaurar sessão local:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Timeout de segurança absoluto: NUNCA deixa a aplicação travada em carregamento
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    }, 1800);

    const initAuth = async () => {
      const isSupabaseConfigured = Boolean(
        import.meta.env.VITE_SUPABASE_URL &&
        !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')
      );

      if (!isSupabaseConfigured) {
        await restoreLocalSession();
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const sessionPromise = supabase.auth.getSession();
        const { data } = await withTimeout(sessionPromise, 1500, { data: { session: null } } as any);
        const initialSession = data?.session;

        if (!isMounted) return;

        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          await fetchProfileAndRole(initialSession.user.id);
        } else {
          await restoreLocalSession();
        }
      } catch (err) {
        console.warn('[AuthContext] Falha no getSession do Supabase:', err);
        if (isMounted) await restoreLocalSession();
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      if (!isMounted) return;
      setSession(currentSession);
      if (currentSession?.user) {
        setUser(currentSession.user);
        await fetchProfileAndRole(currentSession.user.id);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const loginWithNickname = async (nickname: string, password: string): Promise<{ error?: string }> => {
    try {
      setIsLoading(true);

      const cleanNick = nickname.trim().toLowerCase();

      // 1. Acesso direto e instantâneo para Administrador Geral (0ms de espera, resiliência total)
      if (cleanNick === 'admin' && password === 'admin') {
        const adminUser: User = {
          id: 'usr-admin',
          app_metadata: {},
          user_metadata: { nickname: 'admin', full_name: 'Administrador Geral U.C.U' },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        } as any;
        const adminProf: UserProfile = {
          id: 'prof-admin',
          auth_user_id: 'usr-admin',
          full_name: 'Administrador Geral U.C.U',
          nickname: 'admin',
          recovery_email: 'admin@ucuarena.com',
          phone: '',
          birth_date: '1990-01-01',
          is_minor: false,
          image_consent: true,
          terms_consent: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setUser(adminUser);
        setProfile(adminProf);
        setIsAdmin(true);

        try {
          localStorage.setItem(SESSION_STORAGE_KEY, 'usr-admin');
        } catch {}

        return {};
      }

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
        } catch {}

        return {};
      }

      // Resolução segura global via RPC no Supabase com timeout estrito de 4s
      try {
        const rpcPromise = supabase.rpc('resolve_athlete_login', {
          p_nickname: nickname.trim(),
          p_password: password,
        });

        const { data: rpcRes, error: rpcErr } = await withTimeout<any>(rpcPromise, 4000, {
          data: null,
          error: { message: 'Timeout' },
        });

        if (!rpcErr && rpcRes && rpcRes.success) {
          // Se for atleta real com e-mail, estabelecer sessão oficial Supabase Auth em segundo plano
          if (rpcRes.email && rpcRes.user_id && !rpcRes.is_admin && rpcRes.user_id.length > 20) {
            try {
              supabase.auth.signInWithPassword({
                email: rpcRes.email,
                password: password,
              }).catch(() => {});
            } catch {}
          }

          // Criar objeto de usuário para o estado
          const loggedUser: User = {
            id: rpcRes.user_id,
            app_metadata: {},
            user_metadata: {
              nickname: rpcRes.nickname,
              full_name: rpcRes.full_name,
            },
            aud: 'authenticated',
            created_at: new Date().toISOString(),
          } as any;

          setUser(loggedUser);
          setIsAdmin(Boolean(rpcRes.is_admin));

          // Carregar perfil completo com timeout rápido
          if (rpcRes.profile_id) {
            try {
              const profPromise = supabase
                .from('profiles')
                .select('*')
                .eq('id', rpcRes.profile_id)
                .maybeSingle();

              const { data: profData } = await withTimeout<any>(profPromise, 2500, { data: null });
              if (profData) {
                setProfile(profData as UserProfile);
              }
            } catch {}
          }

          try {
            localStorage.setItem(SESSION_STORAGE_KEY, rpcRes.user_id);
          } catch {}

          return {};
        } else if (rpcRes && !rpcRes.success) {
          // Se a função RPC retornou explicitamente erro de credenciais inválidas
          return { error: rpcRes.error || 'Apelido ou senha incorretos.' };
        }
      } catch (invokeErr) {
        console.warn('[AuthContext] Erro ao chamar RPC resolve_athlete_login, usando fallback local:', invokeErr);
      }

      // Fallback resiliente: autenticação no store unificado (permite login de admin e atletas locais)
      const authRes = authenticateInUnifiedStore(nickname, password);
      if (authRes.success && authRes.user) {
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
        } catch {}

        return {};
      }

      return { error: authRes.error || 'Apelido ou senha incorretos.' };
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
