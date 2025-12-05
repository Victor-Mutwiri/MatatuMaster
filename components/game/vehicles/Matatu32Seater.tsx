
import React from 'react';
import { Wheel, Bumper, LicensePlate } from './VehicleParts';

export const Matatu32Seater = () => {
  const bodyColor = "#7e22ce"; // Electric Purple
  const graffitiColor = "#06b6d4"; // Cyan
  const glassColor = "#111827"; // Dark Tint
  const yellowLine = "#fbbf24";

  return (
    <group position={[0, 0.5, 0]}>
       {/* --- CHASSIS --- */}
       {/* Lower Body */}
       <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.9, 0.9, 5.8]} />
          <meshStandardMaterial color={bodyColor} roughness={0.5} />
       </mesh>
       
       {/* Upper Cabin */}
       <mesh position={[0, 1.25, -0.2]} castShadow receiveShadow>
          <boxGeometry args={[1.85, 0.9, 5.0]} />
          <meshStandardMaterial color={bodyColor} roughness={0.5} />
       </mesh>

       {/* --- NGANYA ART & STYLING --- */}
       {/* The Mandatory Yellow Line (Continuous Strip) */}
       <mesh position={[0, 0.7, 0]}>
          <boxGeometry args={[1.92, 0.15, 5.82]} />
          <meshStandardMaterial color={yellowLine} emissive={yellowLine} emissiveIntensity={0.2} />
       </mesh>

       {/* Graffiti / Decals Side Panels */}
       <mesh position={[0.96, 0.3, 0]}>
          <boxGeometry args={[0.05, 0.4, 4.5]} />
          <meshStandardMaterial color={graffitiColor} />
       </mesh>
       <mesh position={[-0.96, 0.3, 0]}>
          <boxGeometry args={[0.05, 0.4, 4.5]} />
          <meshStandardMaterial color={graffitiColor} />
       </mesh>

       {/* --- WINDOWS --- */}
       {/* Windshield */}
       <mesh position={[0, 1.15, 2.5]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[1.7, 0.7, 0.1]} />
          <meshStandardMaterial color={glassColor} metalness={0.9} roughness={0.1} />
       </mesh>
       
       {/* Rear Window */}
       <mesh position={[0, 1.3, -2.71]}>
          <boxGeometry args={[1.4, 0.6, 0.1]} />
          <meshStandardMaterial color={glassColor} metalness={0.9} roughness={0.1} />
       </mesh>

       {/* Side Windows (Left & Right strips) */}
       <mesh position={[0.93, 1.3, -0.2]}>
          <boxGeometry args={[0.05, 0.55, 4.8]} />
          <meshStandardMaterial color={glassColor} metalness={0.9} roughness={0.1} />
       </mesh>
       <mesh position={[-0.93, 1.3, -0.2]}>
          <boxGeometry args={[0.05, 0.55, 4.8]} />
          <meshStandardMaterial color={glassColor} metalness={0.9} roughness={0.1} />
       </mesh>

       {/* Window Pillars (Simulated by small blocks) */}
       {[0, 1.2, -1.2, 2.0].map((z, i) => (
         <group key={i}>
            <mesh position={[0.94, 1.3, z]}>
                <boxGeometry args={[0.06, 0.55, 0.1]} />
                <meshStandardMaterial color="#000" />
            </mesh>
             <mesh position={[-0.94, 1.3, z]}>
                <boxGeometry args={[0.06, 0.55, 0.1]} />
                <meshStandardMaterial color="#000" />
            </mesh>
         </group>
       ))}

       {/* --- ACCESSORIES --- */}
       {/* Roof Spoiler */}
       <group position={[0, 1.7, -2.5]}>
          <mesh rotation={[0.2, 0, 0]}>
             <boxGeometry args={[1.8, 0.1, 0.6]} />
             <meshStandardMaterial color={graffitiColor} />
          </mesh>
          <mesh position={[0.8, -0.2, 0]}>
             <boxGeometry args={[0.1, 0.4, 0.4]} />
             <meshStandardMaterial color={graffitiColor} />
          </mesh>
           <mesh position={[-0.8, -0.2, 0]}>
             <boxGeometry args={[0.1, 0.4, 0.4]} />
             <meshStandardMaterial color={graffitiColor} />
          </mesh>
       </group>

       <Bumper position={[0, 0.15, 2.95]} width={2.0} />
       <Bumper position={[0, 0.2, -2.95]} width={2.0} />
       
       <LicensePlate position={[0, 0.15, 3.06]} />
       <LicensePlate position={[0, 0.2, -3.06]} isRear />

       {/* --- WHEELS --- */}
       <Wheel position={[0.85, 0, 1.8]} radius={0.4} />
       <Wheel position={[-0.85, 0, 1.8]} radius={0.4} />
       <Wheel position={[0.85, 0, -1.8]} radius={0.4} />
       <Wheel position={[-0.85, 0, -1.8]} radius={0.4} />

       {/* Lights */}
       <mesh position={[0.7, 0.4, 2.91]}>
         <boxGeometry args={[0.3, 0.2, 0.1]} />
         <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} />
       </mesh>
       <mesh position={[-0.7, 0.4, 2.91]}>
         <boxGeometry args={[0.3, 0.2, 0.1]} />
         <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} />
       </mesh>
       <mesh position={[0, 1.6, 2.3]}>
         <boxGeometry args={[0.8, 0.1, 0.1]} />
         <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={2} />
       </mesh>

       {/* Brake Lights */}
       <mesh position={[0.7, 0.5, -2.91]}>
         <boxGeometry args={[0.25, 0.4, 0.1]} />
         <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1} />
       </mesh>
       <mesh position={[-0.7, 0.5, -2.91]}>
         <boxGeometry args={[0.25, 0.4, 0.1]} />
         <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1} />
       </mesh>
    </group>
  );
};
