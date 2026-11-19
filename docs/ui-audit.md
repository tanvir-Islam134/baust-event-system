# BAUST Event System — UI & Design Audit

**Audit Date:** November 2026  
**Target:** `client/src` (React + Vite + Tailwind CSS)  
**Standard:** Institutional Academic Design Standards (BAUST Realistic UI)  
**Objective:** Eliminate AI-generated design clichés, unify design tokens around official university branding, and plan a disciplined, accessible UI refactor without modifying backend or application business logic.

---

## 1. Inventory of Pages & Components & "AI-Generated" Cliché Assessment

| File / Component Path | Lines | Current Visual Characteristics | AI-Generated Cliché Severity | Why it Looks "AI-Generated" |
| :--- | :--- | :--- | :--- | :--- |
| **`pages/HomePage.jsx`** | 221 | Public landing page, hero section, 4-card feature grid, CTA, footer | **Critical (9/10)** | Multi-stop text gradient (`from-blue-600 via-indigo-600 to-blue-800 bg-clip-text text-transparent`), pulsating animated live dot (`animate-pulse`), giant blurred ambient background blobs (`blur-3xl`), floating emoji icons (`🎟️`, `👥`, `📊`, `📱`), hover-lift effects with colored shadows (`hover:-translate-y-0.5 shadow-blue-500/25`), and generic startup copy ("Campus Life, Connected"). |
| **`components/layout/Navbar.jsx`** | 96 | Fixed top navigation, role indicator, notification bell, user avatar, logout | **Moderate (5/10)** | Placeholder letter "B" square avatar instead of the official BAUST emblem; translucent blurred backdrop (`bg-white/95 backdrop-blur`); hardcoded role-badge switch statement returning mismatched pastel palettes (`purple-100`, `amber-100`, `blue-100`); inline button styling. |
| **`components/layout/Sidebar.jsx`** | 234 | Desktop fixed sidebar and mobile slide-in drawer | **Moderate (5/10)** | Generic dark slate-900 SaaS layout with generic blue-600 active states; placeholder "B" logo; redundant footer duplicating user info already displayed in the top navbar; lack of institutional academic hierarchy. |
| **`pages/LoginPage.jsx`** | 144 | Single-card Google OAuth login & session status | **High (7/10)** | Centered floating rounded-2xl modal card with placeholder "B" badge; developer-internal copy ("test the Phase 1 Authentication flow"); raw inline SVG code; inconsistent border radii. |
| **`pages/EventsPage.jsx`** | 315 | Campus events list, filter bar, admin review queue tabs, rejection modal | **High (8/10)** | Gradient action buttons (`from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700`); emoji prefixes everywhere (`📅`, `➕`, `🏛️`, `📍`, `👥`, `💵`); artificial scale-in modal animations (`animate-scale-in`); hardcoded alert colors and inconsistent table/card padding. |
| **`components/events/StudentEventFeed.jsx`** | 461 | Search input, club filter pills, event card grid | **Critical (9/10)** | Banner fallback uses purple-indigo gradient (`from-blue-700 via-indigo-800 to-slate-950`) with frosted glass icon (`backdrop-blur-md bg-white/10`) and glowing blur orb; every card has `hover:-translate-y-1 hover:shadow-xl`; every card button has a blue-to-indigo gradient; emojis used as icons (`🔍`, `🏛️`, `🎓`, `🎪`, `🍲`, `👕`, `⏰`, `📍`, `📅`); generic "No Events Found" empty state with circus tent emoji `🎪`. |
| **`pages/DashboardPage.jsx`** | 942 | Mega-dashboard for students, organizers, and admins | **Critical (9/10)** | Large decorative hero gradient banner (`from-blue-700 via-blue-800 to-indigo-900`) with blurred circular decorations; floating emojis across every metric, tab, and card (`🏛️`, `➕`, `📋`, `🔔`, `🎉`, `⚠️`, `📅`, `📍`, `📞`, `👕`, `🍲`); monolithic 942-line component with duplicate inline modals, toasts, and buttons. |
| **`pages/EventDetailsPage.jsx`** | 560 | Detailed event overview, registration flow, payment modal | **High (7/10)** | Dark gradient header (`from-slate-900 via-blue-950 to-slate-900`); emojis in payment selectors (`💵 Cash on Arrival`, `📱 bKash Payment`); modals with gimmicky `animate-scale-in` scale animation; duplicate toast and badge components. |
| **`pages/FinancesPage.jsx`** | 520 | Income and expense ledgers, budget summaries, transaction modals | **Moderate (6/10)** | Emojis in ledger tabs (`💵 Incomes`, `🧾 Expenses`); duplicate inline tables and modals; arbitrary button styling and pulse loaders. |
| **`pages/UsersPage.jsx`** | 520 | Admin user management and organizer approval queue | **Moderate (6/10)** | Emojis in metadata (`📞`, `🏛️`); duplicated table rows and badge logic; repetitive inline action buttons. |
| **`pages/CalendarPage.jsx`** | 204 | BigCalendar container with club and category filters | **Moderate (5/10)** | Emojis in headings (`📅`); arbitrary inline `<select>` form controls; inconsistent filter container borders. |
| **`components/ClubOrganizersDirectory.jsx`** | 710 | Directory of clubs and appointed student organizers | **High (8/10)** | Subtle gradients (`from-slate-50 via-indigo-50/20 to-blue-50/30`, `from-indigo-600 to-blue-500`); floating emojis (`🏛️`, `🔒`, `🔍`, `📞`); `animate-pulse` status indicator; frosted glass modal backdrops. |
| **`pages/RegisterPage.jsx`** | 650 | Account completion and organizer request forms | **High (7/10)** | Emojis in role cards (`🎓 Student Account`, `🏛️ Club Organizer`); 20+ repeated input definitions with duplicate inline class strings; glowing submit buttons (`shadow-blue-500/25`). |
| **`pages/ProfilePage.jsx`** | 490 | User profile editing, club request submission, account deletion | **Moderate (5/10)** | Emojis in titles (`🏛️`); repeated form input classes; alert dialogs using native `alert()` alongside inline toasts. |
| **`pages/PendingApprovalPage.jsx`** | 150 | Organizer pending verification screen | **Moderate (5/10)** | Emoji (`🏛️`); centered floating card mimicking consumer onboarding screens instead of official academic verification. |
| **`pages/NotFoundPage.jsx`** | 38 | 404 error page | **Low (3/10)** | Clean layout, but uses generic blue buttons and default slate styling. |

---

## 2. Hard-Coded Colors, Inconsistent Spacing/Radius, and Style Duplication

### A. Hard-Coded Colors & Arbitrary Tailwind Values
1. **Generic Tailwind Blues:** Almost all active elements, focus rings, headers, and primary buttons use standard Tailwind default blue (`bg-blue-600`, `hover:bg-blue-700`, `text-blue-700`, `border-blue-200`) instead of the true university palette.
2. **Arbitrary Opacities and Blurs:**
   - `bg-white/10 backdrop-blur-md border border-white/20` (`StudentEventFeed.jsx:305`, `DashboardPage.jsx:218`)
   - `bg-slate-900/50 backdrop-blur-sm` (`ClubOrganizersDirectory.jsx:622`, `DashboardPage.jsx:890`)
   - `bg-black/50 backdrop-blur-sm` (`StudentEventFeed.jsx:351`)
3. **Hard-Coded Alert Colors:**
   - Success: `bg-emerald-600 text-white border-emerald-700`
   - Warning: `bg-amber-100 text-amber-800 border-amber-200`
   - Danger: `bg-rose-600 text-white border-rose-700`
   - These are hard-coded inline across 9 different files rather than using a centralized `<Badge>` or `<Toast>` component.

### B. Inconsistent Spacing and Border Radii
- **Border Radii Chaos:**
  - Cards: Mixed arbitrarily between `rounded-xl`, `rounded-2xl`, and `rounded-3xl` (`DashboardPage.jsx:216` has `rounded-2xl`, while internal modals use `rounded-2xl`, cards in `StudentEventFeed.jsx` use `rounded-2xl`, and form inputs use `rounded-lg` or `rounded-xl`).
  - Buttons: Some buttons use `rounded-lg` (`Navbar.jsx:88`), others use `rounded-xl` (`HomePage.jsx:85`, `EventsPage.jsx:124`), others use `rounded-md` (`Sidebar.jsx:53`).
  - Badges: Mixed between `rounded-md`, `rounded-lg`, and `rounded-full`.
- **Inconsistent Paddings:**
  - Page containers use `p-4 sm:p-6 lg:p-8`, but cards vary between `p-4`, `p-5`, `p-6`, and `p-8` with no grid rhythm.

### C. Duplicated Component Patterns (To Be Replaced with Shared UI Components)
1. **Button Duplication:** Primary, secondary, outline, danger, and icon buttons are redefined inline with 40+ characters of Tailwind classes in at least 50 places across `client/src`.
2. **Input & Select Duplication:** Form inputs in `RegisterPage.jsx`, `OrganizerCreateEvent.jsx`, `ProfilePage.jsx`, and filter bars repeat `w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500` dozens of times.
3. **Modal Duplication:** `EventsPage.jsx`, `DashboardPage.jsx`, `ClubOrganizersDirectory.jsx`, `FinancesPage.jsx`, and `EventDetailsPage.jsx` each manually implement full-screen backdrop overlays, modal cards, cancel buttons, and close handlers.
4. **Toast Duplication:** `EventsPage.jsx`, `DashboardPage.jsx`, `FinancesPage.jsx`, and `UsersPage.jsx` implement their own `fixed top-5 right-5 z-50` toast notification UI with copy-pasted timeout timers.
5. **Empty State Duplication:** Every page implements a custom empty box with arbitrary SVGs or emojis and custom text styling.
6. **Skeleton / Loading Duplication:** Loading spinners (`animate-spin border-3 border-indigo-600 border-t-transparent`) and pulse bars are hand-crafted across individual screens.

---

## 3. Violations of Realistic Institutional UI Standards

### A. Decorative Gradients
- `bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900` (`DashboardPage.jsx:216`)
- `bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700` (`EventsPage.jsx:124`, `StudentEventFeed.jsx:433`)
- `bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 bg-clip-text text-transparent` (`HomePage.jsx:72`)
- `bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900` (`EventDetailsPage.jsx:201`)
- `bg-gradient-to-r from-slate-50 via-indigo-50/20 to-blue-50/30` (`ClubOrganizersDirectory.jsx:177`)
- `bg-gradient-to-tr from-indigo-600 to-blue-500` (`ClubOrganizersDirectory.jsx:405`)
- *Resolution:* Replace all multi-hue decorative gradients with solid institutional backgrounds (`bg-baust-green-800`, `bg-baust-navy-900`, or clean white/slate surfaces `bg-white`, `bg-slate-50` with crisp borders `border-slate-200`).

### B. Floating Emojis Used as Icons
- `🏛️` (Club/Society indicator) — appears 16 times in `ClubOrganizersDirectory`, `DashboardPage`, `EventDetailsPage`, `EventsPage`, `ProfilePage`, `UsersPage`, `RegisterPage`.
- `📅` (Calendar/Date) — appears 9 times in `CalendarPage`, `EventsPage`, `DashboardPage`, `StudentEventFeed`.
- `👥` (Capacity/People) — appears 5 times.
- `💵`, `🧾` (Finances/Fees/Receipts) — appears 6 times in `FinancesPage`, `EventsPage`, `EventDetailsPage`.
- `📞` (Phone number) — appears 4 times in `UsersPage`, `ClubOrganizersDirectory`, `DashboardPage`.
- `🎉`, `⚠️`, `🔒`, `🔍`, `🔔`, `👕`, `🍲`, `🍱`, `🏁`, `🎟️`, `📊`, `📱`, `🎓`, `🎪` — scattered across all screens.
- *Resolution:* Replace all emojis with crisp, lightweight SVG icons (using stroke widths of 1.5–2px, solid sizing `w-4 h-4` or `w-5 h-5`, properly aligned with text).

### C. Gimmick Animations & Hover-Lift Effects
- `transform hover:-translate-y-0.5` / `hover:-translate-y-1` (`HomePage.jsx:85`, `StudentEventFeed.jsx:290`)
- `animate-fade-in` (`HomePage.jsx:65`, `EventsPage.jsx:90`, `ClubOrganizersDirectory.jsx:159`)
- `animate-scale-in` (`EventsPage.jsx:271`, `FinancesPage.jsx:399`, `EventDetailsPage.jsx:385`)
- `animate-pulse` (`HomePage.jsx:66`, `ClubOrganizersDirectory.jsx:200`)
- *Resolution:* Eliminate bounce, scale-in, and lift effects. Keep transitions limited to subtle color shifts (`transition-colors duration-150`) and essential spinner indicators for active network requests.

### D. Generic & Casual Copy
- "Campus Life, Connected. Discover & Organize Events with Ease." (Marketing tagline)
- "Queue is Clear!" (Casual greeting)
- "Temporary Login Page - test the Phase 1 Authentication flow" (Internal developer note exposed to users)
- "Oops! Something went wrong" / "Failed to fetch" (Vague error handling)
- "Submit" / "Sign in with your Google account to test..." (Unclear button and instruction copy)
- *Resolution:* Rewrite all copy following institutional university guidelines: clear, professional, concise, role-appropriate, and actionable.

---

## 4. BAUST Brand Identity & Typography Specifications

### A. Authentic University Color Palette (Extracted from BAUST Crest)
From digital sampling of the official university seal:
- **Primary Brand Color (BAUST Green):** `#00904C` (Bangladesh Army University of Science and Technology core heraldic green)
- **Secondary Brand Color (Emblem Navy):** `#2F3191` (BAUST gear wheel and academic crest navy)
- **Accent Gold / Yellow (Lettering Gold):** `#F4EE0E` / `#D4A017` (Used sparingly for highlights, verified badges, active states)
- **Accent Crimson (Inner Crest Red):** `#DD3029` (Used for critical alerts, deadlines, and error indicators)

#### Proposed Tailwind Token Configuration:
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        baust: {
          green: {
            50: '#eef9f2',
            100: '#d7f1e2',
            200: '#b2e4c7',
            300: '#7fd0a5',
            400: '#46b67e',
            500: '#00904c', // Official BAUST Crest Green
            600: '#008043',
            700: '#006636',
            800: '#00512c',
            900: '#004225',
            950: '#002514',
          },
          navy: {
            50: '#f0f2fa',
            100: '#dee3f4',
            200: '#c2caec',
            300: '#9aa8e0',
            400: '#6c7fd0',
            500: '#2f3191', // Official BAUST Emblem Navy
            600: '#28277f',
            700: '#222068',
            800: '#1d1b54',
            900: '#1b1a47',
            950: '#0f0e2b',
          },
          gold: {
            50: '#fefee8',
            100: '#fdfcc5',
            200: '#fbf98e',
            300: '#f7f24d',
            400: '#f4ee0e', // Crest Lettering Yellow
            500: '#d4a017',
            600: '#b8860b',
            700: '#8c6206',
          },
        },
      },
    },
  },
};
```

### B. Typography & Bilingual Font Stack (English & Bangla)
To provide native, crisp rendering of English university materials alongside official Bangla notices, club names, and event descriptions:
- **Font Stack:**
  ```css
  font-family: 'Inter', 'Hind Siliguri', 'Noto Sans Bengali', 'SolaimanLipi', system-ui, -apple-system, sans-serif;
  ```
- Google Fonts Import to add to `index.css`:
  ```css
  @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');
  ```
- **Typography Scale:**
  - Page Titles: `text-xl sm:text-2xl font-bold text-slate-900 tracking-tight`
  - Section Headers: `text-base sm:text-lg font-semibold text-slate-800`
  - Card Titles: `text-sm sm:text-base font-semibold text-slate-900`
  - Body Text: `text-sm text-slate-600 leading-normal`
  - Meta/Subtitles: `text-xs text-slate-500`
  - Microcopy/Badges: `text-[11px] font-medium tracking-wide uppercase`

---

## 5. UI Shared Components Specification (`client/src/components/ui/`)

To eliminate inline style duplication across all pages, 9 shared atomic components will be established:

1. **`Button.jsx`**
   - *Variants:* `primary` (`bg-baust-green-700 hover:bg-baust-green-800 text-white`), `secondary` (`bg-slate-100 hover:bg-slate-200 text-slate-800`), `outline` (`border border-slate-300 hover:bg-slate-50 text-slate-700`), `danger` (`bg-rose-600 hover:bg-rose-700 text-white`), `ghost` (`text-slate-600 hover:bg-slate-100`).
   - *Sizes:* `sm` (px-3 py-1.5 text-xs), `md` (px-4 py-2 text-sm), `lg` (px-5 py-2.5 text-base).
   - *States:* `loading` (with built-in spinner), `disabled`.
2. **`Input.jsx`**
   - Standardized input with label, helper text, error message, required indicator, and focus ring in `focus:ring-baust-green-500/20 focus:border-baust-green-600`.
3. **`Badge.jsx`**
   - Standardized status pill with semantic variants: `success` (green), `warning` (amber), `danger` (rose), `info` (navy), `neutral` (slate). Solid and subtle styles.
4. **`Card.jsx`**
   - Solid container with clean border (`border-slate-200`), crisp surface (`bg-white`), subtle shadow (`shadow-xs` / `shadow-sm`), and subcomponents (`Card.Header`, `Card.Body`, `Card.Footer`).
5. **`Table.jsx`**
   - Accessible table wrapper with alternating subtle rows, sticky header support, and consistent cell padding (`px-4 py-3 text-xs sm:text-sm`).
6. **`Modal.jsx`**
   - Accessible dialog with backdrop overlay (`bg-slate-900/40 backdrop-blur-[2px]`), Esc key listener, focus lock, header, body, and footer button rows.
7. **`Toast.jsx`**
   - Standardized notification alert with error, success, and info themes, auto-dismiss, and explicit close button.
8. **`EmptyState.jsx`**
   - Standard empty state layout with institutional icon (calendar, document, user), primary headline, descriptive explanation, and optional action button.
9. **`Skeleton.jsx`**
   - Accessible content placeholder bars and cards with subtle shimmer (`bg-slate-200/70`) for loading states.

---

## 6. App Shell Wireframes (Navbar, Sidebar & Login)

### Desktop Wireframe (1280px+)
```text
+---------------------------------------------------------------------------------------------------------+
| [BAUST Logo] BAUST Event Portal   | Saidpur Cantonment      | [Bell] [User Avatar: Name (Role)] [Sign Out] | (Navbar - 56px)
+-----------------------------------+-------------------------+-------------------------------------------+
| SIDEBAR (240px)                   | MAIN CONTENT AREA (max-w-7xl mx-auto)                                |
|                                   |                                                                     |
| -- Academic Navigation --         | Breadcrumbs: Home / Events / Event Management                       |
| [Icon] Dashboard                  |                                                                     |
| [Icon] All Events                 | +-----------------------------------------------------------------+ |
| [Icon] Event Calendar             | | Page Header Title                            [Primary Action]   | |
|                                   | +-----------------------------------------------------------------+ |
| -- Club & Admin (Role Scoped) --  | | Filter Bar / Tabs: [All Events] [Pending Review (2)] [Archive]  | |
| [Icon] Manage Events              | +-----------------------------------------------------------------+ |
| [Icon] Create Event               | | Structured Table / Card Grid Layout                             | |
| [Icon] Event Finances             | | - Clean border-slate-200, no drop-shadow glow                   | |
| [Icon] User Approvals             | | - Crisp SVG icons, no floating emojis                           | |
|                                   | | - High information density & readable contrast                  | |
| -- Account Settings --            | +-----------------------------------------------------------------+ |
| [Icon] User Profile               |                                                                     |
|                                   |                                                                     |
| [User Mini Footer]                | Footer: (c) 2026 Bangladesh Army University of Science & Technology |
+-----------------------------------+---------------------------------------------------------------------+
```

### Mobile Wireframe (360px viewport)
```text
+-----------------------------------------+
| [=] [BAUST Logo] BAUST Events   [Avatar]|  (Mobile Top App Bar - 52px)
+-----------------------------------------+
| Page Title                              |
| [Filter Dropdown]  [+ Action Button]    |
+-----------------------------------------+
| Card 1: Event Title                     |
| Club: Computer Club | Date: Nov 25, 2026|
| Venue: Central Auditorium               |
| Status: [Approved Badge]   Fee: ৳ 200   |
| [ View Details & Register Button ]      |
+-----------------------------------------+
| Card 2: Event Title                     |
| Club: Robotics Club | Date: Dec 02, 2026|
| Venue: EEE Lab 02                       |
| Status: [Free Admission]                |
| [ View Details & Register Button ]      |
+-----------------------------------------+
| Drawer Menu (When [=] Hamburger tapped):|
| - Top: BAUST Crest & Saidpur Cantonment |
| - Navigation List: Dashboard, Events... |
| - Role Section (Admin / Organizer)      |
| - Sign Out button at bottom             |
+-----------------------------------------+
```

---

## 7. Proposed Page Redesign Sequence

The refactor will proceed strictly screen by screen. After each page is refactored, `npm run build` will be executed in `client/` to verify zero regressions.

1. **Phase 1: Design Tokens & Shared UI Component Library (Foundation)**
   - Setup `client/tailwind.config.js` with official BAUST colors (`#00904C`, `#2F3191`, `#F4EE0E`) and typography.
   - Configure bilingual font stack (`Inter` + `Hind Siliguri`) in `index.css`.
   - Build 9 atomic UI components in `client/src/components/ui/`.
   - Run verification build: `npm run build`.

2. **Phase 2: App Shell Redesign (Immediate Global Visual Impact)**
   - `client/src/components/layout/Navbar.jsx`
   - `client/src/components/layout/Sidebar.jsx`
   - `client/src/components/layout/MainLayout.jsx`
   - `client/src/pages/LoginPage.jsx`
   - Replace "B" placeholder squares with actual institutional branding; implement high-contrast academic role badges; verify responsive mobile drawer.
   - Run verification build: `npm run build`.

3. **Phase 3: Events Catalog & Feed (`EventsPage.jsx` & `StudentEventFeed.jsx`)**
   - Redesign `EventsPage.jsx` (UI only): tab headers, review queue cards, rejection modal.
   - Redesign `StudentEventFeed.jsx`: replace purple/indigo gradient banner with clean academic header, replace emojis with SVG icons, replace hover-lift cards with crisp border cards, implement proper `Skeleton`, `EmptyState`, and offline state handling.
   - Run verification build: `npm run build`.

4. **Phase 4: Landing Page (`HomePage.jsx`)**
   - Strip out text clip gradients, glowing background blobs, and floating emojis.
   - Implement disciplined institutional hero section with direct call to action and structured feature grid.
   - Run verification build: `npm run build`.

5. **Phase 5: Event Details & Registration (`EventDetailsPage.jsx`)**
   - Redesign event banner, details grid, schedule metadata, and registration/payment dialogs.
   - Run verification build: `npm run build`.

6. **Phase 6: Dashboard & Operations (`DashboardPage.jsx`)**
   - Replace giant gradient hero with institutional statistics overview.
   - Clean up tabs, pending applications table, and participant management.
   - Run verification build: `npm run build`.

7. **Phase 7: Administration, Management & Directory**
   - `FinancesPage.jsx`: Financial ledgers and transaction modals.
   - `UsersPage.jsx`: User directories and role approval queues.
   - `ClubOrganizersDirectory.jsx`: Club roster and organizer listings.
   - `OrganizerCreateEvent.jsx` & `OrganizerManageEvents.jsx`: Standardize form fields with `<Input />` and `<Button />`.
   - Run verification build: `npm run build`.

8. **Phase 8: Ancillary Pages & Final Copy Cleanup**
   - `CalendarPage.jsx`, `ProfilePage.jsx`, `RegisterPage.jsx`, `PendingApprovalPage.jsx`, `NotFoundPage.jsx`.
   - Global scan across all JSX files to confirm zero remaining emojis-as-icons, generic "Submit"/"Oops" messages, or decorative gradients.
   - Final production verification: `npm run build`.
