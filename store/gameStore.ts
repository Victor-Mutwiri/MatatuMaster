
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GameState, PlayerStats, Route, ScreenName, VehicleType, GameStatus, GameOverReason, StageData, PoliceData, LifetimeStats } from '../types';
import { playSfx } from '../utils/audio';

const INITIAL_STATS: PlayerStats = {
  cash: 500,
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
  'boda': { legal: 1, max: 3 },
  'tuktuk': { legal: 3, max: 5 },
  'personal-car': { legal: 4, max: 5 },
  '14-seater': { legal: 14, max: 18 },
  '32-seater': { legal: 32, max: 40 },
  '52-seater': { legal: 52, max: 70 }
};

interface GameStore extends GameState {
  setScreen: (screen: ScreenName) => void;
  setPlayerInfo: (name: string, sacco: string) => void;
  setVehicleType: (type: VehicleType) => void;
  selectRoute: (route: Route) => void;
  resetGame: () => void;
  resetCareer: () => void; // New action to wipe save
  updateDistance: (delta: number) => void;
  setCurrentSpeed: (speed: number) => void;
  
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
      stats: INITIAL_STATS,
      selectedRoute: null,
      playerName: '',
      saccoName: '',
      vehicleType: null,
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
        const { currentPassengers, nextStagePassengerCount } = get();
        
        const waiting = nextStagePassengerCount; 
        const alighting = currentPassengers > 0 ? Math.floor(Math.random() * (currentPassengers + 1)) : 0;
        
        set({
          currentSpeed: 0,
          activeModal: 'STAGE',
          stageData: {
            name: `Stage ${Math.floor(Math.random() * 100)}`,
            waitingPassengers: waiting,
            alightingPassengers: alighting
          }
        });
      },
      
      handleStageAction: (action) => {
        const { stageData, currentPassengers, maxPassengers, stats, nextStageDistance, happiness, totalPassengersCarried, vehicleType } = get();
        if (!stageData) return;

        let newPassengerCount = currentPassengers;
        let cashEarned = 0;
        let boarding = 0;
        const FARE_PER_PAX = 50;

        // Limits
        const limits = vehicleType ? VEHICLE_CAPACITY[vehicleType] : { legal: 14, max: 18 };
        const absoluteMax = limits.max;

        // 1. Process Alighting
        newPassengerCount -= stageData.alightingPassengers;
        if (newPassengerCount < 0) newPassengerCount = 0;

        // 2. Process Boarding
        if (action === 'PICKUP_LEGAL') {
          const availableSeats = maxPassengers - newPassengerCount;
          boarding = Math.min(availableSeats, stageData.waitingPassengers);
        } 
        else if (action === 'PICKUP_OVERLOAD') {
          // Cap at physical maximum of vehicle
          const spaceLeft = absoluteMax - newPassengerCount;
          boarding = Math.min(spaceLeft, stageData.waitingPassengers);
        }
        
        newPassengerCount += boarding;
        cashEarned = boarding * FARE_PER_PAX;

        // 3. Update State
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

        let seconds = 420; 
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
            seconds = Math.ceil(loreMinutes * 9.3); 
          }
        }

        const totalDist = selectedRoute.distance * 1000;
        
        // Set Max Passengers based on legal limit
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
          stats: { ...stats, time: gameTime }
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

      endGame: (reason) => set((state) => {
        const fuelPricePerLiter = 182;
        const fuelCost = Math.floor(state.fuelUsedLiters * fuelPricePerLiter);
        const profit = Math.max(0, state.stats.cash - fuelCost);
        const distanceKm = state.distanceTraveled / 1000;

        const newLifetime = {
          totalCashEarned: state.lifetimeStats.totalCashEarned + profit,
          totalDistanceKm: state.lifetimeStats.totalDistanceKm + distanceKm,
          totalBribesPaid: state.lifetimeStats.totalBribesPaid + state.bribesPaid,
          totalTripsCompleted: state.lifetimeStats.totalTripsCompleted + (reason === 'COMPLETED' ? 1 : 0)
        };

        return { 
          gameStatus: 'GAME_OVER', 
          gameOverReason: reason,
          activeModal: 'GAME_OVER',
          isCrashing: false,
          lifetimeStats: newLifetime
        };
      }),
      
      resetGame: () => set({
        currentScreen: 'LANDING',
        stats: INITIAL_STATS,
        selectedRoute: null,
        // We do NOT reset player info here anymore, handled in resetCareer
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
        // isSoundOn: true, // Persisted now
        timeOfDay: 'DAY',
        isAccelerating: false,
        isBraking: false
      }),

      resetCareer: () => set({
        lifetimeStats: INITIAL_LIFETIME,
        playerName: '',
        saccoName: '',
        currentScreen: 'LANDING',
        stats: INITIAL_STATS
      }),
      
      toggleStereo: () => set((state) => ({ isStereoOn: !state.isStereoOn })),
      
      reportLaneChange: () => set((state) => ({ 
        happiness: Math.max(0, state.happiness - 2)
      })),

      toggleSound: () => set((state) => ({ isSoundOn: !state.isSoundOn })),

      toggleEngineSound: () => set((state) => ({ isEngineSoundOn: !state.isEngineSoundOn })),
    }),
    {
      name: 'matatu-master-storage',
      // Only persist specific fields
      partialize: (state) => ({
        playerName: state.playerName,
        saccoName: state.saccoName,
        lifetimeStats: state.lifetimeStats,
        isSoundOn: state.isSoundOn,
        isEngineSoundOn: state.isEngineSoundOn,
        // Added Screen Persistence
        currentScreen: state.currentScreen,
        vehicleType: state.vehicleType,
        selectedRoute: state.selectedRoute,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // If the user refreshes while playing, we reset the active game state
          // but keep them in the flow (e.g., Map Select) rather than Landing.
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
