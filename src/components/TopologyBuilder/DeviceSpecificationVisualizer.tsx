import React from 'react';
import { 
  Box, 
  Typography, 
  LinearProgress, 
  Grid, 
  Paper, 
  Tooltip,
  Divider
} from '@mui/material';
import { Device, LeafDevice } from '../../types/devices';

// Define props interface
interface DeviceSpecificationVisualizerProps {
  device: Device | LeafDevice;
  deviceType: 'spine' | 'leaf';
  allDevices?: (Device | LeafDevice)[];
}

// Define metric ranges for normalization
const metricRanges = {
  cost: { min: 20000, max: 60000 },
  powerConsumption: { min: 400, max: 2500 },
  rackUnits: { min: 1, max: 4 },
  portDensity: { min: 16, max: 64 }
};

const DeviceSpecificationVisualizer: React.FC<DeviceSpecificationVisualizerProps> = ({ 
  device, 
  deviceType,
  allDevices = []
}) => {
  // Calculate port density (ports per rack unit)
  const calculatePortDensity = (device: Device | LeafDevice): number => {
    if (!device.portConfigurations || device.portConfigurations.length === 0) return 0;
    
    // Get the highest port count configuration
    const maxPortConfig = device.portConfigurations.reduce(
      (prev, current) => (current.count > prev.count ? current : prev),
      device.portConfigurations[0]
    );
    
    return device.rackUnits > 0 ? maxPortConfig.count / device.rackUnits : 0;
  };
  
  // Normalize a value to a 0-100 scale based on min/max range
  const normalizeValue = (value: number, min: number, max: number): number => {
    if (value <= min) return 0;
    if (value >= max) return 100;
    return ((value - min) / (max - min)) * 100;
  };
  
  // Get color based on normalized value (0-100)
  // For cost and power, lower is better (green)
  // For port density, higher is better (green)
  const getColorForValue = (value: number, lowerIsBetter: boolean = false): string => {
    if (lowerIsBetter) {
      if (value < 30) return 'success.main';
      if (value < 70) return 'warning.main';
      return 'error.main';
    } else {
      if (value > 70) return 'success.main';
      if (value > 30) return 'warning.main';
      return 'error.main';
    }
  };
  
  // Calculate port density
  const portDensity = calculatePortDensity(device);
  
  // Normalize values for visualization
  const normalizedCost = normalizeValue(device.cost, metricRanges.cost.min, metricRanges.cost.max);
  const normalizedPower = normalizeValue(
    device.powerConsumption.typical, 
    metricRanges.powerConsumption.min, 
    metricRanges.powerConsumption.max
  );
  const normalizedPortDensity = normalizeValue(
    portDensity,
    metricRanges.portDensity.min,
    metricRanges.portDensity.max
  );
  
  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  return (
    <Box sx={{ mt: 2 }}>
      <Grid container spacing={2}>
        {/* Performance Metrics */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>Performance Metrics</Typography>
          <Divider />
          
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              {/* Port Configurations */}
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Port Configurations</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {device.portConfigurations.map((config, index) => (
                      <Tooltip 
                        key={index} 
                        title={`${config.count} ports at ${config.speed} with breakout options: ${config.breakoutOptions.join(', ')}`}
                      >
                        <Box
                          sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            p: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            minWidth: 80
                          }}
                        >
                          <Typography variant="h6" color="primary">{config.count}</Typography>
                          <Typography variant="caption">{config.speed}</Typography>
                        </Box>
                      </Tooltip>
                    ))}
                  </Box>
                </Paper>
              </Grid>
              
              {/* Port Density */}
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2">Port Density</Typography>
                    <Typography variant="body2">{portDensity.toFixed(1)} ports/RU</Typography>
                  </Box>
                  <Tooltip title="Higher port density is better">
                    <Box sx={{ mt: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={normalizedPortDensity} 
                        color={getColorForValue(normalizedPortDensity) as "success" | "warning" | "error" | "primary" | "secondary" | "info"}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  </Tooltip>
                </Paper>
              </Grid>
              
              {/* Downlink Options (Leaf only) */}
              {'downlinkOptions' in device && (
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Downlink Options</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                      {(device as LeafDevice).downlinkOptions.map((option, index) => (
                        <Box
                          key={index}
                          sx={{
                            bgcolor: 'background.default',
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            px: 1.5,
                            py: 0.5
                          }}
                        >
                          <Typography variant="body2">{option}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </Box>
        </Grid>
        
        {/* Cost & Power */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>Cost & Power</Typography>
          <Divider />
          
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              {/* Cost */}
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2">Cost</Typography>
                    <Typography variant="body2">{formatCurrency(device.cost)}</Typography>
                  </Box>
                  <Tooltip title="Lower cost is better">
                    <Box sx={{ mt: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={normalizedCost} 
                        color={getColorForValue(normalizedCost, true) as "success" | "warning" | "error" | "primary" | "secondary" | "info"}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  </Tooltip>
                </Paper>
              </Grid>
              
              {/* Power Consumption */}
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2">Power Consumption</Typography>
                    <Typography variant="body2">{device.powerConsumption.typical}W typical</Typography>
                  </Box>
                  <Tooltip title="Lower power consumption is better">
                    <Box sx={{ mt: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={normalizedPower} 
                        color={getColorForValue(normalizedPower, true) as "success" | "warning" | "error" | "primary" | "secondary" | "info"}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  </Tooltip>
                  <Typography variant="caption" color="text.secondary">
                    Max: {device.powerConsumption.max}W
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Grid>
        
        {/* Physical Specifications */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>Physical Specifications</Typography>
          <Divider />
          
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              {/* Rack Units */}
              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Rack Units</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
                    {Array.from({ length: device.rackUnits }).map((_, index) => (
                      <Box
                        key={index}
                        sx={{
                          width: 60,
                          height: 20,
                          bgcolor: 'primary.main',
                          border: '1px solid',
                          borderColor: 'primary.dark',
                          borderRadius: 0.5,
                          mb: 0.5
                        }}
                      />
                    ))}
                  </Box>
                  <Typography variant="body2" align="center">{device.rackUnits}U</Typography>
                </Paper>
              </Grid>
              
              {/* Weight */}
              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Weight</Typography>
                  <Typography variant="h6" align="center">{device.weight} kg</Typography>
                </Paper>
              </Grid>
              
              {/* Thermal Output */}
              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Thermal Output</Typography>
                  <Typography variant="h6" align="center">{device.thermalOutput} BTU/hr</Typography>
                </Paper>
              </Grid>
              
              {/* Dimensions */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Dimensions (H×W×D)</Typography>
                  <Typography variant="body1" align="center">
                    {device.dimensions.height} × {device.dimensions.width} × {device.dimensions.depth} cm
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DeviceSpecificationVisualizer;
