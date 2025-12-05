
import React from 'react';
import { Wheel, Rider } from './VehicleParts';

export const PlayerBoda = ({ passengerCount }: { passengerCount: number }) => {
  return (
    <group position={[0, 0.35, 0]}>
       <Wheel position={[0, 0, 0.7]} radius={0.35} />
       <Wheel position={[0, 0, -0.7]} radius={0.35} />
       
       <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[0.15, 0.3, 1.4]} />
          <meshStandardMaterial color="#ef4444" metalness={0.6} roughness={0.2} />
       </mesh>
       <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[0.25, 0.25, 0.3]} />
          <meshStandardMaterial color="#333" />
       </mesh>
       <mesh position={[0, 0.85, 0.5]} rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[0.02, 0.02, 0.8]} />
          <meshStandardMaterial color="#111" />
       </mesh>

       <group position={[0, 0.1, 0.3]}>
          <Rider />
       </group>
       {passengerCount > 0 && (
         <group position={[0, 0.2, -0.3]}>
            <Rider isPassenger={true} />
         </group>
       )}
    </group>
  );
};
