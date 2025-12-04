
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
  const { currentSpeed, isCrashing } = useGameStore();
  // Re-use constant for consistency
  const startPos = useMemo(() => CAMERA_POS.clone(), []);
  
  useFrame((state) => {
    // Basic shake based on speed
    const t = state.clock.elapsedTime;
    let shakeIntensity = currentSpeed > 0 ? 0.05 : 0;
    
    // Extreme shake during crash
    if (isCrashing) {
      shakeIntensity = 0.5;
    }

    const shakeY = Math.sin(t * 30) * shakeIntensity * 0.5;
    const shakeX = Math.cos(t * 25) * shakeIntensity * 0.3;

    // Smooth return to center
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, shakeX, 0.1);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, startPos.y + shakeY, 0.1);
    
    if (isCrashing) {
       // Zoom in slightly on crash
       camera.position.z = THREE.MathUtils.lerp(camera.position.z, startPos.z - 5, 0.05);
    } else {
       camera.position.z = startPos.z;
    }
    
    // Look slightly ahead, but lower down to see the road better
    camera.lookAt(0, 0, -5);
  });

  return null;
};

// Environment Scenery
const Scenery = () => {
  const groupRef = useRef<THREE.Group>(null);
  const currentSpeed = useGameStore(state => state.currentSpeed);
  const timeOfDay = useGameStore(state => state.timeOfDay);
  
  const OBJECT_COUNT = 24;
  const GAP = 15;
  const OFFSET_FROM_ROAD = ROAD_WIDTH / 2 + 3; 
  
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
              <meshStandardMaterial color={timeOfDay === 'NIGHT' ? "#143311" : "#2d5a27"} />
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
                <meshStandardMaterial color={timeOfDay === 'NIGHT' ? "#032b20" : "#065f46"} />
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
  const STRIP_GAP = 10; 
  const GRASS_OFFSET = ROAD_WIDTH / 2 + 5; 
  const timeOfDay = useGameStore(state => state.timeOfDay);
  
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
        <planeGeometry args={[ROAD_WIDTH, 300]} />
        <meshStandardMaterial color={timeOfDay === 'NIGHT' ? "#0a0a0a" : "#1a1a1a"} roughness={0.8} />
      </mesh>

      {/* Markings - Center Line */}
      <group ref={groupRef}>
        {Array.from({ length: STRIP_COUNT }).map((_, i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -i * STRIP_GAP]}>
            <planeGeometry args={[0.15, 4]} />
            <meshBasicMaterial color="#fbbf24" />
          </mesh>
        ))}
      </group>
      
      {/* Shoulder/Grass Left */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-GRASS_OFFSET, -0.1, 0]}>
        <planeGeometry args={[10, 300]} />
        <meshStandardMaterial color={timeOfDay === 'NIGHT' ? "#022c22" : "#064e3b"} />
      </mesh>
      {/* Shoulder/Grass Right */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[GRASS_OFFSET, -0.1, 0]}>
        <planeGeometry args={[10, 300]} />
        <meshStandardMaterial color={timeOfDay === 'NIGHT' ? "#022c22" : "#064e3b"} />
      </mesh>
    </group>
  );
};

// Stage Marker
const StageMarker = () => {
  const { nextStageDistance, distanceTraveled } = useGameStore();
  const markerRef = useRef<THREE.Group>(null);
  
  const distanceToStage = nextStageDistance - distanceTraveled;
  const isVisible = distanceToStage < 300 && distanceToStage > -20;
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
  const isVisible = distanceToPolice < 300 && distanceToPolice > -20;
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
      // Rotate based on speed
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

// New Part: Side Mirror
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

// New Part: Bumper
const Bumper = ({ position, width }: { position: [number, number, number], width: number }) => {
  return (
    <mesh position={position}>
      <boxGeometry args={[width, 0.2, 0.2]} />
      <meshStandardMaterial color="#1f2937" roughness={0.5} />
    </mesh>
  );
};

// New Part: License Plate
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

// New Part: Graffiti Strip
const GraffitiStrip = ({ position, width, length, color }: { position: [number, number, number], width: number, length: number, color: string }) => {
  return (
    <mesh position={position} rotation={[0, Math.PI / 2, 0]}>
      <planeGeometry args={[length, width]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
    </mesh>
  );
};

// --- Vehicle Models ---

const Motorbike = () => {
  return (
    <group position={[0, 0.35, 0]}>
       {/* Wheels */}
       <Wheel position={[0, 0, 0.6]} radius={0.35} />
       <Wheel position={[0, 0, -0.6]} radius={0.35} />
       
       {/* Body Frame */}
       <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[0.15, 0.3, 1.2]} />
          <meshStandardMaterial color="#ef4444" />
       </mesh>
       
       {/* Handlebars */}
       <mesh position={[0, 0.7, 0.4]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.8]} />
          <meshStandardMaterial color="#333" />
       </mesh>
       <mesh position={[0, 0.7, 0.4]} rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[0.02, 0.02, 0.8]} />
          <meshStandardMaterial color="#333" />
       </mesh>

       {/* Rider Body */}
       <mesh position={[0, 0.8, 0]}>
          <boxGeometry args={[0.4, 0.5, 0.2]} />
          <meshStandardMaterial color="#1e293b" />
       </mesh>
       {/* Rider Head */}
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
       {/* Body */}
       <mesh position={[0, 0.35, 0]}>
          <boxGeometry args={[1.4, 0.6, 3.2]} />
          <meshStandardMaterial color="#3b82f6" />
       </mesh>
       {/* Cabin */}
       <mesh position={[0, 0.8, -0.2]}>
          <boxGeometry args={[1.3, 0.5, 2.0]} />
          <meshStandardMaterial color="#3b82f6" />
       </mesh>
       {/* Windows */}
       <mesh position={[0, 0.82, -0.2]}>
          <boxGeometry args={[1.32, 0.4, 1.8]} />
          <meshStandardMaterial color="#1e293b" roughness={0.1} />
       </mesh>
       {/* Wheels */}
       <Wheel position={[0.6, 0, 1.0]} radius={0.3} />
       <Wheel position={[-0.6, 0, 1.0]} radius={0.3} />
       <Wheel position={[0.6, 0, -1.0]} radius={0.3} />
       <Wheel position={[-0.6, 0, -1.0]} radius={0.3} />
       
       {/* Lights */}
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

// 14-Seater: The Shark (Refined)
const Matatu14Seater = () => {
  return (
    <group position={[0, 0.35, 0]}>
       {/* Main Body Lower */}
       <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.7, 0.6, 4]} />
          <meshStandardMaterial color="#ffffff" />
       </mesh>
       {/* Main Body Upper (Cabin) */}
       <mesh position={[0, 1.0, 0.2]} castShadow receiveShadow>
          <boxGeometry args={[1.6, 0.7, 3.2]} />
          <meshStandardMaterial color="#ffffff" />
       </mesh>

       {/* Graffiti Art */}
       <GraffitiStrip position={[0.86, 0.5, 0]} width={0.4} length={3.5} color="#00F3FF" />
       <GraffitiStrip position={[-0.86, 0.5, 0]} width={0.4} length={3.5} color="#00F3FF" />

       {/* Bumpers */}
       <Bumper position={[0, 0.2, 2.0]} width={1.75} />
       <Bumper position={[0, 0.2, -2.0]} width={1.75} />

       {/* License Plates */}
       <LicensePlate position={[0, 0.2, 2.11]} />
       <LicensePlate position={[0, 0.2, -2.11]} isRear />

       {/* Side Mirrors */}
       <group position={[0.9, 0.8, 1.5]}>
          <SideMirror side="right" />
       </group>
       <group position={[-0.9, 0.8, 1.5]}>
          <SideMirror side="left" />
       </group>

       {/* Yellow Stripe */}
       <mesh position={[0, 0.75, 0]}>
          <boxGeometry args={[1.62, 0.1, 4.02]} />
          <meshStandardMaterial color="#FFD700" />
       </mesh>
       
       {/* Windows Side */}
       <mesh position={[0, 1.05, 0.2]}>
          <boxGeometry args={[1.65, 0.5, 3]} />
          <meshStandardMaterial color="#1e293b" roughness={0.1} />
       </mesh>
       
       {/* Windshield */}
       <mesh position={[0, 0.9, 1.85]} rotation={[-0.4, 0, 0]}>
          <boxGeometry args={[1.5, 0.7, 0.1]} />
          <meshStandardMaterial color="#1e293b" roughness={0.1} />
       </mesh>

       {/* Roof Rack */}
       <group position={[0, 1.4, 0.5]}>
          <mesh position={[0.7, 0, 0]}>
            <boxGeometry args={[0.05, 0.1, 2.5]} />
            <meshStandardMaterial color="#333" />
          </mesh>
          <mesh position={[-0.7, 0, 0]}>
            <boxGeometry args={[0.05, 0.1, 2.5]} />
            <meshStandardMaterial color="#333" />
          </mesh>
          {/* Crossbars */}
          {[0, 0.5, 1, 1.5, 2, 2.5].map((z, i) => (
             <mesh key={i} position={[0, 0, z - 1.25]} rotation={[0, 0, Math.PI/2]}>
               <cylinderGeometry args={[0.02, 0.02, 1.45]} />
               <meshStandardMaterial color="#333" />
             </mesh>
          ))}
          {/* Luggage */}
          <mesh position={[0.2, 0.15, 0.5]} rotation={[0, 0.5, 0]}>
             <boxGeometry args={[0.6, 0.4, 0.8]} />
             <meshStandardMaterial color="#854d0e" />
          </mesh>
       </group>

       {/* Wheels */}
       <Wheel position={[0.75, 0, 1.2]} />
       <Wheel position={[-0.75, 0, 1.2]} />
       <Wheel position={[0.75, 0, -1.2]} />
       <Wheel position={[-0.75, 0, -1.2]} />

       {/* Lights */}
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

// 32-Seater: The Rumble (Refined)
const Matatu32Seater = () => {
  return (
    <group position={[0, 0.45, 0]}>
       {/* Main Body */}
       <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.9, 2.0, 5.5]} />
          <meshStandardMaterial color="#ffffff" />
       </mesh>
       
       {/* Graffiti Art */}
       <GraffitiStrip position={[0.96, 0.8, 0]} width={0.6} length={5} color="#F3FF00" />
       <GraffitiStrip position={[-0.96, 0.8, 0]} width={0.6} length={5} color="#F3FF00" />

       {/* Bumpers */}
       <Bumper position={[0, 0.2, 2.75]} width={2.0} />
       <Bumper position={[0, 0.2, -2.75]} width={2.0} />
       
       {/* License Plates */}
       <LicensePlate position={[0, 0.2, 2.86]} />
       <LicensePlate position={[0, 0.2, -2.86]} isRear />

       {/* Mirrors */}
       <group position={[1.1, 1.2, 2.4]}>
          <SideMirror side="right" />
       </group>
       <group position={[-1.1, 1.2, 2.4]}>
          <SideMirror side="left" />
       </group>

       {/* Yellow Stripe */}
       <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[1.92, 0.3, 5.52]} />
          <meshStandardMaterial color="#FFD700" />
       </mesh>
       {/* Windows Side */}
       <mesh position={[0, 1.3, 0.2]}>
          <boxGeometry args={[1.95, 0.8, 4.5]} />
          <meshStandardMaterial color="#1e293b" roughness={0.1} />
       </mesh>
       {/* Front Cab Window */}
       <mesh position={[0, 1.3, 2.76]} rotation={[0, 0, 0]}>
          <boxGeometry args={[1.8, 0.9, 0.1]} />
          <meshStandardMaterial color="#1e293b" roughness={0.1} />
       </mesh>

       {/* Wheels - Dual Rear Axle look */}
       <Wheel position={[0.85, 0, 1.8]} radius={0.4} />
       <Wheel position={[-0.85, 0, 1.8]} radius={0.4} />
       <Wheel position={[0.85, 0, -1.5]} radius={0.4} />
       <Wheel position={[-0.85, 0, -1.5]} radius={0.4} />

       {/* Lights */}
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

// 52-Seater: The Titan (Refined)
const Matatu52Seater = () => {
  return (
    <group position={[0, 0.55, 0]}>
       {/* Main Body */}
       <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.1, 2.4, 8]} />
          <meshStandardMaterial color="#ffffff" />
       </mesh>

        {/* Graffiti Art */}
       <GraffitiStrip position={[1.06, 0.8, 0]} width={0.8} length={7.5} color="#FF00FF" />
       <GraffitiStrip position={[-1.06, 0.8, 0]} width={0.8} length={7.5} color="#FF00FF" />

       {/* Bumpers */}
       <Bumper position={[0, 0.3, 4.0]} width={2.2} />
       <Bumper position={[0, 0.3, -4.0]} width={2.2} />

        {/* License Plates */}
       <LicensePlate position={[0, 0.3, 4.11]} />
       <LicensePlate position={[0, 0.3, -4.11]} isRear />

        {/* Mirrors - Bus style (Large) */}
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

       {/* Yellow Stripe */}
       <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[2.12, 0.3, 8.02]} />
          <meshStandardMaterial color="#FFD700" />
       </mesh>
       {/* Windows Side */}
       <mesh position={[0, 1.6, 0]}>
          <boxGeometry args={[2.15, 0.9, 7.5]} />
          <meshStandardMaterial color="#1e293b" roughness={0.1} />
       </mesh>
       {/* Large Front Window */}
       <mesh position={[0, 1.4, 4.01]}>
          <boxGeometry args={[2.0, 1.3, 0.1]} />
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
// We export current lane to checking collisions in OncomingTraffic
export const PlayerContext = React.createContext<{ lane: number }>({ lane: -1 });

const Player = ({ type, setLaneCallback }: { type: VehicleType | null, setLaneCallback: (l: number) => void }) => {
  const meshRef = useRef<THREE.Group>(null);
  const timeOfDay = useGameStore(state => state.timeOfDay);
  const gameStatus = useGameStore(state => state.gameStatus);
  const isCrashing = useGameStore(state => state.isCrashing);
  // -1 is Left Lane (Kenya keep left), 1 is Right Lane (Overtaking)
  const [lane, setLane] = useState<-1 | 1>(-1); 
  const LERP_SPEED = 8;
  const TILT_ANGLE = 0.1;

  const reportLaneChange = useGameStore(state => state.reportLaneChange);

  // Sync local lane state to parent for collision logic
  useEffect(() => {
    setLaneCallback(lane);
  }, [lane, setLaneCallback]);

  // Reset Logic: When game restarts (enters PLAYING state), reset transform
  useEffect(() => {
    if (gameStatus === 'PLAYING' && !isCrashing && meshRef.current) {
      // Reset rotation completely to fix "flipped" bug after crash
      meshRef.current.rotation.set(0, 0, 0);
      meshRef.current.position.y = 0;
      meshRef.current.position.x = -LANE_OFFSET; // Force snap to left lane
      setLane(-1); // Reset state to left lane
    }
  }, [gameStatus, isCrashing]);

  useEffect(() => {
    if (isCrashing) return; // Disable controls during crash

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
         // DRAMATIC CRASH ANIMATION
         // Spin wildly
         meshRef.current.rotation.x += delta * 2;
         meshRef.current.rotation.y += delta * 5;
         meshRef.current.rotation.z += delta * 3;
         // Lift off ground slightly
         meshRef.current.position.y += delta * 1;
      } else {
         const targetX = lane * LANE_OFFSET;
         meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX, delta * LERP_SPEED);
         const xDiff = targetX - meshRef.current.position.x;
         // Tilt based on movement direction
         meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, -xDiff * TILT_ANGLE, delta * LERP_SPEED);
         // Gentle bounce
         meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 15) * 0.02; 
      }
    }
  });

  return (
    <group ref={meshRef} position={[-LANE_OFFSET, 0, 0]}>
       {/* 
          ROTATE 180 DEGREES: 
          Models were built with Z+ as front, but we drive towards Z-.
          So we flip them to face forward.
       */}
       <group rotation={[0, Math.PI, 0]}>
         {type === '14-seater' && <Matatu14Seater />}
         {type === '32-seater' && <Matatu32Seater />}
         {type === '52-seater' && <Matatu52Seater />}
         
         {/* Headlights (Night Mode Only) */}
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

// Oncoming Traffic System
const OncomingTraffic = ({ playerLane }: { playerLane: number }) => {
  const { currentSpeed, triggerCrash, gameStatus, isCrashing } = useGameStore();
  const [vehicles, setVehicles] = useState<{ id: number, z: number, type: 'BIKE' | 'CAR' | 'MATATU' | 'BUS', speed: number }[]>([]);
  const nextSpawnRef = useRef(0);

  // Traffic Config
  const TRAFFIC_LANE_X = LANE_OFFSET; // Right Lane
  const SPAWN_DISTANCE = -150; // Spawn far ahead (negative Z because objects move +Z)
  const DESPAWN_DISTANCE = 20;

  // Reset Traffic on Restart
  useEffect(() => {
    if (gameStatus === 'PLAYING' && !isCrashing) {
      setVehicles([]); // Clear traffic
      nextSpawnRef.current = 0;
    }
  }, [gameStatus, isCrashing]);

  useFrame((state, delta) => {
    if (gameStatus !== 'PLAYING') return;

    // 1. Move Vehicles
    setVehicles(prev => {
      const next = [];
      for (const v of prev) {
        // Vehicles move towards positive Z (camera)
        // Speed = Player Speed + Oncoming Speed (Relative)
        const moveSpeed = currentSpeed + v.speed;
        const newZ = v.z + moveSpeed * delta;
        
        // Collision Detection
        // If player is in Right Lane (1) and vehicle is close
        if (playerLane === 1 && !isCrashing) {
           const dist = Math.abs(newZ - 0); // Player is at Z=0
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

    // 2. Spawn Logic
    if (currentSpeed > 0 && state.clock.elapsedTime > nextSpawnRef.current) {
      const types: ('BIKE' | 'CAR' | 'MATATU' | 'BUS')[] = ['BIKE', 'CAR', 'CAR', 'MATATU', 'BUS'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      setVehicles(prev => [...prev, {
        id: Math.random(),
        z: SPAWN_DISTANCE,
        type,
        speed: 30 + Math.random() * 20 // Traffic speed
      }]);
      
      // Random interval between 1s and 4s depending on speed
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

// --- Main Scene ---
interface GameSceneProps {
  vehicleType: VehicleType | null;
}

export const GameScene: React.FC<GameSceneProps> = ({ vehicleType }) => {
  const [playerLane, setPlayerLane] = useState(-1);
  const timeOfDay = useGameStore(state => state.timeOfDay);
  
  // Background gradient based on Time of Day
  const bgClass = timeOfDay === 'NIGHT' 
    ? 'bg-gradient-to-b from-black via-slate-900 to-indigo-950'
    : 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-400 via-blue-300 to-blue-200';

  return (
    <div className={`w-full h-full ${bgClass}`}>
      <Canvas shadows camera={{ position: [CAMERA_POS.x, CAMERA_POS.y, CAMERA_POS.z], fov: 45 }}>
        {/* Day/Night Lighting */}
        <ambientLight intensity={timeOfDay === 'NIGHT' ? 0.2 : 0.6} />
        <directionalLight 
          position={timeOfDay === 'NIGHT' ? [-20, 30, -10] : [20, 30, 10]} 
          intensity={timeOfDay === 'NIGHT' ? 0.3 : 1.5} 
          castShadow 
          shadow-mapSize={[1024, 1024]} 
          color={timeOfDay === 'NIGHT' ? "#b0c4de" : "#ffffff"} 
        />
        
        <CameraRig />
        <GameLogic />
        <Scenery />
        <Road />
        <StageMarker />
        <PoliceMarker />
        
        <Player type={vehicleType || '14-seater'} setLaneCallback={setPlayerLane} />
        <OncomingTraffic playerLane={playerLane} />
        
        <fog attach="fog" args={[timeOfDay === 'NIGHT' ? '#020617' : '#e0f2fe', 15, 80]} />
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
