
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../../store/gameStore';
import * as THREE from 'three';
import { 
  PlayerBoda, PlayerTuktuk, PlayerPersonalCar, 
  Matatu14Seater, Matatu32Seater, Matatu52Seater 
} from './VehicleModels';

export const GhostCar = () => {
  const groupRef = useRef<THREE.Group>(null);
  const { opponentState, opponentVehicleType, distanceTraveled } = useGameStore();

  // Create holographic material once
  const ghostMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#00F3FF', // Cyan
      emissive: '#00F3FF',
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.6,
      wireframe: false, // Solid ghost looks better for "hologram" vibe
      flatShading: false,
    });
  }, []);

  // Apply material override to all children
  useFrame(() => {
    if (groupRef.current) {
        groupRef.current.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                // We cast to any to bypass readonly 'material' on Mesh type definition quirks in some envs
                (child as any).material = ghostMaterial;
            }
        });
    }
  });

  useFrame((state, delta) => {
    if (!groupRef.current || !opponentState) return;

    // --- Interpolation Logic ---
    
    // 1. Calculate Relative Z Position
    // The opponent's Z relative to the world origin = -(OpponentDist - MyDist)
    // If Opponent is at 100m and I am at 90m, Opponent is at z = -10 (10m ahead)
    const relativeZ = -(opponentState.dist - distanceTraveled);

    // 2. Smooth Movement (Lerp)
    // We lerp from current rendered position to target position
    const lerpFactor = 10 * delta; // Adjust smoothing speed

    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, opponentState.x, lerpFactor);
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, relativeZ, lerpFactor);
    
    // 3. Rotation
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, opponentState.rotZ, lerpFactor);
    
    // 4. Crash Visuals
    if (opponentState.isCrashed) {
        groupRef.current.rotation.x += delta * 2;
        groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 10) * 0.5 + 0.5;
    } else {
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, lerpFactor);
        groupRef.current.position.y = 0;
    }
  });

  if (!opponentState) return null;

  return (
    <group ref={groupRef}>
       <group rotation={[0, Math.PI, 0]}>
         {opponentVehicleType === 'boda' && <PlayerBoda passengerCount={0} />}
         {opponentVehicleType === 'tuktuk' && <PlayerTuktuk />}
         {opponentVehicleType === 'personal-car' && <PlayerPersonalCar />}
         {opponentVehicleType === '14-seater' && <Matatu14Seater />}
         {opponentVehicleType === '32-seater' && <Matatu32Seater />}
         {opponentVehicleType === '52-seater' && <Matatu52Seater />}
         {/* Fallback default */}
         {!opponentVehicleType && <Matatu14Seater />}
       </group>
       
       {/* Name Tag (Optional billboard above car) */}
       <mesh position={[0, 3, 0]}>
           <planeGeometry args={[1, 0.2]} />
           <meshBasicMaterial color="#00F3FF" />
       </mesh>
    </group>
  );
};
