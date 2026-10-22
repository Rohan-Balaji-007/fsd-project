import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase.js';
import { api } from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch full student profile from Express backend using the active JWT
  const fetchProfile = useCallback(async () => {
    try {
      const response = await api.get('/profile/me');
      if (response?.success && response?.data) {
        setProfile(response.data);
        return response.data;
      }
    } catch (err) {
      console.warn('[AuthContext] Could not fetch profile:', err.message);
    }
    return null;
  }, []);

  // Initialize session and listen to auth state changes
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('[AuthContext] Session retrieval error:', error);
        }

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          if (initialSession?.user) {
            await fetchProfile();
          }
        }
      } catch (err) {
        console.error('[AuthContext] Init error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    // Listen to Supabase auth events (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await fetchProfile();
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  // Sign In
  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    setUser(data.user);
    setSession(data.session);
    const userProfile = await fetchProfile();

    return { user: data.user, profile: userProfile };
  };

  // Sign Up
  const register = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'student'
        }
      }
    });

    if (error) throw error;

    setUser(data.user);
    setSession(data.session);
    if (data.session) {
      await fetchProfile();
    }

    return data;
  };

  // Sign Out
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  // Profile completion check:
  // A profile is complete when the student has defined department and at least one skill
  const isProfileComplete = Boolean(
    profile &&
    profile.department &&
    profile.department.trim() !== '' &&
    profile.skills &&
    profile.skills.length > 0
  );

  const value = {
    user,
    profile,
    session,
    loading,
    isProfileComplete,
    login,
    register,
    logout,
    refreshProfile: fetchProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
