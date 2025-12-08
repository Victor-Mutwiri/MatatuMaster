
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../../store/gameStore';
import * as THREE from 'three';
import { Road, StageMarker, PoliceMarker, CliffFace, ValleyView } from '../environment/WorldAssets';

const ScrollingScenery = () => {
    const groupRef = useRef<THREE.Group>(null);
    const speed = useGameStore(state => state.currentSpeed);
    const COUNT = 12;
    const GAP = 30;

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

    // Create initial chunks
    const chunks = Array.from({ length: COUNT }).map((_, i) => -i * GAP);

    return (
        <group ref={groupRef}>
            {chunks.map((z, i) => (
                <group key={i} position={[0, 0, z]}>
                    {/* Left: Cliff Face (Close) */}
                    <group position={[-14, 0, 0]}>
                         <CliffFace />
                    </group>
                    
                    {/* Right: Valley Dropoff (Far) */}
                    {/* Valley is static relative to map, handled by ValleyView */}
                    
                    {/* Roadside Props */}
                    <mesh position={[-5, 0.5, 0]}>
                         <cylinderGeometry args={[0.1, 0.1, 1]} />
                         <meshStandardMaterial color="#444" />
                    </mesh>
                    <mesh position={[5, 0.5, 0]}>
                         {/* Guard Rail Posts on right */}
                         <cylinderGeometry args={[0.1, 0.1, 1]} />
                         <meshStandardMaterial color="#aaa" />
                    </mesh>
                </group>
            ))}
        </group>
    )
}

export const MaiMahiuMap = () => {
  return (
    <group>
      {/* Visual Tilt to imply steepness */}
      <group rotation={[0.05, 0, 0]}>
          <Road variant="CITY" />
          <StageMarker />
          <PoliceMarker />
          <ScrollingScenery />
          
          {/* Continuous Guard Rail Right */}
          <mesh position={[5.5, 0.5, -150]} rotation={[Math.PI/2, 0, 0]}>
             <cylinderGeometry args={[0.1, 0.1, 300]} />
             <meshStandardMaterial color="#ccc" />
          </mesh>
      </group>
      
      {/* Distant Views (Static relative to camera shake) */}
      <ValleyView />

    </group>
  );
};
