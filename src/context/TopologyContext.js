import React, { createContext, useContext, useState, useEffect } from 'react';
import localforage from 'localforage';
import { templates, applyTemplate } from '../utils/templates';
import { importTopology as importTopologyUtil } from '../utils/importExport';

// Initialize the context
const TopologyContext = createContext();

// Custom hook to use the topology context
export const useTopology = () => useContext(TopologyContext);

// Default values for a new topology
const defaultTopology = {
  id: null,
  name: 'New Topology',
  description: '',
  createdAt: null,
  updatedAt: null,
  configuration: {
    // Basic configuration
    numSpines: 2,
    numLeafs: 4,
    numTiers: 1,
    spineConfig: {
      portCount: 64,
      portSpeed: '800G',
      breakoutMode: '1x800G'
    },
    leafConfig: {
      portCount: 48,
      downlinkSpeed: '100G'
    },
    
    // Advanced configuration
    breakoutOptions: {
      '800G': [
        { type: '1x800G', factor: 1 },
        { type: '2x400G', factor: 2 },
        { type: '4x200G', factor: 4 },
        { type: '8x100G', factor: 8 }
      ],
      '400G': [
        { type: '1x400G', factor: 1 },
        { type: '2x200G', factor: 2 },
        { type: '4x100G', factor: 4 },
        { type: '8x50G', factor: 8 }
      ]
    },
    disjointedSpines: false,
    railOptimized: false,
    
    // Cost and power parameters
    switchCost: {
      spine: 15000,
      leaf: 10000
    },
    opticsCost: {
      '50G': 300,
      '100G': 500,
      '200G': 1000,
      '400G': 2000,
      '800G': 4000
    },
    powerUsage: {
      spine: 500, // watts
      leaf: 300,  // watts
      optics: {
        '50G': 3,   // watts
        '100G': 5,  // watts
        '200G': 10, // watts
        '400G': 15, // watts
        '800G': 25  // watts
      }
    },
    
    // Latency parameters
    latencyParameters: {
      switchLatency: 0.5, // microseconds
      fiberLatency: 5     // microseconds per km
    },
    
    // Rack space parameters
    rackSpaceParameters: {
      spineRackUnits: 2,
      leafRackUnits: 1
    }
  }
};

export const TopologyProvider = ({ children }) => {
  const [topologies, setTopologies] = useState([]);
  const [currentTopology, setCurrentTopology] = useState(null);
  const [comparisonTopologies, setComparisonTopologies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load topologies from local storage on component mount
  useEffect(() => {
    const loadTopologies = async () => {
      try {
        const savedTopologies = await localforage.getItem('topologies');
        if (savedTopologies) {
          setTopologies(savedTopologies);
          
          // Set the most recently updated topology as the current one if available
          if (savedTopologies.length > 0) {
            const sortedTopologies = [...savedTopologies].sort(
              (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
            );
            setCurrentTopology(sortedTopologies[0]);
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading topologies:', error);
        setLoading(false);
      }
    };

    loadTopologies();
  }, []);

  // Save topologies to local storage whenever they change
  useEffect(() => {
    if (!loading && topologies.length > 0) {
      localforage.setItem('topologies', topologies)
        .catch(error => console.error('Error saving topologies:', error));
    }
  }, [topologies, loading]);

  // Create a new topology
  const createTopology = () => {
    const newTopology = {
      ...defaultTopology,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setTopologies([...topologies, newTopology]);
    setCurrentTopology(newTopology);
    return newTopology;
  };
  
  // Create a new topology from a template
  const createTopologyFromTemplate = (templateName) => {
    const newTopology = {
      ...defaultTopology,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const topologyWithTemplate = applyTemplate(newTopology, templateName);
    
    setTopologies([...topologies, topologyWithTemplate]);
    setCurrentTopology(topologyWithTemplate);
    return topologyWithTemplate;
  };

  // Update an existing topology
  const updateTopology = (updatedTopology) => {
    const updatedTopologies = topologies.map(topology => 
      topology.id === updatedTopology.id 
        ? { ...updatedTopology, updatedAt: new Date().toISOString() } 
        : topology
    );
    
    setTopologies(updatedTopologies);
    
    if (currentTopology && currentTopology.id === updatedTopology.id) {
      setCurrentTopology({ ...updatedTopology, updatedAt: new Date().toISOString() });
    }
    
    return updatedTopology;
  };

  // Delete a topology
  const deleteTopology = (topologyId) => {
    const updatedTopologies = topologies.filter(topology => topology.id !== topologyId);
    setTopologies(updatedTopologies);
    
    // If the deleted topology was the current one, set a new current topology
    if (currentTopology && currentTopology.id === topologyId) {
      setCurrentTopology(updatedTopologies.length > 0 ? updatedTopologies[0] : null);
    }
    
    // Remove from comparison if it was there
    setComparisonTopologies(comparisonTopologies.filter(id => id !== topologyId));
  };

  // Add or remove a topology from comparison
  const toggleComparisonTopology = (topologyId) => {
    if (comparisonTopologies.includes(topologyId)) {
      setComparisonTopologies(comparisonTopologies.filter(id => id !== topologyId));
    } else {
      setComparisonTopologies([...comparisonTopologies, topologyId]);
    }
  };

  // Duplicate a topology
  const duplicateTopology = (topologyId) => {
    const topologyToDuplicate = topologies.find(topology => topology.id === topologyId);
    
    if (!topologyToDuplicate) return null;
    
    const duplicatedTopology = {
      ...topologyToDuplicate,
      id: Date.now().toString(),
      name: `${topologyToDuplicate.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setTopologies([...topologies, duplicatedTopology]);
    return duplicatedTopology;
  };

  // Get a topology by ID
  const getTopologyById = (topologyId) => {
    return topologies.find(topology => topology.id === topologyId) || null;
  };

  // Get topologies for comparison
  const getComparisonTopologies = () => {
    return topologies.filter(topology => comparisonTopologies.includes(topology.id));
  };

  // Import a topology from a file
  const importTopology = async (file) => {
    try {
      const importedTopology = await importTopologyUtil(file);
      setTopologies([...topologies, importedTopology]);
      setCurrentTopology(importedTopology);
      return importedTopology;
    } catch (error) {
      console.error('Error importing topology:', error);
      throw error;
    }
  };

  // Context value
  const value = {
    topologies,
    currentTopology,
    setCurrentTopology,
    comparisonTopologies,
    loading,
    createTopology,
    createTopologyFromTemplate,
    updateTopology,
    deleteTopology,
    toggleComparisonTopology,
    duplicateTopology,
    getTopologyById,
    getComparisonTopologies,
    importTopology,
    templates
  };

  return (
    <TopologyContext.Provider value={value}>
      {children}
    </TopologyContext.Provider>
  );
};

export default TopologyContext;
