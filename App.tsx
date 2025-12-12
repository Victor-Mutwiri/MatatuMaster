
import React, { useEffect } from 'react';
import { LandingScreen } from './screens/LandingScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { PlayerSetupScreen } from './screens/PlayerSetupScreen';
import { GameModeScreen } from './screens/GameModeScreen';
import { VehicleSelectionScreen } from './screens/VehicleSelectionScreen';
import { MultiplayerLobbyScreen } from './screens/MultiplayerLobbyScreen';
import { MapSelectionScreen } from './screens/MapSelectionScreen';
import { GameLoopScreen } from './screens/GameLoopScreen';
import { LeaderboardScreen } from './screens/LeaderboardScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { BankScreen } from './screens/BankScreen';
import { useGameStore } from './store/gameStore';
import { Route } from './types';
import { CelebrationOverlay } from './components/ui/CelebrationOverlay';

const App: React.FC = () => {
  const { currentScreen, stats, setScreen, selectRoute, resetGame, checkLocation } = useGameStore();

  useEffect(() => {
    checkLocation();
  }, []);

  const handleStartShift = () => {
    setScreen('SETUP');
  };

  const handleSelectRoute = (route: Route) => {
    // Legacy dashboard handler - kept for backward compatibility if we revert to dashboard
    selectRoute(route);
  };

  const handleLogout = () => {
    resetGame();
  };

  return (
    <>
      <CelebrationOverlay />

      {currentScreen === 'LANDING' && (
        <LandingScreen onStart={handleStartShift} />
      )}
      
      {currentScreen === 'SETTINGS' && (
        <SettingsScreen />
      )}

      {currentScreen === 'SETUP' && (
        <PlayerSetupScreen />
      )}

      {currentScreen === 'GAME_MODE' && (
        <GameModeScreen />
      )}

      {currentScreen === 'VEHICLE_SELECT' && (
        <VehicleSelectionScreen />
      )}

      {currentScreen === 'BANK' && (
        <BankScreen />
      )}

      {currentScreen === 'MULTIPLAYER_LOBBY' && (
        <MultiplayerLobbyScreen />
      )}

      {currentScreen === 'MAP_SELECT' && (
        <MapSelectionScreen />
      )}
      
      {currentScreen === 'GAME_LOOP' && (
        <GameLoopScreen />
      )}

      {currentScreen === 'LEADERBOARD' && (
        <LeaderboardScreen />
      )}
      
      {/* Kept as fallback or future utility screen */}
      {currentScreen === 'DASHBOARD' && (
        <DashboardScreen 
          stats={stats} 
          onSelectRoute={handleSelectRoute}
          onLogout={handleLogout}
        />
      )}
    </>
  );
};

export default App;
