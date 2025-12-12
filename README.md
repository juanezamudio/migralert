# MigrAlert

Community-powered safety alerts to protect families and communities.

## Overview

MigrAlert is a mobile-first Progressive Web App (PWA) that allows community members to report and view real-time information about immigration enforcement activity. The app also includes an emergency alert system to quickly notify loved ones if someone is detained.

## Features

### Phase 1 (MVP) - Current
- Real-time map view of active reports
- Submit reports with photo evidence and location verification
- Moderator verification system
- English/Spanish language support
- PWA installable on any device

### Phase 2 - Planned
- User accounts
- Emergency contacts management
- Panic button with SMS alerts
- Push notifications for nearby activity

### Phase 3 - Planned
- Community verification (confirm/deny reports)
- Confidence scoring system
- Know-your-rights resources
- Legal aid directory

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL + PostGIS + Auth + Realtime)
- **Maps:** Mapbox GL JS
- **SMS:** Twilio (Phase 2)
- **Hosting:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Mapbox account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/migralert.git
cd migralert
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment template and add your keys:
```bash
cp .env.example .env.local
```

4. Update `.env.local` with your credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your-mapbox-token
```

5. Set up the database:
   - Create a new Supabase project
   - Run the migration in `supabase/migrations/001_initial_schema.sql`
   - Enable the PostGIS extension in your Supabase dashboard

6. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
migralert/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx            # Home/Map view
│   │   ├── report/             # Submit report
│   │   ├── alerts/             # Emergency alerts
│   │   ├── profile/            # Settings
│   │   └── auth/               # Authentication
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   ├── layout/             # Layout components
│   │   ├── map/                # Map components
│   │   └── reports/            # Report-related components
│   ├── lib/
│   │   ├── supabase/           # Supabase client config
│   │   ├── mapbox/             # Map utilities
│   │   └── utils/              # Helper functions
│   ├── hooks/                  # Custom React hooks
│   ├── types/                  # TypeScript types
│   └── i18n/                   # Translations (en.json, es.json)
├── supabase/
│   └── migrations/             # Database migrations
└── public/
    ├── manifest.json           # PWA manifest
    └── icons/                  # App icons
```

## Database Schema

The app uses PostgreSQL with PostGIS for geographic queries:

- **reports** - Incident reports with location, type, and verification status
- **profiles** - User profiles extending Supabase Auth
- **emergency_contacts** - User's emergency contacts (up to 5)
- **alert_config** - Emergency alert message configuration
- **report_interactions** - Community confirmations/disputes
- **user_connections** - Connected users for in-app alerts

See `supabase/migrations/001_initial_schema.sql` for the complete schema.

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a PR.

## Privacy

MigrAlert is built with privacy as a core principle:
- Minimal data collection
- No location tracking or storage tied to user identity
- Anonymous report submission supported
- End-to-end considerations for sensitive data

## License

MIT

## Disclaimer

This app is intended to help community members stay informed and safe. Always follow local laws and consult with legal professionals for advice about your specific situation.
