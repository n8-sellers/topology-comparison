import React, { useEffect, useState } from 'react';
import { useTopology } from '../../context/TopologyContext';
import { calculateAllMetrics } from '../../services/CalculationService';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  Typography,
  Paper
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Doughnut, Radar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement
);

const TopologyMetrics = () => {
  const { currentTopology } = useTopology();
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    if (currentTopology) {
      const calculatedMetrics = calculateAllMetrics(currentTopology);
      setMetrics(calculatedMetrics);
    } else {
      setMetrics(null);
    }
  }, [currentTopology]);

  if (!currentTopology || !metrics) {
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

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Format number with commas
  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value);
  };
  
  // Format power values (watts to kilowatts when appropriate)
  const formatPower = (watts) => {
    if (watts < 1000) {
      return `${formatNumber(watts)} W`;
    } else {
      return `${(watts / 1000).toFixed(2)} kW`;
    }
  };

  // Device count chart data
  const deviceCountData = {
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
  const costData = {
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
  const powerData = {
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
  const radarData = {
    labels: [
      'Cost Efficiency',
      'Power Efficiency',
      'Latency',
      'Oversubscription',
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
          // Lower is better for oversubscription, so invert the scale
          100 - Math.min(100, parseFloat(metrics.oversubscription.ratio) * 25),
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
                  <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
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
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
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
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
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
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Oversubscription Ratio
                    </Typography>
                    <Typography variant="h4">
                      {metrics.oversubscription.ratio}:1
                    </Typography>
                    <Typography variant="body2">
                      Uplink: {formatNumber(metrics.oversubscription.uplinkCapacity)} Gbps
                    </Typography>
                    <Typography variant="body2">
                      Downlink: {formatNumber(metrics.oversubscription.downlinkCapacity)} Gbps
                    </Typography>
                    <Typography variant="body2">
                      Uplink Ports: {metrics.oversubscription.uplinkPortsPerLeaf} per leaf
                    </Typography>
                    <Typography variant="body2">
                      Downlink Ports: {metrics.oversubscription.downlinkPortsPerLeaf} per leaf
                    </Typography>
                  </Paper>
                </Grid>
                {currentTopology.configuration.spineConfig ? (
                  <Grid item xs={12} sm={6} md={3}>
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
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {(() => {
                          // Ensure spineConfig exists
                          if (!currentTopology.configuration.spineConfig) {
                            return 'Max Leaf Switches: N/A (Invalid spine configuration)';
                          }
                          
                          const { portCount, portSpeed, breakoutMode } = currentTopology.configuration.spineConfig;
                          
                          // Ensure breakoutOptions exists and has the right structure
                          if (!currentTopology.configuration.breakoutOptions || 
                              typeof currentTopology.configuration.breakoutOptions !== 'object' || 
                              !currentTopology.configuration.breakoutOptions[portSpeed]) {
                            return `Max Leaf Switches: N/A (No breakout options for ${portSpeed})`;
                          }
                          
                          const breakoutOption = currentTopology.configuration.breakoutOptions[portSpeed].find(
                            option => option.type === breakoutMode
                          );
                          
                          if (!breakoutOption) {
                            return `Max Leaf Switches: N/A (Invalid breakout mode: ${breakoutMode})`;
                          }
                          
                          const breakoutFactor = breakoutOption.factor;
                          const maxLeafSwitches = portCount * breakoutFactor;
                          
                          return `Max Leaf Switches: ${maxLeafSwitches}`;
                        })()}
                      </Typography>
                    </Paper>
                  </Grid>
                ) : currentTopology.configuration.linkTypes ? (
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Link Configuration
                      </Typography>
                      {currentTopology.configuration.linkTypes.map((link, index) => (
                        <Typography key={index} variant="body2">
                          <strong>{link.type}:</strong> {link.count} links per spine
                        </Typography>
                      ))}
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
              <Box sx={{ height: 400 }}>
                <Radar 
                  data={radarData} 
                  options={{
                    scales: {
                      r: {
                        min: 0,
                        max: 100,
                        ticks: {
                          stepSize: 20
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return `${context.dataset.label}: ${context.raw.toFixed(1)}%`;
                          }
                        }
                      }
                    },
                    maintainAspectRatio: false
                  }}
                />
              </Box>
            </Grid>

            {/* Device count chart */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Device Count
              </Typography>
              <Box sx={{ height: 400 }}>
                <Bar 
                  data={deviceCountData} 
                  options={{
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    },
                    maintainAspectRatio: false
                  }}
                />
              </Box>
            </Grid>

            {/* Cost breakdown chart */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Cost Breakdown
              </Typography>
              <Box sx={{ height: 400 }}>
                <Doughnut 
                  data={costData} 
                  options={{
                    plugins: {
                      legend: {
                        position: 'right'
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                          }
                        }
                      }
                    },
                    maintainAspectRatio: false
                  }}
                />
              </Box>
            </Grid>

            {/* Power usage chart */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Power Usage
              </Typography>
              <Box sx={{ height: 400 }}>
                <Doughnut 
                  data={powerData} 
                  options={{
                    plugins: {
                      legend: {
                        position: 'right'
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${formatPower(value)} (${percentage}%)`;
                          }
                        }
                      }
                    },
                    maintainAspectRatio: false
                  }}
                />
              </Box>
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
