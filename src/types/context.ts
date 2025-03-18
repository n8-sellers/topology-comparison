/**
 * Types for React context providers
 */

import { ReactNode } from 'react';
import { Topology } from './topology';

export interface TopologyContextType {
  topologies: Topology[];
  currentTopology: Topology | null;
  comparisonTopologies: string[];
  loading: boolean;
  createTopology: () => Topology;
  createTopologyFromTemplate: (templateName: string) => Topology;
  updateTopology: (updatedTopology: Topology) => Topology;
  deleteTopology: (topologyId: string) => void;
  toggleComparisonTopology: (topologyId: string) => void;
  duplicateTopology: (topologyId: string) => Topology | null;
  getTopologyById: (topologyId: string) => Topology | null;
  getComparisonTopologies: () => Topology[];
  importTopology: (file: File) => Promise<Topology>;
  setCurrentTopology: (topology: Topology) => void;
  templates: Topology[];
}

export interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export interface ProviderProps {
  children: ReactNode;
}
