
import React, { useState, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../../store/gameStore';
import { playSfx } from '../../../utils/audio';
import { Motorbike, SmallCar, Matatu14Seater, Matatu52Seater } from '../vehicles/VehicleModels';

export const OncomingTraffic = ({ playerLane }: { playerLane: number }) => {
  const { triggerCrash, gameStatus, isCrashing } = useGameStore();
  const [vehicles, setVehicles] = useState<{ id: number, z: number, type: 'BIKE' | 'CAR' | 'MATATU' | 'BUS', speed: number }[]>([]);
  const nextSpawnRef = useRef(0);

  const LANE_OFFSET = 2.2; 
  const TRAFFIC_LANE_X = LANE_OFFSET; 
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
