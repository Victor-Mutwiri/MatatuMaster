
import React, { useState, useRef, useEffect, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../../store/gameStore';
import { playSfx } from '../../../utils/audio';
import { Motorbike, SmallCar, Matatu14Seater, Matatu52Seater, Matatu32Seater, PlayerPersonalCar } from '../vehicles/VehicleModels';
import * as THREE from 'three';

const CITY_LANE_OFFSET = 2.2;
const HIGHWAY_LANE_OFFSET = 3.5;

// --- Independent Vehicle Component ---
// Manages its own movement to avoid re-rendering the parent list every frame.
interface TrafficVehicleProps {
  id: number;
  initialZ: number;
  lane: number;
  laneOffset: number;
  speed: number;
  type: 'BIKE' | 'CAR' | 'MATATU' | 'BUS' | 'SUV';
  direction: 'SAME' | 'OPPOSITE';
  playerLane: number;
  onRemove: (id: number) => void;
}

const TrafficVehicle = memo(({ id, initialZ, lane, laneOffset, speed, type, direction, playerLane, onRemove }: TrafficVehicleProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const passedPlayerRef = useRef(false);
  const { currentSpeed, triggerCrash, isCrashing } = useGameStore();

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // --- Movement Logic ---
    // If direction is SAME (Highway): Relative Speed = PlayerSpeed - TrafficSpeed
    // If direction is OPPOSITE (City): Relative Speed = PlayerSpeed + TrafficSpeed
    
    let moveDelta = 0;
    if (direction === 'SAME') {
        const relativeSpeed = currentSpeed - speed;
        moveDelta = relativeSpeed * delta;
    } else {
        const relativeSpeed = currentSpeed + speed;
        moveDelta = relativeSpeed * delta;
    }

    groupRef.current.position.z += moveDelta;
    const currentZ = groupRef.current.position.z;

    // --- Collision Logic ---
    if (!isCrashing && Math.abs(currentZ) < 3.0) {
        // Collision box is roughly 3 units long
        // Check Lane
        if (lane === playerLane) {
            triggerCrash();
        }
    }

    // --- Sound Logic (Whoosh when passing) ---
    if (!passedPlayerRef.current) {
        // If Highway: we pass them if we are faster (currentZ goes from negative to positive) OR they pass us (positive to negative)
        // If City: they always come from negative Z to positive (wait, city logic spawns at -150 and moves to +20)
        
        // Simplified: Just check if we cross Z=0 area
        if (direction === 'SAME') {
             // Overtake (We pass them OR they pass us)
             if ((initialZ < 0 && currentZ >= 0) || (initialZ > 0 && currentZ <= 0)) {
                 if (Math.abs(lane - playerLane) <= 1) playSfx('SWOOSH');
                 passedPlayerRef.current = true;
             }
        } else {
             // Oncoming
             if (currentZ >= 0) {
                 if (Math.abs(lane - playerLane) <= 1) playSfx('SWOOSH');
                 passedPlayerRef.current = true;
             }
        }
    }

    // --- Despawn Logic ---
    // Behind camera (positive Z) or too far ahead (negative Z)
    if (currentZ > 30 || currentZ < -400) {
        onRemove(id);
    }
  });

  return (
    <group ref={groupRef} position={[lane * laneOffset, 0, initialZ]} rotation={[0, direction === 'SAME' ? Math.PI : 0, 0]}>
        {type === 'BIKE' && <Motorbike />}
        {type === 'CAR' && <SmallCar />}
        {type === 'SUV' && <PlayerPersonalCar />}
        {type === 'MATATU' && <Matatu14Seater />}
        {type === 'BUS' && <Matatu52Seater />}
    </group>
  );
});

// --- City / Rural Traffic System ---
export const OncomingTraffic = ({ playerLane }: { playerLane: number }) => {
  const { gameStatus, isCrashing } = useGameStore();
  const [vehicleList, setVehicleList] = useState<TrafficVehicleProps[]>([]);
  const nextSpawnRef = useRef(0);

  useEffect(() => {
    if (gameStatus === 'IDLE') setVehicleList([]);
  }, [gameStatus]);

  const removeVehicle = (id: number) => {
    setVehicleList(prev => prev.filter(v => v.id !== id));
  };

  useFrame((state) => {
    if (gameStatus !== 'PLAYING' || isCrashing) return;
    
    // Spawn Logic
    if (state.clock.elapsedTime > nextSpawnRef.current) {
        const types: any[] = ['BIKE', 'CAR', 'CAR', 'MATATU', 'BUS'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        const newVehicle: TrafficVehicleProps = {
            id: Math.random(),
            initialZ: -150, // Spawn ahead
            lane: 1, // Oncoming is always in the other lane (visually right lane, conceptually lane 1)
            laneOffset: CITY_LANE_OFFSET,
            speed: 30 + Math.random() * 20,
            type,
            direction: 'OPPOSITE',
            playerLane, // Passed for collision check inside component
            onRemove: removeVehicle
        };

        setVehicleList(prev => [...prev, newVehicle]);
        nextSpawnRef.current = state.clock.elapsedTime + (1 + Math.random() * 2);
    }
  });

  return (
    <>
      {vehicleList.map(v => (
        <TrafficVehicle key={v.id} {...v} playerLane={playerLane} onRemove={removeVehicle} />
      ))}
    </>
  );
};

// --- Highway Traffic System ---
export const HighwayTraffic = ({ playerLane }: { playerLane: number }) => {
    const { gameStatus, isCrashing, currentSpeed } = useGameStore();
    const [vehicleList, setVehicleList] = useState<TrafficVehicleProps[]>([]);
    const nextSpawnRef = useRef(0);
    const lastSpawnLaneRef = useRef<number | null>(null);

    // Reset traffic on restart
    useEffect(() => {
        if (gameStatus === 'IDLE') {
            setVehicleList([]);
            nextSpawnRef.current = 0;
        }
    }, [gameStatus]);

    const removeVehicle = (id: number) => {
        setVehicleList(prev => prev.filter(v => v.id !== id));
    };

    useFrame((state) => {
        if (gameStatus !== 'PLAYING' || isCrashing) return;
        
        // Only spawn if moving fast enough to make sense
        if (currentSpeed > 20 && state.clock.elapsedTime > nextSpawnRef.current) {
            
            // --- Lane Selection Strategy ---
            // Lanes: -1 (Left/Slow), 0 (Mid), 1 (Right/Fast)
            const lanes = [-1, 0, 1];
            
            // Try not to pick the same lane twice in a row to prevent vertical stacking
            let validLanes = lanes.filter(l => l !== lastSpawnLaneRef.current);
            if (validLanes.length === 0) validLanes = lanes;
            const spawnLane = validLanes[Math.floor(Math.random() * validLanes.length)];
            lastSpawnLaneRef.current = spawnLane;

            // --- Speed Strategy (No Blocking Walls) ---
            // We scale traffic speed relative to player's current speed capability but clamped
            // Lane -1: 50-70 units/s (Slow lane)
            // Lane 0: 70-90 units/s
            // Lane 1: 90-120 units/s (Fast lane)
            
            let minS = 40, maxS = 60;
            let type: any = 'MATATU';

            if (spawnLane === -1) { // Left (Slow)
                minS = 40; maxS = 65;
                const types = ['BUS', 'MATATU', 'CAR']; // Heavy traffic
                type = types[Math.floor(Math.random() * types.length)];
            } else if (spawnLane === 0) { // Middle
                minS = 65; maxS = 85;
                const types = ['MATATU', 'CAR', 'SUV'];
                type = types[Math.floor(Math.random() * types.length)];
            } else { // Right (Fast)
                minS = 85; maxS = 110;
                const types = ['CAR', 'SUV', 'BIKE'];
                type = types[Math.floor(Math.random() * types.length)];
            }

            const trafficSpeed = minS + Math.random() * (maxS - minS);

            // If traffic is slower than player, spawn far ahead. 
            // If traffic is faster than player, spawn behind (to overtake us).
            // Currently simplified: Spawn far ahead and let logic handle relative speed.
            // Z = -300. 
            // If we are doing 100 and they are doing 60, relative is +40. They come towards us from -300.
            
            const newVehicle: TrafficVehicleProps = {
                id: Math.random(),
                initialZ: -300 - (Math.random() * 50), // Add variance to Z so they don't form lines
                lane: spawnLane,
                laneOffset: HIGHWAY_LANE_OFFSET,
                speed: trafficSpeed,
                type,
                direction: 'SAME',
                playerLane,
                onRemove: removeVehicle
            };
    
            setVehicleList(prev => [...prev, newVehicle]);
            
            // Spawn Rate: Higher speed = more road covered = more cars needed?
            // Fixed interval with randomness prevents patterns
            const interval = 0.5 + Math.random() * 0.8;
            nextSpawnRef.current = state.clock.elapsedTime + interval;
        }
    });
  
    return (
      <>
        {vehicleList.map(v => (
            <TrafficVehicle key={v.id} {...v} playerLane={playerLane} onRemove={removeVehicle} />
        ))}
      </>
    );
};
