import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Box, 
  useMediaQuery, 
  useTheme as useMuiTheme,
  Divider,
  Tooltip
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import BuildIcon from '@mui/icons-material/Build';
import BarChartIcon from '@mui/icons-material/BarChart';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useTopology } from '../../context/TopologyContext';
import { useTheme } from '../../context/ThemeContext';

const Navigation = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const muiTheme = useMuiTheme();
  const { darkMode, toggleDarkMode } = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const location = useLocation();
  const { comparisonTopologies } = useTopology();

  const navItems = [
    { text: 'Home', path: '/', icon: <HomeIcon /> },
    { text: 'Builder', path: '/builder', icon: <BuildIcon /> },
    { text: 'Visualization', path: '/visualization', icon: <BarChartIcon /> },
    { text: 'Comparison', path: '/comparison', icon: <CompareArrowsIcon />, badge: comparisonTopologies.length > 0 ? comparisonTopologies.length : null }
  ];

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const drawer = (
    <Box
      sx={{ width: 250 }}
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" component="div">
          Network Analyzer
        </Typography>
      </Box>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem 
            button 
            key={item.text} 
            component={Link} 
            to={item.path}
            selected={isActive(item.path)}
          >
            <ListItemIcon>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
            {item.badge && (
              <Box
                sx={{
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  borderRadius: '50%',
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  ml: 1
                }}
              >
                {item.badge}
              </Box>
            )}
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          {isMobile ? (
            <>
              <IconButton
                size="large"
                edge="start"
                color="inherit"
                aria-label="menu"
                sx={{ mr: 2 }}
                onClick={toggleDrawer(true)}
              >
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Network Analyzer
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Network Topology Analyzer
              </Typography>
              <Tooltip title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
                <IconButton color="inherit" onClick={toggleDarkMode} sx={{ ml: 1 }}>
                  {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
                </IconButton>
              </Tooltip>
              <Box>
                {navItems.map((item) => (
                  <Button
                    key={item.text}
                    color="inherit"
                    component={Link}
                    to={item.path}
                    sx={{ 
                      mx: 1,
                      fontWeight: isActive(item.path) ? 'bold' : 'normal',
                      borderBottom: isActive(item.path) ? '2px solid white' : 'none'
                    }}
                    startIcon={item.icon}
                  >
                    {item.text}
                    {item.badge && (
                      <Box
                        sx={{
                          bgcolor: 'secondary.main',
                          color: 'secondary.contrastText',
                          borderRadius: '50%',
                          width: 20,
                          height: 20,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          ml: 1,
                          fontSize: '0.75rem'
                        }}
                      >
                        {item.badge}
                      </Box>
                    )}
                  </Button>
                ))}
              </Box>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
        {drawer}
        <Box sx={{ position: 'absolute', bottom: 0, width: '100%', p: 2 }}>
          <Button 
            fullWidth 
            variant="outlined" 
            startIcon={darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
            onClick={toggleDarkMode}
          >
            {darkMode ? "Light Mode" : "Dark Mode"}
          </Button>
        </Box>
      </Drawer>
    </>
  );
};

export default Navigation;
