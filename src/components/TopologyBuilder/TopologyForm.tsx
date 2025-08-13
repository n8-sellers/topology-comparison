import React, { useState, useEffect, useMemo } from 'react';
import { useTopology } from '../../context/TopologyContext';
import { exportTopology } from '../../utils/importExport';
import DeviceSelection from './DeviceSelection';
import CostPowerConfigPanel from './CostPowerConfigPanel';
import DeviceManagementService from '../../services/DeviceManagementService';
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
  Tooltip,
  Chip,
  TooltipProps
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import InfoIcon from '@mui/icons-material/Info';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { 
  Topology, 
  TopologyConfiguration, 
  BreakoutOption,
  SpineConfig,
  LeafConfig
} from '../../types/topology';
import { LeafDevice } from '../../types/devices';
import { validateParallelLinks } from '../../services/CalculationService';

// Interface for TabPanel props
interface TabPanelProps {
  children?: React.ReactNode;
  value: number;
  index: number;
}

// Interface for validation errors
interface ValidationErrors {
  [key: string]: string;
}

// TabPanel component for the tabbed interface
const TabPanel = ({ children, value, index }: TabPanelProps) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`topology-tabpanel-${index}`}
      aria-labelledby={`topology-tab-${index}`}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

// Helper function to snap to common network fabric sizes
const snapToCommonValue = (value: number, commonValues: number[], snapThreshold = 5): number => {
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
    updateTopologyWithAutoSave,
    deleteTopology,
    duplicateTopology,
    autoSave,
    toggleAutoSave,
    saveStatus
  } = useTopology();
  
  const [topology, setTopology] = useState<Topology | null>(null);
  const [tabValue, setTabValue] = useState<number>(0);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  
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
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number): void => {
    setTabValue(newValue);
  };
  
  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    if (!topology) return;
    
    const { name, value } = e.target;
    const updatedTopology = {
      ...topology,
      [name]: value
    };
    setTopology(updatedTopology);
    
    // Auto-save the topology
    if (autoSave) {
      updateTopologyWithAutoSave(updatedTopology);
    }
  };
  
  // Ensure minimum tiers based on spine and leaf counts
  const ensureMinimumTiers = (config: TopologyConfiguration): TopologyConfiguration => {
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
  const handleConfigChange = (field: keyof TopologyConfiguration, value: any): void => {
    if (!topology) return;
    
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
    
    // Auto-save the topology
    if (autoSave) {
      updateTopologyWithAutoSave(updatedTopology);
    }
  };
  
  // Handle nested configuration field changes
  const handleNestedConfigChange = <T extends keyof TopologyConfiguration>(
    parent: T, 
    field: string, 
    value: any
  ): void => {
    if (!topology) return;
    
    // Create a new object for the parent property to avoid spread error
    const parentConfig = topology.configuration[parent] || {};
    const updatedParentConfig = {
      ...parentConfig,
      [field]: value
    };
    
    const updatedTopology = {
      ...topology,
      configuration: {
        ...topology.configuration,
        [parent]: updatedParentConfig
      }
    };
    
    // Validate the updated topology
    validateTopology(updatedTopology);
    
    setTopology(updatedTopology);
    
    // Auto-save the topology
    if (autoSave) {
      updateTopologyWithAutoSave(updatedTopology);
    }
  };
  
  // Validate the topology configuration
  const validateTopology = (topologyToValidate: Topology): boolean => {
    const errors: ValidationErrors = {};
    
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
        !('portSpeed' in topologyToValidate.configuration.breakoutOptions)) {
      errors.spineConfig = 'Invalid breakout options configuration';
      setValidationErrors(errors);
      return Object.keys(errors).length === 0;
    }
    
    const breakoutOptions = topologyToValidate.configuration.breakoutOptions as Record<string, BreakoutOption[]>;
    
    if (!breakoutOptions[portSpeed]) {
      errors.spineConfig = `No breakout options available for ${portSpeed}`;
      setValidationErrors(errors);
      return Object.keys(errors).length === 0;
    }
    
    const breakoutOption = breakoutOptions[portSpeed].find(
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
  const handleSave = (): void => {
    // Validate before saving
    if (topology && validateTopology(topology)) {
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
  
  // Get save status indicator
  const getSaveStatusIndicator = (): React.ReactElement => {
    switch (saveStatus) {
      case 'saving':
        return (
          <Chip
            icon={<AutorenewIcon className="rotating-icon" />}
            label="Saving..."
            size="small"
            color="primary"
            variant="outlined"
            sx={{ marginRight: 2 }}
          />
        );
      case 'error':
        return (
          <Chip
            icon={<ErrorOutlineIcon />}
            label="Save error"
            size="small"
            color="error"
            variant="outlined"
            sx={{ marginRight: 2 }}
          />
        );
      case 'saved':
      default:
        return autoSave ? (
          <Chip
            icon={<SaveIcon />}
            label="Auto-save on"
            size="small"
            color="success"
            variant="outlined"
            sx={{ marginRight: 2 }}
          />
        ) : (
          <Chip
            label="Auto-save off"
            size="small"
            color="default"
            variant="outlined"
            sx={{ marginRight: 2 }}
          />
        );
    }
  };
  
  // Delete topology
  const handleDelete = (): void => {
    if (!topology) return;
    
    if (window.confirm('Are you sure you want to delete this topology?')) {
      deleteTopology(topology.id);
    }
  };
  
  // Duplicate topology
  const handleDuplicate = (): void => {
    if (!topology) return;
    
    duplicateTopology(topology.id);
  };
  
  // If topology is not loaded yet, show loading
  if (!topology) {
    return <Typography>Loading...</Typography>;
  }
  
  // Render device selection tab
  const renderDeviceSelection = () => {
    return (
      <TabPanel value={tabValue} index={1}>
        <DeviceSelection topology={topology} setTopology={setTopology} />
      </TabPanel>
    );
  };

  // Calculate parallel links status for display
  const getParallelLinksStatus = () => {
    if (!topology.configuration.parallelLinksEnabled) {
      return null;
    }
    
    const { numSpines, leafConfig, parallelLinksMode, parallelLinksPerSpine } = topology.configuration;
    
    if (numSpines === 0) {
      return "N/A (single-tier)";
    }
    
    let linksPerSpine = 1;
    if (parallelLinksMode === 'manual' && parallelLinksPerSpine) {
      linksPerSpine = parallelLinksPerSpine;
    } else {
      // Auto mode calculation
      const leafPortCount = leafConfig?.portCount || 48;
      const estimatedDownlinkPorts = Math.floor(leafPortCount * 0.5);
      const availableUplinkPorts = leafPortCount - estimatedDownlinkPorts;
      linksPerSpine = Math.max(1, Math.floor(availableUplinkPorts / numSpines));
    }
    
    const totalUplinksUsed = linksPerSpine * numSpines;
    const leafPortCount = leafConfig?.portCount || 48;
    
    return `Using ${totalUplinksUsed}/${leafPortCount} uplink ports per leaf (${linksPerSpine} links per spine)`;
  };

  // Render advanced configuration tab
  const renderAdvancedConfiguration = () => {
    const parallelLinksValidation = validateParallelLinks(topology.configuration);
    
    console.log('Rendering Advanced Configuration Tab');
    console.log('Parallel Links Enabled:', topology.configuration.parallelLinksEnabled);
    console.log('Num Spines:', topology.configuration.numSpines);
    
    return (
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
          
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={topology.configuration.parallelLinksEnabled || false}
                  onChange={(e) => handleConfigChange('parallelLinksEnabled', e.target.checked)}
                  disabled={topology.configuration.numSpines === 0}
                />
              }
              label="Enable Parallel Links"
            />
            {topology.configuration.numSpines === 0 && (
              <Typography variant="caption" color="text.secondary" display="block">
                Parallel links are not applicable for single-tier topologies
              </Typography>
            )}
          </Grid>
          
          {topology.configuration.parallelLinksEnabled && topology.configuration.numSpines > 0 && (
            <>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={topology.configuration.parallelLinksMode === 'manual'}
                      onChange={(e) => handleConfigChange('parallelLinksMode', e.target.checked ? 'manual' : 'auto')}
                    />
                  }
                  label="Manual Mode"
                />
                <Typography variant="caption" color="text.secondary" display="block">
                  {topology.configuration.parallelLinksMode === 'manual' 
                    ? 'Manually specify number of parallel links' 
                    : 'Automatically calculate optimal parallel links'}
                </Typography>
              </Grid>
              
              {topology.configuration.parallelLinksMode === 'manual' && (
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Links per Spine"
                    type="number"
                    value={topology.configuration.parallelLinksPerSpine || 1}
                    onChange={(e) => handleConfigChange('parallelLinksPerSpine', parseInt(e.target.value) || 1)}
                    inputProps={{ min: 1, max: 32 }}
                    size="small"
                    error={!parallelLinksValidation.valid}
                    helperText={parallelLinksValidation.error}
                  />
                </Grid>
              )}
              
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Status:</strong> {getParallelLinksStatus()}
                </Typography>
              </Grid>
            </>
          )}
        </Grid>
      </TabPanel>
    );
  };

  // Render cost & power tab
  const renderCostPower = () => {
    return (
      <TabPanel value={tabValue} index={3}>
        <CostPowerConfigPanel 
          topology={topology}
          setTopology={setTopology}
          selectedSpineDevice={
            topology.configuration.deviceSelection?.spine?.deviceId 
              ? DeviceManagementService.sync.getDeviceById('spine', topology.configuration.deviceSelection.spine.deviceId)
              : null
          }
          selectedLeafDevice={
            topology.configuration.deviceSelection?.leaf?.deviceId 
              ? DeviceManagementService.sync.getDeviceById('leaf', topology.configuration.deviceSelection.leaf.deviceId) as LeafDevice
              : null
          }
          panelType="detailed"
        />
      </TabPanel>
    );
  };

  // Render other parameters tab
  const renderOtherParameters = () => {
    return (
      <TabPanel value={tabValue} index={4}>
        <Typography variant="h6">Additional Parameters</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography>Additional configuration parameters.</Typography>
          </Grid>
        </Grid>
      </TabPanel>
    );
  };
  
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
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {getSaveStatusIndicator()}
            
            <Tooltip title={autoSave ? "Disable Auto-Save" : "Enable Auto-Save"}>
              <IconButton 
                onClick={toggleAutoSave} 
                color={autoSave ? "success" : "default"}
                sx={{ mr: 1 }}
              >
                <SaveIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Save Topology Now">
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
                <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24">
                  <path d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z"/>
                </svg>
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
          {/* Topology Mode Indicators */}
          {((topology.configuration.numTiers === 1 && topology.configuration.numSpines === 0) || topology.configuration.parallelLinksEnabled) && (
            <Box sx={{ mb: 3 }}>
              {topology.configuration.numTiers === 1 && topology.configuration.numSpines === 0 && (
                <Chip 
                  label="Rail-Only Topology (Single-Tier)" 
                  color="info" 
                  icon={<InfoIcon />}
                  sx={{ mr: 1, mb: 1 }}
                />
              )}
              
              {topology.configuration.parallelLinksEnabled && topology.configuration.numSpines > 0 && (
                <Chip 
                  label={`Parallel Links (${(() => {
                    const { numSpines, leafConfig, parallelLinksMode, parallelLinksPerSpine } = topology.configuration;
                    let linksPerSpine = 1;
                    if (parallelLinksMode === 'manual' && parallelLinksPerSpine) {
                      linksPerSpine = parallelLinksPerSpine;
                    } else {
                      const leafPortCount = leafConfig?.portCount || 48;
                      const estimatedDownlinkPorts = Math.floor(leafPortCount * 0.5);
                      const availableUplinkPorts = leafPortCount - estimatedDownlinkPorts;
                      linksPerSpine = Math.max(1, Math.floor(availableUplinkPorts / numSpines));
                    }
                    return `${linksPerSpine}x`;
                  })()})`}
                  color="secondary" 
                  size="small"
                  sx={{ mr: 1, mb: 1 }}
                />
              )}
              
              <Typography variant="caption" color="text.secondary" display="block">
                {topology.configuration.numTiers === 1 && topology.configuration.numSpines === 0 && 
                  "In Rail-Only mode, leaf switches connect directly to each other without spine switches."
                }
                {topology.configuration.parallelLinksEnabled && topology.configuration.numSpines > 0 && 
                  " Multiple parallel links between each leaf-spine pair for higher bandwidth and redundancy."
                }
              </Typography>
            </Box>
          )}
          
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
                onChange={(_e: Event, value: number | number[]) => {
                  const numericValue = Array.isArray(value) ? value[0] : value;
                  const snappedValue = snapToCommonValue(numericValue, spineCommonValues);
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
                onChange={(_e: Event, value: number | number[]) => {
                  const numericValue = Array.isArray(value) ? value[0] : value;
                  const snappedValue = snapToCommonValue(numericValue, leafCommonValues);
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
              <Typography gutterBottom>
                Number of Tiers
                <Tooltip title="1 tier = Rail-Only (leaf only), 2 tiers = Spine-Leaf, 3 tiers = Super-Spine-Spine-Leaf">
                  <IconButton size="small" sx={{ ml: 1 }}>
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Typography>
              <Slider
                value={topology.configuration.numTiers}
                onChange={(_e: Event, value: number | number[]) => {
                  const numericValue = Array.isArray(value) ? value[0] : value;
                  // When switching to single-tier, automatically set spines to 0
                  if (numericValue === 1) {
                    handleConfigChange('numSpines', 0);
                    handleConfigChange('numTiers', 1);
                  } 
                  // Enforce minimum tier value of 2 when spine switches exist
                  else if (topology.configuration.numSpines > 0 && numericValue < 2) {
                    handleConfigChange('numTiers', 2);
                  } else {
                    handleConfigChange('numTiers', numericValue);
                  }
                }}
                step={1}
                marks={[
                  { value: 1, label: 'Rail-Only' },
                  { value: 2, label: 'Spine-Leaf' },
                  { value: 3, label: '3-Tier' }
                ]}
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
          </Grid>
        </TabPanel>
        
        {/* Render other tabs */}
        {renderDeviceSelection()}
        {renderAdvancedConfiguration()}
        {renderCostPower()}
        {renderOtherParameters()}
        
      </CardContent>
    </Card>
  );
};

export default TopologyForm;
