import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import TopologyComparison from '../components/Comparison/TopologyComparison';

const Comparison = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Topology Comparison
        </Typography>
        <Typography variant="body1" paragraph>
          Compare multiple data center network topologies side by side. This tool allows you to analyze the differences in cost, power usage, latency, oversubscription, and other metrics between different topology configurations.
        </Typography>
        <TopologyComparison />
      </Box>
    </Container>
  );
};

export default Comparison;
