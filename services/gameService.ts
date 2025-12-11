
import { supabase } from './supabaseClient';
import { PlayerStats, LifetimeStats, VehicleType, UserMode, VehicleUpgrades } from '../types';

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
  vehicle_upgrades: Record<VehicleType, VehicleUpgrades>; // Added
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

export interface FriendRequest {
    id: string;
    sender_id: string;
    receiver_id: string;
    created_at: string;
    profile?: {
        username: string;
        sacco: string;
    };
}

export interface GameRoom {
    id: string;
    host_id: string;
    guest_id: string;
    status: 'INVITED' | 'STAGING' | 'PLAYING' | 'CANCELLED' | 'EXPIRED';
    host_vehicle: VehicleType | null;
    guest_vehicle: VehicleType | null;
    host_ready: boolean;
    guest_ready: boolean;
    created_at: string;
    // New Map Fields
    selected_map: string | null;
    map_vote: 'PENDING' | 'APPROVE' | 'REJECT';
    // Expanded profiles
    host?: { username: string; sacco: string; };
    guest?: { username: string; sacco: string; };
}

// --- Service Layer ---
export const GameService = {
  
  /**
   * Syncs local progress to the cloud.
   */
  syncProgress: async (
    userMode: UserMode,
    userId: string | undefined, // In future this comes from auth
    data: {
      bankBalance: number;
      lifetimeStats: LifetimeStats;
      reputation: number;
      unlockedVehicles: VehicleType[];
      vehicleUpgrades: Record<VehicleType, VehicleUpgrades>; // Added
    }
  ) => {
    if (userMode === 'GUEST' || !userId) {
      return { success: true, mode: 'LOCAL' };
    }

    try {
        // Ensure values are integers for BigInt columns
        // NOTE: If vehicle_upgrades column doesn't exist in Supabase, this will fail.
        // We assume the DB schema is updated or we handle it gracefully.
        
        const payload: any = { 
            user_id: userId,
            bank_balance: Math.floor(data.bankBalance),
            total_distance: Math.floor(data.lifetimeStats.totalDistanceKm),
            total_bribes: Math.floor(data.lifetimeStats.totalBribesPaid),
            lifetime_earnings: Math.floor(data.lifetimeStats.totalCashEarned),
            reputation: Math.floor(data.reputation),
            unlocked_vehicles: data.unlockedVehicles,
            vehicle_upgrades: data.vehicleUpgrades, // JSONB
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('player_progress')
          .upsert(payload);

        if (error) {
            if (error.code === '42501') {
                console.warn('Cloud Sync Skipped: Database permissions (RLS) prevented saving.');
            } else {
                console.error('Supabase Sync Error:', error.message);
            }
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
            // console.error('Leaderboard Fetch Error:', error.message);
            return [];
        }

        const entries: LeaderboardEntry[] = data.map((row: any, index: number) => ({
            id: row.user_id,
            name: row.profiles?.username || 'Unknown Conductor',
            sacco: row.profiles?.sacco || 'Independent',
            stat: row[column],
            rank: index + 1
        }));

        return entries;

    } catch (e) {
        // console.error('Leaderboard Exception:', e);
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
            if (error.code === '42501' || error.code === 'PGRST301') {
                return true; 
            }
            return false;
        }
        
        return !data;
    } catch (e) {
        return true;
    }
  },

  /**
   * Search for conductors by username
   */
  searchConductors: async (query: string) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, sacco')
            .ilike('username', `%${query}%`)
            .neq('id', user.id)
            .limit(10);

        if (error) throw error;
        return data;
      } catch (e) {
          console.error("Search error", e);
          return [];
      }
  },

  /**
   * 1. Send Friend Request
   */
  sendFriendRequest: async (receiverId: string) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { error } = await supabase
            .from('friend_requests')
            .insert({
                sender_id: user.id,
                receiver_id: receiverId
            });

        if (error) throw error;
      } catch (error: any) {
          if (error.code === '23505') {
              throw new Error("Request already sent.");
          }
          throw error;
      }
  },

  /**
   * 2. Get Incoming Friend Requests
   */
  getFriendRequests: async (): Promise<FriendRequest[]> => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('friend_requests')
            .select(`
                id,
                sender_id,
                receiver_id,
                created_at,
                sender:profiles!sender_id (
                    username,
                    sacco
                )
            `)
            .eq('receiver_id', user.id);

        if (error) throw error;

        return data.map((item: any) => ({
            id: item.id,
            sender_id: item.sender_id,
            receiver_id: item.receiver_id,
            created_at: item.created_at,
            profile: item.sender
        }));
      } catch (e) {
          return [];
      }
  },

  /**
   * 3. Respond to Request (Accept/Reject)
   */
  respondToFriendRequest: async (requestId: string, senderId: string, action: 'ACCEPT' | 'REJECT') => {
      try {
        if (action === 'REJECT') {
            await supabase.from('friend_requests').delete().eq('id', requestId);
        } else {
            const { error } = await supabase.rpc('accept_friend_request', {
                request_id: requestId,
                friend_user_id: senderId
            });
            if (error) throw error;
        }
      } catch (e) {
          console.error("Response error", e);
      }
  },

  /**
   * Get my friends list
   */
  getFriends: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('friendships')
            .select(`
                friend_id,
                profile:profiles!friend_id (
                    username,
                    sacco
                )
            `)
            .eq('user_id', user.id);

        if (error) throw error;

        return data.map((item: any) => ({
            id: item.friend_id,
            username: item.profile?.username || 'Unknown',
            sacco: item.profile?.sacco || 'Independent'
        }));
      } catch (e) {
          return [];
      }
  },

  // --- MULTIPLAYER ROOMS ---

  /**
   * Invite a friend (Create Room)
   */
  inviteFriendToGame: async (friendId: string): Promise<string> => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { data, error } = await supabase
            .from('game_rooms')
            .insert({
                host_id: user.id,
                guest_id: friendId,
                status: 'INVITED',
                selected_map: null,
                map_vote: 'PENDING'
            })
            .select('id')
            .single();

        if (error) throw error;
        return data.id;
      } catch (e) {
          throw e;
      }
  },

  /**
   * Get pending invites for current user
   */
  getPendingGameInvites: async (): Promise<GameRoom[]> => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const cutoff = new Date(Date.now() - 120000).toISOString(); 

        const { data, error } = await supabase
            .from('game_rooms')
            .select(`
                *,
                host:profiles!host_id (username, sacco)
            `)
            .eq('guest_id', user.id)
            .eq('status', 'INVITED')
            .gt('created_at', cutoff);

        if (error) throw error;
        return data as GameRoom[];
      } catch (e) {
          return [];
      }
  },

  /**
   * Accept or Decline Invite
   */
  respondToGameInvite: async (roomId: string, action: 'ACCEPT' | 'DECLINE') => {
      try {
        if (action === 'DECLINE') {
            await supabase.from('game_rooms').update({ status: 'CANCELLED' }).eq('id', roomId);
        } else {
            await supabase.from('game_rooms').update({ status: 'STAGING' }).eq('id', roomId);
        }
      } catch (e) {
          console.error("Respond invite error", e);
      }
  },

  /**
   * Cancel Room (Host side)
   */
  cancelGameRoom: async (roomId: string) => {
      try {
        await supabase.from('game_rooms').update({ status: 'EXPIRED' }).eq('id', roomId);
      } catch (e) {
          console.error("Cancel room error", e);
      }
  },

  /**
   * Select Map (Host Only)
   */
  selectMap: async (roomId: string, mapId: string) => {
      try {
        await supabase.from('game_rooms').update({
            selected_map: mapId,
            map_vote: 'PENDING',
            updated_at: new Date().toISOString()
        }).eq('id', roomId);
      } catch (e) {
          console.error("Select map error", e);
      }
  },

  /**
   * Vote on Map (Guest Only)
   */
  voteMap: async (roomId: string, vote: 'APPROVE' | 'REJECT') => {
      try {
        await supabase.from('game_rooms').update({
            map_vote: vote,
            updated_at: new Date().toISOString()
        }).eq('id', roomId);
      } catch (e) {
          console.error("Vote map error", e);
      }
  },

  /**
   * Get Room State (For Staging)
   */
  getRoomState: async (roomId: string): Promise<GameRoom | null> => {
      try {
        const { data, error } = await supabase
            .from('game_rooms')
            .select(`
                *,
                host:profiles!host_id (username, sacco),
                guest:profiles!guest_id (username, sacco)
            `)
            .eq('id', roomId)
            .single();

        if (error) throw error;
        return data as GameRoom;
      } catch (e) {
          return null;
      }
  },

  /**
   * Update Player State in Room
   */
  updateRoomPlayerState: async (roomId: string, role: 'HOST' | 'GUEST', vehicle: VehicleType | null, ready: boolean) => {
      try {
        const updates: any = {};
        if (role === 'HOST') {
            updates.host_vehicle = vehicle;
            updates.host_ready = ready;
        } else {
            updates.guest_vehicle = vehicle;
            updates.guest_ready = ready;
        }
        updates.updated_at = new Date().toISOString();

        await supabase.from('game_rooms').update(updates).eq('id', roomId);
      } catch (e) {
          console.error("Room update error", e);
      }
  },

  /**
   * Auth Methods
   */
  signUp: async (email: string, password: string) => {
      return await supabase.auth.signUp({
          email,
          password
      });
  },

  signIn: async (email: string, password: string) => {
      return await supabase.auth.signInWithPassword({
          email,
          password
      });
  },

  getCurrentUser: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
  },

  createProfile: async (username: string, sacco: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
          throw new Error("No active session found. Please login again.");
      }
      const realUserId = user.id;
      const profileData = { username, sacco, updated_at: new Date().toISOString() };

      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles').select('id').eq('id', realUserId).maybeSingle();

      if (existingProfile) {
          const { error: updateError } = await supabase.from('profiles').update(profileData).eq('id', realUserId);
          if (updateError && updateError.code !== '42501') throw new Error(`Failed to update: ${updateError.message}`);
      } else {
          const { error: insertError } = await supabase.from('profiles').insert({ id: realUserId, ...profileData });
          if (insertError && insertError.code !== '42501') throw new Error(`Permission Denied: ${insertError.message}`);
      }
      
      await supabase.from('player_progress').insert({
          user_id: realUserId,
          bank_balance: 0,
          unlocked_vehicles: ['boda'],
          updated_at: new Date().toISOString()
      });

      return realUserId;
  },

  loadSave: async (userId: string) => {
      const profilePromise = supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      const progressPromise = supabase.from('player_progress').select('*').eq('user_id', userId).maybeSingle();
      const [profileRes, progressRes] = await Promise.all([profilePromise, progressPromise]);
      if (profileRes.error && profileRes.error.code !== '42501') throw profileRes.error;
      return { profile: profileRes.data, progress: progressRes.data };
  },

  deleteAccount: async () => {
    const { error } = await supabase.rpc('delete_own_account');
    if (error) throw error;
    await supabase.auth.signOut();
  }
};
