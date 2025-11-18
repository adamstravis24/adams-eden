#!/bin/bash
# Script to set Firebase environment variables as EAS secrets
# Usage: ./scripts/setup-firebase-secrets.sh

echo "Setting up Firebase environment variables as EAS secrets..."
echo ""
echo "Please enter your Firebase configuration values:"
echo ""

read -p "Firebase API Key: " API_KEY
read -p "Firebase Auth Domain: " AUTH_DOMAIN
read -p "Firebase Project ID: " PROJECT_ID
read -p "Firebase Storage Bucket: " STORAGE_BUCKET
read -p "Firebase Messaging Sender ID: " MESSAGING_SENDER_ID
read -p "Firebase App ID: " APP_ID

echo ""
echo "Creating EAS secrets..."

eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value "$API_KEY" --force
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "$AUTH_DOMAIN" --force
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "$PROJECT_ID" --force
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --value "$STORAGE_BUCKET" --force
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --value "$MESSAGING_SENDER_ID" --force
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_APP_ID --value "$APP_ID" --force

echo ""
echo "Done! Verifying secrets..."
eas secret:list

echo ""
echo "Firebase secrets have been set. You can now build your production app with:"
echo "  npm run eas:prod:android"

