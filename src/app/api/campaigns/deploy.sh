#!/bin/bash

echo "🚀 Starting deployment script..."

echo "📁 Loading environment variables from .env file..."
source .env
echo "✅ Environment variables loaded successfully."

echo "📄 Generating app.yaml from template..."
envsubst < app.yaml.template > app.yaml
echo "✅ app.yaml generated successfully."

echo "🚢 Deploying application to Google Cloud App Engine..."
gcloud app deploy
echo "✅ Deployment completed."

echo "🧹 Cleaning up temporary files..."
rm app.yaml
echo "✅ Cleanup completed."

echo "🎉 Deployment process finished successfully!"