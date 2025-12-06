
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

const LANE_OFFSET = 2.2;

export const PlayerController = ({ type, setLaneCallback }: { type: VehicleType | null, setLaneCallback: (l: number) => void }) => {
  const meshRef = useRef<THREE.Group>(null);
  const timeOfDay = useGameStore(state => state.timeOfDay);
  const gameStatus = useGameStore(state => state.gameStatus);
  const isCrashing = useGameStore(state => state.isCrashing);
  const currentPassengers = useGameStore(state => state.currentPassengers);
  const [lane, setLane] = useState<-1 | 1>(-1); 
  const LERP_SPEED = 8;
  const TILT_ANGLE = 0.1;

  const reportLaneChange = useGameStore(state => state.reportLaneChange);

  useEffect(() => {
    setLaneCallback(lane);
  }, [lane, setLaneCallback]);

  useEffect(() => {
    if (gameStatus === 'PLAYING' && !isCrashing && meshRef.current) {
      meshRef.current.rotation.set(0, 0, 0);
      meshRef.current.position.y = 0;
      meshRef.current.position.x = -LANE_OFFSET; 
      setLane(-1); 
    }
  }, [gameStatus, isCrashing]);

  useEffect(() => {
    if (isCrashing) return; 

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setLane(prev => {
           if (prev === 1) {
             reportLaneChange();
             playSfx('SWOOSH');
             return -1;
           }
           return prev;
        });
      }
      if (e.key === 'ArrowRight') {
        setLane(prev => {
           if (prev === -1) {
             reportLaneChange();
             playSfx('SWOOSH');
             return 1;
           }
           return prev;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reportLaneChange, isCrashing]);

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
             setLane(prev => {
                if(prev === -1) {
                    reportLaneChange();
                    playSfx('SWOOSH');
                    return 1;
                }
                return prev;
             });
        }
        else {
             setLane(prev => {
                if(prev === 1) {
                    reportLaneChange();
                    playSfx('SWOOSH');
                    return -1;
                }
                return prev;
             });
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
  }, [reportLaneChange, isCrashing]);

  useFrame((state, delta) => {
    if (meshRef.current) {
      if (isCrashing) {
         meshRef.current.rotation.x += delta * 2;
         meshRef.current.rotation.y += delta * 5;
         meshRef.current.rotation.z += delta * 3;
         meshRef.current.position.y += delta * 1;
      } else {
         const targetX = lane * LANE_OFFSET;
         meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX, delta * LERP_SPEED);
         const xDiff = targetX - meshRef.current.position.x;
         meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, -xDiff * TILT_ANGLE, delta * LERP_SPEED);
         meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 15) * 0.02; 
      }
    }
  });

  return (
    <group ref={meshRef} position={[-LANE_OFFSET, 0, 0]}>
       <group rotation={[0, Math.PI, 0]}>
         {type === 'boda' && <PlayerBoda passengerCount={currentPassengers} />}
         {type === 'tuktuk' && <PlayerTuktuk />}
         {type === 'personal-car' && <PlayerPersonalCar />}
         
         {type === '14-seater' && <Matatu14Seater />}
         {type === '32-seater' && <Matatu32Seater />}
         {type === '52-seater' && <Matatu52Seater />}
       </group>
    </group>
  );
};
