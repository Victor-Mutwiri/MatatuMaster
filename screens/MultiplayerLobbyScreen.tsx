
import React, { useState, useEffect, useRef } from 'react';
import { GameLayout } from '../components/layout/GameLayout';
import { Button } from '../components/ui/Button';
import { useGameStore, VEHICLE_SPECS, MAP_DEFINITIONS } from '../store/gameStore';
import { VehicleType, Route } from '../types';
import { ArrowLeft, Wifi, UserPlus, PlayCircle, Lock, Search, Users, Copy, Check, Send, User, Car, Zap, Shield, TrendingUp, Bike, ShoppingCart, CheckCircle2, Loader2, X, Bell, UserCheck, Gamepad2, Timer, Map, ThumbsUp, ThumbsDown, ChevronLeft, ChevronRight, AlertCircle, Hourglass } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { GameService, FriendRequest, GameRoom } from '../services/gameService';

// --- Types ---
interface Friend {
  id: string;
  name: string;
  sacco: string;
  status: 'IDLE' | 'IN_GAME' | 'INVITED' | 'IN_ROOM';
  isOnline: boolean; 
}

interface SearchResult {
  id: string;
  username: string;
  sacco: string;
}

const VEHICLE_ICONS: Record<VehicleType, React.ReactNode> = {
  'boda': <Bike />,
  'tuktuk': <ShoppingCart />,
  'personal-car': <Car />,
  '14-seater': <Zap />,
  '32-seater': <Shield />,
  '52-seater': <TrendingUp />,
};

export const MultiplayerLobbyScreen: React.FC = () => {
  const { setScreen, playerName, saccoName, unlockedVehicles, setVehicleType, userId, selectRoute } = useGameStore();
  
  // View State: 'LOBBY' (Friend list) or 'ROOM' (Staging area)
  const [viewState, setViewState] = useState<'LOBBY' | 'ROOM'>('LOBBY');
  
  // Local State for Social Features
  const [activeTab, setActiveTab] = useState<'FRIENDS' | 'REQUESTS' | 'ADD'>('FRIENDS');
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sentRequests, setSentRequests] = useState<string[]>([]);
  
  // Data State
  const [friendsList, setFriendsList] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // Invite State
  const [incomingInvite, setIncomingInvite] = useState<GameRoom | null>(null);
  const [inviteTimer, setInviteTimer] = useState(0); // Seconds remaining
  
  // Room State (Realtime)
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [roomState, setRoomState] = useState<GameRoom | null>(null);
  const [myRole, setMyRole] = useState<'HOST' | 'GUEST' | null>(null);
  const [roomTimeRemaining, setRoomTimeRemaining] = useState<number | null>(null); // For Host timeout
  
  // -- MAP SELECTION STATE (Host) --
  const [hostSelectedMapIndex, setHostSelectedMapIndex] = useState(0);
  const [isMapConfirming, setIsMapConfirming] = useState(false);

  // -- LOCAL STAGING STATE --
  const [mySelectedVehicle, setMySelectedVehicle] = useState<VehicleType | null>(null);
  const [isMyReady, setIsMyReady] = useState(false);
  
  const [launchCountdown, setLaunchCountdown] = useState<number | null>(null);

  // Unique ID (Visual)
  const uniqueId = btoa(playerName).substring(0, 8).toUpperCase();

  // --- 1. Load Friends and Requests on Mount ---
  useEffect(() => {
    fetchSocialData();
    const interval = setInterval(fetchSocialData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchSocialData = async () => {
      try {
          const rawFriends = await GameService.getFriends();
          const processedFriends: Friend[] = rawFriends.map(f => ({
              id: f.id,
              name: f.username,
              sacco: f.sacco,
              status: 'IDLE',
              isOnline: true 
          }));
          setFriendsList(processedFriends);

          const requests = await GameService.getFriendRequests();
          setIncomingRequests(requests);
      } catch (e) {
          // Silent catch to prevent UI freeze, logs in service
      } 
  };

  // --- 2. Poll for Incoming Invites (Lobby Only) ---
  useEffect(() => {
      if (viewState !== 'LOBBY') return;

      const pollInvites = async () => {
          try {
              const invites = await GameService.getPendingGameInvites();
              if (invites.length > 0) {
                  // Prefer newest invite
                  const newest = invites.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
                  setIncomingInvite(newest);
              } else {
                  setIncomingInvite(null);
              }
          } catch (e) {
              console.error("Poll invites error", e);
          }
      };

      // Initial check
      pollInvites();
      
      const interval = setInterval(pollInvites, 3000); 
      return () => clearInterval(interval);
  }, [viewState]);

  // --- 3. Invite Timer Logic (Receiver Side) ---
  useEffect(() => {
      if (!incomingInvite) {
          setInviteTimer(0);
          return;
      }

      const updateTimer = () => {
          const created = new Date(incomingInvite.created_at).getTime();
          const expires = created + 30000; // 30s expiry
          const now = Date.now();
          const left = Math.ceil((expires - now) / 1000);
          
          if (left <= 0) {
              setIncomingInvite(null); // Expired locally
          } else {
              setInviteTimer(left);
          }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
  }, [incomingInvite]);

  // --- 4. Room State Polling & Host Timeout (Room Only) ---
  useEffect(() => {
      if (viewState !== 'ROOM' || !activeRoomId) return;

      const pollRoom = async () => {
          try {
              const room = await GameService.getRoomState(activeRoomId);
              if (room) {
                  setRoomState(room);
                  
                  // Handle Cancelled / Expired
                  if (room.status === 'CANCELLED' || room.status === 'EXPIRED') {
                      alert("Room was closed or timed out.");
                      handleBack(); 
                      return;
                  }

                  // Determine Role if not set
                  if (!myRole && userId) {
                      if (room.host_id === userId) setMyRole('HOST');
                      else if (room.guest_id === userId) setMyRole('GUEST');
                  }

                  // --- Host Timeout Logic ---
                  // If I am Host AND room is still 'INVITED', check expiry
                  if (room.host_id === userId && room.status === 'INVITED') {
                      const created = new Date(room.created_at).getTime();
                      const expires = created + 30000; // 30s
                      const now = Date.now();
                      const left = Math.ceil((expires - now) / 1000);
                      
                      setRoomTimeRemaining(Math.max(0, left));

                      if (left <= 0) {
                          // Expire it
                          await GameService.cancelGameRoom(room.id);
                          setRoomState({ ...room, status: 'EXPIRED' });
                      }
                  } else {
                      setRoomTimeRemaining(null);
                  }
              }
          } catch(e) {
              // Ignore fetch errors during polling
          }
      };

      pollRoom(); // Immediate
      const interval = setInterval(pollRoom, 1000); 
      return () => clearInterval(interval);
  }, [viewState, activeRoomId, userId, myRole]);

  // --- 5. Sync Local State to Room ---
  useEffect(() => {
      if (viewState === 'ROOM' && activeRoomId && myRole && roomState && roomState.status === 'STAGING') {
          // Only sync readiness if map is approved
          if (roomState.map_vote === 'APPROVE') {
              GameService.updateRoomPlayerState(activeRoomId, myRole, mySelectedVehicle, isMyReady);
          }
      }
  }, [mySelectedVehicle, isMyReady, activeRoomId, myRole, viewState, roomState?.status, roomState?.map_vote]);

  // --- Handlers ---

  const handleBack = () => {
    if (viewState === 'ROOM') {
        // Leave Room Logic
        if (activeRoomId && myRole && roomState && roomState.status !== 'EXPIRED') {
             // If I am host leaving, I cancel. If guest, I decline.
             GameService.respondToGameInvite(activeRoomId, 'DECLINE');
        }
        setViewState('LOBBY');
        setActiveRoomId(null);
        setRoomState(null);
        setMyRole(null);
        setIsMyReady(false);
        setMySelectedVehicle(null);
        setRoomTimeRemaining(null);
    } else {
        setScreen('GAME_MODE');
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    const delayDebounceFn = setTimeout(async () => {
        const results = await GameService.searchConductors(query);
        setSearchResults(results);
        setIsSearching(false);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  };

  const sendRequest = async (user: SearchResult) => {
    try {
        await GameService.sendFriendRequest(user.id);
        setSentRequests(prev => [...prev, user.id]);
    } catch (e: any) {
        if (e.message && e.message.includes("already")) {
            setSentRequests(prev => [...prev, user.id]);
        } else {
            console.error("Send request error", e);
        }
    }
  };

  const handleRequestResponse = async (req: FriendRequest, action: 'ACCEPT' | 'REJECT') => {
      try {
          await GameService.respondToFriendRequest(req.id, req.sender_id, action);
          setIncomingRequests(prev => prev.filter(r => r.id !== req.id));
          if (action === 'ACCEPT' && req.profile) {
              const newFriend: Friend = {
                  id: req.sender_id,
                  name: req.profile.username,
                  sacco: req.profile.sacco,
                  status: 'IDLE',
                  isOnline: true
              };
              setFriendsList(prev => [...prev, newFriend]);
              setActiveTab('FRIENDS');
          }
      } catch (e) {
          console.error("Response error", e);
      }
  };

  // --- Game Invite Logic ---

  const sendGameInvite = async (friendId: string) => {
      try {
          const roomId = await GameService.inviteFriendToGame(friendId);
          setActiveRoomId(roomId);
          setMyRole('HOST');
          setViewState('ROOM');
          // Start optimistic timer
          setRoomTimeRemaining(30);
      } catch (e) {
          console.error("Invite failed", e);
          alert("Failed to create room. Check connection.");
      }
  };

  const acceptInvite = async () => {
      if (incomingInvite) {
          await GameService.respondToGameInvite(incomingInvite.id, 'ACCEPT');
          setActiveRoomId(incomingInvite.id);
          setMyRole('GUEST');
          setViewState('ROOM');
          setIncomingInvite(null); // Clear local
      }
  };

  const declineInvite = async () => {
      if (incomingInvite) {
          await GameService.respondToGameInvite(incomingInvite.id, 'DECLINE');
          setIncomingInvite(null);
      }
  };

  // --- Map Selection Logic ---
  const handleMapCycle = (direction: -1 | 1) => {
      setHostSelectedMapIndex(prev => {
          let next = prev + direction;
          if (next < 0) next = MAP_DEFINITIONS.length - 1;
          if (next >= MAP_DEFINITIONS.length) next = 0;
          return next;
      });
  };

  const handleHostConfirmMap = async () => {
      if (!activeRoomId) return;
      setIsMapConfirming(true);
      const selected = MAP_DEFINITIONS[hostSelectedMapIndex];
      await GameService.selectMap(activeRoomId, selected.id);
      setIsMapConfirming(false);
  };

  const handleGuestVoteMap = async (vote: 'APPROVE' | 'REJECT') => {
      if (!activeRoomId) return;
      await GameService.voteMap(activeRoomId, vote);
  };

  // Launch Logic
  useEffect(() => {
    if (viewState === 'ROOM' && roomState && roomState.map_vote === 'APPROVE') {
        const hostReady = roomState.host_ready && roomState.host_vehicle;
        const guestReady = roomState.guest_ready && roomState.guest_vehicle;

        if (hostReady && guestReady) {
            if (launchCountdown === null) setLaunchCountdown(3);
        } else {
            setLaunchCountdown(null);
        }
    }
  }, [roomState, viewState]);

  useEffect(() => {
      if (launchCountdown !== null) {
          const interval = setInterval(() => {
              setLaunchCountdown(prev => {
                  if (prev === null) return null;
                  if (prev <= 0) {
                      clearInterval(interval);
                      // Apply Map and Vehicle
                      if (roomState?.selected_map) {
                          const route = MAP_DEFINITIONS.find(m => m.id === roomState.selected_map);
                          if (route) selectRoute(route);
                      }
                      if (mySelectedVehicle) {
                          setVehicleType(mySelectedVehicle);
                          setScreen('MAP_SELECT'); // Actually goes to map select logic but route is pre-selected
                          // Force Game Start immediately since we did staging
                          setTimeout(() => useGameStore.getState().startGameLoop(), 100);
                      }
                      return 0;
                  }
                  return prev - 1;
              });
          }, 1000);
          return () => clearInterval(interval);
      }
  }, [launchCountdown, mySelectedVehicle, setVehicleType, setScreen, roomState, selectRoute]);


  // --- RENDER: ROOM VIEW ---
  if (viewState === 'ROOM') {
      const isRoomReady = roomState?.status === 'STAGING';
      const isMapPhase = !roomState?.selected_map || roomState?.map_vote !== 'APPROVE';
      
      const opponentName = myRole === 'HOST' ? roomState?.guest?.username : roomState?.host?.username;
      
      // 1. HOST WAITING SCREEN (Before Map Select)
      if (myRole === 'HOST' && roomState?.status === 'INVITED') {
          return (
            <GameLayout noMaxWidth className="bg-slate-950">
               <div className="flex flex-col h-full w-full max-w-lg mx-auto p-6 items-center justify-center relative">
                  
                  <div className="absolute top-4 left-4 z-20">
                      <button onClick={handleBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700 shadow-lg"><ArrowLeft size={20} /></button>
                  </div>

                  <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full shadow-2xl text-center space-y-6">
                      <div className="w-20 h-20 mx-auto bg-slate-800 rounded-full flex items-center justify-center animate-pulse border border-slate-600">
                          <Hourglass className="text-matatu-yellow" size={40} />
                      </div>
                      
                      <div>
                          <h2 className="font-display text-2xl font-bold text-white uppercase tracking-wider mb-2">Invite Sent</h2>
                          <p className="text-slate-400">Waiting for <span className="text-white font-bold">{opponentName || 'Player'}</span> to accept...</p>
                      </div>

                      <div className="bg-black/30 rounded-lg p-3 inline-flex items-center gap-2 border border-slate-800">
                          <Timer size={16} className="text-orange-400" />
                          <span className="font-mono text-white">{roomTimeRemaining}s</span>
                      </div>

                      <div className="text-xs text-slate-500">
                          Room will expire automatically if they don't join.
                      </div>
                      
                      <Button variant="danger" size="sm" onClick={handleBack}>Cancel Invite</Button>
                  </div>
               </div>
            </GameLayout>
          );
      }

      // 2. MAP SELECTION PHASE
      if (isMapPhase) {
          const hostMap = MAP_DEFINITIONS[hostSelectedMapIndex];
          const selectedMapId = roomState?.selected_map;
          const voteStatus = roomState?.map_vote;
          
          // Determine which map to show
          // If voteStatus is REJECTED, host sees their LOCAL selection (to allow picking a new one)
          // Otherwise (PENDING or nothing selected yet), show the DB selection or host local if nothing in DB
          let mapToDisplay = hostMap; 
          
          if (selectedMapId && voteStatus !== 'REJECT') {
              mapToDisplay = MAP_DEFINITIONS.find(m => m.id === selectedMapId) || hostMap;
          }

          const canInteractWithArrows = myRole === 'HOST' && (voteStatus === 'REJECT' || !selectedMapId);

          return (
            <GameLayout noMaxWidth className="bg-slate-950">
               <div className="flex flex-col h-full w-full max-w-4xl mx-auto p-4 md:p-6 items-center justify-center relative">
                  
                  <div className="absolute top-4 left-4 z-20">
                        <button onClick={handleBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700 shadow-lg"><ArrowLeft size={20} /></button>
                  </div>

                  <h2 className="font-display text-2xl font-bold text-white uppercase tracking-wider mb-8 flex items-center gap-3">
                      <Map className="text-matatu-yellow" size={24} /> 
                      {myRole === 'HOST' ? (voteStatus === 'REJECT' ? "Select New Track" : "Select a Track") : "Map Voting"}
                  </h2>

                  {/* MAP CARD */}
                  <div className="relative w-full max-w-md bg-slate-900 border-2 border-slate-700 rounded-2xl overflow-hidden shadow-2xl mb-8">
                      <div className="h-40 bg-slate-800 relative">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#64748b_1px,transparent_1px)] bg-[size:20px_20px] opacity-20"></div>
                          {/* Navigation Arrows for Host - Only clickable if interaction allowed */}
                          {canInteractWithArrows && (
                              <>
                                <button onClick={() => handleMapCycle(-1)} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full hover:bg-matatu-yellow hover:text-black transition-colors z-10"><ChevronLeft size={24} /></button>
                                <button onClick={() => handleMapCycle(1)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full hover:bg-matatu-yellow hover:text-black transition-colors z-10"><ChevronRight size={24} /></button>
                              </>
                          )}
                          <div className="absolute bottom-4 left-4">
                              <h3 className="font-display font-bold text-2xl text-white uppercase leading-none">{mapToDisplay?.name || "Selecting..."}</h3>
                              <p className="text-xs text-slate-400 mt-1">{mapToDisplay?.distance} KM • {mapToDisplay?.dangerLevel}</p>
                          </div>
                      </div>
                      <div className="p-6">
                          <p className="text-slate-300 text-sm leading-relaxed mb-4">{mapToDisplay?.description || "Waiting for host..."}</p>
                          
                          {/* FEEDBACK STATUS AREA */}
                          <div className={`bg-black/30 rounded-xl p-4 flex items-center justify-between border border-slate-800 ${voteStatus === 'REJECT' ? 'border-red-500/50 bg-red-900/10' : ''}`}>
                              <div className="flex items-center gap-3">
                                  <div className={`w-3 h-3 rounded-full ${voteStatus === 'REJECT' ? 'bg-red-500 animate-pulse' : voteStatus === 'APPROVE' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                  <span className={`text-xs font-bold uppercase ${voteStatus === 'REJECT' ? 'text-red-300' : 'text-slate-400'}`}>
                                      {voteStatus === 'PENDING' ? (selectedMapId ? "Vote Pending..." : "Selection Pending") : 
                                       voteStatus === 'REJECT' ? "Opponent Rejected - Pick Another" : "Map Approved"}
                                  </span>
                              </div>
                              {voteStatus === 'REJECT' && <AlertCircle className="text-red-500" size={20} />}
                          </div>
                      </div>
                  </div>

                  {/* CONTROLS */}
                  <div className="w-full max-w-md flex gap-4">
                      {myRole === 'HOST' ? (
                          <Button 
                            fullWidth 
                            size="lg" 
                            onClick={handleHostConfirmMap} 
                            disabled={isMapConfirming || (voteStatus === 'PENDING' && selectedMapId === mapToDisplay?.id)}
                            className={voteStatus === 'REJECT' ? "border-red-500" : ""}
                          >
                              {voteStatus === 'REJECT' ? "Propose New Map" : 
                               selectedMapId === mapToDisplay?.id ? "Waiting for Vote..." : "Propose Map"}
                          </Button>
                      ) : (
                          <>
                            {selectedMapId ? (
                                <>
                                    <Button variant="danger" fullWidth onClick={() => handleGuestVoteMap('REJECT')} disabled={voteStatus !== 'PENDING'}>
                                        <ThumbsDown size={20} className="mr-2" /> Veto
                                    </Button>
                                    <Button variant="primary" fullWidth onClick={() => handleGuestVoteMap('APPROVE')} disabled={voteStatus !== 'PENDING'}>
                                        <ThumbsUp size={20} className="mr-2" /> Accept
                                    </Button>
                                </>
                            ) : (
                                <div className="text-center w-full text-slate-500 animate-pulse">Waiting for Host to propose...</div>
                            )}
                          </>
                      )}
                  </div>

               </div>
            </GameLayout>
          );
      }

      // --- VEHICLE SELECTION PHASE (Original Staging UI) ---
      const opponentSacco = myRole === 'HOST' ? roomState?.guest?.sacco : roomState?.host?.sacco;
      const opponentVehicle = myRole === 'HOST' ? roomState?.guest_vehicle : roomState?.host_vehicle;
      const opponentReady = myRole === 'HOST' ? roomState?.guest_ready : roomState?.host_ready;

      return (
        <GameLayout noMaxWidth className="bg-slate-950">
             <div className="flex flex-col h-full w-full max-w-6xl mx-auto p-4 md:p-6 lg:gap-8 relative">
                
                {/* Room Header */}
                <div className="flex items-center justify-between mb-6 z-20">
                    <div className="flex items-center gap-4">
                        <button onClick={handleBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-all border border-slate-700 shadow-lg active:scale-95 shrink-0"><ArrowLeft size={20} /></button>
                        <div>
                            <h2 className="font-display text-2xl font-bold text-white uppercase tracking-wider leading-none">Garage</h2>
                            <p className="text-slate-400 text-xs uppercase tracking-widest mt-1">Map Approved: {MAP_DEFINITIONS.find(m => m.id === roomState?.selected_map)?.name}</p>
                        </div>
                    </div>
                    
                    {/* Status Indicator */}
                    <div className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-full flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${launchCountdown !== null ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
                        <span className="text-xs font-bold uppercase text-slate-300">
                             {launchCountdown !== null ? 'Launching...' : 'Players Selecting...'}
                        </span>
                    </div>
                </div>

                <div className="flex-1 flex flex-col md:flex-row gap-4 md:gap-8 items-stretch justify-center pb-20 md:pb-0">
                    
                    {/* PLAYER 1 (YOU) */}
                    <div className={`flex-1 bg-slate-900/50 border-2 rounded-3xl p-6 flex flex-col transition-all duration-300 ${isMyReady ? 'border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.1)]' : 'border-slate-800'}`}>
                         <div className="flex items-center gap-4 mb-6"><div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-600 shadow-lg"><User className="text-matatu-yellow" size={32} /></div><div><div className="text-white font-display font-bold text-xl">{playerName}</div><div className="text-matatu-yellow text-xs font-bold uppercase tracking-wider">{saccoName}</div></div></div>
                         <div className="flex-1 mb-6 relative"><div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Your Ride</div>
                             <div className="grid grid-cols-2 gap-2 h-full content-start overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                                {unlockedVehicles.map(vType => {
                                    const isSelected = mySelectedVehicle === vType;
                                    const spec = VEHICLE_SPECS[vType];
                                    return (
                                        <button key={vType} disabled={isMyReady} onClick={() => setMySelectedVehicle(vType)} className={`p-3 rounded-xl border text-left transition-all ${isSelected ? 'bg-matatu-yellow text-black border-matatu-yellow shadow-lg scale-[1.02]' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'} ${isMyReady ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            <div className="mb-2">{VEHICLE_ICONS[vType]}</div><div className="font-bold text-xs uppercase leading-tight">{vType.replace('-', ' ')}</div><div className="text-[10px] opacity-70">Top Speed: {spec.maxSpeedKmh}</div>
                                        </button>
                                    )
                                })}
                             </div>
                         </div>
                         <Button variant={isMyReady ? "danger" : "primary"} fullWidth size="lg" disabled={!mySelectedVehicle} onClick={() => setIsMyReady(!isMyReady)} className={!mySelectedVehicle ? 'opacity-50' : ''}>{isMyReady ? "Cancel Ready" : mySelectedVehicle ? "I'm Ready" : "Select Vehicle"}</Button>
                    </div>

                    <div className="flex items-center justify-center md:flex-col"><div className="font-display font-black text-4xl text-slate-700 italic pr-4 md:pr-0 md:pb-4">VS</div></div>

                    {/* PLAYER 2 (OPPONENT) */}
                    <div className={`flex-1 bg-slate-900/50 border-2 rounded-3xl p-6 flex flex-col transition-all duration-300 ${opponentReady ? 'border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.1)]' : 'border-slate-800'}`}>
                         <div className="flex items-center gap-4 mb-6 justify-end text-right">
                            <div>
                                <div className="text-white font-display font-bold text-xl">{opponentName || '...'}</div>
                                <div className="text-neon-blue text-xs font-bold uppercase tracking-wider">{opponentSacco || 'Waiting...'}</div>
                            </div>
                            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-600 shadow-lg relative">
                                <div className="font-display font-bold text-slate-500 text-2xl">{opponentName ? opponentName.charAt(0) : '?'}</div>
                                {isRoomReady && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900"></div>}
                            </div>
                         </div>
                         <div className="flex-1 flex flex-col items-center justify-center bg-black/20 rounded-2xl border border-slate-800/50 mb-6 p-6">
                             {!isRoomReady ? (
                                 <div className="text-center text-slate-500">
                                     <Loader2 size={32} className="animate-spin mx-auto mb-2" />
                                     <span className="text-xs uppercase font-bold tracking-widest">Waiting for Accept...</span>
                                     {roomTimeRemaining !== null && (
                                         <div className="text-orange-400 font-mono mt-2 font-bold">{roomTimeRemaining}s</div>
                                     )}
                                 </div>
                             ) : !opponentVehicle ? (
                                 <div className="flex flex-col items-center gap-3 animate-pulse text-slate-500">
                                     <Loader2 size={32} className="animate-spin" />
                                     <span className="text-xs uppercase font-bold tracking-widest">Selecting Vehicle...</span>
                                 </div>
                             ) : (
                                 <div className="flex flex-col items-center gap-4 animate-fade-in-up">
                                     <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center border-4 border-slate-700 shadow-2xl">
                                         <div className="scale-150 text-slate-300">{VEHICLE_ICONS[opponentVehicle as VehicleType]}</div>
                                     </div>
                                     <div className="text-center">
                                         <div className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1">Vehicle Selected</div>
                                         <div className="text-white font-display font-bold text-xl uppercase">{opponentVehicle.replace('-', ' ')}</div>
                                     </div>
                                 </div>
                             )}
                         </div>
                         <div className={`p-4 rounded-xl flex items-center justify-center gap-3 font-bold uppercase tracking-wider transition-all ${opponentReady ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-slate-800 text-slate-500'}`}>
                             {opponentReady ? <CheckCircle2 size={20} /> : <Loader2 size={20} className={opponentVehicle ? "animate-spin" : "opacity-0"} />}
                             {opponentReady ? "Ready to Race" : opponentVehicle ? "Confirming..." : "Waiting..."}
                         </div>
                    </div>
                </div>
                
                {launchCountdown !== null && (<div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm rounded-none md:rounded-3xl animate-fade-in"><div className="text-matatu-yellow font-display font-black text-9xl animate-ping opacity-75 absolute">{launchCountdown === 0 ? "GO" : launchCountdown}</div><div className="text-white font-display font-black text-9xl relative z-10">{launchCountdown === 0 ? "GO" : launchCountdown}</div><div className="mt-8 text-slate-300 font-bold uppercase tracking-[0.5em] animate-pulse">Starting Race</div></div>)}
             </div>
        </GameLayout>
      );
  }

  // --- RENDER: LOBBY VIEW (DEFAULT) ---
  return (
    <GameLayout noMaxWidth className="bg-slate-950">
      <div className="flex flex-col h-full w-full max-w-6xl mx-auto p-4 md:p-6 lg:gap-8 relative">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 z-20 shrink-0">
             <button onClick={handleBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-all border border-slate-700 shadow-lg active:scale-95 shrink-0"><ArrowLeft size={20} /></button>
             <div className="flex-1"><h2 className="font-display text-2xl font-bold text-white uppercase tracking-wider leading-none">Multiplayer Lobby</h2><div className="flex items-center gap-2 mt-1"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div><p className="text-slate-400 text-xs uppercase tracking-widest">Online • Nairobi Region</p></div></div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 overflow-hidden">
            
            {/* --- LEFT COLUMN: ACTION CARDS --- */}
            <div className="flex flex-col gap-4 lg:w-1/3 shrink-0">
                {/* My ID Card */}
                <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-5 shadow-xl">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-600">
                             <User className="text-matatu-yellow" size={28} />
                        </div>
                        <div>
                            <div className="text-white font-bold text-lg leading-none">{playerName}</div>
                            <div className="text-slate-500 text-xs uppercase mt-1">{saccoName}</div>
                        </div>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3 flex justify-between items-center border border-slate-800">
                         <div><span className="text-[10px] text-slate-500 uppercase font-bold block">Conductor ID (Unique)</span><span className="text-neon-blue font-mono font-bold tracking-widest">{uniqueId}</span></div><button className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"><Copy size={16} /></button>
                    </div>
                </div>

                {/* DYNAMIC CARD: JOIN ROOM or INCOMING INVITE */}
                {incomingInvite ? (
                    <Card className="bg-slate-800 border-2 border-matatu-yellow shadow-[0_0_30px_rgba(255,215,0,0.2)] animate-pulse-fast relative overflow-hidden" accent="none">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-matatu-yellow animate-progress" style={{width: `${(inviteTimer/30)*100}%`}}></div>
                        <div className="flex items-center gap-4 relative z-10 mb-4">
                            <div className="w-12 h-12 rounded-full bg-matatu-yellow text-black flex items-center justify-center animate-bounce">
                                 <Gamepad2 size={24} />
                            </div>
                            <div>
                               <h4 className="font-bold text-white uppercase text-lg leading-none mb-1">Challenge!</h4>
                               <p className="text-xs text-slate-300">Invite from <span className="text-matatu-yellow font-bold">{incomingInvite.host?.username}</span></p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-black/20 px-2 py-1 rounded">
                                <Timer size={14}/> {inviteTimer}s
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="danger" onClick={declineInvite} className="px-3"><X size={16}/></Button>
                                <Button size="sm" variant="primary" onClick={acceptInvite} className="px-6">Accept</Button>
                            </div>
                        </div>
                    </Card>
                ) : (
                    <Card className="hover:bg-slate-800 transition-colors cursor-pointer group border-slate-700 hover:border-matatu-yellow relative overflow-hidden">
                        <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><PlayCircle size={80} /></div>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-12 h-12 rounded-full bg-matatu-yellow/10 flex items-center justify-center group-hover:scale-110 transition-transform"><PlayCircle className="text-matatu-yellow" size={24} /></div>
                            <div><h4 className="font-bold text-white uppercase text-lg">Join Room</h4><p className="text-xs text-slate-400">Enter a Room Code manually</p></div>
                        </div>
                    </Card>
                )}
                
                {/* Info Box */}
                <div className="mt-auto bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex items-center gap-3 text-xs text-slate-500">
                    <Wifi size={16} /><span>Invite a friend from the right panel to start a race.</span>
                </div>
            </div>


            {/* --- RIGHT COLUMN: SOCIAL HUB --- */}
            <div className="flex-1 bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-3xl overflow-hidden flex flex-col shadow-2xl">
                
                {/* Hub Header & Tabs */}
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                    <h3 className="font-display font-bold text-white uppercase tracking-wider flex items-center gap-2"><Users size={20} className="text-slate-400" /> Social Hub</h3>
                    <div className="flex bg-slate-950 rounded-lg p-1 gap-1">
                        <button onClick={() => setActiveTab('FRIENDS')} className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${activeTab === 'FRIENDS' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>Friends</button>
                        <button onClick={() => setActiveTab('REQUESTS')} className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all relative ${activeTab === 'REQUESTS' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>Requests{incomingRequests.length > 0 && (<span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] flex items-center justify-center">{incomingRequests.length}</span>)}</button>
                        <button onClick={() => setActiveTab('ADD')} className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${activeTab === 'ADD' ? 'bg-matatu-yellow text-black shadow' : 'text-slate-500 hover:text-slate-300'}`}><span className="flex items-center gap-1"><UserPlus size={14}/> Find</span></button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    
                    {isLoadingData ? (
                        <div className="text-center py-12 text-slate-500 flex items-center justify-center gap-2"><Loader2 className="animate-spin" size={20} /> Loading network...</div>
                    ) : (
                        <>
                            {activeTab === 'ADD' && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="relative"><Search className="absolute left-4 top-3.5 text-slate-500" size={18} /><input type="text" placeholder="Search by Conductor Name..." value={searchQuery} onChange={(e) => handleSearch(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-matatu-yellow transition-colors placeholder:text-slate-600" />{isSearching && (<Loader2 className="absolute right-4 top-3.5 text-slate-500 animate-spin" size={18} />)}</div>
                                    <div className="space-y-2"><h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Search Results</h4>{searchResults.length === 0 ? (<div className="text-center py-8 text-slate-600 text-sm">{searchQuery.length > 1 ? (isSearching ? "Searching..." : "No conductors found.") : "Type a name to search."}</div>) : (searchResults.map(user => { const isFriend = friendsList.some(f => f.id === user.id); const isRequested = sentRequests.includes(user.id); return (<div key={user.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-display font-bold text-slate-400">{user.username.charAt(0)}</div><div><div className="text-white font-bold text-sm">{user.username}</div><div className="text-slate-500 text-xs">{user.sacco}</div></div></div>{isFriend ? (<div className="text-xs font-bold text-green-500 flex items-center gap-1"><CheckCircle2 size={14} /> Friend</div>) : isRequested ? (<div className="text-xs font-bold text-slate-400 flex items-center gap-1"><UserCheck size={14} /> Pending</div>) : (<Button size="sm" onClick={() => sendRequest(user)}><UserPlus size={16}/> Request</Button>)}</div>); }))}</div>
                                </div>
                            )}

                            {activeTab === 'REQUESTS' && (
                                <div className="space-y-2 animate-fade-in">{incomingRequests.length === 0 ? (<div className="text-center py-12 text-slate-500"><Bell size={48} className="text-slate-700 mx-auto mb-4 opacity-50" /><p>No incoming friend requests.</p></div>) : (incomingRequests.map(req => (<div key={req.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-display font-bold text-white border border-slate-600">{req.profile?.username.charAt(0)}</div><div><div className="text-white font-bold text-sm">{req.profile?.username}</div><div className="text-slate-500 text-[10px]">Wants to be friends</div></div></div><div className="flex gap-2"><button onClick={() => handleRequestResponse(req, 'ACCEPT')} className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-500"><Check size={16}/></button><button onClick={() => handleRequestResponse(req, 'REJECT')} className="p-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600"><X size={16}/></button></div></div>)))}</div>
                            )}

                            {activeTab === 'FRIENDS' && (
                                <div className="space-y-2 animate-fade-in">
                                    {friendsList.length === 0 ? (
                                        <div className="text-center py-12"><Users size={48} className="text-slate-700 mx-auto mb-4" /><p className="text-slate-500">Your crew is empty.</p><Button variant="outline" size="sm" className="mt-4" onClick={() => setActiveTab('ADD')}>Find Players</Button></div>
                                    ) : (
                                        friendsList.map(friend => (
                                            <div key={friend.id} className="group flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-slate-800 hover:border-slate-600 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative"><div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-display font-bold text-slate-300 border border-slate-600">{friend.name.charAt(0)}</div>{friend.isOnline && (<div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800"></div>)}</div>
                                                    <div><div className="text-white font-bold text-sm flex items-center gap-2">{friend.name}{friend.status === 'IN_GAME' && (<span className="text-[10px] bg-blue-900 text-blue-300 px-1.5 rounded">IN RACE</span>)}</div><div className="flex items-center gap-3 text-[10px] text-slate-500 mt-0.5"><span>{friend.sacco}</span></div></div>
                                                </div>
                                                
                                                <div>
                                                    {friend.status === 'INVITED' ? (
                                                        <span className="text-xs font-bold text-matatu-yellow flex items-center gap-1 px-3 py-2"><Loader2 className="animate-spin" size={14} /> Sent</span>
                                                    ) : (
                                                        <button onClick={() => sendGameInvite(friend.id)} className="p-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-matatu-yellow hover:text-black transition-all active:scale-95" title="Invite to Game"><Send size={16} /></button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </>
                    )}

                </div>
            </div>

        </div>
      </div>
    </GameLayout>
  );
};
