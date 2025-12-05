
import React from 'react';
import { Wheel, Bumper, LicensePlate, GraffitiStrip } from './VehicleParts';

export const Matatu52Seater = () => {
  return (
    <group position={[0, 0.55, 0]}>
       <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.1, 2.4, 8]} />
          <meshStandardMaterial color="#ffffff" />
       </mesh>
       <GraffitiStrip position={[1.06, 0.8, 0]} width={0.8} length={7.5} color="#FF00FF" />
       <GraffitiStrip position={[-1.06, 0.8, 0]} width={0.8} length={7.5} color="#FF00FF" />
       <Bumper position={[0, 0.3, 4.0]} width={2.2} />
       <Bumper position={[0, 0.3, -4.0]} width={2.2} />
       <LicensePlate position={[0, 0.3, 4.11]} />
       <LicensePlate position={[0, 0.3, -4.11]} isRear />
       <Wheel position={[0.9, 0, 2.5]} radius={0.45} />
       <Wheel position={[-0.9, 0, 2.5]} radius={0.45} />
       <Wheel position={[0.9, 0, -2]} radius={0.45} />
       <Wheel position={[-0.9, 0, -2]} radius={0.45} />
       <Wheel position={[0.9, 0, -3.2]} radius={0.45} />
       <Wheel position={[-0.9, 0, -3.2]} radius={0.45} />
       <mesh position={[0.8, 0.6, 4.01]}>
         <boxGeometry args={[0.3, 0.25, 0.1]} />
         <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} />
       </mesh>
       <mesh position={[-0.8, 0.6, 4.01]}>
         <boxGeometry args={[0.3, 0.25, 0.1]} />
         <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} />
       </mesh>
       <mesh position={[0, 1.8, -4.01]}>
         <boxGeometry args={[1.5, 0.2, 0.1]} />
         <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1} />
       </mesh>
    </group>
  );
};
