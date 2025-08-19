import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  TextField,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Chip,
  SelectChangeEvent,
  Badge
} from '@mui/material';
import DeviceSpecificationVisualizer from './DeviceSpecificationVisualizer';
import CostPowerConfigPanel from './CostPowerConfigPanel';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeviceManagementService from '../../services/DeviceManagementService';
import AddManufacturerDialog from './AddManufacturerDialog';
import DeviceFormDialog from './DeviceFormDialog';
import { 
  Device, 
  LeafDevice, 
  DeviceRole,
  canFulfillRole,
  getDeviceRoles
} from '../../types/devices';

// Interface for Topology configuration props
interface DeviceSelectionProps {
  topology: {
    configuration: {
      deviceSelection?: {
        spine?: {
          deviceId?: string;
          useDefaultConfig?: boolean;
          costOverride?: number;
          powerOverride?: number;
          pricingSource?: 'global' | 'device-default' | 'manual';
        };
        leaf?: {
          deviceId?: string;
          useDefaultConfig?: boolean;
          costOverride?: number;
          powerOverride?: number;
          pricingSource?: 'global' | 'device-default' | 'manual';
        };
      };
      spineConfig: {
        portCount: number;
        portSpeed: string;
        breakoutMode: string;
      };
      leafConfig: {
        portCount: number;
        downlinkSpeed: string;
        breakoutMode?: string;
      };
      switchCost: {
        spine: number;
        leaf: number;
      };
      powerUsage: {
        spine: number;
        leaf: number;
      };
      rackSpaceParameters: {
        spineRackUnits: number;
        leafRackUnits: number;
      };
    };
  };
  setTopology: (topology: any) => void;
}

// Interface for device compatibility check result
interface CompatibilityResult {
  compatible: boolean;
  issues: string[];
}

const DeviceSelection = ({ topology, setTopology }: DeviceSelectionProps) => {
  const [spineManufacturers, setSpineManufacturers] = useState<string[]>([]);
  const [leafManufacturers, setLeafManufacturers] = useState<string[]>([]);
  const [spineDevices, setSpineDevices] = useState<Device[]>([]);
  const [leafDevices, setLeafDevices] = useState<LeafDevice[]>([]);
  const [selectedSpineManufacturer, setSelectedSpineManufacturer] = useState<string>('');
  const [selectedLeafManufacturer, setSelectedLeafManufacturer] = useState<string>('');
  const [selectedSpineDevice, setSelectedSpineDevice] = useState<Device | null>(null);
  const [selectedLeafDevice, setSelectedLeafDevice] = useState<LeafDevice | null>(null);
  
  // Dialog states
  const [addManufacturerDialogOpen, setAddManufacturerDialogOpen] = useState<boolean>(false);
  const [deviceFormDialogOpen, setDeviceFormDialogOpen] = useState<boolean>(false);
  const [currentDeviceType, setCurrentDeviceType] = useState<'spine' | 'leaf'>('spine');
  const [currentManufacturer, setCurrentManufacturer] = useState<string>('');
  const [currentDevice, setCurrentDevice] = useState<Device | LeafDevice | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  // Load manufacturers and devices on component mount
  useEffect(() => {
    const loadManufacturers = async () => {
      try {
        // Load manufacturers
        const spineManufacturersList = await DeviceManagementService.getManufacturers('spine');
        const leafManufacturersList = await DeviceManagementService.getManufacturers('leaf');
        
        setSpineManufacturers(spineManufacturersList);
        setLeafManufacturers(leafManufacturersList);
        
        // Set initial selected manufacturers if devices are already selected
        const spineDeviceId = topology.configuration.deviceSelection?.spine?.deviceId;
        const leafDeviceId = topology.configuration.deviceSelection?.leaf?.deviceId;
        
        if (spineDeviceId) {
          const spineDevice = await DeviceManagementService.getDeviceById('spine', spineDeviceId);
          if (spineDevice) {
            setSelectedSpineManufacturer(spineDevice.manufacturer);
            setSelectedSpineDevice(spineDevice as Device);
            const spineDevicesList = await DeviceManagementService.getDevicesByManufacturer('spine', spineDevice.manufacturer);
            setSpineDevices(spineDevicesList as Device[]);
          }
        } else if (spineManufacturersList.length > 0) {
          setSelectedSpineManufacturer(spineManufacturersList[0]);
          const spineDevicesList = await DeviceManagementService.getDevicesByManufacturer('spine', spineManufacturersList[0]);
          setSpineDevices(spineDevicesList as Device[]);
        }
        
        if (leafDeviceId) {
          const leafDevice = await DeviceManagementService.getDeviceById('leaf', leafDeviceId);
          if (leafDevice) {
            setSelectedLeafManufacturer(leafDevice.manufacturer);
            setSelectedLeafDevice(leafDevice as LeafDevice);
            const leafDevicesList = await DeviceManagementService.getDevicesByManufacturer('leaf', leafDevice.manufacturer);
            setLeafDevices(leafDevicesList as LeafDevice[]);
          }
        } else if (leafManufacturersList.length > 0) {
          setSelectedLeafManufacturer(leafManufacturersList[0]);
          const leafDevicesList = await DeviceManagementService.getDevicesByManufacturer('leaf', leafManufacturersList[0]);
          setLeafDevices(leafDevicesList as LeafDevice[]);
        }
      } catch (error) {
        console.error('Error loading manufacturers and devices:', error);
      }
    };
    
    loadManufacturers();
  }, [topology.configuration.deviceSelection]);

  // Handle spine manufacturer change
  const handleSpineManufacturerChange = async (event: SelectChangeEvent) => {
    const manufacturer = event.target.value;
    setSelectedSpineManufacturer(manufacturer);
    
    try {
      const devices = await DeviceManagementService.getDevicesByManufacturer('spine', manufacturer);
      setSpineDevices(devices as Device[]);
      
      // Select the first device by default
      if (devices.length > 0) {
        handleSpineDeviceChange({ target: { value: devices[0].id } } as SelectChangeEvent);
      } else {
        setSelectedSpineDevice(null);
      }
    } catch (error) {
      console.error('Error loading spine devices:', error);
    }
  };

  // Handle leaf manufacturer change
  const handleLeafManufacturerChange = async (event: SelectChangeEvent) => {
    const manufacturer = event.target.value;
    setSelectedLeafManufacturer(manufacturer);
    
    try {
      const devices = await DeviceManagementService.getDevicesByManufacturer('leaf', manufacturer);
      setLeafDevices(devices as LeafDevice[]);
      
      // Select the first device by default
      if (devices.length > 0) {
        handleLeafDeviceChange({ target: { value: devices[0].id } } as SelectChangeEvent);
      } else {
        setSelectedLeafDevice(null);
      }
    } catch (error) {
      console.error('Error loading leaf devices:', error);
    }
  };

  // Check if a device is compatible with the current configuration
  const checkDeviceCompatibility = (device: Device | LeafDevice | null, deviceType: 'spine' | 'leaf'): CompatibilityResult => {
    if (!device) return { compatible: false, issues: ['No device selected'] };
    
    const issues: string[] = [];
    let compatible = true;
    
    if (deviceType === 'spine') {
      const { portCount, portSpeed } = topology.configuration.spineConfig;
      
      // Check if the device supports the configured port count
      const supportedPortCounts = device.portConfigurations.map(config => config.count);
      if (!supportedPortCounts.includes(portCount)) {
        issues.push(`Device does not support ${portCount} ports`);
        compatible = false;
      }
      
      // Check if the device supports the configured port speed
      const supportedSpeeds = device.portConfigurations.flatMap(config => [config.speed]);
      if (!supportedSpeeds.includes(portSpeed)) {
        issues.push(`Device does not support ${portSpeed} speed`);
        compatible = false;
      }
    } else if (deviceType === 'leaf') {
      const { portCount, downlinkSpeed } = topology.configuration.leafConfig;
      const leafDevice = device as LeafDevice;
      
      // Check if the device supports the configured port count
      const supportedPortCounts = device.portConfigurations.map(config => config.count);
      if (!supportedPortCounts.includes(portCount)) {
        issues.push(`Device does not support ${portCount} ports`);
        compatible = false;
      }
      
      // Check if the device supports the configured downlink speed
      if (!leafDevice.downlinkOptions.includes(downlinkSpeed)) {
        issues.push(`Device does not support ${downlinkSpeed} downlink speed`);
        compatible = false;
      }
    }
    
    return { compatible, issues };
  };

  // Apply device defaults to configuration
  const applyDeviceDefaults = (deviceType: 'spine' | 'leaf', device: Device | LeafDevice | null) => {
    if (!device) return;
    
    const updatedTopology = { ...topology };
    
    if (deviceType === 'spine') {
      // Find the port configuration with the highest port count
      const portConfig = device.portConfigurations.reduce(
        (prev, current) => (current.count > prev.count ? current : prev),
        device.portConfigurations[0]
      );
      
      updatedTopology.configuration.spineConfig = {
        portCount: portConfig.count,
        portSpeed: portConfig.speed,
        breakoutMode: portConfig.breakoutOptions[0]
      };
      
      updatedTopology.configuration.rackSpaceParameters.spineRackUnits = device.rackUnits;
    } else if (deviceType === 'leaf') {
      const leafDevice = device as LeafDevice;
      // Find the port configuration with the highest port count
      const portConfig = device.portConfigurations.reduce(
        (prev, current) => (current.count > prev.count ? current : prev),
        device.portConfigurations[0]
      );
      
      updatedTopology.configuration.leafConfig = {
        ...updatedTopology.configuration.leafConfig,
        portCount: portConfig.count,
        downlinkSpeed: leafDevice.downlinkOptions[leafDevice.downlinkOptions.length - 1], // Use the highest speed
        breakoutMode: `1x${leafDevice.downlinkOptions[leafDevice.downlinkOptions.length - 1]}`
      };
      
      updatedTopology.configuration.rackSpaceParameters.leafRackUnits = device.rackUnits;
    }
    
    setTopology(updatedTopology);
  };

  // Handle spine device change
  const handleSpineDeviceChange = async (event: SelectChangeEvent) => {
    const deviceId = event.target.value;
    
    try {
      const device = await DeviceManagementService.getDeviceById('spine', deviceId);
      setSelectedSpineDevice(device as Device);
    
      // Update topology with selected device but don't change configuration
      const updatedTopology = {
        ...topology,
        configuration: {
          ...topology.configuration,
          deviceSelection: {
            ...topology.configuration.deviceSelection,
            spine: {
              deviceId: deviceId,
              useDefaultConfig: false // Default to false - don't automatically apply device defaults
            }
          }
        }
      };
      
      setTopology(updatedTopology);
    } catch (error) {
      console.error('Error loading spine device:', error);
    }
  };

  // Handle leaf device change
  const handleLeafDeviceChange = async (event: SelectChangeEvent) => {
    const deviceId = event.target.value;
    
    try {
      const device = await DeviceManagementService.getDeviceById('leaf', deviceId);
      setSelectedLeafDevice(device as LeafDevice);
    
      // Update topology with selected device but don't change configuration
      const updatedTopology = {
        ...topology,
        configuration: {
          ...topology.configuration,
          deviceSelection: {
            ...topology.configuration.deviceSelection,
            leaf: {
              deviceId: deviceId,
              useDefaultConfig: false // Default to false - don't automatically apply device defaults
            }
          }
        }
      };
      
      setTopology(updatedTopology);
    } catch (error) {
      console.error('Error loading leaf device:', error);
    }
  };

  // Handle adding a new manufacturer
  const handleAddManufacturer = async (deviceType: string, manufacturerName: string) => {
    try {
      await DeviceManagementService.addManufacturer(deviceType as 'spine' | 'leaf', manufacturerName);
      
      // Refresh manufacturers list
      const manufacturers = await DeviceManagementService.getManufacturers(deviceType as 'spine' | 'leaf');
      
      if (deviceType === 'spine') {
        setSpineManufacturers(manufacturers);
        setSelectedSpineManufacturer(manufacturerName);
        
        // Load devices for this manufacturer
        const devices = await DeviceManagementService.getDevicesByManufacturer('spine', manufacturerName);
        setSpineDevices(devices as Device[]);
        
        // Select the first device if available
        if (devices.length > 0) {
          handleSpineDeviceChange({ target: { value: devices[0].id } } as SelectChangeEvent);
        }
      } else {
        setLeafManufacturers(manufacturers);
        setSelectedLeafManufacturer(manufacturerName);
        
        // Load devices for this manufacturer
        const devices = await DeviceManagementService.getDevicesByManufacturer('leaf', manufacturerName);
        setLeafDevices(devices as LeafDevice[]);
        
        // Select the first device if available
        if (devices.length > 0) {
          handleLeafDeviceChange({ target: { value: devices[0].id } } as SelectChangeEvent);
        }
      }
      
      setAddManufacturerDialogOpen(false);
    } catch (error: any) {
      console.error('Error adding manufacturer:', error);
      alert(`Error adding manufacturer: ${error.message}`);
    }
  };

  // Handle adding a new device
  const handleAddDevice = async (deviceType: string, deviceData: Device | LeafDevice) => {
    try {
      const newDevice = await DeviceManagementService.addDevice(deviceType as 'spine' | 'leaf', deviceData);
      
      // Refresh devices list
      if (deviceType === 'spine') {
        const devices = await DeviceManagementService.getDevicesByManufacturer('spine', selectedSpineManufacturer);
        setSpineDevices(devices as Device[]);
        
        // Select the new device
        handleSpineDeviceChange({ target: { value: newDevice.id } } as SelectChangeEvent);
      } else {
        const devices = await DeviceManagementService.getDevicesByManufacturer('leaf', selectedLeafManufacturer);
        setLeafDevices(devices as LeafDevice[]);
        
        // Select the new device
        handleLeafDeviceChange({ target: { value: newDevice.id } } as SelectChangeEvent);
      }
      
      setDeviceFormDialogOpen(false);
    } catch (error: any) {
      console.error('Error adding device:', error);
      alert(`Error adding device: ${error.message}`);
    }
  };

  // Handle editing a device
  const handleEditDevice = async (deviceType: string, deviceData: Device | LeafDevice) => {
    try {
      await DeviceManagementService.updateDevice(deviceType as 'spine' | 'leaf', deviceData.id, deviceData);
      
      // Refresh devices list
      if (deviceType === 'spine') {
        const devices = await DeviceManagementService.getDevicesByManufacturer('spine', selectedSpineManufacturer);
        setSpineDevices(devices as Device[]);
        
        // Update selected device
        if (selectedSpineDevice && selectedSpineDevice.id === deviceData.id) {
          setSelectedSpineDevice(deviceData as Device);
        }
      } else {
        const devices = await DeviceManagementService.getDevicesByManufacturer('leaf', selectedLeafManufacturer);
        setLeafDevices(devices as LeafDevice[]);
        
        // Update selected device
        if (selectedLeafDevice && selectedLeafDevice.id === deviceData.id) {
          setSelectedLeafDevice(deviceData as LeafDevice);
        }
      }
      
      setDeviceFormDialogOpen(false);
    } catch (error: any) {
      console.error('Error updating device:', error);
      alert(`Error updating device: ${error.message}`);
    }
  };

  // Handle cloning a device
  const handleCloneDevice = async (deviceType: 'spine' | 'leaf', deviceId: string) => {
    try {
      const clonedDevice = await DeviceManagementService.cloneDevice(deviceType, deviceId);
      
      // Refresh devices list
      if (deviceType === 'spine') {
        const devices = await DeviceManagementService.getDevicesByManufacturer('spine', selectedSpineManufacturer);
        setSpineDevices(devices as Device[]);
        
        // Select the cloned device
        handleSpineDeviceChange({ target: { value: clonedDevice.id } } as SelectChangeEvent);
      } else {
        const devices = await DeviceManagementService.getDevicesByManufacturer('leaf', selectedLeafManufacturer);
        setLeafDevices(devices as LeafDevice[]);
        
        // Select the cloned device
        handleLeafDeviceChange({ target: { value: clonedDevice.id } } as SelectChangeEvent);
      }
      
    } catch (error: any) {
      console.error('Error cloning device:', error);
      alert(`Error cloning device: ${error.message}`);
    }
  };

  // Handle deleting a device
  const handleDeleteDevice = async (deviceType: 'spine' | 'leaf', deviceId: string) => {
    // Confirm deletion
    if (!window.confirm('Are you sure you want to delete this device? This action cannot be undone.')) {
      return;
    }
    
    try {
      // Check if device is built-in
      const isBuiltIn = DeviceManagementService.isBuiltInDevice(deviceType, deviceId);
      
      if (isBuiltIn) {
        alert('Built-in devices cannot be deleted.');
        return;
      }
      
      await DeviceManagementService.deleteDevice(deviceType, deviceId);
      
      // Refresh devices list
      if (deviceType === 'spine') {
        const devices = await DeviceManagementService.getDevicesByManufacturer('spine', selectedSpineManufacturer);
        setSpineDevices(devices as Device[]);
        
        // If the deleted device was selected, select another one
        if (selectedSpineDevice && selectedSpineDevice.id === deviceId) {
          if (devices.length > 0) {
            handleSpineDeviceChange({ target: { value: devices[0].id } } as SelectChangeEvent);
          } else {
            setSelectedSpineDevice(null);
          }
        }
      } else {
        const devices = await DeviceManagementService.getDevicesByManufacturer('leaf', selectedLeafManufacturer);
        setLeafDevices(devices as LeafDevice[]);
        
        // If the deleted device was selected, select another one
        if (selectedLeafDevice && selectedLeafDevice.id === deviceId) {
          if (devices.length > 0) {
            handleLeafDeviceChange({ target: { value: devices[0].id } } as SelectChangeEvent);
          } else {
            setSelectedLeafDevice(null);
          }
        }
      }
    } catch (error: any) {
      console.error('Error deleting device:', error);
      alert(`Error deleting device: ${error.message}`);
    }
  };

  // Open add device dialog
  const openAddDeviceDialog = (deviceType: 'spine' | 'leaf', manufacturer: string) => {
    setCurrentDeviceType(deviceType);
    setCurrentManufacturer(manufacturer);
    setCurrentDevice(null);
    setIsEditMode(false);
    setDeviceFormDialogOpen(true);
  };

  // Open edit device dialog
  const openEditDeviceDialog = (deviceType: 'spine' | 'leaf', device: Device | LeafDevice) => {
    setCurrentDeviceType(deviceType);
    setCurrentManufacturer(device.manufacturer);
    setCurrentDevice(device);
    setIsEditMode(true);
    setDeviceFormDialogOpen(true);
  };

  // Handle use default config change for spine
  const handleSpineUseDefaultConfigChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const useDefaultConfig = event.target.checked;
    
    const updatedTopology = {
      ...topology,
      configuration: {
        ...topology.configuration,
        deviceSelection: {
          ...topology.configuration.deviceSelection,
          spine: {
            ...topology.configuration.deviceSelection?.spine,
            useDefaultConfig: useDefaultConfig
          }
        }
      }
    };
    
    // If switching to useDefaultConfig, update the spine configuration
    if (useDefaultConfig && selectedSpineDevice) {
      // Find the port configuration with the highest port count
      const portConfig = selectedSpineDevice.portConfigurations.reduce(
        (prev, current) => (current.count > prev.count ? current : prev),
        selectedSpineDevice.portConfigurations[0]
      );
      
      updatedTopology.configuration.spineConfig = {
        portCount: portConfig.count,
        portSpeed: portConfig.speed,
        breakoutMode: portConfig.breakoutOptions[0]
      };
      
      updatedTopology.configuration.rackSpaceParameters.spineRackUnits = selectedSpineDevice.rackUnits;
    }
    
    setTopology(updatedTopology);
  };

  // Handle use default config change for leaf
  const handleLeafUseDefaultConfigChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const useDefaultConfig = event.target.checked;
    
    const updatedTopology = {
      ...topology,
      configuration: {
        ...topology.configuration,
        deviceSelection: {
          ...topology.configuration.deviceSelection,
          leaf: {
            ...topology.configuration.deviceSelection?.leaf,
            useDefaultConfig: useDefaultConfig
          }
        }
      }
    };
    
    // If switching to useDefaultConfig, update the leaf configuration
    if (useDefaultConfig && selectedLeafDevice) {
      // Find the port configuration with the highest port count
      const portConfig = selectedLeafDevice.portConfigurations.reduce(
        (prev, current) => (current.count > prev.count ? current : prev),
        selectedLeafDevice.portConfigurations[0]
      );
      
      updatedTopology.configuration.leafConfig = {
        ...updatedTopology.configuration.leafConfig,
        portCount: portConfig.count,
        downlinkSpeed: selectedLeafDevice.downlinkOptions[selectedLeafDevice.downlinkOptions.length - 1] // Use the highest speed
      };
      
      updatedTopology.configuration.rackSpaceParameters.leafRackUnits = selectedLeafDevice.rackUnits;
    }
    
    setTopology(updatedTopology);
  };

  // Pricing source and overrides helpers
  const setPricingSource = (deviceType: 'spine' | 'leaf', source: 'global' | 'device-default' | 'manual') => {
    const updated = { ...topology };
    const sel = updated.configuration.deviceSelection || {};
    const role: any = { ...(sel[deviceType] || {}) };
    role.pricingSource = source;
    if (source === 'global') {
      delete role.costOverride;
      delete role.powerOverride;
    } else if (source === 'device-default') {
      const dev = deviceType === 'spine' ? selectedSpineDevice : selectedLeafDevice;
      if (dev) {
        role.costOverride = dev.cost;
        role.powerOverride = dev.powerConsumption.typical;
      }
    } else if (source === 'manual') {
      if (role.costOverride == null) {
        role.costOverride = deviceType === 'spine' ? topology.configuration.switchCost.spine : topology.configuration.switchCost.leaf;
      }
      if (role.powerOverride == null) {
        role.powerOverride = deviceType === 'spine' ? topology.configuration.powerUsage.spine : topology.configuration.powerUsage.leaf;
      }
    }
    updated.configuration.deviceSelection = { ...sel, [deviceType]: role };
    setTopology(updated);
  };

  const handleManualOverrideChange = (deviceType: 'spine' | 'leaf', field: 'cost' | 'power', value: number) => {
    const updated = { ...topology };
    const sel = updated.configuration.deviceSelection || {};
    const role: any = { ...(sel[deviceType] || {}) };
    role.pricingSource = 'manual';
    if (field === 'cost') {
      role.costOverride = value;
    } else {
      role.powerOverride = value;
    }
    updated.configuration.deviceSelection = { ...sel, [deviceType]: role };
    setTopology(updated);
  };

  // Render device specifications
  const renderSpecificationsTable = (device: Device | LeafDevice | null) => {
    if (!device) return null;
    
    return (
      <DeviceSpecificationVisualizer 
        device={device} 
        deviceType={'downlinkOptions' in device ? 'leaf' : 'spine'} 
      />
    );
  };

  return (
    <>
      <Grid container spacing={3}>
        {/* Spine Switch Selection */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6">Spine Switch Selection</Typography>
                <Box>
                  <Button 
                    startIcon={<AddIcon />} 
                    onClick={() => setAddManufacturerDialogOpen(true)}
                    variant="outlined"
                    size="small"
                    sx={{ mr: 1 }}
                  >
                    Add Manufacturer
                  </Button>
                  <Button 
                    startIcon={<AddIcon />} 
                    onClick={() => openAddDeviceDialog('spine', selectedSpineManufacturer)}
                    variant="outlined"
                    size="small"
                    disabled={!selectedSpineManufacturer}
                  >
                    Add Model
                  </Button>
                </Box>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="spine-manufacturer-label">Manufacturer</InputLabel>
                    <Select
                      labelId="spine-manufacturer-label"
                      id="spine-manufacturer"
                      value={selectedSpineManufacturer}
                      label="Manufacturer"
                      onChange={handleSpineManufacturerChange}
                    >
                      {spineManufacturers.map((manufacturer) => (
                        <MenuItem key={manufacturer} value={manufacturer}>
                          {manufacturer}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="spine-device-label">Model</InputLabel>
                    <Select
                      labelId="spine-device-label"
                      id="spine-device"
                      value={selectedSpineDevice?.id || ''}
                      label="Model"
                      onChange={handleSpineDeviceChange}
                    >
                      {spineDevices.map((device) => {
                        // Get device roles
                        const roles = getDeviceRoles(device);
                        const canBeLeaf = roles.includes('leaf');
                        
                        return (
                          <MenuItem key={device.id} value={device.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                              <Typography sx={{ flexGrow: 1 }}>{device.model}</Typography>
                              
                              <Box sx={{ display: 'flex', ml: 1 }}>
                                {/* Role indicators */}
                                {canBeLeaf && (
                                  <Tooltip title="Can also be used as Leaf">
                                    <Chip 
                                      label="Leaf" 
                                      size="small" 
                                      color="success" 
                                      variant="outlined" 
                                      sx={{ ml: 0.5, height: 20 }} 
                                    />
                                  </Tooltip>
                                )}
                                
                                {/* Custom indicator */}
                                {!device.isBuiltIn && (
                                  <Chip 
                                    label="Custom" 
                                    size="small" 
                                    color="primary" 
                                    variant="outlined" 
                                    sx={{ ml: 0.5, height: 20 }} 
                                  />
                                )}
                              </Box>
                            </Box>
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              {selectedSpineDevice && (
                <>
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="subtitle1">{selectedSpineDevice.model}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedSpineDevice.description}
                      </Typography>
                    </Box>
                    <Box>
                      <Tooltip title="Clone Device">
                        <IconButton 
                          size="small" 
                          color="info"
                          onClick={() => handleCloneDevice('spine', selectedSpineDevice.id)}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {!selectedSpineDevice.isBuiltIn && (
                        <>
                          <Tooltip title="Edit Device">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => openEditDeviceDialog('spine', selectedSpineDevice)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Device">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDeleteDevice('spine', selectedSpineDevice.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </Box>
                  
                  {renderSpecificationsTable(selectedSpineDevice)}
                  
                  {/* Device Compatibility Indicator */}
                  {selectedSpineDevice && (
                    <Box sx={{ mt: 2, mb: 2 }}>
                      {(() => {
                        const { compatible, issues } = checkDeviceCompatibility(selectedSpineDevice, 'spine');
                        return (
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            p: 1, 
                            borderRadius: 1,
                            bgcolor: compatible ? 'success.main' : 'warning.main',
                            color: 'white'
                          }}>
                            {compatible ? (
                              <>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1 }}>
                                  ✓ Compatible with current configuration
                                </Typography>
                              </>
                            ) : (
                              <>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1 }}>
                                  ⚠ Configuration compatibility issues:
                                </Typography>
                                <Typography variant="body2">
                                  {issues.join(', ')}
                                </Typography>
                              </>
                            )}
                          </Box>
                        );
                      })()}
                    </Box>
                  )}
                  
                  {/* Apply Device Defaults Section */}
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={topology.configuration.deviceSelection?.spine?.useDefaultConfig || false}
                              onChange={handleSpineUseDefaultConfigChange}
                            />
                          }
                          label="Use device default configuration"
                        />
                        <Typography variant="caption" color="text.secondary" display="block">
                          When enabled, the device specifications will automatically populate the spine configuration.
                        </Typography>
                      </Box>
                      
                      <Button 
                        variant="contained" 
                        color="primary" 
                        size="small"
                        onClick={() => applyDeviceDefaults('spine', selectedSpineDevice)}
                        disabled={!selectedSpineDevice}
                      >
                        Apply Device Defaults
                      </Button>
                    </Box>
                  </Box>

                  {/* Pricing Source */}
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Pricing Source</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel id="spine-pricing-source-label">Pricing Source</InputLabel>
                          <Select
                            labelId="spine-pricing-source-label"
                            id="spine-pricing-source"
                            label="Pricing Source"
                            value={topology.configuration.deviceSelection?.spine?.pricingSource || 'global'}
                            onChange={(e) => setPricingSource('spine', e.target.value as any)}
                          >
                            <MenuItem value="global">Use Global Defaults</MenuItem>
                            <MenuItem value="device-default" disabled={!selectedSpineDevice}>Use Device Defaults</MenuItem>
                            <MenuItem value="manual">Manual Override</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      {topology.configuration.deviceSelection?.spine?.pricingSource === 'manual' && (
                        <>
                          <Grid item xs={12} md={3}>
                            <TextField
                              label="Cost"
                              type="number"
                              size="small"
                              value={topology.configuration.deviceSelection?.spine?.costOverride ?? ''}
                              onChange={(e) => handleManualOverrideChange('spine', 'cost', Number(e.target.value))}
                            />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <TextField
                              label="Power (W)"
                              type="number"
                              size="small"
                              value={topology.configuration.deviceSelection?.spine?.powerOverride ?? ''}
                              onChange={(e) => handleManualOverrideChange('spine', 'power', Number(e.target.value))}
                            />
                          </Grid>
                        </>
                      )}
                    </Grid>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                      Pricing source controls cost/power for metrics. Global defaults are edited in the Global Cost & Power Defaults panel below.
                    </Typography>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Leaf Switch Selection */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6">Leaf Switch Selection</Typography>
                <Box>
                  <Button 
                    startIcon={<AddIcon />} 
                    onClick={() => {
                      setCurrentDeviceType('leaf');
                      setAddManufacturerDialogOpen(true);
                    }}
                    variant="outlined"
                    size="small"
                    sx={{ mr: 1 }}
                  >
                    Add Manufacturer
                  </Button>
                  <Button 
                    startIcon={<AddIcon />} 
                    onClick={() => openAddDeviceDialog('leaf', selectedLeafManufacturer)}
                    variant="outlined"
                    size="small"
                    disabled={!selectedLeafManufacturer}
                  >
                    Add Model
                  </Button>
                </Box>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="leaf-manufacturer-label">Manufacturer</InputLabel>
                    <Select
                      labelId="leaf-manufacturer-label"
                      id="leaf-manufacturer"
                      value={selectedLeafManufacturer}
                      label="Manufacturer"
                      onChange={handleLeafManufacturerChange}
                    >
                      {leafManufacturers.map((manufacturer) => (
                        <MenuItem key={manufacturer} value={manufacturer}>
                          {manufacturer}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="leaf-device-label">Model</InputLabel>
                    <Select
                      labelId="leaf-device-label"
                      id="leaf-device"
                      value={selectedLeafDevice?.id || ''}
                      label="Model"
                      onChange={handleLeafDeviceChange}
                    >
                      {leafDevices.map((device) => {
                        // Get device roles
                        const roles = getDeviceRoles(device);
                        const canBeSpine = roles.includes('spine');
                        
                        return (
                          <MenuItem key={device.id} value={device.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                              <Typography sx={{ flexGrow: 1 }}>{device.model}</Typography>
                              
                              <Box sx={{ display: 'flex', ml: 1 }}>
                                {/* Role indicators */}
                                {canBeSpine && (
                                  <Tooltip title="Can also be used as Spine">
                                    <Chip 
                                      label="Spine" 
                                      size="small" 
                                      color="success" 
                                      variant="outlined" 
                                      sx={{ ml: 0.5, height: 20 }} 
                                    />
                                  </Tooltip>
                                )}
                                
                                {/* Custom indicator */}
                                {!device.isBuiltIn && (
                                  <Chip 
                                    label="Custom" 
                                    size="small" 
                                    color="primary" 
                                    variant="outlined" 
                                    sx={{ ml: 0.5, height: 20 }} 
                                  />
                                )}
                              </Box>
                            </Box>
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              {selectedLeafDevice && (
                <>
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="subtitle1">{selectedLeafDevice.model}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedLeafDevice.description}
                      </Typography>
                    </Box>
                    <Box>
                      <Tooltip title="Clone Device">
                        <IconButton 
                          size="small" 
                          color="info"
                          onClick={() => handleCloneDevice('leaf', selectedLeafDevice.id)}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {!selectedLeafDevice.isBuiltIn && (
                        <>
                          <Tooltip title="Edit Device">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => openEditDeviceDialog('leaf', selectedLeafDevice)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Device">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDeleteDevice('leaf', selectedLeafDevice.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </Box>
                  
                  {renderSpecificationsTable(selectedLeafDevice)}
                  
                  {/* Device Compatibility Indicator */}
                  {selectedLeafDevice && (
                    <Box sx={{ mt: 2, mb: 2 }}>
                      {(() => {
                        const { compatible, issues } = checkDeviceCompatibility(selectedLeafDevice, 'leaf');
                        return (
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            p: 1, 
                            borderRadius: 1,
                            bgcolor: compatible ? 'success.main' : 'warning.main',
                            color: 'white'
                          }}>
                            {compatible ? (
                              <>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1 }}>
                                  ✓ Compatible with current configuration
                                </Typography>
                              </>
                            ) : (
                              <>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1 }}>
                                  ⚠ Configuration compatibility issues:
                                </Typography>
                                <Typography variant="body2">
                                  {issues.join(', ')}
                                </Typography>
                              </>
                            )}
                          </Box>
                        );
                      })()}
                    </Box>
                  )}
                  
                  {/* Apply Device Defaults Section */}
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={topology.configuration.deviceSelection?.leaf?.useDefaultConfig || false}
                              onChange={handleLeafUseDefaultConfigChange}
                            />
                          }
                          label="Use device default configuration"
                        />
                        <Typography variant="caption" color="text.secondary" display="block">
                          When enabled, the device specifications will automatically populate the leaf configuration.
                        </Typography>
                      </Box>
                      
                      <Button 
                        variant="contained" 
                        color="primary" 
                        size="small"
                        onClick={() => applyDeviceDefaults('leaf', selectedLeafDevice)}
                        disabled={!selectedLeafDevice}
                      >
                        Apply Device Defaults
                      </Button>
                    </Box>
                  </Box>

                  {/* Pricing Source */}
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Pricing Source</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel id="leaf-pricing-source-label">Pricing Source</InputLabel>
                          <Select
                            labelId="leaf-pricing-source-label"
                            id="leaf-pricing-source"
                            label="Pricing Source"
                            value={topology.configuration.deviceSelection?.leaf?.pricingSource || 'global'}
                            onChange={(e) => setPricingSource('leaf', e.target.value as any)}
                          >
                            <MenuItem value="global">Use Global Defaults</MenuItem>
                            <MenuItem value="device-default" disabled={!selectedLeafDevice}>Use Device Defaults</MenuItem>
                            <MenuItem value="manual">Manual Override</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      {topology.configuration.deviceSelection?.leaf?.pricingSource === 'manual' && (
                        <>
                          <Grid item xs={12} md={3}>
                            <TextField
                              label="Cost"
                              type="number"
                              size="small"
                              value={topology.configuration.deviceSelection?.leaf?.costOverride ?? ''}
                              onChange={(e) => handleManualOverrideChange('leaf', 'cost', Number(e.target.value))}
                            />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <TextField
                              label="Power (W)"
                              type="number"
                              size="small"
                              value={topology.configuration.deviceSelection?.leaf?.powerOverride ?? ''}
                              onChange={(e) => handleManualOverrideChange('leaf', 'power', Number(e.target.value))}
                            />
                          </Grid>
                        </>
                      )}
                    </Grid>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                      Pricing source controls cost/power for metrics. Global defaults are edited in the Global Cost & Power Defaults panel below.
                    </Typography>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <CostPowerConfigPanel
            topology={topology as any}
            setTopology={setTopology}
            selectedSpineDevice={selectedSpineDevice}
            selectedLeafDevice={selectedLeafDevice}
            panelType="compact"
            opticConfig={true}
          />
        </Grid>
      </Grid>
      
      {/* Add Manufacturer Dialog */}
      <AddManufacturerDialog
        open={addManufacturerDialogOpen}
        onClose={() => setAddManufacturerDialogOpen(false)}
        onAdd={handleAddManufacturer}
        deviceTypes={[currentDeviceType]}
      />
      
      {/* Device Form Dialog */}
      <DeviceFormDialog
        open={deviceFormDialogOpen}
        onClose={() => setDeviceFormDialogOpen(false)}
        onSave={isEditMode ? handleEditDevice : handleAddDevice}
        deviceType={currentDeviceType}
        manufacturer={currentManufacturer}
        device={currentDevice}
        isEdit={isEditMode}
      />
    </>
  );
};

export default DeviceSelection;
