# 🗺️ Adaptive AI Travel Planner

> **"Your trip shouldn't follow a plan. Your plan should follow your trip."**

An AI-powered travel planning platform that generates personalized, day-by-day itineraries and **dynamically adapts them** when real-world conditions change — weather, delays, budget shifts, attraction closures, and more.

---

## ✨ Features (MVP)

- 🤖 **AI Trip Generation** — Gemini 1.5 Flash generates complete itineraries from your preferences
- 📅 **Day-by-Day Planning** — Time-blocked activities, restaurants, costs, and distances
- 💰 **Smart Budget Management** — Auto-splits budget across categories, monitors spending
- 🗺️ **Route Optimization** — Groups nearby activities to minimize travel time
- 🌦️ **Weather-Aware Planning** — Fetches forecasts and swaps outdoor activities on rainy days
- 💬 **Conversational AI** — Modify your trip with natural language ("Make tomorrow more adventurous")
- 🔄 **Adaptive Replanning** — AI replans affected days when circumstances change
- 💾 **Save & Edit Trips** — Persist trips to Supabase, access from any device

---

## 🏗️ Architecture

```
adaptive-travel-planner/
├── backend/          # FastAPI (Python)
│   ├── main.py
│   ├── routers/      # trips, ai, places, weather
│   ├── services/     # gemini, places, weather, route optimizer, budget
│   ├── models/       # Pydantic schemas
│   └── db/           # Supabase client
│
└── frontend/         # Next.js 14 (TypeScript + Tailwind)
    ├── app/          # App Router pages
    ├── components/   # UI components
    ├── store/        # Zustand state
    ├── hooks/        # Custom React hooks
    └── lib/          # API client, Supabase
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- API keys (see [API Keys](#-api-keys) section)

### 1. Clone & Setup

```bash
cd adaptive-travel-planner
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Create environment file
copy .env.example .env
# Edit .env and fill in all API keys
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
copy .env.local.example .env.local
# Edit .env.local and fill in all values
```

### 4. Database Setup

Run the SQL in `backend/db/schema.sql` in your Supabase project's SQL Editor.

### 5. Run the App

**Terminal 1 — Backend:**
```bash
cd backend
venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 🔑 API Keys

| Service | Purpose | Free Tier | Get Key |
|---------|---------|-----------|---------|
| **Google Gemini** | AI itinerary generation | Yes (generous) | [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| **Supabase** | Database + Auth | Yes (500MB) | [supabase.com](https://supabase.com) |
| **Google Maps** | Maps + Places + Distance | $200/month credit | [console.cloud.google.com](https://console.cloud.google.com/apis/credentials) |
| **OpenWeatherMap** | Weather forecasts | Yes (1000 calls/day) | [openweathermap.org](https://openweathermap.org/api) |

> **Note:** Google Maps requires a billing-enabled GCP account, but you get $200/month free credit which covers typical development usage. The app gracefully degrades if Maps key is not set.

---

## 📡 API Endpoints

### Trips
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/trips/generate` | Generate AI itinerary |
| POST | `/trips/save` | Save trip to database |
| GET | `/trips/{id}` | Get trip by ID |
| PUT | `/trips/{id}` | Update saved trip |
| DELETE | `/trips/{id}` | Delete trip |
| GET | `/trips/user/{user_id}` | List user's trips |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ai/chat` | Conversational itinerary modification |
| POST | `/ai/replan` | Adaptive replanning (weather/delay/budget) |

### Places & Weather
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/places/search` | Search places |
| GET | `/places/nearby` | Nearby places |
| GET | `/weather/{destination}` | 5-day forecast |

---

## 🧠 Adaptive Replanning Scenarios

| Trigger | Example | AI Response |
|---------|---------|-------------|
| **Weather** | "It will rain tomorrow" | Swaps outdoor activities for indoor alternatives |
| **Delay** | "My train is 3 hours late" | Recalculates timing for affected day |
| **Budget** | "I only have ₹4,000 left" | Finds cheaper restaurants, free activities |
| **Closure** | Attraction closed | Replaces with similar nearby attraction |
| **Location** | "I'm at Baga Beach with 3 hours" | Suggests best nearby options |
| **Preference** | "Make it more adventurous" | Swaps activities to match new preference |

---

## 🗺️ Roadmap

### Phase 1 (MVP — Current)
- [x] AI trip generation
- [x] Budget management
- [x] Route optimization
- [x] Weather-aware planning
- [x] Conversational AI modifications
- [x] Adaptive replanning
- [x] Save/load trips
- [x] Google Maps integration

### Phase 2
- [ ] Real-time location tracking
- [ ] Expense tracking
- [ ] Flight/train information (Amadeus API)
- [ ] Hotel recommendations
- [ ] Push notifications
- [ ] Trip sharing

### Phase 3
- [ ] Personal travel memory (learns preferences)
- [ ] Predictive planning (proactive alerts)
- [ ] Group trip collaboration
- [ ] Booking integration

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| State | Zustand |
| Backend | FastAPI, Python 3.11 |
| AI | Google Gemini 1.5 Flash |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Maps | Google Maps JavaScript API |
| Weather | OpenWeatherMap API |
| Optimization | Greedy TSP (Python) |

---

## 📄 License

MIT — Feel free to use this for learning and personal projects.
