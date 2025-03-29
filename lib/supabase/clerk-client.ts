import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useSession } from '@clerk/nextjs';
import { useMemo, useEffect, useState, useRef } from 'react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Singleton state
const globalState = {
  client: null as SupabaseClient | null,
  token: null as string | null,
  initializationPromise: null as Promise<SupabaseClient> | null,
  lastActivity: Date.now()
};

// Token expiry buffer (15 minutes)
const TOKEN_EXPIRY_BUFFER = 15 * 60 * 1000;

// Local storage key for caching
const TOKEN_CACHE_KEY = 'supabase_token_cache';

interface TokenData {
  token: string;
  expiresAt: number;
}

// Initialize token cache from localStorage if available
const getTokenCache = (): Map<string, TokenData> => {
  try {
    const cached = localStorage.getItem(TOKEN_CACHE_KEY);
    return new Map(cached ? JSON.parse(cached) : []);
  } catch {
    return new Map();
  }
};

// Save token cache to localStorage
const persistTokenCache = (tokenCache: Map<string, TokenData>) => {
  try {
    localStorage.setItem(TOKEN_CACHE_KEY, JSON.stringify(Array.from(tokenCache.entries())));
  } catch (e) {
    console.error('Failed to persist token cache:', e);
  }
};

// Function to check if token is expired or about to expire
const isTokenExpired = (tokenData: TokenData) => {
  return Date.now() + TOKEN_EXPIRY_BUFFER >= tokenData.expiresAt;
};

// Function to decode JWT and get expiration
const getTokenExpiration = (token: string): number => {
  try {
    const [, payload] = token.split('.');
    const decoded = JSON.parse(atob(payload));
    return decoded.exp * 1000; // Convert to milliseconds
  } catch {
    return Date.now() + 3600 * 1000; // Default to 1 hour if can't decode
  }
};

// Create a new Supabase client instance
const createSupabaseClient = (supabaseToken: string): SupabaseClient => {
  // If we already have a client, just update its headers
  if (globalState.client) {
    // Update auth headers safely
    globalState.client.auth.setSession({ access_token: supabaseToken, refresh_token: '' });
    return globalState.client;
  }

  // Create new client only if one doesn't exist
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${supabaseToken}`
      }
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storageKey: `sb-${supabaseUrl}-auth-token` // Consistent storage key
    }
  });

  return client;
};

// Hook to get authenticated Supabase client with Clerk
export function useSupabaseClient() {
  const { session, isLoaded, isSignedIn } = useSession();
  const [isInitialized, setIsInitialized] = useState(false);
  const tokenCache = useMemo(() => getTokenCache(), []);
  const initializationRef = useRef(false);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        globalState.lastActivity = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Initialize client on mount
  useEffect(() => {
    if (!isInitialized && isLoaded && isSignedIn && session && !initializationRef.current) {
      initializationRef.current = true;
      getClient().then(() => setIsInitialized(true));
    }
  }, [isLoaded, isSignedIn, session, isInitialized]);

  // Use useMemo to prevent recreating this function on every render
  const getClient = useMemo(() => {
    return async () => {
      // Use cached client if available and token is still valid
      if (globalState.client && globalState.token && tokenCache.has(globalState.token)) {
        const cachedData = tokenCache.get(globalState.token)!;
        if (!isTokenExpired(cachedData)) {
          return globalState.client;
        }
      }

      // Wait for session to be loaded
      if (!isLoaded || !isSignedIn || !session) {
        throw new Error('No active session');
      }

      // If a client initialization is already in progress, wait for it
      if (globalState.initializationPromise) {
        return globalState.initializationPromise;
      }

      // Create new initialization promise
      globalState.initializationPromise = (async () => {
        try {
          // Get new token
          const supabaseToken = await session.getToken({ template: 'supabase' });
          if (!supabaseToken) {
            throw new Error('Failed to get Supabase token');
          }

          // If token hasn't changed and client exists, return existing client
          if (supabaseToken === globalState.token && globalState.client) {
            return globalState.client;
          }

          // Create new client
          const client = createSupabaseClient(supabaseToken);

          // Update cache
          const expiresAt = getTokenExpiration(supabaseToken);
          tokenCache.set(supabaseToken, { token: supabaseToken, expiresAt });
          persistTokenCache(tokenCache);
          
          // Update global state
          globalState.client = client;
          globalState.token = supabaseToken;
          globalState.lastActivity = Date.now();

          return client;
        } finally {
          globalState.initializationPromise = null;
        }
      })();

      return globalState.initializationPromise;
    };
  }, [session, isLoaded, isSignedIn, tokenCache]);

  return {
    getClient,
    isLoaded,
    isSignedIn,
    isInitialized
  };
} 