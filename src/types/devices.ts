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

/**
 * Possible roles for a network device
 */
export type DeviceRole = 'spine' | 'leaf';

/**
 * Base Device interface
 * Includes all common properties for network devices
 */
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
  
  // New fields for unified device model
  downlinkOptions?: string[];  // Optional for spine devices
  roles?: DeviceRole[];        // Which roles this device can fulfill
}

/**
 * Legacy interface for backward compatibility
 * @deprecated Use Device interface with downlinkOptions instead
 */
export interface LeafDevice extends Device {
  downlinkOptions: string[];  // Required for leaf devices
}

/**
 * Legacy catalog structure
 * Will be enhanced with a unified view
 */
export interface DeviceCatalog {
  spine: Device[];
  leaf: LeafDevice[];
}

/**
 * Helper functions for working with the unified device model
 */

/**
 * Check if a device can function in a specific role
 */
export function canFulfillRole(device: Device, role: DeviceRole): boolean {
  // If roles are explicitly defined, check them
  if (device.roles && device.roles.length > 0) {
    return device.roles.includes(role);
  }
  
  // Legacy determination based on device structure
  if (role === 'leaf') {
    return Array.isArray(device.downlinkOptions) && device.downlinkOptions.length > 0;
  }
  
  // Default: spine doesn't need special properties
  return true;
}

/**
 * Get device roles based on device properties
 */
export function getDeviceRoles(device: Device): DeviceRole[] {
  // If roles are explicitly defined, use them
  if (device.roles && device.roles.length > 0) {
    return [...device.roles];
  }
  
  // Legacy determination
  const roles: DeviceRole[] = ['spine'];
  if (Array.isArray(device.downlinkOptions) && device.downlinkOptions.length > 0) {
    roles.push('leaf');
  }
  
  return roles;
}
