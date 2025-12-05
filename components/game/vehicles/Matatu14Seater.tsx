
import React from 'react';
import { Wheel, Bumper, LicensePlate, SideMirror, GraffitiStrip } from './VehicleParts';

export const Matatu14Seater = () => {
  return (
    <group position={[0, 0.35, 0]}>
       <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.7, 0.6, 4]} />
          <meshStandardMaterial color="#ffffff" />
       </mesh>
       <mesh position={[0, 1.0, 0.2]} castShadow receiveShadow>
          <boxGeometry args={[1.6, 0.7, 3.2]} />
          <meshStandardMaterial color="#ffffff" />
       </mesh>
       <GraffitiStrip position={[0.86, 0.5, 0]} width={0.4} length={3.5} color="#00F3FF" />
       <GraffitiStrip position={[-0.86, 0.5, 0]} width={0.4} length={3.5} color="#00F3FF" />
       <Bumper position={[0, 0.2, 2.0]} width={1.75} />
       <Bumper position={[0, 0.2, -2.0]} width={1.75} />
       <LicensePlate position={[0, 0.2, 2.11]} />
       <LicensePlate position={[0, 0.2, -2.11]} isRear />
       <group position={[0.9, 0.8, 1.5]}>
          <SideMirror side="right" />
       </group>
       <group position={[-0.9, 0.8, 1.5]}>
          <SideMirror side="left" />
       </group>
       <mesh position={[0, 0.75, 0]}>
          <boxGeometry args={[1.62, 0.1, 4.02]} />
          <meshStandardMaterial color="#FFD700" />
       </mesh>
       <mesh position={[0, 1.05, 0.2]}>
          <boxGeometry args={[1.65, 0.5, 3]} />
          <meshStandardMaterial color="#1e293b" roughness={0.1} />
       </mesh>
       <Wheel position={[0.75, 0, 1.2]} />
       <Wheel position={[-0.75, 0, 1.2]} />
       <Wheel position={[0.75, 0, -1.2]} />
       <Wheel position={[-0.75, 0, -1.2]} />
       <mesh position={[0.6, 0.5, 2.0]}>
         <boxGeometry args={[0.3, 0.15, 0.1]} />
         <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} />
       </mesh>
       <mesh position={[-0.6, 0.5, 2.0]}>
         <boxGeometry args={[0.3, 0.15, 0.1]} />
         <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} />
       </mesh>
       <mesh position={[0.6, 0.5, -2.0]}>
         <boxGeometry args={[0.2, 0.3, 0.1]} />
         <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1} />
       </mesh>
       <mesh position={[-0.6, 0.5, -2.0]}>
         <boxGeometry args={[0.2, 0.3, 0.1]} />
         <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1} />
       </mesh>
    </group>
  );
};
