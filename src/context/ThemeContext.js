import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { lightTheme, darkTheme } from '../theme';

// Create the theme context
const ThemeContext = createContext();

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

// We're now importing our custom themes from ../theme

export const ThemeProvider = ({ children }) => {
  // Check if dark mode is stored in local storage
  const storedDarkMode = localStorage.getItem('darkMode');
  const initialDarkMode = storedDarkMode ? JSON.parse(storedDarkMode) : false;
  
  const [darkMode, setDarkMode] = useState(initialDarkMode);
  const theme = darkMode ? darkTheme : lightTheme;
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };
  
  // Save dark mode preference to local storage
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);
  
  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
