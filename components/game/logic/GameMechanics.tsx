
import React, { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGameStore, VEHICLE_SPECS } from '../../../store/gameStore';
import { EngineSynthesizer, playSfx } from '../../../utils/audio';
import * as THREE from 'three';

const CAMERA_POS = new THREE.Vector3(0, 8, 15);

export const PhysicsController = ({ playerLane }: { playerLane: number }) => {
  const { 
    gameStatus, 
    setCurrentSpeed, 
    updateDistance, 
    activeModal,
    setControl,
    isEngineSoundOn,
    vehicleType,
    vehicleUpgrades,
    selectedRoute,
    setBrakeTemp,
    brakeTemp,
    overlapTimer,
    setOverlapTimer,
    endGame,
    happiness,
    isCrashing
  } = useGameStore();

  const engineRef = useRef<EngineSynthesizer | null>(null);

  // LOGGING
  useEffect(() => {
      console.log("[PhysicsController] Mounted.");
  }, []);

  // --- SPEED CALCULATION WITH UPGRADES ---
  const vType = vehicleType || '14-seater';
  const spec = VEHICLE_SPECS[vType];
  
  const upgrades = (vehicleUpgrades && vehicleUpgrades[vType]) 
      ? vehicleUpgrades[vType] 
      : { engineLevel: 0, licenseLevel: 0, suspensionLevel: 0 };
  
  const speedMultiplier = 1 + (upgrades.engineLevel * 0.15);
  const maxSpeedKmh = spec.maxSpeedKmh * speedMultiplier;
  const MAX_SPEED = maxSpeedKmh / 1.6; 
  
  const ACCEL_RATE = 40 * (1 + (upgrades.engineLevel * 0.1));
  const BRAKE_RATE = 80;
  const FRICTION_RATE = 15;
  const CREEP_SPEED = 5;
  
  const isEscarpment = selectedRoute?.id === 'maimahiu-escarpment';
  const isRongai = selectedRoute?.id === 'rongai-extreme';
  const isRiverRoad = selectedRoute?.id === 'river-road';
  
  const GRAVITY_ACCEL = 10;
  const BRAKE_HEAT_RATE = 30;
  const BRAKE_COOL_RATE = 10;
  const BRAKE_FADE_THRESHOLD = 70;
  const OVERLAP_LIMIT_SECONDS = 8;

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
    if (gameStatus !== 'PLAYING' || activeModal !== 'NONE' || isCrashing) {
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
    let newBrakeTemp = brakeTemp;

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

    const isIllegalDriving = (isRongai && playerLane === -2) || (isRiverRoad && Math.abs(playerLane) === 2);

    if (isIllegalDriving) {
        const newTimer = overlapTimer + delta;
        setOverlapTimer(newTimer);
        
        const newHappiness = Math.max(0, happiness - (5 * delta));
        
        if (state.clock.elapsedTime % 0.5 < delta) {
             useGameStore.setState({ happiness: newHappiness });
        }

        if (Math.floor(newTimer) > Math.floor(overlapTimer)) {
            if (newTimer > 2) {
                 playSfx('SIREN');
            }
        }

        if (newTimer > OVERLAP_LIMIT_SECONDS) {
            endGame('ARRESTED');
        }

    } else {
        if (overlapTimer > 0) {
            setOverlapTimer(Math.max(0, overlapTimer - delta * 2));
        }
    }

    if (isAccelerating) {
      newSpeed += ACCEL_RATE * delta;
      newBrakeTemp = Math.max(0, newBrakeTemp - BRAKE_COOL_RATE * delta);
    } else if (isBraking) {
      let efficiency = 1.0;
      if (isEscarpment) {
        newBrakeTemp = Math.min(100, newBrakeTemp + BRAKE_HEAT_RATE * delta);
        if (newBrakeTemp > BRAKE_FADE_THRESHOLD) {
           const overheatFactor = (newBrakeTemp - BRAKE_FADE_THRESHOLD) / (100 - BRAKE_FADE_THRESHOLD);
           efficiency = 1.0 - (overheatFactor * 0.8);
        }
      }
      newSpeed -= BRAKE_RATE * efficiency * delta;
    } else {
      if (isEscarpment) {
         newSpeed += GRAVITY_ACCEL * delta;
         newBrakeTemp = Math.max(0, newBrakeTemp - BRAKE_COOL_RATE * delta);
      } else {
         if (newSpeed > CREEP_SPEED) {
            newSpeed -= FRICTION_RATE * delta;
         } else if (newSpeed < CREEP_SPEED) {
            newSpeed += FRICTION_RATE * delta;
            if (newSpeed > CREEP_SPEED) newSpeed = CREEP_SPEED;
         }
      }
    }
    
    if (brakeTemp !== newBrakeTemp) {
        setBrakeTemp(newBrakeTemp);
    }

    if (newSpeed > speedLimit) {
        const brakeForce = BRAKE_RATE * 1.5 * delta;
        newSpeed = Math.max(speedLimit, newSpeed - brakeForce);
    }

    if (newSpeed < 0) newSpeed = 0;
    
    const absoluteMax = isEscarpment ? MAX_SPEED * 1.3 : MAX_SPEED;
    if (newSpeed > absoluteMax) newSpeed = absoluteMax;

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
  // Using useState initializer instead of useMemo to be safer
  const [startPos] = useState(() => CAMERA_POS.clone());
  const selectedRoute = useGameStore(state => state.selectedRoute);
  
  const isEscarpment = selectedRoute?.id === 'maimahiu-escarpment';
  const baseRotationX = isEscarpment ? -0.1 : 0; 

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
    
    camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, baseRotationX, 0.05);
    const targetY = isEscarpment ? -4 : 0;
    camera.lookAt(0, targetY, -5);
  });

  return null;
};
