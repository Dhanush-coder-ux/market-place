#!/bin/bash

echo "🚀 Starting Git Automation..."

# Show current status
git status

echo ""
echo "📦 Adding all changes..."
git add .

echo ""
echo "📝 Enter your commit message:"
read message

# Commit changes
git commit -m "$message"

echo ""
echo "⬆️ Pushing to GitHub..."
git push

echo ""
echo "🌐 Starting Vite Development Server..."
npm run dev