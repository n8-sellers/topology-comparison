/**
 * Types for calculation metrics
 */

export interface DeviceCount {
  spines: number;
  leafs: number;
  total: number;
}

export interface CostBreakdown {
  switches: {
    spine: number;
    leaf: number;
    total: number;
  };
  optics: number;
  total: number;
}

export interface PowerBreakdown {
  switches: {
    spine: number;
    leaf: number;
    total: number;
  };
  optics: number;
  total: number;
}

export interface LatencyMetrics {
  hops: number;
  switchLatency: number;
  fiberLatency: number;
  total: number;
}

export interface OversubscriptionMetrics {
  uplinkCapacity: number;
  downlinkCapacity: number;
  uplinkPortsPerLeaf: number;
  downlinkPortsPerLeaf: number;
  ratio: string;
}

export interface RackSpaceMetrics {
  spineRackUnits: number;
  leafRackUnits: number;
  totalRackUnits: number;
  racksNeeded: number;
}

export interface CablingMetrics {
  standard: number;
  breakout: number;
  total: number;
}

export interface TopologyMetrics {
  deviceCount: DeviceCount;
  cost: CostBreakdown;
  power: PowerBreakdown;
  latency: LatencyMetrics;
  oversubscription: OversubscriptionMetrics;
  rackSpace: RackSpaceMetrics;
  cabling: CablingMetrics;
}

export interface ComparisonResult {
  id: string;
  name: string;
  metrics: TopologyMetrics;
}
