import React from 'react';
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
import UIPreview from './pages/UIPreview';

function App() {
  // Storage service initialization is handled in TopologyContext
  
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
              <Route path="/ui-preview" element={<UIPreview />} />
            </Routes>
          </Layout>
        </Router>
      </TopologyProvider>
    </ThemeProvider>
  );
}

export default App;
