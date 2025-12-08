
import React, { useState, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../../store/gameStore';
import { playSfx } from '../../../utils/audio';
import { Motorbike, SmallCar, Matatu14Seater, Matatu52Seater } from '../vehicles/VehicleModels';

const CITY_LANE_OFFSET = 2.2;
const HIGHWAY_LANE_OFFSET = 3.5;

export const OncomingTraffic = ({ playerLane }: { playerLane: number }) => {
  const { triggerCrash, gameStatus, isCrashing } = useGameStore();
  const [vehicles, setVehicles] = useState<{ id: number, z: number, type: 'BIKE' | 'CAR' | 'MATATU' | 'BUS', speed: number }[]>([]);
  const nextSpawnRef = useRef(0);

  const TRAFFIC_LANE_X = CITY_LANE_OFFSET; 
  const SPAWN_DISTANCE = -150; 
  const DESPAWN_DISTANCE = 20;

  useEffect(() => {
    if (gameStatus === 'PLAYING' && !isCrashing) {
      setVehicles([]); 
      nextSpawnRef.current = 0;
    }
  }, [gameStatus, isCrashing]);

  useFrame((state, delta) => {
    if (gameStatus !== 'PLAYING') return;
    const currentSpeed = useGameStore.getState().currentSpeed;

    setVehicles(prev => {
      const next = [];
      for (const v of prev) {
        const moveSpeed = currentSpeed + v.speed;
        const newZ = v.z + moveSpeed * delta;
        
        if (v.z < 0 && newZ >= 0) {
            playSfx('SWOOSH');
        }

        if (playerLane === 1 && !isCrashing) {
           const dist = Math.abs(newZ - 0); 
           if (dist < 3.0) {
             triggerCrash();
           }
        }

        if (newZ < DESPAWN_DISTANCE) {
          next.push({ ...v, z: newZ });
        }
      }
      return next;
    });

    if (currentSpeed > 0 && state.clock.elapsedTime > nextSpawnRef.current) {
      const types: ('BIKE' | 'CAR' | 'MATATU' | 'BUS')[] = ['BIKE', 'CAR', 'CAR', 'MATATU', 'BUS'];
      const type = types[Math.floor(Math.random() * types.length)];
      setVehicles(prev => [...prev, {
        id: Math.random(),
        z: SPAWN_DISTANCE,
        type,
        speed: 30 + Math.random() * 20 
      }]);
      const interval = 1 + Math.random() * 3;
      nextSpawnRef.current = state.clock.elapsedTime + interval;
    }
  });

  return (
    <group>
      {vehicles.map(v => (
        <group key={v.id} position={[TRAFFIC_LANE_X, 0, v.z]} rotation={[0, 0, 0]}>
           {v.type === 'BIKE' && <Motorbike />}
           {v.type === 'CAR' && <SmallCar />}
           {v.type === 'MATATU' && <Matatu14Seater />}
           {v.type === 'BUS' && <Matatu52Seater />}
        </group>
      ))}
    </group>
  );
};

export const HighwayTraffic = ({ playerLane }: { playerLane: number }) => {
    const { triggerCrash, gameStatus, isCrashing } = useGameStore();
    // Vehicles: same direction, different lanes (-1, 0, 1)
    const [vehicles, setVehicles] = useState<{ id: number, z: number, lane: number, type: 'BIKE' | 'CAR' | 'MATATU' | 'BUS', speed: number }[]>([]);
    const nextSpawnRef = useRef(0);
  
    // Spawns ahead, player catches up (or they pull away)
    const SPAWN_Z_FAR = -250; 
    const REMOVE_Z_BEHIND = 20;
    const REMOVE_Z_FAR = -350; // If they get too far ahead
  
    useEffect(() => {
      if (gameStatus === 'PLAYING' && !isCrashing) {
        setVehicles([]); 
        nextSpawnRef.current = 0;
      }
    }, [gameStatus, isCrashing]);
  
    useFrame((state, delta) => {
      if (gameStatus !== 'PLAYING') return;
      const currentSpeed = useGameStore.getState().currentSpeed; // Units/sec (approx 60-100)
  
      setVehicles(prev => {
        const next = [];
        for (const v of prev) {
          // Relative speed: If player is faster (100) and traffic is (80), traffic moves towards player (positive Z direction in our world where -Z is forward)
          const relativeSpeed = currentSpeed - v.speed; 
          const newZ = v.z + relativeSpeed * delta;
          
          // Overtake Sound (when passing closely)
          if ((v.z < 0 && newZ >= 0) || (v.z > 0 && newZ <= 0)) {
              if (Math.abs(v.lane - playerLane) <= 1) { // Only if nearby
                playSfx('SWOOSH');
              }
          }
  
          // Collision Check
          // Only if in same lane and touching
          if (!isCrashing) {
             const dist = Math.abs(newZ - 0); 
             if (dist < 3.5 && v.lane === playerLane) { 
               triggerCrash();
             }
          }
  
          if (newZ < REMOVE_Z_BEHIND && newZ > REMOVE_Z_FAR) {
            next.push({ ...v, z: newZ });
          }
        }
        return next;
      });
  
      if (currentSpeed > 20 && state.clock.elapsedTime > nextSpawnRef.current) {
        const types: ('BIKE' | 'CAR' | 'MATATU' | 'BUS')[] = ['BIKE', 'CAR', 'CAR', 'CAR', 'MATATU', 'BUS'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        // Pick a random lane (-1, 0, 1)
        const lanes = [-1, 0, 1];
        const spawnLane = lanes[Math.floor(Math.random() * lanes.length)];
        
        // Speed variance
        const baseSpeed = Math.max(40, currentSpeed);
        const trafficSpeed = baseSpeed * (0.6 + Math.random() * 0.5); 

        setVehicles(prev => [...prev, {
          id: Math.random(),
          z: SPAWN_Z_FAR,
          lane: spawnLane,
          type,
          speed: trafficSpeed
        }]);
        
        // --- IMPROVED TRAFFIC DENSITY LOGIC ---
        // Spawn rate increases with speed, but cap min interval to create "busy" feel
        // Previous: (200 / speed) -> at 100 speed = 2s gap.
        // New: (80 / speed) -> at 100 speed = 0.8s gap. 
        const interval = (80 / (currentSpeed + 1)) * (0.3 + Math.random() * 0.7);
        nextSpawnRef.current = state.clock.elapsedTime + interval;
      }
    });
  
    return (
      <group>
        {vehicles.map(v => (
          <group key={v.id} position={[v.lane * HIGHWAY_LANE_OFFSET, 0, v.z]} rotation={[0, Math.PI, 0]}>
             {/* Note: Rotation PI because they are moving same direction as player (facing away from camera) */}
             {v.type === 'BIKE' && <Motorbike />}
             {v.type === 'CAR' && <SmallCar />}
             {v.type === 'MATATU' && <Matatu14Seater />}
             {v.type === 'BUS' && <Matatu52Seater />}
          </group>
        ))}
      </group>
    );
  };
