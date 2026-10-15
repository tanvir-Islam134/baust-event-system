Project: BAUST_EVENT_SYSTEM, the BAUST university event management system.
Stack: Cloud Firestore (via firebase-admin on the server), Firebase Auth (Google sign-in),
Express (Node 20, ESM), React (Vite) + Tailwind, PWA via vite-plugin-pwa.
Do NOT use MongoDB or Mongoose.
Layout:
BAUST_EVENT_SYSTEM/
  server/   (package name "baust-event-system-server")
  client/   (package name "baust-event-system-client")
Rules:
- REST API under /api/v1 with route/controller/service/repository separation.
  Controllers never call Firestore directly.
- Zod validation on every input.
- Centralized error handler, helmet, CORS, rate limiting.
- Secrets only via dotenv. Commit .env.example, never .env.
- Our own JWT after Firebase token verification. Role middleware: admin | organizer | participant | guest.
- The client never reads or writes Firestore directly (rules deny it). All data goes through Express.
- Use Firestore transactions for anything that must be atomic (capacity, conflicts, payments, scans).
- Add a short README section and a test or manual test checklist per feature.
- Ask before adding any new dependency.