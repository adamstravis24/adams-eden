# Script to set Firebase environment variables as EAS secrets
# Usage: .\scripts\setup-firebase-secrets.ps1

Write-Host "Setting up Firebase environment variables as EAS secrets..." -ForegroundColor Cyan
Write-Host ""

Write-Host "Please enter your Firebase configuration values:" -ForegroundColor Yellow
Write-Host ""

$apiKey = Read-Host "Firebase API Key"
$authDomain = Read-Host "Firebase Auth Domain"
$projectId = Read-Host "Firebase Project ID"
$storageBucket = Read-Host "Firebase Storage Bucket"
$messagingSenderId = Read-Host "Firebase Messaging Sender ID"
$appId = Read-Host "Firebase App ID"

Write-Host ""
Write-Host "Creating EAS secrets..." -ForegroundColor Cyan

eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value $apiKey --force
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value $authDomain --force
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value $projectId --force
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --value $storageBucket --force
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --value $messagingSenderId --force
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_APP_ID --value $appId --force

Write-Host ""
Write-Host "Done! Verifying secrets..." -ForegroundColor Green
eas secret:list

Write-Host ""
Write-Host "Firebase secrets have been set. You can now build your production app with:" -ForegroundColor Green
Write-Host "  npm run eas:prod:android" -ForegroundColor Yellow

