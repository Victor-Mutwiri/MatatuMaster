
import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { VehicleType } from '../../types';
import { useGameStore } from '../../store/gameStore';
import { playSfx } from '../../utils/audio';
import * as THREE from 'three';
import { 
  PlayerBoda, PlayerTuktuk, PlayerPersonalCar, 
  Matatu14Seater, Matatu32Seater, Matatu52Seater 
} from './vehicles/VehicleModels';

const CITY_LANE_OFFSET = 2.2;
const HIGHWAY_LANE_OFFSET = 3.5;

// Simple Particle System for Brake Smoke
const BrakeSmoke = ({ isEmitting }: { isEmitting: boolean }) => {
    const groupRef = useRef<THREE.Group>(null);
    const [particles, setParticles] = useState<{id: number, x: number, y: number, z: number, scale: number, opacity: number}[]>([]);
    
    useFrame((state, delta) => {
        // Emit
        if (isEmitting && Math.random() > 0.8) {
             setParticles(prev => [...prev, {
                 id: Math.random(),
                 x: (Math.random() - 0.5) * 0.5,
                 y: 0,
                 z: 0,
                 scale: 0.2,
                 opacity: 0.8
             }]);
        }
        
        // Update
        setParticles(prev => prev.map(p => ({
            ...p,
            y: p.y + delta * 2,
            z: p.z + delta * 5, // Move back relative to car
            scale: p.scale + delta * 2,
            opacity: p.opacity - delta * 1.5
        })).filter(p => p.opacity > 0));
    });

    return (
        <group ref={groupRef}>
             {particles.map(p => (
                 <mesh key={p.id} position={[p.x, p.y, p.z]} scale={[p.scale, p.scale, p.scale]}>
                     <sphereGeometry args={[1, 6, 6]} />
                     <meshBasicMaterial color="#555" transparent opacity={p.opacity} />
                 </mesh>
             ))}
        </group>
    )
}

export const PlayerController = ({ type, setLaneCallback }: { type: VehicleType | null, setLaneCallback: (l: number) => void }) => {
  const meshRef = useRef<THREE.Group>(null);
  const timeOfDay = useGameStore(state => state.timeOfDay);
  const gameStatus = useGameStore(state => state.gameStatus);
  const isCrashing = useGameStore(state => state.isCrashing);
  const selectedRoute = useGameStore(state => state.selectedRoute);
  const currentSpeed = useGameStore(state => state.currentSpeed);
  const currentPassengers = useGameStore(state => state.currentPassengers);
  const brakeTemp = useGameStore(state => state.brakeTemp);
  
  const [lane, setLane] = useState<number>(-1); 
  const LERP_SPEED = 8;
  const TILT_ANGLE = 0.1;

  const reportLaneChange = useGameStore(state => state.reportLaneChange);

  // Map Checks
  const isOffroad = selectedRoute?.id === 'rural-dirt';
  const isHighway = selectedRoute?.id === 'thika-highway';

  // Dynamic Lane Offset
  const currentLaneOffset = isHighway ? HIGHWAY_LANE_OFFSET : CITY_LANE_OFFSET;
  
  // Brake Fade Visuals
  const isBrakeSmoking = brakeTemp > 60;

  useEffect(() => {
    setLaneCallback(lane);
  }, [lane, setLaneCallback]);

  useEffect(() => {
    if (gameStatus === 'PLAYING' && !isCrashing && meshRef.current) {
      meshRef.current.rotation.set(0, 0, 0);
      meshRef.current.position.y = 0;
      
      // Starting position depends on map type
      if (isHighway) {
        setLane(0); // Start in middle for highway
        meshRef.current.position.x = 0;
      } else {
        setLane(-1); // Start Left for normal/city
        meshRef.current.position.x = -CITY_LANE_OFFSET;
      }
    }
  }, [gameStatus, isCrashing, isHighway]);

  useEffect(() => {
    if (isCrashing) return; 

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        changeLane(-1);
      }
      if (e.key === 'ArrowRight') {
        changeLane(1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reportLaneChange, isCrashing, isHighway]);

  const changeLane = (direction: -1 | 1) => {
    setLane(prev => {
        let next = prev;
        
        if (isHighway) {
            // 3 Lanes: -1, 0, 1. Move sequentially.
            next = prev + direction;
            // Clamp
            if (next < -1) next = -1;
            if (next > 1) next = 1;
        } else {
            // 2 Lanes: -1, 1. Toggle or Jump.
            // Standard behavior: Left(-1) <-> Right(1)
            if (direction === 1 && prev === -1) next = 1;
            if (direction === -1 && prev === 1) next = -1;
        }

        if (next !== prev) {
            reportLaneChange();
            playSfx('SWOOSH');
            return next;
        }
        return prev;
    });
  };

  const touchStartX = useRef<number | null>(null);
  useEffect(() => {
    if (isCrashing) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === null) return;
      const diff = e.changedTouches[0].clientX - touchStartX.current;
      if (Math.abs(diff) > 30) {
        if (diff > 0) {
            changeLane(1);
        }
        else {
            changeLane(-1);
        }
      }
      touchStartX.current = null;
    };
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [reportLaneChange, isCrashing, isHighway]);

  useFrame((state, delta) => {
    if (meshRef.current) {
      if (isCrashing) {
         meshRef.current.rotation.x += delta * 2;
         meshRef.current.rotation.y += delta * 5;
         meshRef.current.rotation.z += delta * 3;
         meshRef.current.position.y += delta * 1;
      } else {
         const targetX = lane * currentLaneOffset;
         meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX, delta * LERP_SPEED);
         const xDiff = targetX - meshRef.current.position.x;
         meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, -xDiff * TILT_ANGLE, delta * LERP_SPEED);
         
         // Standard idle bob
         let yPos = Math.sin(state.clock.elapsedTime * 15) * 0.02;

         // Bounce Mechanics
         if (currentSpeed > 5) {
             if (isOffroad) {
                // Intense, chaotic bouncing
                const bounceFreq = 30 + (currentSpeed * 0.5); 
                const bounceAmp = 0.05 + (currentSpeed / 200) * 0.15; 
                const noise = Math.sin(state.clock.elapsedTime * bounceFreq) * Math.cos(state.clock.elapsedTime * (bounceFreq * 0.7));
                yPos += noise * bounceAmp;
                meshRef.current.rotation.z += (Math.random() - 0.5) * 0.02 * (currentSpeed/50);
                meshRef.current.rotation.x += (Math.random() - 0.5) * 0.01 * (currentSpeed/50);
             } else if (isHighway) {
                // Thika Road: Tarmac but high speed vibration ("Good but not too smooth")
                const vibration = Math.sin(state.clock.elapsedTime * 50) * 0.015 * (currentSpeed / 100);
                yPos += vibration;
                // Occasional slight dip (expansion joint)
                if (Math.random() > 0.98) {
                    yPos -= 0.03;
                }
             }
         }

         meshRef.current.position.y = yPos;
      }
    }
  });

  return (
    <group ref={meshRef} position={[-currentLaneOffset, 0, 0]}>
       <group rotation={[0, Math.PI, 0]}>
         {type === 'boda' && <PlayerBoda passengerCount={currentPassengers} />}
         {type === 'tuktuk' && <PlayerTuktuk />}
         {type === 'personal-car' && <PlayerPersonalCar />}
         
         {type === '14-seater' && <Matatu14Seater />}
         {type === '32-seater' && <Matatu32Seater />}
         {type === '52-seater' && <Matatu52Seater />}
       </group>

       {/* Brake Smoke Effects on wheels */}
       <group position={[0.7, 0, 1]}>
          <BrakeSmoke isEmitting={isBrakeSmoking} />
       </group>
       <group position={[-0.7, 0, 1]}>
          <BrakeSmoke isEmitting={isBrakeSmoking} />
       </group>
    </group>
  );
};