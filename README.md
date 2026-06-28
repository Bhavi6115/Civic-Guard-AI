# CivicGuard - Community Issue Reporter

CivicGuard is a modern full-stack web application designed to help communities report and track public infrastructure issues such as potholes, broken street lights, garbage dumping, and water leaks. It incorporates real-time location mapping via **Google Maps Platform** and automated photo auditing via **Gemini 3 Flash**.

---

## 🚀 Key Features

- **📍 Interactive Location Mapping**: See all active and resolved community issues mapped with priority-colored pins (Green for Low, Orange for Medium, Red for High severity).
- **✨ Gemini AI Image Analysis**: Simply upload a photo of the issue. Gemini automatically identifies the category, estimates the severity level, and writes a concise description for you.
- **🗺️ Address Autocomplete**: Enter location names or addresses using standard Google Maps Places autocomplete.
- **📊 Real-time Status Tracking**: Group and manage issues along a linear status pipeline: `Reported` → `Under Review` → `In Progress` → `Resolved`.
- **🌙 Deeply Polished UI with Dark Mode**: Fully responsive dashboard supporting a high-contrast elegant dark canvas.
- **💾 LocalStorage Persistence**: Saves all logged reports and state updates persistently across browser sessions.

---

## 🛠️ Architecture

CivicGuard is designed as a **Full-Stack Monorepo**:
1. **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS.
2. **Unified Production Server (`server.ts`)**: Express + TSX wrapper serving both API routes and frontend build bundles on port `3000` (optimized for Google Cloud Run container deployment).
3. **Standalone API Microservice (`/backend`)**: A standalone Node/Express backend proxy running on port `3001` to securely proxy Gemini API requests.

---

## ⚙️ Environment Configuration

Define the following values in your environment variables or in a `.env` file at root:

```env
# Gemini API Key (Secret) - Used by backend only
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# Google Maps Platform Key (Exposed) - Used to load Map APIs
GOOGLE_MAPS_PLATFORM_KEY="YOUR_GOOGLE_MAPS_API_KEY"
# Alternate name mapping
REACT_APP_MAPS_API_KEY="YOUR_GOOGLE_MAPS_API_KEY"

# Custom External Backend Endpoint (Optional)
REACT_APP_BACKEND_URL=""
```

---

## 💻 Local Setup Instructions

### Pre-requisites
- Node.js (v18 or higher)
- npm

### Installation & Launch

1. **Install Root dependencies**:
   ```bash
   npm install
   ```

2. **Run in Development Mode (Vite + Express on Port 3000)**:
   ```bash
   npm run dev
   ```

3. **Install & Run Standalone Backend separately (Optional - Port 3001)**:
   ```bash
   cd backend
   npm install
   npm start
   ```

---

## 📦 Production Build & Deploy

### Building the Project
To compile both the frontend assets and bundle the backend TypeScript server into a production-ready file:
```bash
npm run build
```

### Launching the Production Server
```bash
npm start
```

### Deploy to Google Cloud Run
You can easily package CivicGuard as a container and deploy it to Google Cloud Run:
```bash
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
```
