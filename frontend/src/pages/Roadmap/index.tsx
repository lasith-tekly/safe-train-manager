/**
 * Roadmap Planning - Main Page
 * 
 * Entry point for roadmap planning feature.
 */
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RoadmapList from './RoadmapList';
import RoadmapDetail from './RoadmapDetail';

const RoadmapPage: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<RoadmapList />} />
      <Route path="/:roadmapId" element={<RoadmapDetail />} />
    </Routes>
  );
};

export default RoadmapPage;
