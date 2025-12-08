
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
    // If direction is SAME (Highway/Overtaking): Relative Speed = PlayerSpeed - TrafficSpeed
    // If direction is OPPOSITE (City/Incoming): Relative Speed = PlayerSpeed + TrafficSpeed
    
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
        // Simple whoosh check when crossing Z=0
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

// --- City / Rural Traffic System (Simple Oncoming) ---
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

// --- Two-Way Overtaking System (Limuru Road) ---
export const TwoWayTraffic = ({ playerLane }: { playerLane: number }) => {
    const { gameStatus, isCrashing, currentSpeed } = useGameStore();
    const [vehicleList, setVehicleList] = useState<TrafficVehicleProps[]>([]);
    
    // Two timers: one for incoming, one for same direction
    const nextOncomingSpawnRef = useRef(0);
    const nextSameDirSpawnRef = useRef(0);

    // Reset traffic on restart
    useEffect(() => {
        if (gameStatus === 'IDLE') {
            setVehicleList([]);
            nextOncomingSpawnRef.current = 0;
            nextSameDirSpawnRef.current = 0;
        }
    }, [gameStatus]);

    const removeVehicle = (id: number) => {
        setVehicleList(prev => prev.filter(v => v.id !== id));
    };

    useFrame((state) => {
        if (gameStatus !== 'PLAYING' || isCrashing) return;
        
        // 1. Spawn SAME DIRECTION cars (Obstacles to overtake)
        // Only spawn if player is moving
        if (currentSpeed > 10 && state.clock.elapsedTime > nextSameDirSpawnRef.current) {
            const types: any[] = ['BUS', 'MATATU', 'CAR']; // Heavy slow traffic
            const type = types[Math.floor(Math.random() * types.length)];
            
            // Slower than player usually to force overtake
            const trafficSpeed = Math.max(30, currentSpeed * (0.6 + Math.random() * 0.2)); 

            const newVehicle: TrafficVehicleProps = {
                id: Math.random(),
                initialZ: -300, 
                lane: -1, // Player's lane (Left)
                laneOffset: CITY_LANE_OFFSET,
                speed: trafficSpeed,
                type,
                direction: 'SAME',
                playerLane,
                onRemove: removeVehicle
            };
    
            setVehicleList(prev => [...prev, newVehicle]);
            
            // Spawn Rate: Frequent enough to be annoying
            nextSameDirSpawnRef.current = state.clock.elapsedTime + (3 + Math.random() * 4);
        }

        // 2. Spawn OPPOSITE DIRECTION cars (Danger)
        if (state.clock.elapsedTime > nextOncomingSpawnRef.current) {
            const types: any[] = ['CAR', 'SUV', 'MATATU'];
            const type = types[Math.floor(Math.random() * types.length)];
            
            const newVehicle: TrafficVehicleProps = {
                id: Math.random(),
                initialZ: -300, 
                lane: 1, // Opposite lane (Right)
                laneOffset: CITY_LANE_OFFSET,
                speed: 60 + Math.random() * 30, // Incoming is fast
                type,
                direction: 'OPPOSITE',
                playerLane,
                onRemove: removeVehicle
            };
    
            setVehicleList(prev => [...prev, newVehicle]);
            
            // Spawn Rate: Gaps are critical for overtaking
            nextOncomingSpawnRef.current = state.clock.elapsedTime + (2 + Math.random() * 3);
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

// --- Highway Traffic System (3 Lanes) ---
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
        
        // Only spawn if moving fast enough
        if (currentSpeed > 20 && state.clock.elapsedTime > nextSpawnRef.current) {
            
            // Lanes: -1 (Left/Slow), 0 (Mid), 1 (Right/Fast)
            const lanes = [-1, 0, 1];
            
            // Try not to pick the same lane twice in a row
            let validLanes = lanes.filter(l => l !== lastSpawnLaneRef.current);
            if (validLanes.length === 0) validLanes = lanes;
            const spawnLane = validLanes[Math.floor(Math.random() * validLanes.length)];
            lastSpawnLaneRef.current = spawnLane;

            let minS = 40, maxS = 60;
            let type: any = 'MATATU';

            if (spawnLane === -1) { // Left (Slow)
                minS = 40; maxS = 65;
                const types = ['BUS', 'MATATU', 'CAR']; 
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

            const newVehicle: TrafficVehicleProps = {
                id: Math.random(),
                initialZ: -300 - (Math.random() * 50),
                lane: spawnLane,
                laneOffset: HIGHWAY_LANE_OFFSET,
                speed: trafficSpeed,
                type,
                direction: 'SAME',
                playerLane,
                onRemove: removeVehicle
            };
    
            setVehicleList(prev => [...prev, newVehicle]);
            
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
