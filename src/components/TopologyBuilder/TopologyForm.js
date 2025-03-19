import React, { useState, useEffect, useMemo } from 'react';
import { useTopology } from '../../context/TopologyContext';
import { exportTopology } from '../../utils/importExport';
import DeviceSelection from './DeviceSelection';
import { 
  Box, 
  Card, 
  CardContent, 
  CardHeader, 
  Divider, 
  Grid, 
  TextField, 
  Typography, 
  Slider, 
  Switch, 
  FormControlLabel,
  Tabs,
  Tab,
  IconButton,
  Tooltip
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import InfoIcon from '@mui/icons-material/Info';

// TabPanel component for the tabbed interface
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`topology-tabpanel-${index}`}
      aria-labelledby={`topology-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Helper function to snap to common network fabric sizes
const snapToCommonValue = (value, commonValues, snapThreshold = 5) => {
  // Find the closest common value within threshold
  for (const commonValue of commonValues) {
    if (Math.abs(value - commonValue) <= snapThreshold) {
      return commonValue;
    }
  }
  // Not near a common value, return the original
  return value;
};

const TopologyForm = () => {
  const { 
    currentTopology, 
    createTopology, 
    updateTopology, 
    deleteTopology,
    duplicateTopology
  } = useTopology();
  
  const [topology, setTopology] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});
  
  // Define common values for spine and leaf switches
  const spineCommonValues = useMemo(() => [1, 2, 4, 8, 16, 32, 64, 128, 256, 384, 512], []);
  const leafCommonValues = useMemo(() => [2, 4, 8, 16, 32, 64, 128, 256, 384, 512], []);
  
  // Initialize form with current topology or create a new one
  useEffect(() => {
    if (currentTopology) {
      setTopology(currentTopology);
    } else {
      const newTopology = createTopology();
      setTopology(newTopology);
    }
  }, [currentTopology, createTopology]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setTopology({
      ...topology,
      [name]: value
    });
  };
  
  // Ensure minimum tiers based on spine and leaf counts
  const ensureMinimumTiers = (config) => {
    // Only enforce minimum tier count when spine count is greater than 0
    // This allows for single-tier (leaf-only) designs
    if (config.numSpines > 0 && config.numLeafs > 0 && config.numTiers < 2) {
      return {
        ...config,
        numTiers: 2
      };
    }
    return config;
  };
  
  // Handle configuration field changes
  const handleConfigChange = (field, value) => {
    let updatedTopology = {
      ...topology,
      configuration: {
        ...topology.configuration,
        [field]: value
      }
    };
    
    // Update tier count based on spine and leaf configuration
    if (field === 'numSpines' || field === 'numLeafs') {
      updatedTopology.configuration = ensureMinimumTiers(updatedTopology.configuration);
    }
    
    // Validate the updated topology
    validateTopology(updatedTopology);
    
    setTopology(updatedTopology);
  };
  
  // Handle nested configuration field changes
  const handleNestedConfigChange = (parent, field, value) => {
    const updatedTopology = {
      ...topology,
      configuration: {
        ...topology.configuration,
        [parent]: {
          ...topology.configuration[parent],
          [field]: value
        }
      }
    };
    
    // Validate the updated topology
    validateTopology(updatedTopology);
    
    setTopology(updatedTopology);
  };
  
  // Validate the topology configuration
  const validateTopology = (topologyToValidate) => {
    const errors = {};
    
    // Ensure spineConfig exists
    if (!topologyToValidate.configuration.spineConfig) {
      // Initialize spineConfig with default values if it doesn't exist
      topologyToValidate.configuration.spineConfig = {
        portCount: 64,
        portSpeed: '800G',
        breakoutMode: '1x800G'
      };
    }
    
    // Check if leaf count exceeds maximum
    const { portCount, portSpeed, breakoutMode } = topologyToValidate.configuration.spineConfig;
    
    // Ensure breakoutOptions exists and has the right structure
    if (!topologyToValidate.configuration.breakoutOptions || 
        !topologyToValidate.configuration.breakoutOptions[portSpeed]) {
      errors.spineConfig = 'Invalid breakout options configuration';
      return errors;
    }
    
    const breakoutOption = topologyToValidate.configuration.breakoutOptions[portSpeed].find(
      option => option.type === breakoutMode
    );
    const breakoutFactor = breakoutOption ? breakoutOption.factor : 1;
    const maxLeafSwitches = portCount * breakoutFactor;
    
    if (topologyToValidate.configuration.numLeafs > maxLeafSwitches) {
      errors.numLeafs = `Leaf count exceeds maximum of ${maxLeafSwitches} supported by current spine configuration`;
    }
    
    // Check if spine count is valid - only for multi-tier topologies
    if (topologyToValidate.configuration.numTiers > 1 && topologyToValidate.configuration.numSpines < 1) {
      errors.numSpines = 'Spine count must be at least 1 for multi-tier topologies';
    }
    
    // Check if leaf count is valid
    if (topologyToValidate.configuration.numLeafs < 2) {
      errors.numLeafs = 'Leaf count must be at least 2';
    }
    
    // Check if tier count is valid
    if (topologyToValidate.configuration.numTiers < 1 || topologyToValidate.configuration.numTiers > 3) {
      errors.numTiers = 'Tier count must be between 1 and 3';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  
  // Save topology
  const handleSave = () => {
    // Validate before saving
    if (validateTopology(topology)) {
      updateTopology(topology);
    } else {
      // Show error message or highlight the tab with errors
      alert('Please fix validation errors before saving');
      
      // Switch to the tab with errors
      if (validationErrors.numLeafs || validationErrors.numSpines || validationErrors.numTiers) {
        setTabValue(0); // Basic Configuration tab
      }
    }
  };
  
  // Delete topology
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this topology?')) {
      deleteTopology(topology.id);
    }
  };
  
  // Duplicate topology
  const handleDuplicate = () => {
    duplicateTopology(topology.id);
  };
  
  // If topology is not loaded yet, show loading
  if (!topology) {
    return <Typography>Loading...</Typography>;
  }
  
  return (
    <Card>
      <CardHeader 
        title={
          <TextField
            fullWidth
            label="Topology Name"
            name="name"
            value={topology.name}
            onChange={handleChange}
            variant="standard"
          />
        }
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Save Topology">
              <IconButton onClick={handleSave} color="primary">
                <SaveIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Duplicate Topology">
              <IconButton onClick={handleDuplicate} color="primary">
                <ContentCopyIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export Topology">
              <IconButton onClick={() => exportTopology(topology)} color="primary">
                <Tooltip title="Export Topology">
                  <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24">
                    <path d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z"/>
                  </svg>
                </Tooltip>
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Topology">
              <IconButton onClick={handleDelete} color="error">
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        }
      />
      <Divider />
      <CardContent>
        <TextField
          fullWidth
          label="Description"
          name="description"
          value={topology.description}
          onChange={handleChange}
          multiline
          rows={2}
          margin="normal"
        />
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="topology configuration tabs">
            <Tab label="Basic Configuration" />
            <Tab label="Device Selection" />
            <Tab label="Advanced Configuration" />
            <Tab label="Cost & Power" />
            <Tab label="Other Parameters" />
          </Tabs>
        </Box>
        
        {/* Basic Configuration Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>
                Number of Spine Switches
                {topology.configuration.numTiers === 1 && (
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    (Not applicable for single-tier designs)
                  </Typography>
                )}
              </Typography>
              <Slider
                value={topology.configuration.numSpines}
                onChange={(e, value) => {
                  const snappedValue = snapToCommonValue(value, spineCommonValues);
                  handleConfigChange('numSpines', snappedValue);
                }}
                step={1}
                marks={spineCommonValues.map(value => ({
                  value,
                  label: value === 1 || value % 128 === 0 ? value.toString() : ''
                }))}
                min={0}
                max={512}
                valueLabelDisplay="auto"
                disabled={topology.configuration.numTiers === 1}
              />
              <TextField
                value={topology.configuration.numTiers === 1 ? 0 : topology.configuration.numSpines}
                onChange={(e) => handleConfigChange('numSpines', parseInt(e.target.value) || 0)}
                type="number"
                InputLabelProps={{
                  shrink: true,
                }}
                margin="dense"
                size="small"
                error={!!validationErrors.numSpines}
                helperText={validationErrors.numSpines}
                disabled={topology.configuration.numTiers === 1}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>Number of Leaf Switches</Typography>
              <Slider
                value={topology.configuration.numLeafs}
                onChange={(e, value) => {
                  const snappedValue = snapToCommonValue(value, leafCommonValues);
                  handleConfigChange('numLeafs', snappedValue);
                }}
                step={1}
                marks={leafCommonValues.map(value => ({
                  value,
                  label: value === 2 || value % 128 === 0 ? value.toString() : ''
                }))}
                min={2}
                max={512}
                valueLabelDisplay="auto"
              />
              <TextField
                value={topology.configuration.numLeafs}
                onChange={(e) => handleConfigChange('numLeafs', parseInt(e.target.value) || 0)}
                type="number"
                InputLabelProps={{
                  shrink: true,
                }}
                margin="dense"
                size="small"
                error={!!validationErrors.numLeafs}
                helperText={validationErrors.numLeafs}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>Number of Tiers</Typography>
              <Slider
                value={topology.configuration.numTiers}
                onChange={(e, value) => {
                  // Enforce minimum tier value of 2 when spine switches exist
                  if (topology.configuration.numSpines > 0 && value < 2) {
                    handleConfigChange('numTiers', 2);
                  } else {
                    handleConfigChange('numTiers', value);
                  }
                }}
                step={1}
                marks
                min={1}
                max={3}
                valueLabelDisplay="auto"
              />
              <TextField
                value={topology.configuration.numTiers}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  // Enforce minimum tier value of 2 when spine switches exist
                  if (topology.configuration.numSpines > 0 && value < 2) {
                    handleConfigChange('numTiers', 2);
                  } else {
                    handleConfigChange('numTiers', value);
                  }
                }}
                type="number"
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  min: topology.configuration.numSpines > 0 ? 2 : 1,
                  max: 3
                }}
                margin="dense"
                size="small"
                error={!!validationErrors.numTiers}
                helperText={validationErrors.numTiers || 
                  (topology.configuration.numSpines > 0 ? 
                  "Minimum tier count is 2 when spine switches are present." : 
                  "Single-tier (leaf only) designs are allowed when spine count is 0.")}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Spine Switch Configuration
                {topology.configuration.numTiers === 1 && (
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    (Not applicable for single-tier designs)
                  </Typography>
                )}
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Typography gutterBottom>Spine Switch Port Count</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TextField
                    select
                    label="Port Count"
                    value={topology.configuration.spineConfig.portCount}
                    onChange={(e) => handleNestedConfigChange('spineConfig', 'portCount', parseInt(e.target.value))}
                    SelectProps={{ native: true }}
                    sx={{ mr: 2, width: 120 }}
                    disabled={topology.configuration.numTiers === 1}
                  >
                    <option value={32}>32 ports</option>
                    <option value={64}>64 ports</option>
                  </TextField>
                </Box>
                
                <Typography gutterBottom>Spine Switch Port Speed</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TextField
                    select
                    label="Port Speed"
                    value={topology.configuration.spineConfig.portSpeed}
                    onChange={(e) => handleNestedConfigChange('spineConfig', 'portSpeed', e.target.value)}
                    SelectProps={{ native: true }}
                    sx={{ mr: 2, width: 120 }}
                    disabled={topology.configuration.numTiers === 1}
                  >
                    <option value="400G">400G</option>
                    <option value="800G">800G</option>
                  </TextField>
                </Box>
                
                <Typography gutterBottom>Breakout Mode</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {topology.configuration.breakoutOptions && 
                   topology.configuration.breakoutOptions[topology.configuration.spineConfig.portSpeed] ? (
                    <TextField
                      select
                      label="Breakout Mode"
                      value={topology.configuration.spineConfig.breakoutMode}
                      onChange={(e) => handleNestedConfigChange('spineConfig', 'breakoutMode', e.target.value)}
                      SelectProps={{ native: true }}
                      sx={{ mr: 2, width: 120 }}
                      disabled={topology.configuration.numTiers === 1}
                    >
                      {topology.configuration.breakoutOptions[topology.configuration.spineConfig.portSpeed].map((option) => (
                        <option key={option.type} value={option.type}>
                          {option.type}
                        </option>
                      ))}
                    </TextField>
                  ) : (
                    <Typography color="error">
                      Breakout options not available for {topology.configuration.spineConfig.portSpeed}
                    </Typography>
                  )}
                  
                  <Tooltip title="In a Clos network, every spine connects to every leaf with exactly one link. Breakout modes allow a single physical port to be split into multiple logical ports.">
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      <InfoIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                      Each spine connects to every leaf switch
                    </Typography>
                  </Tooltip>
                </Box>
                
                {/* Maximum leaf switches calculation */}
                {(() => {
                  const { portCount, portSpeed, breakoutMode } = topology.configuration.spineConfig;
                  
                  // Check if breakoutOptions exists and has the right structure
                  if (!topology.configuration.breakoutOptions || 
                      !topology.configuration.breakoutOptions[portSpeed]) {
                    return (
                      <Box sx={{ mt: 2, p: 1, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'error.main' }}>
                        <Typography variant="subtitle2" color="error">
                          Error: Breakout options not available for {portSpeed}
                        </Typography>
                        <Typography variant="body2" color="error">
                          Please select a different port speed or update the breakout options.
                        </Typography>
                      </Box>
                    );
                  }
                  
                  const breakoutOption = topology.configuration.breakoutOptions[portSpeed].find(
                    option => option.type === breakoutMode
                  );
                  const breakoutFactor = breakoutOption ? breakoutOption.factor : 1;
                  const maxLeafSwitches = portCount * breakoutFactor;
                  
                  return (
                    <Box sx={{ mt: 2, p: 1, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="subtitle2">
                        Maximum Leaf Switches: {maxLeafSwitches}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {portCount} ports × {breakoutFactor} connections per port
                      </Typography>
                      {topology.configuration.numLeafs > maxLeafSwitches && (
                        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                          Warning: Current leaf count ({topology.configuration.numLeafs}) exceeds maximum!
                        </Typography>
                      )}
                    </Box>
                  );
                })()}
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Leaf Switch Configuration</Typography>
              <Box sx={{ mb: 3 }}>
                <Typography gutterBottom>Leaf Switch Port Count</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TextField
                    select
                    label="Port Count"
                    value={topology.configuration.leafConfig?.portCount || 64}
                    onChange={(e) => {
                      const updatedConfig = { 
                        ...topology.configuration,
                        leafConfig: {
                          ...topology.configuration.leafConfig,
                          portCount: parseInt(e.target.value)
                        }
                      };
                      setTopology({
                        ...topology,
                        configuration: updatedConfig
                      });
                    }}
                    SelectProps={{ native: true }}
                    sx={{ mr: 2, width: 120 }}
                  >
                    <option value={32}>32 ports</option>
                    <option value={64}>64 ports</option>
                  </TextField>
                </Box>
                
                <Typography gutterBottom>Downlink Port Speed</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TextField
                    select
                    label="Port Speed"
                    value={topology.configuration.leafConfig?.downlinkSpeed || '100G'}
                    onChange={(e) => {
                      const newSpeed = e.target.value;
                      // Get the first available breakout mode for this speed
                      const firstBreakoutMode = topology.configuration.breakoutOptions[newSpeed]?.[0]?.type || `1x${newSpeed}`;
                      
                      const updatedConfig = { 
                        ...topology.configuration,
                        leafConfig: {
                          ...topology.configuration.leafConfig,
                          downlinkSpeed: newSpeed,
                          breakoutMode: firstBreakoutMode
                        }
                      };
                      setTopology({
                        ...topology,
                        configuration: updatedConfig
                      });
                    }}
                    SelectProps={{ native: true }}
                    sx={{ mr: 2, width: 120 }}
                  >
                    <option value="10G">10G</option>
                    <option value="25G">25G</option>
                    <option value="40G">40G</option>
                    <option value="100G">100G</option>
                    <option value="400G">400G</option>
                    <option value="800G">800G</option>
                  </TextField>
                  
                  <Tooltip title="The speed of the downlink ports that connect to servers or other devices.">
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      <InfoIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                      Downlink ports connect to servers
                    </Typography>
                  </Tooltip>
                </Box>
                
                <Typography gutterBottom>Breakout Mode</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {topology.configuration.breakoutOptions && 
                   topology.configuration.breakoutOptions[topology.configuration.leafConfig.downlinkSpeed] ? (
                    <TextField
                      select
                      label="Breakout Mode"
                      value={topology.configuration.leafConfig.breakoutMode || `1x${topology.configuration.leafConfig.downlinkSpeed}`}
                      onChange={(e) => {
                        const updatedConfig = { 
                          ...topology.configuration,
                          leafConfig: {
                            ...topology.configuration.leafConfig,
                            breakoutMode: e.target.value
                          }
                        };
                        setTopology({
                          ...topology,
                          configuration: updatedConfig
                        });
                      }}
                      SelectProps={{ native: true }}
                      sx={{ mr: 2, width: 120 }}
                    >
                      {topology.configuration.breakoutOptions[topology.configuration.leafConfig.downlinkSpeed].map((option) => (
                        <option key={option.type} value={option.type}>
                          {option.type}
                        </option>
                      ))}
                    </TextField>
                  ) : (
                    <Typography color="error">
                      Breakout options not available for {topology.configuration.leafConfig.downlinkSpeed}
                    </Typography>
                  )}
                  
                  <Tooltip title="Breakout modes allow a single physical port to be split into multiple logical ports. For example, a 100G port can be broken out into 4x25G ports.">
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      <InfoIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                      Configure how downstream ports are broken out
                    </Typography>
                  </Tooltip>
                </Box>
                
                {/* Maximum server connections calculation */}
                {(() => {
                  const { portCount, downlinkSpeed, breakoutMode } = topology.configuration.leafConfig;
                  
                  // Check if breakoutOptions exists and has the right structure
                  if (!topology.configuration.breakoutOptions || 
                      !topology.configuration.breakoutOptions[downlinkSpeed]) {
                    return null;
                  }
                  
                  const breakoutOption = topology.configuration.breakoutOptions[downlinkSpeed].find(
                    option => option.type === breakoutMode
                  );
                  const breakoutFactor = breakoutOption ? breakoutOption.factor : 1;
                  
                  // Calculate total server-facing ports
                  // For leaf switches, we need to subtract the ports used for uplinks
                  const uplinkPorts = topology.configuration.numTiers > 1 ? topology.configuration.numSpines : 0;
                  const availableDownlinkPorts = Math.max(0, portCount - uplinkPorts);
                  const maxServerConnections = availableDownlinkPorts * breakoutFactor;
                  
                  return (
                    <Box sx={{ mt: 2, p: 1, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="subtitle2">
                        Maximum Server Connections: {maxServerConnections}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {availableDownlinkPorts} downlink ports × {breakoutFactor} connections per port
                      </Typography>
                    </Box>
                  );
                })()}
              </Box>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Device Selection Tab */}
        <TabPanel value={tabValue} index={1}>
          <DeviceSelection topology={topology} setTopology={setTopology} />
        </TabPanel>
        
        {/* Advanced Configuration Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={topology.configuration.disjointedSpines}
                    onChange={(e) => handleConfigChange('disjointedSpines', e.target.checked)}
                  />
                }
                label="Disjointed Spines (Multiple Fabrics)"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={topology.configuration.railOptimized}
                    onChange={(e) => handleConfigChange('railOptimized', e.target.checked)}
                  />
                }
                label="Rail Optimized"
              />
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Cost & Power Tab */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Switch Cost</Typography>
              <TextField
                label="Spine Switch Cost"
                value={topology.configuration.switchCost.spine}
                onChange={(e) => handleNestedConfigChange('switchCost', 'spine', parseInt(e.target.value) || 0)}
                type="number"
                fullWidth
                margin="normal"
              />
              <TextField
                label="Leaf Switch Cost"
                value={topology.configuration.switchCost.leaf}
                onChange={(e) => handleNestedConfigChange('switchCost', 'leaf', parseInt(e.target.value) || 0)}
                type="number"
                fullWidth
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Optics Cost</Typography>
              <TextField
                label="100G Optic Cost"
                value={topology.configuration.opticsCost['100G']}
                onChange={(e) => {
                  const updatedOpticsCost = { ...topology.configuration.opticsCost };
                  updatedOpticsCost['100G'] = parseInt(e.target.value) || 0;
                  handleConfigChange('opticsCost', updatedOpticsCost);
                }}
                type="number"
                fullWidth
                margin="normal"
              />
              <TextField
                label="200G Optic Cost"
                value={topology.configuration.opticsCost['200G']}
                onChange={(e) => {
                  const updatedOpticsCost = { ...topology.configuration.opticsCost };
                  updatedOpticsCost['200G'] = parseInt(e.target.value) || 0;
                  handleConfigChange('opticsCost', updatedOpticsCost);
                }}
                type="number"
                fullWidth
                margin="normal"
              />
              <TextField
                label="400G Optic Cost"
                value={topology.configuration.opticsCost['400G']}
                onChange={(e) => {
                  const updatedOpticsCost = { ...topology.configuration.opticsCost };
                  updatedOpticsCost['400G'] = parseInt(e.target.value) || 0;
                  handleConfigChange('opticsCost', updatedOpticsCost);
                }}
                type="number"
                fullWidth
                margin="normal"
              />
              <TextField
                label="800G Optic Cost"
                value={topology.configuration.opticsCost['800G']}
                onChange={(e) => {
                  const updatedOpticsCost = { ...topology.configuration.opticsCost };
                  updatedOpticsCost['800G'] = parseInt(e.target.value) || 0;
                  handleConfigChange('opticsCost', updatedOpticsCost);
                }}
                type="number"
                fullWidth
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Power Usage (Watts)</Typography>
              <TextField
                label="Spine Switch Power"
                value={topology.configuration.powerUsage.spine}
                onChange={(e) => handleNestedConfigChange('powerUsage', 'spine', parseInt(e.target.value) || 0)}
                type="number"
                fullWidth
                margin="normal"
              />
              <TextField
                label="Leaf Switch Power"
                value={topology.configuration.powerUsage.leaf}
                onChange={(e) => handleNestedConfigChange('powerUsage', 'leaf', parseInt(e.target.value) || 0)}
                type="number"
                fullWidth
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Optics Power (Watts)</Typography>
              <TextField
                label="100G Optic Power"
                value={topology.configuration.powerUsage.optics['100G']}
                onChange={(e) => {
                  const updatedOptics = { ...topology.configuration.powerUsage.optics };
                  updatedOptics['100G'] = parseInt(e.target.value) || 0;
                  handleNestedConfigChange('powerUsage', 'optics', updatedOptics);
                }}
                type="number"
                fullWidth
                margin="normal"
              />
              <TextField
                label="200G Optic Power"
                value={topology.configuration.powerUsage.optics['200G']}
                onChange={(e) => {
                  const updatedOptics = { ...topology.configuration.powerUsage.optics };
                  updatedOptics['200G'] = parseInt(e.target.value) || 0;
                  handleNestedConfigChange('powerUsage', 'optics', updatedOptics);
                }}
                type="number"
                fullWidth
                margin="normal"
              />
              <TextField
                label="400G Optic Power"
                value={topology.configuration.powerUsage.optics['400G']}
                onChange={(e) => {
                  const updatedOptics = { ...topology.configuration.powerUsage.optics };
                  updatedOptics['400G'] = parseInt(e.target.value) || 0;
                  handleNestedConfigChange('powerUsage', 'optics', updatedOptics);
                }}
                type="number"
                fullWidth
                margin="normal"
              />
              <TextField
                label="800G Optic Power"
                value={topology.configuration.powerUsage.optics['800G']}
                onChange={(e) => {
                  const updatedOptics = { ...topology.configuration.powerUsage.optics };
                  updatedOptics['800G'] = parseInt(e.target.value) || 0;
                  handleNestedConfigChange('powerUsage', 'optics', updatedOptics);
                }}
                type="number"
                fullWidth
                margin="normal"
              />
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Other Parameters Tab */}
        <TabPanel value={tabValue} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Latency Parameters</Typography>
              <TextField
                label="Switch Latency (microseconds)"
                value={topology.configuration.latencyParameters.switchLatency}
                onChange={(e) => {
                  const updatedLatencyParams = { ...topology.configuration.latencyParameters };
                  updatedLatencyParams.switchLatency = parseFloat(e.target.value) || 0;
                  handleConfigChange('latencyParameters', updatedLatencyParams);
                }}
                type="number"
                fullWidth
                margin="normal"
              />
              <TextField
                label="Fiber Latency (microseconds per km)"
                value={topology.configuration.latencyParameters.fiberLatency}
                onChange={(e) => {
                  const updatedLatencyParams = { ...topology.configuration.latencyParameters };
                  updatedLatencyParams.fiberLatency = parseFloat(e.target.value) || 0;
                  handleConfigChange('latencyParameters', updatedLatencyParams);
                }}
                type="number"
                fullWidth
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Rack Space Parameters</Typography>
              <TextField
                label="Spine Rack Units"
                value={topology.configuration.rackSpaceParameters.spineRackUnits}
                onChange={(e) => {
                  const updatedRackParams = { ...topology.configuration.rackSpaceParameters };
                  updatedRackParams.spineRackUnits = parseInt(e.target.value) || 0;
                  handleConfigChange('rackSpaceParameters', updatedRackParams);
                }}
                type="number"
                fullWidth
                margin="normal"
              />
              <TextField
                label="Leaf Rack Units"
                value={topology.configuration.rackSpaceParameters.leafRackUnits}
                onChange={(e) => {
                  const updatedRackParams = { ...topology.configuration.rackSpaceParameters };
                  updatedRackParams.leafRackUnits = parseInt(e.target.value) || 0;
                  handleConfigChange('rackSpaceParameters', updatedRackParams);
                }}
                type="number"
                fullWidth
                margin="normal"
              />
            </Grid>
          </Grid>
        </TabPanel>
      </CardContent>
    </Card>
  );
};

export default TopologyForm;
