# Firebase Setup Guide

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name: "Adams Eden" (or your preferred name)
4. Disable Google Analytics (optional for now)
5. Click "Create Project"

## Step 2: Add Web App

1. In your Firebase project, click the **Web icon** (`</>`)
2. Register app name: "Adams Eden Website"
3. Click "Register app"
4. Copy the Firebase configuration object

## Step 3: Configure Environment Variables

1. Open `.env.local` in your project
2. Replace the placeholder values with your Firebase config:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_actual_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_actual_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_actual_app_id
   ```

## Step 4: Set Up Authentication

1. In Firebase Console, go to **Authentication**
2. Click "Get Started"
3. Enable sign-in methods:
   - **Email/Password**: Enable
   - **Google**: Enable (optional)

## Step 5: Set Up Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click "Create database"
3. Choose **Start in production mode** (we'll add rules later)
4. Select your region (choose closest to your users)
5. Click "Enable"

## Step 6: Configure Firestore Security Rules

Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // User's gardens
      match /gardens/{gardenId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
        
        // Garden beds
        match /beds/{bedId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
      
      // User's calendar events
      match /calendar/{eventId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // User's tracker entries
      match /tracker/{entryId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

## Database Structure

```
users/{userId}/
  profile/
    - displayName: string
    - email: string
    - zipCode: string
    - location: string
    - createdAt: timestamp
    
  gardens/{gardenId}/
    - name: string
    - createdAt: timestamp
    
    beds/{bedId}/
      - name: string
      - rows: number
      - cols: number
      - grid: array (2D grid of plant placements)
      - createdAt: timestamp
      - updatedAt: timestamp
  
  calendar/{eventId}/
    - plantId: string
    - plantName: string
    - eventType: string (plant|harvest|transplant)
    - date: timestamp
    - month: number
    - status: string (upcoming|completed)
    - gardenId: string
    - bedId: string
    - createdAt: timestamp
  
  tracker/{entryId}/
    - plantId: string
    - plantName: string
    - action: string (planted|watered|fertilized|harvested|etc)
    - notes: string
    - date: timestamp
    - gardenId: string
    - bedId: string
    - createdAt: timestamp
```

## Step 7: Restart Dev Server

After adding your Firebase config to `.env.local`:
```bash
npm run dev
```

## Next Steps

1. ✅ Firebase initialized
2. ⏭️ Create authentication UI (login/signup)
3. ⏭️ Sync planner data to Firestore
4. ⏭️ Sync calendar events to Firestore
5. ⏭️ Real-time updates across devices
6. ⏭️ Add Firebase to mobile app

## Testing

Once configured, you can test Firebase connection:
1. Open browser console on your website
2. Check for any Firebase errors
3. Try signing up for an account
4. Verify data appears in Firebase Console
