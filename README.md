# 🚀 CivicGuard - Community Issue Reporter

CivicGuard is a full-stack web application that helps communities report and track public infrastructure issues like potholes, broken street lights, garbage dumping, and water leaks. It uses **Google Gemini 3.5 Flash** for AI-powered image analysis and **Google Maps Platform** for real-time location mapping.

---

## ✨ Key Features

- 📍 **Interactive Location Mapping** – Issues shown with color-coded pins (Green = Low, Orange = Medium, Red = High severity)
- 🤖 **Gemini AI Image Analysis** – Upload a photo, AI auto-detects category, severity, and writes a description
- 🗺️ **Address Autocomplete** – Powered by Google Maps Places API
- 📊 **Real-time Status Tracking** – Reported → Under Review → In Progress → Resolved
- ☁️ **Firebase Cloud Database** – Reports sync across all devices
- 🌙 **Dark Mode Support** – Fully responsive UI with dark/light themes
- 🔍 **Search & Filter** – Find issues by category, severity, or status

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS |
| **Backend** | Node.js, Express.js |
| **AI** | Google Gemini 3.5 Flash |
| **Maps** | Google Maps JavaScript API, Places API |
| **Database** | Firebase Firestore |
| **Deployment** | Google Cloud Run |

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_MAPS_PLATFORM_KEY=your_google_maps_api_key
REACT_APP_MAPS_API_KEY=your_google_maps_api_key
```

---

## 💻 Local Setup

```bash
# Clone the repository
git clone https://github.com/Bhavi615/Civic-Guard-AI.git
cd Civic-Guard-AI

# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:3000 to view the app.

---

## 📦 Deployment

### Deploy to Google Cloud Run

```bash
gcloud builds submit --tag gcr.io/[PROJECT_ID]/civicguard
gcloud run deploy civicguard \
  --image gcr.io/[PROJECT_ID]/civicguard \
  --platform managed \
  --port 3000 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=[YOUR_KEY],GOOGLE_MAPS_PLATFORM_KEY=[YOUR_KEY]
```

---

## 🗄️ Firebase Setup

1. Create a project on [Firebase Console](https://console.firebase.google.com/)
2. Enable **Firestore Database** in test mode
3. Register a web app and copy the config
4. Create `src/firebase.ts` with your config
5. Run `npm install firebase`

---

## 📁 Project Structure

```
Vibe2Ship/
├── src/
│   ├── components/
│   ├── firebase.ts
│   ├── App.tsx
│   └── main.tsx
├── backend/
│   └── index.js
├── server.ts
├── package.json
└── README.md
```

---

## 📄 License

MIT License — Created for **Vibe2Ship Hackathon**

---

##  Acknowledgments

- Google Gemini AI · Google Maps Platform · Firebase · Google Cloud Run

---

**Live Demo:** https://community-issue-reporter-945410092786.asia-southeast1.run.app  
**GitHub:** https://github.com/Bhavi615/Civic-Guard-AI

---
