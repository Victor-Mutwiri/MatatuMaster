
import React, { useState, useEffect } from 'react';
import { GameLayout } from '../components/layout/GameLayout';
import { Button } from '../components/ui/Button';
import { useGameStore, VEHICLE_SPECS } from '../store/gameStore';
import { VehicleType } from '../types';
import { ArrowLeft, Wifi, UserPlus, PlayCircle, Lock, Search, Users, Copy, Check, Send, User, Car, Zap, Shield, TrendingUp, Bike, ShoppingCart, CheckCircle2, Loader2, X, Bell, UserCheck } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { GameService, FriendRequest } from '../services/gameService';

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
  const { setScreen, playerName, saccoName, unlockedVehicles, setVehicleType } = useGameStore();
  
  // View State: 'LOBBY' (Friend list) or 'ROOM' (Staging area)
  const [viewState, setViewState] = useState<'LOBBY' | 'ROOM'>('LOBBY');
  
  // Local State for Social Features
  const [activeTab, setActiveTab] = useState<'FRIENDS' | 'REQUESTS' | 'ADD'>('FRIENDS');
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sentRequests, setSentRequests] = useState<string[]>([]); // Track local session sends
  
  // Data State
  const [friendsList, setFriendsList] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // Room State
  const [activeOpponent, setActiveOpponent] = useState<Friend | null>(null);
  const [mySelectedVehicle, setMySelectedVehicle] = useState<VehicleType | null>(null);
  const [opponentSelectedVehicle, setOpponentSelectedVehicle] = useState<VehicleType | null>(null);
  const [isMyReady, setIsMyReady] = useState(false);
  const [isOpponentReady, setIsOpponentReady] = useState(false);
  const [launchCountdown, setLaunchCountdown] = useState<number | null>(null);

  // Unique ID (Visual)
  const uniqueId = btoa(playerName).substring(0, 8).toUpperCase();

  // --- Effects ---

  // 1. Load Friends and Requests on Mount
  useEffect(() => {
    fetchSocialData();
  }, []);

  const fetchSocialData = async () => {
      setIsLoadingData(true);
      try {
          // Fetch Friends
          const rawFriends = await GameService.getFriends();
          const processedFriends: Friend[] = rawFriends.map(f => ({
              id: f.id,
              name: f.username,
              sacco: f.sacco,
              status: 'IDLE',
              isOnline: true // Optimistic online status
          }));
          setFriendsList(processedFriends);

          // Fetch Requests
          const requests = await GameService.getFriendRequests();
          setIncomingRequests(requests);

      } catch (e) {
          console.error("Failed to fetch social data", e);
      } finally {
          setIsLoadingData(false);
      }
  };

  const handleBack = () => {
    if (viewState === 'ROOM') {
        setViewState('LOBBY');
        setActiveOpponent(null);
        setIsMyReady(false);
        setIsOpponentReady(false);
        setOpponentSelectedVehicle(null);
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
    // Debounce
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
        console.error("Send request error", e);
        if (e.message.includes("already")) {
            setSentRequests(prev => [...prev, user.id]);
        }
    }
  };

  const handleRequestResponse = async (req: FriendRequest, action: 'ACCEPT' | 'REJECT') => {
      try {
          await GameService.respondToFriendRequest(req.id, req.sender_id, action);
          
          // Remove from list locally
          setIncomingRequests(prev => prev.filter(r => r.id !== req.id));

          if (action === 'ACCEPT' && req.profile) {
              // Add to friend list locally
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

  const inviteFriend = (id: string) => {
    setFriendsList(prev => prev.map(f => 
      f.id === id ? { ...f, status: 'INVITED' } : f
    ));

    // SIMULATION: Friend accepts invite after 1.5 seconds
    setTimeout(() => {
        const friend = friendsList.find(f => f.id === id);
        if (friend) {
            setActiveOpponent(friend);
            setViewState('ROOM');
            // Reset room state
            setMySelectedVehicle(null);
            setOpponentSelectedVehicle(null);
            setIsMyReady(false);
            setIsOpponentReady(false);
        }
    }, 1500);
  };

  // SIMULATION: Opponent Behavior in Room
  useEffect(() => {
    if (viewState === 'ROOM' && activeOpponent) {
        const pickTime = setTimeout(() => {
            const options: VehicleType[] = ['boda', 'tuktuk', 'personal-car', '14-seater'];
            const randomPick = options[Math.floor(Math.random() * options.length)];
            setOpponentSelectedVehicle(randomPick);
        }, 3000);

        const readyTime = setTimeout(() => {
            setIsOpponentReady(true);
        }, 6000);

        return () => {
            clearTimeout(pickTime);
            clearTimeout(readyTime);
        };
    }
  }, [viewState, activeOpponent]);

  // Launch Logic
  useEffect(() => {
    if (isMyReady && isOpponentReady) {
        let count = 3;
        setLaunchCountdown(count);
        
        const interval = setInterval(() => {
            count--;
            if (count < 0) {
                clearInterval(interval);
                if (mySelectedVehicle) {
                    setVehicleType(mySelectedVehicle);
                    setScreen('MAP_SELECT'); 
                }
            } else {
                setLaunchCountdown(count);
            }
        }, 1000);

        return () => clearInterval(interval);
    }
  }, [isMyReady, isOpponentReady, mySelectedVehicle, setVehicleType, setScreen]);


  // --- RENDER: ROOM VIEW ---
  if (viewState === 'ROOM' && activeOpponent) {
      // (Room UI Code remains same as previous, omitted for brevity but logic preserves it)
      // ... Re-inserting Room UI Block ...
      return (
        <GameLayout noMaxWidth className="bg-slate-950">
             <div className="flex flex-col h-full w-full max-w-6xl mx-auto p-4 md:p-6 lg:gap-8 relative">
                <div className="flex items-center justify-between mb-6 z-20">
                    <div className="flex items-center gap-4">
                        <button onClick={handleBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-all border border-slate-700 shadow-lg active:scale-95 shrink-0"><ArrowLeft size={20} /></button>
                        <div><h2 className="font-display text-2xl font-bold text-white uppercase tracking-wider leading-none">Staging Area</h2><p className="text-slate-400 text-xs uppercase tracking-widest mt-1">Room Code: {uniqueId}-X</p></div>
                    </div>
                    <div className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-full flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${isMyReady && isOpponentReady ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div><span className="text-xs font-bold uppercase text-slate-300">{isMyReady && isOpponentReady ? 'Launching...' : 'Waiting for Players'}</span></div>
                </div>
                <div className="flex-1 flex flex-col md:flex-row gap-4 md:gap-8 items-stretch justify-center pb-20 md:pb-0">
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
                    <div className={`flex-1 bg-slate-900/50 border-2 rounded-3xl p-6 flex flex-col transition-all duration-300 ${isOpponentReady ? 'border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.1)]' : 'border-slate-800'}`}>
                         <div className="flex items-center gap-4 mb-6 justify-end text-right"><div><div className="text-white font-display font-bold text-xl">{activeOpponent.name}</div><div className="text-neon-blue text-xs font-bold uppercase tracking-wider">{activeOpponent.sacco}</div></div><div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-600 shadow-lg relative"><div className="font-display font-bold text-slate-500 text-2xl">{activeOpponent.name.charAt(0)}</div><div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900"></div></div></div>
                         <div className="flex-1 flex flex-col items-center justify-center bg-black/20 rounded-2xl border border-slate-800/50 mb-6 p-6">
                             {!opponentSelectedVehicle ? (<div className="flex flex-col items-center gap-3 animate-pulse text-slate-500"><Loader2 size={32} className="animate-spin" /><span className="text-xs uppercase font-bold tracking-widest">Selecting Vehicle...</span></div>) : (<div className="flex flex-col items-center gap-4 animate-fade-in-up"><div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center border-4 border-slate-700 shadow-2xl"><div className="scale-150 text-slate-300">{VEHICLE_ICONS[opponentSelectedVehicle]}</div></div><div className="text-center"><div className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1">Vehicle Selected</div><div className="text-white font-display font-bold text-xl uppercase">{opponentSelectedVehicle.replace('-', ' ')}</div></div></div>)}
                         </div>
                         <div className={`p-4 rounded-xl flex items-center justify-center gap-3 font-bold uppercase tracking-wider transition-all ${isOpponentReady ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-slate-800 text-slate-500'}`}>{isOpponentReady ? <CheckCircle2 size={20} /> : <Loader2 size={20} className={opponentSelectedVehicle ? "animate-spin" : "opacity-0"} />}{isOpponentReady ? "Ready to Race" : opponentSelectedVehicle ? "Confirming..." : "Waiting..."}</div>
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
             <button 
               onClick={handleBack}
               className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-all border border-slate-700 shadow-lg active:scale-95 shrink-0"
             >
               <ArrowLeft size={20} />
             </button>
             <div className="flex-1">
               <h2 className="font-display text-2xl font-bold text-white uppercase tracking-wider leading-none">
                 Multiplayer Lobby
               </h2>
               <div className="flex items-center gap-2 mt-1">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                 <p className="text-slate-400 text-xs uppercase tracking-widest">Online • Nairobi Region</p>
               </div>
             </div>
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
                         <div>
                            <span className="text-[10px] text-slate-500 uppercase font-bold block">Conductor ID (Unique)</span>
                            <span className="text-neon-blue font-mono font-bold tracking-widest">{uniqueId}</span>
                         </div>
                         <button className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors">
                            <Copy size={16} />
                         </button>
                    </div>
                </div>

                {/* Actions */}
                <Card className="hover:bg-slate-800 transition-colors cursor-pointer group border-slate-700 hover:border-neon-blue relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                         <Wifi size={80} />
                    </div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-full bg-neon-blue/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                             <UserPlus className="text-neon-blue" size={24} />
                        </div>
                        <div>
                           <h4 className="font-bold text-white uppercase text-lg">Create Room</h4>
                           <p className="text-xs text-slate-400">Host a private race & invite friends</p>
                        </div>
                    </div>
                </Card>

                <Card className="hover:bg-slate-800 transition-colors cursor-pointer group border-slate-700 hover:border-matatu-yellow relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                         <PlayCircle size={80} />
                    </div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-full bg-matatu-yellow/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                             <PlayCircle className="text-matatu-yellow" size={24} />
                        </div>
                        <div>
                           <h4 className="font-bold text-white uppercase text-lg">Join Room</h4>
                           <p className="text-xs text-slate-400">Enter a Room Code to join</p>
                        </div>
                    </div>
                </Card>
            </div>


            {/* --- RIGHT COLUMN: SOCIAL HUB --- */}
            <div className="flex-1 bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-3xl overflow-hidden flex flex-col shadow-2xl">
                
                {/* Hub Header & Tabs */}
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                    <h3 className="font-display font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Users size={20} className="text-slate-400" /> Social Hub
                    </h3>
                    <div className="flex bg-slate-950 rounded-lg p-1 gap-1">
                        <button 
                            onClick={() => setActiveTab('FRIENDS')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${activeTab === 'FRIENDS' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Friends
                        </button>
                        <button 
                            onClick={() => setActiveTab('REQUESTS')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all relative ${activeTab === 'REQUESTS' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Requests
                            {incomingRequests.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] flex items-center justify-center">{incomingRequests.length}</span>
                            )}
                        </button>
                        <button 
                            onClick={() => setActiveTab('ADD')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${activeTab === 'ADD' ? 'bg-matatu-yellow text-black shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <span className="flex items-center gap-1"><UserPlus size={14}/> Find</span>
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    
                    {isLoadingData ? (
                        <div className="text-center py-12 text-slate-500 flex items-center justify-center gap-2">
                            <Loader2 className="animate-spin" size={20} /> Loading network...
                        </div>
                    ) : (
                        <>
                            {activeTab === 'ADD' && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-3.5 text-slate-500" size={18} />
                                        <input 
                                            type="text" 
                                            placeholder="Search by Conductor Name..." 
                                            value={searchQuery}
                                            onChange={(e) => handleSearch(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-matatu-yellow transition-colors placeholder:text-slate-600"
                                        />
                                        {isSearching && (
                                            <Loader2 className="absolute right-4 top-3.5 text-slate-500 animate-spin" size={18} />
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Search Results</h4>
                                        {searchResults.length === 0 ? (
                                            <div className="text-center py-8 text-slate-600 text-sm">
                                                {searchQuery.length > 1 ? (isSearching ? "Searching..." : "No conductors found.") : "Type a name to search."}
                                            </div>
                                        ) : (
                                            searchResults.map(user => {
                                                const isFriend = friendsList.some(f => f.id === user.id);
                                                const isRequested = sentRequests.includes(user.id); // Simple local tracking
                                                
                                                return (
                                                    <div key={user.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-display font-bold text-slate-400">
                                                                {user.username.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="text-white font-bold text-sm">{user.username}</div>
                                                                <div className="text-slate-500 text-xs">{user.sacco}</div>
                                                            </div>
                                                        </div>
                                                        {isFriend ? (
                                                            <div className="text-xs font-bold text-green-500 flex items-center gap-1"><CheckCircle2 size={14} /> Friend</div>
                                                        ) : isRequested ? (
                                                            <div className="text-xs font-bold text-slate-400 flex items-center gap-1"><UserCheck size={14} /> Pending</div>
                                                        ) : (
                                                            <Button size="sm" onClick={() => sendRequest(user)}>
                                                                <UserPlus size={16}/> Request
                                                            </Button>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'REQUESTS' && (
                                <div className="space-y-2 animate-fade-in">
                                    {incomingRequests.length === 0 ? (
                                        <div className="text-center py-12 text-slate-500">
                                            <Bell size={48} className="text-slate-700 mx-auto mb-4 opacity-50" />
                                            <p>No incoming friend requests.</p>
                                        </div>
                                    ) : (
                                        incomingRequests.map(req => (
                                            <div key={req.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-display font-bold text-white border border-slate-600">
                                                        {req.profile?.username.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="text-white font-bold text-sm">{req.profile?.username}</div>
                                                        <div className="text-slate-500 text-[10px]">Wants to be friends</div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleRequestResponse(req, 'ACCEPT')} className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-500"><Check size={16}/></button>
                                                    <button onClick={() => handleRequestResponse(req, 'REJECT')} className="p-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600"><X size={16}/></button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeTab === 'FRIENDS' && (
                                <div className="space-y-2 animate-fade-in">
                                    {friendsList.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Users size={48} className="text-slate-700 mx-auto mb-4" />
                                            <p className="text-slate-500">Your crew is empty.</p>
                                            <Button variant="outline" size="sm" className="mt-4" onClick={() => setActiveTab('ADD')}>
                                                Find Players
                                            </Button>
                                        </div>
                                    ) : (
                                        friendsList.map(friend => (
                                            <div key={friend.id} className="group flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-slate-800 hover:border-slate-600 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-display font-bold text-slate-300 border border-slate-600">
                                                            {friend.name.charAt(0)}
                                                        </div>
                                                        {friend.isOnline && (
                                                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800"></div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="text-white font-bold text-sm flex items-center gap-2">
                                                            {friend.name}
                                                            {friend.status === 'IN_GAME' && (
                                                                <span className="text-[10px] bg-blue-900 text-blue-300 px-1.5 rounded">IN RACE</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-0.5">
                                                            <span>{friend.sacco}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div>
                                                    {friend.status === 'INVITED' ? (
                                                        <span className="text-xs font-bold text-matatu-yellow flex items-center gap-1 px-3 py-2">
                                                            <Check size={14} /> Sent
                                                        </span>
                                                    ) : (
                                                        <button 
                                                            onClick={() => inviteFriend(friend.id)}
                                                            className="p-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-matatu-yellow hover:text-black transition-all active:scale-95"
                                                            title="Invite to Game"
                                                        >
                                                            <Send size={16} />
                                                        </button>
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
