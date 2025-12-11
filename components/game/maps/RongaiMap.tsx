
import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../../store/gameStore';
import * as THREE from 'three';
import { Road, Scenery, StageMarker, PoliceMarker, Pothole } from '../environment/WorldAssets';

const ScrollingTerrain = () => {
    const groupRef = useRef<THREE.Group>(null);
    const speed = useGameStore(state => state.currentSpeed);
    const COUNT = 16;
    const GAP = 15;

    // REPLACE useMemo with useState
    const [chunks] = useState(() => Array.from({ length: COUNT }).map((_, i) => ({
        z: -i * GAP,
        pothole: Math.random() > 0.6 ? {
            x: Math.random() > 0.5 ? (-3.2 + (Math.random() - 0.5)) : (-6.4 + (Math.random() - 0.5)),
            z: Math.random() * 10 - 5
        } : null,
        dirtPatch: Math.random() > 0.8 ? {
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
                    {chunk.dirtPatch && (
                         <mesh position={[chunk.dirtPatch.x, 0.05, 0]} rotation={[-Math.PI/2, 0, 0]}>
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
      <Scenery variant="RONGAI" />
      <Road variant="RONGAI" />
      <ScrollingTerrain />
      <StageMarker />
      <PoliceMarker />
    </group>
  );
};
