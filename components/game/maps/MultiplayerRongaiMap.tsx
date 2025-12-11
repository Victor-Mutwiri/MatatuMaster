
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../../store/gameStore';
import * as THREE from 'three';
import { Road, Scenery, Pothole } from '../environment/WorldAssets';

// Rongai Extreme Race Map
// Denser Potholes, No Stages, Rougher visual vibe.

const DenseScrollingTerrain = () => {
    const groupRef = useRef<THREE.Group>(null);
    const speed = useGameStore(state => state.currentSpeed);
    const COUNT = 16;
    const GAP = 15;

    // INCREASED SPAWN RATES for Race Mode
    const chunks = useMemo(() => Array.from({ length: COUNT }).map((_, i) => ({
        z: -i * GAP,
        // Pothole probability increased from 0.4 to 0.7
        pothole: Math.random() > 0.3 ? {
            x: Math.random() > 0.5 ? (-3.2 + (Math.random() - 0.5)) : (-6.4 + (Math.random() - 0.5)),
            z: Math.random() * 10 - 5
        } : null,
        // Second pothole cluster for difficulty
        pothole2: Math.random() > 0.5 ? {
             x: Math.random() > 0.5 ? (-3.2 + (Math.random() - 0.5)) : (-6.4 + (Math.random() - 0.5)),
             z: Math.random() * 10 - 5 + 7 // Offset
        } : null,
        dirtPatch: Math.random() > 0.6 ? {
            x: -6.4 + (Math.random() - 0.5) * 2
        } : null
    })), []);

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

    return (
        <group ref={groupRef}>
            {chunks.map((chunk, i) => (
                <group key={i} position={[0, 0, chunk.z]}>
                    
                    {chunk.pothole && (
                        <Pothole position={[chunk.pothole.x, 0.07, chunk.pothole.z]} />
                    )}
                    
                    {chunk.pothole2 && (
                        <Pothole position={[chunk.pothole2.x, 0.07, chunk.pothole2.z]} />
                    )}
                    
                    {chunk.dirtPatch && (
                         <mesh position={[chunk.dirtPatch.x, 0.05, 0]} rotation={[-Math.PI/2, 0, 0]}>
                            <circleGeometry args={[1.8, 6]} />
                            <meshStandardMaterial color="#3f2e27" transparent opacity={0.7} />
                         </mesh>
                    )}

                </group>
            ))}
        </group>
    )
}

export const MultiplayerRongaiMap = () => {
  return (
    <group>
      {/* Visuals */}
      <Scenery variant="RONGAI" />
      <Road variant="RONGAI" />
      
      {/* High Density Obstacles */}
      <DenseScrollingTerrain />
      
      {/* No Stages or Police Markers */}
    </group>
  );
};
