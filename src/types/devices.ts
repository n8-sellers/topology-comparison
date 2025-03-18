/**
 * Types for device catalog and device management
 */

export interface PortConfiguration {
  count: number;
  speed: string;
  breakoutOptions: string[];
}

export interface PowerConsumption {
  typical: number;
  max: number;
}

export interface Dimensions {
  height: number;
  width: number;
  depth: number;
}

export interface Device {
  id: string;
  manufacturer: string;
  model: string;
  description: string;
  portConfigurations: PortConfiguration[];
  powerConsumption: PowerConsumption;
  rackUnits: number;
  cost: number;
  thermalOutput: number;
  weight: number;
  dimensions: Dimensions;
  imageUrl?: string;
  isBuiltIn?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeafDevice extends Device {
  downlinkOptions: string[];
}

export interface DeviceCatalog {
  spine: Device[];
  leaf: LeafDevice[];
}
