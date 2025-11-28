import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'gerente' | 'vendedor';

export interface User {
  id: string;
  email: string;
  nome: string;
  role: UserRole;
  codigoVendedor?: string;
  ativo: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nome: string, role?: UserRole, codigoVendedor?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (...roles: UserRole[]) => boolean;
  isAdmin: boolean;
  isVendedor: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Carregar perfil completo do usuário
  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      // Buscar perfil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (profileError) throw profileError;

      // Buscar role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', supabaseUser.id)
        .single();

      if (roleError) throw roleError;

      const userData: User = {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        nome: profile.nome,
        role: roleData.role as UserRole,
        codigoVendedor: profile.codigo_vendedor,
        ativo: profile.ativo,
      };

      setUser(userData);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      toast.error('Erro ao carregar dados do usuário');
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados de autenticação do Supabase
  useEffect(() => {
    // Configurar listener de mudanças de autenticação PRIMEIRO
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        setSession(session);
        
        if (session?.user) {
          // Usar setTimeout para evitar deadlock
          setTimeout(() => {
            loadUserProfile(session.user);
          }, 0);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    // DEPOIS verificar sessão existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Verificar se usuário está ativo
      const { data: profile } = await supabase
        .from('profiles')
        .select('ativo')
        .eq('id', data.user.id)
        .single();

      if (profile && !profile.ativo) {
        await supabase.auth.signOut();
        throw new Error('Usuário desativado. Entre em contato com o administrador.');
      }

      toast.success('Login realizado com sucesso!');
      navigate('/');
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
      const errorMessage = error.message || 'Erro ao fazer login';
      toast.error(errorMessage);
      throw error;
    }
  };

  const register = async (
    email: string, 
    password: string, 
    nome: string, 
    role: UserRole = 'vendedor', 
    codigoVendedor?: string
  ) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            nome,
            role,
            codigo_vendedor: codigoVendedor,
          }
        }
      });

      if (error) throw error;

      toast.success('Usuário registrado com sucesso!');
      navigate('/');
    } catch (error: any) {
      console.error('Erro ao registrar:', error);
      const errorMessage = error.message || 'Erro ao registrar usuário';
      toast.error(errorMessage);
      throw error;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    toast.success('Logout realizado com sucesso!');
    navigate('/auth');
  };

  const isAuthenticated = !!session && !!user;
  const isAdmin = user?.role === 'admin';
  const isVendedor = user?.role === 'vendedor';

  const hasRole = (...roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        login,
        register,
        logout,
        isAuthenticated,
        hasRole,
        isAdmin,
        isVendedor,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
