import React, { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Grid,
  Divider,
  IconButton,
  Box,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  SelectChangeEvent
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { createDeviceTemplate } from '../../services/DeviceManagementService';
import { Device, LeafDevice, PortConfiguration } from '../../types/devices';

interface DeviceFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (deviceType: string, device: Device | LeafDevice) => void;
  deviceType: string;
  manufacturer: string;
  device?: Device | LeafDevice | null;
  isEdit?: boolean;
}

interface FormErrors {
  [key: string]: string;
}

const DeviceFormDialog: React.FC<DeviceFormDialogProps> = ({ 
  open, 
  onClose, 
  onSave, 
  deviceType, 
  manufacturer, 
  device = null, 
  isEdit = false 
}) => {
  // Initialize form state with device data or template
  const [formData, setFormData] = useState<Device | LeafDevice | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [portConfigDialogOpen, setPortConfigDialogOpen] = useState<boolean>(false);
  const [currentPortConfig, setCurrentPortConfig] = useState<PortConfiguration | null>(null);
  const [currentPortConfigIndex, setCurrentPortConfigIndex] = useState<number>(-1);
  const [breakoutDialogOpen, setBreakoutDialogOpen] = useState<boolean>(false);
  const [currentBreakout, setCurrentBreakout] = useState<string>('');
  const [downlinkDialogOpen, setDownlinkDialogOpen] = useState<boolean>(false);
  const [currentDownlink, setCurrentDownlink] = useState<string>('');

  // Initialize form data when device or deviceType changes
  useEffect(() => {
    if (open) {
      if (device) {
        setFormData({ ...device });
      } else {
        const template = createDeviceTemplate(deviceType as 'spine' | 'leaf');
        if (template) {
          const templateWithManufacturer = {
            ...template,
            manufacturer
          };
          setFormData(templateWithManufacturer);
        }
      }
    }
  }, [open, device, deviceType, manufacturer]);

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    if (!formData) return;
    
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  // Handle nested object changes
  const handleNestedChange = (parent: string, field: string, value: any): void => {
    if (!formData) return;
    
    setFormData({
      ...formData,
      [parent]: {
        ...formData[parent as keyof (Device | LeafDevice)] as Record<string, any>,
        [field]: value
      }
    });
    
    // Clear error for this field if it exists
    const errorKey = `${parent}.${field}`;
    if (errors[errorKey]) {
      setErrors({
        ...errors,
        [errorKey]: ''
      });
    }
  };

  // Validate the form
  const validateForm = (): boolean => {
    if (!formData) return false;
    
    const newErrors: FormErrors = {};
    
    // Required fields
    if (!formData.manufacturer) newErrors.manufacturer = 'Manufacturer is required';
    if (!formData.model) newErrors.model = 'Model is required';
    if (!formData.description) newErrors.description = 'Description is required';
    
    // Port configurations
    if (!formData.portConfigurations || formData.portConfigurations.length === 0) {
      newErrors.portConfigurations = 'At least one port configuration is required';
    }
    
    // Power consumption
    if (!formData.powerConsumption?.typical) newErrors['powerConsumption.typical'] = 'Typical power consumption is required';
    if (!formData.powerConsumption?.max) newErrors['powerConsumption.max'] = 'Maximum power consumption is required';
    
    // Other required fields
    if (!formData.rackUnits) newErrors.rackUnits = 'Rack units is required';
    if (!formData.cost) newErrors.cost = 'Cost is required';
    if (!formData.thermalOutput) newErrors.thermalOutput = 'Thermal output is required';
    if (!formData.weight) newErrors.weight = 'Weight is required';
    
    // Dimensions
    if (!formData.dimensions?.height) newErrors['dimensions.height'] = 'Height is required';
    if (!formData.dimensions?.width) newErrors['dimensions.width'] = 'Width is required';
    if (!formData.dimensions?.depth) newErrors['dimensions.depth'] = 'Depth is required';
    
    // Leaf-specific validations
    if (deviceType === 'leaf') {
      const leafDevice = formData as LeafDevice;
      if (!leafDevice.downlinkOptions || leafDevice.downlinkOptions.length === 0) {
        newErrors.downlinkOptions = 'At least one downlink option is required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (): void => {
    if (formData && validateForm()) {
      onSave(deviceType, formData);
      handleClose();
    }
  };

  // Handle dialog close
  const handleClose = (): void => {
    setFormData(null);
    setErrors({});
    onClose();
  };

  // Port configuration dialog handlers
  const openPortConfigDialog = (config: PortConfiguration | null = null, index: number = -1): void => {
    setCurrentPortConfig(config || { count: 32, speed: '400G', breakoutOptions: ['1x400G'] });
    setCurrentPortConfigIndex(index);
    setPortConfigDialogOpen(true);
  };

  const closePortConfigDialog = (): void => {
    setCurrentPortConfig(null);
    setCurrentPortConfigIndex(-1);
    setPortConfigDialogOpen(false);
  };

  const savePortConfig = (): void => {
    if (!formData || !currentPortConfig) return;
    
    const updatedConfigs = [...(formData.portConfigurations || [])];
    
    if (currentPortConfigIndex >= 0) {
      // Edit existing
      updatedConfigs[currentPortConfigIndex] = currentPortConfig;
    } else {
      // Add new
      updatedConfigs.push(currentPortConfig);
    }
    
    setFormData({
      ...formData,
      portConfigurations: updatedConfigs
    });
    
    // Clear any port configuration errors
    if (errors.portConfigurations) {
      setErrors({
        ...errors,
        portConfigurations: ''
      });
    }
    
    closePortConfigDialog();
  };

  const deletePortConfig = (index: number): void => {
    if (!formData) return;
    
    const updatedConfigs = [...formData.portConfigurations];
    updatedConfigs.splice(index, 1);
    
    setFormData({
      ...formData,
      portConfigurations: updatedConfigs
    });
  };

  // Breakout options dialog handlers
  const openBreakoutDialog = (): void => {
    setCurrentBreakout('');
    setBreakoutDialogOpen(true);
  };

  const closeBreakoutDialog = (): void => {
    setCurrentBreakout('');
    setBreakoutDialogOpen(false);
  };

  const addBreakoutOption = (): void => {
    if (currentBreakout && currentPortConfig) {
      const updatedBreakouts = [...(currentPortConfig.breakoutOptions || [])];
      
      if (!updatedBreakouts.includes(currentBreakout)) {
        updatedBreakouts.push(currentBreakout);
        
        setCurrentPortConfig({
          ...currentPortConfig,
          breakoutOptions: updatedBreakouts
        });
      }
      
      closeBreakoutDialog();
    }
  };

  const removeBreakoutOption = (option: string): void => {
    if (currentPortConfig) {
      const updatedBreakouts = currentPortConfig.breakoutOptions.filter(o => o !== option);
      
      setCurrentPortConfig({
        ...currentPortConfig,
        breakoutOptions: updatedBreakouts
      });
    }
  };

  // Downlink options dialog handlers (for leaf switches)
  const openDownlinkDialog = (): void => {
    setCurrentDownlink('');
    setDownlinkDialogOpen(true);
  };

  const closeDownlinkDialog = (): void => {
    setCurrentDownlink('');
    setDownlinkDialogOpen(false);
  };

  const addDownlinkOption = (): void => {
    if (!formData || !currentDownlink) return;
    
    const leafFormData = formData as LeafDevice;
    const updatedDownlinks = [...(leafFormData.downlinkOptions || [])];
    
    if (!updatedDownlinks.includes(currentDownlink)) {
      updatedDownlinks.push(currentDownlink);
      
      setFormData({
        ...formData,
        downlinkOptions: updatedDownlinks
      } as LeafDevice);
      
      // Clear any downlink options errors
      if (errors.downlinkOptions) {
        setErrors({
          ...errors,
          downlinkOptions: ''
        });
      }
    }
    
    closeDownlinkDialog();
  };

  const removeDownlinkOption = (option: string): void => {
    if (!formData) return;
    
    const leafFormData = formData as LeafDevice;
    if (leafFormData.downlinkOptions) {
      const updatedDownlinks = leafFormData.downlinkOptions.filter(o => o !== option);
      
      setFormData({
        ...formData,
        downlinkOptions: updatedDownlinks
      } as LeafDevice);
    }
  };

  // If form data is not loaded yet, don't render the dialog content
  if (!formData) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Loading...</DialogTitle>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{isEdit ? 'Edit Device' : 'Add New Device'}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {isEdit 
              ? 'Edit the device specifications below.' 
              : `Add a new ${deviceType} switch model for ${manufacturer}.`}
          </DialogContentText>
          
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Basic Information</Typography>
              <Divider />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Manufacturer"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleChange}
                fullWidth
                disabled={isEdit} // Can't change manufacturer in edit mode
                error={!!errors.manufacturer}
                helperText={errors.manufacturer}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Model"
                name="model"
                value={formData.model}
                onChange={handleChange}
                fullWidth
                error={!!errors.model}
                helperText={errors.model}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                fullWidth
                multiline
                rows={2}
                error={!!errors.description}
                helperText={errors.description}
              />
            </Grid>
            
            {/* Port Configurations */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6">Port Configurations</Typography>
                <Button 
                  startIcon={<AddIcon />} 
                  onClick={() => openPortConfigDialog()}
                  variant="outlined"
                  size="small"
                >
                  Add Configuration
                </Button>
              </Box>
              <Divider />
              
              {errors.portConfigurations && (
                <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
                  {errors.portConfigurations}
                </Typography>
              )}
              
              <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Port Count</TableCell>
                      <TableCell>Speed</TableCell>
                      <TableCell>Breakout Options</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formData.portConfigurations?.map((config, index) => (
                      <TableRow key={index}>
                        <TableCell>{config.count}</TableCell>
                        <TableCell>{config.speed}</TableCell>
                        <TableCell>
                          {config.breakoutOptions?.map((option) => (
                            <Chip 
                              key={option} 
                              label={option} 
                              size="small" 
                              sx={{ mr: 0.5, mb: 0.5 }} 
                            />
                          ))}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton 
                            size="small" 
                            onClick={() => openPortConfigDialog(config, index)}
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => deletePortConfig(index)}
                            color="error"
                            disabled={formData.portConfigurations.length <= 1}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!formData.portConfigurations || formData.portConfigurations.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          No port configurations defined
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            
            {/* Downlink Options (Leaf only) */}
            {deviceType === 'leaf' && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6">Downlink Options</Typography>
                  <Button 
                    startIcon={<AddIcon />} 
                    onClick={openDownlinkDialog}
                    variant="outlined"
                    size="small"
                  >
                    Add Option
                  </Button>
                </Box>
                <Divider />
                
                {errors.downlinkOptions && (
                  <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
                    {errors.downlinkOptions}
                  </Typography>
                )}
                
                <Box sx={{ mt: 2 }}>
                  {(formData as LeafDevice).downlinkOptions?.map((option) => (
                    <Chip 
                      key={option} 
                      label={option} 
                      sx={{ mr: 1, mb: 1 }} 
                      onDelete={() => removeDownlinkOption(option)}
                    />
                  ))}
                  {(!(formData as LeafDevice).downlinkOptions || (formData as LeafDevice).downlinkOptions.length === 0) && (
                    <Typography variant="body2" color="text.secondary">
                      No downlink options defined
                    </Typography>
                  )}
                </Box>
              </Grid>
            )}
            
            {/* Physical Specifications */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Physical Specifications</Typography>
              <Divider />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                label="Rack Units"
                name="rackUnits"
                value={formData.rackUnits}
                onChange={(e) => setFormData({...formData, rackUnits: parseInt(e.target.value) || 0})}
                type="number"
                fullWidth
                error={!!errors.rackUnits}
                helperText={errors.rackUnits}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                label="Weight (kg)"
                name="weight"
                value={formData.weight}
                onChange={(e) => setFormData({...formData, weight: parseFloat(e.target.value) || 0})}
                type="number"
                fullWidth
                error={!!errors.weight}
                helperText={errors.weight}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                label="Thermal Output (BTU/hr)"
                name="thermalOutput"
                value={formData.thermalOutput}
                onChange={(e) => setFormData({...formData, thermalOutput: parseInt(e.target.value) || 0})}
                type="number"
                fullWidth
                error={!!errors.thermalOutput}
                helperText={errors.thermalOutput}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>Dimensions</Typography>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                label="Height (cm)"
                value={formData.dimensions?.height}
                onChange={(e) => handleNestedChange('dimensions', 'height', parseFloat(e.target.value) || 0)}
                type="number"
                fullWidth
                error={!!errors['dimensions.height']}
                helperText={errors['dimensions.height']}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                label="Width (cm)"
                value={formData.dimensions?.width}
                onChange={(e) => handleNestedChange('dimensions', 'width', parseFloat(e.target.value) || 0)}
                type="number"
                fullWidth
                error={!!errors['dimensions.width']}
                helperText={errors['dimensions.width']}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                label="Depth (cm)"
                value={formData.dimensions?.depth}
                onChange={(e) => handleNestedChange('dimensions', 'depth', parseFloat(e.target.value) || 0)}
                type="number"
                fullWidth
                error={!!errors['dimensions.depth']}
                helperText={errors['dimensions.depth']}
              />
            </Grid>
            
            {/* Power and Cost */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Power and Cost</Typography>
              <Divider />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                label="Typical Power (Watts)"
                value={formData.powerConsumption?.typical}
                onChange={(e) => handleNestedChange('powerConsumption', 'typical', parseInt(e.target.value) || 0)}
                type="number"
                fullWidth
                error={!!errors['powerConsumption.typical']}
                helperText={errors['powerConsumption.typical']}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                label="Maximum Power (Watts)"
                value={formData.powerConsumption?.max}
                onChange={(e) => handleNestedChange('powerConsumption', 'max', parseInt(e.target.value) || 0)}
                type="number"
                fullWidth
                error={!!errors['powerConsumption.max']}
                helperText={errors['powerConsumption.max']}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                label="Cost (USD)"
                name="cost"
                value={formData.cost}
                onChange={(e) => setFormData({...formData, cost: parseInt(e.target.value) || 0})}
                type="number"
                fullWidth
                error={!!errors.cost}
                helperText={errors.cost}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {isEdit ? 'Save Changes' : 'Add Device'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Port Configuration Dialog */}
      <Dialog open={portConfigDialogOpen} onClose={closePortConfigDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {currentPortConfigIndex >= 0 ? 'Edit Port Configuration' : 'Add Port Configuration'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Port Count"
                value={currentPortConfig?.count || ''}
                onChange={(e) => setCurrentPortConfig(currentPortConfig ? {
                  ...currentPortConfig,
                  count: parseInt(e.target.value) || 0
                } : null)}
                type="number"
                fullWidth
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="port-speed-label">Port Speed</InputLabel>
                <Select
                  labelId="port-speed-label"
                  value={currentPortConfig?.speed || ''}
                  label="Port Speed"
                  onChange={(e: SelectChangeEvent) => setCurrentPortConfig(currentPortConfig ? {
                    ...currentPortConfig,
                    speed: e.target.value
                  } : null)}
                >
                  <MenuItem value="10G">10G</MenuItem>
                  <MenuItem value="25G">25G</MenuItem>
                  <MenuItem value="40G">40G</MenuItem>
                  <MenuItem value="50G">50G</MenuItem>
                  <MenuItem value="100G">100G</MenuItem>
                  <MenuItem value="200G">200G</MenuItem>
                  <MenuItem value="400G">400G</MenuItem>
                  <MenuItem value="800G">800G</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1">Breakout Options</Typography>
                <Button 
                  startIcon={<AddIcon />} 
                  onClick={openBreakoutDialog}
                  variant="outlined"
                  size="small"
                >
                  Add Option
                </Button>
              </Box>
              
              <Box sx={{ mt: 1 }}>
                {currentPortConfig?.breakoutOptions?.map((option) => (
                  <Chip 
                    key={option} 
                    label={option} 
                    sx={{ mr: 1, mb: 1 }} 
                    onDelete={() => removeBreakoutOption(option)}
                  />
                ))}
                {(!currentPortConfig?.breakoutOptions || currentPortConfig.breakoutOptions.length === 0) && (
                  <Typography variant="body2" color="text.secondary">
                    No breakout options defined
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closePortConfigDialog}>Cancel</Button>
          <Button onClick={savePortConfig} variant="contained" color="primary">
            {currentPortConfigIndex >= 0 ? 'Save Changes' : 'Add Configuration'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Breakout Option Dialog */}
      <Dialog open={breakoutDialogOpen} onClose={closeBreakoutDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Add Breakout Option</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel id="breakout-option-label">Breakout Option</InputLabel>
            <Select
              labelId="breakout-option-label"
              value={currentBreakout}
              label="Breakout Option"
              onChange={(e: SelectChangeEvent) => setCurrentBreakout(e.target.value)}
            >
              <MenuItem value="1x800G">1x800G</MenuItem>
              <MenuItem value="2x400G">2x400G</MenuItem>
              <MenuItem value="4x200G">4x200G</MenuItem>
              <MenuItem value="8x100G">8x100G</MenuItem>
              <MenuItem value="1x400G">1x400G</MenuItem>
              <MenuItem value="2x200G">2x200G</MenuItem>
              <MenuItem value="4x100G">4x100G</MenuItem>
              <MenuItem value="8x50G">8x50G</MenuItem>
              <MenuItem value="1x200G">1x200G</MenuItem>
              <MenuItem value="2x100G">2x100G</MenuItem>
              <MenuItem value="4x50G">4x50G</MenuItem>
              <MenuItem value="8x25G">8x25G</MenuItem>
              <MenuItem value="1x100G">1x100G</MenuItem>
              <MenuItem value="2x50G">2x50G</MenuItem>
              <MenuItem value="4x25G">4x25G</MenuItem>
              <MenuItem value="1x50G">1x50G</MenuItem>
              <MenuItem value="2x25G">2x25G</MenuItem>
              <MenuItem value="1x25G">1x25G</MenuItem>
              <MenuItem value="1x10G">1x10G</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeBreakoutDialog}>Cancel</Button>
          <Button onClick={addBreakoutOption} variant="contained" color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Downlink Option Dialog */}
      <Dialog open={downlinkDialogOpen} onClose={closeDownlinkDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Add Downlink Option</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel id="downlink-option-label">Downlink Speed</InputLabel>
            <Select
              labelId="downlink-option-label"
              value={currentDownlink}
              label="Downlink Speed"
              onChange={(e: SelectChangeEvent) => setCurrentDownlink(e.target.value)}
            >
              <MenuItem value="10G">10G</MenuItem>
              <MenuItem value="25G">25G</MenuItem>
              <MenuItem value="40G">40G</MenuItem>
              <MenuItem value="50G">50G</MenuItem>
              <MenuItem value="100G">100G</MenuItem>
              <MenuItem value="200G">200G</MenuItem>
              <MenuItem value="400G">400G</MenuItem>
              <MenuItem value="800G">800G</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDownlinkDialog}>Cancel</Button>
          <Button onClick={addDownlinkOption} variant="contained" color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DeviceFormDialog;
