import React from 'react';
import { Box, Container, CssBaseline } from '@mui/material';
import Navigation from './Navigation';

const Layout = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      <Navigation />
      <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
        <Container maxWidth="lg">
          {children}
        </Container>
      </Box>
      <Box component="footer" sx={{ py: 3, px: 2, mt: 'auto', backgroundColor: (theme) => theme.palette.grey[200] }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ my: 1 }}>
              Data Center Network Topology Analyzer
            </Box>
            <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
              © {new Date().getFullYear()} - A tool for comparing data center network topologies
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;
