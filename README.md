🚀 CivicGuard - Community Issue Reporter
CivicGuard is a modern full-stack web application designed to help communities report and track public infrastructure issues such as potholes, broken street lights, garbage dumping, and water leaks. It incorporates real-time location mapping via Google Maps Platform and automated photo auditing via Gemini 3.5 Flash.

📋 Table of Contents
🚀 Key Features
🛠️ Architecture
⚙️ Environment Configuration
💻 Local Setup Instructions
📦 Production Build & Deploy
🗄️ Database Setup (Firebase Firestore)
📁 Project Structure

🚀 Key Features
📍 Interactive Location Mapping – See all active and resolved community issues mapped with priority-colored pins (Green for Low, Orange for Medium, Red for High severity).

✨ Gemini AI Image Analysis – Simply upload a photo of the issue. Gemini 3.5 Flash automatically identifies the category, estimates the severity level, and writes a concise description for you.

🗺️ Address Autocomplete – Enter location names or addresses using standard Google Maps Places autocomplete.

📊 Real-time Status Tracking – Group and manage issues along a linear status pipeline: Reported → Under Review → In Progress → Resolved.

☁️ Cloud Database (Firebase Firestore) – All reports are stored in the cloud, accessible from any device. Cross-device synchronization ensures you can report an issue on your phone and track it on your laptop.

🌙 Deeply Polished UI with Dark Mode – Fully responsive dashboard supporting a high-contrast elegant dark canvas.

🔍 Search & Filter – Easily find issues by category, severity, or status.

📊 Real-Time Dashboard – Live statistics showing total, resolved, and pending issues at a glance.

🌤️ Weather Widget – Shows current weather at the location for better context.

💾 Firebase Firestore Persistence – All logged reports and state updates are persistently stored in the cloud.

🛠️ Architecture
CivicGuard is designed as a Full-Stack Monorepo:

Frontend
React 19 with TypeScript for type-safe code

Vite for fast development and building

Tailwind CSS for beautiful, responsive UI

Framer Motion for smooth animations

Backend
Unified Production Server (server.ts) – Express + TSX wrapper serving both API routes and frontend build bundles on port 3000 (optimized for Google Cloud Run container deployment).

Standalone API Microservice (/backend) – A standalone Node/Express backend proxy running on port 3001 to securely proxy Gemini API requests.

Database
Firebase Firestore – NoSQL cloud database for storing all issue reports

Real-time synchronization across all devices

Deployment
Google Cloud Run – Serverless deployment with auto-scaling capabilities

Development
Google AI Studio – Rapid prototyping using natural language prompts

VS Code – Local development environment

⚙️ Environment Configuration
Define the following values in your environment variables or in a .env file at root:

env
# Gemini API Key (Secret) - Used by backend only
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# Google Maps Platform Key - Used to load Map APIs
GOOGLE_MAPS_PLATFORM_KEY="YOUR_GOOGLE_MAPS_API_KEY"

# Alternate name mapping (for frontend)
REACT_APP_MAPS_API_KEY="YOUR_GOOGLE_MAPS_API_KEY"

# Firebase Configuration (for Firestore Database)
VITE_FIREBASE_API_KEY="YOUR_FIREBASE_API_KEY"
VITE_FIREBASE_AUTH_DOMAIN="YOUR_PROJECT.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
VITE_FIREBASE_STORAGE_BUCKET="YOUR_PROJECT.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="YOUR_SENDER_ID"
VITE_FIREBASE_APP_ID="YOUR_APP_ID"

# Custom External Backend Endpoint (Optional)
REACT_APP_BACKEND_URL=""
💻 Local Setup Instructions
Pre-requisites
Node.js (v18 or higher)

npm (v9 or higher)

Git (for cloning)

Installation & Launch
1. Clone the repository:

bash
git clone https://github.com/Bhavi615/Civic-Guard-AI.git
cd Civic-Guard-AI
2. Install root dependencies:

bash
npm install
3. Set up environment variables:

bash
cp .env.example .env
# Edit .env with your API keys
4. Run in Development Mode (Vite + Express on Port 3000):

bash
npm run dev
5. (Optional) Install & Run Standalone Backend separately (Port 3001):

bash
cd backend
npm install
npm start
6. Open your browser and navigate to:

text
http://localhost:3000
📦 Production Build & Deploy
Building the Project
To compile both the frontend assets and bundle the backend TypeScript server into a production-ready file:

bash
npm run build
Launching the Production Server
bash
npm start
Deploy to Google Cloud Run
You can easily package CivicGuard as a container and deploy it to Google Cloud Run:

bash
# Set your GCP Project ID
gcloud config set project [PROJECT_ID]

# Submit build to Cloud Build
gcloud builds submit --tag gcr.io/[PROJECT_ID]/civicguard

# Deploy to Cloud Run
gcloud run deploy civicguard \
  --image gcr.io/[PROJECT_ID]/civicguard \
  --platform managed \
  --port 3000 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=[YOUR_KEY],GOOGLE_MAPS_PLATFORM_KEY=[YOUR_KEY]
Deploy to Firebase Hosting (Frontend Only)
bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase Hosting
firebase init hosting

# Deploy
firebase deploy --only hosting
🗄️ Database Setup (Firebase Firestore)
Step 1: Create a Firebase Project
Go to Firebase Console

Click "Add project" and name it community-hero

Click "Create project"

Step 2: Enable Firestore Database
In the left sidebar, click "Firestore Database"

Click "Create database"

Choose location: asia-south1 (Mumbai) for India

Select "Start in test mode"

Click "Enable"

Step 3: Add Your Web App
Click the "</>" (Web) icon to add a web app

App nickname: community-hero

Click "Register app"

Copy the firebaseConfig object

Paste it in your src/firebase.ts file

Step 4: Install Firebase
bash
npm install firebase
Step 5: Create src/firebase.ts
typescript
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const ISSUES_COLLECTION = "issues";

// CRUD operations...
📁 Project Structure
text
Civic-Guard-AI/
├── src/
│   ├── components/
│   │   ├── AddressInput.tsx
│   │   ├── IssueMap.tsx
│   │   └── ReportModal.tsx
│   ├── firebase.ts          # Firebase configuration
│   ├── App.tsx              # Main application
│   ├── main.tsx             # Entry point
│   ├── types.ts             # TypeScript types
│   └── index.css            # Global styles
├── backend/
│   ├── index.js             # Standalone backend
│   ├── package.json
│   └── .env
├── server.ts                # Unified production server
├── .env.example             # Environment variables template
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md

🙏 Acknowledgments
Google Gemini AI – For powerful image analysis

Google Maps Platform – For location services

Firebase – For cloud database

Google Cloud Run – For serverless deployment

Google AI Studio – For rapid prototyping


Try out here:

Live Demo: https://community-issue-reporter-945410092786.asia-southeast1.run.app
