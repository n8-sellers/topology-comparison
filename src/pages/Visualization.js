import React from 'react';
import { Box, Typography, Container, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import TopologyMetrics from '../components/Visualization/TopologyMetrics';
import { useTopology } from '../context/TopologyContext';
import EditIcon from '@mui/icons-material/Edit';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';

const Visualization = () => {
  const { currentTopology, toggleComparisonTopology, comparisonTopologies } = useTopology();

  const handleToggleComparison = () => {
    if (currentTopology) {
      toggleComparisonTopology(currentTopology.id);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Topology Visualization
          </Typography>
          <Box>
            {currentTopology && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  component={Link}
                  to="/builder"
                  sx={{ mr: 1 }}
                >
                  Edit Topology
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CompareArrowsIcon />}
                  onClick={handleToggleComparison}
                  color={comparisonTopologies.includes(currentTopology.id) ? "primary" : "inherit"}
                >
                  {comparisonTopologies.includes(currentTopology.id) 
                    ? "Remove from Comparison" 
                    : "Add to Comparison"}
                </Button>
              </>
            )}
          </Box>
        </Box>
        <Typography variant="body1" paragraph>
          View detailed metrics and visualizations for your data center network topology. The charts and graphs below provide insights into cost, power usage, latency, oversubscription, and more.
        </Typography>
        <TopologyMetrics />
      </Box>
    </Container>
  );
};

export default Visualization;
