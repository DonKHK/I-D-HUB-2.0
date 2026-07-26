# I&D Hub

Innovation & Development Hub - A full-stack project management application with web and desktop interfaces.

## Architecture

```
id-hub/
├── backend/         # Node.js + Express API server
├── frontend/        # React + Vite web application
└── desktop/         # Electron desktop wrapper
```

## Getting Started

### Prerequisites
- Node.js v18+
- npm v9+

### Backend Setup
```bash
cd backend
npm install
npm run dev    # Starts on http://localhost:5000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev    # Starts on http://localhost:5173
```

### Desktop Setup
```bash
cd desktop
npm install
npm start      # Launches Electron app
```

## Tech Stack
- **Frontend:** React 19, React Router, Vite
- **Backend:** Node.js, Express 5
- **Desktop:** Electron