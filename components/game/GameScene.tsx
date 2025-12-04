
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { VehicleType } from '../../types';
import { useGameStore } from '../../store/gameStore';
import { playSfx } from '../../utils/audio';
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

// Camera Rig: Follows player and adds shake
const CameraRig = () => {
  const { camera } = useThree();
  const currentSpeed = useGameStore(state => state.currentSpeed);
  const startPos = useMemo(() => new THREE.Vector3(0, 6, 8), []);
  
  useFrame((state) => {
    // Basic shake based on speed
    const t = state.clock.elapsedTime;
    const shakeIntensity = currentSpeed > 0 ? 0.05 : 0;
    const shakeY = Math.sin(t * 30) * shakeIntensity * 0.5;
    const shakeX = Math.cos(t * 25) * shakeIntensity * 0.3;

    // Smooth return to center
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, shakeX, 0.1);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, startPos.y + shakeY, 0.1);
    camera.position.z = startPos.z;
    
    // Look slightly ahead
    camera.lookAt(0, 0, 0);
  });

  return null;
};

// Environment Scenery
const Scenery = () => {
  const groupRef = useRef<THREE.Group>(null);
  const currentSpeed = useGameStore(state => state.currentSpeed);
  
  const OBJECT_COUNT = 15;
  const GAP = 15;
  
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.position.z += currentSpeed * delta;
      if (groupRef.current.position.z > GAP) {
        groupRef.current.position.z %= GAP;
      }
    }
  });

  // Pre-generate scenery items positions
  const sceneryItems = useMemo(() => {
    return Array.from({ length: OBJECT_COUNT }).map((_, i) => {
      const side = i % 2 === 0 ? 1 : -1;
      const x = (8 + Math.random() * 4) * side;
      const z = -i * GAP;
      const isSign = i % 5 === 0; // Every 5th item is a sign
      return { x, z, isSign, side };
    });
  }, []);

  return (
    <group ref={groupRef}>
      {sceneryItems.map((item, i) => (
        <group key={i} position={[item.x, 0, item.z]}>
          {item.isSign ? (
            // Signpost
            <group rotation={[0, item.side === -1 ? Math.PI / 4 : -Math.PI / 4, 0]}>
               <mesh position={[0, 1.5, 0]}>
                 <cylinderGeometry args={[0.05, 0.05, 3]} />
                 <meshStandardMaterial color="#333" />
               </mesh>
               <mesh position={[0, 2.5, 0]}>
                 <boxGeometry args={[1.5, 0.8, 0.1]} />
                 <meshStandardMaterial color="#166534" />
               </mesh>
               {/* "Text" placeholder - white strip */}
               <mesh position={[0, 2.5, 0.06]}>
                 <planeGeometry args={[1.2, 0.2]} />
                 <meshBasicMaterial color="white" />
               </mesh>
            </group>
          ) : (
            // Tree (Abstract)
            <group scale={[1 + Math.random(), 1 + Math.random(), 1 + Math.random()]}>
              <mesh position={[0, 0.5, 0]}>
                <cylinderGeometry args={[0.2, 0.3, 1]} />
                <meshStandardMaterial color="#451a03" />
              </mesh>
              <mesh position={[0, 2, 0]}>
                <coneGeometry args={[1.5, 3, 8]} />
                <meshStandardMaterial color="#065f46" />
              </mesh>
            </group>
          )}
        </group>
      ))}
    </group>
  );
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

// Stage Marker
const StageMarker = () => {
  const { nextStageDistance, distanceTraveled } = useGameStore();
  const markerRef = useRef<THREE.Group>(null);
  
  const distanceToStage = nextStageDistance - distanceTraveled;
  const isVisible = distanceToStage < 200 && distanceToStage > -10;

  useFrame(() => {
    if (markerRef.current) {
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

// Police Marker
const PoliceMarker = () => {
  const { nextPoliceDistance, distanceTraveled } = useGameStore();
  const markerRef = useRef<THREE.Group>(null);
  const blueLightRef = useRef<THREE.Mesh>(null);
  const redLightRef = useRef<THREE.Mesh>(null);
  
  const distanceToPolice = nextPoliceDistance - distanceTraveled;
  const isVisible = distanceToPolice < 200 && distanceToPolice > -10;

  useFrame((state) => {
    if (markerRef.current) {
      markerRef.current.position.z = -distanceToPolice;
    }
    
    // Flash lights
    if (blueLightRef.current && redLightRef.current) {
      const time = state.clock.elapsedTime * 10;
      const blueIntensity = Math.sin(time) > 0 ? 1 : 0.2;
      const redIntensity = Math.sin(time) <= 0 ? 1 : 0.2;
      
      (blueLightRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = blueIntensity;
      (redLightRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = redIntensity;
    }
  });

  if (!isVisible) return null;

  return (
    <group ref={markerRef} position={[4, 0, 0]}>
      <mesh position={[0, 0.5, 0]}>
        <coneGeometry args={[0.5, 1, 16]} />
        <meshStandardMaterial color="orange" />
      </mesh>
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[1.5, 0.2, 0.2]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh ref={blueLightRef} position={[-0.5, 1.7, 0]}>
        <sphereGeometry args={[0.2]} />
        <meshStandardMaterial color="blue" emissive="blue" emissiveIntensity={1} />
      </mesh>
      <mesh ref={redLightRef} position={[0.5, 1.7, 0]}>
        <sphereGeometry args={[0.2]} />
        <meshStandardMaterial color="red" emissive="red" emissiveIntensity={1} />
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

  const reportLaneChange = useGameStore(state => state.reportLaneChange);

  const changeLane = (dir: -1 | 1) => {
    setLane((prev) => {
      const next = prev + dir;
      if (next >= -1 && next <= 1) {
        reportLaneChange();
        playSfx('SWOOSH');
        return next;
      }
      return prev;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') changeLane(-1);
      if (e.key === 'ArrowRight') changeLane(1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reportLaneChange]);

  const touchStartX = useRef<number | null>(null);
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === null) return;
      const diff = e.changedTouches[0].clientX - touchStartX.current;
      if (Math.abs(diff) > 50) {
        if (diff > 0) changeLane(1);
        else changeLane(-1);
      }
      touchStartX.current = null;
    };
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [reportLaneChange]);

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
    // Added Sky Gradient here
    <div className="w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-black">
      <Canvas shadows camera={{ position: [0, 6, 8], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[20, 20, 10]} intensity={1.2} castShadow shadow-mapSize={[1024, 1024]} />
        
        <CameraRig />
        <GameLogic />
        <Scenery />
        <Road />
        <StageMarker />
        <PoliceMarker />
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