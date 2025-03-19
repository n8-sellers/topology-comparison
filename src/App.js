import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';

// Context Providers
import { TopologyProvider } from './context/TopologyContext';
import { ThemeProvider } from './context/ThemeContext';

// Layout
import Layout from './components/Layout/Layout';

// Pages
import Home from './pages/Home';
import Builder from './pages/Builder';
import Visualization from './pages/Visualization';
import Comparison from './pages/Comparison';

function App() {
  // Initialize the storage service when the app starts
  useEffect(() => {
    const initializeStorage = async () => {
      const StorageService = await import('./services/StorageService');
      StorageService.default.initializeStorage()
        .then(result => console.log("Storage service initialized", result))
        .catch(error => console.error("Error initializing storage service:", error));
    };
    
    initializeStorage();
  }, []);
  
  return (
    <ThemeProvider>
      <TopologyProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/builder" element={<Builder />} />
              <Route path="/visualization" element={<Visualization />} />
              <Route path="/comparison" element={<Comparison />} />
            </Routes>
          </Layout>
        </Router>
      </TopologyProvider>
    </ThemeProvider>
  );
}

export default App;
