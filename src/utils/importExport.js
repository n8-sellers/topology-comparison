/**
 * importExport.js
 * 
 * This file contains utility functions for importing and exporting topology data.
 */

/**
 * Export a topology to a JSON file
 * @param {Object} topology - The topology object to export
 */
export const exportTopology = (topology) => {
  // Create a copy of the topology to avoid modifying the original
  const topologyToExport = { ...topology };
  
  // Add export metadata
  topologyToExport.exportedAt = new Date().toISOString();
  topologyToExport.exportVersion = '1.0';
  
  // Convert to JSON string with pretty formatting
  const jsonString = JSON.stringify(topologyToExport, null, 2);
  
  // Create a blob with the JSON data
  const blob = new Blob([jsonString], { type: 'application/json' });
  
  // Create a URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Create a temporary link element
  const link = document.createElement('a');
  link.href = url;
  link.download = `${topology.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
  
  // Append the link to the document
  document.body.appendChild(link);
  
  // Trigger the download
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Import a topology from a JSON file
 * @param {File} file - The JSON file to import
 * @returns {Promise<Object>} - A promise that resolves to the imported topology
 */
export const importTopology = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        // Parse the JSON data
        const topology = JSON.parse(event.target.result);
        
        // Validate the topology
        if (!validateTopology(topology)) {
          reject(new Error('Invalid topology file format'));
          return;
        }
        
        // Generate a new ID for the imported topology
        topology.id = Date.now().toString();
        
        // Update timestamps
        topology.createdAt = new Date().toISOString();
        topology.updatedAt = new Date().toISOString();
        
        // Add import metadata
        topology.importedAt = new Date().toISOString();
        
        // Rename if it's a duplicate
        topology.name = `${topology.name} (Imported)`;
        
        resolve(topology);
      } catch (error) {
        reject(new Error(`Failed to parse topology file: ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read topology file'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Validate a topology object
 * @param {Object} topology - The topology object to validate
 * @returns {boolean} - Whether the topology is valid
 */
export const validateTopology = (topology) => {
  // Check if the topology has the required properties
  if (!topology || typeof topology !== 'object') {
    return false;
  }
  
  // Check for required top-level properties
  const requiredProps = ['name', 'configuration'];
  for (const prop of requiredProps) {
    if (!(prop in topology)) {
      return false;
    }
  }
  
  // Check for required configuration properties
  const requiredConfigProps = [
    'numSpines', 
    'numLeafs', 
    'numTiers',
    'switchCost',
    'opticsCost',
    'powerUsage',
    'latencyParameters',
    'rackSpaceParameters'
  ];
  
  for (const prop of requiredConfigProps) {
    if (!(prop in topology.configuration)) {
      return false;
    }
  }
  
  // Check for either spineConfig or linkTypes
  if (!topology.configuration.spineConfig && !topology.configuration.linkTypes) {
    return false;
  }
  
  return true;
};

export default {
  exportTopology,
  importTopology,
  validateTopology
};
