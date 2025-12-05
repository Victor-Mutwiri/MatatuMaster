
import React from 'react';
import { Wheel, LicensePlate, Rider } from './VehicleParts';

export const PlayerTuktuk = () => {
  const rusticYellow = "#eab308";
  const blackCanvas = "#1a1a1a";
  const rustyMetal = "#4b5563";

  return (
    <group position={[0, 0.35, 0]}>
       {/* 3 Wheel Layout: 1 Front (Forward is -Z), 2 Rear (+Z) */}
       <Wheel position={[0, 0, -1.3]} radius={0.3} /> 
       <Wheel position={[-0.65, 0, 0.9]} radius={0.3} /> 
       <Wheel position={[0.65, 0, 0.9]} radius={0.3} />

       {/* Chassis / Frame */}
       <mesh position={[0, 0.2, 0]}>
         <boxGeometry args={[1.3, 0.1, 2.8]} />
         <meshStandardMaterial color="#1f2937" />
       </mesh>

       {/* Front Cabin Body (Rustic Yellow) */}
       <mesh position={[0, 0.7, -0.8]}>
          <boxGeometry args={[0.9, 1.0, 1.0]} />
          <meshStandardMaterial color={rusticYellow} roughness={0.6} />
       </mesh>
       
       {/* Windshield Frame */}
       <mesh position={[0, 1.1, -1.25]} rotation={[0.1, 0, 0]}>
          <boxGeometry args={[0.85, 0.6, 0.05]} />
          <meshStandardMaterial color={blackCanvas} />
       </mesh>
       <mesh position={[0, 1.1, -1.25]} rotation={[0.1, 0, 0]}>
          <planeGeometry args={[0.75, 0.5]} />
          <meshStandardMaterial color="#88ccff" transparent opacity={0.4} metalness={0.9} />
       </mesh>

       {/* Passenger Cabin Body (Lower Half) */}
       <mesh position={[0, 0.6, 0.5]}>
          <boxGeometry args={[1.4, 0.7, 1.6]} />
          <meshStandardMaterial color={rusticYellow} roughness={0.6} />
       </mesh>

       {/* Black Canvas Roof Top */}
       <mesh position={[0, 1.65, 0.1]}>
          <boxGeometry args={[1.3, 0.1, 2.6]} />
          <meshStandardMaterial color={blackCanvas} roughness={1.0} />
       </mesh>

       {/* Roof Pillars */}
       <mesh position={[-0.6, 1.1, 1.2]}> <cylinderGeometry args={[0.03, 0.03, 1.1]} /> <meshStandardMaterial color={rustyMetal} /> </mesh>
       <mesh position={[0.6, 1.1, 1.2]}> <cylinderGeometry args={[0.03, 0.03, 1.1]} /> <meshStandardMaterial color={rustyMetal} /> </mesh>
       <mesh position={[-0.4, 1.1, -1.2]}> <cylinderGeometry args={[0.03, 0.03, 1.1]} /> <meshStandardMaterial color={rustyMetal} /> </mesh>
       <mesh position={[0.4, 1.1, -1.2]}> <cylinderGeometry args={[0.03, 0.03, 1.1]} /> <meshStandardMaterial color={rustyMetal} /> </mesh>

       {/* Rear Canvas Flap & Tiny Window */}
       <mesh position={[0, 1.2, 1.25]}>
          <boxGeometry args={[1.3, 0.9, 0.05]} />
          <meshStandardMaterial color={blackCanvas} roughness={1.0} />
       </mesh>
       <mesh position={[0, 1.4, 1.26]}>
          <planeGeometry args={[0.5, 0.3]} />
          <meshStandardMaterial color="#111" transparent opacity={0.7} />
       </mesh>

       {/* Tail Lights */}
       <mesh position={[-0.55, 0.5, 1.3]}>
          <boxGeometry args={[0.15, 0.25, 0.1]} />
          <meshStandardMaterial color="#991b1b" emissive="#ef4444" emissiveIntensity={1} />
       </mesh>
       <mesh position={[0.55, 0.5, 1.3]}>
          <boxGeometry args={[0.15, 0.25, 0.1]} />
          <meshStandardMaterial color="#991b1b" emissive="#ef4444" emissiveIntensity={1} />
       </mesh>

       {/* Number Plate (Rear) */}
       <LicensePlate position={[0, 0.4, 1.31]} isRear />

       {/* Headlight */}
       <mesh position={[0, 0.6, -1.31]} rotation={[Math.PI/2, 0, 0]}>
         <cylinderGeometry args={[0.15, 0.1, 0.1, 16]} />
         <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} />
       </mesh>

       {/* Driver (Hidden mostly) */}
       <group position={[0, 0.4, -0.6]}>
          <Rider />
       </group>
       
       {/* Mudguard Front */}
       <mesh position={[0, 0.45, -1.3]} rotation={[0.5, 0, 0]}>
         <boxGeometry args={[0.35, 0.05, 0.5]} />
         <meshStandardMaterial color={rusticYellow} />
       </mesh>

    </group>
  );
};
