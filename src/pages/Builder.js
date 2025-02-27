import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import TopologyForm from '../components/TopologyBuilder/TopologyForm';

const Builder = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Topology Builder
        </Typography>
        <Typography variant="body1" paragraph>
          Use the form below to configure your data center network topology. Adjust parameters like the number of spine and leaf switches, link types, and other configuration options.
        </Typography>
        <TopologyForm />
      </Box>
    </Container>
  );
};

export default Builder;
