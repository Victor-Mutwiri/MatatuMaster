
import React from 'react';
import { Wheel, VehicleHeadlight } from './VehicleParts';

export const PlayerPersonalCar = () => {
  return (
     <group position={[0, 0.3, 0]}>
       <mesh position={[0, 0.35, 0]}>
          <boxGeometry args={[1.6, 0.6, 3.4]} />
          <meshStandardMaterial color="#3b82f6" metalness={0.6} roughness={0.2} />
       </mesh>
       <mesh position={[0, 0.8, -0.2]}>
          <boxGeometry args={[1.4, 0.5, 2.0]} />
          <meshStandardMaterial color="#1e3a8a" metalness={0.7} roughness={0.2} />
       </mesh>
       <Wheel position={[0.7, 0, 1.0]} radius={0.32} />
       <Wheel position={[-0.7, 0, 1.0]} radius={0.32} />
       <Wheel position={[0.7, 0, -1.0]} radius={0.32} />
       <Wheel position={[-0.7, 0, -1.0]} radius={0.32} />
       
       {/* Headlights */}
       <VehicleHeadlight position={[0.5, 0.4, 1.71]} />
       <VehicleHeadlight position={[-0.5, 0.4, 1.71]} />

       {/* Tail Lights */}
       <mesh position={[0.5, 0.4, -1.7]}>
         <boxGeometry args={[0.3, 0.15, 0.1]} />
         <meshStandardMaterial color="red" emissive="red" emissiveIntensity={1} />
       </mesh>
       <mesh position={[-0.5, 0.4, -1.7]}>
         <boxGeometry args={[0.3, 0.15, 0.1]} />
         <meshStandardMaterial color="red" emissive="red" emissiveIntensity={1} />
       </mesh>
    </group>
  );
};
