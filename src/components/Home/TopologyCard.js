import React from 'react';
import { 
  Card, 
  CardContent, 
  CardActions, 
  Typography, 
  Box, 
  Chip, 
  IconButton, 
  Tooltip, 
  Divider,
  Grid,
  Stack,
  ButtonGroup,
  useTheme
} from '@mui/material';
import { Link } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import DeleteIcon from '@mui/icons-material/Delete';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import PaidIcon from '@mui/icons-material/Paid';
import DevicesIcon from '@mui/icons-material/Devices';
import SpeedIcon from '@mui/icons-material/Speed';

const TopologyCard = ({ 
  topology, 
  metrics, 
  onEdit, 
  onDelete, 
  onToggleComparison, 
  isInComparison 
}) => {
  const theme = useTheme();

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Get status indicator for each metric
  const getStatusIndicator = (value, threshold1, threshold2, lowerIsBetter = false) => {
    if (lowerIsBetter) {
      if (value <= threshold1) return { icon: <TrendingDownIcon color="success" />, color: 'success' };
      if (value <= threshold2) return { icon: <TrendingFlatIcon color="warning" />, color: 'warning' };
      return { icon: <TrendingUpIcon color="error" />, color: 'error' };
    } else {
      if (value >= threshold2) return { icon: <TrendingUpIcon color="success" />, color: 'success' };
      if (value >= threshold1) return { icon: <TrendingFlatIcon color="warning" />, color: 'warning' };
      return { icon: <TrendingDownIcon color="error" />, color: 'error' };
    }
  };

  // Determine cost status
  const costStatus = getStatusIndicator(metrics.cost.total, 100000, 150000, true);
  
  // Determine oversubscription status (lower is better)
  const oversubStatus = getStatusIndicator(
    parseFloat(metrics.oversubscription.ratio), 
    2.5, 
    4, 
    true
  );
  
  // Determine device count status (depends on requirements, using arbitrary thresholds)
  const deviceStatus = getStatusIndicator(metrics.deviceCount.total, 20, 40, true);

  return (
    <Card 
      variant="outlined" 
      sx={{ 
        mb: 2,
        position: 'relative',
        overflow: 'visible',
        border: isInComparison ? `2px solid ${theme.palette.primary.main}` : undefined,
      }}
    >
      {isInComparison && (
        <Chip
          label="In Comparison"
          color="primary"
          size="small"
          sx={{
            position: 'absolute',
            top: -12,
            right: 16,
            zIndex: 1
          }}
        />
      )}
      
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h6" component="div">
            {topology.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Updated: {formatDate(topology.updatedAt)}
          </Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {topology.description || 'No description'}
        </Typography>
        
        <Divider sx={{ my: 1.5 }} />
        
        <Grid container spacing={1} sx={{ mt: 1 }}>
          <Grid item xs={4}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <DevicesIcon fontSize="small" />
              <Box>
                <Typography variant="caption" color="text.secondary">Devices</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" mr={0.5}>{metrics.deviceCount.total}</Typography>
                  {deviceStatus.icon}
                </Box>
              </Box>
            </Stack>
          </Grid>
          
          <Grid item xs={4}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <PaidIcon fontSize="small" />
              <Box>
                <Typography variant="caption" color="text.secondary">Cost</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" mr={0.5}>{formatCurrency(metrics.cost.total)}</Typography>
                  {costStatus.icon}
                </Box>
              </Box>
            </Stack>
          </Grid>
          
          <Grid item xs={4}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <SpeedIcon fontSize="small" />
              <Box>
                <Typography variant="caption" color="text.secondary">Oversub.</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" mr={0.5}>{metrics.oversubscription.ratio}:1</Typography>
                  {oversubStatus.icon}
                </Box>
              </Box>
            </Stack>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 0.5 }}>
          <Chip
            size="small"
            label={`${metrics.deviceCount.spines} Spine ${metrics.deviceCount.spines > 1 ? 'Switches' : 'Switch'}`}
            sx={{ mr: 0.5, mb: 0.5 }}
          />
          <Chip
            size="small"
            label={`${metrics.deviceCount.leafs} Leaf ${metrics.deviceCount.leafs > 1 ? 'Switches' : 'Switch'}`}
            sx={{ mr: 0.5, mb: 0.5 }}
          />
          <Chip
            size="small"
            label={`${topology.configuration.numTiers} ${topology.configuration.numTiers > 1 ? 'Tiers' : 'Tier'}`}
            sx={{ mr: 0.5, mb: 0.5 }}
          />
        </Box>
      </CardContent>
      
      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <ButtonGroup variant="outlined" size="small">
          <Tooltip title="Edit Topology">
            <IconButton
              component={Link} 
              to="/builder"
              onClick={() => onEdit(topology)}
              color="primary"
              size="small"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="View Metrics">
            <IconButton 
              component={Link} 
              to="/visualization"
              onClick={() => onEdit(topology)}
              color="primary"
              size="small"
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </ButtonGroup>

        <Box>
          <Tooltip title={isInComparison ? "Remove from Comparison" : "Add to Comparison"}>
            <IconButton 
              color={isInComparison ? "primary" : "default"}
              onClick={(e) => onToggleComparison(topology.id, e)}
              size="small"
            >
              <CompareArrowsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Topology">
            <IconButton 
              color="error"
              onClick={(e) => onDelete(topology.id, e)}
              size="small"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </CardActions>
    </Card>
  );
};

export default TopologyCard;
