import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Slider,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  Divider,
  Chip,
} from '@mui/material';
import PaidIcon from '@mui/icons-material/Paid';
import BoltIcon from '@mui/icons-material/Bolt';
import { Topology } from '../../types/topology';
import { Device, LeafDevice } from '../../types/devices';

interface CostPowerConfigPanelProps {
  topology: Topology;
  setTopology: (topology: any) => void;
  selectedSpineDevice: Device | null;
  selectedLeafDevice: LeafDevice | null;
  panelType?: 'compact' | 'detailed';
  opticConfig?: boolean;
}


/**
 * Shared component for cost and power settings
 * Used in both DeviceSelection and Cost & Power tabs
 */
const CostPowerConfigPanel = ({
  topology,
  setTopology,
  selectedSpineDevice,
  selectedLeafDevice,
  panelType = 'compact',
  opticConfig = true
}: CostPowerConfigPanelProps) => {
  // Check if a value is using device default
  const isUsingDeviceDefault = (type: 'spine' | 'leaf', property: 'cost' | 'power'): boolean => {
    if (type === 'spine' && selectedSpineDevice) {
      if (property === 'cost') {
        return topology.configuration.switchCost.spine === selectedSpineDevice.cost;
      } else {
        return topology.configuration.powerUsage.spine === selectedSpineDevice.powerConsumption.typical;
      }
    } else if (type === 'leaf' && selectedLeafDevice) {
      if (property === 'cost') {
        return topology.configuration.switchCost.leaf === selectedLeafDevice.cost;
      } else {
        return topology.configuration.powerUsage.leaf === selectedLeafDevice.powerConsumption.typical;
      }
    }
    return false;
  };

  // Override source helpers
  const getPricingSource = (type: 'spine' | 'leaf'): 'global' | 'device-default' | 'manual' => {
    return topology.configuration.deviceSelection?.[type]?.pricingSource || 'global';
  };
  const isOverridden = (type: 'spine' | 'leaf'): boolean => getPricingSource(type) !== 'global';
  const clearOverride = (type: 'spine' | 'leaf') => {
    const updated = { ...topology } as any;
    const sel = updated.configuration.deviceSelection || {};
    const role = { ...(sel[type] || {}) };
    delete (role as any).costOverride;
    delete (role as any).powerOverride;
    (role as any).pricingSource = 'global';
    updated.configuration.deviceSelection = { ...sel, [type]: role };
    setTopology(updated);
  };

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Format power values (watts to kilowatts when appropriate)
  const formatPower = (watts: number): string => {
    if (watts < 1000) {
      return `${watts} W`;
    } else {
      return `${(watts / 1000).toFixed(2)} kW`;
    }
  };

  // Handle spine switch cost change
  const handleSpineCostChange = (value: number) => {
    const updatedTopology = {
      ...topology,
      configuration: {
        ...topology.configuration,
        switchCost: {
          ...topology.configuration.switchCost,
          spine: value
        }
      }
    };
    setTopology(updatedTopology);
  };

  // Handle leaf switch cost change
  const handleLeafCostChange = (value: number) => {
    const updatedTopology = {
      ...topology,
      configuration: {
        ...topology.configuration,
        switchCost: {
          ...topology.configuration.switchCost,
          leaf: value
        }
      }
    };
    setTopology(updatedTopology);
  };

  // Handle spine power usage change
  const handleSpinePowerChange = (value: number) => {
    const updatedTopology = {
      ...topology,
      configuration: {
        ...topology.configuration,
        powerUsage: {
          ...topology.configuration.powerUsage,
          spine: value
        }
      }
    };
    setTopology(updatedTopology);
  };

  // Handle leaf power usage change
  const handleLeafPowerChange = (value: number) => {
    const updatedTopology = {
      ...topology,
      configuration: {
        ...topology.configuration,
        powerUsage: {
          ...topology.configuration.powerUsage,
          leaf: value
        }
      }
    };
    setTopology(updatedTopology);
  };

  // Get the default port speed to use for optics cost
  const getDefaultPortSpeed = (): string => {
    // Use spine port speed as default
    return topology.configuration.spineConfig?.portSpeed || '100G';
  };
  
  // Get current optics cost value based on port speed
  const getCurrentOpticsCostValue = (): number => {
    const portSpeed = getDefaultPortSpeed();
    // Return the cost for this port speed or a default
    return topology.configuration.opticsCost[portSpeed] || 1000;
  };

  // Handle optics cost change
  const handleOpticsCostChange = (value: number) => {
    const portSpeed = getDefaultPortSpeed();
    const updatedTopology = {
      ...topology,
      configuration: {
        ...topology.configuration,
        opticsCost: {
          ...topology.configuration.opticsCost,
          [portSpeed]: value  // Update the value for current port speed
        }
      }
    };
    setTopology(updatedTopology);
  };

  // Handle optics power usage change
  const handleOpticsPowerChange = (value: number) => {
    const updatedTopology = {
      ...topology,
      configuration: {
        ...topology.configuration,
        opticsPower: value
      }
    };
    setTopology(updatedTopology);
  };


  // Reset to device default value
  const resetToDeviceDefault = (type: 'spine' | 'leaf', property: 'cost' | 'power') => {
    if (type === 'spine' && selectedSpineDevice) {
      if (property === 'cost') {
        handleSpineCostChange(selectedSpineDevice.cost);
      } else {
        handleSpinePowerChange(selectedSpineDevice.powerConsumption.typical);
      }
    } else if (type === 'leaf' && selectedLeafDevice) {
      if (property === 'cost') {
        handleLeafCostChange(selectedLeafDevice.cost);
      } else {
        handleLeafPowerChange(selectedLeafDevice.powerConsumption.typical);
      }
    }
  };

  if (panelType === 'compact') {
    // Compact version for use in Device Selection tab
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Global Cost & Power Defaults
          </Typography>
          <Typography variant="caption" color="text.secondary" gutterBottom display="block">
            These values apply unless a selected device sets a pricing override in Device Selection.
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Grid container alignItems="center" spacing={1}>
                  <Grid item>
                    <Typography variant="subtitle1">Spine Switch Cost</Typography>
                  </Grid>
                  <Grid item sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                    {isUsingDeviceDefault('spine', 'cost') && selectedSpineDevice && (
                      <Chip size="small" label="Device Default" color="primary" variant="outlined" />
                    )}
                    {isOverridden('spine') && (
                      <>
                        <Chip
                          size="small"
                          label={`Overridden (${getPricingSource('spine') === 'manual' ? 'Manual' : 'Device Default'})`}
                          color="secondary"
                          variant="outlined"
                        />
                        <Typography
                          variant="caption"
                          sx={{ ml: 0.5, cursor: 'pointer', textDecoration: 'underline' }}
                          onClick={() => clearOverride('spine')}
                        >
                          Clear override
                        </Typography>
                      </>
                    )}
                  </Grid>
                </Grid>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FormControl fullWidth sx={{ mr: 1 }}>
                    <InputLabel htmlFor="spine-cost-input">Cost</InputLabel>
                    <OutlinedInput
                      id="spine-cost-input"
                      startAdornment={<InputAdornment position="start">$</InputAdornment>}
                      label="Cost"
                      type="number"
                      value={topology.configuration.switchCost.spine}
                      onChange={(e) => handleSpineCostChange(Number(e.target.value))}
                      size="small"
                      sx={{ '& input': { fontFamily: '"JetBrains Mono", monospace' } }}
                    />
                  </FormControl>
                  {selectedSpineDevice && (
                    <Typography 
                      variant="caption" 
                      sx={{ ml: 1, cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => resetToDeviceDefault('spine', 'cost')}
                    >
                      Reset to Default ({formatCurrency(selectedSpineDevice.cost)})
                    </Typography>
                  )}
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Grid container alignItems="center" spacing={1}>
                  <Grid item>
                    <Typography variant="subtitle1">Spine Switch Power</Typography>
                  </Grid>
                  <Grid item sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                    {isUsingDeviceDefault('spine', 'power') && selectedSpineDevice && (
                      <Chip size="small" label="Device Default" color="primary" variant="outlined" />
                    )}
                    {isOverridden('spine') && (
                      <>
                        <Chip
                          size="small"
                          label={`Overridden (${getPricingSource('spine') === 'manual' ? 'Manual' : 'Device Default'})`}
                          color="secondary"
                          variant="outlined"
                        />
                        <Typography
                          variant="caption"
                          sx={{ ml: 0.5, cursor: 'pointer', textDecoration: 'underline' }}
                          onClick={() => clearOverride('spine')}
                        >
                          Clear override
                        </Typography>
                      </>
                    )}
                  </Grid>
                </Grid>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FormControl fullWidth sx={{ mr: 1 }}>
                    <InputLabel htmlFor="spine-power-input">Power</InputLabel>
                    <OutlinedInput
                      id="spine-power-input"
                      endAdornment={<InputAdornment position="end">W</InputAdornment>}
                      label="Power"
                      type="number"
                      value={topology.configuration.powerUsage.spine}
                      onChange={(e) => handleSpinePowerChange(Number(e.target.value))}
                      size="small"
                      sx={{ '& input': { fontFamily: '"JetBrains Mono", monospace' } }}
                    />
                  </FormControl>
                  {selectedSpineDevice && (
                    <Typography 
                      variant="caption" 
                      sx={{ ml: 1, cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => resetToDeviceDefault('spine', 'power')}
                    >
                      Reset to Default ({formatPower(selectedSpineDevice.powerConsumption.typical)})
                    </Typography>
                  )}
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Grid container alignItems="center" spacing={1}>
                  <Grid item>
                    <Typography variant="subtitle1">Leaf Switch Cost</Typography>
                  </Grid>
                  <Grid item sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                    {isUsingDeviceDefault('leaf', 'cost') && selectedLeafDevice && (
                      <Chip size="small" label="Device Default" color="primary" variant="outlined" />
                    )}
                    {isOverridden('leaf') && (
                      <>
                        <Chip
                          size="small"
                          label={`Overridden (${getPricingSource('leaf') === 'manual' ? 'Manual' : 'Device Default'})`}
                          color="secondary"
                          variant="outlined"
                        />
                        <Typography
                          variant="caption"
                          sx={{ ml: 0.5, cursor: 'pointer', textDecoration: 'underline' }}
                          onClick={() => clearOverride('leaf')}
                        >
                          Clear override
                        </Typography>
                      </>
                    )}
                  </Grid>
                </Grid>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FormControl fullWidth sx={{ mr: 1 }}>
                    <InputLabel htmlFor="leaf-cost-input">Cost</InputLabel>
                    <OutlinedInput
                      id="leaf-cost-input"
                      startAdornment={<InputAdornment position="start">$</InputAdornment>}
                      label="Cost"
                      type="number"
                      value={topology.configuration.switchCost.leaf}
                      onChange={(e) => handleLeafCostChange(Number(e.target.value))}
                      size="small"
                      sx={{ '& input': { fontFamily: '"JetBrains Mono", monospace' } }}
                    />
                  </FormControl>
                  {selectedLeafDevice && (
                    <Typography 
                      variant="caption" 
                      sx={{ ml: 1, cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => resetToDeviceDefault('leaf', 'cost')}
                    >
                      Reset to Default ({formatCurrency(selectedLeafDevice.cost)})
                    </Typography>
                  )}
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Grid container alignItems="center" spacing={1}>
                  <Grid item>
                    <Typography variant="subtitle1">Leaf Switch Power</Typography>
                  </Grid>
                  <Grid item sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                    {isUsingDeviceDefault('leaf', 'power') && selectedLeafDevice && (
                      <Chip size="small" label="Device Default" color="primary" variant="outlined" />
                    )}
                    {isOverridden('leaf') && (
                      <>
                        <Chip
                          size="small"
                          label={`Overridden (${getPricingSource('leaf') === 'manual' ? 'Manual' : 'Device Default'})`}
                          color="secondary"
                          variant="outlined"
                        />
                        <Typography
                          variant="caption"
                          sx={{ ml: 0.5, cursor: 'pointer', textDecoration: 'underline' }}
                          onClick={() => clearOverride('leaf')}
                        >
                          Clear override
                        </Typography>
                      </>
                    )}
                  </Grid>
                </Grid>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FormControl fullWidth sx={{ mr: 1 }}>
                    <InputLabel htmlFor="leaf-power-input">Power</InputLabel>
                    <OutlinedInput
                      id="leaf-power-input"
                      endAdornment={<InputAdornment position="end">W</InputAdornment>}
                      label="Power"
                      type="number"
                      value={topology.configuration.powerUsage.leaf}
                      onChange={(e) => handleLeafPowerChange(Number(e.target.value))}
                      size="small"
                      sx={{ '& input': { fontFamily: '"JetBrains Mono", monospace' } }}
                    />
                  </FormControl>
                  {selectedLeafDevice && (
                    <Typography 
                      variant="caption" 
                      sx={{ ml: 1, cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => resetToDeviceDefault('leaf', 'power')}
                    >
                      Reset to Default ({formatPower(selectedLeafDevice.powerConsumption.typical)})
                    </Typography>
                  )}
                </Box>
              </Box>
            </Grid>

            {opticConfig && (
              <>
                <Grid item xs={12}>
                  <Divider>
                    <Typography variant="body2" color="text.secondary">
                      Optics Configuration
                    </Typography>
                  </Divider>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1">Optics Cost (per unit)</Typography>
                    <FormControl fullWidth>
                      <InputLabel htmlFor="optics-cost-input">Cost</InputLabel>
                      <OutlinedInput
                        id="optics-cost-input"
                        startAdornment={<InputAdornment position="start">$</InputAdornment>}
                        label="Cost"
                        type="number"
                        value={getCurrentOpticsCostValue()}
                        onChange={(e) => handleOpticsCostChange(Number(e.target.value))}
                        size="small"
                      />
                    </FormControl>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1">Optics Power Usage (per unit)</Typography>
                    <FormControl fullWidth>
                      <InputLabel htmlFor="optics-power-input">Power</InputLabel>
                      <OutlinedInput
                        id="optics-power-input"
                        endAdornment={<InputAdornment position="end">W</InputAdornment>}
                        label="Power"
                        type="number"
                        value={topology.configuration.opticsPower || 3.5}
                        onChange={(e) => handleOpticsPowerChange(Number(e.target.value))}
                        size="small"
                      />
                    </FormControl>
                  </Box>
                </Grid>
              </>
            )}
          </Grid>
        </CardContent>
      </Card>
    );
  } else {
    // Detailed version for Cost & Power tab with more information
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Global Cost & Power Defaults
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            These defaults are used unless a selected device specifies a pricing override in Device Selection.
          </Typography>
          <Grid container spacing={3}>
            {/* Spine Switch Settings */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PaidIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Spine Switch Cost</Typography>
                    {isUsingDeviceDefault('spine', 'cost') && selectedSpineDevice && (
                      <Chip 
                        size="small" 
                        label="Device Default" 
                        color="primary" 
                        variant="outlined" 
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Cost per spine switch. Affects total deployment cost calculations.
                  </Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel htmlFor="detailed-spine-cost-input">Cost</InputLabel>
                      <OutlinedInput
                        id="detailed-spine-cost-input"
                        startAdornment={<InputAdornment position="start">$</InputAdornment>}
                        label="Cost"
                        type="number"
                        value={topology.configuration.switchCost.spine}
                        onChange={(e) => handleSpineCostChange(Number(e.target.value))}
                      />
                    </FormControl>
                    
                    <Slider
                      value={topology.configuration.switchCost.spine}
                      onChange={(_e, value) => handleSpineCostChange(Array.isArray(value) ? value[0] : value)}
                      min={10000}
                      max={100000}
                      step={1000}
                      valueLabelDisplay="auto"
                      valueLabelFormat={(value) => formatCurrency(value)}
                      marks={[
                        { value: 10000, label: '$10K' },
                        { value: 50000, label: '$50K' },
                        { value: 100000, label: '$100K' },
                      ]}
                    />
                  </Box>
                  
                  {selectedSpineDevice && (
                    <Box sx={{ mt: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                      <Typography variant="subtitle2">
                        Selected Device: {selectedSpineDevice.manufacturer} {selectedSpineDevice.model}
                      </Typography>
                      <Typography variant="body2">
                        Default Cost: {formatCurrency(selectedSpineDevice.cost)}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ 
                          cursor: 'pointer', 
                          textDecoration: 'underline', 
                          color: 'primary.main',
                          mt: 1
                        }}
                        onClick={() => resetToDeviceDefault('spine', 'cost')}
                      >
                        Reset to Device Default
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <BoltIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Spine Switch Power</Typography>
                    {isUsingDeviceDefault('spine', 'power') && selectedSpineDevice && (
                      <Chip 
                        size="small" 
                        label="Device Default" 
                        color="primary" 
                        variant="outlined" 
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Power consumption per spine switch in watts. Affects energy cost calculations.
                  </Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel htmlFor="detailed-spine-power-input">Power</InputLabel>
                      <OutlinedInput
                        id="detailed-spine-power-input"
                        endAdornment={<InputAdornment position="end">W</InputAdornment>}
                        label="Power"
                        type="number"
                        value={topology.configuration.powerUsage.spine}
                        onChange={(e) => handleSpinePowerChange(Number(e.target.value))}
                      />
                    </FormControl>
                    
                    <Slider
                      value={topology.configuration.powerUsage.spine}
                      onChange={(_e, value) => handleSpinePowerChange(Array.isArray(value) ? value[0] : value)}
                      min={100}
                      max={2500}
                      step={100}
                      valueLabelDisplay="auto"
                      valueLabelFormat={(value) => formatPower(value)}
                      marks={[
                        { value: 500, label: '500W' },
                        { value: 1500, label: '1.5kW' },
                        { value: 2500, label: '2.5kW' },
                      ]}
                    />
                  </Box>
                  
                  {selectedSpineDevice && (
                    <Box sx={{ mt: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                      <Typography variant="subtitle2">
                        Selected Device: {selectedSpineDevice.manufacturer} {selectedSpineDevice.model}
                      </Typography>
                      <Typography variant="body2">
                        Default Power: {formatPower(selectedSpineDevice.powerConsumption.typical)}
                      </Typography>
                      <Typography variant="body2">
                        Max Power: {formatPower(selectedSpineDevice.powerConsumption.max)}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ 
                          cursor: 'pointer', 
                          textDecoration: 'underline', 
                          color: 'primary.main',
                          mt: 1
                        }}
                        onClick={() => resetToDeviceDefault('spine', 'power')}
                      >
                        Reset to Device Default
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            {/* Leaf Switch Settings */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PaidIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Leaf Switch Cost</Typography>
                    {isUsingDeviceDefault('leaf', 'cost') && selectedLeafDevice && (
                      <Chip 
                        size="small" 
                        label="Device Default" 
                        color="primary" 
                        variant="outlined" 
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Cost per leaf switch. Affects total deployment cost calculations.
                  </Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel htmlFor="detailed-leaf-cost-input">Cost</InputLabel>
                      <OutlinedInput
                        id="detailed-leaf-cost-input"
                        startAdornment={<InputAdornment position="start">$</InputAdornment>}
                        label="Cost"
                        type="number"
                        value={topology.configuration.switchCost.leaf}
                        onChange={(e) => handleLeafCostChange(Number(e.target.value))}
                      />
                    </FormControl>
                    
                    <Slider
                      value={topology.configuration.switchCost.leaf}
                      onChange={(_e, value) => handleLeafCostChange(Array.isArray(value) ? value[0] : value)}
                      min={5000}
                      max={50000}
                      step={1000}
                      valueLabelDisplay="auto"
                      valueLabelFormat={(value) => formatCurrency(value)}
                      marks={[
                        { value: 5000, label: '$5K' },
                        { value: 25000, label: '$25K' },
                        { value: 50000, label: '$50K' },
                      ]}
                    />
                  </Box>
                  
                  {selectedLeafDevice && (
                    <Box sx={{ mt: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                      <Typography variant="subtitle2">
                        Selected Device: {selectedLeafDevice.manufacturer} {selectedLeafDevice.model}
                      </Typography>
                      <Typography variant="body2">
                        Default Cost: {formatCurrency(selectedLeafDevice.cost)}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ 
                          cursor: 'pointer', 
                          textDecoration: 'underline', 
                          color: 'primary.main',
                          mt: 1
                        }}
                        onClick={() => resetToDeviceDefault('leaf', 'cost')}
                      >
                        Reset to Device Default
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <BoltIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Leaf Switch Power</Typography>
                    {isUsingDeviceDefault('leaf', 'power') && selectedLeafDevice && (
                      <Chip 
                        size="small" 
                        label="Device Default" 
                        color="primary" 
                        variant="outlined" 
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Power consumption per leaf switch in watts. Affects energy cost calculations.
                  </Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel htmlFor="detailed-leaf-power-input">Power</InputLabel>
                      <OutlinedInput
                        id="detailed-leaf-power-input"
                        endAdornment={<InputAdornment position="end">W</InputAdornment>}
                        label="Power"
                        type="number"
                        value={topology.configuration.powerUsage.leaf}
                        onChange={(e) => handleLeafPowerChange(Number(e.target.value))}
                      />
                    </FormControl>
                    
                    <Slider
                      value={topology.configuration.powerUsage.leaf}
                      onChange={(_e, value) => handleLeafPowerChange(Array.isArray(value) ? value[0] : value)}
                      min={100}
                      max={1500}
                      step={50}
                      valueLabelDisplay="auto"
                      valueLabelFormat={(value) => formatPower(value)}
                      marks={[
                        { value: 200, label: '200W' },
                        { value: 750, label: '750W' },
                        { value: 1500, label: '1.5kW' },
                      ]}
                    />
                  </Box>
                  
                  {selectedLeafDevice && (
                    <Box sx={{ mt: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                      <Typography variant="subtitle2">
                        Selected Device: {selectedLeafDevice.manufacturer} {selectedLeafDevice.model}
                      </Typography>
                      <Typography variant="body2">
                        Default Power: {formatPower(selectedLeafDevice.powerConsumption.typical)}
                      </Typography>
                      <Typography variant="body2">
                        Max Power: {formatPower(selectedLeafDevice.powerConsumption.max)}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ 
                          cursor: 'pointer', 
                          textDecoration: 'underline', 
                          color: 'primary.main',
                          mt: 1
                        }}
                        onClick={() => resetToDeviceDefault('leaf', 'power')}
                      >
                        Reset to Device Default
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
        
        {/* Optics Configuration */}
        {opticConfig && (
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Optics Configuration
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <PaidIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6">Optics Cost</Typography>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Cost per optics module. This will be multiplied by the total number of interfaces in the topology.
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel htmlFor="detailed-optics-cost-input">Cost Per Unit</InputLabel>
                        <OutlinedInput
                          id="detailed-optics-cost-input"
                          startAdornment={<InputAdornment position="start">$</InputAdornment>}
                          label="Cost Per Unit"
                          type="number"
                          value={getCurrentOpticsCostValue()}
                          onChange={(e) => handleOpticsCostChange(Number(e.target.value))}
                        />
                      </FormControl>
                      
                      <Slider
                        value={getCurrentOpticsCostValue()}
                        onChange={(_e, value) => handleOpticsCostChange(Array.isArray(value) ? value[0] : value)}
                        min={100}
                        max={5000}
                        step={100}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(value) => formatCurrency(value)}
                        marks={[
                          { value: 500, label: '$500' },
                          { value: 2500, label: '$2.5K' },
                          { value: 5000, label: '$5K' },
                        ]}
                      />
                    </Box>
                    
                    <Typography variant="body2">
                      Industry average optics costs:
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip 
                        label="10G: $200" 
                        size="small"
                        color="default"
                        variant="outlined"
                        sx={{ m: 0.5 }}
                      />
                      <Chip 
                        label="100G: $800" 
                        size="small"
                        color="default"
                        variant="outlined"
                        sx={{ m: 0.5 }}
                      />
                      <Chip 
                        label="400G: $2000" 
                        size="small"
                        color="default"
                        variant="outlined"
                        sx={{ m: 0.5 }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <BoltIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6">Optics Power Usage</Typography>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Power consumption per optic module in watts. Most optics consume 2-5W each.
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel htmlFor="detailed-optics-power-input">Power Per Unit</InputLabel>
                        <OutlinedInput
                          id="detailed-optics-power-input"
                          endAdornment={<InputAdornment position="end">W</InputAdornment>}
                          label="Power Per Unit"
                          type="number"
                          value={topology.configuration.opticsPower || 3.5}
                          onChange={(e) => handleOpticsPowerChange(Number(e.target.value))}
                        />
                      </FormControl>
                      
                      <Slider
                        value={Number(topology.configuration.opticsPower || 3.5)}
                        onChange={(_e, value) => handleOpticsPowerChange(Array.isArray(value) ? value[0] : value)}
                        min={1}
                        max={10}
                        step={0.5}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(value) => `${value}W`}
                        marks={[
                          { value: 1, label: '1W' },
                          { value: 5, label: '5W' },
                          { value: 10, label: '10W' },
                        ]}
                      />
                    </Box>
                    
                    <Typography variant="body2">
                      Industry average optics power consumption:
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip 
                        label="10G: 1W" 
                        size="small"
                        color="default"
                        variant="outlined"
                        sx={{ m: 0.5 }}
                      />
                      <Chip 
                        label="100G: 3.5W" 
                        size="small"
                        color="default"
                        variant="outlined"
                        sx={{ m: 0.5 }}
                      />
                      <Chip 
                        label="400G: 7W" 
                        size="small"
                        color="default"
                        variant="outlined"
                        sx={{ m: 0.5 }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        )}
      </Grid>
    );
  }
};

export default CostPowerConfigPanel;
