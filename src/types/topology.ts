/**
 * Types for the topology domain model
 */

export interface Topology {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  configuration: TopologyConfiguration;
  importedAt?: string;
  exportedAt?: string;
  exportVersion?: string;
}

export interface LinkType {
  type: string;
  count: number;
}

export interface BreakoutOptionLegacy {
  type: string;
  enabled: boolean;
}

export interface TopologyConfiguration {
  numSpines: number;
  numLeafs: number;
  numTiers: number;
  spineConfig: SpineConfig;
  leafConfig: LeafConfig;
  breakoutOptions: BreakoutOptions | BreakoutOptionLegacy[];
  disjointedSpines: boolean;
  railOptimized: boolean;
  // Parallel Links feature
  parallelLinksEnabled?: boolean;     // Feature toggle (default: false)
  parallelLinksPerSpine?: number;     // Manual override (optional)
  parallelLinksMode?: 'auto' | 'manual'; // Default: 'auto'
  switchCost: SwitchCost;
  opticsCost: OpticsCost;      // Keep as an object
  opticsPower?: number;        // Optional property for simplified optics power (per unit)
  powerUsage: PowerUsage;
  latencyParameters: LatencyParameters;
  rackSpaceParameters: RackSpaceParameters;
  deviceSelection?: DeviceSelection;
  linkTypes?: LinkType[]; // Legacy property for backward compatibility
}

export interface SpineConfig {
  portCount: number;
  portSpeed: string;
  breakoutMode: string;
}

export interface LeafConfig {
  portCount: number;
  downlinkSpeed: string;
  breakoutMode: string;  // Mode for breaking out downlink ports (e.g., 1x100G, 4x25G)
}

export interface BreakoutOptions {
  [key: string]: BreakoutOption[];
}

export interface BreakoutOption {
  type: string;
  factor: number;
}

export interface SwitchCost {
  spine: number;
  leaf: number;
}

export interface OpticsCost {
  [key: string]: number;
}

export interface PowerUsage {
  spine: number;
  leaf: number;
  optics: {
    [key: string]: number;
  };
}

export interface LatencyParameters {
  switchLatency: number;
  fiberLatency: number;
}

export interface RackSpaceParameters {
  spineRackUnits: number;
  leafRackUnits: number;
}

export interface DeviceSelection {
  spine?: {
    deviceId: string;
    useDefaultConfig: boolean;
  };
  leaf?: {
    deviceId: string;
    useDefaultConfig: boolean;
  };
}
