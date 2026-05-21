import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      // SUPABASE AUTH FLOW
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setToken(session.access_token);
          fetchProfile(session.user);
        } else {
          setIsLoading(false);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          setToken(session.access_token);
          fetchProfile(session.user);
        } else {
          setUser(null);
          setToken(null);
          setIsLoading(false);
        }
      });

      return () => subscription.unsubscribe();
    } else {
      // LOCAL MOCK FLOW
      const storedToken = localStorage.getItem('nutripath_token');
      if (storedToken) {
        setToken(storedToken);
        fetch('/api/user/me', { headers: { 'Authorization': `Bearer ${storedToken}` } })
        .then(res => res.json())
        .then(data => {
          if (data.user) setUser(data.user);
          else {
            localStorage.removeItem('nutripath_token');
            setToken(null);
          }
        })
        .catch(() => {
          localStorage.removeItem('nutripath_token');
          setToken(null);
        })
        .finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  const fetchProfile = async (authUser: any) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
      if (error) throw error;
      
      setUser({
        id: authUser.id,
        name: data.name || '',
        email: data.email || '',
        avatarUrl: data.avatar_url,
        preferences: {
          calorieTarget: data.calorie_target || 2000,
          proteinTarget: data.protein_target || 150,
          notifications: data.notifications ?? true,
          dataSharing: data.data_sharing ?? false,
        }
      });
    } catch (err) {
      console.error('Error fetching profile', err);
    } finally {
      setIsLoading(false);
    }
  };

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    if (!isSupabaseConfigured) {
      localStorage.setItem('nutripath_token', newToken);
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    } else {
      setToken(null);
      setUser(null);
      localStorage.removeItem('nutripath_token');
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};

