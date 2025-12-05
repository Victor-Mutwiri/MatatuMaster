
import React, { useEffect, useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGameStore } from '../../../store/gameStore';
import { EngineSynthesizer } from '../../../utils/audio';
import * as THREE from 'three';

const CAMERA_POS = new THREE.Vector3(0, 8, 15);

export const PhysicsController = () => {
  const { 
    gameStatus, 
    setCurrentSpeed, 
    updateDistance, 
    activeModal,
    setControl,
    isEngineSoundOn
  } = useGameStore();

  const engineRef = useRef<EngineSynthesizer | null>(null);

  const MAX_SPEED = 120; // Approx 180 km/h in game units
  const ACCEL_RATE = 40;
  const BRAKE_RATE = 80;
  const FRICTION_RATE = 15;
  const CREEP_SPEED = 5;

  // Listen for keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStatus !== 'PLAYING') return;
      if (e.key === 'ArrowUp') setControl('GAS', true);
      if (e.key === 'ArrowDown') setControl('BRAKE', true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') setControl('GAS', false);
      if (e.key === 'ArrowDown') setControl('BRAKE', false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameStatus, setControl]);

  // Audio Engine Lifecycle
  useEffect(() => {
    if (gameStatus === 'PLAYING') {
      if (isEngineSoundOn) {
        if (!engineRef.current) {
            const vehicleType = useGameStore.getState().vehicleType || '14-seater';
            engineRef.current = new EngineSynthesizer();
            engineRef.current.setVehicleType(vehicleType);
            engineRef.current.start();
        }
      } else {
        if (engineRef.current) {
            engineRef.current.stop();
            engineRef.current = null;
        }
      }
    } else {
      engineRef.current?.stop();
      engineRef.current = null;
    }

    return () => {
      engineRef.current?.stop();
      engineRef.current = null;
    };
  }, [gameStatus, isEngineSoundOn]);

  useFrame((state, delta) => {
    if (gameStatus !== 'PLAYING' || activeModal !== 'NONE') {
        if (engineRef.current) engineRef.current.setSpeed(0);
        return;
    }

    const { 
      currentSpeed, 
      isAccelerating, 
      isBraking, 
      nextStageDistance, 
      nextPoliceDistance, 
      distanceTraveled 
    } = useGameStore.getState();

    let newSpeed = currentSpeed;

    // --- Auto Deceleration Logic ---
    const distToStage = nextStageDistance - distanceTraveled;
    const distToPolice = nextPoliceDistance - distanceTraveled;
    
    let closestStopDist = Infinity;
    if (distToStage > 0 && distToStage < 300) closestStopDist = Math.min(closestStopDist, distToStage);
    if (distToPolice > 0 && distToPolice < 300) closestStopDist = Math.min(closestStopDist, distToPolice);

    let speedLimit = MAX_SPEED;
    if (closestStopDist < 250) {
        const factor = Math.max(0, closestStopDist / 250);
        const minCrawl = closestStopDist < 5 ? 2 : 15; 
        speedLimit = minCrawl + (factor * (MAX_SPEED - minCrawl));
    }

    // --- Physics Update ---

    if (isAccelerating) {
      newSpeed += ACCEL_RATE * delta;
    } else if (isBraking) {
      newSpeed -= BRAKE_RATE * delta;
    } else {
      // Friction / Coasting
      if (newSpeed > CREEP_SPEED) {
        newSpeed -= FRICTION_RATE * delta;
      } else if (newSpeed < CREEP_SPEED) {
        newSpeed += FRICTION_RATE * delta;
        if (newSpeed > CREEP_SPEED) newSpeed = CREEP_SPEED;
      }
    }

    if (newSpeed > speedLimit) {
        const brakeForce = BRAKE_RATE * 1.5 * delta;
        newSpeed = Math.max(speedLimit, newSpeed - brakeForce);
    }

    if (newSpeed < 0) newSpeed = 0;
    if (newSpeed > MAX_SPEED) newSpeed = MAX_SPEED;

    setCurrentSpeed(newSpeed);
    
    if (engineRef.current) {
        engineRef.current.setSpeed(newSpeed);
    }

    if (newSpeed > 0) {
      updateDistance(newSpeed * delta);
    }
  });

  return null;
};

export const CameraRig = () => {
  const { camera } = useThree();
  const startPos = useMemo(() => CAMERA_POS.clone(), []);
  
  useFrame((state) => {
    const { currentSpeed, isCrashing } = useGameStore.getState();

    const t = state.clock.elapsedTime;
    let shakeIntensity = currentSpeed > 0 ? 0.05 * (currentSpeed / 100) : 0;
    
    if (isCrashing) {
      shakeIntensity = 0.5;
    }

    const shakeY = Math.sin(t * 30) * shakeIntensity * 0.5;
    const shakeX = Math.cos(t * 25) * shakeIntensity * 0.3;

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, shakeX, 0.1);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, startPos.y + shakeY, 0.1);
    
    if (isCrashing) {
       camera.position.z = THREE.MathUtils.lerp(camera.position.z, startPos.z - 5, 0.05);
    } else {
       camera.position.z = THREE.MathUtils.lerp(camera.position.z, startPos.z + (currentSpeed * 0.02), 0.05);
    }
    
    camera.lookAt(0, 0, -5);
  });

  return null;
};
