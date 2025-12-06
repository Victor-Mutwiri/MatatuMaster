
import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { GameState, PlayerStats, Route, ScreenName, VehicleType, GameStatus, GameOverReason, StageData, PoliceData, LifetimeStats, UserMode } from '../types';
import { playSfx } from '../utils/audio';

// --- Secure Storage Wrapper (Simple Obfuscation with UTF-8 Support) ---
const secureStorage: StateStorage = {
  getItem: (name: string): string | null => {
    const value = localStorage.getItem(name);
    if (!value) return null;
    try {
      // Decode Base64 with UTF-8 handling
      return decodeURIComponent(escape(atob(value)));
    } catch (e) {
      console.error("Failed to decode save data. It may be corrupted or format changed.", e);
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      // Encode Base64 with UTF-8 handling (Fixes crash on "→" or emojis)
      const encoded = btoa(unescape(encodeURIComponent(value)));
      localStorage.setItem(name, encoded);
    } catch (e) {
      console.error("Failed to save data to local storage", e);
    }
  },
  removeItem: (name: string): void => {
    localStorage.removeItem(name);
  },
};

const INITIAL_STATS: PlayerStats = {
  cash: 0, // Session cash starts at 0
  reputation: 50,
  time: "08:00 AM",
  energy: 100
};

const INITIAL_LIFETIME: LifetimeStats = {
  totalCashEarned: 0,
  totalDistanceKm: 0,
  totalBribesPaid: 0,
  totalTripsCompleted: 0
};

// Consumption in KM per Liter
const FUEL_EFFICIENCY = {
  'boda': 35,
  'tuktuk': 25,
  'personal-car': 12,
  '14-seater': 9,
  '32-seater': 7,
  '52-seater': 5
};

// Assumed Tank Capacities in Liters for gauge calculation
const TANK_CAPACITY = {
  'boda': 12,
  'tuktuk': 10,
  'personal-car': 45,
  '14-seater': 70,
  '32-seater': 100,
  '52-seater': 150
};

// Vehicle Capacities (Legal vs Max Physical Overload)
const VEHICLE_CAPACITY = {
  'boda': { legal: 1, max: 2 },
  'tuktuk': { legal: 3, max: 4 },
  'personal-car': { legal: 4, max: 5 },
  '14-seater': { legal: 14, max: 18 },
  '32-seater': { legal: 32, max: 40 },
  '52-seater': { legal: 52, max: 70 }
};

interface VehicleSpec {
  maxSpeedKmh: number;
  timeMultiplier: number;
  fareRange: { min: number; max: number };
  price: number; // Cost to unlock
}

// Vehicle Performance & Pricing Specs
export const VEHICLE_SPECS: Record<VehicleType, VehicleSpec> = {
  'boda': { 
    maxSpeedKmh: 140, 
    timeMultiplier: 1.0,
    fareRange: { min: 50, max: 150 },
    price: 0 // Free
  },
  'tuktuk': { 
    maxSpeedKmh: 90, 
    timeMultiplier: 1.4,
    fareRange: { min: 30, max: 70 },
    price: 10000
  },
  'personal-car': { 
    maxSpeedKmh: 190, 
    timeMultiplier: 0.85,
    fareRange: { min: 150, max: 500 },
    price: 40000
  },
  '14-seater': { 
    maxSpeedKmh: 175, 
    timeMultiplier: 1.0,
    fareRange: { min: 20, max: 100 },
    price: 120000
  },
  '32-seater': { 
    maxSpeedKmh: 130, 
    timeMultiplier: 1.2,
    fareRange: { min: 20, max: 80 },
    price: 200000
  },
  '52-seater': { 
    maxSpeedKmh: 120, 
    timeMultiplier: 1.3,
    fareRange: { min: 20, max: 60 },
    price: 350000
  }
};

interface GameStore extends GameState {
  setScreen: (screen: ScreenName) => void;
  setPlayerInfo: (name: string, sacco: string) => void;
  setVehicleType: (type: VehicleType) => void;
  selectRoute: (route: Route) => void;
  resetGame: () => void;
  resetCareer: () => void; 
  updateDistance: (delta: number) => void;
  setCurrentSpeed: (speed: number) => void;
  
  // Progression
  registerUser: () => void;
  unlockVehicle: (type: VehicleType) => void;

  // Controls
  setControl: (control: 'GAS' | 'BRAKE', active: boolean) => void;

  // Game Loop Actions
  startGameLoop: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  setQuitConfirmation: (show: boolean) => void;
  exitToMapSelection: () => void;
  tickTimer: () => void;
  endGame: (reason: GameOverReason) => void;
  triggerCrash: () => void;
  
  // Stage Actions
  triggerStage: () => void;
  handleStageAction: (action: 'PICKUP_LEGAL' | 'PICKUP_OVERLOAD' | 'DEPART') => void;

  // Police Actions
  triggerPoliceCheck: () => void;
  handlePoliceAction: (action: 'PAY' | 'REFUSE') => void;
  
  // Mechanics
  toggleStereo: () => void;
  reportLaneChange: () => void;
  toggleSound: () => void;
  toggleEngineSound: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      currentScreen: 'LANDING',
      userMode: 'GUEST',
      stats: INITIAL_STATS,
      bankBalance: 0,
      selectedRoute: null,
      playerName: '',
      saccoName: '',
      vehicleType: null,
      unlockedVehicles: ['boda'],
      currentSpeed: 0,
      distanceTraveled: 0,
      totalRouteDistance: 0,
      
      fuel: 100,
      fuelUsedLiters: 0,
      totalPassengersCarried: 0,
      bribesPaid: 0,
      
      lifetimeStats: INITIAL_LIFETIME,

      isAccelerating: false,
      isBraking: false,

      currentPassengers: 0,
      maxPassengers: 14,
      nextStageDistance: 0,
      lastStageDistance: -1000,
      nextStagePassengerCount: 0,
      activeModal: 'NONE',
      stageData: null,
      
      nextPoliceDistance: 0,
      policeData: null,
      
      gameStatus: 'IDLE',
      isCrashing: false,
      gameOverReason: null,
      gameTimeRemaining: 0,
      
      happiness: 100,
      isStereoOn: false,
      isSoundOn: true,
      isEngineSoundOn: true,
      
      timeOfDay: 'DAY',

      setScreen: (screen) => set({ currentScreen: screen }),
      
      setPlayerInfo: (name, sacco) => set({ playerName: name, saccoName: sacco }),
      
      setVehicleType: (type) => set({ vehicleType: type }),
      
      selectRoute: (route) => set({ selectedRoute: route }),

      setCurrentSpeed: (speed) => set({ currentSpeed: speed }),

      registerUser: () => set({ userMode: 'REGISTERED' }),

      unlockVehicle: (type) => {
        const { bankBalance, unlockedVehicles } = get();
        const price = VEHICLE_SPECS[type].price;
        
        if (bankBalance >= price && !unlockedVehicles.includes(type)) {
          playSfx('COIN');
          set({
            bankBalance: bankBalance - price,
            unlockedVehicles: [...unlockedVehicles, type]
          });
        }
      },

      setControl: (control, active) => {
        if (control === 'GAS') set({ isAccelerating: active });
        if (control === 'BRAKE') set({ isBraking: active });
      },

      updateDistance: (amount) => {
        const { 
          distanceTraveled, 
          totalRouteDistance, 
          nextStageDistance, 
          nextPoliceDistance, 
          currentSpeed, 
          activeModal, 
          triggerStage, 
          triggerPoliceCheck, 
          endGame, 
          fuel, 
          fuelUsedLiters,
          vehicleType,
          isAccelerating
        } = get();
        
        // Check Destination / Completion
        if (activeModal === 'NONE' && currentSpeed > 0 && distanceTraveled + amount >= totalRouteDistance) {
          set({ distanceTraveled: totalRouteDistance, currentSpeed: 0 }); // Force stop
          endGame('COMPLETED');
          return;
        }

        // --- Fuel Logic ---
        let newFuel = fuel;
        let newFuelUsedLiters = fuelUsedLiters;

        if (vehicleType && currentSpeed > 0) {
          const kmTraveled = amount / 1000; // Convert game units to km
          const baseEfficiency = FUEL_EFFICIENCY[vehicleType] || 9;
          
          // Speed Penalty
          let speedPenalty = 1;
          const kmph = currentSpeed * 1.6;
          if (kmph > 80) {
            speedPenalty = 1 + ((kmph - 80) / 100); 
          }
          
          const accelPenalty = isAccelerating ? 1.2 : 1.0;
          const realEfficiency = baseEfficiency / (speedPenalty * accelPenalty);
          
          const litersConsumed = kmTraveled / realEfficiency;
          newFuelUsedLiters += litersConsumed;

          // Update Gauge Percentage
          const capacity = TANK_CAPACITY[vehicleType] || 70;
          const percentConsumed = (litersConsumed / capacity) * 100;
          newFuel = Math.max(0, fuel - percentConsumed);
        }

        // Check Police
        if (activeModal === 'NONE' && currentSpeed > 0 && distanceTraveled + amount >= nextPoliceDistance) {
          set({ distanceTraveled: nextPoliceDistance, currentSpeed: 0, fuel: newFuel, fuelUsedLiters: newFuelUsedLiters }); // Force stop
          triggerPoliceCheck();
          return;
        }

        // Check Stage
        if (activeModal === 'NONE' && currentSpeed > 0 && distanceTraveled + amount >= nextStageDistance) {
          set({ distanceTraveled: nextStageDistance, currentSpeed: 0, fuel: newFuel, fuelUsedLiters: newFuelUsedLiters }); // Force stop
          triggerStage();
          return;
        } 
        
        set({ distanceTraveled: distanceTraveled + amount, fuel: newFuel, fuelUsedLiters: newFuelUsedLiters });
      },
      
      triggerStage: () => {
        const { currentPassengers, nextStagePassengerCount, vehicleType, distanceTraveled, totalRouteDistance } = get();
        
        const waiting = nextStagePassengerCount; 
        const alighting = currentPassengers > 0 ? Math.floor(Math.random() * (currentPassengers + 1)) : 0;
        
        const spec = vehicleType ? VEHICLE_SPECS[vehicleType] : VEHICLE_SPECS['14-seater'];
        const { min, max } = spec.fareRange;
        
        const distanceRemainingRatio = Math.max(0, (totalRouteDistance - distanceTraveled) / totalRouteDistance);
        
        // As you get closer (ratio -> 0), price -> min. At start (ratio -> 1), price -> max
        let calculatedFare = min + ((max - min) * distanceRemainingRatio);
        calculatedFare = Math.ceil(calculatedFare / 10) * 10;
        calculatedFare = Math.max(calculatedFare, min);

        set({
          currentSpeed: 0,
          activeModal: 'STAGE',
          stageData: {
            name: `Stage ${Math.floor(Math.random() * 100)}`,
            waitingPassengers: waiting,
            alightingPassengers: alighting,
            ticketPrice: calculatedFare
          }
        });
      },
      
      handleStageAction: (action) => {
        const { stageData, currentPassengers, maxPassengers, stats, nextStageDistance, happiness, totalPassengersCarried, vehicleType } = get();
        if (!stageData) return;

        let newPassengerCount = currentPassengers;
        let cashEarned = 0;
        let boarding = 0;
        
        const FARE_PER_PAX = stageData.ticketPrice;

        const limits = vehicleType ? VEHICLE_CAPACITY[vehicleType] : { legal: 14, max: 18 };
        const absoluteMax = limits.max;

        newPassengerCount -= stageData.alightingPassengers;
        if (newPassengerCount < 0) newPassengerCount = 0;

        if (action === 'PICKUP_LEGAL') {
          const availableSeats = maxPassengers - newPassengerCount;
          boarding = Math.min(availableSeats, stageData.waitingPassengers);
        } 
        else if (action === 'PICKUP_OVERLOAD') {
          const spaceLeft = absoluteMax - newPassengerCount;
          boarding = Math.min(spaceLeft, stageData.waitingPassengers);
        }
        
        newPassengerCount += boarding;
        cashEarned = boarding * FARE_PER_PAX;

        const currentStagePos = nextStageDistance;
        const nextDist = nextStageDistance + 2000 + Math.random() * 1000; 
        
        const happinessFactor = Math.max(0.1, happiness / 100);
        const maxPotentialPassengers = Math.floor(8 * happinessFactor);
        const nextPax = Math.floor(Math.random() * (maxPotentialPassengers + 1));

        set({
          currentPassengers: newPassengerCount,
          totalPassengersCarried: totalPassengersCarried + boarding,
          stats: {
            ...stats,
            cash: stats.cash + cashEarned
          },
          activeModal: 'NONE',
          stageData: null,
          lastStageDistance: currentStagePos,
          nextStageDistance: nextDist,
          nextStagePassengerCount: nextPax
        });
      },

      triggerPoliceCheck: () => {
        const { currentPassengers, maxPassengers, distanceTraveled } = get();
        const isOverloaded = currentPassengers > maxPassengers;
        
        let shouldStop = false;
        let bribe = 0;
        let message = "";
        
        if (isOverloaded) {
          shouldStop = true;
          bribe = 1000 + Math.floor(Math.random() * 1500);
          message = "Wewe! You are overloaded! This is a serious offence.";
        } else {
          if (Math.random() > 0.6) {
            shouldStop = true;
            bribe = 100 + Math.floor(Math.random() * 200); 
            message = "Routine check. The boys need some tea.";
          }
        }
        
        const nextPolice = distanceTraveled + 3000 + Math.random() * 2000;

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
          set({ nextPoliceDistance: nextPolice });
        }
      },

      handlePoliceAction: (action) => {
        const { policeData, stats, bribesPaid } = get();
        if (!policeData) return;

        if (action === 'PAY') {
          if (stats.cash >= policeData.bribeAmount) {
            set({
              stats: { ...stats, cash: stats.cash - policeData.bribeAmount },
              bribesPaid: bribesPaid + policeData.bribeAmount,
              activeModal: 'NONE',
              policeData: null,
            });
          }
        } else if (action === 'REFUSE') {
          const arrestChance = policeData.isOverloaded ? 0.5 : 0.1;
          
          if (Math.random() < arrestChance) {
            set({
              activeModal: 'GAME_OVER',
              gameStatus: 'GAME_OVER',
              gameOverReason: 'ARRESTED',
              policeData: null
            });
          } else {
            set({
              activeModal: 'NONE',
              policeData: null,
            });
          }
        }
      },
      
      startGameLoop: () => {
        const { selectedRoute, vehicleType, stats } = get();
        if (!selectedRoute) return;

        // Calculate time based on vehicle capability and route length/difficulty
        let seconds = 420; // Base time (7 mins)
        if (selectedRoute.timeLimit) {
          const timeStr = selectedRoute.timeLimit.toLowerCase();
          let loreMinutes = 0;
          if (timeStr.includes('h')) {
            const parts = timeStr.split('h');
            loreMinutes += parseInt(parts[0]) * 60;
            if (parts[1] && parts[1].includes('m')) {
              loreMinutes += parseInt(parts[1]);
            }
          } else if (timeStr.includes('m')) {
            loreMinutes = parseInt(timeStr);
          }
          if (loreMinutes > 0) {
            // Adjust game seconds: roughly 10 game seconds per lore minute
            seconds = Math.ceil(loreMinutes * 9.3); 
          }
        }

        // Apply Vehicle Time Multiplier (Slower vehicles get more time)
        const spec = vehicleType ? VEHICLE_SPECS[vehicleType] : VEHICLE_SPECS['14-seater'];
        seconds = Math.ceil(seconds * spec.timeMultiplier);

        const totalDist = selectedRoute.distance * 1000;
        
        let maxPax = 14;
        if (vehicleType) {
           maxPax = VEHICLE_CAPACITY[vehicleType].legal;
        }

        const isNight = Math.random() > 0.5;
        const timeOfDay = isNight ? 'NIGHT' : 'DAY';
        const gameTime = isNight ? "08:00 PM" : "08:00 AM";

        const nextPax = Math.floor(Math.random() * 8);

        set({ 
          gameStatus: 'PLAYING', 
          isCrashing: false,
          gameTimeRemaining: seconds,
          gameOverReason: null,
          currentScreen: 'GAME_LOOP',
          distanceTraveled: 0,
          totalRouteDistance: totalDist,
          fuel: 100,
          fuelUsedLiters: 0,
          totalPassengersCarried: 0,
          bribesPaid: 0,
          currentPassengers: 0,
          maxPassengers: maxPax,
          nextStageDistance: 1500,
          lastStageDistance: -1000,
          nextStagePassengerCount: nextPax,
          nextPoliceDistance: 3500 + Math.random() * 1000, 
          policeData: null,
          stageData: null,
          activeModal: 'NONE',
          currentSpeed: 0, 
          isAccelerating: false,
          isBraking: false,
          happiness: 100,
          isStereoOn: false,
          timeOfDay,
          stats: { ...stats, cash: 0, time: gameTime } // Reset session cash to 0
        });
      },

      pauseGame: () => {
        set({ gameStatus: 'PAUSED' });
      },

      resumeGame: () => {
        set({ gameStatus: 'PLAYING' });
      },

      setQuitConfirmation: (show) => {
        if (show) {
          set({ activeModal: 'QUIT_CONFIRM' });
        } else {
          set({ activeModal: 'NONE' });
        }
      },

      exitToMapSelection: () => set({
        currentScreen: 'MAP_SELECT',
        gameStatus: 'IDLE',
        isCrashing: false,
        gameOverReason: null,
        activeModal: 'NONE',
        currentSpeed: 0,
        distanceTraveled: 0,
        totalRouteDistance: 0,
        currentPassengers: 0,
        policeData: null,
        stageData: null,
        happiness: 100
      }),

      triggerCrash: () => {
        playSfx('CRASH');
        set({
          gameStatus: 'CRASHING',
          isCrashing: true,
          currentSpeed: 0, 
          isAccelerating: false
        });
      },

      tickTimer: () => set((state) => {
        if (state.gameStatus !== 'PLAYING') return {};
        
        const newTime = state.gameTimeRemaining - 1;
        
        // Happiness Logic
        let newHappiness = state.happiness;
        if (state.isStereoOn) {
          newHappiness = Math.min(100, state.happiness + 0.5);
        }

        // Penalty for high speed (Driving recklessly)
        if (state.vehicleType && state.currentSpeed > 0) {
            const spec = VEHICLE_SPECS[state.vehicleType];
            const currentKmh = state.currentSpeed * 1.6;
            
            // If driving > 90% max speed, passengers get scared
            if (currentKmh > spec.maxSpeedKmh * 0.9) {
                newHappiness = Math.max(0, newHappiness - 0.5);
            }
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

      endGame: (reason) => set((state) => {
        const fuelPricePerLiter = 182;
        const fuelCost = Math.floor(state.fuelUsedLiters * fuelPricePerLiter);
        
        // Calculate Net Profit
        const sessionEarnings = state.stats.cash;
        const profit = Math.max(0, sessionEarnings - fuelCost);
        
        const distanceKm = state.distanceTraveled / 1000;

        const newLifetime = {
          totalCashEarned: state.lifetimeStats.totalCashEarned + profit,
          totalDistanceKm: state.lifetimeStats.totalDistanceKm + distanceKm,
          totalBribesPaid: state.lifetimeStats.totalBribesPaid + state.bribesPaid,
          totalTripsCompleted: state.lifetimeStats.totalTripsCompleted + (reason === 'COMPLETED' ? 1 : 0)
        };

        // Bank the money if successful completion AND REGISTERED
        let newBankBalance = state.bankBalance;
        if (reason === 'COMPLETED' && state.userMode === 'REGISTERED') {
            newBankBalance += profit;
        }

        return { 
          gameStatus: 'GAME_OVER', 
          gameOverReason: reason,
          activeModal: 'GAME_OVER',
          isCrashing: false,
          lifetimeStats: newLifetime,
          bankBalance: newBankBalance // Update global wealth
        };
      }),
      
      resetGame: () => set({
        currentScreen: 'LANDING',
        stats: INITIAL_STATS,
        selectedRoute: null,
        vehicleType: null,
        currentSpeed: 0,
        distanceTraveled: 0,
        totalRouteDistance: 0,
        currentPassengers: 0,
        nextStageDistance: 0,
        lastStageDistance: -1000,
        nextStagePassengerCount: 0,
        nextPoliceDistance: 0,
        fuel: 100,
        fuelUsedLiters: 0,
        activeModal: 'NONE',
        gameStatus: 'IDLE',
        isCrashing: false,
        gameOverReason: null,
        gameTimeRemaining: 0,
        happiness: 100,
        isStereoOn: false,
        timeOfDay: 'DAY',
        isAccelerating: false,
        isBraking: false
      }),

      resetCareer: () => set({
        lifetimeStats: INITIAL_LIFETIME,
        bankBalance: 0, // Reset Wealth
        userMode: 'GUEST',
        unlockedVehicles: ['boda'],
        playerName: '',
        saccoName: '',
        currentScreen: 'LANDING',
        stats: INITIAL_STATS
      }),
      
      toggleStereo: () => set((state) => ({ isStereoOn: !state.isStereoOn })),
      
      reportLaneChange: () => set((state) => ({ 
        happiness: Math.max(0, state.happiness - 2)
      })),

      toggleSound: () => {
        const newState = !get().isSoundOn;
        set({ isSoundOn: newState });
        // Sync with audio util
        import('../utils/audio').then(mod => {
            // We can add a function to audio.ts to sync state if needed, 
            // but audio.ts pulls from store directly in playSfx so it's fine.
        });
      },

      toggleEngineSound: () => set((state) => ({ isEngineSoundOn: !state.isEngineSoundOn })),
    }),
    {
      name: 'matatu-master-storage',
      storage: createJSONStorage(() => secureStorage), // Use our secure storage
      partialize: (state) => ({
        playerName: state.playerName,
        saccoName: state.saccoName,
        userMode: state.userMode,
        unlockedVehicles: state.unlockedVehicles,
        lifetimeStats: state.lifetimeStats,
        bankBalance: state.bankBalance, // Persist Bank Balance
        isSoundOn: state.isSoundOn,
        isEngineSoundOn: state.isEngineSoundOn,
        currentScreen: state.currentScreen,
        vehicleType: state.vehicleType,
        selectedRoute: state.selectedRoute,
      }),
      onRehydrateStorage: () => (state) => {
        // Hydration callback
        if (state) {
            // Ensure backwards compatibility or missing fields init
            if (!state.unlockedVehicles || state.unlockedVehicles.length === 0) {
              state.unlockedVehicles = ['boda'];
            }
            if (!state.userMode) {
              state.userMode = 'GUEST';
            }

            // Also ensure we aren't stuck in a weird game state
            if (['GAME_LOOP', 'CRASHING', 'GAME_OVER', 'PAUSED'].includes(state.currentScreen)) {
                state.currentScreen = 'MAP_SELECT';
                state.gameStatus = 'IDLE';
                state.activeModal = 'NONE';
                state.currentSpeed = 0;
                state.isCrashing = false;
            }
        }
      }
    }
  )
);
