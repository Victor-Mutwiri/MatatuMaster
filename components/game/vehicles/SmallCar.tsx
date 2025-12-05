
import React from 'react';
import { Wheel } from './VehicleParts';

export const SmallCar = () => {
  return (
    <group position={[0, 0.3, 0]}>
       <mesh position={[0, 0.35, 0]}>
          <boxGeometry args={[1.4, 0.6, 3.2]} />
          <meshStandardMaterial color="#3b82f6" />
       </mesh>
       <mesh position={[0, 0.8, -0.2]}>
          <boxGeometry args={[1.3, 0.5, 2.0]} />
          <meshStandardMaterial color="#3b82f6" />
       </mesh>
       <mesh position={[0, 0.82, -0.2]}>
          <boxGeometry args={[1.32, 0.4, 1.8]} />
          <meshStandardMaterial color="#1e293b" roughness={0.1} />
       </mesh>
       <Wheel position={[0.6, 0, 1.0]} radius={0.3} />
       <Wheel position={[-0.6, 0, 1.0]} radius={0.3} />
       <Wheel position={[0.6, 0, -1.0]} radius={0.3} />
       <Wheel position={[-0.6, 0, -1.0]} radius={0.3} />
       <mesh position={[0, 0.4, 1.6]}>
         <boxGeometry args={[1.2, 0.1, 0.05]} />
         <meshStandardMaterial color="white" emissive="white" />
       </mesh>
       <mesh position={[0, 0.4, -1.6]}>
         <boxGeometry args={[1.2, 0.1, 0.05]} />
         <meshStandardMaterial color="red" emissive="red" />
       </mesh>
    </group>
  );
};
