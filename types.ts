
export type ScreenName = 'LANDING' | 'SETUP' | 'MAP_SELECT' | 'DASHBOARD' | 'GAME_LOOP';

export type VehicleType = '14-seater' | '32-seater' | '52-seater';

export type GameStatus = 'IDLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export type GameOverReason = 'TIME_UP' | 'CRASH' | 'COMPLETED' | null;

export interface PlayerStats {
  cash: number;
  reputation: number; // 0-100
  time: string; // e.g., "06:00 AM" (In-game world clock)
  energy: number; // 0-100
}

export interface Route {
  id: string;
  name: string;
  distance: number; // km
  potentialEarnings: number;
  trafficLevel: 'Low' | 'Medium' | 'Gridlock';
  dangerLevel: 'Safe' | 'Sketchy' | 'No-Go Zone';
  timeLimit?: string; // e.g. "30 mins"
  description?: string;
  isLocked?: boolean;
}

export interface GameState {
  currentScreen: ScreenName;
  stats: PlayerStats;
  selectedRoute: Route | null;
  playerName: string;
  saccoName: string;
  vehicleType: VehicleType | null;
  currentSpeed: number; // Game units per second
  distanceTraveled: number; // Game units
  
  // Active Game Session State
  gameStatus: GameStatus;
  gameOverReason: GameOverReason;
  gameTimeRemaining: number; // seconds
}
