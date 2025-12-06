
import React from 'react';
import { Wheel, Bumper, LicensePlate, VehicleHeadlight } from './VehicleParts';

export const Matatu52Seater = () => {
  const bodyColor = "#b91c1c"; // Hot Rod Red
  const secondaryColor = "#111"; // Black accents
  const yellowLine = "#fbbf24";
  const glassColor = "#0f172a"; // Very Dark Blue Tint

  return (
    <group position={[0, 0.6, 0]}>
       {/* --- CHASSIS --- */}
       {/* Main Body Block */}
       <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.1, 2.0, 8.5]} />
          <meshStandardMaterial color={bodyColor} />
       </mesh>
       
       {/* Roof Cap (Aerodynamic front) */}
       <mesh position={[0, 1.9, 0.5]}>
          <boxGeometry args={[2.1, 0.2, 7.5]} />
          <meshStandardMaterial color={bodyColor} />
       </mesh>
       <mesh position={[0, 1.9, 4.25]} rotation={[0.1, 0, 0]}>
           <boxGeometry args={[2.1, 0.2, 1.0]} />
           <meshStandardMaterial color={bodyColor} />
       </mesh>

       {/* --- NGANYA ART & STYLING --- */}
       {/* The Yellow Line (Thick) */}
       <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[2.12, 0.25, 8.52]} />
          <meshStandardMaterial color={yellowLine} />
       </mesh>

       {/* Black styling strip at bottom */}
       <mesh position={[0, -0.1, 0]}>
          <boxGeometry args={[2.11, 0.4, 8.51]} />
          <meshStandardMaterial color={secondaryColor} />
       </mesh>

       {/* Gold Flanker Art */}
       <mesh position={[1.06, 0.8, 0]}>
          <boxGeometry args={[0.05, 0.8, 6]} />
          <meshStandardMaterial color="#d97706" />
       </mesh>
       <mesh position={[-1.06, 0.8, 0]}>
          <boxGeometry args={[0.05, 0.8, 6]} />
          <meshStandardMaterial color="#d97706" />
       </mesh>

       {/* --- WINDOWS --- */}
       {/* Massive Front Windshield */}
       <mesh position={[0, 1.1, 4.26]} rotation={[0.05, 0, 0]}>
          <boxGeometry args={[2.0, 1.2, 0.1]} />
          <meshStandardMaterial color={glassColor} metalness={0.8} roughness={0.1} />
       </mesh>

       {/* Rear Window */}
       <mesh position={[0, 1.3, -4.26]}>
          <boxGeometry args={[1.8, 0.8, 0.1]} />
          <meshStandardMaterial color={glassColor} metalness={0.8} roughness={0.1} />
       </mesh>

       {/* Side Panoramic Windows */}
       <mesh position={[1.06, 1.2, 0]}>
          <boxGeometry args={[0.05, 0.9, 7.5]} />
          <meshStandardMaterial color={glassColor} metalness={0.8} roughness={0.1} />
       </mesh>
       <mesh position={[-1.06, 1.2, 0]}>
          <boxGeometry args={[0.05, 0.9, 7.5]} />
          <meshStandardMaterial color={glassColor} metalness={0.8} roughness={0.1} />
       </mesh>

       {/* Window Separators (Chrome) */}
       {[1.5, -1.5, 0, 3].map((z, i) => (
         <group key={i}>
            <mesh position={[1.07, 1.2, z]}>
                <boxGeometry args={[0.02, 0.9, 0.05]} />
                <meshStandardMaterial color="#9ca3af" metalness={1} roughness={0.2} />
            </mesh>
             <mesh position={[-1.07, 1.2, z]}>
                <boxGeometry args={[0.02, 0.9, 0.05]} />
                <meshStandardMaterial color="#9ca3af" metalness={1} roughness={0.2} />
            </mesh>
         </group>
       ))}


       {/* --- DETAILS --- */}
       {/* AC Unit on Roof */}
       <mesh position={[0, 2.1, -2]}>
          <boxGeometry args={[1.2, 0.3, 1.5]} />
          <meshStandardMaterial color="#4b5563" />
       </mesh>

       <Bumper position={[0, -0.1, 4.3]} width={2.2} />
       <Bumper position={[0, -0.1, -4.3]} width={2.2} />
       
       <LicensePlate position={[0, -0.1, 4.41]} />
       <LicensePlate position={[0, 0.4, -4.3]} isRear />

       {/* --- WHEELS --- */}
       <Wheel position={[0.95, -0.15, 2.8]} radius={0.45} />
       <Wheel position={[-0.95, -0.15, 2.8]} radius={0.45} />
       
       {/* Double Rear Axle */}
       <Wheel position={[0.95, -0.15, -2.2]} radius={0.45} />
       <Wheel position={[-0.95, -0.15, -2.2]} radius={0.45} />
       <Wheel position={[0.95, -0.15, -3.4]} radius={0.45} />
       <Wheel position={[-0.95, -0.15, -3.4]} radius={0.45} />

       {/* Headlights (Vertical Bus Style) */}
       <VehicleHeadlight position={[0.85, 0.4, 4.26]} />
       <VehicleHeadlight position={[-0.85, 0.4, 4.26]} />

       {/* Top Marker Lights */}
       <mesh position={[0.6, 1.9, 4.7]}>
         <boxGeometry args={[0.1, 0.05, 0.1]} />
         <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={3} />
       </mesh>
       <mesh position={[-0.6, 1.9, 4.7]}>
         <boxGeometry args={[0.1, 0.05, 0.1]} />
         <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={3} />
       </mesh>

       {/* Brake Lights Bar */}
       <mesh position={[0, 1.8, -4.26]}>
         <boxGeometry args={[1.5, 0.1, 0.1]} />
         <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1} />
       </mesh>
       <mesh position={[0.8, 0.5, -4.26]} rotation={[Math.PI/2, 0, 0]}>
         <cylinderGeometry args={[0.1, 0.1, 0.1]} />
         <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2} />
       </mesh>
       <mesh position={[-0.8, 0.5, -4.26]} rotation={[Math.PI/2, 0, 0]}>
         <cylinderGeometry args={[0.1, 0.1, 0.1]} />
         <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2} />
       </mesh>
    </group>
  );
};
