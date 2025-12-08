
import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { VehicleType } from '../../types';
import { useGameStore } from '../../store/gameStore';
import * as THREE from 'three';

// Import Modular Components
import { PhysicsController, CameraRig } from './logic/GameMechanics';
import { NairobiMap } from './maps/NairobiMap';
import { DirtRoadMap } from './maps/DirtRoadMap';
import { PlayerController } from './PlayerController';
import { OncomingTraffic } from './logic/TrafficSystem';

interface GameSceneProps {
  vehicleType: VehicleType | null;
}

const CAMERA_POS = new THREE.Vector3(0, 8, 15);

export const GameScene: React.FC<GameSceneProps> = ({ vehicleType }) => {
  const [playerLane, setPlayerLane] = useState(-1);
  const timeOfDay = useGameStore(state => state.timeOfDay);
  const selectedRoute = useGameStore(state => state.selectedRoute);
  
  const isOffroad = selectedRoute?.id === 'rural-dirt';

  const bgClass = timeOfDay === 'NIGHT' 
    ? 'bg-gradient-to-b from-slate-900 via-slate-800 to-indigo-950'
    : isOffroad 
      ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-200 via-orange-100 to-amber-50' // Dusty Look
      : 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-400 via-blue-300 to-blue-200';

  const fogColor = timeOfDay === 'NIGHT' 
    ? '#1e293b' 
    : isOffroad 
      ? '#e7d4c0' // Dust color
      : '#e0f2fe';

  return (
    <div className={`w-full h-full ${bgClass}`}>
      <Canvas shadows camera={{ position: [CAMERA_POS.x, CAMERA_POS.y, CAMERA_POS.z], fov: 45 }}>
        {/* Adjusted Lighting for Visibility */}
        <ambientLight intensity={timeOfDay === 'NIGHT' ? 0.5 : 0.6} />
        <directionalLight 
          position={timeOfDay === 'NIGHT' ? [-20, 30, -10] : [20, 30, 10]} 
          intensity={timeOfDay === 'NIGHT' ? 0.8 : 1.5} 
          castShadow 
          shadow-mapSize={[1024, 1024]} 
          color={timeOfDay === 'NIGHT' ? "#cbd5e1" : (isOffroad ? "#ffedd5" : "#ffffff")} 
        />
        
        {/* Game Logic */}
        <PhysicsController />
        <CameraRig />

        {/* Map Selection */}
        {isOffroad ? <DirtRoadMap /> : <NairobiMap />}

        {/* Player & Traffic */}
        <PlayerController type={vehicleType || '14-seater'} setLaneCallback={setPlayerLane} />
        <OncomingTraffic playerLane={playerLane} />
        
        <fog attach="fog" args={[fogColor, 20, 100]} />
      </Canvas>
      <div className="absolute bottom-28 inset-x-0 flex justify-center pointer-events-none opacity-50">
        <p className={`text-xs animate-pulse ${isOffroad ? 'text-orange-900/50' : 'text-white/50'}`}>
          <span className="hidden sm:inline">Use Arrow Keys to Accelerate/Brake & Switch Lanes</span>
          <span className="sm:hidden">Swipe Left/Right to Switch Lanes</span>
        </p>
      </div>
    </div>
  );
};
