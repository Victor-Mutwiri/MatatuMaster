
import React from 'react';
import { Wheel } from './VehicleParts';

export const Motorbike = () => {
  return (
    <group position={[0, 0.35, 0]}>
       <Wheel position={[0, 0, 0.6]} radius={0.35} />
       <Wheel position={[0, 0, -0.6]} radius={0.35} />
       <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[0.15, 0.3, 1.2]} />
          <meshStandardMaterial color="#ef4444" />
       </mesh>
       <mesh position={[0, 0.8, 0]}>
          <boxGeometry args={[0.4, 0.5, 0.2]} />
          <meshStandardMaterial color="#1e293b" />
       </mesh>
    </group>
  );
};
