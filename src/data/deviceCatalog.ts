/**
 * Device Catalog
 * 
 * This file contains a catalog of network devices with their specifications.
 * The catalog is organized by device type (spine, leaf) and includes detailed
 * specifications for each device model.
 * 
 * The catalog has been enhanced to support a unified device model where devices
 * can fulfill multiple roles (spine, leaf) based on their capabilities.
 */

import { 
  Device, 
  LeafDevice, 
  DeviceCatalog, 
  DeviceRole,
  canFulfillRole,
  getDeviceRoles
} from '../types/devices';

/**
 * The original device catalog structure maintained for backward compatibility
 */
const deviceCatalog: DeviceCatalog = {
  spine: [
    {
      id: "arista-7800r3",
      manufacturer: "Arista",
      model: "7800R3",
      description: "Modular Data Center Spine Switch",
      portConfigurations: [
        { count: 32, speed: "400G", breakoutOptions: ["1x400G", "4x100G"] },
        { count: 64, speed: "800G", breakoutOptions: ["1x800G", "2x400G", "4x200G", "8x100G"] }
      ],
      powerConsumption: { typical: 1200, max: 2000 }, // Watts
      rackUnits: 2,
      cost: 45000,
      thermalOutput: 6824, // BTU/hr
      weight: 13.6, // kg
      dimensions: { height: 8.9, width: 44.5, depth: 54.6 }, // cm
      imageUrl: "/images/devices/arista-7800r3.jpg"
    },
    {
      id: "cisco-8000",
      manufacturer: "Cisco",
      model: "8000 Series",
      description: "High-performance Spine Switch",
      portConfigurations: [
        { count: 32, speed: "400G", breakoutOptions: ["1x400G", "4x100G"] },
        { count: 64, speed: "400G", breakoutOptions: ["1x400G", "4x100G"] }
      ],
      powerConsumption: { typical: 1100, max: 1800 }, // Watts
      rackUnits: 2,
      cost: 42000,
      thermalOutput: 6140, // BTU/hr
      weight: 14.2, // kg
      dimensions: { height: 8.9, width: 44.5, depth: 57.1 }, // cm
      imageUrl: "/images/devices/cisco-8000.jpg"
    },
    {
      id: "juniper-qfx10008",
      manufacturer: "Juniper",
      model: "QFX10008",
      description: "Scalable Spine Switch",
      portConfigurations: [
        { count: 32, speed: "400G", breakoutOptions: ["1x400G", "4x100G"] },
        { count: 64, speed: "400G", breakoutOptions: ["1x400G", "4x100G"] }
      ],
      powerConsumption: { typical: 1300, max: 2200 }, // Watts
      rackUnits: 3,
      cost: 48000,
      thermalOutput: 7500, // BTU/hr
      weight: 15.8, // kg
      dimensions: { height: 13.3, width: 44.5, depth: 60.0 }, // cm
      imageUrl: "/images/devices/juniper-qfx10008.jpg"
    },
    {
      id: "nvidia-spectrum4",
      manufacturer: "NVIDIA",
      model: "Spectrum-4",
      description: "Next-Gen Spine Switch",
      portConfigurations: [
        { count: 32, speed: "800G", breakoutOptions: ["1x800G", "2x400G", "4x200G", "8x100G"] },
        { count: 64, speed: "800G", breakoutOptions: ["1x800G", "2x400G", "4x200G", "8x100G"] }
      ],
      powerConsumption: { typical: 1000, max: 1700 }, // Watts
      rackUnits: 2,
      cost: 50000,
      thermalOutput: 5800, // BTU/hr
      weight: 12.5, // kg
      dimensions: { height: 8.9, width: 44.5, depth: 52.0 }, // cm
      imageUrl: "/images/devices/nvidia-spectrum4.jpg"
    }
  ],
  leaf: [
    {
      id: "arista-7050x4",
      manufacturer: "Arista",
      model: "7050X4",
      description: "High-density Leaf Switch",
      portConfigurations: [
        { count: 32, speed: "400G", breakoutOptions: ["1x400G", "4x100G"] },
        { count: 64, speed: "100G", breakoutOptions: ["1x100G", "4x25G"] }
      ],
      downlinkOptions: ["10G", "25G", "40G", "100G", "400G"],
      powerConsumption: { typical: 650, max: 1200 }, // Watts
      rackUnits: 1,
      cost: 28000,
      thermalOutput: 4095, // BTU/hr
      weight: 9.8, // kg
      dimensions: { height: 4.4, width: 44.5, depth: 52.5 }, // cm
      imageUrl: "/images/devices/arista-7050x4.jpg"
    },
    {
      id: "cisco-nexus-9364d",
      manufacturer: "Cisco",
      model: "Nexus 9364D",
      description: "High-performance Leaf Switch",
      portConfigurations: [
        { count: 64, speed: "400G", breakoutOptions: ["1x400G", "4x100G"] },
        { count: 32, speed: "400G", breakoutOptions: ["1x400G", "4x100G"] }
      ],
      downlinkOptions: ["10G", "25G", "40G", "100G", "400G"],
      powerConsumption: { typical: 800, max: 1500 }, // Watts
      rackUnits: 1,
      cost: 32000,
      thermalOutput: 5118, // BTU/hr
      weight: 10.2, // kg
      dimensions: { height: 4.4, width: 44.5, depth: 57.1 }, // cm
      imageUrl: "/images/devices/cisco-nexus-9364d.jpg"
    },
    {
      id: "juniper-qfx5130",
      manufacturer: "Juniper",
      model: "QFX5130",
      description: "Versatile Leaf Switch",
      portConfigurations: [
        { count: 32, speed: "400G", breakoutOptions: ["1x400G", "4x100G"] },
        { count: 64, speed: "100G", breakoutOptions: ["1x100G", "4x25G"] }
      ],
      downlinkOptions: ["10G", "25G", "40G", "100G", "400G"],
      powerConsumption: { typical: 700, max: 1300 }, // Watts
      rackUnits: 1,
      cost: 30000,
      thermalOutput: 4436, // BTU/hr
      weight: 9.5, // kg
      dimensions: { height: 4.4, width: 44.5, depth: 53.3 }, // cm
      imageUrl: "/images/devices/juniper-qfx5130.jpg"
    },
    {
      id: "nvidia-spectrum3",
      manufacturer: "NVIDIA",
      model: "Spectrum-3",
      description: "High-performance Leaf Switch",
      portConfigurations: [
        { count: 32, speed: "400G", breakoutOptions: ["1x400G", "4x100G"] },
        { count: 64, speed: "200G", breakoutOptions: ["1x200G", "2x100G", "4x50G"] }
      ],
      downlinkOptions: ["10G", "25G", "50G", "100G", "200G", "400G"],
      powerConsumption: { typical: 600, max: 1100 }, // Watts
      rackUnits: 1,
      cost: 29000,
      thermalOutput: 3753, // BTU/hr
      weight: 9.0, // kg
      dimensions: { height: 4.4, width: 44.5, depth: 51.0 }, // cm
      imageUrl: "/images/devices/nvidia-spectrum3.jpg"
    }
  ]
};

// Helper function to get a device by ID
export const getDeviceById = (deviceType: 'spine' | 'leaf', deviceId: string): Device | LeafDevice | null => {
  if (!deviceCatalog[deviceType]) return null;
  return deviceCatalog[deviceType].find(device => device.id === deviceId) || null;
};

// Helper function to get all devices of a specific type
export const getDevicesByType = (deviceType: 'spine' | 'leaf'): Device[] | LeafDevice[] => {
  return deviceCatalog[deviceType] || [];
};

// Helper function to get all manufacturers
export const getManufacturers = (deviceType: 'spine' | 'leaf'): string[] => {
  if (!deviceCatalog[deviceType]) return [];
  return [...new Set(deviceCatalog[deviceType].map(device => device.manufacturer))];
};

// Helper function to get devices by manufacturer
export const getDevicesByManufacturer = (deviceType: 'spine' | 'leaf', manufacturer: string): Device[] | LeafDevice[] => {
  if (!deviceCatalog[deviceType]) return [];
  return deviceCatalog[deviceType].filter(device => device.manufacturer === manufacturer);
};

/**
 * NEW UNIFIED DEVICE MODEL FUNCTIONS
 * These functions provide a unified view of devices across roles
 */

/**
 * Get all devices available in the catalog (both spine and leaf)
 */
export const getAllDevices = (): Device[] => {
  // Combine spine and leaf devices, ensuring no duplicates by ID
  const allDevices = [...deviceCatalog.spine];
  const spineIds = new Set(allDevices.map(d => d.id));
  
  // Only add leaf devices that aren't already in the spine list
  deviceCatalog.leaf.forEach(leafDevice => {
    if (!spineIds.has(leafDevice.id)) {
      allDevices.push(leafDevice);
    }
  });
  
  return allDevices;
};

/**
 * Get all devices that can fulfill a specific role
 */
export const getDevicesByRole = (role: DeviceRole): Device[] => {
  return getAllDevices().filter(device => canFulfillRole(device, role));
};

/**
 * Get all devices by manufacturer that can fulfill a specific role
 */
export const getDevicesByManufacturerAndRole = (manufacturer: string, role: DeviceRole): Device[] => {
  return getDevicesByRole(role).filter(device => device.manufacturer === manufacturer);
};

/**
 * Get all manufacturers that have devices for a specific role
 */
export const getManufacturersByRole = (role: DeviceRole): string[] => {
  const devices = getDevicesByRole(role);
  return [...new Set(devices.map(device => device.manufacturer))];
};

/**
 * Assign explicit roles to devices in the catalog
 * This is for internal use to initialize the unified model
 */
const assignExplicitRoles = () => {
  // Assign roles to spine devices
  deviceCatalog.spine.forEach(device => {
    device.roles = ['spine'];
    
    // Check if this device can also work as a leaf
    if (device.downlinkOptions && device.downlinkOptions.length > 0) {
      device.roles.push('leaf');
    }
  });
  
  // Assign roles to leaf devices
  deviceCatalog.leaf.forEach(device => {
    // Always add 'leaf' role
    device.roles = ['leaf'];
    
    // Some high-performance leaf switches might also work as spines
    // This is just a placeholder logic - you'd have real criteria
    const highSpeedPorts = device.portConfigurations.some(
      config => config.speed === "400G" || config.speed === "800G"
    );
    
    if (highSpeedPorts) {
      device.roles.push('spine');
    }
  });
};

// Initialize roles when the module is loaded
assignExplicitRoles();

export default deviceCatalog;
