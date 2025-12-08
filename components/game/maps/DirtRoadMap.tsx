
import React from 'react';
import { Road, Scenery, StageMarker, PoliceMarker } from '../environment/WorldAssets';

export const DirtRoadMap = () => {
  return (
    <group>
      {/* Rural Scenery: Rocks, Trees, No Buildings */}
      <Scenery variant="RURAL" />
      
      {/* Brown Dusty Road */}
      <Road variant="RURAL" />
      
      {/* Game Markers */}
      <StageMarker />
      <PoliceMarker />
    </group>
  );
};
