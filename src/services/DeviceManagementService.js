import localforage from 'localforage';
import builtInDeviceCatalog, { 
  getDeviceById as getBuiltInDeviceById,
  getDevicesByType as getBuiltInDevicesByType,
  getManufacturers as getBuiltInManufacturers,
  getDevicesByManufacturer as getBuiltInDevicesByManufacturer
} from '../data/deviceCatalog';

// Storage keys
const CUSTOM_DEVICES_KEY = 'customDevices';

// Initialize custom devices storage
const initializeCustomDevices = async () => {
  const customDevices = await localforage.getItem(CUSTOM_DEVICES_KEY);
  if (!customDevices) {
    await localforage.setItem(CUSTOM_DEVICES_KEY, { spine: [], leaf: [] });
    return { spine: [], leaf: [] };
  }
  return customDevices;
};

// Get all devices (built-in + custom)
export const getAllDevices = async () => {
  const customDevices = await initializeCustomDevices();
  
  return {
    spine: [...builtInDeviceCatalog.spine, ...customDevices.spine],
    leaf: [...builtInDeviceCatalog.leaf, ...customDevices.leaf]
  };
};

// Get a device by ID (from both built-in and custom)
export const getDeviceById = async (deviceType, deviceId) => {
  // First check built-in devices
  const builtInDevice = getBuiltInDeviceById(deviceType, deviceId);
  if (builtInDevice) {
    return { ...builtInDevice, isBuiltIn: true };
  }
  
  // Then check custom devices
  const customDevices = await initializeCustomDevices();
  const customDevice = customDevices[deviceType]?.find(device => device.id === deviceId);
  
  return customDevice ? { ...customDevice, isBuiltIn: false } : null;
};

// Get all devices of a specific type (built-in + custom)
export const getDevicesByType = async (deviceType) => {
  const builtInDevices = getBuiltInDevicesByType(deviceType).map(device => ({ ...device, isBuiltIn: true }));
  const customDevices = await initializeCustomDevices();
  const customDevicesOfType = customDevices[deviceType]?.map(device => ({ ...device, isBuiltIn: false })) || [];
  
  return [...builtInDevices, ...customDevicesOfType];
};

// Get all manufacturers (built-in + custom)
export const getManufacturers = async (deviceType) => {
  const builtInManufacturers = getBuiltInManufacturers(deviceType);
  const customDevices = await initializeCustomDevices();
  const customManufacturers = [...new Set(customDevices[deviceType]?.map(device => device.manufacturer) || [])];
  
  return [...new Set([...builtInManufacturers, ...customManufacturers])];
};

// Get devices by manufacturer (built-in + custom)
export const getDevicesByManufacturer = async (deviceType, manufacturer) => {
  const builtInDevices = getBuiltInDevicesByManufacturer(deviceType, manufacturer).map(device => ({ ...device, isBuiltIn: true }));
  const customDevices = await initializeCustomDevices();
  const customDevicesOfManufacturer = customDevices[deviceType]?.filter(device => device.manufacturer === manufacturer).map(device => ({ ...device, isBuiltIn: false })) || [];
  
  return [...builtInDevices, ...customDevicesOfManufacturer];
};

// Generate a unique ID for a new device
const generateDeviceId = (manufacturer, model) => {
  const baseId = `${manufacturer.toLowerCase()}-${model.toLowerCase().replace(/\s+/g, '-')}`;
  const timestamp = Date.now();
  return `${baseId}-${timestamp}`;
};

// Add a new custom device
export const addDevice = async (deviceType, deviceData) => {
  if (!deviceData.manufacturer || !deviceData.model) {
    throw new Error('Manufacturer and model are required');
  }
  
  const customDevices = await initializeCustomDevices();
  
  // Generate a unique ID
  const id = generateDeviceId(deviceData.manufacturer, deviceData.model);
  
  // Create the new device
  const newDevice = {
    ...deviceData,
    id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Add to custom devices
  customDevices[deviceType] = [...(customDevices[deviceType] || []), newDevice];
  
  // Save to storage
  await localforage.setItem(CUSTOM_DEVICES_KEY, customDevices);
  
  return newDevice;
};

// Update an existing custom device
export const updateDevice = async (deviceType, deviceId, deviceData) => {
  const customDevices = await initializeCustomDevices();
  
  // Check if device exists and is a custom device
  const deviceIndex = customDevices[deviceType]?.findIndex(device => device.id === deviceId);
  
  if (deviceIndex === -1 || deviceIndex === undefined) {
    throw new Error('Cannot update a built-in device or device not found');
  }
  
  // Update the device
  const updatedDevice = {
    ...customDevices[deviceType][deviceIndex],
    ...deviceData,
    id: deviceId, // Ensure ID doesn't change
    updatedAt: new Date().toISOString()
  };
  
  customDevices[deviceType][deviceIndex] = updatedDevice;
  
  // Save to storage
  await localforage.setItem(CUSTOM_DEVICES_KEY, customDevices);
  
  return updatedDevice;
};

// Delete a custom device
export const deleteDevice = async (deviceType, deviceId) => {
  const customDevices = await initializeCustomDevices();
  
  // Check if device exists and is a custom device
  const deviceExists = customDevices[deviceType]?.some(device => device.id === deviceId);
  
  if (!deviceExists) {
    throw new Error('Cannot delete a built-in device or device not found');
  }
  
  // Remove the device
  customDevices[deviceType] = customDevices[deviceType].filter(device => device.id !== deviceId);
  
  // Save to storage
  await localforage.setItem(CUSTOM_DEVICES_KEY, customDevices);
  
  return true;
};

// Check if a device is built-in
export const isBuiltInDevice = (deviceType, deviceId) => {
  return !!getBuiltInDeviceById(deviceType, deviceId);
};

// Create a device template with default values
export const createDeviceTemplate = (deviceType) => {
  const baseTemplate = {
    manufacturer: '',
    model: '',
    description: '',
    portConfigurations: [
      { count: 32, speed: '400G', breakoutOptions: ['1x400G', '4x100G'] }
    ],
    powerConsumption: { typical: 500, max: 1000 },
    rackUnits: deviceType === 'spine' ? 2 : 1,
    cost: deviceType === 'spine' ? 40000 : 25000,
    thermalOutput: 5000,
    weight: deviceType === 'spine' ? 12 : 8,
    dimensions: { height: deviceType === 'spine' ? 8.9 : 4.4, width: 44.5, depth: 52.0 }
  };
  
  // Add leaf-specific properties
  if (deviceType === 'leaf') {
    baseTemplate.downlinkOptions = ['10G', '25G', '40G', '100G', '400G'];
  }
  
  return baseTemplate;
};

// Clone an existing device
export const cloneDevice = async (deviceType, deviceId) => {
  // Get the device to clone
  const sourceDevice = await getDeviceById(deviceType, deviceId);
  
  if (!sourceDevice) {
    throw new Error('Source device not found');
  }
  
  // Create a clone with a new model name and ID
  const clonedDevice = {
    ...sourceDevice,
    model: `${sourceDevice.model} (Clone)`,
    description: `${sourceDevice.description} (Cloned)`,
    isBuiltIn: undefined // Remove the isBuiltIn flag
  };
  
  // Add the cloned device
  return await addDevice(deviceType, clonedDevice);
};

// Add a new manufacturer
export const addManufacturer = async (deviceType, manufacturerName) => {
  if (!manufacturerName) {
    throw new Error('Manufacturer name is required');
  }
  
  // Check if manufacturer already exists
  const manufacturers = await getManufacturers(deviceType);
  if (manufacturers.includes(manufacturerName)) {
    throw new Error('Manufacturer already exists');
  }
  
  // Create a template device for this manufacturer
  const templateDevice = createDeviceTemplate(deviceType);
  templateDevice.manufacturer = manufacturerName;
  templateDevice.model = 'Default Model';
  
  // Add the device
  await addDevice(deviceType, templateDevice);
  
  return manufacturerName;
};

// Create a named object for export
const DeviceManagementService = {
  // Async versions for direct use
  getAllDevices,
  getDeviceById,
  getDevicesByType,
  getManufacturers,
  getDevicesByManufacturer,
  addDevice,
  updateDevice,
  deleteDevice,
  isBuiltInDevice,
  createDeviceTemplate,
  addManufacturer,
  cloneDevice,
  
  // Sync versions for backward compatibility
  sync: {
    getDeviceById: getBuiltInDeviceById,
    getDevicesByType: getBuiltInDevicesByType,
    getManufacturers: getBuiltInManufacturers,
    getDevicesByManufacturer: getBuiltInDevicesByManufacturer
  }
};

// Export the named object
export default DeviceManagementService;
