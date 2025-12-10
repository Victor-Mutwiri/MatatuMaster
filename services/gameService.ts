
import { supabase } from './supabaseClient';
import { PlayerStats, LifetimeStats, VehicleType, UserMode } from '../types';

// --- Types mirroring the Supabase DB Schema ---
export interface DBProfile {
  id: string;
  username: string;
  sacco: string;
  updated_at?: string;
}

export interface DBProgress {
  user_id: string;
  bank_balance: number;
  total_distance: number;
  total_bribes: number;
  reputation: number;
  unlocked_vehicles: VehicleType[];
  lifetime_earnings: number;
  updated_at?: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  sacco: string;
  stat: number;
  rank: number;
}

// --- Service Layer ---
export const GameService = {
  
  /**
   * Syncs local progress to the cloud.
   * If GUEST: Does nothing (Local persistence handled by Zustand).
   * If REGISTERED: Pushes to Supabase.
   */
  syncProgress: async (
    userMode: UserMode,
    userId: string | undefined, // In future this comes from auth
    data: {
      bankBalance: number;
      lifetimeStats: LifetimeStats;
      reputation: number;
      unlockedVehicles: VehicleType[];
    }
  ) => {
    if (userMode === 'GUEST' || !userId) {
      console.log('Skipping cloud sync (Guest Mode or No User ID)');
      return { success: true, mode: 'LOCAL' };
    }

    try {
        const { error } = await supabase
          .from('player_progress')
          .upsert({ 
            user_id: userId,
            bank_balance: data.bankBalance,
            total_distance: data.lifetimeStats.totalDistanceKm,
            total_bribes: data.lifetimeStats.totalBribesPaid,
            lifetime_earnings: data.lifetimeStats.totalCashEarned,
            reputation: data.reputation,
            unlocked_vehicles: data.unlockedVehicles,
            updated_at: new Date().toISOString()
          });

        if (error) {
            console.error('Supabase Sync Error:', error);
            return { success: false, mode: 'CLOUD' };
        }

        return { success: true, mode: 'CLOUD' };
    } catch (e) {
        console.error('Sync Exception:', e);
        return { success: false, mode: 'CLOUD' };
    }
  },

  /**
   * Fetches the leaderboard.
   * Joins 'player_progress' with 'profiles' to get names.
   */
  getLeaderboard: async (metric: 'CASH' | 'DISTANCE' | 'BRIBES'): Promise<LeaderboardEntry[]> => {
    try {
        let column = 'lifetime_earnings';
        if (metric === 'DISTANCE') column = 'total_distance';
        if (metric === 'BRIBES') column = 'total_bribes';

        const { data, error } = await supabase
            .from('player_progress')
            .select(`
                user_id,
                ${column},
                profiles (
                    username,
                    sacco
                )
            `)
            .order(column, { ascending: false })
            .limit(50);

        if (error) {
            console.error('Leaderboard Fetch Error:', error);
            return [];
        }

        // Transform Supabase response to app format
        const entries: LeaderboardEntry[] = data.map((row: any, index: number) => ({
            id: row.user_id,
            name: row.profiles?.username || 'Unknown Conductor',
            sacco: row.profiles?.sacco || 'Independent',
            stat: row[column],
            rank: index + 1
        }));

        return entries;

    } catch (e) {
        console.error('Leaderboard Exception:', e);
        return [];
    }
  },

  /**
   * Checks if a username is taken.
   */
  checkUsernameAvailability: async (username: string): Promise<boolean> => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('username')
            .eq('username', username)
            .maybeSingle();
        
        if (error) {
            console.error("Check Username Error:", error);
            return false;
        }
        
        return !data; // Available if no data found
    } catch (e) {
        return false;
    }
  },

  /**
   * Sign Up Flow
   */
  signUp: async (email: string, password: string) => {
      return await supabase.auth.signUp({
          email,
          password
      });
  },

  /**
   * Sign In Flow
   */
  signIn: async (email: string, password: string) => {
      return await supabase.auth.signInWithPassword({
          email,
          password
      });
  },

  /**
   * Get Current User (Helper)
   */
  getCurrentUser: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
  },

  /**
   * Create Profile (Post-Auth)
   * IMPORTANT: This now ignores the passed userId argument for security,
   * fetching the ID directly from the active session to satisfy RLS.
   */
  createProfile: async (username: string, sacco: string) => {
      // 1. Get the TRUTH from the auth session
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
          throw new Error("No active session found. Please login again.");
      }

      const realUserId = user.id;

      const profileData = {
          id: realUserId,
          username,
          sacco,
          updated_at: new Date().toISOString()
      };

      // 2. Try INSERT first. This often bypasses ambiguous RLS 'Upsert' restrictions on new rows.
      // We assume if they are creating a profile, one doesn't exist.
      const { error: insertError } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();
      
      if (insertError) {
          // If error is duplicate key (23505), we try Update/Upsert
          // If error is RLS (42501), it might be that we have update rights but not insert? 
          // (Rare for new user, but possible if phantom row exists).
          console.warn("Insert Profile Failed, attempting Upsert fallback...", insertError.code);
          
          const { error: upsertError } = await supabase
            .from('profiles')
            .upsert(profileData)
            .select()
            .single();

          if (upsertError) {
              console.error("Profile Creation Error:", upsertError);
              if (upsertError.code === '42501') {
                   throw new Error("Permission Denied: Cannot create profile. Database security policy blocked this action.");
              }
              throw new Error(`Database Error: ${upsertError.message}`);
          }
      }
      
      // 3. Initialize progress entry
      const { error: progressError } = await supabase.from('player_progress').upsert({
          user_id: realUserId,
          bank_balance: 0,
          unlocked_vehicles: ['boda'],
          updated_at: new Date().toISOString()
      });

      if (progressError) {
          console.error("Progress Init Error:", progressError);
          // Non-fatal
      }

      return realUserId;
  },

  /**
   * Load Profile & Progress
   */
  loadSave: async (userId: string) => {
      // Use maybeSingle() to avoid 406 Not Acceptable errors if the user exists in Auth but has no Profile data yet.
      const profilePromise = supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      const progressPromise = supabase.from('player_progress').select('*').eq('user_id', userId).maybeSingle();

      const [profileRes, progressRes] = await Promise.all([profilePromise, progressPromise]);

      if (profileRes.error) throw profileRes.error;
      
      return {
          profile: profileRes.data, // Can be null now, handled by UI
          progress: progressRes.data
      };
  }
};
