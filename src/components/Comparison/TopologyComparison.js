import React, { useEffect, useState, useRef } from 'react';
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
  ListItemText,
  Tooltip,
  Fade,
  Skeleton,
  IconButton
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement
} from 'chart.js';
import InfoIcon from '@mui/icons-material/Info';
import { Bar, Radar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement
);

const TopologyComparison = () => {
  const { topologies, comparisonTopologies, toggleComparisonTopology } = useTopology();
  const [, setSelectedTopologies] = useState([]);
  const [comparisonResults, setComparisonResults] = useState(null);
  const [comparisonMetric, setComparisonMetric] = useState('cost');
  const [loading, setLoading] = useState(true);
  const chartRefs = useRef({});

  // Register chart references
  const registerChartRef = (chartName, ref) => {
    chartRefs.current[chartName] = ref;
  };

  // Load selected topologies when comparisonTopologies changes
  useEffect(() => {
    setLoading(true);
    const selected = topologies.filter(topology => 
      comparisonTopologies.includes(topology.id)
    );
    setSelectedTopologies(selected);
    
    // Add a slight delay to show loading animations
    setTimeout(() => {
      if (selected.length > 0) {
        const results = compareTopologies(selected);
        setComparisonResults(results);
      } else {
        setComparisonResults(null);
      }
      setLoading(false);
    }, 600);
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
            
            {loading ? (
              <>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    <Skeleton width="50%" />
                  </Typography>
                  <Skeleton variant="rectangular" height={400} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    <Skeleton width="50%" />
                  </Typography>
                  <Skeleton variant="rectangular" height={400} />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    <Skeleton width="40%" />
                  </Typography>
                  <Skeleton variant="rectangular" height={300} />
                </Grid>
              </>
            ) : comparisonResults && comparisonResults.length > 0 ? (
              <>
                {/* Radar chart for overall comparison */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h6" gutterBottom>
                      Overall Comparison
                    </Typography>
                    <Tooltip 
                      title={
                        <React.Fragment>
                          <Typography color="inherit" variant="subtitle2">How to read this chart</Typography>
                          <Typography variant="body2">
                            This radar chart shows a normalized comparison (0-100%) of key metrics across all topologies.
                            Higher values (further from center) indicate better performance in that category.
                            For metrics where lower values are better (like cost), the scale is inverted so higher values
                            on the chart still represent better performance.
                          </Typography>
                        </React.Fragment>
                      }
                      arrow
                    >
                      <IconButton size="small" sx={{ ml: 1, mb: 1 }}>
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Fade in={!loading} timeout={1000}>
                    <Box sx={{ height: 400 }}>
                      <Radar 
                        ref={(ref) => registerChartRef('radar', ref)}
                        data={radarData} 
                        options={{
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
                                  let value = context.raw.toFixed(1);
                                  
                                  // Add explanations based on the metric
                                  let explanation = '';
                                  switch(context.label) {
                                    case 'Cost Efficiency':
                                      explanation = ` (higher is better)`;
                                      break;
                                    case 'Power Efficiency':
                                      explanation = ` (higher is better)`;
                                      break;
                                    case 'Latency':
                                      explanation = ` (higher is better)`;
                                      break;
                                    case 'Oversubscription':
                                      explanation = ` (higher is better)`;
                                      break;
                                    case 'Rack Space':
                                      explanation = ` (higher is better)`;
                                      break;
                                    case 'Cabling Complexity':
                                      explanation = ` (higher is better)`;
                                      break;
                                    default:
                                      break;
                                  }
                                  
                                  return `${label}: ${value}%${explanation}`;
                                },
                                afterLabel: function(context) {
                                  const topologyIndex = comparisonResults.findIndex(
                                    result => result.name === context.dataset.label
                                  );
                                  
                                  if (topologyIndex === -1) return '';
                                  
                                  const metrics = comparisonResults[topologyIndex].metrics;
                                  
                                  // Add actual values for each metric
                                  switch(context.label) {
                                    case 'Cost Efficiency':
                                      return `Actual cost: ${formatCurrency(metrics.cost.total)}`;
                                    case 'Power Efficiency':
                                      return `Actual power: ${formatPower(metrics.power.total)}`;
                                    case 'Latency':
                                      return `Actual latency: ${metrics.latency.total.toFixed(2)} μs`;
                                    case 'Oversubscription':
                                      return `Actual ratio: ${metrics.oversubscription.ratio}:1`;
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
                        }}
                      />
                    </Box>
                  </Fade>
                </Grid>
                
                {/* Bar chart for selected metric */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h6" gutterBottom>
                      {comparisonMetric.charAt(0).toUpperCase() + comparisonMetric.slice(1)} Comparison
                    </Typography>
                    <Tooltip 
                      title={
                        <React.Fragment>
                          <Typography color="inherit" variant="subtitle2">Metric details</Typography>
                          <Typography variant="body2">
                            {comparisonMetric === 'cost' && 'Shows the cost breakdown across different components.'}
                            {comparisonMetric === 'power' && 'Shows the power usage across different components.'}
                            {comparisonMetric === 'devices' && 'Shows the device count by type.'}
                            {comparisonMetric === 'oversubscription' && 'Shows the oversubscription ratio for each topology.'}
                            {comparisonMetric === 'latency' && 'Shows the estimated latency for each topology.'}
                            {comparisonMetric === 'rackspace' && 'Shows the rack space requirements for each topology.'}
                            {comparisonMetric === 'cabling' && 'Shows the cabling requirements for each topology.'}
                          </Typography>
                        </React.Fragment>
                      }
                      arrow
                    >
                      <IconButton size="small" sx={{ ml: 1, mb: 1 }}>
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Fade in={!loading} timeout={1000} style={{ transitionDelay: '200ms' }}>
                    <Box sx={{ height: 400 }}>
                      <Bar 
                        ref={(ref) => registerChartRef('bar', ref)}
                        data={barData} 
                        options={{
                          plugins: {
                            legend: {
                              position: 'top',
                            },
                            tooltip: {
                              callbacks: {
                                title: function(context) {
                                  return context[0].dataset.label + ' - ' + context[0].label;
                                },
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
                                },
                                afterLabel: function(context) {
                                  // Show percentage of total for this topology
                                  const index = context.dataIndex;
                                  
                                  if (comparisonMetric === 'cost') {
                                    // Get the total cost for this topology
                                    const totalCost = barData.datasets.reduce((sum, dataset) => {
                                      return sum + dataset.data[index];
                                    }, 0);
                                    
                                    const percentage = (context.raw / totalCost * 100).toFixed(1);
                                    return `${percentage}% of total cost`;
                                  } else if (comparisonMetric === 'power') {
                                    // Get the total power for this topology
                                    const totalPower = barData.datasets.reduce((sum, dataset) => {
                                      return sum + dataset.data[index];
                                    }, 0);
                                    
                                    const percentage = (context.raw / totalPower * 100).toFixed(1);
                                    return `${percentage}% of total power usage`;
                                  }
                                  
                                  return '';
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
                          maintainAspectRatio: false,
                          animation: {
                            duration: 1200,
                            easing: 'easeOutQuart'
                          }
                        }}
                      />
                    </Box>
                  </Fade>
                </Grid>
                
                {/* Comparison table */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Detailed Comparison
                  </Typography>
                  <Fade in={!loading} timeout={1000} style={{ transitionDelay: '300ms' }}>
                    <TableContainer component={Paper} sx={{ maxHeight: 600, overflow: 'auto' }}>
                      <Table stickyHeader>
                        <TableHead>
                          <TableRow>
                            {tableData.headers.map((header, index) => (
                              <TableCell 
                                key={index} 
                                align={index === 0 ? 'left' : 'right'}
                                sx={{ 
                                  backgroundColor: theme => theme.palette.background.paper,
                                  fontWeight: 'bold'
                                }}
                              >
                                <Typography variant="subtitle2">{header}</Typography>
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {tableData.rows.map((row, rowIndex) => {
                            // Determine if this is a category header row
                            const isCategory = ['Total Cost', 'Total Power', 'Total Devices', 'Oversubscription', 'Latency', 'Rack Space', 'Total Cables'].includes(row.name);
                            
                            return (
                              <TableRow 
                                key={rowIndex}
                                sx={{
                                  backgroundColor: isCategory 
                                    ? theme => theme.palette.action.hover 
                                    : 'inherit',
                                  '&:hover': {
                                    backgroundColor: theme => theme.palette.action.selected,
                                  }
                                }}
                              >
                                <TableCell>
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      fontWeight: isCategory ? 'bold' : 'normal',
                                    }}
                                  >
                                    {row.name}
                                  </Typography>
                                </TableCell>
                                {row.values.map((value, valueIndex) => {
                                  // Find min and max values for highlighting
                                  let bestValue = null;
                                  let worstValue = null;
                                  
                                  if (isCategory) {
                                    // For these metrics, lower is better
                                    if (['Total Cost', 'Total Power', 'Oversubscription', 'Latency', 'Rack Space', 'Total Cables'].includes(row.name)) {
                                      // Extract numeric values for comparison
                                      const numericValues = row.values.map(v => {
                                        if (row.name === 'Total Cost') {
                                          return parseFloat(v.replace(/[^0-9.-]+/g, ''));
                                        } else if (row.name === 'Total Power') {
                                          return parseFloat(v.replace(/[^0-9.-]+/g, ''));
                                        } else if (row.name === 'Oversubscription') {
                                          return parseFloat(v.split(':')[0]);
                                        } else if (row.name === 'Latency') {
                                          return parseFloat(v.split(' ')[0]);
                                        } else if (row.name === 'Rack Space') {
                                          return parseFloat(v.split(' ')[0]);
                                        } else if (row.name === 'Total Cables') {
                                          return parseFloat(v.replace(/[^0-9.-]+/g, ''));
                                        }
                                        return 0;
                                      });
                                      
                                      bestValue = Math.min(...numericValues);
                                      worstValue = Math.max(...numericValues);
                                    } 
                                    // For devices, it depends on the context (could be higher or lower)
                                  }
                                  
                                  // Determine if this is the best value
                                  let isBest = false;
                                  let isWorst = false;
                                  
                                  if (bestValue !== null && worstValue !== null) {
                                    const numericValue = parseFloat(value.replace(/[^0-9.-]+/g, ''));
                                    isBest = numericValue === bestValue && row.values.length > 1;
                                    isWorst = numericValue === worstValue && row.values.length > 1 && bestValue !== worstValue;
                                  }
                                  
                                  return (
                                    <TableCell 
                                      key={valueIndex} 
                                      align="right"
                                      sx={{
                                        color: isBest 
                                          ? theme => theme.palette.success.main
                                          : isWorst 
                                            ? theme => theme.palette.error.main 
                                            : 'inherit',
                                        fontWeight: isBest || isWorst ? 'bold' : 'normal'
                                      }}
                                    >
                                      <Tooltip 
                                        title={isBest ? "Best value" : isWorst ? "Worst value" : ""}
                                        placement="top"
                                        arrow
                                        disableHoverListener={!isBest && !isWorst}
                                      >
                                        <Typography variant="body2">
                                          {value}
                                        </Typography>
                                      </Tooltip>
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Fade>
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
