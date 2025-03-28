import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useSession } from '@clerk/nextjs';
import { useMemo, useRef, useEffect, useState } from 'react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Singleton instance for the Supabase client
let globalClient: SupabaseClient | null = null;
let globalToken: string | null = null;

// Increase token expiry buffer to reduce token refreshes (15 minutes)
const TOKEN_EXPIRY_BUFFER = 15 * 60 * 1000;

// Local storage key for caching
const TOKEN_CACHE_KEY = 'supabase_token_cache';

interface TokenData {
  token: string;
  expiresAt: number;
}

// Initialize token cache from localStorage if available
let tokenCache: Map<string, TokenData>;
try {
  const cached = localStorage.getItem(TOKEN_CACHE_KEY);
  tokenCache = new Map(cached ? JSON.parse(cached) : []);
} catch {
  tokenCache = new Map();
}

// Save token cache to localStorage
const persistTokenCache = () => {
  try {
    localStorage.setItem(TOKEN_CACHE_KEY, JSON.stringify(Array.from(tokenCache.entries())));
  } catch (e) {
    console.error('Failed to persist token cache:', e);
  }
};

// Hook to get authenticated Supabase client with Clerk
export function useSupabaseClient() {
  const { session, isLoaded, isSignedIn } = useSession();
  const clientRef = useRef<SupabaseClient | null>(null);
  const tokenRef = useRef<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

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

  // Initialize client on mount
  useEffect(() => {
    if (!isInitialized && isLoaded && isSignedIn && session) {
      getClient().then(() => setIsInitialized(true));
    }
  }, [isLoaded, isSignedIn, session, isInitialized]);

  // Use useMemo to prevent recreating this function on every render
  const getClient = useMemo(() => {
    return async () => {
      // Use cached client if available and token is still valid
      if (globalClient && globalToken && tokenCache.has(globalToken)) {
        const cachedData = tokenCache.get(globalToken)!;
        if (!isTokenExpired(cachedData)) {
          return globalClient;
        }
      }

      // Wait for session to be loaded
      if (!isLoaded || !isSignedIn || !session) {
        throw new Error('No active session');
      }

      try {
        // Check if we have a cached token that's still valid
        const currentToken = tokenRef.current;
        if (currentToken && tokenCache.has(currentToken)) {
          const cachedData = tokenCache.get(currentToken)!;
          if (!isTokenExpired(cachedData)) {
            return clientRef.current!;
          }
        }

        // Get new token only if needed
        const supabaseToken = await session.getToken({ template: 'supabase' });
        if (!supabaseToken) {
          throw new Error('Failed to get Supabase token');
        }

        // If token hasn't changed and is still valid, return existing client
        if (supabaseToken === tokenRef.current && clientRef.current) {
          return clientRef.current;
        }

        // Create new client
        const client = createClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: {
              Authorization: `Bearer ${supabaseToken}`
            }
          },
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false
          }
        });

        // Update cache
        const expiresAt = getTokenExpiration(supabaseToken);
        tokenCache.set(supabaseToken, { token: supabaseToken, expiresAt });
        persistTokenCache();
        
        // Update refs and global state
        clientRef.current = client;
        tokenRef.current = supabaseToken;
        globalClient = client;
        globalToken = supabaseToken;

        return client;
      } catch (error) {
        throw new Error(`Failed to initialize Supabase client: ${error}`);
      }
    };
  }, [session, isLoaded, isSignedIn]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Only cleanup if this instance owns the global client
      if (globalToken === tokenRef.current) {
        globalClient = null;
        globalToken = null;
      }
    };
  }, []);

  return {
    getClient,
    isLoaded,
    isSignedIn,
    isInitialized
  };
} 