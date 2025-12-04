
import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { VehicleType } from '../../types';
import { useGameStore } from '../../store/gameStore';
import * as THREE from 'three';

// --- Components ---

// Logic Component: Updates store distance on every frame
const GameLogic = () => {
  const { currentSpeed, updateDistance, gameStatus } = useGameStore();
  
  useFrame((state, delta) => {
    if (gameStatus === 'PLAYING' && currentSpeed > 0) {
      updateDistance(currentSpeed * delta);
    }
  });

  return null;
};

// Scrolling Road
const Road = () => {
  const groupRef = useRef<THREE.Group>(null);
  const currentSpeed = useGameStore((state) => state.currentSpeed);
  
  const STRIP_COUNT = 20;
  const STRIP_GAP = 5;
  
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.position.z += currentSpeed * delta;
      if (groupRef.current.position.z > STRIP_GAP) {
        groupRef.current.position.z %= STRIP_GAP;
      }
    }
  });

  return (
    <group>
      {/* Asphalt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[20, 200]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} />
      </mesh>

      {/* Markings */}
      <group ref={groupRef}>
        {Array.from({ length: STRIP_COUNT }).map((_, i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -i * STRIP_GAP]}>
            <planeGeometry args={[0.2, 2]} />
            <meshBasicMaterial color="#ffffff" opacity={0.5} transparent />
          </mesh>
        ))}
      </group>
      
      {/* Grass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-15, -0.1, 0]}>
        <planeGeometry args={[10, 200]} />
        <meshStandardMaterial color="#064e3b" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[15, -0.1, 0]}>
        <planeGeometry args={[10, 200]} />
        <meshStandardMaterial color="#064e3b" />
      </mesh>
    </group>
  );
};

// Stage Marker: Appears when approaching a stage
const StageMarker = () => {
  const { nextStageDistance, distanceTraveled } = useGameStore();
  const markerRef = useRef<THREE.Group>(null);
  
  // Calculate relative position
  // If nextStage is 500 and we are at 400, diff is 100.
  // We want the marker to appear at Z = -100 (in front) and move to 0.
  const distanceToStage = nextStageDistance - distanceTraveled;
  const isVisible = distanceToStage < 200 && distanceToStage > -10;

  useFrame(() => {
    if (markerRef.current) {
      // In ThreeJS, negative Z is forward away from camera usually, 
      // but here our road moves +Z to simulate forward. 
      // So objects should be at negative Z relative to camera/player.
      markerRef.current.position.z = -distanceToStage;
    }
  });

  if (!isVisible) return null;

  return (
    <group ref={markerRef} position={[-4, 0, 0]}>
      {/* Pole */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 3]} />
        <meshStandardMaterial color="#555" />
      </mesh>
      {/* Sign */}
      <mesh position={[0, 2.5, 0]}>
        <boxGeometry args={[1.5, 1, 0.1]} />
        <meshStandardMaterial color="#FFD700" />
      </mesh>
      {/* Base */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.2]} />
        <meshStandardMaterial color="#333" />
      </mesh>
    </group>
  );
};

// Player Matatu
const Player = ({ type }: { type: VehicleType | null }) => {
  const meshRef = useRef<THREE.Group>(null);
  const [lane, setLane] = useState(0); 
  const LANE_WIDTH = 2.5;
  const LERP_SPEED = 10;
  const TILT_ANGLE = 0.1;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setLane((l) => Math.max(l - 1, -1));
      if (e.key === 'ArrowRight') setLane((l) => Math.min(l + 1, 1));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const touchStartX = useRef<number | null>(null);
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === null) return;
      const diff = e.changedTouches[0].clientX - touchStartX.current;
      if (Math.abs(diff) > 50) {
        if (diff > 0) setLane((l) => Math.min(l + 1, 1));
        else setLane((l) => Math.max(l - 1, -1));
      }
      touchStartX.current = null;
    };
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  useFrame((state, delta) => {
    if (meshRef.current) {
      const targetX = lane * LANE_WIDTH;
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX, delta * LERP_SPEED);
      const xDiff = targetX - meshRef.current.position.x;
      meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, -xDiff * TILT_ANGLE, delta * LERP_SPEED);
      meshRef.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 20) * 0.02;
    }
  });

  const length = type === '52-seater' ? 4 : type === '32-seater' ? 3 : 2;

  return (
    <group ref={meshRef} position={[0, 0.5, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.6, 1.4, length]} />
        <meshStandardMaterial color="#FFD700" roughness={0.2} metalness={0.5} />
      </mesh>
      <mesh position={[0.81, 0, 0]}>
        <boxGeometry args={[0.05, 0.5, length]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      <mesh position={[-0.81, 0, 0]}>
        <boxGeometry args={[0.05, 0.5, length]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      <mesh position={[0.7, -0.5, length/3]} rotation={[Math.PI/2, 0, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.4, 16]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[-0.7, -0.5, length/3]} rotation={[Math.PI/2, 0, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.4, 16]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0.7, -0.5, -length/3]} rotation={[Math.PI/2, 0, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.4, 16]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[-0.7, -0.5, -length/3]} rotation={[Math.PI/2, 0, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.4, 16]} />
        <meshStandardMaterial color="#111" />
      </mesh>
    </group>
  );
};

// --- Main Scene ---
interface GameSceneProps {
  vehicleType: VehicleType | null;
}

export const GameScene: React.FC<GameSceneProps> = ({ vehicleType }) => {
  return (
    <div className="w-full h-full bg-slate-900">
      <Canvas shadows camera={{ position: [0, 6, 8], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[20, 20, 10]} intensity={1.2} castShadow shadow-mapSize={[1024, 1024]} />
        
        <GameLogic />
        <Road />
        <StageMarker />
        <Player type={vehicleType} />
        
        <fog attach="fog" args={['#0f172a', 5, 40]} />
      </Canvas>
      
      <div className="absolute bottom-10 inset-x-0 flex justify-center pointer-events-none opacity-50">
        <p className="text-white/50 text-xs animate-pulse">
          <span className="hidden sm:inline">Use Arrow Keys to Steer</span>
          <span className="sm:hidden">Swipe Left/Right to Steer</span>
        </p>
      </div>
    </div>
  );
};
