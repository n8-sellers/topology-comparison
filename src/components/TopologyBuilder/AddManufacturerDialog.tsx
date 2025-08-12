import React, { useState } from 'react';
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
  SelectChangeEvent
} from '@mui/material';

interface AddManufacturerDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (deviceType: string, manufacturerName: string) => void;
  deviceTypes?: string[];
}

const AddManufacturerDialog = ({ 
  open, 
  onClose, 
  onAdd, 
  deviceTypes = ['spine', 'leaf'] 
}: AddManufacturerDialogProps) => {
  const [manufacturerName, setManufacturerName] = useState<string>('');
  const [deviceType, setDeviceType] = useState<string>(deviceTypes[0]);
  const [error, setError] = useState<string>('');

  const handleSubmit = (): void => {
    // Validate input
    if (!manufacturerName.trim()) {
      setError('Manufacturer name is required');
      return;
    }

    // Clear error and call onAdd
    setError('');
    onAdd(deviceType, manufacturerName.trim());
    
    // Reset form
    setManufacturerName('');
    setDeviceType(deviceTypes[0]);
  };

  const handleClose = (): void => {
    // Reset form and close
    setManufacturerName('');
    setDeviceType(deviceTypes[0]);
    setError('');
    onClose();
  };

  const handleDeviceTypeChange = (event: SelectChangeEvent): void => {
    setDeviceType(event.target.value);
  };

  const handleManufacturerNameChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setManufacturerName(event.target.value);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Manufacturer</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Enter the name of the new manufacturer to add to the device catalog.
        </DialogContentText>
        
        <FormControl fullWidth margin="normal">
          <InputLabel id="device-type-label">Device Type</InputLabel>
          <Select
            labelId="device-type-label"
            id="device-type"
            value={deviceType}
            label="Device Type"
            onChange={handleDeviceTypeChange}
          >
            {deviceTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)} Switch
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <TextField
          autoFocus
          margin="normal"
          id="manufacturer-name"
          label="Manufacturer Name"
          type="text"
          fullWidth
          value={manufacturerName}
          onChange={handleManufacturerNameChange}
          error={!!error}
          helperText={error}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Add Manufacturer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddManufacturerDialog;
