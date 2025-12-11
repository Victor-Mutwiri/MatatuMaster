
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../../store/gameStore';
import * as THREE from 'three';
import { Road, HighwayBarrier, ModernBuilding, HighwayLightPole } from '../environment/WorldAssets';

// A stripped-down version of ThikaRoadMap focused on speed.
// No StageMarkers, No PoliceMarkers.
// Enhanced visual effects for speed perception.

const SpeedDecorations = () => {
    const groupRef = useRef<THREE.Group>(null);
    const { currentSpeed } = useGameStore();
    
    const COUNT = 20;
    const GAP = 15;
    
    // Static placement array
    const chunks = useMemo(() => Array.from({ length: COUNT }).map((_, i) => -i * GAP), []);

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        
        // Move decorations to simulate travel
        groupRef.current.children.forEach((child) => {
            if (currentSpeed > 0) {
                child.position.z += currentSpeed * delta;
                if (child.position.z > 20) {
                    child.position.z -= COUNT * GAP;
                }
            }
        });
    });

    return (
        <group ref={groupRef}>
            {chunks.map((z, i) => (
                <group key={i} position={[0, 0, z]}>
                    
                    {/* RIGHT SIDE (Barrier + Lights) */}
                    <group position={[8, 0, 0]}>
                        <HighwayBarrier />
                        {/* More frequent lights for racing atmosphere */}
                        <HighwayLightPole isLeft={false} />
                    </group>

                    {/* LEFT SIDE (Barrier + Lights) */}
                    <group position={[-8, 0, 0]}>
                        <HighwayBarrier />
                        <HighwayLightPole isLeft={true} />
                    </group>

                    {/* Checkered Flags / Banners occasionally */}
                    {i % 5 === 0 && (
                        <group position={[0, 6, 0]}>
                             <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
                                 <boxGeometry args={[16, 1, 0.1]} />
                                 <meshStandardMaterial color="#111" />
                             </mesh>
                             <mesh position={[0, 0, 0.06]}>
                                 <planeGeometry args={[15, 0.8]} />
                                 <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.5} />
                             </mesh>
                        </group>
                    )}

                </group>
            ))}
        </group>
    );
};

export const MultiplayerThikaMap = () => {
    const { totalRouteDistance, distanceTraveled } = useGameStore();
    const groupRef = useRef<THREE.Group>(null);
    const distRemaining = totalRouteDistance - distanceTraveled;
    const isVisible = distRemaining < 2000;

    // Background Parallax
    useFrame(() => {
        if (groupRef.current) {
           groupRef.current.position.z = -(totalRouteDistance - distanceTraveled) * 0.1;
        }
    });

  return (
    <group>
      <Road variant="HIGHWAY" />
      
      {/* Intense Speed Decorations */}
      <SpeedDecorations />

      {/* Opposite Lane (Visual Only) - Pushed out further for highway feel */}
      <group position={[22, -0.05, 0]}>
           <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[12, 300]} />
                <meshStandardMaterial color="#1a1a1a" />
           </mesh>
           {/* We can add simple red taillights streaming away here for effect */}
      </group>

      {/* Distant Skyline */}
      {isVisible && (
        <group ref={groupRef} position={[0, 0, -500]}>
            <ModernBuilding height={60} color="#0f172a" position={[-40, 0, 0]} />
            <ModernBuilding height={80} color="#1e293b" position={[-20, 0, -20]} />
            <ModernBuilding height={50} color="#334155" position={[30, 0, 10]} />
            <ModernBuilding height={70} color="#0f172a" position={[50, 0, -30]} />
        </group>
      )}
    </group>
  );
};
