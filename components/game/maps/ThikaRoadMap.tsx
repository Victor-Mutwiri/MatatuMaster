
import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../../store/gameStore';
import * as THREE from 'three';
import { Road, StageMarker, PoliceMarker, HighwayBarrier, ModernBuilding, HighwayLightPole } from '../environment/WorldAssets';

const OppositeTrafficVisual = () => {
    const groupRef = useRef<THREE.Group>(null);
    const speed = useGameStore.getState().currentSpeed;
    
    useFrame((state, delta) => {
        if (groupRef.current) {
            const moveSpeed = speed + 80;
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

const HighwayDecorations = () => {
    const groupRef = useRef<THREE.Group>(null);
    const { currentSpeed, nextStageDistance, distanceTraveled } = useGameStore();
    
    const COUNT = 16;
    const GAP = 20;
    
    // REPLACE useMemo with useState
    const [chunks] = useState(() => Array.from({ length: COUNT }).map((_, i) => -i * GAP));

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        
        const speed = useGameStore.getState().currentSpeed;
        const stageZ = -(nextStageDistance - distanceTraveled);

        groupRef.current.children.forEach((child) => {
            if (speed > 0) {
                child.position.z += speed * delta;
                if (child.position.z > 20) {
                    child.position.z -= COUNT * GAP;
                }
            }

            const leftSideGroup = child.children[1];
            if (leftSideGroup) {
                const distToStage = Math.abs(child.position.z - stageZ);
                leftSideGroup.visible = distToStage > 25;
            }
        });
    });

    return (
        <group ref={groupRef}>
            {chunks.map((z, i) => (
                <group key={i} position={[0, 0, z]}>
                    <group position={[8, 0, 0]}>
                        <HighwayBarrier />
                        <HighwayLightPole isLeft={false} />
                    </group>
                    <group position={[-8, 0, 0]}>
                        <HighwayBarrier />
                        <HighwayLightPole isLeft={true} />
                    </group>
                </group>
            ))}
        </group>
    );
};

export const ThikaRoadMap = () => {
    const { totalRouteDistance, distanceTraveled } = useGameStore();
    const groupRef = useRef<THREE.Group>(null);
    const distRemaining = totalRouteDistance - distanceTraveled;
    const isVisible = distRemaining < 2000;

    useFrame(() => {
        if (groupRef.current) {
           groupRef.current.position.z = -(totalRouteDistance - useGameStore.getState().distanceTraveled) * 0.1;
        }
    });

  return (
    <group>
      <Road variant="HIGHWAY" />
      <HighwayDecorations />
      <group position={[22, -0.05, 0]}>
           <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[12, 300]} />
                <meshStandardMaterial color="#1a1a1a" />
           </mesh>
           <OppositeTrafficVisual />
      </group>
      {isVisible && (
        <group ref={groupRef} position={[0, 0, -500]}>
            <ModernBuilding height={60} color="#0f172a" position={[-40, 0, 0]} />
            <ModernBuilding height={80} color="#1e293b" position={[-20, 0, -20]} />
            <ModernBuilding height={50} color="#334155" position={[30, 0, 10]} />
            <ModernBuilding height={70} color="#0f172a" position={[50, 0, -30]} />
        </group>
      )}
      <StageMarker />
      <PoliceMarker />
    </group>
  );
};
