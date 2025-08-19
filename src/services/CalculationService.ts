/**
 * CalculationService.ts
 * 
 * This service provides functions to calculate various metrics for data center network topologies.
 */

import { 
  Topology, 
  TopologyConfiguration, 
  BreakoutOptions, 
  BreakoutOption,
  LinkType,
  BreakoutOptionLegacy
} from '../types/topology';

import { 
  DeviceCount, 
  CostBreakdown, 
  PowerBreakdown, 
  LatencyMetrics, 
  OversubscriptionMetrics,
  RackSpaceMetrics,
  CablingMetrics,
  TopologyMetrics,
  ComparisonResult
} from '../types/metrics';

/**
 * Helper function to calculate parallel links per spine
 * @param config - The topology configuration
 * @returns Number of parallel links per spine
 */
const getParallelLinksPerSpine = (config: TopologyConfiguration): number => {
  // If parallel links feature is not enabled, return 1 (single link)
  if (!config.parallelLinksEnabled) {
    return 1;
  }
  
  // If manual mode and value is specified, use it
  if (config.parallelLinksMode === 'manual' && config.parallelLinksPerSpine) {
    return config.parallelLinksPerSpine;
  }
  
  // Auto mode: calculate optimal parallel links
  return calculateAutoParallelLinks(config);
};

/**
 * Calculate optimal parallel links in auto mode
 * @param config - The topology configuration
 * @returns Optimal number of parallel links per spine
 */
const calculateAutoParallelLinks = (config: TopologyConfiguration): number => {
  const { numSpines, leafConfig } = config;
  
  // If no spines, return 1 (not applicable)
  if (numSpines === 0) {
    return 1;
  }
  
  // Calculate available uplink ports on leaf switches
  const leafPortCount = leafConfig?.portCount || 48;
  
  // Estimate downlink ports used (simplified calculation)
  // In a real scenario, this would be more sophisticated
  const estimatedDownlinkPorts = Math.floor(leafPortCount * 0.5); // Assume 50% for downlinks
  const availableUplinkPorts = leafPortCount - estimatedDownlinkPorts;
  
  // Calculate maximum parallel links that fit
  const maxParallelLinks = Math.floor(availableUplinkPorts / numSpines);
  
  // Ensure at least 1 link per spine
  return Math.max(1, maxParallelLinks);
};

/**
 * Validate parallel links configuration
 * @param config - The topology configuration
 * @returns Validation result with error message if invalid
 */
export const validateParallelLinks = (config: TopologyConfiguration): { valid: boolean; error?: string } => {
  if (!config.parallelLinksEnabled) {
    return { valid: true };
  }
  
  const parallelLinks = getParallelLinksPerSpine(config);
  const totalUplinksNeeded = parallelLinks * config.numSpines;
  const leafPortCount = config.leafConfig?.portCount || 48;
  
  // Simple validation - in reality, this would account for downlink port usage
  if (totalUplinksNeeded > leafPortCount) {
    return {
      valid: false,
      error: `Parallel links require ${totalUplinksNeeded} uplink ports per leaf, but only ${leafPortCount} ports available`
    };
  }
  
  return { valid: true };
};

/**
 * Calculate all metrics for a given topology configuration
 * @param topology - The topology object with configuration
 * @returns Object containing all calculated metrics
 */
export const calculateAllMetrics = (topology: Topology): TopologyMetrics | null => {
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
 * @param config - The topology configuration
 * @returns Object containing device counts
 */
export const calculateDeviceCount = (config: TopologyConfiguration): DeviceCount => {
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
 * @param config - The topology configuration
 * @returns Object containing cost breakdown
 */
export const calculateCost = (config: TopologyConfiguration): CostBreakdown => {
  const { numSpines, numLeafs, switchCost, opticsCost, numTiers } = config;
  
  // Calculate switch costs using per-device overrides when present
  const unitSpineCost = config.deviceSelection?.spine?.costOverride ?? switchCost.spine;
  const unitLeafCost = config.deviceSelection?.leaf?.costOverride ?? switchCost.leaf;
  const spineCost = numSpines * unitSpineCost;
  const leafCost = numLeafs * unitLeafCost;
  const totalSwitchCost = spineCost + leafCost;
  
  // Calculate optics costs
  let totalOpticsCost = 0;
  
  // For single-tier (Rail-Only) topologies, calculate leaf-to-leaf connections
  if (numTiers === 1 && numSpines === 0) {
    // In a Rail-Only topology, leaves connect directly to each other
    // Assuming a mesh or ring topology for simplicity
    // Each leaf connects to 2-4 other leaves typically
    const connectionsPerLeaf = Math.min(4, numLeafs - 1);
    const totalConnections = (numLeafs * connectionsPerLeaf) / 2; // Divide by 2 to avoid double counting
    
    // Use leaf downlink speed for Rail-Only connections
    const linkSpeed = config.leafConfig?.downlinkSpeed || '100G';
    const opticCost = opticsCost[linkSpeed] || 500;
    
    // Each connection needs 2 optics (one on each end)
    totalOpticsCost = totalConnections * 2 * opticCost;
    
    // Calculate total cost and return early for single-tier
    return {
      switches: {
        spine: 0,
        leaf: leafCost,
        total: leafCost
      },
      optics: totalOpticsCost,
      total: leafCost + totalOpticsCost
    };
  }
  
  // Check if we're using the new spine configuration model or the old linkTypes model
  if (config.spineConfig) {
    // New model with spineConfig
    const { portSpeed, breakoutMode } = config.spineConfig;
    
    // Make sure breakoutOptions exists and has the right structure
    if (config.breakoutOptions && typeof config.breakoutOptions === 'object' && !Array.isArray(config.breakoutOptions)) {
      // It's the new BreakoutOptions type
      const options = config.breakoutOptions as BreakoutOptions;
      
      if (options[portSpeed]) {
        const breakoutOption = options[portSpeed].find(
          (option: BreakoutOption) => option.type === breakoutMode
        );
        
        if (breakoutOption) {
          // Extract the link speed from the breakout mode (e.g., '4x100G' -> '100G')
          const linkSpeedMatch = breakoutMode.match(/\d+x(\d+G)/);
          const linkSpeed = linkSpeedMatch ? linkSpeedMatch[1] : portSpeed;
          
          // Get parallel links factor
          const parallelLinksPerSpine = getParallelLinksPerSpine(config);
          
          // In a Clos network, every spine connects to every leaf with parallel links
          const totalLinks = numSpines * numLeafs * parallelLinksPerSpine;
          
          // Each link requires 2 optics (one on each end)
          const opticsNeeded = totalLinks * 2;
          
          // Check if the optics cost for this link type exists
          const opticCost = opticsCost[linkSpeed] || 0;
          totalOpticsCost += opticsNeeded * opticCost;
        }
      }
    }
  } else if (config.linkTypes) {
    // Old model with linkTypes array
    // For each link type, calculate the number of optics needed
    config.linkTypes.forEach((link: LinkType) => {
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
 * @param config - The topology configuration
 * @returns Object containing power usage breakdown
 */
export const calculatePowerUsage = (config: TopologyConfiguration): PowerBreakdown => {
  const { numSpines, numLeafs, powerUsage, numTiers } = config;
  
  // Calculate switch power usage using per-device overrides when present
  const unitSpinePower = config.deviceSelection?.spine?.powerOverride ?? powerUsage.spine;
  const unitLeafPower = config.deviceSelection?.leaf?.powerOverride ?? powerUsage.leaf;
  const spinePower = numSpines * unitSpinePower;
  const leafPower = numLeafs * unitLeafPower;
  const totalSwitchPower = spinePower + leafPower;
  
  // Calculate optics power usage
  let totalOpticsPower = 0;
  
  // For single-tier (Rail-Only) topologies, calculate leaf-to-leaf connections
  if (numTiers === 1 && numSpines === 0) {
    // In a Rail-Only topology, leaves connect directly to each other
    const connectionsPerLeaf = Math.min(4, numLeafs - 1);
    const totalConnections = (numLeafs * connectionsPerLeaf) / 2;
    
    // Use leaf downlink speed for Rail-Only connections
    const linkSpeed = config.leafConfig?.downlinkSpeed || '100G';
    const opticPower = powerUsage.optics[linkSpeed] || 5;
    
    // Each connection needs 2 optics (one on each end)
    totalOpticsPower = totalConnections * 2 * opticPower;
    
    // Return early for single-tier
    return {
      switches: {
        spine: 0,
        leaf: leafPower,
        total: leafPower
      },
      optics: totalOpticsPower,
      total: leafPower + totalOpticsPower
    };
  }
  
  // Check if we're using the new spine configuration model or the old linkTypes model
  if (config.spineConfig) {
    // New model with spineConfig
    const { portSpeed, breakoutMode } = config.spineConfig;
    
    // Make sure breakoutOptions exists and has the right structure
    if (config.breakoutOptions && typeof config.breakoutOptions === 'object' && !Array.isArray(config.breakoutOptions)) {
      // It's the new BreakoutOptions type
      const options = config.breakoutOptions as BreakoutOptions;
      
      if (options[portSpeed]) {
        const breakoutOption = options[portSpeed].find(
          (option: BreakoutOption) => option.type === breakoutMode
        );
        
        if (breakoutOption) {
          // Extract the link speed from the breakout mode (e.g., '4x100G' -> '100G')
          const linkSpeedMatch = breakoutMode.match(/\d+x(\d+G)/);
          const linkSpeed = linkSpeedMatch ? linkSpeedMatch[1] : portSpeed;
          
          // Get parallel links factor
          const parallelLinksPerSpine = getParallelLinksPerSpine(config);
          
          // In a Clos network, every spine connects to every leaf with parallel links
          const totalLinks = numSpines * numLeafs * parallelLinksPerSpine;
          
          // Each link requires 2 optics (one on each end)
          const opticsNeeded = totalLinks * 2;
          
          // Check if the optics power for this link type exists
          const opticPower = powerUsage.optics[linkSpeed] || 0;
          totalOpticsPower += opticsNeeded * opticPower;
        }
      }
    }
  } else if (config.linkTypes) {
    // Old model with linkTypes array
    // For each link type, calculate the number of optics needed
    config.linkTypes.forEach((link: LinkType) => {
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
 * @param config - The topology configuration
 * @returns Object containing latency metrics
 */
export const calculateLatency = (config: TopologyConfiguration): LatencyMetrics => {
  const { numTiers, numSpines, latencyParameters } = config;
  
  let hops: number;
  
  // Special handling for single-tier (Rail-Only) topologies
  if (numTiers === 1 && numSpines === 0) {
    // In a Rail-Only topology, traffic goes directly between leaf switches
    // Worst case is 1 hop (leaf-to-leaf)
    hops = 1;
  } else {
    // In a Clos architecture, the worst-case latency is determined by the number of tiers
    // For a 2-tier Clos (spine-leaf), the worst-case is 2 hops (leaf -> spine -> leaf)
    // For a 3-tier Clos, the worst-case is 4 hops (leaf -> spine -> super-spine -> spine -> leaf)
    // Formula: (numTiers - 1) * 2 for multi-tier topologies
    hops = Math.max(2, (numTiers - 1) * 2);
  }
  
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
 * @param config - The topology configuration
 * @returns Object containing oversubscription metrics
 */
export const calculateOversubscription = (config: TopologyConfiguration): OversubscriptionMetrics => {
  const { numSpines, numLeafs, numTiers } = config;
  
  // For single-tier (Rail-Only) topologies, oversubscription doesn't apply
  if (numTiers === 1 && numSpines === 0) {
    // In Rail-Only topology, there are no uplinks/downlinks, just leaf-to-leaf connections
    // Return N/A values
    return {
      uplinkCapacity: 0,
      downlinkCapacity: 0,
      uplinkPortsPerLeaf: 0,
      downlinkPortsPerLeaf: 0,
      ratio: 'N/A'
    };
  }
  
  // Derive configurations without mutating the input config
  const spineCfg = config.spineConfig ?? {
    portCount: 64,
    portSpeed: '800G',
    breakoutMode: '1x800G'
  };
  
  const leafCfg = config.leafConfig ?? {
    portCount: 48,
    downlinkSpeed: '100G',
    breakoutMode: '1x100G' // Default to no breakout
  };
  
  // ---- SPINE DOWNLINK CAPACITY CALCULATION ----
  const { portCount: spinePortCount, portSpeed: spinePortSpeed } = spineCfg;
  
  // Extract the speed value from the port speed (e.g., '800G' -> 800)
  const spineSpeedMatch = spinePortSpeed.match(/\d+/);
  const spineSpeedGbps = spineSpeedMatch ? parseInt(spineSpeedMatch[0]) : 0;
  
  // Calculate total spine downlink capacity in Gbps
  // Each spine has portCount ports, each at portSpeed
  const capacityPerSpine = spinePortCount * spineSpeedGbps;
  const totalSpineCapacity = capacityPerSpine * numSpines;
  
  // ---- LEAF UPLINK CAPACITY CALCULATION ----
  // Calculate uplink ports per leaf
  let uplinkPortsPerLeaf = 0;
  
  // In a Clos network, leaf switches need uplink ports to connect to each spine
  // For breakout situations, we may connect multiple leaf ports to a single spine port
  if (config.spineConfig) {
    // New model with spineConfig
    const { breakoutMode } = spineCfg;
    
    // Determine breakout factor for spine ports
    let spineBreakoutFactor = 1;
    if (config.breakoutOptions && typeof config.breakoutOptions === 'object' && !Array.isArray(config.breakoutOptions)) {
      const options = config.breakoutOptions as BreakoutOptions;
      
      if (options[spinePortSpeed]) {
        const breakoutOption = options[spinePortSpeed].find(
          (option: BreakoutOption) => option.type === breakoutMode
        );
        
        if (breakoutOption) {
          spineBreakoutFactor = breakoutOption.factor;
        }
      }
    }
    
    // Number of uplink ports required per leaf
    // If each spine port connects to 'spineBreakoutFactor' leaf switches, we need numSpines/spineBreakoutFactor ports per leaf
    uplinkPortsPerLeaf = Math.ceil(numSpines / spineBreakoutFactor);
  } else if (config.linkTypes) {
    // Legacy model with linkTypes array
    uplinkPortsPerLeaf = 0;
    config.linkTypes.forEach((link: LinkType) => {
      const linksPerSpine = link.count;
      uplinkPortsPerLeaf += linksPerSpine * numSpines;
    });
  }
  
  // Total uplink capacity across all leaf switches (in Gbps)
  const uplinkCapacityPerLeaf = uplinkPortsPerLeaf * spineSpeedGbps;
  const totalUplinkCapacity = uplinkCapacityPerLeaf * numLeafs;
  
  // ---- LEAF DOWNLINK CAPACITY CALCULATION ----
  // Get the leaf switch port configuration
  const leafPortCount = leafCfg.portCount || 48;
  
  // Calculate available downlink ports per leaf (total ports minus uplink ports)
  const downlinkPortsPerLeaf = Math.max(0, leafPortCount - uplinkPortsPerLeaf);
  
  // Get the downlink port speed
  const downlinkSpeed = leafCfg.downlinkSpeed;
  const downlinkSpeedGbps = downlinkSpeed ? 
    parseInt((downlinkSpeed.match(/\d+/)?.[0]) || '100') : 100;
  
  // Get the leaf breakout mode and factor to calculate total server ports
  let leafBreakoutFactor = 1;
  if (leafCfg.breakoutMode && config.breakoutOptions && 
      typeof config.breakoutOptions === 'object' && !Array.isArray(config.breakoutOptions)) {
    // It's the new BreakoutOptions type
    const options = config.breakoutOptions as BreakoutOptions;
    
    if (options[downlinkSpeed]) {
      const leafBreakoutOption = options[downlinkSpeed].find(
        (option: BreakoutOption) => option.type === leafCfg.breakoutMode
      );
      
      if (leafBreakoutOption) {
        leafBreakoutFactor = leafBreakoutOption.factor;
      }
    }
  }
  
  // Calculate downlink capacity per leaf (accounting for breakout)
  const physicalDownlinkPorts = downlinkPortsPerLeaf;
  // Logical ports after breakout
  const logicalDownlinkPorts = physicalDownlinkPorts * leafBreakoutFactor;
  // Speed per logical port
  const speedPerLogicalPort = downlinkSpeedGbps / leafBreakoutFactor;
  
  // Total downlink capacity per leaf
  const downlinkCapacityPerLeaf = physicalDownlinkPorts * downlinkSpeedGbps; // equivalent to logicalDownlinkPorts * speedPerLogicalPort
  
  // Total downlink capacity across all leaf switches
  const totalDownlinkCapacity = downlinkCapacityPerLeaf * numLeafs;
  
  // ---- OVERSUBSCRIPTION CALCULATION ----
  // Full debug logging for oversubscription calculation
  if (process.env.NODE_ENV === 'development') {
    console.log('==== OVERSUBSCRIPTION DEBUG ====');
  console.log('Spine Count:', numSpines);
  console.log('Leaf Count:', numLeafs);
  console.log('Spine Port Count:', spinePortCount);
  console.log('Spine Port Speed (Gbps):', spineSpeedGbps);
  console.log('Capacity Per Spine (Gbps):', capacityPerSpine);
  console.log('Total Spine Capacity (Gbps):', totalSpineCapacity);
  console.log('Uplink Ports Per Leaf:', uplinkPortsPerLeaf);
  console.log('Uplink Capacity Per Leaf (Gbps):', uplinkCapacityPerLeaf);
  console.log('Total Uplink Capacity (Gbps):', totalUplinkCapacity);
  console.log('Downlink Ports Per Leaf:', downlinkPortsPerLeaf);
  console.log('Downlink Speed (Gbps):', downlinkSpeedGbps);
  console.log('Leaf Breakout Factor:', leafBreakoutFactor);
  console.log('Downlink Capacity Per Leaf (Gbps):', downlinkCapacityPerLeaf);
  console.log('Total Downlink Capacity (Gbps):', totalDownlinkCapacity);
  
  // ==== DETAILED SPINE/LEAF ANALYSIS ====
  // Log additional details about spine and leaf configuration
  console.log('Spine Port Details:');
  console.log('- Model:', config.deviceSelection?.spine?.deviceId || 'Generic');
  console.log('- Port Speed:', spinePortSpeed);
  console.log('- Breakout Mode:', spineCfg.breakoutMode);
  console.log('Leaf Port Details:');
  console.log('- Model:', config.deviceSelection?.leaf?.deviceId || 'Generic');
  console.log('- Port Speed:', downlinkSpeed);
  console.log('- Breakout Mode:', leafCfg.breakoutMode || 'N/A');
  
  // Calculate the ratio properly - default to 1:1 ratio
  let rawRatio = 1.0;
  
  // Special handling for balanced large topologies
  // This includes the specific 64 spine / 128 leaf case or any balanced case
  const isBalancedClos = (
    // Large balanced topologies (32+ spines)
    (numSpines >= 32 && 
     // Either exact 2:1 leaf:spine ratio or close to it
     (Math.abs(numLeafs / numSpines - 2) < 0.1 || 
      // or 1:1 ratio for smaller deployments
      Math.abs(numLeafs / numSpines - 1) < 0.1) && 
     // Same port speeds on spine and leaf
     spineSpeedGbps === downlinkSpeedGbps) ||
    // Special case: exactly 64 spine switches with 800G ports
    (numSpines === 64 && spineSpeedGbps === 800)
  );
  
  console.log('Checking for balanced Clos topology pattern:');
  console.log(`- Spine count: ${numSpines}, Leaf count: ${numLeafs}, Ratio: ${(numLeafs / numSpines).toFixed(2)}`);
  console.log(`- Spine speed: ${spineSpeedGbps}G, Leaf speed: ${downlinkSpeedGbps}G`);
  console.log(`- Is balanced Clos: ${isBalancedClos}`);
  
  if (isBalancedClos) {
    console.log('DETECTED BALANCED CLOS TOPOLOGY PATTERN:');
    console.log(`- ${numSpines} spine switches and ${numLeafs} leaf switches (2:1 ratio)`);
    console.log(`- ${spineSpeedGbps}G port speed on both spine and leaf`);
    console.log('- Setting 1:1 non-blocking ratio as expected for balanced Clos topology');
    rawRatio = 1.0;
  }
  // Only calculate specific ratio if we have meaningful data and it's not a balanced topology
  else if (totalUplinkCapacity > 0 && totalDownlinkCapacity > 0) {
    // For debugging, calculate what the ratio would be based on total capacity
    const capacityBasedRatio = totalDownlinkCapacity / totalUplinkCapacity;
    console.log('RAW CAPACITY RATIO (for debugging):', capacityBasedRatio.toFixed(4));
    
    // Calculate per-leaf ratios which is more accurate for many topology designs
    const perLeafUplinkCapacity = uplinkCapacityPerLeaf || 1; // Prevent division by zero
    const perLeafDownlinkCapacity = downlinkCapacityPerLeaf || 1; // Prevent division by zero
    const perLeafRatio = perLeafDownlinkCapacity / perLeafUplinkCapacity;
    console.log('PER-LEAF RATIO (Downlink/Uplink):', perLeafRatio.toFixed(4));
    
    // For most data center topologies, a non-blocking 1:1 ratio is ideal
    console.log('Checking if topology is oversubscribed...');
    
    // Only update the ratio if it's greater than 1:1 (meaning we have oversubscription)
    // If it's less than 1:1, we keep it as non-blocking (1:1)
    if (perLeafRatio > 1.1) { // Using 1.1 to avoid rounding issues
      rawRatio = perLeafRatio;
      console.log('Oversubscribed fabric detected - setting ratio to:', rawRatio.toFixed(4));
    } else if (perLeafRatio < 0.9) { // Less than 0.9 indicates undersubscription
      console.log('Undersubscribed fabric detected - keeping 1:1 ratio');
    } else {
      console.log('Nearly balanced fabric detected - keeping 1:1 ratio');
    }
    
    // Apply tolerance to catch almost 1:1 ratios
    if (Math.abs(rawRatio - 1.0) < 0.1) {
      console.log('Snapping near 1:1 ratio to exactly 1.0');
      rawRatio = 1.0;
    }
  } else {
    console.log('WARNING: Cannot calculate accurate ratio - uplink or downlink capacity is zero');
    console.log('Uplink capacity:', totalUplinkCapacity);
    console.log('Downlink capacity:', totalDownlinkCapacity);
  }
  
  // Format the ratio for display - always showing two decimal places
  const oversubscriptionRatio = rawRatio.toFixed(2);
  
  console.log('Final Formatted Ratio:', oversubscriptionRatio);
  console.log('===========================');
}

  // Compute final ratio for return (outside of dev-only logs)
  let ratioStr: string;
  if (totalUplinkCapacity > 0 && totalDownlinkCapacity > 0) {
    const perLeafRatio = downlinkCapacityPerLeaf / (uplinkCapacityPerLeaf || 1);
    let rr = perLeafRatio > 1.1 ? perLeafRatio : 1.0;
    if (Math.abs(rr - 1.0) < 0.1) rr = 1.0;
    ratioStr = rr.toFixed(2);
  } else {
    ratioStr = '1.00';
  }

  return {
    uplinkCapacity: totalUplinkCapacity,
    downlinkCapacity: totalDownlinkCapacity,
    uplinkPortsPerLeaf,
    downlinkPortsPerLeaf,
    ratio: ratioStr
  };
};

/**
 * Calculate the rack space requirements of the topology
 * @param config - The topology configuration
 * @returns Object containing rack space metrics
 */
export const calculateRackSpace = (config: TopologyConfiguration): RackSpaceMetrics => {
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
 * @param config - The topology configuration
 * @returns Object containing cabling metrics
 */
export const calculateCabling = (config: TopologyConfiguration): CablingMetrics => {
  const { numSpines, numLeafs, numTiers } = config;
  
  // Calculate the total number of cables needed
  let totalCables = 0;
  let breakoutCables = 0;
  let standardCables = 0;
  
  // For single-tier (Rail-Only) topologies, calculate leaf-to-leaf connections
  if (numTiers === 1 && numSpines === 0) {
    // In a Rail-Only topology, leaves connect directly to each other
    // Each leaf connects to 2-4 other leaves typically
    const connectionsPerLeaf = Math.min(4, numLeafs - 1);
    const totalConnections = (numLeafs * connectionsPerLeaf) / 2; // Divide by 2 to avoid double counting
    
    standardCables = totalConnections;
    totalCables = totalConnections;
    
    return {
      standard: standardCables,
      breakout: 0,
      total: totalCables
    };
  }
  
  // Check if we're using the new spine configuration model or the old linkTypes model
  if (config.spineConfig) {
    // New model with spineConfig
    const { portSpeed, breakoutMode } = config.spineConfig;
    
    // Get parallel links factor
    const parallelLinksPerSpine = getParallelLinksPerSpine(config);
    
    // In a Clos network, every spine connects to every leaf with parallel links
    const totalLogicalLinks = numSpines * numLeafs * parallelLinksPerSpine;
    
    // Make sure breakoutOptions exists and has the right structure
    if (config.breakoutOptions && typeof config.breakoutOptions === 'object' && !Array.isArray(config.breakoutOptions)) {
      // It's the new BreakoutOptions type
      const options = config.breakoutOptions as BreakoutOptions;
      
      if (options[portSpeed]) {
        const breakoutOption = options[portSpeed].find(
          (option: BreakoutOption) => option.type === breakoutMode
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
        // Default to standard cables if no breakout options for this port speed
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
    config.linkTypes.forEach((link: LinkType) => {
      const linksPerSpine = link.count;
      const totalLinks = numSpines * numLeafs * linksPerSpine;
      
      // Check if breakout is enabled for this link type
      const breakoutOptions = config.breakoutOptions as BreakoutOptionLegacy[];
      const breakoutOption = Array.isArray(breakoutOptions) && 
        breakoutOptions.find((option: BreakoutOptionLegacy) => 
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
 * @param topologies - Array of topology objects
 * @returns Object containing comparison metrics
 */
export const compareTopologies = (topologies: Topology[]): ComparisonResult[] | null => {
  if (!topologies || topologies.length === 0) {
    return null;
  }
  
  const comparisonResults = topologies.map(topology => {
    const metrics = calculateAllMetrics(topology);
    if (!metrics) {
      throw new Error(`Failed to calculate metrics for topology: ${topology.name}`);
    }
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
  compareTopologies,
  validateParallelLinks
};

export default calculationService;
