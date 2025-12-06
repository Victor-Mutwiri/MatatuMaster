
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { VehicleType } from '../../types';
import { X } from 'lucide-react';
import * as THREE from 'three';
import {
  PlayerBoda,
  PlayerTuktuk,
  PlayerPersonalCar,
  Matatu14Seater,
  Matatu32Seater,
  Matatu52Seater
} from './vehicles/VehicleModels';

interface VehicleShowroomModalProps {
  vehicleType: VehicleType;
  onClose: () => void;
}

const RotatingPlatform = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.5; // Slow spin
    }
  });
  return <group ref={ref}>{children}</group>;
};

export const VehicleShowroomModal: React.FC<VehicleShowroomModalProps> = ({ vehicleType, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-fade-in">
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={onClose}
          className="bg-slate-800 text-white p-3 rounded-full hover:bg-slate-700 hover:scale-110 transition-all shadow-xl border border-slate-600"
        >
          <X size={24} />
        </button>
      </div>

      <div className="absolute top-6 left-6 z-50 pointer-events-none">
         <h2 className="font-display text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500 uppercase tracking-tighter">
            Showroom
         </h2>
         <p className="text-matatu-yellow font-mono text-sm uppercase tracking-widest mt-1">
            {vehicleType.replace('-', ' ')}
         </p>
      </div>

      <div className="w-full h-full cursor-move">
        <Canvas shadows camera={{ position: [4, 2, 6], fov: 40 }}>
          <color attach="background" args={['#050505']} />
          <fog attach="fog" args={['#050505', 5, 20]} />

          {/* Premium Lighting Setup */}
          <ambientLight intensity={0.5} />
          <spotLight
            position={[10, 10, 5]}
            angle={0.15}
            penumbra={1}
            intensity={2}
            castShadow
            color="#ffffff"
          />
          <pointLight position={[-10, 5, -10]} intensity={1} color="#3b82f6" />
          <pointLight position={[0, -5, 0]} intensity={0.5} color="#fbbf24" />

          {/* Floor Reflection */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
            <planeGeometry args={[50, 50]} />
            <meshStandardMaterial
              color="#050505"
              roughness={0.1}
              metalness={0.8}
            />
          </mesh>

          <RotatingPlatform>
            <group position={[0, -0.5, 0]}>
                {vehicleType === 'boda' && <PlayerBoda passengerCount={0} />}
                {vehicleType === 'tuktuk' && <PlayerTuktuk />}
                {vehicleType === 'personal-car' && <PlayerPersonalCar />}
                {vehicleType === '14-seater' && <Matatu14Seater />}
                {vehicleType === '32-seater' && <Matatu32Seater />}
                {vehicleType === '52-seater' && <Matatu52Seater />}
            </group>
          </RotatingPlatform>

        </Canvas>
      </div>

      <div className="absolute bottom-10 inset-x-0 text-center pointer-events-none">
          <p className="text-slate-500 text-xs uppercase tracking-[0.2em] animate-pulse">
             360° View Mode
          </p>
      </div>
    </div>
  );
};
