
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../../store/gameStore';
import * as THREE from 'three';
import { 
  Road, Scenery, StageMarker, PoliceMarker, 
  KICC, TimesTower, Basilica, ModernBuilding 
} from '../environment/WorldAssets';

const NairobiCityLayout = () => {
  const { totalRouteDistance, distanceTraveled } = useGameStore();
  const groupRef = useRef<THREE.Group>(null);
  const distRemaining = totalRouteDistance - distanceTraveled;
  const isVisible = distRemaining < 1500;
  
  useFrame(() => {
    if (groupRef.current) {
       groupRef.current.position.z = -(totalRouteDistance - useGameStore.getState().distanceTraveled);
    }
  });

  if (!isVisible) return null;

  return (
    <group ref={groupRef}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[100, 300]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-10, 0.03, 0]}>
        <planeGeometry args={[10, 300]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
       <mesh rotation={[-Math.PI / 2, 0, 0]} position={[10, 0.03, 0]}>
        <planeGeometry args={[10, 300]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      <group position={[0, 6, -50]}>
        <mesh>
          <boxGeometry args={[14, 1.5, 0.5]} />
          <meshStandardMaterial color="#10b981" />
        </mesh>
        <mesh position={[0, 0, 0.26]}>
           <planeGeometry args={[12, 1]} />
           <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[-6.5, -3, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 6]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        <mesh position={[6.5, -3, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 6]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      </group>
      <KICC position={[20, 0, 20]} />
      <TimesTower position={[30, 0, -20]} />
      <Basilica position={[-25, 0, 10]} />
      <ModernBuilding height={25} color="#475569" position={[-18, 0, -40]} />
      <ModernBuilding height={15} color="#64748b" position={[-18, 0, -70]} />
      <ModernBuilding height={35} color="#1e293b" position={[-25, 0, -100]} />
      <ModernBuilding height={18} color="#334155" position={[-18, 0, 50]} />
      <ModernBuilding height={28} color="#475569" position={[18, 0, -60]} />
      <ModernBuilding height={18} color="#64748b" position={[18, 0, -90]} />
      <ModernBuilding height={30} color="#0f172a" position={[25, 0, -120]} />
      <ModernBuilding height={22} color="#334155" position={[18, 0, 60]} />
      {Array.from({ length: 15 }).map((_, i) => (
        <group key={i} position={i % 2 === 0 ? [5, 0, -i * 20 + 40] : [-5, 0, -i * 20 + 40]}>
           <mesh position={[0, 3, 0]}>
             <cylinderGeometry args={[0.08, 0.1, 6]} />
             <meshStandardMaterial color="#1e293b" />
           </mesh>
           <mesh position={[i % 2 === 0 ? -1 : 1, 6, 0]}>
             <boxGeometry args={[2, 0.1, 0.2]} />
             <meshStandardMaterial color="#1e293b" />
           </mesh>
           <mesh position={[i % 2 === 0 ? -1.8 : 1.8, 5.9, 0]}>
              <boxGeometry args={[0.4, 0.1, 0.2]} />
              <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={2} />
           </mesh>
           <pointLight position={[i % 2 === 0 ? -1.8 : 1.8, 5, 0]} intensity={0.5} color="#fbbf24" distance={15} decay={2} />
        </group>
      ))}
    </group>
  );
};

export const NairobiMap = () => {
  return (
    <group>
      <Scenery />
      <NairobiCityLayout />
      <Road />
      <StageMarker />
      <PoliceMarker />
    </group>
  );
};
