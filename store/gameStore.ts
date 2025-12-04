
import { create } from 'zustand';
import { GameState, PlayerStats, Route, ScreenName, VehicleType, GameStatus, GameOverReason, StageData, PoliceData } from '../types';

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
  exitToMapSelection: () => void;
  tickTimer: () => void;
  endGame: (reason: GameOverReason) => void;
  
  // Stage Actions
  triggerStage: () => void;
  handleStageAction: (action: 'PICKUP' | 'DEPART') => void;

  // Police Actions
  triggerPoliceCheck: () => void;
  handlePoliceAction: (action: 'PAY' | 'REFUSE') => void;
  
  // Mechanics
  toggleStereo: () => void;
  reportLaneChange: () => void;
  toggleSound: () => void;
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
  
  nextPoliceDistance: 0,
  policeData: null,
  
  gameStatus: 'IDLE',
  gameOverReason: null,
  gameTimeRemaining: 0,
  
  happiness: 100,
  isStereoOn: false,
  isSoundOn: true,

  setScreen: (screen) => set({ currentScreen: screen }),
  
  setPlayerInfo: (name, sacco) => set({ playerName: name, saccoName: sacco }),
  
  setVehicleType: (type) => set({ vehicleType: type }),
  
  selectRoute: (route) => set({ selectedRoute: route }),

  updateDistance: (amount) => {
    const { distanceTraveled, nextStageDistance, nextPoliceDistance, currentSpeed, activeModal, triggerStage, triggerPoliceCheck } = get();
    
    // Check Police
    if (activeModal === 'NONE' && currentSpeed > 0 && distanceTraveled + amount >= nextPoliceDistance) {
      set({ distanceTraveled: nextPoliceDistance });
      triggerPoliceCheck();
      return;
    }

    // Check Stage
    if (activeModal === 'NONE' && currentSpeed > 0 && distanceTraveled + amount >= nextStageDistance) {
      set({ distanceTraveled: nextStageDistance }); // Snap to stop
      triggerStage();
      return;
    } 
    
    set({ distanceTraveled: distanceTraveled + amount });
  },
  
  triggerStage: () => {
    const { currentPassengers, happiness } = get();
    
    // Happiness affects passenger availability
    const happinessFactor = Math.max(0.1, happiness / 100);
    const maxPotentialPassengers = Math.floor(8 * happinessFactor);
    
    const waiting = Math.floor(Math.random() * (maxPotentialPassengers + 1)); 
    
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
    const { stageData, currentPassengers, stats, nextStageDistance } = get();
    if (!stageData) return;

    let newPassengerCount = currentPassengers;
    let cashEarned = 0;
    const FARE_PER_PAX = 50;

    // 1. Process Alighting (Mandatory)
    newPassengerCount -= stageData.alightingPassengers;

    // 2. Process Boarding (Allow Overloading!)
    if (action === 'PICKUP') {
      const boarding = stageData.waitingPassengers; // Pick up everyone, regardless of seats
      newPassengerCount += boarding;
      cashEarned = boarding * FARE_PER_PAX;
    }

    // 3. Update State and Resume
    const nextDist = nextStageDistance + 300 + Math.random() * 300; 

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

  triggerPoliceCheck: () => {
    const { currentPassengers, maxPassengers, distanceTraveled } = get();
    const isOverloaded = currentPassengers > maxPassengers;
    
    // Police Probability Logic
    let shouldStop = false;
    let bribe = 0;
    let message = "";
    
    if (isOverloaded) {
      shouldStop = true;
      bribe = 1000 + Math.floor(Math.random() * 1500); // 1000-2500
      message = "Wewe! You are overloaded! This is a serious offence.";
    } else {
      // Clean check: 40% chance of "Tea", 60% chance let go
      if (Math.random() > 0.6) {
        shouldStop = true;
        bribe = 100 + Math.floor(Math.random() * 200); // 100-300
        message = "Routine check. The boys need some tea.";
      } else {
        // Let go
        shouldStop = false;
      }
    }
    
    const nextPolice = distanceTraveled + 800 + Math.random() * 800;

    if (shouldStop) {
      set({
        currentSpeed: 0,
        activeModal: 'POLICE',
        nextPoliceDistance: nextPolice,
        policeData: {
          isOverloaded,
          bribeAmount: bribe,
          message
        }
      });
    } else {
      // Just skip and set next police distance
      set({ nextPoliceDistance: nextPolice });
    }
  },

  handlePoliceAction: (action) => {
    const { policeData, stats } = get();
    if (!policeData) return;

    if (action === 'PAY') {
       if (stats.cash >= policeData.bribeAmount) {
         set({
           stats: { ...stats, cash: stats.cash - policeData.bribeAmount },
           activeModal: 'NONE',
           policeData: null,
           currentSpeed: 20
         });
       }
    } else if (action === 'REFUSE') {
      // Arrest Logic
      const arrestChance = policeData.isOverloaded ? 0.5 : 0.1;
      
      if (Math.random() < arrestChance) {
        set({
          activeModal: 'GAME_OVER',
          gameStatus: 'GAME_OVER',
          gameOverReason: 'ARRESTED',
          policeData: null
        });
      } else {
        // Success escaping
        set({
           activeModal: 'NONE',
           policeData: null,
           currentSpeed: 20
        });
      }
    }
  },
  
  startGameLoop: () => {
    const { selectedRoute, vehicleType } = get();
    if (!selectedRoute) return;

    let seconds = 300;
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
      nextStageDistance: 400,
      nextPoliceDistance: 700 + Math.random() * 500, // Initialize first police check
      policeData: null,
      stageData: null,
      activeModal: 'NONE',
      currentSpeed: 20,
      happiness: 100,
      isStereoOn: false
    });
  },

  exitToMapSelection: () => set({
    currentScreen: 'MAP_SELECT',
    gameStatus: 'IDLE',
    gameOverReason: null,
    activeModal: 'NONE',
    currentSpeed: 0,
    distanceTraveled: 0,
    currentPassengers: 0,
    policeData: null,
    stageData: null,
    happiness: 100
  }),

  tickTimer: () => set((state) => {
    if (state.gameStatus !== 'PLAYING') return {};
    
    const newTime = state.gameTimeRemaining - 1;
    
    let newHappiness = state.happiness;
    if (state.isStereoOn) {
      newHappiness = Math.min(100, state.happiness + 0.5);
    }

    if (newTime <= 0) {
      return { 
        gameTimeRemaining: 0, 
        gameStatus: 'GAME_OVER', 
        gameOverReason: 'TIME_UP',
        activeModal: 'GAME_OVER',
        happiness: newHappiness
      };
    }
    
    return { gameTimeRemaining: newTime, happiness: newHappiness };
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
    nextPoliceDistance: 0,
    activeModal: 'NONE',
    gameStatus: 'IDLE',
    gameOverReason: null,
    gameTimeRemaining: 0,
    happiness: 100,
    isStereoOn: false,
    isSoundOn: true
  }),
  
  toggleStereo: () => set((state) => ({ isStereoOn: !state.isStereoOn })),
  
  reportLaneChange: () => set((state) => ({ 
    happiness: Math.max(0, state.happiness - 2)
  })),

  toggleSound: () => set((state) => ({ isSoundOn: !state.isSoundOn })),
}));