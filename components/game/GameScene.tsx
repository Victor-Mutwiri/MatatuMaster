
import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { VehicleType } from '../../types';
import { useGameStore } from '../../store/gameStore';
import * as THREE from 'three';

// Import Modular Components
import { PhysicsController, CameraRig } from './logic/GameMechanics';
import { NairobiMap } from './maps/NairobiMap';
import { PlayerController } from './PlayerController';
import { OncomingTraffic } from './logic/TrafficSystem';

interface GameSceneProps {
  vehicleType: VehicleType | null;
}

const CAMERA_POS = new THREE.Vector3(0, 8, 15);

export const GameScene: React.FC<GameSceneProps> = ({ vehicleType }) => {
  const [playerLane, setPlayerLane] = useState(-1);
  const timeOfDay = useGameStore(state => state.timeOfDay);
  const bgClass = timeOfDay === 'NIGHT' 
    ? 'bg-gradient-to-b from-black via-slate-900 to-indigo-950'
    : 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-400 via-blue-300 to-blue-200';

  return (
    <div className={`w-full h-full ${bgClass}`}>
      <Canvas shadows camera={{ position: [CAMERA_POS.x, CAMERA_POS.y, CAMERA_POS.z], fov: 45 }}>
        <ambientLight intensity={timeOfDay === 'NIGHT' ? 0.2 : 0.6} />
        <directionalLight 
          position={timeOfDay === 'NIGHT' ? [-20, 30, -10] : [20, 30, 10]} 
          intensity={timeOfDay === 'NIGHT' ? 0.3 : 1.5} 
          castShadow 
          shadow-mapSize={[1024, 1024]} 
          color={timeOfDay === 'NIGHT' ? "#b0c4de" : "#ffffff"} 
        />
        
        {/* Game Logic */}
        <PhysicsController />
        <CameraRig />

        {/* Map */}
        <NairobiMap />

        {/* Player & Traffic */}
        <PlayerController type={vehicleType || '14-seater'} setLaneCallback={setPlayerLane} />
        <OncomingTraffic playerLane={playerLane} />
        
        <fog attach="fog" args={[timeOfDay === 'NIGHT' ? '#020617' : '#e0f2fe', 15, 80]} />
      </Canvas>
      <div className="absolute bottom-28 inset-x-0 flex justify-center pointer-events-none opacity-50">
        <p className="text-white/50 text-xs animate-pulse">
          <span className="hidden sm:inline">Use Arrow Keys to Accelerate/Brake & Switch Lanes</span>
          <span className="sm:hidden">Swipe Left/Right to Switch Lanes</span>
        </p>
      </div>
    </div>
  );
};
