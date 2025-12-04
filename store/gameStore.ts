
import { create } from 'zustand';
import { GameState, PlayerStats, Route, ScreenName, VehicleType, GameStatus, GameOverReason } from '../types';

const INITIAL_STATS: PlayerStats = {
  cash: 500,
  reputation: 50,
  time: "05:30 AM",
  energy: 100
};

interface GameStore extends GameState {
  setScreen: (screen: ScreenName) => void;
  setPlayerInfo: (name: string, sacco: string) => void;
  setVehicleType: (type: VehicleType) => void;
  selectRoute: (route: Route) => void;
  resetGame: () => void;
  updateDistance: (delta: number) => void;
  
  // Game Loop Actions
  startGameLoop: () => void;
  tickTimer: () => void;
  endGame: (reason: GameOverReason) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  currentScreen: 'LANDING',
  stats: INITIAL_STATS,
  selectedRoute: null,
  playerName: '',
  saccoName: '',
  vehicleType: null,
  currentSpeed: 20, // Base speed
  distanceTraveled: 0,
  
  gameStatus: 'IDLE',
  gameOverReason: null,
  gameTimeRemaining: 0,

  setScreen: (screen) => set({ currentScreen: screen }),
  
  setPlayerInfo: (name, sacco) => set({ playerName: name, saccoName: sacco }),
  
  setVehicleType: (type) => set({ vehicleType: type }),
  
  selectRoute: (route) => set({ selectedRoute: route }),

  updateDistance: (amount) => set((state) => ({ distanceTraveled: state.distanceTraveled + amount })),
  
  startGameLoop: () => {
    const { selectedRoute } = get();
    if (!selectedRoute) return;

    // Parse time limit string (e.g., "45 mins" or "1h 15m") to seconds
    let seconds = 300; // Default 5 mins
    if (selectedRoute.timeLimit) {
      const timeStr = selectedRoute.timeLimit.toLowerCase();
      let minutes = 0;
      
      if (timeStr.includes('h')) {
        const parts = timeStr.split('h');
        minutes += parseInt(parts[0]) * 60;
        if (parts[1] && parts[1].includes('m')) {
          minutes += parseInt(parts[1]);
        }
      } else if (timeStr.includes('m')) {
         minutes = parseInt(timeStr);
      }
      
      if (minutes > 0) seconds = minutes * 60;
    }

    set({ 
      gameStatus: 'PLAYING', 
      gameTimeRemaining: seconds,
      gameOverReason: null,
      currentScreen: 'GAME_LOOP',
      distanceTraveled: 0
    });
  },

  tickTimer: () => set((state) => {
    if (state.gameStatus !== 'PLAYING') return {};
    
    const newTime = state.gameTimeRemaining - 1;
    
    if (newTime <= 0) {
      return { 
        gameTimeRemaining: 0, 
        gameStatus: 'GAME_OVER', 
        gameOverReason: 'TIME_UP' 
      };
    }
    
    return { gameTimeRemaining: newTime };
  }),

  endGame: (reason) => set({ 
    gameStatus: 'GAME_OVER', 
    gameOverReason: reason 
  }),
  
  resetGame: () => set({
    currentScreen: 'LANDING',
    stats: INITIAL_STATS,
    selectedRoute: null,
    playerName: '',
    saccoName: '',
    vehicleType: null,
    currentSpeed: 20,
    distanceTraveled: 0,
    gameStatus: 'IDLE',
    gameOverReason: null,
    gameTimeRemaining: 0
  }),
}));
