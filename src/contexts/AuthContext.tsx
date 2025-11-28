import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '@/lib/api';

export type UserRole = 'admin' | 'gerente' | 'vendedor';

export interface User {
  id: string;
  email: string;
  nome: string;
  role: UserRole;
  codigoVendedor?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nome: string, role?: UserRole, codigoVendedor?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (...roles: UserRole[]) => boolean;
  isAdmin: boolean;
  isGerente: boolean;
  isVendedor: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACCESS_TOKEN_KEY = 'mariela_access_token';
const REFRESH_TOKEN_KEY = 'mariela_refresh_token';
const USER_KEY = 'mariela_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Carregar usuário do localStorage ao iniciar
  useEffect(() => {
    const storedAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);

    if (storedAccessToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedAccessToken);
        setUser(parsedUser);
        
        // Configurar renovação automática do token
        setupTokenRefresh(storedRefreshToken);
      } catch (error) {
        console.error('Erro ao carregar usuário do localStorage:', error);
        clearAuthData();
      }
    }

    setLoading(false);
  }, []);

  // Função para configurar renovação automática do token
  const setupTokenRefresh = (refreshToken: string | null) => {
    if (!refreshToken) return;

    // Renovar token 5 minutos antes de expirar (token expira em 1h)
    const refreshInterval = 55 * 60 * 1000; // 55 minutos

    const intervalId = setInterval(async () => {
      try {
        const response = await api.post('/auth/refresh', { refreshToken });
        const { accessToken } = response.data;
        
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        setToken(accessToken);
      } catch (error) {
        console.error('Erro ao renovar token:', error);
        clearAuthData();
        navigate('/auth');
      }
    }, refreshInterval);

    // Limpar intervalo quando componente desmontar
    return () => clearInterval(intervalId);
  };

  const clearAuthData = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });

      const { accessToken, refreshToken, user: newUser } = response.data;

      // Salvar no localStorage
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(newUser));

      // Atualizar estado
      setToken(accessToken);
      setUser(newUser);

      // Configurar renovação automática
      setupTokenRefresh(refreshToken);

      toast.success('Login realizado com sucesso!');
      navigate('/');
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
      const errorMessage = error.response?.data?.error || 'Erro ao fazer login';
      toast.error(errorMessage);
      throw error;
    }
  };

  const register = async (
    email: string, 
    password: string, 
    nome: string, 
    role?: UserRole, 
    codigoVendedor?: string
  ) => {
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        nome,
        role,
        codigoVendedor
      });

      const { accessToken, refreshToken, user: newUser } = response.data;

      // Salvar no localStorage
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(newUser));

      // Atualizar estado
      setToken(accessToken);
      setUser(newUser);

      // Configurar renovação automática
      setupTokenRefresh(refreshToken);

      toast.success('Cadastro realizado com sucesso!');
      navigate('/');
    } catch (error: any) {
      console.error('Erro ao registrar:', error);
      const errorMessage = error.response?.data?.error || 'Erro ao criar conta';
      toast.error(errorMessage);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      
      // Revogar refresh token no backend
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken }).catch(() => {
          // Ignorar erro se não conseguir revogar
        });
      }
    } finally {
      // Limpar dados localmente mesmo se falhar no backend
      clearAuthData();
      toast.info('Logout realizado com sucesso');
      navigate('/auth');
    }
  };

  const hasRole = (...roles: UserRole[]): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true; // Admin tem acesso a tudo
    return roles.includes(user.role);
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user && !!token,
    hasRole,
    isAdmin: user?.role === 'admin',
    isGerente: user?.role === 'gerente',
    isVendedor: user?.role === 'vendedor'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
