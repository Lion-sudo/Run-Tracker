# 🏃 Run Tracker | [Live Demo](https://run-tracker-lion.vercel.app/)

A lightweight, mobile-first web application designed to help runners map their routes, track their distances, and visualize their progress with a premium, modern design.

![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=flat-square&logo=vite)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=flat-square&logo=supabase)
![Leaflet](https://img.shields.io/badge/Leaflet-Maps-199900?style=flat-square&logo=leaflet)

---

## 📺 Demo

<div align="center">
  <img src="assets/demo-light.gif" width="49.5%" alt="Light Mode Demo" />
  <img src="assets/demo-dark.gif" width="49.5%" alt="Dark Mode Demo" />
</div>

---

## ✨ Key Features

- **📍 Interactive Route Planning:** Click on the map to draw routes. The app automatically calculates the exact pedestrian path using the OSRM API.
- **📈 Visual Insights:** Analyze your progress with weekly, monthly, and yearly stats.
- **🔥 Interactive Heatmap:** Visualize your most frequent running areas with a dynamic heat layer.
- **📸 Story Mode:** Export beautiful, social-media-ready images of your routes and heatmaps.
- **🌓 Dark Mode:** Full support for light and dark themes, including dynamic map tile inversion and story exports in both modes.
- **📱 Mobile-First Design:** Optimized for a seamless experience on both mobile and desktop devices.
- **⛰️ Modern UI:** Unique design featuring custom topographic contour lines and smooth animations.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Maps:** Leaflet, React-Leaflet, OpenStreetMap
- **Routing:** OSRM (Open Source Routing Machine) API
- **Backend / Auth / Database:** Supabase (PostgreSQL)
- **Styling:** CSS Modules, Topographic UI elements
- **Image Export:** html2canvas

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Lion-sudo/Run-Tracker.git
   cd Run-Tracker
   ```

2. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Environment Setup:**
   Create a `.env` file in the `frontend` directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```

---

## 📁 Project Structure

```text
frontend/
├── public/  # Static assets
├── src/
│   ├── components/   # UI Components (Map, History, Insights, etc.)
│   ├── context/      # Theme Context
│   ├── App.tsx       # Main App component & Routing
│   ├── main.tsx      # Entry point
│   ├── supabaseClient.ts # Supabase configuration
├── index.html        # HTML template
├── package.json      # Dependencies and scripts
└── vite.config.ts    # Vite configuration
```

---

## 🛡️ Privacy

Run Tracker respects your privacy. All route data is securely stored in your personal Supabase account and is only accessible by you. You have full control over your data, including the ability to export or delete your entire history at any time.

---

## 👨‍💻 Developer

Created by [Lion Abramov](https://github.com/Lion-sudo).

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
