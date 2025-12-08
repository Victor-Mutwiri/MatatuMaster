
import React from 'react';
import { Road, Scenery, StageMarker, PoliceMarker } from '../environment/WorldAssets';

export const LimuruRoadMap = () => {
  return (
    <group>
      {/* Standard City/Tarmac Road but in a rural setting */}
      <Road variant="CITY" />
      
      {/* Rural Scenery to give the Limuru vibe (Tea fields, trees) */}
      <Scenery variant="RURAL" />
      
      {/* Game Markers */}
      <StageMarker />
      <PoliceMarker />
    </group>
  );
};
