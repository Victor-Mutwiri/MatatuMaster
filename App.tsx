

import React from 'react';
import { LandingScreen } from './screens/LandingScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { PlayerSetupScreen } from './screens/PlayerSetupScreen';
import { MapSelectionScreen } from './screens/MapSelectionScreen';
import { GameLoopScreen } from './screens/GameLoopScreen';
import { LeaderboardScreen } from './screens/LeaderboardScreen';
import { useGameStore } from './store/gameStore';
import { Route } from './types';

const App: React.FC = () => {
  const { currentScreen, stats, setScreen, selectRoute, resetGame } = useGameStore();

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
      {currentScreen === 'LANDING' && (
        <LandingScreen onStart={handleStartShift} />
      )}
      
      {currentScreen === 'SETUP' && (
        <PlayerSetupScreen />
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