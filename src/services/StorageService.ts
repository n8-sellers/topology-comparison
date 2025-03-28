/**
 * StorageService.ts
 * 
 * This service provides functions to save and load topologies from local storage.
 * Optimized for performance with individual topology storage and topology index.
 */

import localforage from 'localforage';
import { Topology } from '../types/topology';

// Configure localforage instances
const topologyStore = localforage.createInstance({
  name: 'dc-network-topology-analyzer',
  storeName: 'topology-data'
});

const topologyIndexStore = localforage.createInstance({
  name: 'dc-network-topology-analyzer',
  storeName: 'topology-index'
});

// Legacy store for backward compatibility
const legacyStore = localforage.createInstance({
  name: 'dc-network-topology-analyzer',
  storeName: 'topologies'
});

/**
 * Get or create the topology index (internal function)
 * @returns Promise that resolves with the topology index
 */
const getTopologyIndexInternal = async (): Promise<any[]> => {
  try {
    const index = await topologyIndexStore.getItem<any[]>('index');
    return index || [];
  } catch (error) {
    console.error('Error getting topology index:', error);
    return [];
  }
};

/**
 * Save the topology index
 * @param index - The topology index to save
 * @returns Promise that resolves when the index is saved
 */
const saveTopologyIndex = async (index: any[]): Promise<boolean> => {
  try {
    await topologyIndexStore.setItem('index', index);
    return true;
  } catch (error) {
    console.error('Error saving topology index:', error);
    throw error;
  }
};

/**
 * Migrate data from legacy storage to new storage format
 * @returns Promise that resolves when migration is complete
 */
const migrateFromLegacyStorage = async (): Promise<boolean> => {
  try {
    // Check if migration is needed
    const migrationCompleted = await topologyIndexStore.getItem<boolean>('migration-completed');
    if (migrationCompleted) return true;
    
    // Get topologies from legacy storage
    const legacyTopologies = await legacyStore.getItem<Topology[]>('topologies');
    if (!legacyTopologies || !Array.isArray(legacyTopologies) || legacyTopologies.length === 0) {
      await topologyIndexStore.setItem('migration-completed', true);
      return true;
    }
    
    // Create index entries
    const index = legacyTopologies.map(topology => ({
      id: topology.id,
      name: topology.name,
      description: topology.description || '',
      createdAt: topology.createdAt,
      updatedAt: topology.updatedAt
    }));
    
    // Save index
    await topologyIndexStore.setItem('index', index);
    
    // Save individual topologies
    for (const topology of legacyTopologies) {
      await topologyStore.setItem(`topology-${topology.id}`, topology);
    }
    
    // Mark migration as completed
    await topologyIndexStore.setItem('migration-completed', true);
    
    console.log(`Migrated ${legacyTopologies.length} topologies from legacy storage`);
    return true;
  } catch (error) {
    console.error('Error migrating from legacy storage:', error);
    return false;
  }
};

/**
 * Initialize the storage service
 * @returns Promise that resolves when initialization is complete
 */
export const initializeStorage = async (): Promise<boolean> => {
  return migrateFromLegacyStorage();
};

/**
 * Save a topology to local storage
 * @param topology - The topology object to save
 * @returns Promise that resolves when the topology is saved
 */
export const saveTopology = async (topology: Topology): Promise<Topology> => {
  if (!topology || !topology.id) {
    throw new Error('Invalid topology object');
  }
  
  try {
    // Get all topologies
    const topologies = await getAllTopologies();
    
    // Find the index of the topology to update
    const index = topologies.findIndex(t => t.id === topology.id);
    
    if (index >= 0) {
      // Update existing topology
      topologies[index] = {
        ...topology,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Add new topology
      topologies.push({
        ...topology,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    // Save all topologies
    await localforage.setItem('topologies', topologies);
    
    return topology;
  } catch (error) {
    console.error('Error saving topology:', error);
    throw error;
  }
};

/**
 * Get a topology by ID from local storage
 * @param id - The ID of the topology to get
 * @returns Promise that resolves with the topology object
 */
export const getTopologyById = async (id: string): Promise<Topology | null> => {
  try {
    const topologies = await getAllTopologies();
    return topologies.find(topology => topology.id === id) || null;
  } catch (error) {
    console.error('Error getting topology:', error);
    throw error;
  }
};

/**
 * Get all topologies from local storage
 * @returns Promise that resolves with an array of topology objects
 */
export const getAllTopologies = async (): Promise<Topology[]> => {
  try {
    const topologies = await localforage.getItem<Topology[]>('topologies');
    return topologies || [];
  } catch (error) {
    console.error('Error getting topologies:', error);
    throw error;
  }
};

/**
 * Delete a topology from local storage
 * @param id - The ID of the topology to delete
 * @returns Promise that resolves when the topology is deleted
 */
export const deleteTopology = async (id: string): Promise<boolean> => {
  try {
    const topologies = await getAllTopologies();
    const updatedTopologies = topologies.filter(topology => topology.id !== id);
    await localforage.setItem('topologies', updatedTopologies);
    return true;
  } catch (error) {
    console.error('Error deleting topology:', error);
    throw error;
  }
};

/**
 * Export topologies to a JSON file
 * @param topologies - Array of topology objects to export
 * @returns JSON string of the topologies
 */
export const exportTopologies = (topologies: Topology[]): string => {
  try {
    return JSON.stringify(topologies, null, 2);
  } catch (error) {
    console.error('Error exporting topologies:', error);
    throw error;
  }
};

/**
 * Import topologies from a JSON string
 * @param json - JSON string of topologies to import
 * @returns Array of topology objects
 */
export const importTopologies = (json: string): Topology[] => {
  try {
    const importedTopologies = JSON.parse(json) as unknown;
    
    // Validate imported topologies
    if (!Array.isArray(importedTopologies)) {
      throw new Error('Invalid import format: expected an array');
    }
    
    // Ensure each topology has required fields
    importedTopologies.forEach(topology => {
      if (!topology.id || !topology.name || !topology.configuration) {
        throw new Error('Invalid topology format: missing required fields');
      }
    });
    
    return importedTopologies;
  } catch (error) {
    console.error('Error importing topologies:', error);
    throw error;
  }
};

/**
 * Save imported topologies to local storage
 * @param importedTopologies - Array of topology objects to save
 * @param overwrite - Whether to overwrite existing topologies with the same ID
 * @returns Promise that resolves when the topologies are saved
 */
export const saveImportedTopologies = async (
  importedTopologies: Topology[], 
  overwrite = false
): Promise<Topology[]> => {
  try {
    const existingTopologies = await getAllTopologies();
    
    let updatedTopologies;
    
    if (overwrite) {
      // Create a map of existing topologies by ID for quick lookup
      const existingTopologiesMap = existingTopologies.reduce<Record<string, Topology>>((map, topology) => {
        map[topology.id] = topology;
        return map;
      }, {});
      
      // Merge imported topologies with existing ones, overwriting duplicates
      updatedTopologies = [
        ...existingTopologies.filter(topology => !importedTopologies.some(t => t.id === topology.id)),
        ...importedTopologies.map(topology => ({
          ...topology,
          updatedAt: new Date().toISOString()
        }))
      ];
    } else {
      // Generate new IDs for imported topologies to avoid conflicts
      updatedTopologies = [
        ...existingTopologies,
        ...importedTopologies.map(topology => ({
          ...topology,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }))
      ];
    }
    
    await localforage.setItem('topologies', updatedTopologies);
    
    return updatedTopologies;
  } catch (error) {
    console.error('Error saving imported topologies:', error);
    throw error;
  }
};

const storageService = {
  initializeStorage,
  saveTopology,
  getTopologyById,
  getAllTopologies,
  deleteTopology,
  exportTopologies,
  importTopologies,
  saveImportedTopologies
};

export default storageService;
