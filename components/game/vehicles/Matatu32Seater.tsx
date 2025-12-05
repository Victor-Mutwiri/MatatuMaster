
import React from 'react';
import { Wheel, Bumper, LicensePlate, GraffitiStrip } from './VehicleParts';

export const Matatu32Seater = () => {
  return (
    <group position={[0, 0.45, 0]}>
       <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.9, 2.0, 5.5]} />
          <meshStandardMaterial color="#ffffff" />
       </mesh>
       <GraffitiStrip position={[0.96, 0.8, 0]} width={0.6} length={5} color="#F3FF00" />
       <GraffitiStrip position={[-0.96, 0.8, 0]} width={0.6} length={5} color="#F3FF00" />
       <Bumper position={[0, 0.2, 2.75]} width={2.0} />
       <Bumper position={[0, 0.2, -2.75]} width={2.0} />
       <LicensePlate position={[0, 0.2, 2.86]} />
       <LicensePlate position={[0, 0.2, -2.86]} isRear />
       <Wheel position={[0.85, 0, 1.8]} radius={0.4} />
       <Wheel position={[-0.85, 0, 1.8]} radius={0.4} />
       <Wheel position={[0.85, 0, -1.5]} radius={0.4} />
       <Wheel position={[-0.85, 0, -1.5]} radius={0.4} />
       <mesh position={[0.7, 0.4, 2.76]}>
         <boxGeometry args={[0.3, 0.2, 0.1]} />
         <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} />
       </mesh>
       <mesh position={[-0.7, 0.4, 2.76]}>
         <boxGeometry args={[0.3, 0.2, 0.1]} />
         <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} />
       </mesh>
       <mesh position={[0, 0.5, -2.76]}>
         <boxGeometry args={[1.8, 0.2, 0.1]} />
         <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1} />
       </mesh>
    </group>
  );
};
