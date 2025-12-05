

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { VehicleType } from '../../types';
import { useGameStore } from '../../store/gameStore';
import { playSfx, EngineSynthesizer } from '../../utils/audio';
import * as THREE from 'three';

// Fix for TypeScript not recognizing React Three Fiber intrinsic elements and standard HTML elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

interface GameSceneProps {
  vehicleType: VehicleType | null;
}

// --- Constants ---
const ROAD_WIDTH = 8;
const LANE_OFFSET = 2.2; 
const CAMERA_POS = new THREE.Vector3(0, 8, 15);

// --- Components ---

const Helmet = ({ color = "#fb923c" }: { color?: string }) => {
  return (
    <group>
      {/* Helmet Shell */}
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.5} />
      </mesh>
      {/* Visor */}
      <mesh position={[0, 0.1, 0.15]} rotation={[0.5, 0, 0]}>
         <boxGeometry args={[0.3, 0.15, 0.1]} />
         <meshStandardMaterial color="#111" transparent opacity={0.8} />
      </mesh>
    </group>
  );
};

const Rider = ({ isPassenger = false }: { isPassenger?: boolean }) => {
  const shirtColor = isPassenger ? "#3b82f6" : "#fb923c"; // Orange for rider (reflector), Blue for passenger
  
  return (
    <group>
       {/* Body */}
       <mesh position={[0, 0.6, 0]}>
         <boxGeometry args={[0.4, 0.5, 0.2]} />
         <meshStandardMaterial color={shirtColor} emissive={isPassenger ? undefined : "#fb923c"} emissiveIntensity={isPassenger ? 0 : 0.5} />
       </mesh>
       {/* Head */}
       <mesh position={[0, 1.0, 0]}>
         <sphereGeometry args={[0.15]} />
         <meshStandardMaterial color="#8d5524" />
       </mesh>
       {/* Helmet */}
       <group position={[0, 1.0, 0]}>
          <Helmet color={isPassenger ? "#fff" : "#fb923c"} />
       </group>
       {/* Legs */}
       <mesh position={[-0.15, 0.3, 0]} rotation={[-0.2, 0, -0.1]}>
         <cylinderGeometry args={[0.07, 0.07, 0.5]} />
         <meshStandardMaterial color="#1f2937" />
       </mesh>
       <mesh position={[0.15, 0.3, 0]} rotation={[-0.2, 0, 0.1]}>
         <cylinderGeometry args={[0.07, 0.07, 0.5]} />
         <meshStandardMaterial color="#1f2937" />
       </mesh>
       {/* Arms (reaching for handles) */}
       {!isPassenger && (
         <>
           <mesh position={[-0.2, 0.7, 0.2]} rotation={[1.5, 0, -0.2]}>
              <cylinderGeometry args={[0.05, 0.05, 0.4]} />
              <meshStandardMaterial color={shirtColor} />
           </mesh>
           <mesh position={[0.2, 0.7, 0.2]} rotation={[1.5, 0, 0.2]}>
              <cylinderGeometry args={[0.05, 0.05, 0.4]} />
              <meshStandardMaterial color={shirtColor} />
           </mesh>
         </>
       )}
    </group>
  );
};

const PlayerBoda = ({ passengerCount }: { passengerCount: number }) => {
  return (
    <group position={[0, 0.35, 0]}>
       {/* Wheels */}
       <Wheel position={[0, 0, 0.7]} radius={0.35} />
       <Wheel position={[0, 0, -0.7]} radius={0.35} />
       
       {/* Frame */}
       <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[0.15, 0.3, 1.4]} />
          <meshStandardMaterial color="#ef4444" metalness={0.6} roughness={0.2} />
       </mesh>
       
       {/* Engine Block */}
       <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[0.25, 0.25, 0.3]} />
          <meshStandardMaterial color="#333" />
       </mesh>
       
       {/* Handlebars */}
       <mesh position={[0, 0.85, 0.5]} rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[0.02, 0.02, 0.8]} />
          <meshStandardMaterial color="#111" />
       </mesh>
       
       {/* Seat */}
       <mesh position={[0, 0.6, -0.1]}>
          <boxGeometry args={[0.3, 0.1, 0.8]} />
          <meshStandardMaterial color="#1e293b" />
       </mesh>
       
       {/* Headlight */}
       <mesh position={[0, 0.7, 0.75]}>
          <boxGeometry args={[0.2, 0.2, 0.1]} />
          <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" />
       </mesh>

       {/* Rider */}
       <group position={[0, 0.1, 0.3]}>
          <Rider />
       </group>

       {/* Passenger (Render if any) */}
       {passengerCount > 0 && (
         <group position={[0, 0.2, -0.3]}>
            <Rider isPassenger={true} />
         </group>
       )}
    </group>
  );
};

const PlayerTuktuk = () => {
  return (
    <group position={[0, 0.3, 0]}>
       {/* Wheels */}
       <Wheel position={[0, 0, 1.2]} radius={0.3} />
       <Wheel position={[-0.5, 0, -0.5]} radius={0.3} />
       <Wheel position={[0.5, 0, -0.5]} radius={0.3} />

       {/* Body */}
       <mesh position={[0, 0.6, 0.2]}>
          <boxGeometry args={[1.2, 1.2, 2.0]} />
          <meshStandardMaterial color="#facc15" />
       </mesh>
       
       {/* Roof */}
       <mesh position={[0, 1.25, 0.2]}>
          <boxGeometry args={[1.3, 0.1, 2.1]} />
          <meshStandardMaterial color="#111" />
       </mesh>

       {/* Front Window Frame */}
       <mesh position={[0, 0.9, 1.1]}>
          <boxGeometry args={[1.1, 0.6, 0.1]} />
          <meshStandardMaterial color="#facc15" />
       </mesh>
       
       {/* Windshield */}
       <mesh position={[0, 0.9, 1.11]}>
          <planeGeometry args={[1.0, 0.5]} />
          <meshStandardMaterial color="#3b82f6" transparent opacity={0.4} />
       </mesh>
       
       <mesh position={[0, 0.4, 1.2]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.3, 0.1, 0.1]} />
          <meshStandardMaterial color="white" emissive="white" />
       </mesh>
    </group>
  );
};

const PlayerPersonalCar = () => {
  return (
     <group position={[0, 0.3, 0]}>
       {/* Main Body */}
       <mesh position={[0, 0.35, 0]}>
          <boxGeometry args={[1.6, 0.6, 3.4]} />
          <meshStandardMaterial color="#3b82f6" metalness={0.6} roughness={0.2} />
       </mesh>
       {/* Cabin */}
       <mesh position={[0, 0.8, -0.2]}>
          <boxGeometry args={[1.4, 0.5, 2.0]} />
          <meshStandardMaterial color="#1e3a8a" metalness={0.7} roughness={0.2} />
       </mesh>
       {/* Wheels */}
       <Wheel position={[0.7, 0, 1.0]} radius={0.32} />
       <Wheel position={[-0.7, 0, 1.0]} radius={0.32} />
       <Wheel position={[0.7, 0, -1.0]} radius={0.32} />
       <Wheel position={[-0.7, 0, -1.0]} radius={0.32} />
       
       {/* Lights */}
       <mesh position={[0.5, 0.4, 1.7]}>
         <boxGeometry args={[0.3, 0.15, 0.1]} />
         <meshStandardMaterial color="white" emissive="white" emissiveIntensity={2} />
       </mesh>
       <mesh position={[-0.5, 0.4, 1.7]}>
         <boxGeometry args={[0.3, 0.15, 0.1]} />
         <meshStandardMaterial color="white" emissive="white" emissiveIntensity={2} />
       </mesh>
       <mesh position={[0.5, 0.4, -1.7]}>
         <boxGeometry args={[0.3, 0.15, 0.1]} />
         <meshStandardMaterial color="red" emissive="red" emissiveIntensity={1} />
       </mesh>
       <mesh position={[-0.5, 0.4, -1.7]}>
         <boxGeometry args={[0.3, 0.15, 0.1]} />
         <meshStandardMaterial color="red" emissive="red" emissiveIntensity={1} />
       </mesh>
    </group>
  );
};

// Physics Engine Component
const PhysicsController = () => {
  const { 
    gameStatus, 
    setCurrentSpeed, 
    updateDistance, 
    activeModal,
    setControl,
    isEngineSoundOn
  } = useGameStore();

  const engineRef = useRef<EngineSynthesizer | null>(null);

  const MAX_SPEED = 120; // Approx 180 km/h in game units
  const ACCEL_RATE = 40;
  const BRAKE_RATE = 80;
  const FRICTION_RATE = 15;
  const CREEP_SPEED = 5;

  // Listen for keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStatus !== 'PLAYING') return;
      if (e.key === 'ArrowUp') setControl('GAS', true);
      if (e.key === 'ArrowDown') setControl('BRAKE', true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') setControl('GAS', false);
      if (e.key === 'ArrowDown') setControl('BRAKE', false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameStatus, setControl]);

  // Audio Engine Lifecycle
  useEffect(() => {
    if (gameStatus === 'PLAYING') {
      if (isEngineSoundOn) {
        if (!engineRef.current) {
            const vehicleType = useGameStore.getState().vehicleType || '14-seater';
            engineRef.current = new EngineSynthesizer();
            engineRef.current.setVehicleType(vehicleType);
            engineRef.current.start();
        }
      } else {
        if (engineRef.current) {
            engineRef.current.stop();
            engineRef.current = null;
        }
      }
    } else {
      engineRef.current?.stop();
      engineRef.current = null;
    }

    return () => {
      engineRef.current?.stop();
      engineRef.current = null;
    };
  }, [gameStatus, isEngineSoundOn]);

  useFrame((state, delta) => {
    if (gameStatus !== 'PLAYING' || activeModal !== 'NONE') {
        // If engine is running but we paused/modal, drop pitch or pause?
        // For now let's just keep idle sound if in modal
        if (engineRef.current) engineRef.current.setSpeed(0);
        return;
    }

    // Optimization: Read transient state directly
    const { 
      currentSpeed, 
      isAccelerating, 
      isBraking, 
      nextStageDistance, 
      nextPoliceDistance, 
      distanceTraveled 
    } = useGameStore.getState();

    let newSpeed = currentSpeed;

    // --- Auto Deceleration Logic ---
    const distToStage = nextStageDistance - distanceTraveled;
    const distToPolice = nextPoliceDistance - distanceTraveled;
    
    let closestStopDist = Infinity;
    if (distToStage > 0 && distToStage < 300) closestStopDist = Math.min(closestStopDist, distToStage);
    if (distToPolice > 0 && distToPolice < 300) closestStopDist = Math.min(closestStopDist, distToPolice);

    let speedLimit = MAX_SPEED;
    if (closestStopDist < 250) {
        const factor = Math.max(0, closestStopDist / 250);
        const minCrawl = closestStopDist < 5 ? 2 : 15; 
        speedLimit = minCrawl + (factor * (MAX_SPEED - minCrawl));
    }

    // --- Physics Update ---

    if (isAccelerating) {
      newSpeed += ACCEL_RATE * delta;
    } else if (isBraking) {
      newSpeed -= BRAKE_RATE * delta;
    } else {
      // Friction / Coasting
      if (newSpeed > CREEP_SPEED) {
        newSpeed -= FRICTION_RATE * delta;
      } else if (newSpeed < CREEP_SPEED) {
        newSpeed += FRICTION_RATE * delta;
        if (newSpeed > CREEP_SPEED) newSpeed = CREEP_SPEED;
      }
    }

    if (newSpeed > speedLimit) {
        const brakeForce = BRAKE_RATE * 1.5 * delta;
        newSpeed = Math.max(speedLimit, newSpeed - brakeForce);
    }

    // Clamp speed
    if (newSpeed < 0) newSpeed = 0;
    if (newSpeed > MAX_SPEED) newSpeed = MAX_SPEED;

    setCurrentSpeed(newSpeed);
    
    // Update Audio
    if (engineRef.current) {
        engineRef.current.setSpeed(newSpeed);
    }

    // Update distance
    if (newSpeed > 0) {
      updateDistance(newSpeed * delta);
    }
  });

  return null;
};

// Camera Rig: Follows player and adds shake
const CameraRig = () => {
  const { camera } = useThree();
  const startPos = useMemo(() => CAMERA_POS.clone(), []);
  
  useFrame((state) => {
    // Optimization: Read transient state directly
    const { currentSpeed, isCrashing } = useGameStore.getState();

    // Basic shake based on speed
    const t = state.clock.elapsedTime;
    let shakeIntensity = currentSpeed > 0 ? 0.05 * (currentSpeed / 100) : 0;
    
    if (isCrashing) {
      shakeIntensity = 0.5;
    }

    const shakeY = Math.sin(t * 30) * shakeIntensity * 0.5;
    const shakeX = Math.cos(t * 25) * shakeIntensity * 0.3;

    // Smooth return to center
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, shakeX, 0.1);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, startPos.y + shakeY, 0.1);
    
    if (isCrashing) {
       camera.position.z = THREE.MathUtils.lerp(camera.position.z, startPos.z - 5, 0.05);
    } else {
       camera.position.z = THREE.MathUtils.lerp(camera.position.z, startPos.z + (currentSpeed * 0.02), 0.05);
    }
    
    camera.lookAt(0, 0, -5);
  });

  return null;
};

const KICC = ({ position }: { position: [number, number, number] }) => {
  return (
    <group position={position}>
      <mesh position={[0, 1, 0]}>
         <boxGeometry args={[6, 2, 6]} />
         <meshStandardMaterial color="#52525b" />
      </mesh>
      <mesh position={[0, 11, 0]}>
        <cylinderGeometry args={[2, 2, 20, 32]} />
        <meshStandardMaterial color="#d4d4d8" roughness={0.3} metalness={0.5} />
      </mesh>
      <mesh position={[0, 21, 0]}>
        <cylinderGeometry args={[4, 2, 1, 32]} />
        <meshStandardMaterial color="#a1a1aa" roughness={0.3} metalness={0.5} />
      </mesh>
      <mesh position={[0, 21.6, 0]}>
        <cylinderGeometry args={[3, 4, 0.2, 32]} />
        <meshStandardMaterial color="#71717a" />
      </mesh>
    </group>
  );
};

const TimesTower = ({ position }: { position: [number, number, number] }) => {
  return (
    <group position={position}>
       <mesh position={[0, 12, 0]}>
         <boxGeometry args={[3, 24, 3]} />
         <meshStandardMaterial color="#3b82f6" metalness={0.6} roughness={0.1} transparent opacity={0.9} />
       </mesh>
       <mesh position={[0, 12, 1.51]}>
         <planeGeometry args={[2.5, 23]} />
         <meshStandardMaterial color="#1e3a8a" />
       </mesh>
    </group>
  );
};

const Basilica = ({ position }: { position: [number, number, number] }) => {
  return (
    <group position={position}>
      <mesh position={[0, 4, 0]}>
        <boxGeometry args={[6, 8, 10]} />
        <meshStandardMaterial color="#fef3c7" roughness={0.9} />
      </mesh>
      <mesh position={[0, 8.5, 0]} rotation={[0, 0, Math.PI/4]}>
         <boxGeometry args={[6, 6, 10]} />
         <meshStandardMaterial color="#78350f" />
      </mesh>
      <mesh position={[2, 8, 4]}>
        <boxGeometry args={[1.5, 16, 1.5]} />
        <meshStandardMaterial color="#fef3c7" />
      </mesh>
      <group position={[2, 16.5, 4]}>
         <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[0.2, 1.5, 0.2]} />
            <meshStandardMaterial color="#fbbf24" />
         </mesh>
         <mesh position={[0, 0.8, 0]}>
            <boxGeometry args={[0.8, 0.2, 0.2]} />
            <meshStandardMaterial color="#fbbf24" />
         </mesh>
      </group>
    </group>
  );
};

const ModernBuilding = ({ height, color, position }: { height: number, color: string, position: [number, number, number] }) => {
  const yPos = height / 2;
  return (
    <group position={[position[0], yPos, position[2]]}>
      <mesh>
        <boxGeometry args={[4, height, 4]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0, 2.01]}>
         <planeGeometry args={[3.5, height - 1]} />
         <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0, 0, -2.01]} rotation={[0, Math.PI, 0]}>
         <planeGeometry args={[3.5, height - 1]} />
         <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0, height/2 + 0.25, 0]}>
         <boxGeometry args={[3, 0.5, 3]} />
         <meshStandardMaterial color="#333" />
      </mesh>
    </group>
  );
};

const NairobiCity = () => {
  const { totalRouteDistance, distanceTraveled } = useGameStore();
  const groupRef = useRef<THREE.Group>(null);
  const distRemaining = totalRouteDistance - distanceTraveled;
  const isVisible = distRemaining < 1500;
  
  useFrame(() => {
    if (groupRef.current) {
       groupRef.current.position.z = -(totalRouteDistance - useGameStore.getState().distanceTraveled);
    }
  });

  if (!isVisible) return null;

  return (
    <group ref={groupRef}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[100, 300]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-10, 0.03, 0]}>
        <planeGeometry args={[10, 300]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
       <mesh rotation={[-Math.PI / 2, 0, 0]} position={[10, 0.03, 0]}>
        <planeGeometry args={[10, 300]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      <group position={[0, 6, -50]}>
        <mesh>
          <boxGeometry args={[14, 1.5, 0.5]} />
          <meshStandardMaterial color="#10b981" />
        </mesh>
        <mesh position={[0, 0, 0.26]}>
           <planeGeometry args={[12, 1]} />
           <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[-6.5, -3, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 6]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        <mesh position={[6.5, -3, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 6]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      </group>
      <KICC position={[20, 0, 20]} />
      <TimesTower position={[30, 0, -20]} />
      <Basilica position={[-25, 0, 10]} />
      <ModernBuilding height={25} color="#475569" position={[-18, 0, -40]} />
      <ModernBuilding height={15} color="#64748b" position={[-18, 0, -70]} />
      <ModernBuilding height={35} color="#1e293b" position={[-25, 0, -100]} />
      <ModernBuilding height={18} color="#334155" position={[-18, 0, 50]} />
      <ModernBuilding height={28} color="#475569" position={[18, 0, -60]} />
      <ModernBuilding height={18} color="#64748b" position={[18, 0, -90]} />
      <ModernBuilding height={30} color="#0f172a" position={[25, 0, -120]} />
      <ModernBuilding height={22} color="#334155" position={[18, 0, 60]} />
      {Array.from({ length: 15 }).map((_, i) => (
        <group key={i} position={i % 2 === 0 ? [5, 0, -i * 20 + 40] : [-5, 0, -i * 20 + 40]}>
           <mesh position={[0, 3, 0]}>
             <cylinderGeometry args={[0.08, 0.1, 6]} />
             <meshStandardMaterial color="#1e293b" />
           </mesh>
           <mesh position={[i % 2 === 0 ? -1 : 1, 6, 0]}>
             <boxGeometry args={[2, 0.1, 0.2]} />
             <meshStandardMaterial color="#1e293b" />
           </mesh>
           <mesh position={[i % 2 === 0 ? -1.8 : 1.8, 5.9, 0]}>
              <boxGeometry args={[0.4, 0.1, 0.2]} />
              <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={2} />
           </mesh>
           <pointLight position={[i % 2 === 0 ? -1.8 : 1.8, 5, 0]} intensity={0.5} color="#fbbf24" distance={15} decay={2} />
        </group>
      ))}
    </group>
  );
};

const Scenery = () => {
  const groupRef = useRef<THREE.Group>(null);
  const { timeOfDay, totalRouteDistance, distanceTraveled } = useGameStore();
  
  const OBJECT_COUNT = 24;
  const GAP = 15;
  const OFFSET_FROM_ROAD = ROAD_WIDTH / 2 + 3; 
  const distRemaining = totalRouteDistance - distanceTraveled;
  const isCityApproaching = distRemaining < 800;

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

  useFrame((state, delta) => {
    const speed = useGameStore.getState().currentSpeed;
    if (groupRef.current && speed > 0 && !isCityApproaching) {
      groupRef.current.position.z += speed * delta;
      if (groupRef.current.position.z > GAP) {
        groupRef.current.position.z %= GAP;
      }
    }
  });

  if (isCityApproaching) return null;

  return (
    <group ref={groupRef}>
      {sceneryItems.map((item, i) => (
        <group key={i} position={[item.x, 0, item.z]} scale={[item.scale, item.scale, item.scale]}>
          {item.type === 'SIGN' ? (
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
            <mesh position={[0, 0.5, 0]}>
              <dodecahedronGeometry args={[0.8, 0]} />
              <meshStandardMaterial color={timeOfDay === 'NIGHT' ? "#143311" : "#2d5a27"} />
            </mesh>
          ) : (
            <group>
              <mesh position={[0, 0.5, 0]}>
                <cylinderGeometry args={[0.2, 0.3, 1]} />
                <meshStandardMaterial color="#451a03" />
              </mesh>
              <mesh position={[0, 2, 0]}>
                <coneGeometry args={[1.5, 3, 8]} />
                <meshStandardMaterial color={timeOfDay === 'NIGHT' ? "#032b20" : "#065f46"} />
              </mesh>
            </group>
          )}
        </group>
      ))}
    </group>
  );
};

const Road = () => {
  const groupRef = useRef<THREE.Group>(null);
  const STRIP_COUNT = 20;
  const STRIP_GAP = 10; 
  const GRASS_OFFSET = ROAD_WIDTH / 2 + 5; 
  const timeOfDay = useGameStore(state => state.timeOfDay);
  
  useFrame((state, delta) => {
    const speed = useGameStore.getState().currentSpeed;
    if (groupRef.current && speed > 0) {
      groupRef.current.position.z += speed * delta;
      if (groupRef.current.position.z > STRIP_GAP) {
        groupRef.current.position.z %= STRIP_GAP;
      }
    }
  });

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[ROAD_WIDTH, 300]} />
        <meshStandardMaterial color={timeOfDay === 'NIGHT' ? "#0a0a0a" : "#1a1a1a"} roughness={0.8} />
      </mesh>
      <group ref={groupRef}>
        {Array.from({ length: STRIP_COUNT }).map((_, i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -i * STRIP_GAP]}>
            <planeGeometry args={[0.15, 4]} />
            <meshBasicMaterial color="#fbbf24" />
          </mesh>
        ))}
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-GRASS_OFFSET, -0.1, 0]}>
        <planeGeometry args={[10, 300]} />
        <meshStandardMaterial color={timeOfDay === 'NIGHT' ? "#022c22" : "#064e3b"} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[GRASS_OFFSET, -0.1, 0]}>
        <planeGeometry args={[10, 300]} />
        <meshStandardMaterial color={timeOfDay === 'NIGHT' ? "#022c22" : "#064e3b"} />
      </mesh>
    </group>
  );
};

const LowPolyHuman: React.FC<{ position: [number, number, number]; rotation: [number, number, number]; }> = ({ position, rotation }) => {
  const shirtColor = useMemo(() => ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][Math.floor(Math.random() * 5)], []);
  const pantsColor = useMemo(() => ['#1f2937', '#374151', '#4b5563', '#1e1e1e'][Math.floor(Math.random() * 4)], []);
  const skinColor = '#8d5524';

  return (
    <group position={position} rotation={rotation} scale={[0.7, 0.7, 0.7]}>
      <mesh position={[0, 1.6, 0]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      <mesh position={[0, 1.0, 0]}>
        <boxGeometry args={[0.4, 0.8, 0.25]} />
        <meshStandardMaterial color={shirtColor} />
      </mesh>
      <mesh position={[-0.12, 0.3, 0]}>
        <cylinderGeometry args={[0.08, 0.07, 0.6]} />
        <meshStandardMaterial color={pantsColor} />
      </mesh>
      <mesh position={[0.12, 0.3, 0]}>
         <cylinderGeometry args={[0.08, 0.07, 0.6]} />
        <meshStandardMaterial color={pantsColor} />
      </mesh>
    </group>
  );
};

const BusStopShelter = () => {
  return (
    <group>
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[4, 0.2, 2.5]} />
        <meshStandardMaterial color="#64748b" roughness={0.8} />
      </mesh>
      <mesh position={[-1.8, 1.5, -1]}>
        <cylinderGeometry args={[0.05, 0.05, 3]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.5} />
      </mesh>
      <mesh position={[1.8, 1.5, -1]}>
        <cylinderGeometry args={[0.05, 0.05, 3]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.5} />
      </mesh>
      <mesh position={[-1.8, 1.5, 1]}>
        <cylinderGeometry args={[0.05, 0.05, 3]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.5} />
      </mesh>
      <mesh position={[1.8, 1.5, 1]}>
        <cylinderGeometry args={[0.05, 0.05, 3]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.5} />
      </mesh>
      <mesh position={[0, 2.8, 0]} rotation={[0.1, 0, 0]}>
        <boxGeometry args={[4.2, 0.1, 2.8]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.5, -0.5]}>
        <boxGeometry args={[3, 0.1, 0.6]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>
      <mesh position={[-1.2, 0.3, -0.5]}>
         <cylinderGeometry args={[0.04, 0.04, 0.5]} />
         <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[1.2, 0.3, -0.5]}>
         <cylinderGeometry args={[0.04, 0.04, 0.5]} />
         <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[2.2, 2, 0]}>
        <boxGeometry args={[0.1, 0.8, 0.8]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>
      <mesh position={[2.21, 2, 0]} rotation={[0, Math.PI/2, 0]}>
         <planeGeometry args={[0.6, 0.6]} />
         <meshBasicMaterial color="#000" />
      </mesh>
    </group>
  );
};

const StageModel = ({ distance, passengerCount, isDeparting }: { distance: number, passengerCount: number, isDeparting: boolean }) => {
  const markerRef = useRef<THREE.Group>(null);
  const MARKER_X = -(ROAD_WIDTH / 2 + 2.5);
  
  const crowd = useMemo(() => {
    if (isDeparting || passengerCount <= 0) return [];
    return Array.from({ length: passengerCount }).map((_, i) => ({
      x: (Math.random() - 0.5) * 3,
      z: (Math.random() - 0.5) * 1.5,
      rotY: (Math.random() - 0.5) * Math.PI
    }));
  }, [passengerCount, isDeparting]);

  useFrame(() => {
    const distToStage = distance - useGameStore.getState().distanceTraveled;
    if (markerRef.current) {
      markerRef.current.position.z = -distToStage;
      let isVisible = false;
      if (!isDeparting) {
         isVisible = distToStage < 300 && distToStage > -20;
      } else {
         isVisible = distToStage > -200 && distToStage <= 20; 
      }
      markerRef.current.visible = isVisible;
    }
  });

  return (
    <group ref={markerRef} position={[MARKER_X, 0, 0]}>
      <BusStopShelter />
      {crowd.map((p, i) => (
        <LowPolyHuman key={i} position={[p.x, 0, p.z]} rotation={[0, p.rotY, 0]} />
      ))}
    </group>
  );
};

const StageMarker = () => {
  const { nextStageDistance, lastStageDistance, nextStagePassengerCount } = useGameStore();
  return (
    <>
      <StageModel distance={nextStageDistance} passengerCount={nextStagePassengerCount} isDeparting={false} />
      <StageModel distance={lastStageDistance} passengerCount={0} isDeparting={true} />
    </>
  );
};

const PoliceMarker = () => {
  const { nextPoliceDistance, distanceTraveled } = useGameStore();
  const markerRef = useRef<THREE.Group>(null);
  const blueLightRef = useRef<THREE.Mesh>(null);
  const redLightRef = useRef<THREE.Mesh>(null);
  const distanceToPolice = nextPoliceDistance - distanceTraveled;
  const isVisible = distanceToPolice < 300 && distanceToPolice > -20;
  const MARKER_X = (ROAD_WIDTH / 2 + 1);

  useFrame((state) => {
    if (markerRef.current) {
      markerRef.current.position.z = -distanceToPolice;
    }
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

const Wheel = ({ position, radius = 0.35 }: { position: [number, number, number], radius?: number }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (ref.current) {
      const speed = useGameStore.getState().currentSpeed;
      ref.current.rotation.x -= speed * delta * (1 / radius);
    }
  });
  return (
    <group position={position}>
      <group ref={ref}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[radius, radius, 0.25, 16]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[0.01, 0, 0]}>
           <cylinderGeometry args={[radius * 0.6, radius * 0.6, 0.26, 8]} />
           <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
};

const SideMirror = ({ side }: { side: 'left' | 'right' }) => {
  const xOffset = side === 'left' ? -0.1 : 0.1;
  return (
    <group position={[xOffset, 0, 0]}>
      <mesh position={[0, 0, 0]}>
         <boxGeometry args={[0.3, 0.2, 0.1]} />
         <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0, 0, -0.051]}>
         <planeGeometry args={[0.25, 0.15]} />
         <meshStandardMaterial color="#ccc" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
};

const Bumper = ({ position, width }: { position: [number, number, number], width: number }) => {
  return (
    <mesh position={position}>
      <boxGeometry args={[width, 0.2, 0.2]} />
      <meshStandardMaterial color="#1f2937" roughness={0.5} />
    </mesh>
  );
};

const LicensePlate = ({ position, isRear = false }: { position: [number, number, number], isRear?: boolean }) => {
  return (
    <group position={position} rotation={[0, isRear ? Math.PI : 0, 0]}>
      <mesh>
        <boxGeometry args={[0.5, 0.15, 0.05]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>
    </group>
  );
};

const GraffitiStrip = ({ position, width, length, color }: { position: [number, number, number], width: number, length: number, color: string }) => {
  return (
    <mesh position={position} rotation={[0, Math.PI / 2, 0]}>
      <planeGeometry args={[length, width]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
    </mesh>
  );
};

const Motorbike = () => {
  return (
    <group position={[0, 0.35, 0]}>
       <Wheel position={[0, 0, 0.6]} radius={0.35} />
       <Wheel position={[0, 0, -0.6]} radius={0.35} />
       <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[0.15, 0.3, 1.2]} />
          <meshStandardMaterial color="#ef4444" />
       </mesh>
       <mesh position={[0, 0.7, 0.4]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.8]} />
          <meshStandardMaterial color="#333" />
       </mesh>
       <mesh position={[0, 0.7, 0.4]} rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[0.02, 0.02, 0.8]} />
          <meshStandardMaterial color="#333" />
       </mesh>
       <mesh position={[0, 0.8, 0]}>
          <boxGeometry args={[0.4, 0.5, 0.2]} />
          <meshStandardMaterial color="#1e293b" />
       </mesh>
       <mesh position={[0, 1.15, 0]}>
          <sphereGeometry args={[0.18]} />
          <meshStandardMaterial color="#fbbf24" />
       </mesh>
    </group>
  );
}

const SmallCar = () => {
  return (
    <group position={[0, 0.3, 0]}>
       <mesh position={[0, 0.35, 0]}>
          <boxGeometry args={[1.4, 0.6, 3.2]} />
          <meshStandardMaterial color="#3b82f6" />
       </mesh>
       <mesh position={[0, 0.8, -0.2]}>
          <boxGeometry args={[1.3, 0.5, 2.0]} />
          <meshStandardMaterial color="#3b82f6" />
       </mesh>
       <mesh position={[0, 0.82, -0.2]}>
          <boxGeometry args={[1.32, 0.4, 1.8]} />
          <meshStandardMaterial color="#1e293b" roughness={0.1} />
       </mesh>
       <Wheel position={[0.6, 0, 1.0]} radius={0.3} />
       <Wheel position={[-0.6, 0, 1.0]} radius={0.3} />
       <Wheel position={[0.6, 0, -1.0]} radius={0.3} />
       <Wheel position={[-0.6, 0, -1.0]} radius={0.3} />
       <mesh position={[0, 0.4, 1.6]}>
         <boxGeometry args={[1.2, 0.1, 0.05]} />
         <meshStandardMaterial color="white" emissive="white" />
       </mesh>
       <mesh position={[0, 0.4, -1.6]}>
         <boxGeometry args={[1.2, 0.1, 0.05]} />
         <meshStandardMaterial color="red" emissive="red" />
       </mesh>
    </group>
  );
}

const Matatu14Seater = () => {
  return (
    <group position={[0, 0.35, 0]}>
       <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.7, 0.6, 4]} />
          <meshStandardMaterial color="#ffffff" />
       </mesh>
       <mesh position={[0, 1.0, 0.2]} castShadow receiveShadow>
          <boxGeometry args={[1.6, 0.7, 3.2]} />
          <meshStandardMaterial color="#ffffff" />
       </mesh>
       <GraffitiStrip position={[0.86, 0.5, 0]} width={0.4} length={3.5} color="#00F3FF" />
       <GraffitiStrip position={[-0.86, 0.5, 0]} width={0.4} length={3.5} color="#00F3FF" />
       <Bumper position={[0, 0.2, 2.0]} width={1.75} />
       <Bumper position={[0, 0.2, -2.0]} width={1.75} />
       <LicensePlate position={[0, 0.2, 2.11]} />
       <LicensePlate position={[0, 0.2, -2.11]} isRear />
       <group position={[0.9, 0.8, 1.5]}>
          <SideMirror side="right" />
       </group>
       <group position={[-0.9, 0.8, 1.5]}>
          <SideMirror side="left" />
       </group>
       <mesh position={[0, 0.75, 0]}>
          <boxGeometry args={[1.62, 0.1, 4.02]} />
          <meshStandardMaterial color="#FFD700" />
       </mesh>
       <mesh position={[0, 1.05, 0.2]}>
          <boxGeometry args={[1.65, 0.5, 3]} />
          <meshStandardMaterial color="#1e293b" roughness={0.1} />
       </mesh>
       <mesh position={[0, 0.9, 1.85]} rotation={[-0.4, 0, 0]}>
          <boxGeometry args={[1.5, 0.7, 0.1]} />
          <meshStandardMaterial color="#1e293b" roughness={0.1} />
       </mesh>
       <group position={[0, 1.4, 0.5]}>
          <mesh position={[0.7, 0, 0]}>
            <boxGeometry args={[0.05, 0.1, 2.5]} />
            <meshStandardMaterial color="#333" />
          </mesh>
          <mesh position={[-0.7, 0, 0]}>
            <boxGeometry args={[0.05, 0.1, 2.5]} />
            <meshStandardMaterial color="#333" />
          </mesh>
          {[0, 0.5, 1, 1.5, 2, 2.5].map((z, i) => (
             <mesh key={i} position={[0, 0, z - 1.25]} rotation={[0, 0, Math.PI/2]}>
               <cylinderGeometry args={[0.02, 0.02, 1.45]} />
               <meshStandardMaterial color="#333" />
             </mesh>
          ))}
          <mesh position={[0.2, 0.15, 0.5]} rotation={[0, 0.5, 0]}>
             <boxGeometry args={[0.6, 0.4, 0.8]} />
             <meshStandardMaterial color="#854d0e" />
          </mesh>
       </group>
       <Wheel position={[0.75, 0, 1.2]} />
       <Wheel position={[-0.75, 0, 1.2]} />
       <Wheel position={[0.75, 0, -1.2]} />
       <Wheel position={[-0.75, 0, -1.2]} />
       <mesh position={[0.6, 0.5, 2.0]}>
         <boxGeometry args={[0.3, 0.15, 0.1]} />
         <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} />
       </mesh>
       <mesh position={[-0.6, 0.5, 2.0]}>
         <boxGeometry args={[0.3, 0.15, 0.1]} />
         <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} />
       </mesh>
       <mesh position={[0.6, 0.5, -2.0]}>
         <boxGeometry args={[0.2, 0.3, 0.1]} />
         <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1} />
       </mesh>
       <mesh position={[-0.6, 0.5, -2.0]}>
         <boxGeometry args={[0.2, 0.3, 0.1]} />
         <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1} />
       </mesh>
    </group>
  );
};

const Matatu32Seater = () => {
  return (
    <group position={[0, 0.45, 0]}>
       <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.9, 2.0, 5.5]} />
          <meshStandardMaterial color="#ffffff" />
       </mesh>
       <GraffitiStrip position={[0.96, 0.8, 0]} width={0.6} length={5} color="#F3FF00" />
       <GraffitiStrip position={[-0.96, 0.8, 0]} width={0.6} length={5} color="#F3FF00" />
       <Bumper position={[0, 0.2, 2.75]} width={2.0} />
       <Bumper position={[0, 0.2, -2.75]} width={2.0} />
       <LicensePlate position={[0, 0.2, 2.86]} />
       <LicensePlate position={[0, 0.2, -2.86]} isRear />
       <group position={[1.1, 1.2, 2.4]}>
          <SideMirror side="right" />
       </group>
       <group position={[-1.1, 1.2, 2.4]}>
          <SideMirror side="left" />
       </group>
       <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[1.92, 0.3, 5.52]} />
          <meshStandardMaterial color="#FFD700" />
       </mesh>
       <mesh position={[0, 1.3, 0.2]}>
          <boxGeometry args={[1.95, 0.8, 4.5]} />
          <meshStandardMaterial color="#1e293b" roughness={0.1} />
       </mesh>
       <mesh position={[0, 1.3, 2.76]} rotation={[0, 0, 0]}>
          <boxGeometry args={[1.8, 0.9, 0.1]} />
          <meshStandardMaterial color="#1e293b" roughness={0.1} />
       </mesh>
       <Wheel position={[0.85, 0, 1.8]} radius={0.4} />
       <Wheel position={[-0.85, 0, 1.8]} radius={0.4} />
       <Wheel position={[0.85, 0, -1.5]} radius={0.4} />
       <Wheel position={[-0.85, 0, -1.5]} radius={0.4} />
       <mesh position={[0.7, 0.4, 2.76]}>
         <boxGeometry args={[0.3, 0.2, 0.1]} />
         <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} />
       </mesh>
       <mesh position={[-0.7, 0.4, 2.76]}>
         <boxGeometry args={[0.3, 0.2, 0.1]} />
         <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} />
       </mesh>
       <mesh position={[0, 0.5, -2.76]}>
         <boxGeometry args={[1.8, 0.2, 0.1]} />
         <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1} />
       </mesh>
    </group>
  );
};

const Matatu52Seater = () => {
  return (
    <group position={[0, 0.55, 0]}>
       <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.1, 2.4, 8]} />
          <meshStandardMaterial color="#ffffff" />
       </mesh>
       <GraffitiStrip position={[1.06, 0.8, 0]} width={0.8} length={7.5} color="#FF00FF" />
       <GraffitiStrip position={[-1.06, 0.8, 0]} width={0.8} length={7.5} color="#FF00FF" />
       <Bumper position={[0, 0.3, 4.0]} width={2.2} />
       <Bumper position={[0, 0.3, -4.0]} width={2.2} />
       <LicensePlate position={[0, 0.3, 4.11]} />
       <LicensePlate position={[0, 0.3, -4.11]} isRear />
       <group position={[1.2, 1.5, 3.8]}>
          <mesh rotation={[0, 0, -0.2]}>
             <boxGeometry args={[0.1, 0.6, 0.3]} />
             <meshStandardMaterial color="#111" />
          </mesh>
       </group>
       <group position={[-1.2, 1.5, 3.8]}>
           <mesh rotation={[0, 0, 0.2]}>
             <boxGeometry args={[0.1, 0.6, 0.3]} />
             <meshStandardMaterial color="#111" />
          </mesh>
       </group>
       <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[2.12, 0.3, 8.02]} />
          <meshStandardMaterial color="#FFD700" />
       </mesh>
       <mesh position={[0, 1.6, 0]}>
          <boxGeometry args={[2.15, 0.9, 7.5]} />
          <meshStandardMaterial color="#1e293b" roughness={0.1} />
       </mesh>
       <mesh position={[0, 1.4, 4.01]}>
          <boxGeometry args={[2.0, 1.3, 0.1]} />
          <meshStandardMaterial color="#1e293b" roughness={0.1} />
       </mesh>
       <Wheel position={[0.9, 0, 2.5]} radius={0.45} />
       <Wheel position={[-0.9, 0, 2.5]} radius={0.45} />
       <Wheel position={[0.9, 0, -2]} radius={0.45} />
       <Wheel position={[-0.9, 0, -2]} radius={0.45} />
       <Wheel position={[0.9, 0, -3.2]} radius={0.45} />
       <Wheel position={[-0.9, 0, -3.2]} radius={0.45} />
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

export const PlayerContext = React.createContext<{ lane: number }>({ lane: -1 });

const Player = ({ type, setLaneCallback }: { type: VehicleType | null, setLaneCallback: (l: number) => void }) => {
  const meshRef = useRef<THREE.Group>(null);
  const timeOfDay = useGameStore(state => state.timeOfDay);
  const gameStatus = useGameStore(state => state.gameStatus);
  const isCrashing = useGameStore(state => state.isCrashing);
  const currentPassengers = useGameStore(state => state.currentPassengers); // Get passengers for rendering visual overload
  const [lane, setLane] = useState<-1 | 1>(-1); 
  const LERP_SPEED = 8;
  const TILT_ANGLE = 0.1;

  const reportLaneChange = useGameStore(state => state.reportLaneChange);

  useEffect(() => {
    setLaneCallback(lane);
  }, [lane, setLaneCallback]);

  useEffect(() => {
    if (gameStatus === 'PLAYING' && !isCrashing && meshRef.current) {
      meshRef.current.rotation.set(0, 0, 0);
      meshRef.current.position.y = 0;
      meshRef.current.position.x = -LANE_OFFSET; 
      setLane(-1); 
    }
  }, [gameStatus, isCrashing]);

  useEffect(() => {
    if (isCrashing) return; 

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
  }, [reportLaneChange, isCrashing]);

  const touchStartX = useRef<number | null>(null);
  useEffect(() => {
    if (isCrashing) return;

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
  }, [reportLaneChange, isCrashing]);

  useFrame((state, delta) => {
    if (meshRef.current) {
      if (isCrashing) {
         meshRef.current.rotation.x += delta * 2;
         meshRef.current.rotation.y += delta * 5;
         meshRef.current.rotation.z += delta * 3;
         meshRef.current.position.y += delta * 1;
      } else {
         const targetX = lane * LANE_OFFSET;
         meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX, delta * LERP_SPEED);
         const xDiff = targetX - meshRef.current.position.x;
         meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, -xDiff * TILT_ANGLE, delta * LERP_SPEED);
         meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 15) * 0.02; 
      }
    }
  });

  return (
    <group ref={meshRef} position={[-LANE_OFFSET, 0, 0]}>
       <group rotation={[0, Math.PI, 0]}>
         {type === 'boda' && <PlayerBoda passengerCount={currentPassengers} />}
         {type === 'tuktuk' && <PlayerTuktuk />}
         {type === 'personal-car' && <PlayerPersonalCar />}
         
         {type === '14-seater' && <Matatu14Seater />}
         {type === '32-seater' && <Matatu32Seater />}
         {type === '52-seater' && <Matatu52Seater />}
         
         {timeOfDay === 'NIGHT' && (
            <>
              <spotLight position={[0.6, 0.5, 2.2]} angle={0.5} penumbra={0.5} intensity={5} color="#fff" target-position={[0.6, 0, 10]} />
              <spotLight position={[-0.6, 0.5, 2.2]} angle={0.5} penumbra={0.5} intensity={5} color="#fff" target-position={[-0.6, 0, 10]} />
            </>
         )}
       </group>
    </group>
  );
};

const OncomingTraffic = ({ playerLane }: { playerLane: number }) => {
  const { triggerCrash, gameStatus, isCrashing } = useGameStore();
  const [vehicles, setVehicles] = useState<{ id: number, z: number, type: 'BIKE' | 'CAR' | 'MATATU' | 'BUS', speed: number }[]>([]);
  const nextSpawnRef = useRef(0);

  const TRAFFIC_LANE_X = LANE_OFFSET; 
  const SPAWN_DISTANCE = -150; 
  const DESPAWN_DISTANCE = 20;

  useEffect(() => {
    if (gameStatus === 'PLAYING' && !isCrashing) {
      setVehicles([]); 
      nextSpawnRef.current = 0;
    }
  }, [gameStatus, isCrashing]);

  useFrame((state, delta) => {
    if (gameStatus !== 'PLAYING') return;
    const currentSpeed = useGameStore.getState().currentSpeed;

    setVehicles(prev => {
      const next = [];
      for (const v of prev) {
        const moveSpeed = currentSpeed + v.speed;
        const newZ = v.z + moveSpeed * delta;
        
        // Pass Logic for Swoosh
        if (v.z < 0 && newZ >= 0) {
            playSfx('SWOOSH');
        }

        if (playerLane === 1 && !isCrashing) {
           const dist = Math.abs(newZ - 0); 
           if (dist < 3.0) {
             triggerCrash();
           }
        }

        if (newZ < DESPAWN_DISTANCE) {
          next.push({ ...v, z: newZ });
        }
      }
      return next;
    });

    if (currentSpeed > 0 && state.clock.elapsedTime > nextSpawnRef.current) {
      const types: ('BIKE' | 'CAR' | 'MATATU' | 'BUS')[] = ['BIKE', 'CAR', 'CAR', 'MATATU', 'BUS'];
      const type = types[Math.floor(Math.random() * types.length)];
      setVehicles(prev => [...prev, {
        id: Math.random(),
        z: SPAWN_DISTANCE,
        type,
        speed: 30 + Math.random() * 20 
      }]);
      const interval = 1 + Math.random() * 3;
      nextSpawnRef.current = state.clock.elapsedTime + interval;
    }
  });

  return (
    <group>
      {vehicles.map(v => (
        <group key={v.id} position={[TRAFFIC_LANE_X, 0, v.z]} rotation={[0, 0, 0]}>
           {v.type === 'BIKE' && <Motorbike />}
           {v.type === 'CAR' && <SmallCar />}
           {v.type === 'MATATU' && <Matatu14Seater />}
           {v.type === 'BUS' && <Matatu52Seater />}
        </group>
      ))}
    </group>
  );
};

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
        <PhysicsController />
        <CameraRig />
        <Scenery />
        <NairobiCity />
        <Road />
        <StageMarker />
        <PoliceMarker />
        <Player type={vehicleType || '14-seater'} setLaneCallback={setPlayerLane} />
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