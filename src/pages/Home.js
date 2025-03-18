import React, { useState, useRef } from 'react';
import { useTopology } from '../context/TopologyContext';
import { calculateAllMetrics } from '../services/CalculationService';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Fab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton
} from '@mui/material';
import { Link } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import TopologyCard from '../components/Home/TopologyCard';

const Home = () => {
  const { 
    topologies, 
    setCurrentTopology, 
    createTopology, 
    createTopologyFromTemplate,
    deleteTopology,
    toggleComparisonTopology,
    comparisonTopologies,
    templates,
    importTopology
  } = useTopology();
  
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [importError, setImportError] = useState('');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Handle create new topology
  const handleCreateTopology = () => {
    const newTopology = createTopology();
    setCurrentTopology(newTopology);
  };
  
  // Handle open template dialog
  const handleOpenTemplateDialog = () => {
    setTemplateDialogOpen(true);
  };
  
  // Handle close template dialog
  const handleCloseTemplateDialog = () => {
    setTemplateDialogOpen(false);
    setSelectedTemplate('');
  };
  
  // Handle template selection change
  const handleTemplateChange = (event) => {
    setSelectedTemplate(event.target.value);
  };
  
  // Handle create from template
  const handleCreateFromTemplate = () => {
    if (selectedTemplate) {
      const newTopology = createTopologyFromTemplate(selectedTemplate);
      setCurrentTopology(newTopology);
      handleCloseTemplateDialog();
    }
  };

  // Handle edit topology
  const handleEditTopology = (topology) => {
    setCurrentTopology(topology);
  };

  // Handle delete topology
  const handleDeleteTopology = (id, event) => {
    event.stopPropagation();
    if (window.confirm('Are you sure you want to delete this topology?')) {
      deleteTopology(id);
    }
  };

  // Handle toggle comparison
  const handleToggleComparison = (id, event) => {
    event.stopPropagation();
    toggleComparisonTopology(id);
  };
  
  // Handle open import dialog
  const handleOpenImportDialog = () => {
    setImportDialogOpen(true);
    setImportError('');
  };
  
  // Handle close import dialog
  const handleCloseImportDialog = () => {
    setImportDialogOpen(false);
    setImportError('');
  };
  
  // Handle file selection
  const handleFileSelect = () => {
    fileInputRef.current.click();
  };
  
  // Handle file change
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      await importTopology(file);
      handleCloseImportDialog();
    } catch (error) {
      setImportError(error.message);
    }
    
    // Reset the file input
    event.target.value = null;
  };

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h4" gutterBottom>
            Network Topology Analyzer
          </Typography>
          <Typography variant="body1" paragraph>
            This tool helps you design, analyze, and compare different data center network topologies.
          </Typography>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader 
              title="Your Topologies" 
              action={
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  component={Link}
                  to="/builder"
                  onClick={handleCreateTopology}
                >
                  Create New Topology
                </Button>
              }
            />
            <Divider />
            <CardContent>
              {topologies.length > 0 ? (
                <Box>
                  {topologies.map((topology) => {
                    const metrics = calculateAllMetrics(topology);
                    return (
                      <TopologyCard
                        key={topology.id}
                        topology={topology}
                        metrics={metrics}
                        onEdit={handleEditTopology}
                        onDelete={handleDeleteTopology}
                        onToggleComparison={handleToggleComparison}
                        isInComparison={comparisonTopologies.includes(topology.id)}
                      />
                    );
                  })}
                </Box>
              ) : (
                <Typography variant="body1" align="center">
                  No topologies found. Create a new one to get started.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4} sx={{ position: 'relative' }}>
          <Fab 
            color="primary" 
            sx={{ 
              position: 'fixed', 
              bottom: 20, 
              right: 20,
              display: { xs: 'flex', md: 'none' }
            }}
            component={Link}
            to="/builder"
            onClick={handleCreateTopology}
          >
            <AddIcon />
          </Fab>
          <Card>
            <CardHeader title="Quick Actions" />
            <Divider />
            <CardContent>
              <List>
                <ListItem 
                  button 
                  component={Link} 
                  to="/builder"
                  onClick={handleCreateTopology}
                >
                  <ListItemText 
                    primary="Create New Topology" 
                    secondary="Design a new data center network topology from scratch"
                  />
                </ListItem>
                <ListItem 
                  button 
                  onClick={handleOpenTemplateDialog}
                >
                  <ListItemText 
                    primary="Create From Template" 
                    secondary="Start with a pre-configured topology template"
                  />
                </ListItem>
                <ListItem 
                  button 
                  onClick={handleOpenImportDialog}
                >
                  <ListItemText 
                    primary="Import Topology" 
                    secondary="Import a topology from a JSON file"
                  />
                </ListItem>
                <ListItem 
                  button 
                  component={Link} 
                  to="/comparison"
                  disabled={topologies.length < 1}
                >
                  <ListItemText 
                    primary="Compare Topologies" 
                    secondary="Compare multiple topologies side by side"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {comparisonTopologies.length > 0 && (
            <Card sx={{ mt: 3 }}>
              <CardHeader title="Comparison Queue" />
              <Divider />
              <CardContent>
                <List>
                  {comparisonTopologies.map((id) => {
                    const topology = topologies.find(t => t.id === id);
                    if (!topology) return null;
                    
                    return (
                      <ListItem key={id}>
                        <ListItemText primary={topology.name} />
                        <ListItemSecondaryAction>
                          <IconButton 
                            edge="end" 
                            onClick={(e) => handleToggleComparison(id, e)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    );
                  })}
                  <ListItem>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      fullWidth
                      component={Link}
                      to="/comparison"
                    >
                      Compare ({comparisonTopologies.length})
                    </Button>
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
      {/* Hidden file input for import */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".json"
        onChange={handleFileChange}
      />
      
      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onClose={handleCloseImportDialog}>
        <DialogTitle>Import Topology</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Select a JSON file containing a topology configuration to import.
          </DialogContentText>
          {importError && (
            <Typography color="error" sx={{ mt: 2 }}>
              Error: {importError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseImportDialog}>Cancel</Button>
          <Button 
            onClick={handleFileSelect} 
            color="primary"
          >
            Select File
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Template Selection Dialog */}
      <Dialog open={templateDialogOpen} onClose={handleCloseTemplateDialog}>
        <DialogTitle>Create Topology from Template</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Select a pre-configured template to quickly create a new topology.
          </DialogContentText>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="template-select-label">Template</InputLabel>
            <Select
              labelId="template-select-label"
              id="template-select"
              value={selectedTemplate}
              label="Template"
              onChange={handleTemplateChange}
            >
              {templates.map((template) => (
                <MenuItem key={template.name} value={template.name}>
                  {template.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {selectedTemplate && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">Description:</Typography>
              <Typography variant="body2">
                {templates.find(t => t.name === selectedTemplate)?.description}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2">Configuration:</Typography>
                <Typography variant="body2">
                  {`${templates.find(t => t.name === selectedTemplate)?.configuration.numSpines} spine switches, 
                   ${templates.find(t => t.name === selectedTemplate)?.configuration.numLeafs} leaf switches, 
                   ${templates.find(t => t.name === selectedTemplate)?.configuration.numTiers} tier(s)`}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTemplateDialog}>Cancel</Button>
          <Button 
            onClick={handleCreateFromTemplate} 
            color="primary" 
            disabled={!selectedTemplate}
            component={Link}
            to="/builder"
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Home;
