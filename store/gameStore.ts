
import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { GameState, PlayerStats, Route, ScreenName, VehicleType, GameStatus, GameOverReason, StageData, PoliceData, LifetimeStats, UserMode, CelebrationType } from '../types';
import { playSfx } from '../utils/audio';
import { GameService } from '../services/gameService';

// --- SHARED MAP DEFINITIONS ---
export const MAP_DEFINITIONS: Route[] = [
  // --- HUSTLE MAPS ---
  {
    id: 'kiambu-route',
    name: 'Nairobi → Kiambu',
    distance: 14.5,
    potentialEarnings: 4500,
    trafficLevel: 'Medium',
    dangerLevel: 'Safe',
    timeLimit: '45 mins',
    description: 'The standard commuter route. Good for beginners.',
    isLocked: false,
    gamemode: 'HUSTLE'
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
    isLocked: false,
    gamemode: 'HUSTLE'
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
    isLocked: false,
    gamemode: 'HUSTLE'
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
    isLocked: false,
    gamemode: 'HUSTLE'
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
    isLocked: false,
    gamemode: 'HUSTLE'
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
    isLocked: false,
    gamemode: 'HUSTLE'
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
    isLocked: false,
    gamemode: 'HUSTLE'
  },

  // --- MULTIPLAYER RACE MAPS ---
  {
    id: 'thika-race',
    name: 'Thika Speed Trap',
    distance: 12.0,
    potentialEarnings: 0,
    trafficLevel: 'High',
    dangerLevel: 'No-Go Zone',
    timeLimit: '8 mins',
    description: 'Pure Speed. Weave through dense highway traffic. No stops, just gas. Instant loss if you crash.',
    isLocked: false,
    gamemode: 'RACE'
  },
  {
    id: 'rongai-race',
    name: 'Rongai Technical',
    distance: 8.5,
    potentialEarnings: 0,
    trafficLevel: 'Medium',
    dangerLevel: 'No-Go Zone',
    timeLimit: '10 mins',
    description: 'Technical Run. Tight lanes, massive potholes, and dust. Suspension killer. One mistake flips your ride.',
    isLocked: false,
    gamemode: 'RACE'
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
// UPDATED PRICES FOR ECONOMY BALANCE
export const VEHICLE_SPECS: Record<VehicleType, VehicleSpec> = {
  'boda': { 
    maxSpeedKmh: 140, 
    timeMultiplier: 1.0,
    price: 0 // Free
  },
  'tuktuk': { 
    maxSpeedKmh: 90, 
    timeMultiplier: 1.4,
    price: 35000 // Increased from 10k
  },
  'personal-car': { 
    maxSpeedKmh: 190, 
    timeMultiplier: 0.85,
    price: 95000 // Increased from 40k
  },
  '14-seater': { 
    maxSpeedKmh: 175, 
    timeMultiplier: 1.0,
    price: 250000 // Increased from 120k (Major Milestone)
  },
  '32-seater': { 
    maxSpeedKmh: 130, 
    timeMultiplier: 1.2,
    price: 650000 // Increased from 200k
  },
  '52-seater': { 
    maxSpeedKmh: 120, 
    timeMultiplier: 1.3,
    price: 1200000 // Increased from 350k (Endgame)
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

const DEFAULT_UPGRADES: Record<VehicleType, number> = {
    'boda': 0,
    'tuktuk': 0,
    'personal-car': 0,
    '14-seater': 0,
    '32-seater': 0,
    '52-seater': 0
};

const EXCHANGE_RATE = 130; // 1 USD = 130 KES

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
  loadUserData: (data: any, country: string | undefined) => void;
  unlockVehicle: (type: VehicleType) => void;
  purchaseCash: (amount: number) => void; 
  
  // International Logic
  checkLocation: () => Promise<void>;
  claimDailyGrant: () => void;
  formatCurrency: (amount: number) => string;

  // Upgrades
  purchaseUpgrade: (type: VehicleType) => void;
  getUpgradeCost: (type: VehicleType, currentLevel: number) => number;
  getUpgradeMultiplier: (type: VehicleType) => number;
  
  // Fuel Upgrades
  purchaseFuelUpgrade: (type: VehicleType) => void;
  getFuelUpgradeCost: (type: VehicleType, currentLevel: number) => number;
  getFuelEfficiencyMultiplier: (type: VehicleType) => number;

  // Performance Upgrades
  purchasePerformanceUpgrade: (type: VehicleType) => void;
  getPerformanceUpgradeCost: (type: VehicleType, currentLevel: number) => number;
  getPerformanceMultiplier: (type: VehicleType) => number;

  // Celebration
  triggerCelebration: (type: CelebrationType, message?: string) => void;

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
      vehicleUpgrades: DEFAULT_UPGRADES,
      vehicleFuelUpgrades: DEFAULT_UPGRADES,
      vehiclePerformanceUpgrades: DEFAULT_UPGRADES,
      currentSpeed: 0,
      distanceTraveled: 0,
      totalRouteDistance: 0,
      
      // International
      isInternational: false,
      isKenyaLocked: false,
      currency: 'KES',
      lastDailyGrantClaim: 0,

      fuel: 100,
      fuelUsedLiters: 0,
      totalPassengersCarried: 0,
      bribesPaid: 0,
      brakeTemp: 0,
      overlapTimer: 0, 
      
      lifetimeStats: INITIAL_LIFETIME,

      activeCelebration: null,

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

      formatCurrency: (amount: number) => {
          const { currency } = get();
          if (currency === 'USD') {
              const usd = amount / EXCHANGE_RATE;
              return `$${usd.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
          }
          return `KES ${amount.toLocaleString()}`;
      },

      checkLocation: async () => {
          const { isKenyaLocked, userMode } = get();
          
          // CRITICAL SECURITY FIX: If user is REGISTERED, do not check IP.
          // We rely on the 'isKenyaLocked' or 'isInternational' state which is set via loadUserData from the DB profile.
          if (userMode === 'REGISTERED') {
              return; 
          }

          // Anti-Exploit: If already detected as Kenyan, FORCE Kenyan mode regardless of VPN
          if (isKenyaLocked) {
              set({ isInternational: false, currency: 'KES' });
              return;
          }

          try {
              // Lightweight IP check for GUESTS ONLY
              const res = await fetch('https://ipapi.co/json/');
              if (res.ok) {
                  const data = await res.json();
                  
                  if (data.country_code === 'KE') {
                      // Detected Kenya: Lock it forever
                      set({ isInternational: false, isKenyaLocked: true, currency: 'KES' });
                  } else {
                      // International: Enable Beta Mode and USD
                      set({ isInternational: true, currency: 'USD' });
                  }
              }
          } catch (e) {
              console.warn("Location check failed, defaulting to local mode (Kenya).", e);
              set({ isInternational: false, currency: 'KES' });
          }
      },

      claimDailyGrant: () => {
          const { lastDailyGrantClaim, bankBalance } = get();
          const now = Date.now();
          // CHANGED: 72 Hours (3 Days) instead of 24 Hours
          const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
          
          if (now - lastDailyGrantClaim >= THREE_DAYS) {
              const grantAmount = 50000; // Value in KES
              set({ 
                  bankBalance: bankBalance + grantAmount, 
                  lastDailyGrantClaim: now 
              });
              get().triggerCelebration('UNLOCK', `GRANT: ${get().formatCurrency(grantAmount)}`);
              get().syncToCloud();
          }
      },

      triggerCelebration: (type, message) => {
          set({ activeCelebration: { type, message } });
          if (type === 'UNLOCK') playSfx('UNLOCK');
          else if (type === 'UPGRADE' || type === 'LEVEL_UP') playSfx('LEVEL_UP');
          
          // Auto dismiss after 3 seconds
          setTimeout(() => {
              // Only clear if it matches the current one (to avoid clearing a newer one)
              const current = get().activeCelebration;
              if (current && current.type === type) {
                  set({ activeCelebration: null });
              }
          }, 3000);
      },

      loadUserData: (data, country) => {
        // Hydrate store from Supabase 'player_progress' and Profile Country
        if (!data) return;
        
        // SECURITY: Enforce country from DB profile
        // If country is 'Kenya', they are LOCKED to Kenya (Standard Payment).
        // If country is anything else, they are International (Grant System).
        let isKenyan = true;
        if (country) {
            isKenyan = country === 'Kenya';
        } else {
            // Fallback for old accounts: Use current locked state or default to Kenya
            isKenyan = get().isKenyaLocked; 
        }

        set({
            bankBalance: data.bank_balance || 0,
            lifetimeStats: {
                totalCashEarned: data.lifetime_earnings || 0,
                totalDistanceKm: data.total_distance || 0,
                totalBribesPaid: data.total_bribes || 0,
                totalTripsCompleted: get().lifetimeStats.totalTripsCompleted
            },
            stats: {
                ...get().stats,
                reputation: data.reputation || 50
            },
            unlockedVehicles: data.unlocked_vehicles || ['boda'],
            vehicleUpgrades: data.vehicle_upgrades || DEFAULT_UPGRADES,
            vehicleFuelUpgrades: data.vehicle_fuel_upgrades || DEFAULT_UPGRADES,
            vehiclePerformanceUpgrades: data.vehicle_performance_upgrades || DEFAULT_UPGRADES,
            // Set Location State based on DB Record
            isKenyaLocked: isKenyan,
            isInternational: !isKenyan,
            currency: isKenyan ? 'KES' : 'USD'
        });
      },

      unlockVehicle: (type) => {
        const { bankBalance, unlockedVehicles } = get();
        const price = VEHICLE_SPECS[type].price;
        
        if (bankBalance >= price && !unlockedVehicles.includes(type)) {
          const newUnlocked = [...unlockedVehicles, type];
          const newBalance = bankBalance - price;
          
          set({
            bankBalance: newBalance,
            unlockedVehicles: newUnlocked
          });
          
          get().triggerCelebration('UNLOCK', `${type.replace('-', ' ')} UNLOCKED!`);
          get().syncToCloud();
        }
      },

      purchaseCash: (amount) => {
        const { bankBalance } = get();
        const newBalance = bankBalance + amount;
        set({ bankBalance: newBalance });
        get().triggerCelebration('UNLOCK', `+ ${get().formatCurrency(amount)}`);
        get().syncToCloud();
      },

      // --- ROUTE UPGRADE ---
      getUpgradeCost: (type: VehicleType, currentLevel: number) => {
          if (currentLevel >= 4) return 0;
          const vehiclePrice = VEHICLE_SPECS[type].price || 10000; 
          const factors = [0.20, 0.35, 0.50, 0.75]; // Steep
          return Math.floor(vehiclePrice * factors[currentLevel]);
      },

      getUpgradeMultiplier: (type: VehicleType) => {
          const level = get().vehicleUpgrades[type] || 0;
          return 1 + (level * 0.15); 
      },

      purchaseUpgrade: (type: VehicleType) => {
          const { bankBalance, vehicleUpgrades } = get();
          const currentLevel = vehicleUpgrades[type] || 0;
          if (currentLevel >= 4) return;
          const cost = get().getUpgradeCost(type, currentLevel);
          
          if (bankBalance >= cost) {
              const newLevel = currentLevel + 1;
              const newUpgrades = { ...vehicleUpgrades, [type]: newLevel };
              set({ bankBalance: bankBalance - cost, vehicleUpgrades: newUpgrades });
              get().triggerCelebration('UPGRADE', `ROUTE LEVEL ${newLevel}`);
              get().syncToCloud();
          }
      },

      // --- FUEL UPGRADE ---
      getFuelUpgradeCost: (type: VehicleType, currentLevel: number) => {
          if (currentLevel >= 4) return 0;
          const vehiclePrice = VEHICLE_SPECS[type].price || 10000; 
          // Cheaper scaling: 10%, 15%, 25%, 40% of vehicle price
          const factors = [0.10, 0.15, 0.25, 0.40];
          return Math.floor(vehiclePrice * factors[currentLevel]);
      },

      getFuelEfficiencyMultiplier: (type: VehicleType) => {
          const level = get().vehicleFuelUpgrades[type] || 0;
          // +15% Base Efficiency per level
          return 1 + (level * 0.15); 
      },

      purchaseFuelUpgrade: (type: VehicleType) => {
          const { bankBalance, vehicleFuelUpgrades } = get();
          const currentLevel = vehicleFuelUpgrades[type] || 0;
          if (currentLevel >= 4) return;
          const cost = get().getFuelUpgradeCost(type, currentLevel);
          
          if (bankBalance >= cost) {
              const newLevel = currentLevel + 1;
              const newUpgrades = { ...vehicleFuelUpgrades, [type]: newLevel };
              set({ bankBalance: bankBalance - cost, vehicleFuelUpgrades: newUpgrades });
              get().triggerCelebration('UPGRADE', `FUEL LEVEL ${newLevel}`);
              get().syncToCloud();
          }
      },

      // --- PERFORMANCE UPGRADE ---
      getPerformanceUpgradeCost: (type: VehicleType, currentLevel: number) => {
          if (currentLevel >= 4) return 0;
          const vehiclePrice = VEHICLE_SPECS[type].price || 10000; 
          // Balanced scaling: 15%, 25%, 40%, 60%
          const factors = [0.15, 0.25, 0.40, 0.60];
          return Math.floor(vehiclePrice * factors[currentLevel]);
      },

      getPerformanceMultiplier: (type: VehicleType) => {
          const level = get().vehiclePerformanceUpgrades[type] || 0;
          // +15% Top Speed per level
          return 1 + (level * 0.15); 
      },

      purchasePerformanceUpgrade: (type: VehicleType) => {
          const { bankBalance, vehiclePerformanceUpgrades } = get();
          const currentLevel = vehiclePerformanceUpgrades[type] || 0;
          if (currentLevel >= 4) return;
          const cost = get().getPerformanceUpgradeCost(type, currentLevel);
          
          if (bankBalance >= cost) {
              const newLevel = currentLevel + 1;
              const newUpgrades = { ...vehiclePerformanceUpgrades, [type]: newLevel };
              set({ bankBalance: bankBalance - cost, vehiclePerformanceUpgrades: newUpgrades });
              get().triggerCelebration('UPGRADE', `ENGINE LEVEL ${newLevel}`);
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
          isAccelerating,
          selectedRoute,
          getFuelEfficiencyMultiplier
        } = get();
        
        if (activeModal === 'NONE' && currentSpeed > 0 && distanceTraveled + amount >= totalRouteDistance) {
          set({ distanceTraveled: totalRouteDistance, currentSpeed: 0 });
          endGame('COMPLETED');
          return;
        }

        let newFuel = fuel;
        let newFuelUsedLiters = fuelUsedLiters;

        if (vehicleType && currentSpeed > 0) {
          const kmTraveled = amount / 1000;
          const baseEfficiency = FUEL_EFFICIENCY[vehicleType] || 9;
          
          // Apply Fuel Upgrade Multiplier
          const fuelMultiplier = getFuelEfficiencyMultiplier(vehicleType);
          
          let speedPenalty = 1;
          const kmph = currentSpeed * 1.6;
          if (kmph > 80) {
            speedPenalty = 1 + ((kmph - 80) / 100); 
          }
          
          const accelPenalty = isAccelerating ? 1.2 : 1.0;
          
          // Formula: Real Eff = (Base * Multiplier) / Penalties
          const realEfficiency = (baseEfficiency * fuelMultiplier) / (speedPenalty * accelPenalty);
          
          const litersConsumed = kmTraveled / realEfficiency;
          newFuelUsedLiters += litersConsumed;

          const capacity = TANK_CAPACITY[vehicleType] || 70;
          const percentConsumed = (litersConsumed / capacity) * 100;
          newFuel = Math.max(0, fuel - percentConsumed);
        }

        const isRace = selectedRoute?.gamemode === 'RACE';

        if (!isRace && activeModal === 'NONE' && currentSpeed > 0 && distanceTraveled + amount >= nextPoliceDistance) {
          set({ distanceTraveled: nextPoliceDistance, currentSpeed: 0, fuel: newFuel, fuelUsedLiters: newFuelUsedLiters });
          triggerPoliceCheck();
          return;
        }

        if (!isRace && activeModal === 'NONE' && currentSpeed > 0 && distanceTraveled + amount >= nextStageDistance) {
          set({ distanceTraveled: nextStageDistance, currentSpeed: 0, fuel: newFuel, fuelUsedLiters: newFuelUsedLiters });
          triggerStage();
          return;
        } 
        
        set({ distanceTraveled: distanceTraveled + amount, fuel: newFuel, fuelUsedLiters: newFuelUsedLiters });
      },
      
      triggerStage: () => {
        const { currentPassengers, nextStagePassengerCount, vehicleType, selectedRoute, vehicleUpgrades } = get();
        
        const waiting = nextStagePassengerCount; 
        const alighting = currentPassengers > 0 ? Math.floor(Math.random() * (currentPassengers + 1)) : 0;
        
        const mapId = selectedRoute?.id || 'kiambu-route';
        const vType = vehicleType || '14-seater';
        const mapCaps = EARNINGS_CAPS[mapId] || EARNINGS_CAPS['kiambu-route'];
        
        // --- UPGRADE LOGIC ---
        const baseCap = mapCaps[vType] || 2000;
        const level = vehicleUpgrades[vType] || 0;
        const multiplier = 1 + (level * 0.15); // +15% per level
        const earningCap = baseCap * multiplier; 

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
        const { stageData, currentPassengers, maxPassengers, stats, nextStageDistance, happiness, totalPassengersCarried, vehicleType, vehicleUpgrades } = get();
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
        
        // --- UPGRADE EFFECT: BETTER PASSENGER SPAWNS ---
        const vType = vehicleType || '14-seater';
        const level = vehicleUpgrades[vType] || 0;
        // Small bias: each level gives slight chance boost for fuller stops
        const crowdBias = level * 0.05; 

        let maxPotentialPassengers = 0;
        
        const chance = Math.random() + crowdBias; // Bias applied here
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

        get().syncToCloud();
        get().exitToMapSelection();
      },
      
      syncToCloud: async () => {
        const state = get();
        await GameService.syncProgress(state.userMode, state.userId || undefined, {
            bankBalance: state.bankBalance,
            lifetimeStats: state.lifetimeStats,
            reputation: state.stats.reputation,
            unlockedVehicles: state.unlockedVehicles,
            vehicleUpgrades: state.vehicleUpgrades,
            vehicleFuelUpgrades: state.vehicleFuelUpgrades,
            vehiclePerformanceUpgrades: state.vehiclePerformanceUpgrades
        });
      },

      deleteAccount: async () => {
          try {
              if (get().userMode === 'REGISTERED') {
                 await GameService.deleteAccount();
              }
              get().resetCareer(); 
          } catch (e) {
              console.error("Failed to delete account fully", e);
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
        vehicleUpgrades: DEFAULT_UPGRADES,
        vehicleFuelUpgrades: DEFAULT_UPGRADES,
        vehiclePerformanceUpgrades: DEFAULT_UPGRADES,
        playerName: '',
        saccoName: '',
        currentScreen: 'LANDING',
        stats: INITIAL_STATS,
        isKenyaLocked: false, // Reset lock on wipe
        currency: 'KES'
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
        vehicleUpgrades: state.vehicleUpgrades,
        vehicleFuelUpgrades: state.vehicleFuelUpgrades,
        vehiclePerformanceUpgrades: state.vehiclePerformanceUpgrades,
        lifetimeStats: state.lifetimeStats,
        bankBalance: state.bankBalance,
        isSoundOn: state.isSoundOn,
        isEngineSoundOn: state.isEngineSoundOn,
        currentScreen: state.currentScreen,
        vehicleType: state.vehicleType,
        selectedRoute: state.selectedRoute,
        lastDailyGrantClaim: state.lastDailyGrantClaim, 
        isKenyaLocked: state.isKenyaLocked, // PERSIST THE LOCK
        currency: state.currency // Persist currency preference
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
            // Reset temporary international flag, but KEEP the lock and currency
            state.isInternational = false;

            if (!state.unlockedVehicles || state.unlockedVehicles.length === 0) {
              state.unlockedVehicles = ['boda'];
            }
            if (!state.vehicleUpgrades) {
                state.vehicleUpgrades = DEFAULT_UPGRADES;
            }
            if (!state.vehicleFuelUpgrades) {
                state.vehicleFuelUpgrades = DEFAULT_UPGRADES;
            }
            if (!state.vehiclePerformanceUpgrades) {
                state.vehiclePerformanceUpgrades = DEFAULT_UPGRADES;
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
