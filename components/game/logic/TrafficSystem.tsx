
import React, { useState, useRef, useEffect, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../../store/gameStore';
import { playSfx } from '../../../utils/audio';
import { Motorbike, SmallCar, Matatu14Seater, Matatu52Seater, Matatu32Seater, PlayerPersonalCar } from '../vehicles/VehicleModels';
import { HeavyTruck } from '../environment/WorldAssets';
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
  type: 'BIKE' | 'CAR' | 'MATATU' | 'BUS' | 'SUV' | 'HEAVY_TRUCK';
  direction: 'SAME' | 'OPPOSITE';
  playerLane: number;
  driftX?: boolean; // Lateral movement (squeeze)
  onRemove: (id: number) => void;
}

const TrafficVehicle = memo(({ id, initialZ, lane, laneOffset, speed, type, direction, playerLane, driftX = false, onRemove }: TrafficVehicleProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const passedPlayerRef = useRef(false);
  const { currentSpeed, triggerCrash, isCrashing } = useGameStore();
  const initialX = lane * laneOffset;

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // --- Movement Logic ---
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

    // --- Lateral Drift (Gridlock Squeeze) ---
    if (driftX) {
        const t = state.clock.elapsedTime + id;
        // Drift up to 0.5 units left/right to open/close gaps
        groupRef.current.position.x = initialX + Math.sin(t * 1.5) * 0.5;
    }

    // --- Collision Logic ---
    if (!isCrashing && Math.abs(currentZ) < 3.0) {
        // Collision box
        // For gridlock, collisions happen if lateral distance is small too
        const vehX = groupRef.current.position.x;
        // Player is roughly at playerLane * laneOffset
        // Since player moves smoothly, we need accurate Player X?
        // Approx: Player is at playerLane * laneOffset
        const playerX = playerLane * laneOffset;
        
        // Simple Lane Check: If vehicle is in player's lane ID
        if (lane === playerLane) {
            triggerCrash();
        }
    }

    // --- Sound Logic (Whoosh when passing) ---
    if (!passedPlayerRef.current) {
        if (direction === 'SAME') {
             if ((initialZ < 0 && currentZ >= 0) || (initialZ > 0 && currentZ <= 0)) {
                 if (Math.abs(lane - playerLane) <= 1) playSfx('SWOOSH');
                 passedPlayerRef.current = true;
             }
        } else {
             if (currentZ >= 0) {
                 if (Math.abs(lane - playerLane) <= 1) playSfx('SWOOSH');
                 passedPlayerRef.current = true;
             }
        }
    }

    // --- Despawn Logic ---
    if (currentZ > 30 || currentZ < -400) {
        onRemove(id);
    }
  });

  return (
    <group ref={groupRef} position={[initialX, 0, initialZ]} rotation={[0, direction === 'SAME' ? Math.PI : 0, 0]}>
        {type === 'BIKE' && <Motorbike />}
        {type === 'CAR' && <SmallCar />}
        {type === 'SUV' && <PlayerPersonalCar />}
        {type === 'MATATU' && <Matatu14Seater />}
        {type === 'BUS' && <Matatu52Seater />}
        {type === 'HEAVY_TRUCK' && <HeavyTruck />}
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
    
    if (state.clock.elapsedTime > nextSpawnRef.current) {
        const types: any[] = ['BIKE', 'CAR', 'CAR', 'MATATU', 'BUS'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        const newVehicle: TrafficVehicleProps = {
            id: Math.random(),
            initialZ: -150,
            lane: 1, 
            laneOffset: CITY_LANE_OFFSET,
            speed: 30 + Math.random() * 20,
            type,
            direction: 'OPPOSITE',
            playerLane,
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
    
    const nextOncomingSpawnRef = useRef(0);
    const nextSameDirSpawnRef = useRef(0);

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
        
        if (currentSpeed > 10 && state.clock.elapsedTime > nextSameDirSpawnRef.current) {
            const types: any[] = ['BUS', 'MATATU', 'CAR']; 
            const type = types[Math.floor(Math.random() * types.length)];
            
            const trafficSpeed = Math.max(30, currentSpeed * (0.6 + Math.random() * 0.2)); 

            const newVehicle: TrafficVehicleProps = {
                id: Math.random(),
                initialZ: -300, 
                lane: -1, 
                laneOffset: CITY_LANE_OFFSET,
                speed: trafficSpeed,
                type,
                direction: 'SAME',
                playerLane,
                onRemove: removeVehicle
            };
    
            setVehicleList(prev => [...prev, newVehicle]);
            
            nextSameDirSpawnRef.current = state.clock.elapsedTime + (3 + Math.random() * 4);
        }

        if (state.clock.elapsedTime > nextOncomingSpawnRef.current) {
            const types: any[] = ['CAR', 'SUV', 'MATATU'];
            const type = types[Math.floor(Math.random() * types.length)];
            
            const newVehicle: TrafficVehicleProps = {
                id: Math.random(),
                initialZ: -300, 
                lane: 1, 
                laneOffset: CITY_LANE_OFFSET,
                speed: 60 + Math.random() * 30, 
                type,
                direction: 'OPPOSITE',
                playerLane,
                onRemove: removeVehicle
            };
    
            setVehicleList(prev => [...prev, newVehicle]);
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

// --- Escarpment Traffic (Heavy Trucks) ---
export const EscarpmentTraffic = ({ playerLane }: { playerLane: number }) => {
    const { gameStatus, isCrashing } = useGameStore();
    const [vehicleList, setVehicleList] = useState<TrafficVehicleProps[]>([]);
    const nextOncomingSpawnRef = useRef(0);
    const nextHeavySpawnRef = useRef(0);

    useEffect(() => {
        if (gameStatus === 'IDLE') {
            setVehicleList([]);
            nextOncomingSpawnRef.current = 0;
            nextHeavySpawnRef.current = 0;
        }
    }, [gameStatus]);

    const removeVehicle = (id: number) => {
        setVehicleList(prev => prev.filter(v => v.id !== id));
    };

    useFrame((state) => {
        if (gameStatus !== 'PLAYING' || isCrashing) return;
        
        if (state.clock.elapsedTime > nextHeavySpawnRef.current) {
             const newVehicle: TrafficVehicleProps = {
                id: Math.random(),
                initialZ: -300, 
                lane: -1, 
                laneOffset: CITY_LANE_OFFSET,
                speed: 15, 
                type: 'HEAVY_TRUCK',
                direction: 'SAME',
                playerLane,
                onRemove: removeVehicle
            };
            setVehicleList(prev => [...prev, newVehicle]);
            nextHeavySpawnRef.current = state.clock.elapsedTime + (3 + Math.random() * 3);
        }

        if (state.clock.elapsedTime > nextOncomingSpawnRef.current) {
             const types: any[] = ['CAR', 'SUV', 'MATATU'];
             const type = types[Math.floor(Math.random() * types.length)];
             
             const newVehicle: TrafficVehicleProps = {
                id: Math.random(),
                initialZ: -300, 
                lane: 1, 
                laneOffset: CITY_LANE_OFFSET,
                speed: 70 + Math.random() * 30, 
                type,
                direction: 'OPPOSITE',
                playerLane,
                onRemove: removeVehicle
            };
            setVehicleList(prev => [...prev, newVehicle]);
            nextOncomingSpawnRef.current = state.clock.elapsedTime + (1.5 + Math.random() * 2);
        }
    });

    return (
        <>
        {vehicleList.map(v => (
            <TrafficVehicle key={v.id} {...v} playerLane={playerLane} onRemove={removeVehicle} />
        ))}
        </>
    );
}

// --- Gridlock Traffic (River Road) ---
export const GridlockTraffic = ({ playerLane }: { playerLane: number }) => {
    const { gameStatus, isCrashing } = useGameStore();
    const [vehicleList, setVehicleList] = useState<TrafficVehicleProps[]>([]);
    const nextSpawnRef = useRef(0);

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
        
        // Spawn congested traffic in lanes -1 and 1
        if (state.clock.elapsedTime > nextSpawnRef.current) {
            
            // Randomly choose lane -1 or 1
            const lane = Math.random() > 0.5 ? 1 : -1;
            
            const types: any[] = ['MATATU', 'BUS', 'CAR', 'SUV'];
            const type = types[Math.floor(Math.random() * types.length)];
            
            // Very slow speeds: 0 to 20 km/h
            const speed = Math.random() * 20;

            const newVehicle: TrafficVehicleProps = {
                id: Math.random(),
                initialZ: -200, 
                lane, 
                laneOffset: CITY_LANE_OFFSET,
                speed, 
                type,
                direction: 'SAME',
                playerLane,
                driftX: true, // Enable Squeeze Mechanic
                onRemove: removeVehicle
            };
    
            setVehicleList(prev => [...prev, newVehicle]);
            // Dense spawn rate
            nextSpawnRef.current = state.clock.elapsedTime + (1 + Math.random() * 1.5);
        }
    });

    return (
        <>
        {vehicleList.map(v => (
            <TrafficVehicle key={v.id} {...v} playerLane={playerLane} onRemove={removeVehicle} />
        ))}
        </>
    );
}

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
        
        if (currentSpeed > 20 && state.clock.elapsedTime > nextSpawnRef.current) {
            
            const lanes = [-1, 0, 1];
            
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
