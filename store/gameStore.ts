
import { create } from 'zustand';
import { GameState, PlayerStats, Route, ScreenName, VehicleType, GameStatus, GameOverReason, StageData } from '../types';

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
  
  // Stage Actions
  triggerStage: () => void;
  handleStageAction: (action: 'PICKUP' | 'DEPART') => void;
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
  
  currentPassengers: 0,
  maxPassengers: 14,
  nextStageDistance: 0,
  activeModal: 'NONE',
  stageData: null,
  
  gameStatus: 'IDLE',
  gameOverReason: null,
  gameTimeRemaining: 0,

  setScreen: (screen) => set({ currentScreen: screen }),
  
  setPlayerInfo: (name, sacco) => set({ playerName: name, saccoName: sacco }),
  
  setVehicleType: (type) => set({ vehicleType: type }),
  
  selectRoute: (route) => set({ selectedRoute: route }),

  updateDistance: (amount) => {
    const { distanceTraveled, nextStageDistance, currentSpeed, activeModal, triggerStage } = get();
    
    // If we are moving and hit the stage distance, trigger it
    if (activeModal === 'NONE' && currentSpeed > 0 && distanceTraveled + amount >= nextStageDistance) {
      set({ distanceTraveled: nextStageDistance }); // Snap to stop
      triggerStage();
    } else {
      set({ distanceTraveled: distanceTraveled + amount });
    }
  },
  
  triggerStage: () => {
    const { currentPassengers, maxPassengers } = get();
    
    // Generate random stage data
    const waiting = Math.floor(Math.random() * 8); // 0-7 waiting
    // Random alighting (bias towards fewer alighting early game, but purely random for now)
    const alighting = currentPassengers > 0 ? Math.floor(Math.random() * (currentPassengers + 1)) : 0;
    
    set({
      currentSpeed: 0, // Stop the bus
      activeModal: 'STAGE',
      stageData: {
        name: `Stage ${Math.floor(Math.random() * 100)}`,
        waitingPassengers: waiting,
        alightingPassengers: alighting
      }
    });
  },
  
  handleStageAction: (action) => {
    const { stageData, currentPassengers, maxPassengers, stats, nextStageDistance } = get();
    if (!stageData) return;

    let newPassengerCount = currentPassengers;
    let cashEarned = 0;
    const FARE_PER_PAX = 50;

    // 1. Process Alighting (Mandatory)
    newPassengerCount -= stageData.alightingPassengers;

    // 2. Process Boarding
    if (action === 'PICKUP') {
      const availableSeats = maxPassengers - newPassengerCount;
      const boarding = Math.min(availableSeats, stageData.waitingPassengers);
      newPassengerCount += boarding;
      cashEarned = boarding * FARE_PER_PAX;
    }

    // 3. Update State and Resume
    const nextDist = nextStageDistance + 300 + Math.random() * 300; // Next stage in 300-600 units

    set({
      currentPassengers: newPassengerCount,
      stats: {
        ...stats,
        cash: stats.cash + cashEarned
      },
      activeModal: 'NONE',
      stageData: null,
      currentSpeed: 20, // Resume speed
      nextStageDistance: nextDist
    });
  },
  
  startGameLoop: () => {
    const { selectedRoute, vehicleType } = get();
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
    
    // Set Max Passengers based on Vehicle
    let maxPax = 14;
    if (vehicleType === '32-seater') maxPax = 32;
    if (vehicleType === '52-seater') maxPax = 52;

    set({ 
      gameStatus: 'PLAYING', 
      gameTimeRemaining: seconds,
      gameOverReason: null,
      currentScreen: 'GAME_LOOP',
      distanceTraveled: 0,
      currentPassengers: 0,
      maxPassengers: maxPax,
      nextStageDistance: 400, // First stage is 400 units away
      activeModal: 'NONE',
      currentSpeed: 20
    });
  },

  tickTimer: () => set((state) => {
    if (state.gameStatus !== 'PLAYING') return {};
    
    // Pause timer if in stage modal?
    // Let's keep time running to add pressure!
    
    const newTime = state.gameTimeRemaining - 1;
    
    if (newTime <= 0) {
      return { 
        gameTimeRemaining: 0, 
        gameStatus: 'GAME_OVER', 
        gameOverReason: 'TIME_UP',
        activeModal: 'GAME_OVER'
      };
    }
    
    return { gameTimeRemaining: newTime };
  }),

  endGame: (reason) => set({ 
    gameStatus: 'GAME_OVER', 
    gameOverReason: reason,
    activeModal: 'GAME_OVER'
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
    currentPassengers: 0,
    nextStageDistance: 0,
    activeModal: 'NONE',
    gameStatus: 'IDLE',
    gameOverReason: null,
    gameTimeRemaining: 0
  }),
}));
