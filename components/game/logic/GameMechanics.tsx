
import React, { useEffect, useRef, useMemo } from 'react';
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

  // Convert KMH to Game Units (Approx 1.6 ratio based on original logic)
  const spec = vehicleType ? VEHICLE_SPECS[vehicleType] : VEHICLE_SPECS['14-seater'];
  const MAX_SPEED = spec.maxSpeedKmh / 1.6; 
  
  const ACCEL_RATE = 40;
  const BRAKE_RATE = 80;
  const FRICTION_RATE = 15;
  const CREEP_SPEED = 5;
  
  // Map Specifics
  const isEscarpment = selectedRoute?.id === 'maimahiu-escarpment';
  const isRongai = selectedRoute?.id === 'rongai-extreme';
  const isRiverRoad = selectedRoute?.id === 'river-road';
  
  const GRAVITY_ACCEL = 10; // Downhill roll speed
  const BRAKE_HEAT_RATE = 30; // Heat per second while braking
  const BRAKE_COOL_RATE = 10; // Cool per second while not braking
  const BRAKE_FADE_THRESHOLD = 70; // Temperature where brakes start failing
  
  // Overlap Mechanics
  const OVERLAP_LIMIT_SECONDS = 8;

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

    // --- ILLEGAL LANE LOGIC (Penalty System) ---
    // Rongai: Lane -2 is the overlap/dirt lane.
    // River Road: Lane 2 and -2 are the sidewalks.
    const isIllegalDriving = (isRongai && playerLane === -2) || (isRiverRoad && Math.abs(playerLane) === 2);

    if (isIllegalDriving) {
        const newTimer = overlapTimer + delta;
        setOverlapTimer(newTimer);
        
        // Penalty: Happiness Drop (Passengers scared of bumps/police/sidewalks)
        // Drop 5 happiness per second
        const newHappiness = Math.max(0, happiness - (5 * delta));
        
        // Apply Happiness update immediately
        if (state.clock.elapsedTime % 0.5 < delta) {
             useGameStore.setState({ happiness: newHappiness });
        }

        // Warning Sound
        if (Math.floor(newTimer) > Math.floor(overlapTimer)) {
            if (newTimer > 2) {
                 playSfx('SIREN');
            }
        }

        // Punishment: Arrest
        if (newTimer > OVERLAP_LIMIT_SECONDS) {
            endGame('ARRESTED');
        }

    } else {
        // Cooldown if back on road
        if (overlapTimer > 0) {
            setOverlapTimer(Math.max(0, overlapTimer - delta * 2)); // Cools down 2x faster
        }
    }


    // --- Physics Update ---

    if (isAccelerating) {
      newSpeed += ACCEL_RATE * delta;
      
      // Cooling brakes while accelerating
      newBrakeTemp = Math.max(0, newBrakeTemp - BRAKE_COOL_RATE * delta);

    } else if (isBraking) {
      // Calculate Brake Efficiency based on Temp
      let efficiency = 1.0;
      if (isEscarpment) {
        newBrakeTemp = Math.min(100, newBrakeTemp + BRAKE_HEAT_RATE * delta);
        if (newBrakeTemp > BRAKE_FADE_THRESHOLD) {
           // Efficiency drops from 100% to 20% as temp goes from 70 to 100
           const overheatFactor = (newBrakeTemp - BRAKE_FADE_THRESHOLD) / (100 - BRAKE_FADE_THRESHOLD);
           efficiency = 1.0 - (overheatFactor * 0.8);
        }
      }
      
      newSpeed -= BRAKE_RATE * efficiency * delta;
    
    } else {
      // Friction / Coasting
      
      if (isEscarpment) {
         // Gravity pull downhill overrides friction if moving
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
    
    // Update global brake temp
    if (brakeTemp !== newBrakeTemp) {
        setBrakeTemp(newBrakeTemp);
    }

    if (newSpeed > speedLimit) {
        const brakeForce = BRAKE_RATE * 1.5 * delta;
        newSpeed = Math.max(speedLimit, newSpeed - brakeForce);
    }

    if (newSpeed < 0) newSpeed = 0;
    
    // Allow overspeeding on escarpment due to gravity, but cap absolute max to avoid glitching
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
  const startPos = useMemo(() => CAMERA_POS.clone(), []);
  const selectedRoute = useGameStore(state => state.selectedRoute);
  
  // Tilt camera slightly down for Escarpment to simulate downhill view
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
    
    // Look at slightly modified target
    camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, baseRotationX, 0.05);
    
    // Normally lookAt overrides rotation, but if we don't use lookAt every frame or use a target object:
    // Actually R3F LookAt is cleaner. Let's just adjust the lookAt target Y
    const targetY = isEscarpment ? -4 : 0;
    camera.lookAt(0, targetY, -5);
  });

  return null;
};
