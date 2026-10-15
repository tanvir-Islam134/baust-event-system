# BAUST Event System

University Event Management System for Bangladesh Army University of Science and Technology (BAUST).

## Monorepo Architecture

```text
BAUST_EVENT_SYSTEM/
├── server/       # Express backend (ESM, Cloud Firestore via firebase-admin, REST API)
├── client/       # React (Vite) frontend (Tailwind CSS, PWA, Firebase Auth)
├── firestore.rules
├── firestore.indexes.json
└── README.md
```

## Tech Stack

- **Backend (`server/`)**:
  - Node.js (v20+ / ESM)
  - Express.js
  - Cloud Firestore (via `firebase-admin` on the server)
  - Firebase Authentication (token verification)
  - Security & Middleware: Helmet, CORS, Express Rate Limit, Zod validation
  - Layered architecture: Routes -> Controllers -> Services -> Repositories (controllers never query Firestore directly)
- **Frontend (`client/`)**:
  - React (Vite)
  - Tailwind CSS
  - React Router
  - Firebase Web SDK (Auth only — no direct Firestore access)
  - Axios with JWT request & response interceptors
  - Progressive Web App (`vite-plugin-pwa`)

## Firestore Security Policy

Direct reads and writes from the client SDK are strictly disabled in `firestore.rules`. All data access must pass through the Express REST API (`/api/v1`) using `firebase-admin`.

## Getting Started

### 1. Setup Backend
```bash
cd server
cp .env.example .env
npm install
npm run dev
```

### 2. Setup Frontend
```bash
cd client
cp .env.example .env
npm install
npm run dev
```

### 3. Root Workspace Commands
From the project root:
```bash
npm install
npm run dev
```

