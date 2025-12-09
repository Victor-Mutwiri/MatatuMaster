
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../../store/gameStore';
import * as THREE from 'three';
import { Road, Scenery, StageMarker, PoliceMarker, Pothole } from '../environment/WorldAssets';

const ScrollingTerrain = () => {
    const groupRef = useRef<THREE.Group>(null);
    const speed = useGameStore(state => state.currentSpeed);
    const COUNT = 16;
    const GAP = 15;

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

    return (
        <group ref={groupRef}>
            {chunks.map((z, i) => (
                <group key={i} position={[0, 0, z]}>
                    
                    {/* Visual Scenery is handled by Scenery Component but specific road decals here */}
                    
                    {/* Potholes - Randomly placed on the road */}
                    {Math.random() > 0.6 && (
                        <Pothole position={[Math.random() * 6 - 3, 0.05, Math.random() * 10 - 5]} />
                    )}
                    
                    {/* Dirt Patch Overlay (Visual only) */}
                    {Math.random() > 0.8 && (
                         <mesh position={[Math.random() * 6 - 3, 0.04, 0]} rotation={[-Math.PI/2, 0, 0]}>
                            <circleGeometry args={[1.5, 6]} />
                            <meshStandardMaterial color="#5D4037" transparent opacity={0.6} />
                         </mesh>
                    )}

                </group>
            ))}
        </group>
    )
}

export const RongaiMap = () => {
  return (
    <group>
      {/* Rongai has chaotic mix of buildings and rough terrain */}
      <Scenery variant="RONGAI" />
      
      {/* Road with extra shoulder width for overlapping */}
      <Road variant="RONGAI" />
      
      {/* Dynamic Potholes and Dirt */}
      <ScrollingTerrain />
      
      <StageMarker />
      <PoliceMarker />
    </group>
  );
};
