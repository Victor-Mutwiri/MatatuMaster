
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../../store/gameStore';
import * as THREE from 'three';
import { Road, StageMarker, PoliceMarker, ModernBuilding, Billboard, LowPolyHuman, CopOnFoot } from '../environment/WorldAssets';

const ScrollingCityBlocks = ({ playerLane }: { playerLane: number }) => {
    const groupRef = useRef<THREE.Group>(null);
    const speed = useGameStore(state => state.currentSpeed);
    const COUNT = 12;
    const GAP = 25;

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        if (speed > 0) {
            groupRef.current.children.forEach(child => {
                child.position.z += speed * delta;
                if (child.position.z > 20) {
                    child.position.z -= COUNT * GAP;
                }
            })
        }
    });

    const chunks = useMemo(() => Array.from({ length: COUNT }).map((_, i) => -i * GAP), []);

    // Helper to randomize buildings
    const getBuilding = (i: number, side: 'L' | 'R') => {
        const height = 15 + Math.random() * 25;
        const color = ['#1e293b', '#334155', '#475569'][i % 3];
        const x = side === 'L' ? -12 : 12; // Close buildings for narrow street feel
        return <ModernBuilding height={height} color={color} position={[x, 0, 0]} />;
    }

    return (
        <group ref={groupRef}>
            {chunks.map((z, i) => (
                <group key={i} position={[0, 0, z]}>
                    {/* Left Side */}
                    {getBuilding(i, 'L')}
                    
                    {/* Right Side */}
                    {getBuilding(i + 1, 'R')}

                    {/* Billboards */}
                    {i % 3 === 0 && (
                        <Billboard position={[-8, 4, 0]} rotation={[0, Math.PI / 4, 0]} />
                    )}

                    {/* Sidewalk Pedestrians */}
                    {/* Random Peds */}
                    {Math.random() > 0.3 && (
                        <LowPolyHuman 
                            position={[Math.random() > 0.5 ? 5.5 : -5.5, 0.3, Math.random() * 5]} 
                            rotation={[0, Math.random() * Math.PI, 0]} 
                            isWalking={true}
                        />
                    )}

                    {/* Police Patrol - Frequency low but deadly */}
                    {/* Placed at z=0 local, which moves. Need collision logic in CopOnFoot */}
                    {Math.random() > 0.8 && (
                        <CopOnFoot 
                            position={[Math.random() > 0.5 ? 6 : -6, 0.3, 0]} 
                            side={Math.random() > 0.5 ? 'RIGHT' : 'LEFT'} 
                            playerLane={playerLane}
                        />
                    )}
                </group>
            ))}
        </group>
    )
}

export const RiverRoadMap = ({ playerLane }: { playerLane: number }) => {
    // Collision Logic for Cops is handled here via distance checking?
    // Actually, TrafficSystem handles moving objects checks best.
    // But Static/Scrolling objects are harder.
    // Let's implement a simple check in useFrame here for the cops spawned inside ScrollingCityBlocks?
    // It's tricky because they are nested. 
    // Simplified: "Police on Foot" acts like a "Stationary Traffic" object spawned by traffic system? 
    // No, visual is part of map.
    
    // For now, we rely on the visual cues. Implementing precise collision for map props in this architecture is complex.
    // I will add a special "Cop Check" logic in the map itself if possible.
    
    // Alternative: The `CopOnFoot` component inside `WorldAssets` can check `playerLane` prop.
    // If playerLane matches side and distance is close.
    // Since `CopOnFoot` is moving with the world (scrolling towards +Z), we check its world Z position.
    
    const { endGame, distanceTraveled } = useGameStore();

    // We can simulate foot patrols via an invisible logic controller here if needed, 
    // but let's try to let the CopOnFoot component handle it.
    // It is passed `playerLane`. 
    // The issue is `CopOnFoot` inside `ScrollingCityBlocks` is moving.
    // We need to pass the real world Z to it? No, useFrame inside it can get world position.

    useFrame((state) => {
        // Global Map Logic
    });

  return (
    <group>
      <Road variant="RIVER_ROAD" />
      <ScrollingCityBlocks playerLane={playerLane} />
      <StageMarker />
      <PoliceMarker />
      
      {/* Skybox / Fog adjustment done in GameScene */}
    </group>
  );
};
