import React, { useEffect, useState } from 'react';
import { useTopology } from '../../context/TopologyContext';
import { compareTopologies } from '../../services/CalculationService';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Radar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement
);

const TopologyComparison = () => {
  const { topologies, comparisonTopologies, toggleComparisonTopology } = useTopology();
  const [selectedTopologies, setSelectedTopologies] = useState([]);
  const [comparisonResults, setComparisonResults] = useState(null);
  const [comparisonMetric, setComparisonMetric] = useState('cost');

  // Load selected topologies when comparisonTopologies changes
  useEffect(() => {
    const selected = topologies.filter(topology => 
      comparisonTopologies.includes(topology.id)
    );
    setSelectedTopologies(selected);
    
    if (selected.length > 0) {
      const results = compareTopologies(selected);
      setComparisonResults(results);
    } else {
      setComparisonResults(null);
    }
  }, [topologies, comparisonTopologies]);

  // Handle topology selection change
  const handleTopologySelectionChange = (event) => {
    const selectedIds = event.target.value;
    
    // Update the comparison topologies
    comparisonTopologies.forEach(id => {
      if (!selectedIds.includes(id)) {
        toggleComparisonTopology(id);
      }
    });
    
    selectedIds.forEach(id => {
      if (!comparisonTopologies.includes(id)) {
        toggleComparisonTopology(id);
      }
    });
  };

  // Handle comparison metric change
  const handleMetricChange = (event) => {
    setComparisonMetric(event.target.value);
  };

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

  // Get colors for charts
  const getChartColors = (index) => {
    const colors = [
      { bg: 'rgba(54, 162, 235, 0.2)', border: 'rgba(54, 162, 235, 1)' },
      { bg: 'rgba(255, 99, 132, 0.2)', border: 'rgba(255, 99, 132, 1)' },
      { bg: 'rgba(75, 192, 192, 0.2)', border: 'rgba(75, 192, 192, 1)' },
      { bg: 'rgba(255, 159, 64, 0.2)', border: 'rgba(255, 159, 64, 1)' },
      { bg: 'rgba(153, 102, 255, 0.2)', border: 'rgba(153, 102, 255, 1)' }
    ];
    
    return colors[index % colors.length];
  };

  // Prepare radar chart data
  const prepareRadarData = () => {
    if (!comparisonResults) return null;
    
    return {
      labels: [
        'Cost Efficiency',
        'Power Efficiency',
        'Latency',
        'Oversubscription',
        'Rack Space',
        'Cabling Complexity'
      ],
      datasets: comparisonResults.map((result, index) => {
        const colors = getChartColors(index);
        return {
          label: result.name,
          data: [
            // Normalize metrics to a 0-100 scale for radar chart
            // Lower is better for cost, so invert the scale
            100 - Math.min(100, (result.metrics.cost.total / 1000000) * 20),
            // Lower is better for power, so invert the scale
            100 - Math.min(100, (result.metrics.power.total / 10000) * 20),
            // Lower is better for latency, so invert the scale
            100 - Math.min(100, result.metrics.latency.total * 20),
            // Lower is better for oversubscription, so invert the scale
            100 - Math.min(100, parseFloat(result.metrics.oversubscription.ratio) * 25),
            // Lower is better for rack space, so invert the scale
            100 - Math.min(100, result.metrics.rackSpace.totalRackUnits / 2),
            // Lower is better for cabling, so invert the scale
            100 - Math.min(100, result.metrics.cabling.total / 10)
          ],
          backgroundColor: colors.bg,
          borderColor: colors.border,
          borderWidth: 2,
          pointBackgroundColor: colors.border,
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: colors.border
        };
      })
    };
  };

  // Prepare bar chart data for the selected metric
  const prepareBarData = () => {
    if (!comparisonResults) return null;
    
    let labels = [];
    let datasets = [];
    
    switch (comparisonMetric) {
      case 'cost':
        labels = comparisonResults.map(result => result.name);
        datasets = [
          {
            label: 'Spine Switches',
            data: comparisonResults.map(result => result.metrics.cost.switches.spine),
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          },
          {
            label: 'Leaf Switches',
            data: comparisonResults.map(result => result.metrics.cost.switches.leaf),
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          },
          {
            label: 'Optics',
            data: comparisonResults.map(result => result.metrics.cost.optics),
            backgroundColor: 'rgba(255, 159, 64, 0.6)',
            borderColor: 'rgba(255, 159, 64, 1)',
            borderWidth: 1
          }
        ];
        break;
        
      case 'power':
        labels = comparisonResults.map(result => result.name);
        datasets = [
          {
            label: 'Spine Switches',
            data: comparisonResults.map(result => result.metrics.power.switches.spine),
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          },
          {
            label: 'Leaf Switches',
            data: comparisonResults.map(result => result.metrics.power.switches.leaf),
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          },
          {
            label: 'Optics',
            data: comparisonResults.map(result => result.metrics.power.optics),
            backgroundColor: 'rgba(255, 159, 64, 0.6)',
            borderColor: 'rgba(255, 159, 64, 1)',
            borderWidth: 1
          }
        ];
        break;
        
      case 'devices':
        labels = comparisonResults.map(result => result.name);
        datasets = [
          {
            label: 'Spine Switches',
            data: comparisonResults.map(result => result.metrics.deviceCount.spines),
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          },
          {
            label: 'Leaf Switches',
            data: comparisonResults.map(result => result.metrics.deviceCount.leafs),
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          }
        ];
        break;
        
      case 'oversubscription':
        labels = comparisonResults.map(result => result.name);
        datasets = [
          {
            label: 'Oversubscription Ratio',
            data: comparisonResults.map(result => parseFloat(result.metrics.oversubscription.ratio)),
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }
        ];
        break;
        
      case 'latency':
        labels = comparisonResults.map(result => result.name);
        datasets = [
          {
            label: 'Total Latency (μs)',
            data: comparisonResults.map(result => result.metrics.latency.total),
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }
        ];
        break;
        
      case 'rackspace':
        labels = comparisonResults.map(result => result.name);
        datasets = [
          {
            label: 'Total Rack Units',
            data: comparisonResults.map(result => result.metrics.rackSpace.totalRackUnits),
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }
        ];
        break;
        
      case 'cabling':
        labels = comparisonResults.map(result => result.name);
        datasets = [
          {
            label: 'Standard Cables',
            data: comparisonResults.map(result => result.metrics.cabling.standard),
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          },
          {
            label: 'Breakout Cables',
            data: comparisonResults.map(result => result.metrics.cabling.breakout),
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          }
        ];
        break;
        
      default:
        break;
    }
    
    return { labels, datasets };
  };

  // Prepare comparison table data
  const prepareTableData = () => {
    if (!comparisonResults) return null;
    
    return {
      headers: ['Metric', ...comparisonResults.map(result => result.name)],
      rows: [
        {
          name: 'Total Cost',
          values: comparisonResults.map(result => formatCurrency(result.metrics.cost.total))
        },
        {
          name: 'Switch Cost',
          values: comparisonResults.map(result => formatCurrency(result.metrics.cost.switches.total))
        },
        {
          name: 'Optics Cost',
          values: comparisonResults.map(result => formatCurrency(result.metrics.cost.optics))
        },
        {
          name: 'Total Power',
          values: comparisonResults.map(result => formatPower(result.metrics.power.total))
        },
        {
          name: 'Switch Power',
          values: comparisonResults.map(result => formatPower(result.metrics.power.switches.total))
        },
        {
          name: 'Optics Power',
          values: comparisonResults.map(result => formatPower(result.metrics.power.optics))
        },
        {
          name: 'Total Devices',
          values: comparisonResults.map(result => formatNumber(result.metrics.deviceCount.total))
        },
        {
          name: 'Spine Switches',
          values: comparisonResults.map(result => formatNumber(result.metrics.deviceCount.spines))
        },
        {
          name: 'Leaf Switches',
          values: comparisonResults.map(result => formatNumber(result.metrics.deviceCount.leafs))
        },
        {
          name: 'Oversubscription',
          values: comparisonResults.map(result => `${result.metrics.oversubscription.ratio}:1`)
        },
        {
          name: 'Latency',
          values: comparisonResults.map(result => `${result.metrics.latency.total.toFixed(2)} μs`)
        },
        {
          name: 'Rack Space',
          values: comparisonResults.map(result => `${result.metrics.rackSpace.totalRackUnits} U`)
        },
        {
          name: 'Total Cables',
          values: comparisonResults.map(result => formatNumber(result.metrics.cabling.total))
        }
      ]
    };
  };

  const radarData = prepareRadarData();
  const barData = prepareBarData();
  const tableData = prepareTableData();

  return (
    <Box>
      <Card sx={{ mb: 4 }}>
        <CardHeader title="Topology Comparison" />
        <Divider />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="topology-select-label">Select Topologies to Compare</InputLabel>
                <Select
                  labelId="topology-select-label"
                  id="topology-select"
                  multiple
                  value={comparisonTopologies}
                  onChange={handleTopologySelectionChange}
                  input={<OutlinedInput label="Select Topologies to Compare" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((id) => {
                        const topology = topologies.find(t => t.id === id);
                        return (
                          <Chip key={id} label={topology ? topology.name : id} />
                        );
                      })}
                    </Box>
                  )}
                >
                  {topologies.map((topology) => (
                    <MenuItem key={topology.id} value={topology.id}>
                      <Checkbox checked={comparisonTopologies.indexOf(topology.id) > -1} />
                      <ListItemText primary={topology.name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="metric-select-label">Comparison Metric</InputLabel>
                <Select
                  labelId="metric-select-label"
                  id="metric-select"
                  value={comparisonMetric}
                  onChange={handleMetricChange}
                  label="Comparison Metric"
                >
                  <MenuItem value="cost">Cost</MenuItem>
                  <MenuItem value="power">Power Usage</MenuItem>
                  <MenuItem value="devices">Device Count</MenuItem>
                  <MenuItem value="oversubscription">Oversubscription</MenuItem>
                  <MenuItem value="latency">Latency</MenuItem>
                  <MenuItem value="rackspace">Rack Space</MenuItem>
                  <MenuItem value="cabling">Cabling</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {comparisonResults && comparisonResults.length > 0 ? (
              <>
                {/* Radar chart for overall comparison */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Overall Comparison
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
                
                {/* Bar chart for selected metric */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    {comparisonMetric.charAt(0).toUpperCase() + comparisonMetric.slice(1)} Comparison
                  </Typography>
                  <Box sx={{ height: 400 }}>
                    <Bar 
                      data={barData} 
                      options={{
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.raw || 0;
                                
                                if (comparisonMetric === 'cost') {
                                  return `${label}: ${formatCurrency(value)}`;
                                } else if (comparisonMetric === 'power') {
                                  return `${label}: ${formatPower(value)}`;
                                } else {
                                  return `${label}: ${formatNumber(value)}`;
                                }
                              }
                            }
                          }
                        },
                        responsive: true,
                        scales: {
                          x: {
                            stacked: false,
                          },
                          y: {
                            stacked: false,
                            beginAtZero: true
                          }
                        },
                        maintainAspectRatio: false
                      }}
                    />
                  </Box>
                </Grid>
                
                {/* Comparison table */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Detailed Comparison
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          {tableData.headers.map((header, index) => (
                            <TableCell key={index} align={index === 0 ? 'left' : 'right'}>
                              <Typography variant="subtitle2">{header}</Typography>
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {tableData.rows.map((row, rowIndex) => (
                          <TableRow key={rowIndex}>
                            <TableCell>
                              <Typography variant="body2">{row.name}</Typography>
                            </TableCell>
                            {row.values.map((value, valueIndex) => (
                              <TableCell key={valueIndex} align="right">
                                <Typography variant="body2">{value}</Typography>
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </>
            ) : (
              <Grid item xs={12}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body1">
                    Select at least one topology to compare.
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TopologyComparison;
