
import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { VehicleType } from '../../types';
import { useGameStore } from '../../store/gameStore';
import * as THREE from 'three';

// --- Components ---

// Scrolling Road: Simulates forward movement by moving texture/mesh backwards
const Road = () => {
  const groupRef = useRef<THREE.Group>(null);
  const currentSpeed = useGameStore((state) => state.currentSpeed);
  
  // Create strips for road markings
  const STRIP_COUNT = 20;
  const STRIP_GAP = 5;
  
  useFrame((state, delta) => {
    if (groupRef.current) {
      // Move the road markings towards the camera (positive Z)
      groupRef.current.position.z += currentSpeed * delta;
      
      // Reset position to create infinite loop effect
      if (groupRef.current.position.z > STRIP_GAP) {
        groupRef.current.position.z %= STRIP_GAP;
      }
    }
  });

  return (
    <group>
      {/* Asphalt Base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[20, 200]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} />
      </mesh>

      {/* Moving Markings */}
      <group ref={groupRef}>
        {Array.from({ length: STRIP_COUNT }).map((_, i) => (
          <mesh 
            key={i} 
            rotation={[-Math.PI / 2, 0, 0]} 
            position={[0, 0, -i * STRIP_GAP]}
          >
            <planeGeometry args={[0.2, 2]} />
            <meshBasicMaterial color="#ffffff" opacity={0.5} transparent />
          </mesh>
        ))}
      </group>
      
      {/* Grass/Terrain Sides */}
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

// Player Matatu: Handles Input and Movement
const Player = ({ type }: { type: VehicleType | null }) => {
  const meshRef = useRef<THREE.Group>(null);
  const [lane, setLane] = useState(0); // -1 (Left), 0 (Center), 1 (Right)
  const LANE_WIDTH = 2.5;
  const LERP_SPEED = 10;
  const TILT_ANGLE = 0.1;

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setLane((l) => Math.max(l - 1, -1));
      if (e.key === 'ArrowRight') setLane((l) => Math.min(l + 1, 1));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Touch/Swipe Handling
  const touchStartX = useRef<number | null>(null);
  
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === null) return;
      
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchEndX - touchStartX.current;
      const SWIPE_THRESHOLD = 50;

      if (Math.abs(diff) > SWIPE_THRESHOLD) {
        if (diff > 0) {
          setLane((l) => Math.min(l + 1, 1)); // Swipe Right
        } else {
          setLane((l) => Math.max(l - 1, -1)); // Swipe Left
        }
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
      // 1. Lerp Position X
      const targetX = lane * LANE_WIDTH;
      meshRef.current.position.x = THREE.MathUtils.lerp(
        meshRef.current.position.x, 
        targetX, 
        delta * LERP_SPEED
      );

      // 2. Dynamic Tilt (Roll) based on movement
      const xDiff = targetX - meshRef.current.position.x;
      const targetRotationZ = -xDiff * TILT_ANGLE; // Tilt into turn
      meshRef.current.rotation.z = THREE.MathUtils.lerp(
        meshRef.current.rotation.z, 
        targetRotationZ, 
        delta * LERP_SPEED
      );

      // 3. Simple Bump/Bounce effect
      meshRef.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 20) * 0.02;
    }
  });

  const length = type === '52-seater' ? 4 : type === '32-seater' ? 3 : 2;

  return (
    <group ref={meshRef} position={[0, 0.5, 0]}>
      {/* Body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.6, 1.4, length]} />
        <meshStandardMaterial color="#FFD700" roughness={0.2} metalness={0.5} />
      </mesh>
      
      {/* Stripe */}
      <mesh position={[0.81, 0, 0]}>
        <boxGeometry args={[0.05, 0.5, length]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      <mesh position={[-0.81, 0, 0]}>
        <boxGeometry args={[0.05, 0.5, length]} />
        <meshStandardMaterial color="#000000" />
      </mesh>

      {/* Wheels (Simple) */}
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
        {/* Lights */}
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[20, 20, 10]} 
          intensity={1.2} 
          castShadow 
          shadow-mapSize={[1024, 1024]}
        />
        
        <Road />
        <Player type={vehicleType} />
        
        <fog attach="fog" args={['#0f172a', 5, 40]} />
      </Canvas>
      
      {/* Mobile Control Hint */}
      <div className="absolute bottom-10 inset-x-0 flex justify-center pointer-events-none opacity-50">
        <p className="text-white/50 text-xs animate-pulse">
          <span className="hidden sm:inline">Use Arrow Keys to Steer</span>
          <span className="sm:hidden">Swipe Left/Right to Steer</span>
        </p>
      </div>
    </div>
  );
};
