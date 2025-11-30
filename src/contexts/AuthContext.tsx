import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axiosInstance from '@/lib/api';

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
  const [loading, setLoading] = useState(true);

  // Carregar usuário do localStorage ao iniciar
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem('mariela_user');
        const token = localStorage.getItem('mariela_access_token');
        
        if (storedUser && token) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
        localStorage.removeItem('mariela_user');
        localStorage.removeItem('mariela_access_token');
        localStorage.removeItem('mariela_refresh_token');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await axiosInstance.post<{
        accessToken: string;
        refreshToken: string;
        user: User;
      }>('/auth/login', {
        email,
        password,
      });

      const { accessToken, refreshToken, user: userData } = response.data;

      // Verificar se usuário está ativo
      if (!userData.ativo) {
        throw new Error('Usuário desativado. Entre em contato com o administrador.');
      }

      // Salvar tokens e dados do usuário
      localStorage.setItem('mariela_access_token', accessToken);
      localStorage.setItem('mariela_refresh_token', refreshToken);
      localStorage.setItem('mariela_user', JSON.stringify(userData));

      setUser(userData);
      toast.success('Login realizado com sucesso!');
      navigate('/');
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Erro ao fazer login';
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
      const response = await axiosInstance.post<{
        accessToken: string;
        refreshToken: string;
        user: User;
      }>('/auth/register', {
        email,
        password,
        nome,
        role,
        codigoVendedor,
      });

      const { accessToken, refreshToken, user: userData } = response.data;

      // Salvar tokens e dados do usuário
      localStorage.setItem('mariela_access_token', accessToken);
      localStorage.setItem('mariela_refresh_token', refreshToken);
      localStorage.setItem('mariela_user', JSON.stringify(userData));

      setUser(userData);
      toast.success('Usuário registrado com sucesso!');
      navigate('/');
    } catch (error: any) {
      console.error('Erro ao registrar:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Erro ao registrar usuário';
      toast.error(errorMessage);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('mariela_refresh_token');
      if (refreshToken) {
        await axiosInstance.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      localStorage.removeItem('mariela_access_token');
      localStorage.removeItem('mariela_refresh_token');
      localStorage.removeItem('mariela_user');
      setUser(null);
      toast.success('Logout realizado com sucesso!');
      navigate('/auth');
    }
  };

  const isAuthenticated = !!user && !!localStorage.getItem('mariela_access_token');
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
