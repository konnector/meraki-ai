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

// Token expiry buffer (2 hours instead of 15 minutes)
const TOKEN_EXPIRY_BUFFER = 2 * 60 * 60 * 1000;

// Minimum time between refresh attempts (5 minutes)
const MIN_REFRESH_INTERVAL = 5 * 60 * 1000;

// Last refresh timestamp
let lastRefreshTimestamp = 0;

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

// Function to check if token needs refresh
const needsRefresh = (tokenData: TokenData) => {
  const now = Date.now();
  return now + TOKEN_EXPIRY_BUFFER >= tokenData.expiresAt && 
         now - lastRefreshTimestamp >= MIN_REFRESH_INTERVAL;
};

// Recovery configuration
const RECOVERY_CONFIG = {
  maxRetries: 3,
  backoffDelay: 1000, // Start with 1 second
  maxBackoffDelay: 10000, // Max 10 seconds
  jitter: 0.1 // 10% random jitter
};

// Error types for better handling
enum AuthErrorType {
  TokenExpired = 'TOKEN_EXPIRED',
  NetworkError = 'NETWORK_ERROR',
  SessionError = 'SESSION_ERROR',
  Unknown = 'UNKNOWN'
}

interface AuthError extends Error {
  type: AuthErrorType;
  retryable: boolean;
}

// Create typed error
const createAuthError = (message: string, type: AuthErrorType, retryable = true): AuthError => {
  const error = new Error(message) as AuthError;
  error.type = type;
  error.retryable = retryable;
  return error;
};

// Exponential backoff with jitter
const getBackoffDelay = (attempt: number): number => {
  const delay = Math.min(
    RECOVERY_CONFIG.maxBackoffDelay,
    RECOVERY_CONFIG.backoffDelay * Math.pow(2, attempt)
  );
  const jitter = delay * RECOVERY_CONFIG.jitter * (Math.random() * 2 - 1);
  return delay + jitter;
};

// Enhanced token refresh with retry logic
const refreshTokenWithRetry = async (session: any, attempt = 0): Promise<TokenData | null> => {
  try {
    const result = await refreshToken(session);
    if (result) {
      console.log('Token refreshed successfully');
      return result;
    }
    throw createAuthError('Failed to refresh token', AuthErrorType.TokenExpired);
  } catch (error) {
    console.warn(`Token refresh attempt ${attempt + 1} failed:`, error);

    // Determine error type
    const authError = error as AuthError;
    if (!authError.retryable || attempt >= RECOVERY_CONFIG.maxRetries - 1) {
      throw createAuthError(
        'Max retry attempts reached or non-retryable error',
        authError.type || AuthErrorType.Unknown,
        false
      );
    }

    // Wait with exponential backoff
    const delay = getBackoffDelay(attempt);
    await new Promise(resolve => setTimeout(resolve, delay));

    // Retry
    return refreshTokenWithRetry(session, attempt + 1);
  }
};

// Session recovery handler
const recoverSession = async (session: any): Promise<boolean> => {
  try {
    // Clear existing state
    globalState.client = null;
    globalState.token = null;
    globalState.initializationPromise = null;

    // Attempt to get a fresh token
    const newToken = await session.getToken({ template: 'supabase' });
    if (!newToken) {
      throw createAuthError('Failed to recover session', AuthErrorType.SessionError);
    }

    // Create new client with fresh token
    const client = createSupabaseClient(newToken);
    const expiresAt = getTokenExpiration(newToken);

    // Update global state and cache
    globalState.client = client;
    globalState.token = newToken;
    globalState.lastActivity = Date.now();
    lastRefreshTimestamp = Date.now();

    return true;
  } catch (error) {
    console.error('Session recovery failed:', error);
    return false;
  }
};

// Function to refresh token
const refreshToken = async (session: any) => {
  try {
    const newToken = await session.getToken({ template: 'supabase' });
    if (newToken) {
      const expiresAt = getTokenExpiration(newToken);
      globalState.token = newToken;
      lastRefreshTimestamp = Date.now();
      return { token: newToken, expiresAt };
    }
  } catch (error) {
    console.warn('Token refresh failed:', error);
  }
  return null;
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
  const [isRecovering, setIsRecovering] = useState(false);
  const tokenCache = useMemo(() => getTokenCache(), []);
  const initializationRef = useRef(false);
  const recoveryAttempts = useRef(0);

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

  // Add enhanced token refresh interval with recovery
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !session) return;

    const refreshInterval = setInterval(async () => {
      if (isRecovering) return;

      try {
        if (globalState.token && tokenCache.has(globalState.token)) {
          const tokenData = tokenCache.get(globalState.token)!;
          if (needsRefresh(tokenData)) {
            const refreshedToken = await refreshTokenWithRetry(session);
            if (refreshedToken) {
              tokenCache.set(refreshedToken.token, refreshedToken);
              persistTokenCache(tokenCache);
              if (globalState.client) {
                globalState.client.auth.setSession({ 
                  access_token: refreshedToken.token,
                  refresh_token: ''
                });
              }
              recoveryAttempts.current = 0; // Reset recovery attempts on success
            }
          }
        }
      } catch (error) {
        const authError = error as AuthError;
        console.error('Token refresh failed:', authError);

        // Attempt recovery if error is retryable and we haven't exceeded attempts
        if (authError.retryable && recoveryAttempts.current < RECOVERY_CONFIG.maxRetries) {
          setIsRecovering(true);
          recoveryAttempts.current++;

          try {
            const recovered = await recoverSession(session);
            if (recovered) {
              console.log('Session recovered successfully');
              recoveryAttempts.current = 0;
            } else {
              console.error('Session recovery failed');
            }
          } finally {
            setIsRecovering(false);
          }
        }
      }
    }, MIN_REFRESH_INTERVAL);

    return () => clearInterval(refreshInterval);
  }, [isLoaded, isSignedIn, session, tokenCache, isRecovering]);

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
    isInitialized,
    isRecovering
  };
} 