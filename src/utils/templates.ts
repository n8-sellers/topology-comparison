/**
 * templates.ts
 * 
 * This file contains pre-defined topology templates for common data center network designs.
 * These templates can be used as starting points for creating new topologies.
 */

import { Topology } from '../types/topology';

// Base template with common properties
const baseTemplate: Topology = {
  id: '',
  createdAt: '',
  updatedAt: '',
  name: '',
  description: '',
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
      downlinkSpeed: '100G',
      breakoutMode: '1x100G'  // Default to no breakout
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

// Template for a small leaf-spine topology (2 spines, 4 leafs)
const smallLeafSpine = {
  ...baseTemplate,
  name: 'Small Leaf-Spine',
  description: 'A small leaf-spine topology with 2 spine switches and 4 leaf switches, suitable for small data centers or POCs.',
  configuration: {
    ...baseTemplate.configuration,
    numSpines: 2,
    numLeafs: 4,
    numTiers: 1,
    spineConfig: {
      portCount: 64,
      portSpeed: '400G',
      breakoutMode: '1x400G'
    },
    leafConfig: {
      portCount: 48,
      downlinkSpeed: '25G',
      breakoutMode: '1x25G'  // Default to no breakout
    }
  }
};

// Template for a medium leaf-spine topology (4 spines, 16 leafs)
const mediumLeafSpine = {
  ...baseTemplate,
  name: 'Medium Leaf-Spine',
  description: 'A medium-sized leaf-spine topology with 4 spine switches and 16 leaf switches, suitable for medium-sized data centers.',
  configuration: {
    ...baseTemplate.configuration,
    numSpines: 4,
    numLeafs: 16,
    numTiers: 1,
    spineConfig: {
      portCount: 64,
      portSpeed: '400G',
      breakoutMode: '1x400G'
    },
    leafConfig: {
      portCount: 48,
      downlinkSpeed: '100G',
      breakoutMode: '1x100G'  // Default to no breakout
    }
  }
};

// Template for a large leaf-spine topology (8 spines, 64 leafs)
const largeLeafSpine = {
  ...baseTemplate,
  name: 'Large Leaf-Spine',
  description: 'A large leaf-spine topology with 8 spine switches and 64 leaf switches, suitable for large data centers.',
  configuration: {
    ...baseTemplate.configuration,
    numSpines: 8,
    numLeafs: 64,
    numTiers: 1,
    spineConfig: {
      portCount: 64,
      portSpeed: '800G',
      breakoutMode: '1x800G'
    },
    leafConfig: {
      portCount: 64,
      downlinkSpeed: '100G',
      breakoutMode: '1x100G'  // Default to no breakout
    }
  }
};

// Template for a 3-tier topology (super-spine, spine, leaf)
const threeTierClos = {
  ...baseTemplate,
  name: '3-Tier Clos',
  description: 'A 3-tier Clos topology with super-spine, spine, and leaf layers, suitable for very large data centers.',
  configuration: {
    ...baseTemplate.configuration,
    numSpines: 8,
    numLeafs: 32,
    numTiers: 3,
    spineConfig: {
      portCount: 64,
      portSpeed: '800G',
      breakoutMode: '1x800G'
    },
    leafConfig: {
      portCount: 64,
      downlinkSpeed: '100G',
      breakoutMode: '1x100G'  // Default to no breakout
    }
  }
};

// Template for a high-density topology with breakout cables
const highDensityBreakout = {
  ...baseTemplate,
  name: 'High-Density Breakout',
  description: 'A high-density topology using breakout cables to maximize port utilization.',
  configuration: {
    ...baseTemplate.configuration,
    numSpines: 4,
    numLeafs: 32,
    numTiers: 1,
    spineConfig: {
      portCount: 64,
      portSpeed: '800G',
      breakoutMode: '4x200G'
    },
    leafConfig: {
      portCount: 48,
      downlinkSpeed: '100G',
      breakoutMode: '1x100G'  // Default to no breakout
    }
  }
};

// Template for a disjointed spine topology (multiple fabrics)
const disjointedSpines = {
  ...baseTemplate,
  name: 'Disjointed Spines',
  description: 'A topology with disjointed spine switches forming multiple independent fabrics.',
  configuration: {
    ...baseTemplate.configuration,
    numSpines: 4,
    numLeafs: 16,
    numTiers: 1,
    disjointedSpines: true,
    spineConfig: {
      portCount: 64,
      portSpeed: '400G',
      breakoutMode: '1x400G'
    },
    leafConfig: {
      portCount: 48,
      downlinkSpeed: '100G',
      breakoutMode: '1x100G'  // Default to no breakout
    }
  }
};

// Template for a rail-optimized topology
const railOptimized = {
  ...baseTemplate,
  name: 'Rail-Optimized',
  description: 'A rail-optimized topology designed for efficient cabling and power distribution.',
  configuration: {
    ...baseTemplate.configuration,
    numSpines: 4,
    numLeafs: 24,
    numTiers: 1,
    railOptimized: true,
    spineConfig: {
      portCount: 64,
      portSpeed: '400G',
      breakoutMode: '1x400G'
    },
    leafConfig: {
      portCount: 48,
      downlinkSpeed: '100G',
      breakoutMode: '1x100G'  // Default to no breakout
    }
  }
};

// Export all templates
export const templates: Topology[] = [
  smallLeafSpine,
  mediumLeafSpine,
  largeLeafSpine,
  threeTierClos,
  highDensityBreakout,
  disjointedSpines,
  railOptimized
];

// Function to get a template by name
export const getTemplateByName = (name: string): Topology | undefined => {
  return templates.find(template => template.name === name);
};

// Function to apply a template to a topology
export const applyTemplate = (topology: Topology, templateName: string): Topology => {
  const template = getTemplateByName(templateName);
  if (!template) return topology;

  return {
    ...topology,
    name: template.name,
    description: template.description,
    // Deep clone configuration to avoid mutating the template object
    configuration: JSON.parse(JSON.stringify(template.configuration))
  };
};

export default templates;
