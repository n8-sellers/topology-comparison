# Rail-Only Topology Visualization Fix

## Issue
In Rail-Only (single-tier) topologies, the visualization page was incorrectly showing spine switch statistics even though these topologies have no spine switches (only leaf switches).

## Root Cause
The `TopologyMetrics.tsx` component was not properly checking for Rail-Only topologies and was always displaying spine-related information in:
- Device count charts
- Cost breakdown charts
- Power usage charts
- Spine configuration cards
- Rack space breakdowns
- Summary tooltips

## Solution Implemented

### 1. Added Rail-Only Detection
```typescript
const isRailOnly = currentTopology.configuration.numTiers === 1 && currentTopology.configuration.numSpines === 0;
```

### 2. Conditional Chart Data
Modified all chart data arrays to conditionally include spine data only for non-Rail-Only topologies:

- **Device Count Chart**: Shows only "Leaf Switches" for Rail-Only
- **Cost Breakdown**: Excludes "Spine Switches" from labels and data
- **Power Usage**: Excludes "Spine Switches" from labels and data

### 3. Conditional UI Elements
Updated UI components to hide spine-related information for Rail-Only topologies:

- **Spine Configuration Card**: Hidden completely for Rail-Only
- **Rack Space Display**: Doesn't show "Spine: X U" for Rail-Only
- **Device Count Summary**: Shows "X leaf switches" instead of "0 spine, X leaf"
- **Tooltips**: Excludes spine-related breakdowns

## Files Modified
- `src/components/Visualization/TopologyMetrics.tsx`

## Testing
To verify the fix:
1. Create a Rail-Only topology (1 tier, 0 spine switches)
2. Navigate to the Visualization page
3. Confirm that:
   - No spine switches are mentioned in any charts
   - Device count shows only leaf switches
   - Cost and power breakdowns only show leaf switches and optics
   - No spine configuration card appears
   - Rack space only shows leaf units

## Impact
This fix ensures that Rail-Only topologies are accurately represented in the visualization, matching what's shown in the Builder section and providing correct metrics for single-tier deployments.
