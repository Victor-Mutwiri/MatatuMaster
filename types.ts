import React from 'react';

export type ScreenName = 'LANDING' | 'SETUP' | 'GAME_MODE' | 'VEHICLE_SELECT' | 'MULTIPLAYER_LOBBY' | 'MAP_SELECT' | 'DASHBOARD' | 'GAME_LOOP' | 'LEADERBOARD' | 'SETTINGS';

export type VehicleType = 'boda' | 'tuktuk' | 'personal-car' | '14-seater' | '32-seater' | '52-seater';

export type UserMode = 'GUEST' | 'REGISTERED';

export type GameStatus = 'IDLE' | 'PLAYING' | 'PAUSED' | 'CRASHING' | 'GAME_OVER';

export type GameOverReason = 'TIME_UP' | 'CRASH' | 'COMPLETED' | 'ARRESTED' | null;

export type ActiveModal = 'NONE' | 'STAGE' | 'GAME_OVER' | 'POLICE' | 'QUIT_CONFIRM';

export interface PlayerStats {
  cash: number;
  reputation: number; // 0-100
  time: string; // e.g., "06:00 AM" (In-game world clock)
  energy: number; // 0-100
}

export interface LifetimeStats {
  totalCashEarned: number;
  totalDistanceKm: number;
  totalBribesPaid: number;
  totalTripsCompleted: number;
}

export interface Route {
  id: string;
  name: string;
  distance: number; // km
  potentialEarnings: number;
  trafficLevel: 'Low' | 'Medium' | 'High' | 'Gridlock';
  dangerLevel: 'Safe' | 'Sketchy' | 'No-Go Zone';
  timeLimit?: string; // e.g. "30 mins"
  description?: string;
  isLocked?: boolean;
}

export interface StageData {
  name: string;
  waitingPassengers: number;
  alightingPassengers: number;
  ticketPrice: number; // The calculated fare for this specific stop
}

export interface PoliceData {
  bribeAmount: number;
  isOverloaded: boolean;
  message: string;
}

export interface GameState {
  currentScreen: ScreenName;
  userMode: UserMode; // Guest or Registered
  bankBalance: number; // Persistent accumulated wealth
  stats: PlayerStats;
  selectedRoute: Route | null;
  playerName: string;
  saccoName: string;
  vehicleType: VehicleType | null;
  unlockedVehicles: VehicleType[]; // List of owned vehicles
  currentSpeed: number; // Game units per second
  distanceTraveled: number; // Game units
  totalRouteDistance: number; // Total length of route in Game units
  
  // Mechanics
  fuel: number; // 0-100 (Percentage)
  fuelUsedLiters: number; // Actual liters consumed
  totalPassengersCarried: number; // Session total
  bribesPaid: number; // Session total
  
  // Lifetime Tracking
  lifetimeStats: LifetimeStats;

  // Controls
  isAccelerating: boolean;
  isBraking: boolean;

  // Passenger State
  currentPassengers: number;
  maxPassengers: number;
  
  // Stage State
  nextStageDistance: number;
  lastStageDistance: number; // The distance of the stage we just left (for visuals)
  nextStagePassengerCount: number; // Visual representation count
  activeModal: ActiveModal;
  stageData: StageData | null;
  
  // Police State
  nextPoliceDistance: number;
  policeData: PoliceData | null;
  
  // Active Game Session State
  gameStatus: GameStatus;
  isCrashing: boolean; // Visual flag for crash animation
  gameOverReason: GameOverReason;
  gameTimeRemaining: number; // seconds
  
  // Happiness & Mechanics
  happiness: number; // 0-100
  isStereoOn: boolean;
  
  // Settings
  isSoundOn: boolean;
  isEngineSoundOn: boolean;
  
  // Environment
  timeOfDay: 'DAY' | 'NIGHT';
}

// Global augmentation for React Three Fiber elements to prevent TS errors
declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Core
      group: any;
      mesh: any;
      primitive: any;
      
      // Lights
      ambientLight: any;
      pointLight: any;
      directionalLight: any;
      spotLight: any;
      
      // Cameras / Effects
      fog: any;
      
      // Geometries
      boxGeometry: any;
      planeGeometry: any;
      sphereGeometry: any;
      cylinderGeometry: any;
      circleGeometry: any;
      coneGeometry: any;
      dodecahedronGeometry: any;
      
      // Materials
      meshStandardMaterial: any;
      meshBasicMaterial: any;

      // Catch-all to prevent other R3F errors
      [elemName: string]: any;
    }
  }
}

// Augmentation for 'react' module specifically to ensure it overrides module types
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      // Core
      group: any;
      mesh: any;
      primitive: any;
      
      // Lights
      ambientLight: any;
      pointLight: any;
      directionalLight: any;
      spotLight: any;
      
      // Cameras / Effects
      fog: any;
      
      // Geometries
      boxGeometry: any;
      planeGeometry: any;
      sphereGeometry: any;
      cylinderGeometry: any;
      circleGeometry: any;
      coneGeometry: any;
      dodecahedronGeometry: any;
      
      // Materials
      meshStandardMaterial: any;
      meshBasicMaterial: any;

      // Catch-all
      [elemName: string]: any;
    }
  }
}