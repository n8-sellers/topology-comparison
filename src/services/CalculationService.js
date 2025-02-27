/**
 * CalculationService.js
 * 
 * This service provides functions to calculate various metrics for data center network topologies.
 */

/**
 * Calculate all metrics for a given topology configuration
 * @param {Object} topology - The topology object with configuration
 * @returns {Object} - Object containing all calculated metrics
 */
export const calculateAllMetrics = (topology) => {
  if (!topology || !topology.configuration) {
    return null;
  }

  const config = topology.configuration;
  
  return {
    deviceCount: calculateDeviceCount(config),
    cost: calculateCost(config),
    power: calculatePowerUsage(config),
    latency: calculateLatency(config),
    oversubscription: calculateOversubscription(config),
    rackSpace: calculateRackSpace(config),
    cabling: calculateCabling(config)
  };
};

/**
 * Calculate the total number of devices in the topology
 * @param {Object} config - The topology configuration
 * @returns {Object} - Object containing device counts
 */
export const calculateDeviceCount = (config) => {
  const { numSpines, numLeafs } = config;
  
  const totalSwitches = numSpines + numLeafs;
  
  return {
    spines: numSpines,
    leafs: numLeafs,
    total: totalSwitches
  };
};

/**
 * Calculate the total cost of the topology
 * @param {Object} config - The topology configuration
 * @returns {Object} - Object containing cost breakdown
 */
export const calculateCost = (config) => {
  const { numSpines, numLeafs, switchCost, opticsCost } = config;
  
  // Calculate switch costs
  const spineCost = numSpines * switchCost.spine;
  const leafCost = numLeafs * switchCost.leaf;
  const totalSwitchCost = spineCost + leafCost;
  
  // Calculate optics costs
  let totalOpticsCost = 0;
  
  // Check if we're using the new spine configuration model or the old linkTypes model
  if (config.spineConfig) {
    // New model with spineConfig
    const { portSpeed, breakoutMode } = config.spineConfig;
    
    // Make sure breakoutOptions exists and has the right structure
    if (config.breakoutOptions && typeof config.breakoutOptions === 'object' && config.breakoutOptions[portSpeed]) {
      const breakoutOption = config.breakoutOptions[portSpeed].find(
        option => option.type === breakoutMode
      );
      
      if (breakoutOption) {
        // Extract the link speed from the breakout mode (e.g., '4x100G' -> '100G')
        const linkSpeedMatch = breakoutMode.match(/\d+x(\d+G)/);
        const linkSpeed = linkSpeedMatch ? linkSpeedMatch[1] : portSpeed;
        
        // In a Clos network, every spine connects to every leaf with exactly one link
        const totalLinks = numSpines * numLeafs;
        
        // Each link requires 2 optics (one on each end)
        const opticsNeeded = totalLinks * 2;
        
        // Check if the optics cost for this link type exists
        const opticCost = opticsCost[linkSpeed] || 0;
        totalOpticsCost += opticsNeeded * opticCost;
      }
    }
  } else if (config.linkTypes) {
    // Old model with linkTypes array
    // For each link type, calculate the number of optics needed
    config.linkTypes.forEach(link => {
      const linksPerSpine = link.count;
      const totalLinks = numSpines * numLeafs * linksPerSpine;
      // Each link requires 2 optics (one on each end)
      const opticsNeeded = totalLinks * 2;
      
      // Check if the optics cost for this link type exists
      const opticCost = opticsCost[link.type] || 0;
      totalOpticsCost += opticsNeeded * opticCost;
    });
  }
  
  // Calculate total cost
  const totalCost = totalSwitchCost + totalOpticsCost;
  
  return {
    switches: {
      spine: spineCost,
      leaf: leafCost,
      total: totalSwitchCost
    },
    optics: totalOpticsCost,
    total: totalCost
  };
};

/**
 * Calculate the power usage of the topology
 * @param {Object} config - The topology configuration
 * @returns {Object} - Object containing power usage breakdown
 */
export const calculatePowerUsage = (config) => {
  const { numSpines, numLeafs, powerUsage } = config;
  
  // Calculate switch power usage
  const spinePower = numSpines * powerUsage.spine;
  const leafPower = numLeafs * powerUsage.leaf;
  const totalSwitchPower = spinePower + leafPower;
  
  // Calculate optics power usage
  let totalOpticsPower = 0;
  
  // Check if we're using the new spine configuration model or the old linkTypes model
  if (config.spineConfig) {
    // New model with spineConfig
    const { portSpeed, breakoutMode } = config.spineConfig;
    
    // Make sure breakoutOptions exists and has the right structure
    if (config.breakoutOptions && typeof config.breakoutOptions === 'object' && config.breakoutOptions[portSpeed]) {
      const breakoutOption = config.breakoutOptions[portSpeed].find(
        option => option.type === breakoutMode
      );
      
      if (breakoutOption) {
        // Extract the link speed from the breakout mode (e.g., '4x100G' -> '100G')
        const linkSpeedMatch = breakoutMode.match(/\d+x(\d+G)/);
        const linkSpeed = linkSpeedMatch ? linkSpeedMatch[1] : portSpeed;
        
        // In a Clos network, every spine connects to every leaf with exactly one link
        const totalLinks = numSpines * numLeafs;
        
        // Each link requires 2 optics (one on each end)
        const opticsNeeded = totalLinks * 2;
        
        // Check if the optics power for this link type exists
        const opticPower = powerUsage.optics[linkSpeed] || 0;
        totalOpticsPower += opticsNeeded * opticPower;
      }
    }
  } else if (config.linkTypes) {
    // Old model with linkTypes array
    // For each link type, calculate the number of optics needed
    config.linkTypes.forEach(link => {
      const linksPerSpine = link.count;
      const totalLinks = numSpines * numLeafs * linksPerSpine;
      // Each link requires 2 optics (one on each end)
      const opticsNeeded = totalLinks * 2;
      
      // Check if the optics power for this link type exists
      const opticPower = powerUsage.optics[link.type] || 0;
      totalOpticsPower += opticsNeeded * opticPower;
    });
  }
  
  // Calculate total power usage
  const totalPower = totalSwitchPower + totalOpticsPower;
  
  return {
    switches: {
      spine: spinePower,
      leaf: leafPower,
      total: totalSwitchPower
    },
    optics: totalOpticsPower,
    total: totalPower
  };
};

/**
 * Calculate the latency of the topology
 * @param {Object} config - The topology configuration
 * @returns {Object} - Object containing latency metrics
 */
export const calculateLatency = (config) => {
  const { numTiers, latencyParameters } = config;
  
  // In a Clos architecture, the worst-case latency is determined by the number of hops
  // For a 3-tier Clos (spine-leaf), the worst-case is 2 hops (leaf -> spine -> leaf)
  // For a 5-tier Clos, the worst-case is 4 hops (leaf -> spine -> super-spine -> spine -> leaf)
  const hops = numTiers * 2;
  
  // Calculate the switch latency
  const switchLatency = hops * latencyParameters.switchLatency;
  
  // Assume an average fiber length of 10 meters per hop for simplicity
  const fiberLength = hops * 0.01; // 10 meters = 0.01 km
  const fiberLatency = fiberLength * latencyParameters.fiberLatency;
  
  // Calculate total latency
  const totalLatency = switchLatency + fiberLatency;
  
  return {
    hops,
    switchLatency,
    fiberLatency,
    total: totalLatency
  };
};

/**
 * Calculate the oversubscription ratio of the topology
 * @param {Object} config - The topology configuration
 * @returns {Object} - Object containing oversubscription metrics
 */
export const calculateOversubscription = (config) => {
  const { numSpines, numLeafs } = config;
  
  // Calculate the total uplink capacity (leaf to spine)
  let totalUplinkCapacity = 0;
  let uplinkPortsPerLeaf = 0;
  
  // Ensure spineConfig exists
  if (!config.spineConfig) {
    config.spineConfig = {
      portCount: 64,
      portSpeed: '800G',
      breakoutMode: '1x800G'
    };
  }
  
  // Ensure leafConfig exists
  if (!config.leafConfig) {
    config.leafConfig = {
      portCount: 48,
      downlinkSpeed: '100G'
    };
  }
  
  // Check if we're using the new spine configuration model or the old linkTypes model
  if (config.spineConfig) {
    // New model with spineConfig
    const { portSpeed, breakoutMode } = config.spineConfig;
    
    // Make sure breakoutOptions exists and has the right structure
    if (config.breakoutOptions && typeof config.breakoutOptions === 'object' && config.breakoutOptions[portSpeed]) {
      const breakoutOption = config.breakoutOptions[portSpeed].find(
        option => option.type === breakoutMode
      );
      
      if (breakoutOption) {
        // Extract the link speed from the breakout mode (e.g., '4x100G' -> '100G')
        const linkSpeedMatch = breakoutMode.match(/\d+x(\d+G)/);
        const linkSpeed = linkSpeedMatch ? linkSpeedMatch[1] : portSpeed;
        
        // Extract the speed value from the link speed (e.g., '100G' -> 100)
        const speedMatch = linkSpeed.match(/\d+/);
        const speed = speedMatch ? parseInt(speedMatch[0]) : 0;
        
        // In a Clos network, every spine connects to every leaf with exactly one link
        uplinkPortsPerLeaf = numSpines;
        const totalLinks = numSpines * numLeafs;
        
        totalUplinkCapacity = totalLinks * speed;
      }
    }
  } else if (config.linkTypes) {
    // Old model with linkTypes array
    uplinkPortsPerLeaf = 0;
    config.linkTypes.forEach(link => {
      const linksPerSpine = link.count;
      uplinkPortsPerLeaf += linksPerSpine * numSpines;
      const totalLinks = numSpines * numLeafs * linksPerSpine;
      
      // Extract the speed from the link type (e.g., '400G' -> 400)
      // Use a safer approach to extract the number
      const speedMatch = link.type.match(/\d+/);
      const speed = speedMatch ? parseInt(speedMatch[0]) : 0;
      
      totalUplinkCapacity += totalLinks * speed;
    });
  }
  
  // Get the leaf switch port configuration
  // Default to 48 ports if not specified in the configuration
  const leafPortCount = config.leafConfig.portCount || 48;
  
  // Calculate available downlink ports per leaf (total ports minus uplink ports)
  const downlinkPortsPerLeaf = Math.max(0, leafPortCount - uplinkPortsPerLeaf);
  
  // Get the downlink port speed (default to 100G if not specified)
  const downlinkSpeedGbps = config.leafConfig.downlinkSpeed ? 
    parseInt(config.leafConfig.downlinkSpeed.match(/\d+/)[0]) : 100;
  
  // Calculate total downlink capacity across all leaf switches
  const totalDownlinkCapacity = numLeafs * downlinkPortsPerLeaf * downlinkSpeedGbps;
  
  // Calculate oversubscription ratio, handling division by zero
  const oversubscriptionRatio = totalUplinkCapacity > 0 
    ? (totalDownlinkCapacity / totalUplinkCapacity).toFixed(2)
    : 0;
  
  return {
    uplinkCapacity: totalUplinkCapacity,
    downlinkCapacity: totalDownlinkCapacity,
    uplinkPortsPerLeaf,
    downlinkPortsPerLeaf,
    ratio: oversubscriptionRatio
  };
};

/**
 * Calculate the rack space requirements of the topology
 * @param {Object} config - The topology configuration
 * @returns {Object} - Object containing rack space metrics
 */
export const calculateRackSpace = (config) => {
  const { numSpines, numLeafs, rackSpaceParameters } = config;
  
  // Calculate rack units required
  const spineRackUnits = numSpines * rackSpaceParameters.spineRackUnits;
  const leafRackUnits = numLeafs * rackSpaceParameters.leafRackUnits;
  const totalRackUnits = spineRackUnits + leafRackUnits;
  
  // Assume 42U racks for simplicity
  const racksNeeded = Math.ceil(totalRackUnits / 42);
  
  return {
    spineRackUnits,
    leafRackUnits,
    totalRackUnits,
    racksNeeded
  };
};

/**
 * Calculate the cabling requirements of the topology
 * @param {Object} config - The topology configuration
 * @returns {Object} - Object containing cabling metrics
 */
export const calculateCabling = (config) => {
  const { numSpines, numLeafs } = config;
  
  // Calculate the total number of cables needed
  let totalCables = 0;
  let breakoutCables = 0;
  let standardCables = 0;
  
  // Check if we're using the new spine configuration model or the old linkTypes model
  if (config.spineConfig) {
    // New model with spineConfig
    const { portSpeed, breakoutMode } = config.spineConfig;
    
    // In a Clos network, every spine connects to every leaf with exactly one link
    const totalLogicalLinks = numSpines * numLeafs;
    
    // Make sure breakoutOptions exists and has the right structure
    if (config.breakoutOptions && typeof config.breakoutOptions === 'object' && config.breakoutOptions[portSpeed]) {
      const breakoutOption = config.breakoutOptions[portSpeed].find(
        option => option.type === breakoutMode
      );
      
      if (breakoutOption) {
        // Extract the breakout factor (e.g., '4x100G' -> 4)
        const breakoutFactorMatch = breakoutMode.match(/(\d+)x/);
        const breakoutFactor = breakoutFactorMatch ? parseInt(breakoutFactorMatch[1]) : 1;
        
        if (breakoutFactor > 1) {
          // If using breakout cables, we need fewer physical cables
          const cablesNeeded = Math.ceil(totalLogicalLinks / breakoutFactor);
          breakoutCables = cablesNeeded;
          totalCables = cablesNeeded;
        } else {
          // If no breakout, each link needs its own cable
          standardCables = totalLogicalLinks;
          totalCables = totalLogicalLinks;
        }
      } else {
        // Default to standard cables if no breakout option is found
        standardCables = totalLogicalLinks;
        totalCables = totalLogicalLinks;
      }
    } else {
      // Default to standard cables if breakoutOptions is not properly defined
      standardCables = totalLogicalLinks;
      totalCables = totalLogicalLinks;
    }
  } else if (config.linkTypes && config.breakoutOptions) {
    // Old model with linkTypes array
    config.linkTypes.forEach(link => {
      const linksPerSpine = link.count;
      const totalLinks = numSpines * numLeafs * linksPerSpine;
      
      // Check if breakout is enabled for this link type
      const breakoutOption = Array.isArray(config.breakoutOptions) && 
        config.breakoutOptions.find(option => 
          option.enabled && option.type.includes(link.type)
        );
      
      if (breakoutOption) {
        // If breakout is enabled, we need fewer physical cables
        const breakoutFactor = parseInt(breakoutOption.type.split('x')[0]);
        const cablesNeeded = Math.ceil(totalLinks / breakoutFactor);
        breakoutCables += cablesNeeded;
        totalCables += cablesNeeded;
      } else {
        // If no breakout, each link needs its own cable
        standardCables += totalLinks;
        totalCables += totalLinks;
      }
    });
  } else {
    // Default to a simple calculation if neither model is available
    standardCables = numSpines * numLeafs;
    totalCables = standardCables;
  }
  
  return {
    standard: standardCables,
    breakout: breakoutCables,
    total: totalCables
  };
};

/**
 * Compare multiple topologies and return a comparison object
 * @param {Array} topologies - Array of topology objects
 * @returns {Object} - Object containing comparison metrics
 */
export const compareTopologies = (topologies) => {
  if (!topologies || topologies.length === 0) {
    return null;
  }
  
  const comparisonResults = topologies.map(topology => {
    const metrics = calculateAllMetrics(topology);
    return {
      id: topology.id,
      name: topology.name,
      metrics
    };
  });
  
  return comparisonResults;
};

// Create a named object for better ESLint compliance
const calculationService = {
  calculateAllMetrics,
  calculateDeviceCount,
  calculateCost,
  calculatePowerUsage,
  calculateLatency,
  calculateOversubscription,
  calculateRackSpace,
  calculateCabling,
  compareTopologies
};

export default calculationService;
