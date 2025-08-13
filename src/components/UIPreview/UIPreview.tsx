import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  Paper,
  IconButton,
  TextField,
  Stack,
  Divider,
  Alert,
  useTheme,
  ThemeProvider,
  createTheme
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BoltIcon from '@mui/icons-material/Bolt';
import DevicesIcon from '@mui/icons-material/Devices';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// Enhanced theme with new colors and typography
const enhancedTheme = createTheme({
  palette: {
    primary: {
      main: '#5E35B1', // Deep purple
      light: '#7E57C2',
      dark: '#4527A0',
    },
    secondary: {
      main: '#00ACC1', // Cyan
      light: '#26C6DA',
      dark: '#00838F',
    },
    success: {
      main: '#00C853',
    },
    warning: {
      main: '#FFB300',
    },
    error: {
      main: '#FF3D00',
    },
    background: {
      default: '#F8F9FE',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 20px',
          fontSize: '0.95rem',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
  },
});

const UIPreview: React.FC = () => {
  const currentTheme = useTheme();

  // Sample data for cards
  const sampleTopology = {
    name: 'Production Datacenter',
    description: 'Main production topology with high availability',
    metrics: {
      devices: 68,
      cost: 285000,
      power: 4500,
    },
    spines: 4,
    leafs: 64,
  };

  // Current style card
  const CurrentStyleCard = () => (
    <Card>
      <CardContent>
        <Typography variant="h6">{sampleTopology.name}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {sampleTopology.description}
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Typography variant="caption">Devices</Typography>
            <Typography variant="body1">{sampleTopology.metrics.devices}</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="caption">Cost</Typography>
            <Typography variant="body1">${sampleTopology.metrics.cost.toLocaleString()}</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="caption">Power</Typography>
            <Typography variant="body1">{sampleTopology.metrics.power}W</Typography>
          </Grid>
        </Grid>
        <Box sx={{ mt: 2 }}>
          <Chip label={`${sampleTopology.spines} Spines`} size="small" sx={{ mr: 1 }} />
          <Chip label={`${sampleTopology.leafs} Leafs`} size="small" />
        </Box>
        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <Button variant="contained" size="small">Edit</Button>
          <Button variant="outlined" size="small">Delete</Button>
        </Box>
      </CardContent>
    </Card>
  );

  // Enhanced style card with gradients and better typography
  const EnhancedStyleCard = () => (
    <Card
      sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        boxShadow: '0 10px 40px -10px rgba(102, 126, 234, 0.4)',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 20px 40px -10px rgba(102, 126, 234, 0.6)',
        },
      }}
    >
      <CardContent>
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 600,
            letterSpacing: '-0.01em',
            mb: 0.5
          }}
        >
          {sampleTopology.name}
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            opacity: 0.9,
            mb: 2,
            fontWeight: 400
          }}
        >
          {sampleTopology.description}
        </Typography>
        
        <Box sx={{ 
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
          p: 2,
          mb: 2
        }}>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DevicesIcon sx={{ fontSize: 20, opacity: 0.9 }} />
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.7rem' }}>
                    Devices
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontFamily: '"JetBrains Mono", monospace',
                      fontWeight: 600
                    }}
                  >
                    {sampleTopology.metrics.devices}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon sx={{ fontSize: 20, opacity: 0.9 }} />
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.7rem' }}>
                    Cost
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontFamily: '"JetBrains Mono", monospace',
                      fontWeight: 600
                    }}
                  >
                    ${(sampleTopology.metrics.cost / 1000).toFixed(0)}k
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BoltIcon sx={{ fontSize: 20, opacity: 0.9 }} />
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.7rem' }}>
                    Power
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontFamily: '"JetBrains Mono", monospace',
                      fontWeight: 600
                    }}
                  >
                    {(sampleTopology.metrics.power / 1000).toFixed(1)}kW
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Chip 
            label={`${sampleTopology.spines} Spines`} 
            size="small" 
            sx={{ 
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontWeight: 500
            }} 
          />
          <Chip 
            label={`${sampleTopology.leafs} Leafs`} 
            size="small"
            sx={{ 
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontWeight: 500
            }} 
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="contained" 
            size="small"
            startIcon={<EditIcon />}
            sx={{ 
              background: 'rgba(255, 255, 255, 0.9)',
              color: '#667eea',
              fontWeight: 600,
              '&:hover': {
                background: 'rgba(255, 255, 255, 1)',
              }
            }}
          >
            Edit
          </Button>
          <Button 
            variant="outlined" 
            size="small"
            startIcon={<DeleteIcon />}
            sx={{ 
              borderColor: 'rgba(255, 255, 255, 0.5)',
              color: 'white',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.8)',
                background: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            Delete
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  // Color palette display
  const ColorPalette = () => (
    <Box>
      <Typography variant="h6" gutterBottom>Enhanced Color Palette</Typography>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Paper sx={{ p: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            Primary Gradient
          </Paper>
        </Grid>
        <Grid item xs={6}>
          <Paper sx={{ p: 2, background: 'linear-gradient(135deg, #00ACC1 0%, #5E35B1 100%)', color: 'white' }}>
            Secondary Gradient
          </Paper>
        </Grid>
        <Grid item xs={3}>
          <Paper sx={{ p: 2, bgcolor: '#00C853', color: 'white' }}>
            Success
          </Paper>
        </Grid>
        <Grid item xs={3}>
          <Paper sx={{ p: 2, bgcolor: '#FFB300', color: 'white' }}>
            Warning
          </Paper>
        </Grid>
        <Grid item xs={3}>
          <Paper sx={{ p: 2, bgcolor: '#FF3D00', color: 'white' }}>
            Error
          </Paper>
        </Grid>
        <Grid item xs={3}>
          <Paper sx={{ p: 2, bgcolor: '#00ACC1', color: 'white' }}>
            Info
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  // Typography samples
  const TypographySamples = () => (
    <Box>
      <Typography variant="h6" gutterBottom>Typography Hierarchy</Typography>
      <Stack spacing={2}>
        <Box>
          <Typography variant="caption" color="text.secondary">Current Font: Roboto</Typography>
          <Typography variant="h4">Network Topology Analyzer</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">Enhanced Font: Inter (with better weights)</Typography>
          <Typography variant="h4" sx={{ fontFamily: 'Inter', fontWeight: 600, letterSpacing: '-0.02em' }}>
            Network Topology Analyzer
          </Typography>
        </Box>
        <Divider />
        <Box>
          <Typography variant="caption" color="text.secondary">Numbers - Current</Typography>
          <Typography variant="h3">$285,000 • 4.5kW • 68 devices</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">Numbers - Enhanced (JetBrains Mono)</Typography>
          <Typography variant="h3" sx={{ fontFamily: '"JetBrains Mono", monospace' }}>
            $285,000 • 4.5kW • 68 devices
          </Typography>
        </Box>
      </Stack>
    </Box>
  );

  // Button samples
  const ButtonSamples = () => (
    <Box>
      <Typography variant="h6" gutterBottom>Button Styles</Typography>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Button variant="contained">Current Style</Button>
        <Button variant="outlined">Current Outlined</Button>
      </Stack>
      <Stack direction="row" spacing={2}>
        <Button 
          variant="contained"
          sx={{
            background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
            boxShadow: '0 3px 10px 2px rgba(102, 126, 234, .3)',
            '&:hover': {
              boxShadow: '0 3px 15px 2px rgba(102, 126, 234, .5)',
            }
          }}
        >
          Enhanced Style
        </Button>
        <Button 
          variant="outlined"
          sx={{
            borderImage: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%) 1',
            borderWidth: 2,
            '&:hover': {
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
              color: 'white',
            }
          }}
        >
          Enhanced Outlined
        </Button>
      </Stack>
    </Box>
  );

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h3" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
        UI Enhancement Preview
      </Typography>
      
      <Alert severity="info" sx={{ mb: 4 }}>
        This preview shows the proposed visual improvements. Compare the current style (left) with the enhanced style (right).
      </Alert>

      {/* Card Comparison */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Topology Card Comparison
      </Typography>
      <Grid container spacing={4} sx={{ mb: 6 }}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>Current Style</Typography>
          <CurrentStyleCard />
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>Enhanced Style</Typography>
          <ThemeProvider theme={enhancedTheme}>
            <EnhancedStyleCard />
          </ThemeProvider>
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* Color Palette */}
      <Box sx={{ mb: 6 }}>
        <ColorPalette />
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Typography */}
      <Box sx={{ mb: 6 }}>
        <TypographySamples />
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Buttons */}
      <Box sx={{ mb: 6 }}>
        <ButtonSamples />
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Additional Elements */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Additional Enhancements
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper 
            sx={{ 
              p: 3,
              background: 'rgba(102, 126, 234, 0.05)',
              border: '1px solid rgba(102, 126, 234, 0.2)',
              borderRadius: 2
            }}
          >
            <CheckCircleIcon sx={{ color: '#00C853', mb: 1 }} />
            <Typography variant="h6">Glassmorphism</Typography>
            <Typography variant="body2" color="text.secondary">
              Semi-transparent backgrounds with blur effects for modern depth
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper 
            sx={{ 
              p: 3,
              boxShadow: '0 10px 30px -5px rgba(102, 126, 234, 0.2)',
              borderRadius: 2,
              transition: 'all 0.3s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 15px 35px -5px rgba(102, 126, 234, 0.3)',
              }
            }}
          >
            <CheckCircleIcon sx={{ color: '#00C853', mb: 1 }} />
            <Typography variant="h6">Colored Shadows</Typography>
            <Typography variant="body2" color="text.secondary">
              Subtle colored shadows that match the primary colors
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper 
            sx={{ 
              p: 3,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              }
            }}
          >
            <CheckCircleIcon sx={{ color: '#00C853', mb: 1 }} />
            <Typography variant="h6">Accent Indicators</Typography>
            <Typography variant="body2" color="text.secondary">
              Gradient accents for active states and highlights
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UIPreview;
