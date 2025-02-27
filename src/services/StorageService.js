/**
 * StorageService.js
 * 
 * This service provides functions to save and load topologies from local storage.
 */

import localforage from 'localforage';

// Configure localforage
localforage.config({
  name: 'dc-network-topology-analyzer',
  storeName: 'topologies'
});

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
 * @param {string} id - The ID of the topology to get
 * @returns {Promise} - Promise that resolves with the topology object
 */
export const getTopologyById = async (id) => {
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
 * @returns {Promise} - Promise that resolves with an array of topology objects
 */
export const getAllTopologies = async () => {
  try {
    const topologies = await localforage.getItem('topologies');
    return topologies || [];
  } catch (error) {
    console.error('Error getting topologies:', error);
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
    const existingTopologies = await getAllTopologies();
    
    let updatedTopologies;
    
    if (overwrite) {
      // Create a map of existing topologies by ID for quick lookup
      const existingTopologiesMap = existingTopologies.reduce((map, topology) => {
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

export default {
  saveTopology,
  getTopologyById,
  getAllTopologies,
  deleteTopology,
  exportTopologies,
  importTopologies,
  saveImportedTopologies
};
