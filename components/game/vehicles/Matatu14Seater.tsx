
import React from 'react';
import { Wheel, Bumper, LicensePlate, SideMirror } from './VehicleParts';

export const Matatu14Seater = () => {
  const bodyColor = "#1e40af"; // Cobalt Blue
  const graffitiColor = "#f472b6"; // Neon Pink
  const yellowLine = "#fbbf24";
  const glassColor = "#111827"; // Dark Tint
  const goldAccent = "#d97706";

  return (
    <group position={[0, 0.4, 0]}>
       {/* --- CHASSIS --- */}
       {/* Main Lower Body */}
       <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.7, 0.8, 4.2]} />
          <meshStandardMaterial color={bodyColor} roughness={0.4} />
       </mesh>
       
       {/* Upper Cabin / Roof */}
       <mesh position={[0, 1.0, 0.2]} castShadow receiveShadow>
          <boxGeometry args={[1.6, 0.7, 3.6]} />
          <meshStandardMaterial color={bodyColor} roughness={0.4} />
       </mesh>

       {/* --- NGANYA STYLING --- */}
       {/* The Mandatory Yellow Line (Continuous) */}
       <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[1.72, 0.12, 4.22]} />
          <meshStandardMaterial color={yellowLine} emissive={yellowLine} emissiveIntensity={0.3} />
       </mesh>

       {/* Graffiti / Art Strips (Pink Flair) */}
       <mesh position={[0.86, 0.3, 0]}>
          <boxGeometry args={[0.05, 0.3, 3.0]} />
          <meshStandardMaterial color={graffitiColor} />
       </mesh>
       <mesh position={[-0.86, 0.3, 0]}>
          <boxGeometry args={[0.05, 0.3, 3.0]} />
          <meshStandardMaterial color={graffitiColor} />
       </mesh>

       {/* Gold Front Grill Frame */}
       <mesh position={[0, 0.4, 2.11]}>
          <boxGeometry args={[1.2, 0.4, 0.05]} />
          <meshStandardMaterial color={goldAccent} metalness={0.8} roughness={0.2} />
       </mesh>

       {/* --- BODY KIT --- */}
       {/* Front Bullbar */}
       <mesh position={[0, 0.1, 2.3]} rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[0.05, 0.05, 1.4]} />
          <meshStandardMaterial color="#333" />
       </mesh>
       <mesh position={[0.5, 0.1, 2.2]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.3]} />
          <meshStandardMaterial color="#333" />
       </mesh>
       <mesh position={[-0.5, 0.1, 2.2]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.3]} />
          <meshStandardMaterial color="#333" />
       </mesh>

       {/* Roof Spoiler (Angled) */}
       <group position={[0, 1.4, -1.6]}>
          <mesh rotation={[0.2, 0, 0]}>
             <boxGeometry args={[1.5, 0.1, 0.6]} />
             <meshStandardMaterial color={graffitiColor} />
          </mesh>
          {/* Spoiler Supports */}
          <mesh position={[0.6, -0.2, 0.1]}>
             <boxGeometry args={[0.1, 0.3, 0.3]} />
             <meshStandardMaterial color="#111" />
          </mesh>
          <mesh position={[-0.6, -0.2, 0.1]}>
             <boxGeometry args={[0.1, 0.3, 0.3]} />
             <meshStandardMaterial color="#111" />
          </mesh>
       </group>

       {/* Side Skirts */}
       <mesh position={[0.8, -0.1, 0]}>
          <boxGeometry args={[0.1, 0.2, 2.5]} />
          <meshStandardMaterial color={bodyColor} />
       </mesh>
       <mesh position={[-0.8, -0.1, 0]}>
          <boxGeometry args={[0.1, 0.2, 2.5]} />
          <meshStandardMaterial color={bodyColor} />
       </mesh>

       {/* --- WINDOWS --- */}
       {/* Front Windshield */}
       <mesh position={[0, 1.0, 2.01]} rotation={[0.15, 0, 0]}>
          <boxGeometry args={[1.5, 0.65, 0.05]} />
          <meshStandardMaterial color={glassColor} metalness={0.9} roughness={0.1} />
       </mesh>
       
       {/* Side Windows (Continuous Strip) */}
       <mesh position={[0.81, 1.05, 0.2]}>
          <boxGeometry args={[0.05, 0.5, 3.4]} />
          <meshStandardMaterial color={glassColor} metalness={0.9} roughness={0.1} />
       </mesh>
       <mesh position={[-0.81, 1.05, 0.2]}>
          <boxGeometry args={[0.05, 0.5, 3.4]} />
          <meshStandardMaterial color={glassColor} metalness={0.9} roughness={0.1} />
       </mesh>

       {/* Rear Window with Subwoofers visible inside */}
       <mesh position={[0, 1.05, -1.61]}>
          <boxGeometry args={[1.4, 0.5, 0.05]} />
          <meshStandardMaterial color={glassColor} metalness={0.9} roughness={0.1} />
       </mesh>
       {/* Subwoofer shapes inside */}
       <mesh position={[0.4, 0.9, -1.55]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.05]} />
          <meshStandardMaterial color="#222" />
       </mesh>
       <mesh position={[-0.4, 0.9, -1.55]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.05]} />
          <meshStandardMaterial color="#222" />
       </mesh>

       {/* --- DETAILS --- */}
       <Bumper position={[0, -0.05, 2.1]} width={1.75} />
       <Bumper position={[0, 0.05, -2.1]} width={1.75} />
       
       <LicensePlate position={[0, -0.05, 2.21]} />
       <LicensePlate position={[0, 0.05, -2.21]} isRear />

       <group position={[0.9, 0.8, 1.5]}>
          <SideMirror side="right" />
       </group>
       <group position={[-0.9, 0.8, 1.5]}>
          <SideMirror side="left" />
       </group>

       {/* --- WHEELS --- */}
       <Wheel position={[0.75, -0.1, 1.3]} radius={0.35} />
       <Wheel position={[-0.75, -0.1, 1.3]} radius={0.35} />
       <Wheel position={[0.75, -0.1, -1.3]} radius={0.35} />
       <Wheel position={[-0.75, -0.1, -1.3]} radius={0.35} />

       {/* --- LIGHTS --- */}
       {/* Headlights */}
       <mesh position={[0.6, 0.4, 2.12]}>
         <boxGeometry args={[0.3, 0.15, 0.05]} />
         <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} />
       </mesh>
       <mesh position={[-0.6, 0.4, 2.12]}>
         <boxGeometry args={[0.3, 0.15, 0.05]} />
         <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} />
       </mesh>
       
       {/* Fog Lights (Neon) */}
       <mesh position={[0.5, 0.05, 2.12]}>
         <circleGeometry args={[0.08]} />
         <meshStandardMaterial color={graffitiColor} emissive={graffitiColor} emissiveIntensity={2} />
       </mesh>
       <mesh position={[-0.5, 0.05, 2.12]}>
         <circleGeometry args={[0.08]} />
         <meshStandardMaterial color={graffitiColor} emissive={graffitiColor} emissiveIntensity={2} />
       </mesh>

       {/* Brake Lights */}
       <mesh position={[0.7, 0.5, -2.11]}>
         <boxGeometry args={[0.15, 0.3, 0.05]} />
         <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1} />
       </mesh>
       <mesh position={[-0.7, 0.5, -2.11]}>
         <boxGeometry args={[0.15, 0.3, 0.05]} />
         <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1} />
       </mesh>
    </group>
  );
};
