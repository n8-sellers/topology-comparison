import React, { useEffect, useState, useRef } from 'react';
import { useTopology } from '../../context/TopologyContext';
import { calculateAllMetrics } from '../../services/CalculationService';
import { getDeviceById } from '../../data/deviceCatalog';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  Typography,
  Paper,
  Tooltip,
  Zoom,
  Fade,
  Skeleton
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  ChartOptions,
  ChartData
} from 'chart.js';
import { Bar, Doughnut, Radar } from 'react-chartjs-2';
import { TopologyMetrics as TopologyMetricsType } from '../../types/metrics';
import { Topology, BreakoutOption } from '../../types/topology';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement
);

// Types for ChartJS references
type ChartRef = any; // Using any for now to avoid complex Chart.js type issues
type ChartRefs = {
  [key: string]: ChartRef;
};

// Types for chart data
type BarChartData = ChartData<'bar', number[], string>;
type DoughnutChartData = ChartData<'doughnut', number[], string>;
type RadarChartData = ChartData<'radar', number[], string>;

const TopologyMetrics: React.FC = () => {
  const { currentTopology } = useTopology();
  const [metrics, setMetrics] = useState<TopologyMetricsType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const chartRefs = useRef<ChartRefs>({});

  useEffect(() => {
    if (currentTopology) {
      setLoading(true);
      // Simulate a short loading delay to show animations
      setTimeout(() => {
        const calculatedMetrics = calculateAllMetrics(currentTopology);
        setMetrics(calculatedMetrics);
        setLoading(false);
      }, 500);
    } else {
      setMetrics(null);
      setLoading(false);
    }
  }, [currentTopology]);

  // Register chart references
  const registerChartRef = (chartName: string, ref: ChartRef): void => {
    if (ref) {
      chartRefs.current[chartName] = ref;
    }
  };

  if (!currentTopology) {
    return (
      <Card>
        <CardContent>
          <Typography variant="body1">
            Select or create a topology to view metrics.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card sx={{ mb: 4 }}>
        <CardHeader 
          title={<Skeleton width="60%" />}
          subheader={<Skeleton width="40%" />}
        />
        <Divider />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                <Skeleton width="30%" />
              </Typography>
              <Grid container spacing={2}>
                {[...Array(4)].map((_, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Skeleton variant="rectangular" height={120} />
                  </Grid>
                ))}
              </Grid>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                <Skeleton width="40%" />
              </Typography>
              <Skeleton variant="rectangular" height={400} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                <Skeleton width="35%" />
              </Typography>
              <Skeleton variant="rectangular" height={400} />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent>
          <Typography variant="body1">
            Error calculating metrics. Please try again.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Format number with commas
  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('en-US').format(value);
  };
  
  // Format power values (watts to kilowatts when appropriate)
  const formatPower = (watts: number): string => {
    if (watts < 1000) {
      return `${formatNumber(watts)} W`;
    } else {
      return `${(watts / 1000).toFixed(2)} kW`;
    }
  };

  // Device count chart data
  const deviceCountData: BarChartData = {
    labels: ['Spine Switches', 'Leaf Switches'],
    datasets: [
      {
        label: 'Number of Devices',
        data: [metrics.deviceCount.spines, metrics.deviceCount.leafs],
        backgroundColor: ['rgba(54, 162, 235, 0.6)', 'rgba(75, 192, 192, 0.6)'],
        borderColor: ['rgba(54, 162, 235, 1)', 'rgba(75, 192, 192, 1)'],
        borderWidth: 1
      }
    ]
  };

  // Cost breakdown chart data
  const costData: DoughnutChartData = {
    labels: ['Spine Switches', 'Leaf Switches', 'Optics'],
    datasets: [
      {
        label: 'Cost Breakdown',
        data: [
          metrics.cost.switches.spine,
          metrics.cost.switches.leaf,
          metrics.cost.optics
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 159, 64, 0.6)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 159, 64, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  // Power usage chart data
  const powerData: DoughnutChartData = {
    labels: ['Spine Switches', 'Leaf Switches', 'Optics'],
    datasets: [
      {
        label: 'Power Usage (Watts)',
        data: [
          metrics.power.switches.spine,
          metrics.power.switches.leaf,
          metrics.power.optics
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 159, 64, 0.6)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 159, 64, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  // Radar chart data for overall metrics
  const radarData: RadarChartData = {
    labels: [
      'Cost Efficiency',
      'Power Efficiency',
      'Latency',
      'Rack Space',
      'Cabling Complexity'
    ],
    datasets: [
      {
        label: currentTopology.name,
        data: [
          // Normalize metrics to a 0-100 scale for radar chart
          // Lower is better for cost, so invert the scale
          100 - Math.min(100, (metrics.cost.total / 1000000) * 20),
          // Lower is better for power, so invert the scale
          100 - Math.min(100, (metrics.power.total / 10000) * 20),
          // Lower is better for latency, so invert the scale
          100 - Math.min(100, metrics.latency.total * 20),
          // Lower is better for rack space, so invert the scale
          100 - Math.min(100, metrics.rackSpace.totalRackUnits / 2),
          // Lower is better for cabling, so invert the scale
          100 - Math.min(100, metrics.cabling.total / 10)
        ],
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(54, 162, 235, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(54, 162, 235, 1)'
      }
    ]
  };

  // Chart.js options types
  interface RadarChartOptions extends ChartOptions<'radar'> {
    scales: {
      r: {
        min: number;
        max: number;
        ticks: {
          stepSize: number;
        };
        pointLabels: {
          font: {
            size: number;
          };
        };
      };
    };
  }

  interface BarChartOptions extends ChartOptions<'bar'> {
    scales: {
      y: {
        beginAtZero: boolean;
      };
    };
  }

  const radarOptions: RadarChartOptions = {
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20
        },
        pointLabels: {
          font: {
            size: 12
          }
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          title: function(context) {
            return context[0].label;
          },
          label: function(context) {
            let label = context.dataset.label || '';
            let value = context.raw as number;
            
            // Add explanations based on the metric
            let explanation = '';
            switch(context.label) {
              case 'Cost Efficiency':
                explanation = ` (Lower cost is better)`;
                break;
              case 'Power Efficiency':
                explanation = ` (Lower power usage is better)`;
                break;
              case 'Latency':
                explanation = ` (Lower latency is better)`;
                break;
              case 'Rack Space':
                explanation = ` (Less rack space is better)`;
                break;
              case 'Cabling Complexity':
                explanation = ` (Less cabling is better)`;
                break;
              default:
                break;
            }
            
            return `${label}: ${value.toFixed(1)}%${explanation}`;
          },
          afterLabel: function(context) {
            // Add actual values for each metric
            switch(context.label) {
              case 'Cost Efficiency':
                return `Actual cost: ${formatCurrency(metrics.cost.total)}`;
              case 'Power Efficiency':
                return `Actual power: ${formatPower(metrics.power.total)}`;
              case 'Latency':
                return `Actual latency: ${metrics.latency.total.toFixed(2)} μs`;
              case 'Rack Space':
                return `Actual space: ${metrics.rackSpace.totalRackUnits} U`;
              case 'Cabling Complexity':
                return `Actual cables: ${metrics.cabling.total}`;
              default:
                return '';
            }
          }
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        padding: 12,
        cornerRadius: 6
      }
    },
    maintainAspectRatio: false,
    animation: {
      duration: 1500,
      easing: 'easeOutQuart'
    }
  };

  const barOptions: BarChartOptions = {
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          title: function(context) {
            return context[0].label;
          },
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.raw as number;
            
            if (context.label === 'Spine Switches') {
              return `${label}: ${value} (${(value / metrics.deviceCount.total * 100).toFixed(1)}% of total)`;
            } else {
              return `${label}: ${value} (${(value / metrics.deviceCount.total * 100).toFixed(1)}% of total)`;
            }
          },
          afterLabel: function(context) {
            if (context.label === 'Spine Switches') {
              const cost = metrics.cost.switches.spine;
              const costPerDevice = metrics.deviceCount.spines > 0 ? cost / metrics.deviceCount.spines : 0;
              return `Cost: ${formatCurrency(cost)} (${formatCurrency(costPerDevice)} per device)`;
            } else {
              const cost = metrics.cost.switches.leaf;
              const costPerDevice = metrics.deviceCount.leafs > 0 ? cost / metrics.deviceCount.leafs : 0;
              return `Cost: ${formatCurrency(cost)} (${formatCurrency(costPerDevice)} per device)`;
            }
          }
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 6
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    },
    maintainAspectRatio: false,
    animation: {
      duration: 1500,
      easing: 'easeOutQuart'
    }
  };

  const doughnutOptions: ChartOptions<'doughnut'> = {
    plugins: {
      legend: {
        position: 'right'
      },
      tooltip: {
        callbacks: {
          title: function(context) {
            return 'Cost Breakdown';
          },
          label: function(context) {
            const label = context.label || '';
            const value = context.raw as number;
            const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
          },
          afterLabel: function(context) {
            if (context.label === 'Spine Switches') {
              return `${metrics.deviceCount.spines} devices at ${formatCurrency(metrics.deviceCount.spines > 0 ? (context.raw as number) / metrics.deviceCount.spines : 0)} each`;
            } else if (context.label === 'Leaf Switches') {
              return `${metrics.deviceCount.leafs} devices at ${formatCurrency(metrics.deviceCount.leafs > 0 ? (context.raw as number) / metrics.deviceCount.leafs : 0)} each`;
            } else if (context.label === 'Optics') {
              const totalPorts = metrics.cabling.total;
              return `${totalPorts} optics at ${formatCurrency(totalPorts > 0 ? (context.raw as number) / totalPorts : 0)} each`;
            }
            return '';
          }
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 6
      }
    },
    maintainAspectRatio: false,
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1500,
      easing: 'easeOutQuart'
    }
  };

  const powerChartOptions: ChartOptions<'doughnut'> = {
    plugins: {
      legend: {
        position: 'right'
      },
      tooltip: {
        callbacks: {
          title: function(context) {
            return 'Power Usage Breakdown';
          },
          label: function(context) {
            const label = context.label || '';
            const value = context.raw as number;
            const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${formatPower(value)} (${percentage}%)`;
          },
          afterLabel: function(context) {
            // Calculate annual energy cost (assuming $0.12 per kWh)
            const rawValue = context.raw as number;
            const annualCost = (rawValue * 24 * 365 * 0.12 / 1000);
            return `Annual cost: ${formatCurrency(annualCost)}`;
          }
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 6
      }
    },
    maintainAspectRatio: false,
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1500,
      easing: 'easeOutQuart'
    }
  };

  // Helper function to get max leaf switches based on spine configuration
  const getMaxLeafSwitches = (): string => {
    // Ensure spineConfig exists
    if (!currentTopology.configuration.spineConfig) {
      return 'Max Leaf Switches: N/A (Invalid spine configuration)';
    }
    
    const { portCount, portSpeed, breakoutMode } = currentTopology.configuration.spineConfig;
    
    // Ensure breakoutOptions exists and has the right structure
    if (!currentTopology.configuration.breakoutOptions || 
        typeof currentTopology.configuration.breakoutOptions !== 'object') {
      return `Max Leaf Switches: N/A (No breakout options for ${portSpeed})`;
    }
    
    // Add type guard for breakoutOptions type
    const breakoutOpts = currentTopology.configuration.breakoutOptions;
    
    // Check if it's the modern BreakoutOptions type (object with string keys)
    if (!Array.isArray(breakoutOpts) && typeof breakoutOpts === 'object') {
      const options = breakoutOpts[portSpeed];
      if (!options) {
        return `Max Leaf Switches: N/A (No breakout options for ${portSpeed})`;
      }
      
      const breakoutOption = options.find(
        (option: BreakoutOption) => option.type === breakoutMode
      );
      
      if (!breakoutOption) {
        return `Max Leaf Switches: N/A (Invalid breakout mode: ${breakoutMode})`;
      }
      
      const breakoutFactor = breakoutOption.factor;
      const maxLeafSwitches = portCount * breakoutFactor;
      
      return `Max Leaf Switches: ${maxLeafSwitches}`;
    }
    
    // For legacy breakout options (array of objects)
    return `Max Leaf Switches: ${portCount} (using legacy configuration)`;
  };

  return (
    <Box>
      <Card sx={{ mb: 4 }}>
        <CardHeader 
          title={`Metrics for ${currentTopology.name}`} 
          subheader={currentTopology.description || 'No description provided'}
        />
        <Divider />
        <CardContent>
          <Grid container spacing={3}>
            {/* Summary metrics */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Zoom in={!loading} style={{ transitionDelay: '100ms' }}>
                    <Tooltip 
                      title={
                        <React.Fragment>
                          <Typography color="inherit" variant="subtitle2">Device Breakdown</Typography>
                          <Typography variant="body2">Spine Switches: {metrics.deviceCount.spines}</Typography>
                          <Typography variant="body2">Leaf Switches: {metrics.deviceCount.leafs}</Typography>
                          <Typography variant="body2">Device Ratio: {(metrics.deviceCount.leafs / metrics.deviceCount.spines).toFixed(2)} leaf per spine</Typography>
                        </React.Fragment>
                      } 
                      arrow 
                      placement="top"
                    >
                      <Paper 
                        elevation={2} 
                        sx={{ 
                          p: 2, 
                          height: '100%', 
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: 4
                          }
                        }}
                      >
                        <Typography variant="subtitle2" color="textSecondary">
                          Total Devices
                        </Typography>
                        <Typography variant="h4">
                          {formatNumber(metrics.deviceCount.total)}
                        </Typography>
                        <Typography variant="body2">
                          {metrics.deviceCount.spines} spine, {metrics.deviceCount.leafs} leaf
                        </Typography>
                      </Paper>
                    </Tooltip>
                  </Zoom>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Zoom in={!loading} style={{ transitionDelay: '200ms' }}>
                    <Tooltip 
                      title={
                        <React.Fragment>
                          <Typography color="inherit" variant="subtitle2">Cost Breakdown</Typography>
                          <Typography variant="body2">Spine Switches: {formatCurrency(metrics.cost.switches.spine)}</Typography>
                          <Typography variant="body2">Leaf Switches: {formatCurrency(metrics.cost.switches.leaf)}</Typography>
                          <Typography variant="body2">Optics: {formatCurrency(metrics.cost.optics)}</Typography>
                          <Typography variant="body2">Per Port Cost: {formatCurrency(metrics.cost.total / (metrics.deviceCount.total || 1))}</Typography>
                        </React.Fragment>
                      } 
                      arrow 
                      placement="top"
                    >
                      <Paper 
                        elevation={2} 
                        sx={{ 
                          p: 2, 
                          height: '100%', 
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: 4
                          }
                        }}
                      >
                        <Typography variant="subtitle2" color="textSecondary">
                          Total Cost
                        </Typography>
                        <Typography variant="h4">
                          {formatCurrency(metrics.cost.total)}
                        </Typography>
                        <Typography variant="body2">
                          Switches: {formatCurrency(metrics.cost.switches.total)}
                        </Typography>
                        <Typography variant="body2">
                          Optics: {formatCurrency(metrics.cost.optics)}
                        </Typography>
                      </Paper>
                    </Tooltip>
                  </Zoom>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Zoom in={!loading} style={{ transitionDelay: '300ms' }}>
                    <Tooltip 
                      title={
                        <React.Fragment>
                          <Typography color="inherit" variant="subtitle2">Power Breakdown</Typography>
                          <Typography variant="body2">Spine Switches: {formatPower(metrics.power.switches.spine)}</Typography>
                          <Typography variant="body2">Leaf Switches: {formatPower(metrics.power.switches.leaf)}</Typography>
                          <Typography variant="body2">Optics: {formatPower(metrics.power.optics)}</Typography>
                          <Typography variant="body2">Annual Energy Cost: {formatCurrency(metrics.power.total * 24 * 365 * 0.12 / 1000)}</Typography>
                        </React.Fragment>
                      } 
                      arrow 
                      placement="top"
                    >
                      <Paper 
                        elevation={2} 
                        sx={{ 
                          p: 2, 
                          height: '100%', 
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: 4
                          }
                        }}
                      >
                        <Typography variant="subtitle2" color="textSecondary">
                          Power Usage
                        </Typography>
                        <Typography variant="h4">
                          {formatPower(metrics.power.total)}
                        </Typography>
                        <Typography variant="body2">
                          Switches: {formatPower(metrics.power.switches.total)}
                        </Typography>
                        <Typography variant="body2">
                          Optics: {formatPower(metrics.power.optics)}
                        </Typography>
                      </Paper>
                    </Tooltip>
                  </Zoom>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  {/* Oversubscription ratio card removed */}
                </Grid>
                {currentTopology.configuration.deviceSelection?.spine?.deviceId ? (
                  <Grid item xs={12} sm={6} md={4}>
                    <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Spine Switch
                      </Typography>
                      {(() => {
                        const spineDevice = getDeviceById(
                          'spine', 
                          currentTopology.configuration.deviceSelection?.spine?.deviceId || ''
                        );
                        if (!spineDevice) {
                          return (
                            <Typography variant="body2" color="error">
                              Device information not available
                            </Typography>
                          );
                        }
                        
                        return (
                          <>
                            <Typography variant="body2">
                              <strong>Model:</strong> {spineDevice.manufacturer} {spineDevice.model}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Port Count:</strong> {currentTopology.configuration.spineConfig?.portCount}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Port Speed:</strong> {currentTopology.configuration.spineConfig?.portSpeed}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Breakout Mode:</strong> {currentTopology.configuration.spineConfig?.breakoutMode}
                            </Typography>
                          </>
                        );
                      })()}
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {getMaxLeafSwitches()}
                      </Typography>
                    </Paper>
                  </Grid>
                ) : currentTopology.configuration.spineConfig ? (
                  <Grid item xs={12} sm={6} md={4}>
                    <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Spine Configuration
                      </Typography>
                      <Typography variant="body2">
                        <strong>Port Count:</strong> {currentTopology.configuration.spineConfig.portCount}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Port Speed:</strong> {currentTopology.configuration.spineConfig.portSpeed}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Breakout Mode:</strong> {currentTopology.configuration.spineConfig.breakoutMode}
                      </Typography>
                    </Paper>
                  </Grid>
                ) : null}
                
                {currentTopology.configuration.deviceSelection?.leaf?.deviceId ? (
                  <Grid item xs={12} sm={6} md={4}>
                    <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Leaf Switch
                      </Typography>
                      {(() => {
                        const leafDevice = getDeviceById(
                          'leaf', 
                          currentTopology.configuration.deviceSelection?.leaf?.deviceId || ''
                        );
                        if (!leafDevice) {
                          return (
                            <Typography variant="body2" color="error">
                              Device information not available
                            </Typography>
                          );
                        }
                        
                        return (
                          <>
                            <Typography variant="body2">
                              <strong>Model:</strong> {leafDevice.manufacturer} {leafDevice.model}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Port Count:</strong> {currentTopology.configuration.leafConfig?.portCount || 'N/A'}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Downlink Speed:</strong> {currentTopology.configuration.leafConfig?.downlinkSpeed || 'N/A'}
                            </Typography>
                          </>
                        );
                      })()}
                    </Paper>
                  </Grid>
                ) : currentTopology.configuration.leafConfig ? (
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Leaf Configuration
                      </Typography>
                      <Typography variant="body2">
                        <strong>Port Count:</strong> {currentTopology.configuration.leafConfig.portCount}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Downlink Speed:</strong> {currentTopology.configuration.leafConfig.downlinkSpeed}
                      </Typography>
                    </Paper>
                  </Grid>
                ) : null}
              </Grid>
            </Grid>

            {/* Radar chart for overall metrics */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Overall Performance
              </Typography>
              <Fade in={!loading} timeout={1000}>
                <Box sx={{ height: 400 }}>
                  <Radar 
                    ref={(ref) => registerChartRef('radar', ref)}
                    data={radarData} 
                    options={radarOptions}
                  />
                </Box>
              </Fade>
            </Grid>

            {/* Device count chart */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Device Count
              </Typography>
              <Fade in={!loading} timeout={1000} style={{ transitionDelay: '200ms' }}>
                <Box sx={{ height: 400 }}>
                  <Bar 
                    ref={(ref) => registerChartRef('deviceCount', ref)}
                    data={deviceCountData} 
                    options={barOptions}
                  />
                </Box>
              </Fade>
            </Grid>

            {/* Cost breakdown chart */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Cost Breakdown
              </Typography>
              <Fade in={!loading} timeout={1000} style={{ transitionDelay: '300ms' }}>
                <Box sx={{ height: 400 }}>
                  <Doughnut 
                    ref={(ref) => registerChartRef('cost', ref)}
                    data={costData} 
                    options={doughnutOptions}
                  />
                </Box>
              </Fade>
            </Grid>

            {/* Power usage chart */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Power Usage
              </Typography>
              <Fade in={!loading} timeout={1000} style={{ transitionDelay: '400ms' }}>
                <Box sx={{ height: 400 }}>
                  <Doughnut 
                    ref={(ref) => registerChartRef('power', ref)}
                    data={powerData} 
                    options={powerChartOptions}
                  />
                </Box>
              </Fade>
            </Grid>

            {/* Additional metrics */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Additional Metrics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Latency
                    </Typography>
                    <Typography variant="h5">
                      {metrics.latency.total.toFixed(2)} μs
                    </Typography>
                    <Typography variant="body2">
                      Switch Latency: {metrics.latency.switchLatency.toFixed(2)} μs
                    </Typography>
                    <Typography variant="body2">
                      Fiber Latency: {metrics.latency.fiberLatency.toFixed(2)} μs
                    </Typography>
                    <Typography variant="body2">
                      Hops: {metrics.latency.hops}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Rack Space
                    </Typography>
                    <Typography variant="h5">
                      {metrics.rackSpace.totalRackUnits} U
                    </Typography>
                    <Typography variant="body2">
                      Spine: {metrics.rackSpace.spineRackUnits} U
                    </Typography>
                    <Typography variant="body2">
                      Leaf: {metrics.rackSpace.leafRackUnits} U
                    </Typography>
                    <Typography variant="body2">
                      Racks Needed: {metrics.rackSpace.racksNeeded}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Cabling
                    </Typography>
                    <Typography variant="h5">
                      {metrics.cabling.total} cables
                    </Typography>
                    <Typography variant="body2">
                      Standard: {metrics.cabling.standard} cables
                    </Typography>
                    <Typography variant="body2">
                      Breakout: {metrics.cabling.breakout} cables
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TopologyMetrics;
