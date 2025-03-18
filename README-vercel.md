# Deploying Network Topology Analyzer to Vercel

This guide provides instructions on how to deploy this application to Vercel.

## Pre-deployment Setup

The following files have been prepared for Vercel deployment:

1. **vercel.json** - Configures routing and caching rules
2. **HashRouter** - Updated routing to work with Vercel's static deployment
3. **Optimization Script** - Added build utilities to improve performance

## Deployment Steps

### 1. Install Vercel CLI (Optional)

If you want to deploy from the command line:

```bash
npm install -g vercel
```

### 2. Deployment Options

#### Option A: Using Vercel CLI

You can deploy directly from the command line:

```bash
npm run deploy:vercel
```

Or manually:

```bash
vercel --prod
```

#### Option B: Using the Vercel Dashboard

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Log in to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Import Project"
4. Select "Import Git Repository" and choose your repository
5. Configure the project with the following settings:
   - **Framework Preset**: React
   - **Root Directory**: ./
   - **Build Command**: npm run build
   - **Output Directory**: build

### 3. Environment Variables (If Needed)

If your application uses environment variables, add them in the Vercel dashboard:

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add each variable from your `.env.example` file with the appropriate values

## Troubleshooting

### Routing Issues

If you encounter routing issues:

1. Make sure the `vercel.json` file is present in the root directory
2. Verify the application is using `HashRouter` instead of `BrowserRouter`
3. Check for any hard-coded paths in your components

### TypeScript Version

This project uses TypeScript 4.9.5 for compatibility with React Scripts 5.0.1. The original error was:

```
npm error While resolving: react-scripts@5.0.1
npm error Found: typescript@5.8.2
npm error Could not resolve dependency:
npm error peerOptional typescript@"^3.2.1 || ^4" from react-scripts@5.0.1
```

To resolve this:
1. We downgraded TypeScript to 4.9.5 in package.json
2. Added an .npmrc file to ensure consistent dependency resolution

If you update React Scripts in the future, you may be able to use a newer TypeScript version.

### Build Failures

If your build fails:

1. Check the build log in the Vercel dashboard
2. Ensure all dependencies are correctly listed in `package.json`
3. Verify there are no environment variables missing

## Monitoring

After deployment, you can monitor your application using Vercel Analytics:

1. Go to your project dashboard
2. Click on "Analytics" to view performance metrics
3. Check the "Deployments" tab to see deployment history

## Customizing Your Domain

To use a custom domain:

1. Go to your project settings in Vercel
2. Click on "Domains"
3. Follow the instructions to add and verify your domain

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [React Deployment Guide](https://create-react-app.dev/docs/deployment/)
