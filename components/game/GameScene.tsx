
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { VehicleType } from '../../types';
import { useGameStore } from '../../store/gameStore';
import { playSfx } from '../../utils/audio';
import * as THREE from 'three';

// --- Constants ---
const ROAD_WIDTH = 8;
const LANE_OFFSET = 2.2; // Distance from center to lane center
const CAMERA_POS = new THREE.Vector3(0, 8, 15); // Zoomed out position

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
  // Re-use constant for consistency
  const startPos = useMemo(() => CAMERA_POS.clone(), []);
  
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
    
    // Look slightly ahead, but lower down to see the road better
    camera.lookAt(0, 0, -5);
  });

  return null;
};

// Environment Scenery
const Scenery = () => {
  const groupRef = useRef<THREE.Group>(null);
  const currentSpeed = useGameStore(state => state.currentSpeed);
  
  const OBJECT_COUNT = 20;
  const GAP = 10;
  const OFFSET_FROM_ROAD = ROAD_WIDTH / 2 + 2; 
  
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
      const x = (OFFSET_FROM_ROAD + Math.random() * 4) * side;
      const z = -i * GAP;
      const type = i % 6 === 0 ? 'SIGN' : i % 3 === 0 ? 'BUSH' : 'TREE';
      const scale = 0.8 + Math.random() * 0.4;
      return { x, z, type, side, scale };
    });
  }, []);

  return (
    <group ref={groupRef}>
      {sceneryItems.map((item, i) => (
        <group key={i} position={[item.x, 0, item.z]} scale={[item.scale, item.scale, item.scale]}>
          {item.type === 'SIGN' ? (
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
               <mesh position={[0, 2.5, 0.06]}>
                 <planeGeometry args={[1.2, 0.2]} />
                 <meshBasicMaterial color="white" />
               </mesh>
            </group>
          ) : item.type === 'BUSH' ? (
            // Bush
            <mesh position={[0, 0.5, 0]}>
              <dodecahedronGeometry args={[0.8, 0]} />
              <meshStandardMaterial color="#2d5a27" />
            </mesh>
          ) : (
            // Tree
            <group>
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
  const GRASS_OFFSET = ROAD_WIDTH / 2 + 5; 
  
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[ROAD_WIDTH, 200]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
      </mesh>

      {/* Markings - Center Line */}
      <group ref={groupRef}>
        {Array.from({ length: STRIP_COUNT }).map((_, i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -i * STRIP_GAP]}>
            <planeGeometry args={[0.15, 2]} />
            <meshBasicMaterial color="#fbbf24" />
          </mesh>
        ))}
      </group>
      
      {/* Shoulder/Grass Left */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-GRASS_OFFSET, -0.1, 0]}>
        <planeGeometry args={[10, 200]} />
        <meshStandardMaterial color="#064e3b" />
      </mesh>
      {/* Shoulder/Grass Right */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[GRASS_OFFSET, -0.1, 0]}>
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
  const isVisible = distanceToStage < 200 && distanceToStage > -20;
  const MARKER_X = -(ROAD_WIDTH / 2 + 1); 

  useFrame(() => {
    if (markerRef.current) {
      markerRef.current.position.z = -distanceToStage;
    }
  });

  if (!isVisible) return null;

  return (
    <group ref={markerRef} position={[MARKER_X, 0, 0]}>
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
      {/* Text Placeholder */}
      <mesh position={[0, 2.5, 0.06]}>
        <planeGeometry args={[1.2, 0.8]} />
        <meshBasicMaterial color="#000" />
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
  const isVisible = distanceToPolice < 200 && distanceToPolice > -20;
  const MARKER_X = (ROAD_WIDTH / 2 + 1);

  useFrame((state) => {
    if (markerRef.current) {
      markerRef.current.position.z = -distanceToPolice;
    }
    
    // Flash lights
    if (blueLightRef.current && redLightRef.current) {
      const time = state.clock.elapsedTime * 10;
      const blueIntensity = Math.sin(time) > 0 ? 2 : 0.2;
      const redIntensity = Math.sin(time) <= 0 ? 2 : 0.2;
      
      (blueLightRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = blueIntensity;
      (redLightRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = redIntensity;
    }
  });

  if (!isVisible) return null;

  return (
    <group ref={markerRef} position={[MARKER_X, 0, 0]}>
      <mesh position={[0, 0.5, 0]}>
        <coneGeometry args={[0.5, 1, 16]} />
        <meshStandardMaterial color="#fb923c" />
      </mesh>
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[1.5, 0.2, 0.2]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh ref={blueLightRef} position={[-0.5, 1.7, 0]}>
        <sphereGeometry args={[0.2]} />
        <meshStandardMaterial color="blue" emissive="blue" />
      </mesh>
      <mesh ref={redLightRef} position={[0.5, 1.7, 0]}>
        <sphereGeometry args={[0.2]} />
        <meshStandardMaterial color="red" emissive="red" />
      </mesh>
    </group>
  );
};

// --- Vehicle Parts ---

const Wheel = ({ position, radius = 0.35 }: { position: [number, number, number], radius?: number }) => {
  const ref = useRef<THREE.Group>(null);
  const { currentSpeed } = useGameStore();
  
  useFrame((state, delta) => {
    if (ref.current) {
      // Rotate based on speed (simple approximation)
      ref.current.rotation.x -= currentSpeed * delta * (1 / radius);
    }
  });

  return (
    <group position={position}>
      <group ref={ref}>
        {/* Tire */}
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[radius, radius, 0.25, 16]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
        {/* Hubcap */}
        <mesh rotation={[0, 0, Math.PI / 2]} position={[0.01, 0, 0]}>
           <cylinderGeometry args={[radius * 0.6, radius * 0.6, 0.26, 8]} />
           <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
};

// 14-Seater: The Shark (Van style)
const Matatu14Seater = () => {
  return (
    <group position={[0, 0.35, 0]}>
       {/* Main Body */}
       <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.6, 1.2, 3.8]} />
          <meshStandardMaterial color="#ffffff" />
       </mesh>
       {/* Yellow Stripe */}
       <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[1.62, 0.15, 3.82]} />
          <meshStandardMaterial color="#FFD700" />
       </mesh>
       {/* Windows Side */}
       <mesh position={[0, 0.85, 0]}>
          <boxGeometry args={[1.65, 0.5, 2.5]} />
          <meshStandardMaterial color="#1e293b" roughness={0.1} />
       </mesh>
       {/* Windshield Area (Slanted Front) */}
       <mesh position={[0, 0.5, 1.8]} rotation={[-0.3, 0, 0]}>
          <boxGeometry args={[1.5, 0.8, 0.6]} />
          <meshStandardMaterial color="#ffffff" />
       </mesh>
       <mesh position={[0, 0.65, 1.95]} rotation={[-0.3, 0, 0]}>
          <boxGeometry args={[1.4, 0.5, 0.05]} />
          <meshStandardMaterial color="#1e293b" roughness={0.1} />
       </mesh>

       {/* Wheels */}
       <Wheel position={[0.7, 0, 1.2]} />
       <Wheel position={[-0.7, 0, 1.2]} />
       <Wheel position={[0.7, 0, -1.2]} />
       <Wheel position={[-0.7, 0, -1.2]} />

       {/* Lights */}
       <mesh position={[0.6, 0.4, 2.1]}>
         <boxGeometry args={[0.3, 0.15, 0.1]} />
         <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} />
       </mesh>
       <mesh position={[-0.6, 0.4, 2.1]}>
         <boxGeometry args={[0.3, 0.15, 0.1]} />
         <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} />
       </mesh>
       <mesh position={[0.6, 0.6, -1.91]}>
         <boxGeometry args={[0.15, 0.4, 0.1]} />
         <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1} />
       </mesh>
       <mesh position={[-0.6, 0.6, -1.91]}>
         <boxGeometry args={[0.15, 0.4, 0.1]} />
         <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1} />
       </mesh>
    </group>
  );
};

// 32-Seater: The Rumble (Mini-bus style)
const Matatu32Seater = () => {
  return (
    <group position={[0, 0.45, 0]}>
       {/* Main Body */}
       <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.9, 1.6, 5.5]} />
          <meshStandardMaterial color="#ffffff" />
       </mesh>
       {/* Yellow Stripe */}
       <mesh position={[0, 0.7, 0]}>
          <boxGeometry args={[1.92, 0.2, 5.52]} />
          <meshStandardMaterial color="#FFD700" />
       </mesh>
       {/* Windows Side */}
       <mesh position={[0, 1.1, 0.2]}>
          <boxGeometry args={[1.95, 0.6, 4]} />
          <meshStandardMaterial color="#1e293b" roughness={0.1} />
       </mesh>
       {/* Front Cab */}
       <mesh position={[0, 1.1, 2.76]} rotation={[0, 0, 0]}>
          <boxGeometry args={[1.8, 0.7, 0.1]} />
          <meshStandardMaterial color="#1e293b" roughness={0.1} />
       </mesh>

       {/* Wheels - Dual Rear Axle look */}
       <Wheel position={[0.85, 0, 1.8]} radius={0.4} />
       <Wheel position={[-0.85, 0, 1.8]} radius={0.4} />
       <Wheel position={[0.85, 0, -1.5]} radius={0.4} />
       <Wheel position={[-0.85, 0, -1.5]} radius={0.4} />

       {/* Lights */}
       <mesh position={[0.7, 0.5, 2.76]}>
         <boxGeometry args={[0.3, 0.2, 0.1]} />
         <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} />
       </mesh>
       <mesh position={[-0.7, 0.5, 2.76]}>
         <boxGeometry args={[0.3, 0.2, 0.1]} />
         <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} />
       </mesh>
       <mesh position={[0, 0.6, -2.76]}>
         <boxGeometry args={[1.8, 0.2, 0.1]} />
         <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1} />
       </mesh>
    </group>
  );
};

// 52-Seater: The Titan (Coach Bus style)
const Matatu52Seater = () => {
  return (
    <group position={[0, 0.55, 0]}>
       {/* Main Body */}
       <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.1, 2.2, 8]} />
          <meshStandardMaterial color="#ffffff" />
       </mesh>
       {/* Yellow Stripe */}
       <mesh position={[0, 0.8, 0]}>
          <boxGeometry args={[2.12, 0.25, 8.02]} />
          <meshStandardMaterial color="#FFD700" />
       </mesh>
       {/* Windows Side */}
       <mesh position={[0, 1.5, 0]}>
          <boxGeometry args={[2.15, 0.8, 6.5]} />
          <meshStandardMaterial color="#1e293b" roughness={0.1} />
       </mesh>
       {/* Large Front Window */}
       <mesh position={[0, 1.3, 4.01]}>
          <boxGeometry args={[2.0, 1.2, 0.1]} />
          <meshStandardMaterial color="#1e293b" roughness={0.1} />
       </mesh>

       {/* Wheels - 3 Axles */}
       <Wheel position={[0.9, 0, 2.5]} radius={0.45} />
       <Wheel position={[-0.9, 0, 2.5]} radius={0.45} />
       
       <Wheel position={[0.9, 0, -2]} radius={0.45} />
       <Wheel position={[-0.9, 0, -2]} radius={0.45} />
       
       <Wheel position={[0.9, 0, -3.2]} radius={0.45} />
       <Wheel position={[-0.9, 0, -3.2]} radius={0.45} />

       {/* Lights */}
       <mesh position={[0.8, 0.6, 4.01]}>
         <boxGeometry args={[0.3, 0.25, 0.1]} />
         <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} />
       </mesh>
       <mesh position={[-0.8, 0.6, 4.01]}>
         <boxGeometry args={[0.3, 0.25, 0.1]} />
         <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} />
       </mesh>
       <mesh position={[0, 1.8, -4.01]}>
         <boxGeometry args={[1.5, 0.2, 0.1]} />
         <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1} />
       </mesh>
    </group>
  );
};

// Player Logic Wrapper
const Player = ({ type }: { type: VehicleType | null }) => {
  const meshRef = useRef<THREE.Group>(null);
  // -1 is Left Lane (Kenya keep left), 1 is Right Lane (Overtaking)
  const [lane, setLane] = useState<-1 | 1>(-1); 
  const LERP_SPEED = 8;
  const TILT_ANGLE = 0.1;

  const reportLaneChange = useGameStore(state => state.reportLaneChange);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setLane(prev => {
           if (prev === 1) {
             reportLaneChange();
             playSfx('SWOOSH');
             return -1;
           }
           return prev;
        });
      }
      if (e.key === 'ArrowRight') {
        setLane(prev => {
           if (prev === -1) {
             reportLaneChange();
             playSfx('SWOOSH');
             return 1;
           }
           return prev;
        });
      }
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
      if (Math.abs(diff) > 30) {
        if (diff > 0) {
             setLane(prev => {
                if(prev === -1) {
                    reportLaneChange();
                    playSfx('SWOOSH');
                    return 1;
                }
                return prev;
             });
        }
        else {
             setLane(prev => {
                if(prev === 1) {
                    reportLaneChange();
                    playSfx('SWOOSH');
                    return -1;
                }
                return prev;
             });
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
  }, [reportLaneChange]);

  useFrame((state, delta) => {
    if (meshRef.current) {
      const targetX = lane * LANE_OFFSET;
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX, delta * LERP_SPEED);
      const xDiff = targetX - meshRef.current.position.x;
      // Tilt based on movement direction
      meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, -xDiff * TILT_ANGLE, delta * LERP_SPEED);
      // Gentle bounce
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 15) * 0.02; 
    }
  });

  return (
    <group ref={meshRef} position={[-LANE_OFFSET, 0, 0]}>
       {type === '14-seater' && <Matatu14Seater />}
       {type === '32-seater' && <Matatu32Seater />}
       {type === '52-seater' && <Matatu52Seater />}
    </group>
  );
};

// --- Main Scene ---
interface GameSceneProps {
  vehicleType: VehicleType | null;
}

export const GameScene: React.FC<GameSceneProps> = ({ vehicleType }) => {
  return (
    <div className="w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-black">
      <Canvas shadows camera={{ position: [CAMERA_POS.x, CAMERA_POS.y, CAMERA_POS.z], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[20, 30, 10]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} />
        
        <CameraRig />
        <GameLogic />
        <Scenery />
        <Road />
        <StageMarker />
        <PoliceMarker />
        <Player type={vehicleType || '14-seater'} />
        
        <fog attach="fog" args={['#0f172a', 15, 60]} />
      </Canvas>
      
      <div className="absolute bottom-10 inset-x-0 flex justify-center pointer-events-none opacity-50">
        <p className="text-white/50 text-xs animate-pulse">
          <span className="hidden sm:inline">Use Arrow Keys to Switch Lanes</span>
          <span className="sm:hidden">Swipe Left/Right to Switch Lanes</span>
        </p>
      </div>
    </div>
  );
};
