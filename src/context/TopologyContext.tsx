import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { templates, applyTemplate } from '../utils/templates';
import { importTopology as importTopologyUtil } from '../utils/importExport';
import StorageService from '../services/StorageService';
import { Topology } from '../types/topology';
import { TopologyContextType, SaveStatus, ProviderProps } from '../types/context';

// Initialize the context with a proper type
const TopologyContext = createContext<TopologyContextType | undefined>(undefined);

// Custom hook to use the topology context
export const useTopology = (): TopologyContextType => {
  const context = useContext(TopologyContext);
  if (context === undefined) {
    throw new Error('useTopology must be used within a TopologyProvider');
  }
  return context;
};

// Utility function to debounce function calls
type DebouncedFunction<T extends (...args: any[]) => any> = (...args: Parameters<T>) => void;

const debounce = <T extends (...args: any[]) => any>(
  func: T, 
  wait: number
): DebouncedFunction<T> => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      if (timeout) clearTimeout(timeout);
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Default values for a new topology
const defaultTopology: Omit<Topology, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'New Topology',
  description: '',
  configuration: {
    // Basic configuration
    numSpines: 2,
    numLeafs: 4,
    numTiers: 2,  // Default to 2-tier design since most networks use spine-leaf architecture
    spineConfig: {
      portCount: 64,
      portSpeed: '800G',
      breakoutMode: '1x800G'
    },
    leafConfig: {
      portCount: 64,
      downlinkSpeed: '100G',
      breakoutMode: '1x100G'  // Default to no breakout
    },
    // Device selection
    deviceSelection: {
      spine: {
        deviceId: 'arista-7800r3',
        useDefaultConfig: true
      },
      leaf: {
        deviceId: 'cisco-nexus-9364d',
        useDefaultConfig: true
      }
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
      ],
      '100G': [
        { type: '1x100G', factor: 1 },
        { type: '2x50G', factor: 2 },
        { type: '4x25G', factor: 4 },
        { type: '10x10G', factor: 10 }
      ],
      '40G': [
        { type: '1x40G', factor: 1 },
        { type: '4x10G', factor: 4 }
      ],
      '25G': [
        { type: '1x25G', factor: 1 }
      ],
      '10G': [
        { type: '1x10G', factor: 1 }
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

export const TopologyProvider = ({ children }: ProviderProps) => {
  const [topologies, setTopologies] = useState<Topology[]>([]);
  const [currentTopology, setCurrentTopology] = useState<Topology | null>(null);
  const [comparisonTopologies, setComparisonTopologies] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [autoSave, setAutoSave] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved'); // 'saved', 'saving', 'error'

  // Initialize the storage service and load topologies
  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize storage service (handles data migration)
        const initialized = await StorageService.initializeStorage();
        
        // Only log in development mode
        if (process.env.NODE_ENV === 'development') {
          console.log('Storage service initialized:', initialized);
        }
        
        // Load all topologies
        const savedTopologies = await StorageService.getAllTopologies();
        setTopologies(savedTopologies);
        
        // Set the most recently updated topology as the current one if available
        if (savedTopologies.length > 0) {
          const sortedTopologies = [...savedTopologies].sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
          setCurrentTopology(sortedTopologies[0]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error initializing topology context:', error);
        setLoading(false);
      }
    };

    initialize();
  }, []);
  
  // Create debounced save function
  const debouncedSave = useCallback(
    debounce(async (topology: Topology) => {
      try {
        setSaveStatus('saving');
        await StorageService.saveTopology(topology);
        setSaveStatus('saved');
      } catch (error) {
        console.error('Error auto-saving topology:', error);
        setSaveStatus('error');
      }
    }, 1000),
    []
  );

  // Toggle auto-save feature
  const toggleAutoSave = useCallback(() => {
    setAutoSave(prev => !prev);
  }, []);
  
  // Create a new topology
  const createTopology = useCallback((): Topology => {
    const newTopology: Topology = {
      ...defaultTopology,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setTopologies(prevTopologies => [...prevTopologies, newTopology]);
    setCurrentTopology(newTopology);
    return newTopology;
  }, [topologies]);
  
  // Create a new topology from a template
  const createTopologyFromTemplate = useCallback((templateName: string): Topology => {
    const newTopology: Topology = {
      ...defaultTopology,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const topologyWithTemplate = applyTemplate(newTopology, templateName);
    
    setTopologies(prevTopologies => [...prevTopologies, topologyWithTemplate]);
    setCurrentTopology(topologyWithTemplate);
    return topologyWithTemplate;
  }, [topologies]);

  // Update an existing topology
  const updateTopology = useCallback((updatedTopology: Topology): Topology => {
    const topologyWithUpdatedTimestamp: Topology = { 
      ...updatedTopology, 
      updatedAt: new Date().toISOString() 
    };
    
    setTopologies(prevTopologies => 
      prevTopologies.map(topology => 
        topology.id === updatedTopology.id 
          ? topologyWithUpdatedTimestamp
          : topology
      )
    );
    
    if (currentTopology && currentTopology.id === updatedTopology.id) {
      setCurrentTopology(topologyWithUpdatedTimestamp);
      
      // Save the topology to storage service
      StorageService.saveTopology(topologyWithUpdatedTimestamp)
        .catch(error => console.error('Error saving topology:', error));
    }
    
    return topologyWithUpdatedTimestamp;
  }, [topologies, currentTopology]);
  
  // Update topology with auto-save if enabled
  const updateTopologyWithAutoSave = useCallback((updatedTopology: Topology): Topology => {
    const topologyWithUpdatedTimestamp: Topology = { 
      ...updatedTopology, 
      updatedAt: new Date().toISOString() 
    };
    
    setTopologies(prevTopologies => 
      prevTopologies.map(topology => 
        topology.id === updatedTopology.id 
          ? topologyWithUpdatedTimestamp
          : topology
      )
    );
    
    if (currentTopology && currentTopology.id === updatedTopology.id) {
      setCurrentTopology(topologyWithUpdatedTimestamp);
      
      // Only auto-save if the feature is enabled
      if (autoSave) {
        setSaveStatus('saving');
        debouncedSave(topologyWithUpdatedTimestamp);
      }
    }
    
    return topologyWithUpdatedTimestamp;
  }, [topologies, currentTopology, autoSave, debouncedSave]);

  // Delete a topology
  const deleteTopology = useCallback((topologyId: string): void => {
    setTopologies(prevTopologies => 
      prevTopologies.filter(topology => topology.id !== topologyId)
    );
    
    // If the deleted topology was the current one, set a new current topology
    if (currentTopology && currentTopology.id === topologyId) {
      setTopologies(prevTopologies => {
        const updatedTopologies = prevTopologies.filter(topology => topology.id !== topologyId);
        setCurrentTopology(updatedTopologies.length > 0 ? updatedTopologies[0] : null);
        return updatedTopologies;
      });
    }
    
    // Remove from comparison if it was there
    setComparisonTopologies(prevComparison => 
      prevComparison.filter(id => id !== topologyId)
    );
    
    // Delete from storage
    StorageService.deleteTopology(topologyId)
      .catch(error => console.error('Error deleting topology:', error));
  }, [topologies, currentTopology, comparisonTopologies]);

  // Add or remove a topology from comparison
  const toggleComparisonTopology = useCallback((topologyId: string): void => {
    setComparisonTopologies(prevComparison => {
      if (prevComparison.includes(topologyId)) {
        return prevComparison.filter(id => id !== topologyId);
      } else {
        return [...prevComparison, topologyId];
      }
    });
  }, [comparisonTopologies]);

  // Duplicate a topology
  const duplicateTopology = useCallback((topologyId: string): Topology | null => {
    const topologyToDuplicate = topologies.find(topology => topology.id === topologyId);
    
    if (!topologyToDuplicate) return null;
    
    const duplicatedTopology: Topology = {
      ...topologyToDuplicate,
      id: Date.now().toString(),
      name: `${topologyToDuplicate.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setTopologies(prevTopologies => [...prevTopologies, duplicatedTopology]);
    
    // Save the duplicated topology
    StorageService.saveTopology(duplicatedTopology)
      .catch(error => console.error('Error saving duplicated topology:', error));
    
    return duplicatedTopology;
  }, [topologies]);

  // Get a topology by ID
  const getTopologyById = useCallback((topologyId: string): Topology | null => {
    return topologies.find(topology => topology.id === topologyId) || null;
  }, [topologies]);

  // Get topologies for comparison
  const getComparisonTopologies = useCallback((): Topology[] => {
    return topologies.filter(topology => comparisonTopologies.includes(topology.id));
  }, [topologies, comparisonTopologies]);

  // Import a topology from a file
  const importTopology = useCallback(async (file: File): Promise<Topology> => {
    try {
      const importedTopology = await importTopologyUtil(file);
      setTopologies(prevTopologies => [...prevTopologies, importedTopology]);
      setCurrentTopology(importedTopology);
      
      // Save the imported topology
      await StorageService.saveTopology(importedTopology);
      
      return importedTopology;
    } catch (error) {
      console.error('Error importing topology:', error);
      throw error;
    }
  }, [topologies]);

  // Context value
  const value: TopologyContextType = {
    topologies,
    currentTopology,
    setCurrentTopology,
    comparisonTopologies,
    loading,
    autoSave,
    saveStatus,
    toggleAutoSave,
    createTopology,
    createTopologyFromTemplate,
    updateTopology,
    updateTopologyWithAutoSave,
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
