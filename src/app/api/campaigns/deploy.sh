#!/bin/bash

echo "🚀 Starting deployment script..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with all required environment variables."
    exit 1
fi

echo "📁 Loading environment variables from .env file..."
set -a  # automatically export all variables
source .env
set +a  # stop automatically exporting
echo "✅ Environment variables loaded successfully."

echo "📄 Generating app.yaml from template..."
envsubst < app.yaml.template > app.yaml
echo "✅ app.yaml generated successfully."

echo "📁 Copying contact API for deployment..."
# Copy the contact folder from parent directory
if [ -d "../contact" ]; then
    cp -r ../contact ./contact
    echo "✅ Contact API copied successfully."
else
    echo "⚠️  Warning: Contact API folder not found at ../contact, deployment will use fallback."
fi

echo "🚢 Deploying application to Google Cloud App Engine..."
gcloud app deploy
echo "✅ Deployment completed."

echo "🧹 Cleaning up temporary files..."
rm app.yaml
# Remove the copied contact folder
if [ -d "./contact" ]; then
    rm -rf ./contact
    echo "✅ Contact API folder cleaned up."
fi
echo "✅ Cleanup completed."

echo "🎉 Deployment process finished successfully!"