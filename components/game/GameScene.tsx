
import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { VehicleType } from '../../types';
import { useGameStore } from '../../store/gameStore';
import * as THREE from 'three';

// Import Modular Components
import { PhysicsController, CameraRig } from './logic/GameMechanics';
import { NairobiMap } from './maps/NairobiMap';
import { DirtRoadMap } from './maps/DirtRoadMap';
import { ThikaRoadMap } from './maps/ThikaRoadMap';
import { LimuruRoadMap } from './maps/LimuruRoadMap';
import { MaiMahiuMap } from './maps/MaiMahiuMap';
import { RiverRoadMap } from './maps/RiverRoadMap';
import { RongaiMap } from './maps/RongaiMap';
import { MultiplayerThikaMap } from './maps/MultiplayerThikaMap';
import { MultiplayerRongaiMap } from './maps/MultiplayerRongaiMap';
import { PlayerController } from './PlayerController';
import { OncomingTraffic, HighwayTraffic, TwoWayTraffic, EscarpmentTraffic, GridlockTraffic, RongaiTraffic } from './logic/TrafficSystem';
import { GhostCar } from './vehicles/GhostCar';

interface GameSceneProps {
  vehicleType: VehicleType | null;
  playerLane: number;
  setPlayerLane: (lane: number) => void;
}

const CAMERA_POS = new THREE.Vector3(0, 8, 15);

export const GameScene: React.FC<GameSceneProps> = ({ vehicleType, playerLane, setPlayerLane }) => {
  const timeOfDay = useGameStore(state => state.timeOfDay);
  const selectedRoute = useGameStore(state => state.selectedRoute);
  const activeRoomId = useGameStore(state => state.activeRoomId);
  
  // Hustle Maps
  const isOffroad = selectedRoute?.id === 'rural-dirt';
  const isHighway = selectedRoute?.id === 'thika-highway';
  const isLimuru = selectedRoute?.id === 'limuru-drive';
  const isEscarpment = selectedRoute?.id === 'maimahiu-escarpment';
  const isRiverRoad = selectedRoute?.id === 'river-road';
  const isRongai = selectedRoute?.id === 'rongai-extreme';

  // Multiplayer Maps
  const isThikaRace = selectedRoute?.id === 'thika-race';
  const isRongaiRace = selectedRoute?.id === 'rongai-race';

  // Grouping for traffic systems
  const shouldUseHighwayTraffic = isHighway || isThikaRace;
  const shouldUseRongaiTraffic = isRongai || isRongaiRace;

  const bgClass = timeOfDay === 'NIGHT' 
    ? 'bg-gradient-to-b from-slate-900 via-slate-800 to-indigo-950'
    : isOffroad 
      ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-200 via-orange-100 to-amber-50' 
      : isLimuru
        ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-300 via-slate-400 to-slate-200' 
        : isEscarpment
            ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-300 via-sky-200 to-amber-50' 
        : shouldUseHighwayTraffic
            ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-400 via-indigo-300 to-slate-200' 
        : isRiverRoad
            ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-200 via-slate-300 to-slate-400' 
        : shouldUseRongaiTraffic
            ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-200 via-orange-100 to-slate-200' // Dusty Sunset vibe
            : 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-400 via-blue-300 to-blue-200';

  const fogColor = timeOfDay === 'NIGHT' 
    ? '#1e293b' 
    : isOffroad 
      ? '#e7d4c0' 
      : isLimuru 
        ? '#cbd5e1' 
        : isEscarpment
            ? '#e0f2fe' 
            : shouldUseHighwayTraffic
            ? '#cbd5e1'
            : isRiverRoad
            ? '#e2e8f0'
            : shouldUseRongaiTraffic
            ? '#eecfa1' // Dusty fog
            : '#e0f2fe';

  // Fog "Far" Distance
  const fogDensity = isLimuru ? 75 : (shouldUseHighwayTraffic || isEscarpment ? 150 : (isRiverRoad ? 80 : (shouldUseRongaiTraffic ? 90 : 100)));

  return (
    <div className={`w-full h-full ${bgClass}`}>
      <Canvas shadows camera={{ position: [CAMERA_POS.x, CAMERA_POS.y, CAMERA_POS.z], fov: 45 }}>
        {/* Adjusted Lighting for Visibility */}
        <ambientLight intensity={isLimuru ? 0.4 : (timeOfDay === 'NIGHT' ? 0.5 : (shouldUseRongaiTraffic ? 0.7 : 0.6))} />
        <directionalLight 
          position={timeOfDay === 'NIGHT' ? [-20, 30, -10] : [20, 30, 10]} 
          intensity={timeOfDay === 'NIGHT' ? 0.8 : (isLimuru ? 0.8 : (isEscarpment ? 1.8 : 1.5))} 
          castShadow 
          shadow-mapSize={[1024, 1024]} 
          color={timeOfDay === 'NIGHT' ? "#cbd5e1" : (isOffroad || shouldUseRongaiTraffic ? "#ffedd5" : "#ffffff")} 
        />
        
        {/* Game Logic */}
        <PhysicsController playerLane={playerLane} />
        <CameraRig />

        {/* Map Selection Logic */}
        {isThikaRace ? <MultiplayerThikaMap /> : 
         isRongaiRace ? <MultiplayerRongaiMap /> :
         isOffroad ? <DirtRoadMap /> : 
         isHighway ? <ThikaRoadMap /> : 
         isLimuru ? <LimuruRoadMap /> : 
         isEscarpment ? <MaiMahiuMap /> :
         isRiverRoad ? <RiverRoadMap playerLane={playerLane} /> :
         isRongai ? <RongaiMap /> :
         <NairobiMap />}

        {/* Player & Traffic */}
        <PlayerController type={vehicleType || '14-seater'} setLaneCallback={setPlayerLane} />
        
        {/* Multiplayer Ghost */}
        {activeRoomId && <GhostCar />}

        {/* Traffic System Selection */}
        {shouldUseHighwayTraffic ? (
            <HighwayTraffic playerLane={playerLane} />
        ) : isLimuru ? (
            <TwoWayTraffic playerLane={playerLane} />
        ) : isEscarpment ? (
            <EscarpmentTraffic playerLane={playerLane} />
        ) : isRiverRoad ? (
            <GridlockTraffic playerLane={playerLane} />
        ) : shouldUseRongaiTraffic ? (
            <RongaiTraffic playerLane={playerLane} />
        ) : (
            <OncomingTraffic playerLane={playerLane} />
        )}
        
        <fog attach="fog" args={[fogColor, 10, fogDensity]} />
      </Canvas>
      <div className="absolute bottom-28 inset-x-0 flex justify-center pointer-events-none opacity-50">
        <p className={`text-xs animate-pulse ${isOffroad || shouldUseRongaiTraffic ? 'text-orange-900/50' : 'text-white/50'}`}>
          <span className="hidden sm:inline">Use Arrow Keys to Accelerate/Brake & Switch Lanes</span>
          <span className="sm:hidden">Swipe Left/Right to Switch Lanes</span>
        </p>
      </div>
    </div>
  );
};
