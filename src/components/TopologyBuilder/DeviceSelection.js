import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  Typography,
  Paper,
  Button,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import DeviceSpecificationVisualizer from './DeviceSpecificationVisualizer';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeviceManagementService from '../../services/DeviceManagementService';
import AddManufacturerDialog from './AddManufacturerDialog';
import DeviceFormDialog from './DeviceFormDialog';

const DeviceSelection = ({ topology, setTopology }) => {
  const [spineManufacturers, setSpineManufacturers] = useState([]);
  const [leafManufacturers, setLeafManufacturers] = useState([]);
  const [spineDevices, setSpineDevices] = useState([]);
  const [leafDevices, setLeafDevices] = useState([]);
  const [selectedSpineManufacturer, setSelectedSpineManufacturer] = useState('');
  const [selectedLeafManufacturer, setSelectedLeafManufacturer] = useState('');
  const [selectedSpineDevice, setSelectedSpineDevice] = useState(null);
  const [selectedLeafDevice, setSelectedLeafDevice] = useState(null);
  
  // Dialog states
  const [addManufacturerDialogOpen, setAddManufacturerDialogOpen] = useState(false);
  const [deviceFormDialogOpen, setDeviceFormDialogOpen] = useState(false);
  const [currentDeviceType, setCurrentDeviceType] = useState('spine');
  const [currentManufacturer, setCurrentManufacturer] = useState('');
  const [currentDevice, setCurrentDevice] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

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
            setSelectedSpineDevice(spineDevice);
            const spineDevicesList = await DeviceManagementService.getDevicesByManufacturer('spine', spineDevice.manufacturer);
            setSpineDevices(spineDevicesList);
          }
        } else if (spineManufacturersList.length > 0) {
          setSelectedSpineManufacturer(spineManufacturersList[0]);
          const spineDevicesList = await DeviceManagementService.getDevicesByManufacturer('spine', spineManufacturersList[0]);
          setSpineDevices(spineDevicesList);
        }
        
        if (leafDeviceId) {
          const leafDevice = await DeviceManagementService.getDeviceById('leaf', leafDeviceId);
          if (leafDevice) {
            setSelectedLeafManufacturer(leafDevice.manufacturer);
            setSelectedLeafDevice(leafDevice);
            const leafDevicesList = await DeviceManagementService.getDevicesByManufacturer('leaf', leafDevice.manufacturer);
            setLeafDevices(leafDevicesList);
          }
        } else if (leafManufacturersList.length > 0) {
          setSelectedLeafManufacturer(leafManufacturersList[0]);
          const leafDevicesList = await DeviceManagementService.getDevicesByManufacturer('leaf', leafManufacturersList[0]);
          setLeafDevices(leafDevicesList);
        }
      } catch (error) {
        console.error('Error loading manufacturers and devices:', error);
      }
    };
    
    loadManufacturers();
  }, [topology.configuration.deviceSelection]);

  // Handle spine manufacturer change
  const handleSpineManufacturerChange = async (event) => {
    const manufacturer = event.target.value;
    setSelectedSpineManufacturer(manufacturer);
    
    try {
      const devices = await DeviceManagementService.getDevicesByManufacturer('spine', manufacturer);
      setSpineDevices(devices);
      
      // Select the first device by default
      if (devices.length > 0) {
        handleSpineDeviceChange({ target: { value: devices[0].id } });
      } else {
        setSelectedSpineDevice(null);
      }
    } catch (error) {
      console.error('Error loading spine devices:', error);
    }
  };

  // Handle leaf manufacturer change
  const handleLeafManufacturerChange = async (event) => {
    const manufacturer = event.target.value;
    setSelectedLeafManufacturer(manufacturer);
    
    try {
      const devices = await DeviceManagementService.getDevicesByManufacturer('leaf', manufacturer);
      setLeafDevices(devices);
      
      // Select the first device by default
      if (devices.length > 0) {
        handleLeafDeviceChange({ target: { value: devices[0].id } });
      } else {
        setSelectedLeafDevice(null);
      }
    } catch (error) {
      console.error('Error loading leaf devices:', error);
    }
  };

  // Handle spine device change
  const handleSpineDeviceChange = async (event) => {
    const deviceId = event.target.value;
    
    try {
      const device = await DeviceManagementService.getDeviceById('spine', deviceId);
      setSelectedSpineDevice(device);
    
      // Update topology with selected device
      const updatedTopology = {
        ...topology,
        configuration: {
          ...topology.configuration,
          deviceSelection: {
            ...topology.configuration.deviceSelection,
            spine: {
              deviceId: deviceId,
              useDefaultConfig: topology.configuration.deviceSelection?.spine?.useDefaultConfig || true
            }
          }
        }
      };
      
      // If useDefaultConfig is true, update the spine configuration
      if (updatedTopology.configuration.deviceSelection.spine.useDefaultConfig && device) {
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
        
        updatedTopology.configuration.switchCost.spine = device.cost;
        updatedTopology.configuration.powerUsage.spine = device.powerConsumption.typical;
        updatedTopology.configuration.rackSpaceParameters.spineRackUnits = device.rackUnits;
      }
      
      setTopology(updatedTopology);
    } catch (error) {
      console.error('Error loading spine device:', error);
    }
  };

  // Handle leaf device change
  const handleLeafDeviceChange = async (event) => {
    const deviceId = event.target.value;
    
    try {
      const device = await DeviceManagementService.getDeviceById('leaf', deviceId);
      setSelectedLeafDevice(device);
    
      // Update topology with selected device
      const updatedTopology = {
        ...topology,
        configuration: {
          ...topology.configuration,
          deviceSelection: {
            ...topology.configuration.deviceSelection,
            leaf: {
              deviceId: deviceId,
              useDefaultConfig: topology.configuration.deviceSelection?.leaf?.useDefaultConfig || true
            }
          }
        }
      };
      
      // If useDefaultConfig is true, update the leaf configuration
      if (updatedTopology.configuration.deviceSelection.leaf.useDefaultConfig && device) {
        // Find the port configuration with the highest port count
        const portConfig = device.portConfigurations.reduce(
          (prev, current) => (current.count > prev.count ? current : prev),
          device.portConfigurations[0]
        );
        
        updatedTopology.configuration.leafConfig = {
          portCount: portConfig.count,
          downlinkSpeed: device.downlinkOptions[device.downlinkOptions.length - 1] // Use the highest speed
        };
        
        updatedTopology.configuration.switchCost.leaf = device.cost;
        updatedTopology.configuration.powerUsage.leaf = device.powerConsumption.typical;
        updatedTopology.configuration.rackSpaceParameters.leafRackUnits = device.rackUnits;
      }
      
      setTopology(updatedTopology);
    } catch (error) {
      console.error('Error loading leaf device:', error);
    }
  };

  // Handle adding a new manufacturer
  const handleAddManufacturer = async (deviceType, manufacturerName) => {
    try {
      await DeviceManagementService.addManufacturer(deviceType, manufacturerName);
      
      // Refresh manufacturers list
      const manufacturers = await DeviceManagementService.getManufacturers(deviceType);
      
      if (deviceType === 'spine') {
        setSpineManufacturers(manufacturers);
        setSelectedSpineManufacturer(manufacturerName);
        
        // Load devices for this manufacturer
        const devices = await DeviceManagementService.getDevicesByManufacturer('spine', manufacturerName);
        setSpineDevices(devices);
        
        // Select the first device if available
        if (devices.length > 0) {
          handleSpineDeviceChange({ target: { value: devices[0].id } });
        }
      } else {
        setLeafManufacturers(manufacturers);
        setSelectedLeafManufacturer(manufacturerName);
        
        // Load devices for this manufacturer
        const devices = await DeviceManagementService.getDevicesByManufacturer('leaf', manufacturerName);
        setLeafDevices(devices);
        
        // Select the first device if available
        if (devices.length > 0) {
          handleLeafDeviceChange({ target: { value: devices[0].id } });
        }
      }
      
      setAddManufacturerDialogOpen(false);
    } catch (error) {
      console.error('Error adding manufacturer:', error);
      alert(`Error adding manufacturer: ${error.message}`);
    }
  };

  // Handle adding a new device
  const handleAddDevice = async (deviceType, deviceData) => {
    try {
      const newDevice = await DeviceManagementService.addDevice(deviceType, deviceData);
      
      // Refresh devices list
      if (deviceType === 'spine') {
        const devices = await DeviceManagementService.getDevicesByManufacturer('spine', selectedSpineManufacturer);
        setSpineDevices(devices);
        
        // Select the new device
        handleSpineDeviceChange({ target: { value: newDevice.id } });
      } else {
        const devices = await DeviceManagementService.getDevicesByManufacturer('leaf', selectedLeafManufacturer);
        setLeafDevices(devices);
        
        // Select the new device
        handleLeafDeviceChange({ target: { value: newDevice.id } });
      }
      
      setDeviceFormDialogOpen(false);
    } catch (error) {
      console.error('Error adding device:', error);
      alert(`Error adding device: ${error.message}`);
    }
  };

  // Handle editing a device
  const handleEditDevice = async (deviceType, deviceData) => {
    try {
      await DeviceManagementService.updateDevice(deviceType, deviceData.id, deviceData);
      
      // Refresh devices list
      if (deviceType === 'spine') {
        const devices = await DeviceManagementService.getDevicesByManufacturer('spine', selectedSpineManufacturer);
        setSpineDevices(devices);
        
        // Update selected device
        if (selectedSpineDevice && selectedSpineDevice.id === deviceData.id) {
          setSelectedSpineDevice(deviceData);
        }
      } else {
        const devices = await DeviceManagementService.getDevicesByManufacturer('leaf', selectedLeafManufacturer);
        setLeafDevices(devices);
        
        // Update selected device
        if (selectedLeafDevice && selectedLeafDevice.id === deviceData.id) {
          setSelectedLeafDevice(deviceData);
        }
      }
      
      setDeviceFormDialogOpen(false);
    } catch (error) {
      console.error('Error updating device:', error);
      alert(`Error updating device: ${error.message}`);
    }
  };

  // Handle cloning a device
  const handleCloneDevice = async (deviceType, deviceId) => {
    try {
      const clonedDevice = await DeviceManagementService.cloneDevice(deviceType, deviceId);
      
      // Refresh devices list
      if (deviceType === 'spine') {
        const devices = await DeviceManagementService.getDevicesByManufacturer('spine', selectedSpineManufacturer);
        setSpineDevices(devices);
        
        // Select the cloned device
        handleSpineDeviceChange({ target: { value: clonedDevice.id } });
      } else {
        const devices = await DeviceManagementService.getDevicesByManufacturer('leaf', selectedLeafManufacturer);
        setLeafDevices(devices);
        
        // Select the cloned device
        handleLeafDeviceChange({ target: { value: clonedDevice.id } });
      }
      
    } catch (error) {
      console.error('Error cloning device:', error);
      alert(`Error cloning device: ${error.message}`);
    }
  };

  // Handle deleting a device
  const handleDeleteDevice = async (deviceType, deviceId) => {
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
        setSpineDevices(devices);
        
        // If the deleted device was selected, select another one
        if (selectedSpineDevice && selectedSpineDevice.id === deviceId) {
          if (devices.length > 0) {
            handleSpineDeviceChange({ target: { value: devices[0].id } });
          } else {
            setSelectedSpineDevice(null);
          }
        }
      } else {
        const devices = await DeviceManagementService.getDevicesByManufacturer('leaf', selectedLeafManufacturer);
        setLeafDevices(devices);
        
        // If the deleted device was selected, select another one
        if (selectedLeafDevice && selectedLeafDevice.id === deviceId) {
          if (devices.length > 0) {
            handleLeafDeviceChange({ target: { value: devices[0].id } });
          } else {
            setSelectedLeafDevice(null);
          }
        }
      }
    } catch (error) {
      console.error('Error deleting device:', error);
      alert(`Error deleting device: ${error.message}`);
    }
  };

  // Open add device dialog
  const openAddDeviceDialog = (deviceType, manufacturer) => {
    setCurrentDeviceType(deviceType);
    setCurrentManufacturer(manufacturer);
    setCurrentDevice(null);
    setIsEditMode(false);
    setDeviceFormDialogOpen(true);
  };

  // Open edit device dialog
  const openEditDeviceDialog = (deviceType, device) => {
    setCurrentDeviceType(deviceType);
    setCurrentManufacturer(device.manufacturer);
    setCurrentDevice(device);
    setIsEditMode(true);
    setDeviceFormDialogOpen(true);
  };

  // Handle use default config change for spine
  const handleSpineUseDefaultConfigChange = (event) => {
    const useDefaultConfig = event.target.checked;
    
    const updatedTopology = {
      ...topology,
      configuration: {
        ...topology.configuration,
        deviceSelection: {
          ...topology.configuration.deviceSelection,
          spine: {
            ...topology.configuration.deviceSelection.spine,
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
      
      updatedTopology.configuration.switchCost.spine = selectedSpineDevice.cost;
      updatedTopology.configuration.powerUsage.spine = selectedSpineDevice.powerConsumption.typical;
      updatedTopology.configuration.rackSpaceParameters.spineRackUnits = selectedSpineDevice.rackUnits;
    }
    
    setTopology(updatedTopology);
  };

  // Handle use default config change for leaf
  const handleLeafUseDefaultConfigChange = (event) => {
    const useDefaultConfig = event.target.checked;
    
    const updatedTopology = {
      ...topology,
      configuration: {
        ...topology.configuration,
        deviceSelection: {
          ...topology.configuration.deviceSelection,
          leaf: {
            ...topology.configuration.deviceSelection.leaf,
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
        portCount: portConfig.count,
        downlinkSpeed: selectedLeafDevice.downlinkOptions[selectedLeafDevice.downlinkOptions.length - 1] // Use the highest speed
      };
      
      updatedTopology.configuration.switchCost.leaf = selectedLeafDevice.cost;
      updatedTopology.configuration.powerUsage.leaf = selectedLeafDevice.powerConsumption.typical;
      updatedTopology.configuration.rackSpaceParameters.leafRackUnits = selectedLeafDevice.rackUnits;
    }
    
    setTopology(updatedTopology);
  };

  // Format a specification value based on its type
  const formatSpecValue = (key, value) => {
    if (key === 'cost') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
      }).format(value);
    } else if (key === 'powerConsumption') {
      return `${value.typical} W typical, ${value.max} W max`;
    } else if (key === 'rackUnits') {
      return `${value}U`;
    } else if (key === 'thermalOutput') {
      return `${value} BTU/hr`;
    } else if (key === 'weight') {
      return `${value} kg`;
    } else if (key === 'dimensions') {
      return `${value.height} × ${value.width} × ${value.depth} cm`;
    } else if (key === 'portConfigurations') {
      return value.map(config => `${config.count}×${config.speed}`).join(', ');
    } else if (key === 'downlinkOptions') {
      return value.join(', ');
    } else {
      return value.toString();
    }
  };

  // Render device specifications
  const renderSpecificationsTable = (device) => {
    if (!device) return null;
    
    return (
      <DeviceSpecificationVisualizer 
        device={device} 
        deviceType={device.downlinkOptions ? 'leaf' : 'spine'} 
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
                      {spineDevices.map((device) => (
                        <MenuItem key={device.id} value={device.id}>
                          {device.model}
                          {device.isBuiltIn ? null : (
                            <Chip 
                              label="Custom" 
                              size="small" 
                              color="primary" 
                              variant="outlined" 
                              sx={{ ml: 1, height: 20 }} 
                            />
                          )}
                        </MenuItem>
                      ))}
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
                  
                  <Box sx={{ mt: 2 }}>
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
                      {leafDevices.map((device) => (
                        <MenuItem key={device.id} value={device.id}>
                          {device.model}
                          {device.isBuiltIn ? null : (
                            <Chip 
                              label="Custom" 
                              size="small" 
                              color="primary" 
                              variant="outlined" 
                              sx={{ ml: 1, height: 20 }} 
                            />
                          )}
                        </MenuItem>
                      ))}
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
                  
                  <Box sx={{ mt: 2 }}>
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
                </>
              )}
            </CardContent>
          </Card>
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
