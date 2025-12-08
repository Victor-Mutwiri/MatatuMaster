
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../../store/gameStore';
import * as THREE from 'three';
import { Road, Scenery, StageMarker, PoliceMarker, HighwayBarrier, ModernBuilding } from '../environment/WorldAssets';

const OppositeTrafficVisual = () => {
    const groupRef = useRef<THREE.Group>(null);
    const speed = useGameStore(state => state.currentSpeed);
    
    // Simple low poly cars moving in opposite direction (very fast relative speed)
    useFrame((state, delta) => {
        if (groupRef.current) {
            // These move "towards" camera (standard oncoming)
            // But since they are on the "other side", they should just zoom past
            const moveSpeed = speed + 80; // Relative speed
            groupRef.current.children.forEach((child, i) => {
                child.position.z += moveSpeed * delta;
                if (child.position.z > 50) {
                    child.position.z = -300 - Math.random() * 200;
                }
            });
        }
    });

    return (
        <group position={[18, 0, 0]} ref={groupRef}>
            {Array.from({ length: 10 }).map((_, i) => (
                <mesh key={i} position={[Math.random() * 4 - 2, 0.5, -i * 60 - Math.random() * 20]}>
                    <boxGeometry args={[1.5, 1, 3]} />
                    {/* Headlights facing camera */}
                    <meshStandardMaterial color="#ef4444" /> 
                    <mesh position={[0.4, 0.2, 1.51]}>
                        <circleGeometry args={[0.2]} />
                        <meshBasicMaterial color="#ffffff" />
                    </mesh>
                    <mesh position={[-0.4, 0.2, 1.51]}>
                        <circleGeometry args={[0.2]} />
                        <meshBasicMaterial color="#ffffff" />
                    </mesh>
                </mesh>
            ))}
        </group>
    );
};

export const ThikaRoadMap = () => {
    const { totalRouteDistance, distanceTraveled } = useGameStore();
    const groupRef = useRef<THREE.Group>(null);
    const distRemaining = totalRouteDistance - distanceTraveled;
    const isVisible = distRemaining < 2000;

    // Move city background based on speed to simulate travel
    useFrame(() => {
        if (groupRef.current) {
           groupRef.current.position.z = -(totalRouteDistance - useGameStore.getState().distanceTraveled) * 0.1; // Parallax effect
        }
    });

  return (
    <group>
      <Road variant="HIGHWAY" />
      
      {/* Central Barrier */}
      <group>
          {Array.from({ length: 15 }).map((_, i) => (
               <group key={i} position={[0, 0, -i * 20]}>
                   <group position={[6, 0, 0]}>
                       <HighwayBarrier />
                   </group>
                   {/* Street Lights */}
                   <group position={[6, 0, 0]}>
                        <mesh position={[0, 3, 0]}>
                            <cylinderGeometry args={[0.1, 0.15, 6]} />
                            <meshStandardMaterial color="#475569" />
                        </mesh>
                        <mesh position={[-2, 6, 0]} rotation={[0, 0, -0.2]}>
                             <boxGeometry args={[5, 0.15, 0.3]} />
                             <meshStandardMaterial color="#475569" />
                        </mesh>
                        <mesh position={[-4, 5.8, 0]}>
                             <boxGeometry args={[0.8, 0.2, 0.5]} />
                             <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={1} />
                        </mesh>
                   </group>
               </group>
          ))}
      </group>

      {/* Opposite Lane (Visual Only) */}
      <group position={[18, -0.05, 0]}>
           <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[12, 300]} />
                <meshStandardMaterial color="#1a1a1a" />
           </mesh>
           <OppositeTrafficVisual />
      </group>

      {/* Distant City Skyline (Approaching Nairobi) */}
      {isVisible && (
        <group ref={groupRef} position={[0, 0, -500]}>
            <ModernBuilding height={60} color="#0f172a" position={[-40, 0, 0]} />
            <ModernBuilding height={80} color="#1e293b" position={[-20, 0, -20]} />
            <ModernBuilding height={50} color="#334155" position={[30, 0, 10]} />
            <ModernBuilding height={70} color="#0f172a" position={[50, 0, -30]} />
        </group>
      )}

      {/* Scenery on the left side only (since right is opposite traffic) */}
      <group position={[-15, 0, 0]}>
          <Scenery variant="CITY" />
      </group>

      <StageMarker />
      <PoliceMarker />
    </group>
  );
};
