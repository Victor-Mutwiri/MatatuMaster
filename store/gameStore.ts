
import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { GameState, PlayerStats, Route, ScreenName, VehicleType, GameStatus, GameOverReason, StageData, PoliceData, LifetimeStats, UserMode } from '../types';
import { playSfx } from '../utils/audio';
import { GameService } from '../services/gameService';

// --- SHARED MAP DEFINITIONS ---
export const MAP_DEFINITIONS: Route[] = [
  {
    id: 'kiambu-route',
    name: 'Nairobi → Kiambu',
    distance: 14.5,
    potentialEarnings: 4500,
    trafficLevel: 'Medium',
    dangerLevel: 'Safe',
    timeLimit: '45 mins',
    description: 'The standard commuter route. Good for beginners.',
    isLocked: false
  },
  {
    id: 'river-road',
    name: 'River Road Gridlock',
    distance: 6.5,
    potentialEarnings: 15000,
    trafficLevel: 'Gridlock',
    dangerLevel: 'No-Go Zone',
    timeLimit: '40 mins',
    description: 'The Chaos Capital. Traffic is stuck. Drive on the pavement to pass, squeeze through gaps, but avoid the foot patrol!',
    isLocked: false
  },
  {
    id: 'rural-dirt',
    name: 'Upcountry Dirt Road',
    distance: 17.0,
    potentialEarnings: 6000,
    trafficLevel: 'Low',
    dangerLevel: 'Sketchy',
    timeLimit: '55 mins',
    description: 'A rough offroad route through the village. Very bumpy and dusty.',
    isLocked: false
  },
  {
    id: 'limuru-drive',
    name: 'Limuru Misty Drive',
    distance: 22.5,
    potentialEarnings: 7500,
    trafficLevel: 'High',
    dangerLevel: 'Sketchy',
    timeLimit: '1h 00m',
    description: 'A dangerous single-carriageway. Overtake slow trucks but watch out for incoming traffic in the fog!',
    isLocked: false
  },
  {
    id: 'maimahiu-escarpment',
    name: 'Mai Mahiu Escarpment',
    distance: 35.0,
    potentialEarnings: 9500,
    trafficLevel: 'High',
    dangerLevel: 'No-Go Zone',
    timeLimit: '1h 10m',
    description: 'The Gravity Challenge. A steep descent down the Rift Valley. Gravity accelerates you, brakes will overheat!',
    isLocked: false
  },
  {
    id: 'thika-highway',
    name: 'Thika Highway',
    distance: 40.2,
    potentialEarnings: 8000,
    trafficLevel: 'Gridlock',
    dangerLevel: 'Sketchy',
    timeLimit: '1h 15m',
    description: 'A massive 3-lane superhighway. Overtake traffic moving in your direction. Watch your speed!',
    isLocked: false
  },
  {
    id: 'rongai-extreme',
    name: 'Rongai Extreme',
    distance: 25.0,
    potentialEarnings: 12000,
    trafficLevel: 'Gridlock',
    dangerLevel: 'No-Go Zone',
    timeLimit: '2h 00m',
    description: 'The Wild West. Potholes, overlapping Nganyas, and head-on collision risks. Drive on the shoulder to survive.',
    isLocked: false
  }
];

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
  price: number; // Cost to unlock
}

// Vehicle Performance & Pricing Specs
export const VEHICLE_SPECS: Record<VehicleType, VehicleSpec> = {
  'boda': { 
    maxSpeedKmh: 140, 
    timeMultiplier: 1.0,
    price: 0 // Free
  },
  'tuktuk': { 
    maxSpeedKmh: 90, 
    timeMultiplier: 1.4,
    price: 10000
  },
  'personal-car': { 
    maxSpeedKmh: 190, 
    timeMultiplier: 0.85,
    price: 40000
  },
  '14-seater': { 
    maxSpeedKmh: 175, 
    timeMultiplier: 1.0,
    price: 120000
  },
  '32-seater': { 
    maxSpeedKmh: 130, 
    timeMultiplier: 1.2,
    price: 200000
  },
  '52-seater': { 
    maxSpeedKmh: 120, 
    timeMultiplier: 1.3,
    price: 350000
  }
};

// --- EARNINGS MATRIX (Map ID -> Vehicle Type -> Max Potential) ---
export const EARNINGS_CAPS: Record<string, Record<VehicleType, number>> = {
  'kiambu-route': {
    'boda': 800,
    'personal-car': 3000,
    'tuktuk': 600,
    '14-seater': 1700,
    '32-seater': 3000,
    '52-seater': 3800
  },
  'river-road': {
    'boda': 500,
    'personal-car': 1500,
    'tuktuk': 500,
    '14-seater': 600,
    '32-seater': 1300,
    '52-seater': 1800
  },
  'rural-dirt': {
    'boda': 400,
    'personal-car': 1000,
    'tuktuk': 400,
    '14-seater': 750,
    '32-seater': 1100,
    '52-seater': 1800
  },
  'limuru-drive': {
    'boda': 800,
    'personal-car': 3000,
    'tuktuk': 600,
    '14-seater': 1300,
    '32-seater': 2000,
    '52-seater': 2800
  },
  'maimahiu-escarpment': {
    'boda': 700,
    'personal-car': 4000,
    'tuktuk': 800,
    '14-seater': 1300,
    '32-seater': 2000,
    '52-seater': 2800
  },
  'thika-highway': {
    'boda': 700,
    'personal-car': 2000,
    'tuktuk': 600,
    '14-seater': 1300,
    '32-seater': 2000,
    '52-seater': 2800
  },
  'rongai-extreme': {
    'boda': 800,
    'personal-car': 3000,
    'tuktuk': 600,
    '14-seater': 1300,
    '32-seater': 2000,
    '52-seater': 2800
  }
};

interface GameStore extends GameState {
  userId: string | null; // Supabase Auth UID
  setScreen: (screen: ScreenName) => void;
  setPlayerInfo: (name: string, sacco: string) => void;
  setVehicleType: (type: VehicleType) => void;
  selectRoute: (route: Route) => void;
  resetGame: () => void;
  resetCareer: () => void; 
  deleteAccount: () => Promise<void>; // New action
  updateDistance: (delta: number) => void;
  setCurrentSpeed: (speed: number) => void;
  setBrakeTemp: (temp: number) => void;
  setOverlapTimer: (time: number) => void;
  
  // Progression
  registerUser: (uid: string) => void;
  loadUserData: (data: any) => void;
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
  
  // Banking / Saving
  bankCurrentRun: () => void;

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
  
  // Cloud Sync
  syncToCloud: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      userId: null,
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
      brakeTemp: 0,
      overlapTimer: 0, 
      
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
      
      setBrakeTemp: (temp) => set({ brakeTemp: temp }),

      setOverlapTimer: (time) => set({ overlapTimer: time }),

      registerUser: (uid) => set({ userMode: 'REGISTERED', userId: uid }),

      loadUserData: (data) => {
        // Hydrate store from Supabase 'player_progress' data
        if (!data) return;
        set({
            bankBalance: data.bank_balance || 0,
            lifetimeStats: {
                totalCashEarned: data.lifetime_earnings || 0,
                totalDistanceKm: data.total_distance || 0,
                totalBribesPaid: data.total_bribes || 0,
                totalTripsCompleted: get().lifetimeStats.totalTripsCompleted // Not strictly tracked in DB schema provided, keep local or ignore
            },
            stats: {
                ...get().stats,
                reputation: data.reputation || 50
            },
            unlockedVehicles: data.unlocked_vehicles || ['boda']
        });
      },

      unlockVehicle: (type) => {
        const { bankBalance, unlockedVehicles } = get();
        const price = VEHICLE_SPECS[type].price;
        
        if (bankBalance >= price && !unlockedVehicles.includes(type)) {
          playSfx('COIN');
          const newUnlocked = [...unlockedVehicles, type];
          const newBalance = bankBalance - price;
          
          set({
            bankBalance: newBalance,
            unlockedVehicles: newUnlocked
          });
          
          // Trigger cloud sync
          get().syncToCloud();
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
        const { currentPassengers, nextStagePassengerCount, vehicleType, selectedRoute } = get();
        
        const waiting = nextStagePassengerCount; 
        const alighting = currentPassengers > 0 ? Math.floor(Math.random() * (currentPassengers + 1)) : 0;
        
        const mapId = selectedRoute?.id || 'kiambu-route';
        const vType = vehicleType || '14-seater';
        const mapCaps = EARNINGS_CAPS[mapId] || EARNINGS_CAPS['kiambu-route'];
        const earningCap = mapCaps[vType] || 2000;

        const estimatedStops = Math.ceil(selectedRoute!.distance / 2.5) || 5;
        const legalCapacity = VEHICLE_CAPACITY[vType].legal;
        const avgLoad = Math.max(1, legalCapacity * 0.7);
        let idealFare = earningCap / (estimatedStops * avgLoad);
        const marketFluctuation = 0.9 + Math.random() * 0.4;
        let calculatedFare = Math.ceil((idealFare * marketFluctuation) / 10) * 10;
        calculatedFare = Math.max(10, calculatedFare);

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
        let maxPotentialPassengers = 0;
        
        const chance = Math.random();
        if (chance > 0.8) {
             maxPotentialPassengers = limits.max;
        } else if (chance < 0.2) {
             maxPotentialPassengers = Math.floor(limits.legal * 0.1);
        } else {
             maxPotentialPassengers = Math.floor(limits.legal * 0.6);
        }

        maxPotentialPassengers = Math.ceil(maxPotentialPassengers * happinessFactor);
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
        const { currentPassengers, maxPassengers, distanceTraveled, vehicleType } = get();
        const isOverloaded = currentPassengers > maxPassengers;
        const isPersonalCar = vehicleType === 'personal-car';
        
        let shouldStop = false;
        let bribe = 0;
        let message = "";
        
        if (isOverloaded) {
          shouldStop = true;
          bribe = 2000 + Math.floor(Math.random() * 3000); 
          message = "Wewe! You are overloaded! This is a serious offence. Leta kitu kubwa.";
        } else {
          if (Math.random() > 0.5) {
            shouldStop = true;
            if (isPersonalCar) {
                bribe = 200;
                message = "Niaje boss. Leta ya macho (200).";
            } else {
                bribe = 100;
                message = "Routine check. Toa mia ya chai.";
            }
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
          const arrestChance = policeData.isOverloaded ? 0.8 : 0.2;
          
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
          brakeTemp: 0,
          overlapTimer: 0,
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
          stats: { ...stats, cash: 0, time: gameTime }
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
        brakeTemp: 0,
        overlapTimer: 0,
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

        if (state.vehicleType && state.currentSpeed > 0) {
            const spec = VEHICLE_SPECS[state.vehicleType];
            const currentKmh = state.currentSpeed * 1.6;
            
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

      endGame: (reason) => {
        // Just halt the game and show the appropriate modal.
        // DO NOT save to lifetime stats or sync to cloud here.
        set({ 
          gameStatus: 'GAME_OVER', 
          gameOverReason: reason,
          activeModal: 'GAME_OVER',
          isCrashing: false
        });
      },

      bankCurrentRun: () => {
        const state = get();
        if (state.gameOverReason !== 'COMPLETED') return;

        const fuelPricePerLiter = 182;
        const fuelCost = Math.floor(state.fuelUsedLiters * fuelPricePerLiter);
        
        const sessionEarnings = state.stats.cash;
        const profit = Math.max(0, sessionEarnings - fuelCost);
        const distanceKm = state.distanceTraveled / 1000;

        const newLifetime = {
          totalCashEarned: state.lifetimeStats.totalCashEarned + profit,
          totalDistanceKm: state.lifetimeStats.totalDistanceKm + distanceKm,
          totalBribesPaid: state.lifetimeStats.totalBribesPaid + state.bribesPaid,
          totalTripsCompleted: state.lifetimeStats.totalTripsCompleted + 1
        };

        let newBankBalance = state.bankBalance;
        if (state.userMode === 'REGISTERED') {
            newBankBalance += profit;
        }

        set({
            lifetimeStats: newLifetime,
            bankBalance: newBankBalance
        });

        // Trigger Sync
        get().syncToCloud();
        
        // Return to Map
        get().exitToMapSelection();
      },
      
      syncToCloud: async () => {
        const state = get();
        // Fire and forget sync (don't block UI)
        await GameService.syncProgress(state.userMode, state.userId || undefined, {
            bankBalance: state.bankBalance,
            lifetimeStats: state.lifetimeStats,
            reputation: state.stats.reputation,
            unlockedVehicles: state.unlockedVehicles
        });
      },

      deleteAccount: async () => {
          try {
              if (get().userMode === 'REGISTERED') {
                 await GameService.deleteAccount();
              }
              // Clear local state
              get().resetCareer(); 
          } catch (e) {
              console.error("Failed to delete account fully", e);
              // Force local wipe anyway if backend fails or if it was guest
              get().resetCareer();
          }
      },

      resetGame: () => set({
        currentScreen: 'LANDING',
        userId: null,
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
        brakeTemp: 0,
        overlapTimer: 0,
        timeOfDay: 'DAY',
        isAccelerating: false,
        isBraking: false
      }),

      resetCareer: () => set({
        userId: null,
        lifetimeStats: INITIAL_LIFETIME,
        bankBalance: 0,
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
      },

      toggleEngineSound: () => set((state) => ({ isEngineSoundOn: !state.isEngineSoundOn })),
    }),
    {
      name: 'matatu-master-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        playerName: state.playerName,
        saccoName: state.saccoName,
        userMode: state.userMode,
        userId: state.userId,
        unlockedVehicles: state.unlockedVehicles,
        lifetimeStats: state.lifetimeStats,
        bankBalance: state.bankBalance,
        isSoundOn: state.isSoundOn,
        isEngineSoundOn: state.isEngineSoundOn,
        currentScreen: state.currentScreen,
        vehicleType: state.vehicleType,
        selectedRoute: state.selectedRoute,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
            if (!state.unlockedVehicles || state.unlockedVehicles.length === 0) {
              state.unlockedVehicles = ['boda'];
            }
            if (!state.userMode) {
              state.userMode = 'GUEST';
            }
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
