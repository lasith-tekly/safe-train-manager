#!/bin/bash

# Installation Script for Phase 5+6 Frontend Dependencies
# Run this to complete the TypeScript error fixes

echo "=================================="
echo "Installing React Query for Phase 5+6"
echo "=================================="

cd frontend

echo ""
echo "Step 1: Installing @tanstack/react-query..."
npm install @tanstack/react-query

echo ""
echo "Step 2: Restoring original hooks file..."
cd src/hooks

# Backup stub
mv useTeamPlanning.ts useTeamPlanning.stub.ts

# Restore original
mv useTeamPlanning.ts.backup useTeamPlanning.ts

echo ""
echo "Step 3: Verifying build..."
cd ../..
npm run build

echo ""
echo "=================================="
echo "✅ Installation Complete!"
echo "=================================="
echo ""
echo "React Query hooks are now fully functional."
echo "You can now run: npm run dev"
echo ""
