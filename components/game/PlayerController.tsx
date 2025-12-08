
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
  const endGame = useGameStore(state => state.endGame);
  
  const [lane, setLane] = useState<number>(-1); 
  const LERP_SPEED = 8;
  const TILT_ANGLE = 0.1;

  const reportLaneChange = useGameStore(state => state.reportLaneChange);

  // Map Checks
  const isOffroad = selectedRoute?.id === 'rural-dirt';
  const isHighway = selectedRoute?.id === 'thika-highway';
  const isRiverRoad = selectedRoute?.id === 'river-road';

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
      
      // Starting position
      if (isHighway) {
        setLane(0); 
        meshRef.current.position.x = 0;
      } else {
        setLane(-1); 
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
  }, [reportLaneChange, isCrashing, isHighway, isRiverRoad, lane]); // Added lane dep for RiverRoad check

  const changeLane = (direction: -1 | 1) => {
    setLane(prev => {
        let next = prev;
        
        if (isHighway) {
            // 3 Lanes: -1, 0, 1.
            next = prev + direction;
            if (next < -1) next = -1;
            if (next > 1) next = 1;
        } else if (isRiverRoad) {
            // 4 Lanes: -2(SW), -1, 1, 2(SW). No 0.
            // Move seq: -2 <-> -1 <-> 1 <-> 2
            // Since we use prev + dir, standard 0 skip needed
            let potential = prev + direction;
            if (potential === 0) potential = direction; // Skip 0
            
            // Limit
            if (potential < -2) potential = -2;
            if (potential > 2) potential = 2;
            next = potential;
        } else {
            // 2 Lanes: -1, 1.
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
  }, [reportLaneChange, isCrashing, isHighway, isRiverRoad, lane]);

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
                const bounceFreq = 30 + (currentSpeed * 0.5); 
                const bounceAmp = 0.05 + (currentSpeed / 200) * 0.15; 
                const noise = Math.sin(state.clock.elapsedTime * bounceFreq) * Math.cos(state.clock.elapsedTime * (bounceFreq * 0.7));
                yPos += noise * bounceAmp;
                meshRef.current.rotation.z += (Math.random() - 0.5) * 0.02 * (currentSpeed/50);
                meshRef.current.rotation.x += (Math.random() - 0.5) * 0.01 * (currentSpeed/50);
             } else if (isHighway) {
                const vibration = Math.sin(state.clock.elapsedTime * 50) * 0.015 * (currentSpeed / 100);
                yPos += vibration;
                if (Math.random() > 0.98) {
                    yPos -= 0.03;
                }
             }
         }

         // River Road Curb Physics
         if (isRiverRoad) {
             // If driving on sidewalk (abs(lane) == 2), tilt and lift
             const isOnSidewalk = Math.abs(lane) === 2;
             
             // Check distance to center of lane to smooth transition
             const distToLaneCenter = Math.abs(meshRef.current.position.x - targetX);
             
             if (isOnSidewalk) {
                 // Lift car up (Curb height 0.2)
                 yPos += 0.2;
                 // Tilt away from road slightly (uneven pavement)
                 meshRef.current.rotation.z += (lane === 2 ? -0.05 : 0.05);
                 
                 // Check for Foot Cop Arrest (Simple distance check from global cops if implemented, 
                 // but for now relying on Map logic or Traffic logic)
                 
                 // However, we can also check standard cop collision if CopOnFoot logic was centralized.
                 // The CopOnFoot inside RiverRoadMap has visual logic.
                 // We will add logic in RiverRoadMap's useFrame for Cop Collision.
             }
         }

         meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, yPos, delta * 5);
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
