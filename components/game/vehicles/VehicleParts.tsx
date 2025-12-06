
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../../store/gameStore';
import * as THREE from 'three';

export const Wheel = ({ position, radius = 0.35 }: { position: [number, number, number], radius?: number }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (ref.current) {
      const speed = useGameStore.getState().currentSpeed;
      ref.current.rotation.x -= speed * delta * (1 / radius);
    }
  });
  return (
    <group position={position}>
      <group ref={ref}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[radius, radius, 0.25, 16]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[0.01, 0, 0]}>
           <cylinderGeometry args={[radius * 0.6, radius * 0.6, 0.26, 8]} />
           <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
};

export const Helmet = ({ color = "#fb923c" }: { color?: string }) => {
  return (
    <group>
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.1, 0.15]} rotation={[0.5, 0, 0]}>
         <boxGeometry args={[0.3, 0.15, 0.1]} />
         <meshStandardMaterial color="#111" transparent opacity={0.8} />
      </mesh>
    </group>
  );
};

export const Rider = ({ isPassenger = false }: { isPassenger?: boolean }) => {
  const shirtColor = isPassenger ? "#3b82f6" : "#fb923c";
  
  return (
    <group>
       <mesh position={[0, 0.6, 0]}>
         <boxGeometry args={[0.4, 0.5, 0.2]} />
         <meshStandardMaterial color={shirtColor} emissive={isPassenger ? undefined : "#fb923c"} emissiveIntensity={isPassenger ? 0 : 0.5} />
       </mesh>
       <mesh position={[0, 1.0, 0]}>
         <sphereGeometry args={[0.15]} />
         <meshStandardMaterial color="#8d5524" />
       </mesh>
       <group position={[0, 1.0, 0]}>
          <Helmet color={isPassenger ? "#fff" : "#fb923c"} />
       </group>
       <mesh position={[-0.15, 0.3, 0]} rotation={[-0.2, 0, -0.1]}>
         <cylinderGeometry args={[0.07, 0.07, 0.5]} />
         <meshStandardMaterial color="#1f2937" />
       </mesh>
       <mesh position={[0.15, 0.3, 0]} rotation={[-0.2, 0, 0.1]}>
         <cylinderGeometry args={[0.07, 0.07, 0.5]} />
         <meshStandardMaterial color="#1f2937" />
       </mesh>
    </group>
  );
};

export const SideMirror = ({ side }: { side: 'left' | 'right' }) => {
  const xOffset = side === 'left' ? -0.1 : 0.1;
  return (
    <group position={[xOffset, 0, 0]}>
      <mesh position={[0, 0, 0]}>
         <boxGeometry args={[0.3, 0.2, 0.1]} />
         <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0, 0, -0.051]}>
         <planeGeometry args={[0.25, 0.15]} />
         <meshStandardMaterial color="#ccc" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
};

export const Bumper = ({ position, width }: { position: [number, number, number], width: number }) => {
  return (
    <mesh position={position}>
      <boxGeometry args={[width, 0.2, 0.2]} />
      <meshStandardMaterial color="#1f2937" roughness={0.5} />
    </mesh>
  );
};

export const LicensePlate = ({ position, isRear = false }: { position: [number, number, number], isRear?: boolean }) => {
  return (
    <group position={position} rotation={[0, isRear ? Math.PI : 0, 0]}>
      <mesh>
        <boxGeometry args={[0.5, 0.15, 0.05]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[0.4, 0.1]} />
        <meshStandardMaterial color="#000" />
      </mesh>
    </group>
  );
};

export const GraffitiStrip = ({ position, width, length, color }: { position: [number, number, number], width: number, length: number, color: string }) => {
  return (
    <mesh position={position} rotation={[0, Math.PI / 2, 0]}>
      <planeGeometry args={[length, width]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
    </mesh>
  );
};

export const VehicleHeadlight = ({ position, isReversed = false }: { position: [number, number, number], isReversed?: boolean }) => {
  const timeOfDay = useGameStore(state => state.timeOfDay);
  const isNight = timeOfDay === 'NIGHT';

  return (
    <group position={position}>
       {/* Physical Lamp Mesh only - No projection */}
       <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.05, 16]} />
          <meshStandardMaterial 
            color="#e2e8f0" 
            emissive={isNight ? "#ffffff" : "#000000"} 
            emissiveIntensity={isNight ? 0.5 : 0} 
          />
       </mesh>
       {/* Small glow sprite to make it look 'on' but not projecting */}
       {isNight && (
          <mesh position={[0, 0, isReversed ? -0.06 : 0.06]} rotation={[isReversed ? Math.PI : 0, 0, 0]}>
             <circleGeometry args={[0.1, 8]} />
             <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
          </mesh>
       )}
    </group>
  );
};
