
import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../../store/gameStore';
import * as THREE from 'three';
import { Road, Scenery, Pothole } from '../environment/WorldAssets';

const DenseScrollingTerrain = () => {
    const groupRef = useRef<THREE.Group>(null);
    const speed = useGameStore(state => state.currentSpeed);
    const COUNT = 16;
    const GAP = 15;

    // REPLACE useMemo with useState
    const [chunks] = useState(() => Array.from({ length: COUNT }).map((_, i) => ({
        z: -i * GAP,
        pothole: Math.random() > 0.3 ? {
            x: Math.random() > 0.5 ? (-3.2 + (Math.random() - 0.5)) : (-6.4 + (Math.random() - 0.5)),
            z: Math.random() * 10 - 5
        } : null,
        pothole2: Math.random() > 0.5 ? {
             x: Math.random() > 0.5 ? (-3.2 + (Math.random() - 0.5)) : (-6.4 + (Math.random() - 0.5)),
             z: Math.random() * 10 - 5 + 7 
        } : null,
        dirtPatch: Math.random() > 0.6 ? {
            x: -6.4 + (Math.random() - 0.5) * 2
        } : null
    })));

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
      <Scenery variant="RONGAI" />
      <Road variant="RONGAI" />
      <DenseScrollingTerrain />
    </group>
  );
};
