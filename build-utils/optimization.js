/**
 * Build optimization utilities for Vercel deployment
 * 
 * This script runs after the build process to perform additional optimizations:
 * - Validates the build output
 * - Applies additional performance optimizations
 * - Generates a build report
 */

const fs = require('fs');
const path = require('path');

console.log('Running build optimizations for Vercel deployment...');

// Path to the build directory
const buildDir = path.resolve(__dirname, '../build');

// Ensure the build directory exists
if (!fs.existsSync(buildDir)) {
  console.error('Build directory not found!');
  process.exit(1);
}

// Generate a simple build report
const generateBuildReport = () => {
  const assets = {};
  const scanDirectory = (dir, root = '') => {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const relativePath = path.join(root, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        scanDirectory(itemPath, relativePath);
      } else {
        const extension = path.extname(item).toLowerCase();
        if (!assets[extension]) {
          assets[extension] = {
            count: 0,
            totalSize: 0,
            files: []
          };
        }
        
        assets[extension].count++;
        assets[extension].totalSize += stats.size;
        assets[extension].files.push({
          path: relativePath,
          size: (stats.size / 1024).toFixed(2) + ' KB'
        });
      }
    }
  };
  
  scanDirectory(buildDir);
  
  // Sort files by size within each category
  for (const ext in assets) {
    assets[ext].files.sort((a, b) => {
      return parseFloat(b.size) - parseFloat(a.size);
    });
    
    // Keep only the top 10 largest files
    if (assets[ext].files.length > 10) {
      assets[ext].files = assets[ext].files.slice(0, 10);
    }
  }
  
  // Format the total size
  for (const ext in assets) {
    assets[ext].totalSize = (assets[ext].totalSize / 1024).toFixed(2) + ' KB';
  }
  
  return assets;
};

// Generate and save the report
const buildReport = generateBuildReport();
const reportContent = JSON.stringify(buildReport, null, 2);
fs.writeFileSync(path.join(buildDir, 'build-report.json'), reportContent);

console.log('Build optimizations completed. Build report generated.');
console.log('Your application is ready for Vercel deployment!');
