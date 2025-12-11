
import React, { useRef, useState } from 'react';
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

    // REPLACE useMemo with useState
    const [chunks] = useState(() => Array.from({ length: COUNT }).map((_, i) => -i * GAP));

    const getBuilding = (i: number, side: 'L' | 'R') => {
        const height = 15 + Math.random() * 25;
        const color = ['#1e293b', '#334155', '#475569'][i % 3];
        const x = side === 'L' ? -12 : 12; 
        return <ModernBuilding height={height} color={color} position={[x, 0, 0]} />;
    }

    return (
        <group ref={groupRef}>
            {chunks.map((z, i) => (
                <group key={i} position={[0, 0, z]}>
                    {getBuilding(i, 'L')}
                    {getBuilding(i + 1, 'R')}
                    {i % 3 === 0 && (
                        <Billboard position={[-8, 4, 0]} rotation={[0, Math.PI / 4, 0]} />
                    )}
                    {Math.random() > 0.3 && (
                        <LowPolyHuman 
                            position={[Math.random() > 0.5 ? 5.5 : -5.5, 0.3, Math.random() * 5]} 
                            rotation={[0, Math.random() * Math.PI, 0]} 
                            isWalking={true}
                        />
                    )}
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
  return (
    <group>
      <Road variant="RIVER_ROAD" />
      <ScrollingCityBlocks playerLane={playerLane} />
      <StageMarker />
      <PoliceMarker />
    </group>
  );
};
