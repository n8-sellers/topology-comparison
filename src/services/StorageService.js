/**
 * StorageService.js
 * 
 * This service provides functions to save and load topologies from local storage.
 * Optimized for performance with individual topology storage and topology index.
 */

import localforage from 'localforage';

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
 * @returns {Promise<Array>} - Promise that resolves with the topology index
 */
const getTopologyIndexInternal = async () => {
  try {
    const index = await topologyIndexStore.getItem('index');
    return index || [];
  } catch (error) {
    console.error('Error getting topology index:', error);
    return [];
  }
};

/**
 * Save the topology index
 * @param {Array} index - The topology index to save
 * @returns {Promise} - Promise that resolves when the index is saved
 */
const saveTopologyIndex = async (index) => {
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
 * @returns {Promise} - Promise that resolves when migration is complete
 */
const migrateFromLegacyStorage = async () => {
  try {
    // Check if migration is needed
    const migrationCompleted = await topologyIndexStore.getItem('migration-completed');
    if (migrationCompleted) return true;
    
    // Get topologies from legacy storage
    const legacyTopologies = await legacyStore.getItem('topologies');
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
 * @returns {Promise} - Promise that resolves when initialization is complete
 */
export const initializeStorage = async () => {
  return migrateFromLegacyStorage();
};

/**
 * Save a topology to local storage
 * @param {Object} topology - The topology object to save
 * @returns {Promise} - Promise that resolves when the topology is saved
 */
export const saveTopology = async (topology) => {
  if (!topology || !topology.id) {
    throw new Error('Invalid topology object');
  }
  
  try {
    // Ensure migration is complete
    await migrateFromLegacyStorage();
    
    // Prepare topology with updated timestamp
    const updatedTopology = {
      ...topology,
      updatedAt: new Date().toISOString()
    };
    
    // If it's a new topology, add creation timestamp
    if (!topology.createdAt) {
      updatedTopology.createdAt = updatedTopology.updatedAt;
    }
    
    // Save the topology individually
    await topologyStore.setItem(`topology-${topology.id}`, updatedTopology);
    
    // Update the index
    const index = await getTopologyIndexInternal();
    const indexEntry = {
      id: updatedTopology.id,
      name: updatedTopology.name,
      description: updatedTopology.description || '',
      createdAt: updatedTopology.createdAt,
      updatedAt: updatedTopology.updatedAt
    };
    
    const existingIndex = index.findIndex(entry => entry.id === topology.id);
    if (existingIndex >= 0) {
      index[existingIndex] = indexEntry;
    } else {
      index.push(indexEntry);
    }
    
    await saveTopologyIndex(index);
    
    return updatedTopology;
  } catch (error) {
    console.error('Error saving topology:', error);
    throw error;
  }
};

/**
 * Get a topology by ID from local storage
 * @param {string} id - The ID of the topology to get
 * @returns {Promise} - Promise that resolves with the topology object
 */
export const getTopologyById = async (id) => {
  try {
    // Ensure migration is complete
    await migrateFromLegacyStorage();
    
    // Get the topology directly
    const topology = await topologyStore.getItem(`topology-${id}`);
    return topology || null;
  } catch (error) {
    console.error('Error getting topology:', error);
    throw error;
  }
};

/**
 * Get all topologies from local storage
 * @returns {Promise} - Promise that resolves with an array of topology objects
 */
export const getAllTopologies = async () => {
  try {
    // Ensure migration is complete
    await migrateFromLegacyStorage();
    
    // Get the index
    const index = await getTopologyIndexInternal();
    
    if (index.length === 0) return [];
    
    // Get all topologies based on the index
    const topologies = await Promise.all(
      index.map(entry => topologyStore.getItem(`topology-${entry.id}`))
    );
    
    // Filter out any null values (in case a topology was deleted but the index wasn't updated)
    return topologies.filter(Boolean);
  } catch (error) {
    console.error('Error getting topologies:', error);
    throw error;
  }
};

/**
 * Get topology index with metadata only (for faster listing)
 * @returns {Promise} - Promise that resolves with an array of topology metadata
 */
export const getTopologyIndex = async () => {
  try {
    // Ensure migration is complete
    await migrateFromLegacyStorage();
    
    // Get the index
    const index = await topologyIndexStore.getItem('index');
    return index || [];
  } catch (error) {
    console.error('Error getting topology index:', error);
    throw error;
  }
};

/**
 * Delete a topology from local storage
 * @param {string} id - The ID of the topology to delete
 * @returns {Promise} - Promise that resolves when the topology is deleted
 */
export const deleteTopology = async (id) => {
  try {
    // Ensure migration is complete
    await migrateFromLegacyStorage();
    
    // Remove the topology
    await topologyStore.removeItem(`topology-${id}`);
    
    // Update the index
    const index = await getTopologyIndexInternal();
    const updatedIndex = index.filter(entry => entry.id !== id);
    await saveTopologyIndex(updatedIndex);
    
    return true;
  } catch (error) {
    console.error('Error deleting topology:', error);
    throw error;
  }
};

/**
 * Export topologies to a JSON file
 * @param {Array} topologies - Array of topology objects to export
 * @returns {string} - JSON string of the topologies
 */
export const exportTopologies = (topologies) => {
  try {
    return JSON.stringify(topologies, null, 2);
  } catch (error) {
    console.error('Error exporting topologies:', error);
    throw error;
  }
};

/**
 * Import topologies from a JSON string
 * @param {string} json - JSON string of topologies to import
 * @returns {Array} - Array of topology objects
 */
export const importTopologies = (json) => {
  try {
    const importedTopologies = JSON.parse(json);
    
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
 * @param {Array} importedTopologies - Array of topology objects to save
 * @param {boolean} overwrite - Whether to overwrite existing topologies with the same ID
 * @returns {Promise} - Promise that resolves when the topologies are saved
 */
export const saveImportedTopologies = async (importedTopologies, overwrite = false) => {
  try {
    // Ensure migration is complete
    await migrateFromLegacyStorage();
    
    const index = await getTopologyIndexInternal();
    const existingIds = new Set(index.map(entry => entry.id));
    
    // Process each imported topology
    for (const topology of importedTopologies) {
      let topologyToSave;
      
      if (overwrite || !existingIds.has(topology.id)) {
        // Save with original ID if overwriting or ID doesn't exist
        topologyToSave = {
          ...topology,
          updatedAt: new Date().toISOString()
        };
        
        // Add createdAt if it doesn't exist
        if (!topologyToSave.createdAt) {
          topologyToSave.createdAt = topologyToSave.updatedAt;
        }
      } else {
        // Generate new ID to avoid conflicts
        const newId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        topologyToSave = {
          ...topology,
          id: newId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      
      // Save the topology
      await saveTopology(topologyToSave);
    }
    
    // Return all topologies
    return getAllTopologies();
  } catch (error) {
    console.error('Error saving imported topologies:', error);
    throw error;
  }
};

// Create a named object for export
const StorageService = {
  initializeStorage,
  saveTopology,
  getTopologyById,
  getAllTopologies,
  getTopologyIndex,
  deleteTopology,
  exportTopologies,
  importTopologies,
  saveImportedTopologies
};

export default StorageService;
