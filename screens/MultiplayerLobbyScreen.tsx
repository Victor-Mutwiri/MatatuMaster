
import React, { useState } from 'react';
import { GameLayout } from '../components/layout/GameLayout';
import { Button } from '../components/ui/Button';
import { useGameStore } from '../store/gameStore';
import { ArrowLeft, Wifi, UserPlus, PlayCircle, Lock, Search, Users, Copy, Check, Send, User } from 'lucide-react';
import { Card } from '../components/ui/Card';

// --- Mock Data Types ---
interface Friend {
  id: string;
  name: string;
  sacco: string;
  isOnline: boolean;
  cash: number;
  distance: number;
  status: 'IDLE' | 'IN_GAME' | 'INVITED';
}

// --- Mock "Global" Database for Search ---
const MOCK_USER_DATABASE = [
  { id: 'usr_01', name: 'Ma3_Killer', sacco: 'Super Metro', cash: 450000, distance: 1240 },
  { id: 'usr_02', name: 'Nairobi_Drift', sacco: '2NK', cash: 120000, distance: 540 },
  { id: 'usr_03', name: 'Sacco_King', sacco: 'Lopha', cash: 890000, distance: 3100 },
  { id: 'usr_04', name: 'Shiro_Speed', sacco: 'Killeton', cash: 230000, distance: 890 },
  { id: 'usr_05', name: 'Brayo_Turbo', sacco: 'Embassava', cash: 55000, distance: 120 },
];

export const MultiplayerLobbyScreen: React.FC = () => {
  const { setScreen, playerName, saccoName } = useGameStore();
  
  // Local State for Social Features
  const [activeTab, setActiveTab] = useState<'FRIENDS' | 'ADD'>('FRIENDS');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof MOCK_USER_DATABASE>([]);
  
  // Initialize with one dummy friend
  const [myFriends, setMyFriends] = useState<Friend[]>([
    { 
      id: 'usr_99', 
      name: 'Oti_Master', 
      sacco: 'Double M', 
      isOnline: true, 
      cash: 150000, 
      distance: 420, 
      status: 'IDLE' 
    }
  ]);

  const handleBack = () => {
    setScreen('GAME_MODE');
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    // Simulate API Search
    const results = MOCK_USER_DATABASE.filter(u => 
      u.name.toLowerCase().includes(query.toLowerCase()) && 
      !myFriends.find(f => f.id === u.id) // Don't show existing friends
    );
    setSearchResults(results);
  };

  const addFriend = (user: typeof MOCK_USER_DATABASE[0]) => {
    const newFriend: Friend = {
      ...user,
      isOnline: true, // Simulate they are online
      status: 'IDLE'
    };
    setMyFriends([...myFriends, newFriend]);
    setSearchResults(prev => prev.filter(p => p.id !== user.id)); // Remove from results
    setActiveTab('FRIENDS'); // Switch back to list
  };

  const inviteFriend = (id: string) => {
    setMyFriends(prev => prev.map(f => 
      f.id === id ? { ...f, status: 'INVITED' } : f
    ));
    // In a real app, this would trigger a socket event
  };

  // Unique ID Simulation (Base64 of name)
  const uniqueId = btoa(playerName).substring(0, 8).toUpperCase();

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
                
                {/* Coming Soon */}
                <div className="mt-auto bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex items-center gap-3 text-xs text-slate-500">
                    <Lock size={16} />
                    <span>Global Ranked Matchmaking is currently disabled for maintenance.</span>
                </div>
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
                            className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${activeTab === 'FRIENDS' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Friends ({myFriends.length})
                        </button>
                        <button 
                            onClick={() => setActiveTab('ADD')}
                            className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${activeTab === 'ADD' ? 'bg-matatu-yellow text-black shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <span className="flex items-center gap-1"><UserPlus size={14}/> Add Friend</span>
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    
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
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Search Results</h4>
                                {searchResults.length === 0 ? (
                                    <div className="text-center py-8 text-slate-600 text-sm">
                                        {searchQuery.length > 1 ? "No conductors found." : "Type a name to search."}
                                    </div>
                                ) : (
                                    searchResults.map(user => (
                                        <div key={user.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-display font-bold text-slate-400">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="text-white font-bold text-sm">{user.name}</div>
                                                    <div className="text-slate-500 text-xs">{user.sacco}</div>
                                                </div>
                                            </div>
                                            <Button size="sm" onClick={() => addFriend(user)}>
                                                <UserPlus size={16} /> Add
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'FRIENDS' && (
                        <div className="space-y-2 animate-fade-in">
                             {myFriends.length === 0 ? (
                                <div className="text-center py-12">
                                    <Users size={48} className="text-slate-700 mx-auto mb-4" />
                                    <p className="text-slate-500">You haven't added any friends yet.</p>
                                    <Button variant="outline" size="sm" className="mt-4" onClick={() => setActiveTab('ADD')}>
                                        Find Players
                                    </Button>
                                </div>
                             ) : (
                                 myFriends.map(friend => (
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
                                                    <span>•</span>
                                                    <span className="text-green-400">KES {friend.cash.toLocaleString()}</span>
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

                </div>
            </div>

        </div>
      </div>
    </GameLayout>
  );
};
