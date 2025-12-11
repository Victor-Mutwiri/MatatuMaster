
import React, { useState, useRef, useEffect, memo, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../../store/gameStore';
import { playSfx } from '../../../utils/audio';
import { Motorbike, SmallCar, Matatu14Seater, Matatu52Seater, Matatu32Seater, PlayerPersonalCar } from '../vehicles/VehicleModels';
import { HeavyTruck } from '../environment/WorldAssets';
import * as THREE from 'three';
import { SeededRNG } from '../../../utils/random';

const CITY_LANE_OFFSET = 2.2;
const HIGHWAY_LANE_OFFSET = 3.5;
const RONGAI_LANE_OFFSET = 3.2;

// --- Independent Vehicle Component ---
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
        // Simple Lane Check
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

// Helper to get RNG
const useRNG = () => {
    const { activeRoomId } = useGameStore();
    return useMemo(() => {
        if (activeRoomId) {
            // Multiplayer: Deterministic
            return new SeededRNG(activeRoomId);
        } else {
            // Single Player: Random
            return {
                next: () => Math.random(),
                chance: (p: number) => Math.random() < p,
                range: (min: number, max: number) => min + Math.random() * (max - min),
                pick: (arr: any[]) => arr[Math.floor(Math.random() * arr.length)]
            };
        }
    }, [activeRoomId]);
};

// --- City / Rural Traffic System ---
export const OncomingTraffic = ({ playerLane }: { playerLane: number }) => {
  const { gameStatus, isCrashing } = useGameStore();
  const [vehicleList, setVehicleList] = useState<TrafficVehicleProps[]>([]);
  const nextSpawnRef = useRef(0);
  const rng = useRNG();

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
        const type = rng.pick(types);
        
        const newVehicle: TrafficVehicleProps = {
            id: Math.random(), // ID can be random, used for keys
            initialZ: -150,
            lane: 1, 
            laneOffset: CITY_LANE_OFFSET,
            speed: rng.range(30, 50),
            type,
            direction: 'OPPOSITE',
            playerLane,
            onRemove: removeVehicle
        };

        setVehicleList(prev => [...prev, newVehicle]);
        nextSpawnRef.current = state.clock.elapsedTime + rng.range(1, 3);
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
    const rng = useRNG();

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
            const type = rng.pick(types);
            
            const trafficSpeed = Math.max(30, currentSpeed * rng.range(0.6, 0.8)); 

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
            
            nextSameDirSpawnRef.current = state.clock.elapsedTime + rng.range(3, 7);
        }

        if (state.clock.elapsedTime > nextOncomingSpawnRef.current) {
            const types: any[] = ['CAR', 'SUV', 'MATATU'];
            const type = rng.pick(types);
            
            const newVehicle: TrafficVehicleProps = {
                id: Math.random(),
                initialZ: -300, 
                lane: 1, 
                laneOffset: CITY_LANE_OFFSET,
                speed: rng.range(60, 90), 
                type,
                direction: 'OPPOSITE',
                playerLane,
                onRemove: removeVehicle
            };
    
            setVehicleList(prev => [...prev, newVehicle]);
            nextOncomingSpawnRef.current = state.clock.elapsedTime + rng.range(2, 5);
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
    const rng = useRNG();

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
            nextHeavySpawnRef.current = state.clock.elapsedTime + rng.range(3, 6);
        }

        if (state.clock.elapsedTime > nextOncomingSpawnRef.current) {
             const types: any[] = ['CAR', 'SUV', 'MATATU'];
             const type = rng.pick(types);
             
             const newVehicle: TrafficVehicleProps = {
                id: Math.random(),
                initialZ: -300, 
                lane: 1, 
                laneOffset: CITY_LANE_OFFSET,
                speed: rng.range(70, 100), 
                type,
                direction: 'OPPOSITE',
                playerLane,
                onRemove: removeVehicle
            };
            setVehicleList(prev => [...prev, newVehicle]);
            nextOncomingSpawnRef.current = state.clock.elapsedTime + rng.range(1.5, 3.5);
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
    const rng = useRNG();

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
        
        if (state.clock.elapsedTime > nextSpawnRef.current) {
            
            const lane = rng.chance(0.5) ? 1 : -1;
            
            const types: any[] = ['MATATU', 'BUS', 'CAR', 'SUV'];
            const type = rng.pick(types);
            
            const speed = rng.range(0, 20);

            const newVehicle: TrafficVehicleProps = {
                id: Math.random(),
                initialZ: -200, 
                lane, 
                laneOffset: CITY_LANE_OFFSET,
                speed, 
                type,
                direction: 'SAME',
                playerLane,
                driftX: true, 
                onRemove: removeVehicle
            };
    
            setVehicleList(prev => [...prev, newVehicle]);
            nextSpawnRef.current = state.clock.elapsedTime + rng.range(1, 2.5);
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

// --- Rongai Traffic (Chaos) ---
export const RongaiTraffic = ({ playerLane }: { playerLane: number }) => {
    const { gameStatus, isCrashing, selectedRoute } = useGameStore();
    const [vehicleList, setVehicleList] = useState<TrafficVehicleProps[]>([]);
    
    const nextMainSpawn = useRef(0);
    const nextOncomingSpawn = useRef(0);
    const nextOverlapSpawn = useRef(0);
    const nextBullySpawn = useRef(0); 
    const rng = useRNG();

    const isRaceMode = selectedRoute?.gamemode === 'RACE';

    useEffect(() => {
        if (gameStatus === 'IDLE') {
            setVehicleList([]);
            nextMainSpawn.current = 0;
            nextOncomingSpawn.current = 0;
            nextOverlapSpawn.current = 0;
            nextBullySpawn.current = 0;
        }
    }, [gameStatus]);

    const removeVehicle = (id: number) => {
        setVehicleList(prev => prev.filter(v => v.id !== id));
    };

    useFrame((state) => {
        if (gameStatus !== 'PLAYING' || isCrashing) return;
        const t = state.clock.elapsedTime;
        
        const rateMult = isRaceMode ? 0.6 : 1.0; 

        // 1. Slow Gridlock in Main Lane
        if (t > nextMainSpawn.current) {
             const newVehicle: TrafficVehicleProps = {
                id: Math.random(),
                initialZ: -250, 
                lane: -1, 
                laneOffset: RONGAI_LANE_OFFSET,
                speed: rng.range(15, 30),
                type: 'CAR',
                direction: 'SAME',
                playerLane,
                onRemove: removeVehicle
            };
            setVehicleList(prev => [...prev, newVehicle]);
            nextMainSpawn.current = t + rng.range(2, 4) * rateMult;
        }

        // 2. Fast Oncoming
        if (t > nextOncomingSpawn.current) {
             const newVehicle: TrafficVehicleProps = {
                id: Math.random(),
                initialZ: -250, 
                lane: 1, 
                laneOffset: RONGAI_LANE_OFFSET,
                speed: rng.range(60, 100),
                type: 'MATATU',
                direction: 'OPPOSITE',
                playerLane,
                onRemove: removeVehicle
            };
            setVehicleList(prev => [...prev, newVehicle]);
            nextOncomingSpawn.current = t + rng.range(1, 3) * rateMult;
        }

        // 3. "Overlappers"
        if (t > nextOverlapSpawn.current) {
             const newVehicle: TrafficVehicleProps = {
                id: Math.random(),
                initialZ: -300, 
                lane: -2, 
                laneOffset: RONGAI_LANE_OFFSET,
                speed: rng.range(70, 90),
                type: 'MATATU',
                direction: 'SAME',
                playerLane,
                onRemove: removeVehicle
            };
            setVehicleList(prev => [...prev, newVehicle]);
            nextOverlapSpawn.current = t + rng.range(5, 10) * rateMult;
        }

        // 4. "The Bully"
        if (t > nextBullySpawn.current) {
             const newVehicle: TrafficVehicleProps = {
                id: Math.random(),
                initialZ: -400, 
                lane: -1, 
                laneOffset: RONGAI_LANE_OFFSET,
                speed: 80, 
                type: 'BUS', 
                direction: 'OPPOSITE', 
                playerLane,
                onRemove: removeVehicle
            };
            setVehicleList(prev => [...prev, newVehicle]);
            nextBullySpawn.current = t + rng.range(10, 20) * rateMult; 
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
    const { gameStatus, isCrashing, currentSpeed, selectedRoute } = useGameStore();
    const [vehicleList, setVehicleList] = useState<TrafficVehicleProps[]>([]);
    const nextSpawnRef = useRef(0);
    const lastSpawnLaneRef = useRef<number | null>(null);
    const rng = useRNG();

    const isRaceMode = selectedRoute?.gamemode === 'RACE';

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
            const spawnLane = rng.pick(validLanes);
            lastSpawnLaneRef.current = spawnLane;

            let minS = 40, maxS = 60;
            let type: any = 'MATATU';

            if (spawnLane === -1) { // Left (Slow)
                minS = 40; maxS = 65;
                const types = ['BUS', 'MATATU', 'CAR']; 
                type = rng.pick(types);
            } else if (spawnLane === 0) { // Middle
                minS = 65; maxS = 85;
                const types = ['MATATU', 'CAR', 'SUV'];
                type = rng.pick(types);
            } else { // Right (Fast)
                minS = 85; maxS = 110;
                const types = ['CAR', 'SUV', 'BIKE'];
                type = rng.pick(types);
            }

            const trafficSpeed = rng.range(minS, maxS);

            const newVehicle: TrafficVehicleProps = {
                id: Math.random(),
                initialZ: -300 - (rng.range(0, 50)),
                lane: spawnLane,
                laneOffset: HIGHWAY_LANE_OFFSET,
                speed: trafficSpeed,
                type,
                direction: 'SAME',
                playerLane,
                onRemove: removeVehicle
            };
    
            setVehicleList(prev => [...prev, newVehicle]);
            
            const interval = isRaceMode 
                ? rng.range(0.3, 0.6) 
                : rng.range(0.5, 1.3);
            
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
