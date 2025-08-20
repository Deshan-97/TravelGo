# Firebase Cloud Messaging (FCM) Setup Guide

## Step 1: Get VAPID Keys from Firebase Console

### What are VAPID Keys?
Think of VAPID keys like a phone number for your app. They allow your app to send push notifications to users' phones even when the app is closed.

### How to Get Them:

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com
   - Select your TravelGo project

2. **Navigate to Cloud Messaging**
   - Click on "Project Settings" (gear icon)
   - Go to "Cloud Messaging" tab

3. **Generate Web Push Certificates**
   - Scroll down to "Web Push certificates"
   - Click "Generate key pair" 
   - Copy the key that appears (starts with "B...")

4. **Save the Key**
   - This is your VAPID key
   - You'll need to add it to your app

### Example of what you'll get:
```
VAPID Key: BGWa_5vmtxgrwMQRITsURtIYM0ZL9VMkcqOeF6xZdFTcvUDC99pYqqTW2NmK1qgwEhI3TN28_DNf38ZJck1_amE
```

## Step 2: Add the Key to Your App

Create a file called `.env.local` in your project root:

```bash
# Add this line to .env.local
NEXT_PUBLIC_VAPID_KEY=BGWa_5vmtxgrwMQRITsURtIYM0ZL9VMkcqOeF6xZdFTcvUDC99pYqqTW2NmK1qgwEhI3TN28_DNf38ZJck1_amE
```
