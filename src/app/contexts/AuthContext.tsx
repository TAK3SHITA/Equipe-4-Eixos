import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

type Perfil = {
  id: string;
  nome: string;
  usuario: string;
  email: string | null;
  perfil: string;
  ativo: boolean;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  perfil: Perfil | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshPerfil: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function loadPerfil(userId: string): Promise<Perfil | null> {
  const { data, error } = await supabase
    .from('perfis')
    .select('id,nome,usuario,email,perfil,ativo')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Erro ao carregar perfil:', error.message);
    return null;
  }
  return data as Perfil | null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) setPerfil(await loadPerfil(data.session.user.id));
      if (mounted) setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      // Enquanto o perfil do usuário é consultado, as rotas protegidas
      // permanecem em estado de carregamento e não redirecionam ao login.
      setLoading(true);
      if (!nextSession) {
        setPerfil(null);
        setLoading(false);
        return;
      }
      // A consulta é adiada para não executar operações Supabase dentro do callback síncrono.
      setTimeout(async () => {
        const nextPerfil = await loadPerfil(nextSession.user.id);
        if (mounted) {
          setPerfil(nextPerfil);
          setLoading(false);
        }
      }, 0);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) return { error: 'E-mail ou senha incorretos. Confira os dados e tente novamente.' };

    const userPerfil = data.user ? await loadPerfil(data.user.id) : null;
    if (!userPerfil) {
      await supabase.auth.signOut();
      return { error: 'Usuário autenticado, mas sem perfil cadastrado. Solicite ao administrador a regularização do acesso.' };
    }
    if (!userPerfil.ativo) {
      await supabase.auth.signOut();
      return { error: 'Este usuário está inativo. Procure o administrador do sistema.' };
    }
    setPerfil(userPerfil);
    return { error: null };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setSession(null);
    setPerfil(null);
  };

  const refreshPerfil = async () => {
    if (!session?.user) return;
    setPerfil(await loadPerfil(session.user.id));
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, perfil, loading, signIn, signOut, refreshPerfil }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser utilizado dentro de AuthProvider.');
  return context;
}
