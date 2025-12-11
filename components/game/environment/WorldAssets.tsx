
import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../../store/gameStore';
import * as THREE from 'three';
import { Wheel, VehicleHeadlight, LicensePlate } from '../vehicles/VehicleParts';

const ROAD_WIDTH = 8;
const HIGHWAY_WIDTH = 15; 
const RIVER_ROAD_WIDTH = 7; 

// --- Buildings & Landmarks ---

export const KICC = ({ position }: { position: [number, number, number] }) => {
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
    </group>
  );
};

export const TimesTower = ({ position }: { position: [number, number, number] }) => {
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

export const Basilica = ({ position }: { position: [number, number, number] }) => {
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
    </group>
  );
};

export const ModernBuilding = ({ height, color, position }: { height: number, color: string, position: [number, number, number] }) => {
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
    </group>
  );
};

export const ApartmentBlock = ({ position, color = "#d4d4d8" }: { position: [number, number, number], color?: string }) => {
  return (
    <group position={position}>
        <mesh position={[0, 6, 0]}>
             <boxGeometry args={[6, 12, 6]} />
             <meshStandardMaterial color={color} />
        </mesh>
        {Array.from({length: 4}).map((_, i) => (
             <group key={i} position={[0, i * 2.5 + 2, 3.1]}>
                 <mesh position={[0, 0, 0]}>
                    <boxGeometry args={[5, 1, 0.5]} />
                    <meshStandardMaterial color="#52525b" />
                 </mesh>
             </group>
        ))}
        <mesh position={[0, 1, 3.1]}>
             <planeGeometry args={[5, 2]} />
             <meshStandardMaterial color="#0f172a" />
        </mesh>
        <mesh position={[0, 2.1, 3.2]}>
             <boxGeometry args={[5.2, 0.4, 0.1]} />
             <meshStandardMaterial color="red" />
        </mesh>
    </group>
  );
}

export const Billboard = ({ position, rotation = [0,0,0] }: { position: [number, number, number], rotation?: [number, number, number] }) => {
    return (
        <group position={position} rotation={rotation as any}>
            <mesh position={[0, 3, 0]}>
                <cylinderGeometry args={[0.1, 0.1, 6]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            <mesh position={[0, 5, 0.1]}>
                <boxGeometry args={[4, 2, 0.2]} />
                <meshStandardMaterial color="#fff" />
            </mesh>
            <mesh position={[0, 5, 0.21]}>
                <planeGeometry args={[3.8, 1.8]} />
                <meshStandardMaterial color="#2563eb" emissive="#1d4ed8" emissiveIntensity={0.2} />
            </mesh>
        </group>
    )
}

export const BusStopShelter = () => {
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
      <mesh position={[0, 2.8, 0]} rotation={[0.1, 0, 0]}>
        <boxGeometry args={[4.2, 0.1, 2.8]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.2} />
      </mesh>
    </group>
  );
};

export const Rock = ({ scale = 1 }: { scale?: number }) => {
  return (
    <group scale={[scale, scale, scale]}>
      <mesh rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]}>
        <dodecahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial color="#5D4037" roughness={0.9} />
      </mesh>
    </group>
  );
};

export const Pothole = ({ position }: { position: [number, number, number] }) => {
    return (
        <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.6 + Math.random() * 0.4, 8]} />
            <meshStandardMaterial color="#1f1f1f" roughness={1} opacity={0.8} transparent />
        </mesh>
    );
}

export const CliffFace = () => {
  return (
    <group>
        <mesh position={[0, 10, 0]} rotation={[0, 0, 0.2]}>
             <boxGeometry args={[5, 40, 40]} />
             <meshStandardMaterial color="#5D4037" roughness={1.0} />
        </mesh>
        {Array.from({length: 5}).map((_, i) => (
            <mesh key={i} position={[2, Math.random() * 20 - 5, Math.random() * 30 - 15]} rotation={[Math.random(), Math.random(), Math.random()]}>
                <dodecahedronGeometry args={[3, 0]} />
                <meshStandardMaterial color="#4e342e" roughness={1.0} />
            </mesh>
        ))}
    </group>
  );
}

export const ValleyView = () => {
    return (
        <group position={[50, -20, 0]}>
            <mesh position={[0, 0, -50]}>
                <coneGeometry args={[40, 30, 4]} />
                <meshStandardMaterial color="#5f6368" />
            </mesh>
            <mesh position={[20, -5, 20]}>
                <coneGeometry args={[30, 25, 4]} />
                <meshStandardMaterial color="#70757a" />
            </mesh>
        </group>
    )
}

export const HighwayBarrier = () => {
    return (
        <group>
            <mesh position={[0, 0.4, 0]}>
                <boxGeometry args={[0.3, 0.8, 4]} />
                <meshStandardMaterial color="#9ca3af" roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.81, 0]}>
                <boxGeometry args={[0.35, 0.1, 4]} />
                <meshStandardMaterial color="#d1d5db" roughness={0.6} />
            </mesh>
        </group>
    );
};

export const HighwayLightPole = ({ isLeft = false }: { isLeft?: boolean }) => {
  return (
      <group>
          <mesh position={[0, 3, 0]}>
              <cylinderGeometry args={[0.1, 0.15, 6]} />
              <meshStandardMaterial color="#475569" />
          </mesh>
          <mesh position={[isLeft ? 2 : -2, 6, 0]} rotation={[0, 0, isLeft ? 0.2 : -0.2]}>
                <boxGeometry args={[5, 0.15, 0.3]} />
                <meshStandardMaterial color="#475569" />
          </mesh>
          <mesh position={[isLeft ? 4 : -4, 5.8, 0]}>
                <boxGeometry args={[0.8, 0.2, 0.5]} />
                <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={1} />
          </mesh>
      </group>
  );
};

export const LowPolyHuman: React.FC<{ position: [number, number, number]; rotation: [number, number, number]; isWalking?: boolean }> = ({ position, rotation, isWalking = false }) => {
  // REPLACED useMemo with useState initializer to avoid null hook error
  const [colors] = useState(() => ({
      shirt: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][Math.floor(Math.random() * 5)],
      pants: ['#1f2937', '#374151', '#4b5563', '#1e1e1e'][Math.floor(Math.random() * 4)]
  }));
  const skinColor = '#8d5524';
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
      if (isWalking && groupRef.current) {
          const t = state.clock.elapsedTime * 10;
          groupRef.current.position.y = position[1] + Math.abs(Math.sin(t)) * 0.1;
          groupRef.current.rotation.z = Math.sin(t) * 0.05;
      }
  })

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={[0.7, 0.7, 0.7]}>
      <mesh position={[0, 1.6, 0]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      <mesh position={[0, 1.0, 0]}>
        <boxGeometry args={[0.4, 0.8, 0.25]} />
        <meshStandardMaterial color={colors.shirt} />
      </mesh>
      <mesh position={[-0.12, 0.3, 0]}>
        <cylinderGeometry args={[0.08, 0.07, 0.6]} />
        <meshStandardMaterial color={colors.pants} />
      </mesh>
      <mesh position={[0.12, 0.3, 0]}>
         <cylinderGeometry args={[0.08, 0.07, 0.6]} />
        <meshStandardMaterial color={colors.pants} />
      </mesh>
    </group>
  );
};

export const CopOnFoot: React.FC<{ position: [number, number, number]; side: 'LEFT' | 'RIGHT'; playerLane: number }> = ({ position, side, playerLane }) => {
    const groupRef = useRef<THREE.Group>(null);
    return (
        <group ref={groupRef} position={position} rotation={[0, side === 'LEFT' ? Math.PI/2 : -Math.PI/2, 0]} scale={[0.8, 0.8, 0.8]}>
            <mesh position={[0, 1.6, 0]}>
                <sphereGeometry args={[0.2, 8, 8]} />
                <meshStandardMaterial color="#8d5524" />
            </mesh>
            <mesh position={[0, 1.85, 0]}>
                <cylinderGeometry args={[0.22, 0.22, 0.1]} />
                <meshStandardMaterial color="#1e3a8a" />
            </mesh>
            <mesh position={[0, 1.0, 0]}>
                <boxGeometry args={[0.4, 0.8, 0.25]} />
                <meshStandardMaterial color="#1e40af" />
            </mesh>
            <mesh position={[0, 1.1, 0.05]}>
                <boxGeometry args={[0.42, 0.5, 0.26]} />
                <meshStandardMaterial color="#fbbf24" />
            </mesh>
            <mesh position={[-0.12, 0.3, 0]}>
                <cylinderGeometry args={[0.08, 0.07, 0.6]} />
                <meshStandardMaterial color="#111827" />
            </mesh>
            <mesh position={[0.12, 0.3, 0]}>
                <cylinderGeometry args={[0.08, 0.07, 0.6]} />
                <meshStandardMaterial color="#111827" />
            </mesh>
        </group>
    )
}

export const Road = ({ variant = 'CITY' }: { variant?: 'CITY' | 'RURAL' | 'HIGHWAY' | 'RIVER_ROAD' | 'RONGAI' }) => {
  const groupRef = useRef<THREE.Group>(null);
  const STRIP_COUNT = 20;
  const STRIP_GAP = 10; 
  const timeOfDay = useGameStore(state => state.timeOfDay);
  
  const isRural = variant === 'RURAL';
  const isHighway = variant === 'HIGHWAY';
  const isRiverRoad = variant === 'RIVER_ROAD';
  const isRongai = variant === 'RONGAI';
  
  let width = ROAD_WIDTH;
  if (isHighway) width = HIGHWAY_WIDTH;
  if (isRiverRoad) width = RIVER_ROAD_WIDTH;
  if (isRongai) width = ROAD_WIDTH + 4; 

  const GRASS_OFFSET = width / 2 + 5;

  const roadColor = isRural ? "#5D4037" : (isRongai ? "#4b5563" : (timeOfDay === 'NIGHT' ? "#0a0a0a" : "#1a1a1a"));
  const sideColor = isRural ? "#795548" : (isRongai ? "#5D4037" : (timeOfDay === 'NIGHT' ? "#022c22" : "#064e3b"));
  const stripColor = isRural ? "#8d6e63" : "#fbbf24"; 

  useFrame((state, delta) => {
    const speed = useGameStore.getState().currentSpeed;
    if (groupRef.current && speed > 0) {
      groupRef.current.position.z += speed * delta;
      if (groupRef.current.position.z > STRIP_GAP) {
        groupRef.current.position.z %= STRIP_GAP;
      }
    }
  });

  if (isRongai) {
    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
                <planeGeometry args={[10, 300]} />
                <meshStandardMaterial color={roadColor} roughness={0.8} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-8, -0.04, 0]} receiveShadow>
                <planeGeometry args={[6, 300]} />
                <meshStandardMaterial color="#5D4037" roughness={1} />
            </mesh>
             <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-14, -0.1, 0]}>
                <planeGeometry args={[10, 300]} />
                <meshStandardMaterial color={sideColor} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[10, -0.1, 0]}>
                <planeGeometry args={[10, 300]} />
                <meshStandardMaterial color={sideColor} />
            </mesh>
            <group ref={groupRef}>
                 {Array.from({ length: STRIP_COUNT }).map((_, i) => (
                    <group key={i} position={[0, 0, -i * STRIP_GAP]}>
                         <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                            <planeGeometry args={[0.15, 4]} />
                            <meshStandardMaterial color={stripColor} />
                         </mesh>
                         <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-5, 0.06, 0]}>
                             <planeGeometry args={[0.2, STRIP_GAP]} />
                             <meshStandardMaterial color="#e2e8f0" />
                         </mesh>
                    </group>
                 ))}
            </group>
        </group>
    )
  }

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[width, 300]} />
        <meshStandardMaterial color={roadColor} roughness={isHighway ? 0.4 : 1.0} />
      </mesh>
      <group ref={groupRef}>
        {Array.from({ length: STRIP_COUNT }).map((_, i) => (
          <group key={i} position={[0, 0, -i * STRIP_GAP]}>
             {isHighway ? (
                <>
                   <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1.75, 0.01, 0]}>
                      <planeGeometry args={[0.15, 4]} />
                      <meshStandardMaterial color="#ffffff" />
                   </mesh>
                   <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.75, 0.01, 0]}>
                      <planeGeometry args={[0.15, 4]} />
                      <meshStandardMaterial color="#ffffff" />
                   </mesh>
                   <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-6.5, 0.01, 0]}>
                      <planeGeometry args={[0.2, 10]} />
                      <meshStandardMaterial color={stripColor} />
                   </mesh>
                   <mesh rotation={[-Math.PI / 2, 0, 0]} position={[6.5, 0.01, 0]}>
                      <planeGeometry args={[0.2, 10]} />
                      <meshStandardMaterial color={stripColor} />
                   </mesh>
                </>
             ) : (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                    <planeGeometry args={[isRural ? 0.4 : 0.15, isRural ? 2 : 4]} />
                    <meshStandardMaterial color={stripColor} opacity={isRural ? 0.5 : 1} transparent={isRural} />
                </mesh>
             )}
          </group>
        ))}
      </group>

      {isRiverRoad ? (
          <>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-(width/2 + 2), 0.15, 0]}>
                <planeGeometry args={[4, 300]} />
                <meshStandardMaterial color="#64748b" roughness={0.8} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(width/2 + 2), 0.15, 0]}>
                <planeGeometry args={[4, 300]} />
                <meshStandardMaterial color="#64748b" roughness={0.8} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-(width/2), 0.15, 0]}>
                <boxGeometry args={[0.2, 300, 0.3]} />
                <meshStandardMaterial color="#94a3b8" />
            </mesh>
             <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(width/2), 0.15, 0]}>
                <boxGeometry args={[0.2, 300, 0.3]} />
                <meshStandardMaterial color="#94a3b8" />
            </mesh>
          </>
      ) : (
        <>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-GRASS_OFFSET, -0.1, 0]}>
                <planeGeometry args={[10, 300]} />
                <meshStandardMaterial color={sideColor} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[GRASS_OFFSET, -0.1, 0]}>
                <planeGeometry args={[10, 300]} />
                <meshStandardMaterial color={sideColor} />
            </mesh>
        </>
      )}
    </group>
  );
};

export const Scenery = ({ variant = 'CITY' }: { variant?: 'CITY' | 'RURAL' | 'RONGAI' }) => {
  const groupRef = useRef<THREE.Group>(null);
  const { timeOfDay, totalRouteDistance, distanceTraveled, selectedRoute } = useGameStore();
  
  const OBJECT_COUNT = 24;
  const GAP = 15;
  const isHighway = selectedRoute?.id === 'thika-highway';
  const isRongai = variant === 'RONGAI';
  
  const BASE_OFFSET = isHighway ? 9 : (isRongai ? 12 : ROAD_WIDTH / 2 + 3); 

  const distRemaining = totalRouteDistance - distanceTraveled;
  const isCityApproaching = distRemaining < 800;

  const isRural = variant === 'RURAL';

  // REPLACED useMemo with useState initializer to avoid null hook error
  const [sceneryItems] = useState(() => {
    return Array.from({ length: OBJECT_COUNT }).map((_, i) => {
      const side = i % 2 === 0 ? 1 : -1;
      const x = (BASE_OFFSET + Math.random() * 4) * side;
      const z = -i * GAP;
      
      let type = 'TREE';
      if (isRural) {
         type = Math.random() > 0.6 ? 'ROCK' : 'TREE';
      } else if (isRongai) {
         type = Math.random() > 0.7 ? 'APARTMENT' : 'TREE';
      } else {
         type = i % 6 === 0 ? 'SIGN' : i % 3 === 0 ? 'BUSH' : 'TREE';
      }
      
      const scale = 0.8 + Math.random() * 0.4;
      return { x, z, type, side, scale };
    });
  });

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
            </group>
          ) : item.type === 'APARTMENT' ? (
              <ApartmentBlock position={[0, 0, 0]} color={i % 2 === 0 ? "#cbd5e1" : "#e2e8f0"} />
          ) : item.type === 'BUSH' ? (
            <mesh position={[0, 0.5, 0]}>
              <dodecahedronGeometry args={[0.8, 0]} />
              <meshStandardMaterial color={timeOfDay === 'NIGHT' ? "#143311" : "#2d5a27"} />
            </mesh>
          ) : item.type === 'ROCK' ? (
             <Rock scale={item.scale} />
          ) : (
            <group>
              <mesh position={[0, 0.5, 0]}>
                <cylinderGeometry args={[0.2, 0.3, 1]} />
                <meshStandardMaterial color="#451a03" />
              </mesh>
              <mesh position={[0, 2, 0]}>
                <coneGeometry args={[1.5, 3, 8]} />
                <meshStandardMaterial color={timeOfDay === 'NIGHT' ? "#032b20" : isRural ? "#386641" : "#065f46"} />
              </mesh>
            </group>
          )}
        </group>
      ))}
    </group>
  );
};

export const HeavyTruck = () => {
    const bodyColor = "#f59e0b";
    const cargoColor = "#374151";
    
    return (
        <group position={[0, 0.6, 0]}>
            <mesh position={[0, 0.8, 3.5]}>
                <boxGeometry args={[2.0, 1.8, 1.5]} />
                <meshStandardMaterial color={bodyColor} />
            </mesh>
            <mesh position={[0, 1.5, -0.5]}>
                <boxGeometry args={[2.1, 2.5, 6.0]} />
                <meshStandardMaterial color={cargoColor} roughness={0.9} />
            </mesh>
             <mesh position={[0, 1.2, 4.26]} rotation={[0.05, 0, 0]}>
                <boxGeometry args={[1.9, 0.8, 0.1]} />
                <meshStandardMaterial color="#111" metalness={0.8} roughness={0.1} />
            </mesh>
            <Wheel position={[1.0, -0.15, 3.5]} radius={0.45} />
            <Wheel position={[-1.0, -0.15, 3.5]} radius={0.45} />
            <Wheel position={[1.0, -0.15, -2.0]} radius={0.45} />
            <Wheel position={[-1.0, -0.15, -2.0]} radius={0.45} />
            <Wheel position={[1.0, -0.15, -0.5]} radius={0.45} />
            <Wheel position={[-1.0, -0.15, -0.5]} radius={0.45} />
            
            <VehicleHeadlight position={[0.8, 0.4, 4.26]} />
            <VehicleHeadlight position={[-0.8, 0.4, 4.26]} />
            
            <mesh position={[0, 1.0, -3.51]}>
                <boxGeometry args={[1.8, 0.2, 0.1]} />
                <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1} />
            </mesh>
        </group>
    )
}

export const StageModel = ({ distance, passengerCount, isDeparting }: { distance: number, passengerCount: number, isDeparting: boolean }) => {
  const markerRef = useRef<THREE.Group>(null);
  const { selectedRoute } = useGameStore();
  const isHighway = selectedRoute?.id === 'thika-highway';
  const isRongai = selectedRoute?.id === 'rongai-extreme';
  
  const MARKER_X = isHighway ? -12 : (isRongai ? -12 : -(ROAD_WIDTH / 2 + 2.5));
  
  // REPLACED useMemo with useState initializer
  const [crowd] = useState(() => {
    // Only generate once
    return Array.from({ length: 15 }).map((_, i) => ({
      x: (Math.random() - 0.5) * 3,
      z: (Math.random() - 0.5) * 1.5,
      rotY: (Math.random() - 0.5) * Math.PI
    }));
  });

  // Calculate visibility and active crowd slice based on props in render or useFrame
  // We can't change useState size easily, so we just map a slice of the pre-generated crowd
  const activeCrowd = isDeparting ? [] : crowd.slice(0, passengerCount);

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
      {activeCrowd.map((p, i) => (
        <LowPolyHuman key={i} position={[p.x, 0, p.z]} rotation={[0, p.rotY, 0]} />
      ))}
    </group>
  );
};

export const StageMarker = () => {
  const { nextStageDistance, lastStageDistance, nextStagePassengerCount } = useGameStore();
  return (
    <>
      <StageModel distance={nextStageDistance} passengerCount={nextStagePassengerCount} isDeparting={false} />
      <StageModel distance={lastStageDistance} passengerCount={0} isDeparting={true} />
    </>
  );
};

export const PoliceMarker = () => {
  const { nextPoliceDistance, distanceTraveled, selectedRoute } = useGameStore();
  const markerRef = useRef<THREE.Group>(null);
  const blueLightRef = useRef<THREE.Mesh>(null);
  const redLightRef = useRef<THREE.Mesh>(null);
  const distanceToPolice = nextPoliceDistance - distanceTraveled;
  const isVisible = distanceToPolice < 300 && distanceToPolice > -20;
  
  const isHighway = selectedRoute?.id === 'thika-highway';
  const MARKER_X = isHighway ? 8 : (ROAD_WIDTH / 2 + 1);

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
