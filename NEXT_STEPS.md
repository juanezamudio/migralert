# MigrAlert - Next Steps & Feature Ideas

This document outlines potential features and improvements for the MigrAlert app, compiled during development.

---

## Current Status (Completed Features)

### Core Pages
- **Map View** - Interactive Mapbox map with report markers, real-time updates, report detail modal with user interactions (confirm/inactive/false)
- **Report Submission** - Location detection with reverse geocoding, optional address override with autocomplete, 6 activity types, optional photo upload with compression, description with character limit
- **Alerts** - Emergency contacts management, panic button with hold-to-activate, alert message templates with auto-save, test alerts
- **Auth** - Email and phone authentication, signup, login, password reset, OTP verification
- **Profile/Settings** - User profile, phone verification, language switcher, theme toggle, privacy notice
- **Legal Resources** - Emergency hotlines with click-to-call, legal organizations directory, helpful resources links, find local help
- **Know Your Rights** - Interactive scenario selector (street, home, checkpoint, workplace), do's and don'ts, key phrases to say, constitutional rights card

### Technical Infrastructure
- Supabase backend (auth, database, storage)
- Real-time subscriptions for report updates
- PostGIS for geospatial queries
- Mapbox for maps and geocoding
- i18n support (English, Spanish, Haitian Creole)
- Light/Dark theme with user preference persistence
- PWA support with service worker and install prompts
- Onboarding flow for first-time users

### Recent Updates (December 2024)
- [x] **Legal Resources Page** (`/legal`) - Emergency hotlines, legal organizations, resources
- [x] **Know Your Rights Page** (`/rights`) - Scenario-based guidance with do's/don'ts
- [x] **Onboarding Flow** - 5-step modal overlay on map with language switcher
- [x] **PWA Support** - Service worker, offline caching, install prompts (Android native + iOS instructions)
- [x] **Light Mode** - Theme toggle in settings, CSS variables for both themes
- [x] **Haitian Creole** - Full translation support (3 languages total)
- [x] **Photos Optional** - Report submission no longer requires photo evidence
- [x] **Report Modal** - Changed from bottom sheet to modal for better UX

---

## Priority 1: High Impact Features

### 1. Moderation Dashboard
**Why:** Reports need verification before being shown as "verified" to maintain trust.

**Features:**
- List of pending reports with photos
- Approve/reject actions
- Location verification (photo metadata vs reported location)
- User reputation tracking
- Bulk actions for efficiency

**Implementation:**
- Create `/src/app/admin/moderation/page.tsx`
- Role-based access (moderator/admin roles in Supabase)
- Real-time updates as new reports come in

**Database changes:**
- Add `moderator_id` to reports table
- Add `moderation_notes` field
- Create `user_roles` table

---

## Priority 2: User Experience Improvements

### 2. Push Notifications
**Why:** Users need real-time alerts for nearby activity.

**Features:**
- Notify when new report within user's radius
- Configurable alert radius (1mi, 5mi, 10mi, 25mi)
- Quiet hours setting
- Different notification sounds for different activity types

**Implementation:**
- Set up Firebase Cloud Messaging or OneSignal
- Create notification preferences in profile
- Background sync for location updates
- Service worker for push handling (already in place)

---

### 3. Distance Display on Reports
**Why:** Users want to know how close a report is to them.

**Features:**
- Show "2.3 mi away" on map markers/popups
- Sort reports by distance option
- "Reports within X miles" filter

**Implementation:**
- Distance already calculated in `reports_within_radius` RPC
- Add `distance_miles` to Report type
- Display in modal and any list views

---

### 4. Report Expiration UI
**Why:** Reports expire after a set time, users should see this clearly.

**Features:**
- Visual indicator of time remaining
- "Expires in 2h" badge
- Fade out expired reports on map
- Archive view for recently expired

**Implementation:**
- Add expiration countdown to report detail
- Filter expired reports differently on map
- Consider "extend" option if still active

---

### 5. Enhanced Map Features
**Why:** Better map UX helps users understand the situation.

**Features:**
- Cluster markers when zoomed out
- Heat map view option
- Filter by activity type
- Time-based filter (last hour, last 6h, last 24h)
- Share location button

**Implementation:**
- Use Mapbox clustering
- Add filter UI above map
- Store filter preferences

---

## Priority 3: Future Considerations

### 6. Family/Group Linking
**Why:** Families want to stay connected and share alerts.

**Features:**
- Create family groups
- Share location with group members
- In-app alerts to family when panic button pressed
- See family members on map

---

### 7. Community Verification
**Why:** Crowdsourced verification improves report accuracy.

**Features:**
- "I see this too" confirmations from nearby users
- Confidence score based on confirmations
- Report accuracy history per user
- Trusted reporter badges

---

### 8. Analytics Dashboard (Admin)
**Why:** Understand app usage and report patterns.

**Features:**
- Reports by region/time
- User growth metrics
- Response time analytics
- Hot spot identification

---

### 9. Accessibility Improvements
**Why:** App should be usable by everyone.

**Features:**
- Screen reader optimization
- High contrast mode option
- Larger text option
- Voice-activated panic button

---

### 10. Offline Report Queue
**Why:** Users may need to submit reports in areas with poor connectivity.

**Features:**
- Queue reports when offline
- Auto-sync when connection restored
- Visual indicator of pending uploads
- Retry mechanism for failed uploads

**Implementation:**
- Use IndexedDB for offline storage
- Background sync API
- Service worker already in place

---

## Deployment Notes

### Vercel Deployment Checklist
- [ ] Set environment variables in Vercel dashboard:
  - `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Configure Supabase for production URL
- [ ] Set up custom domain (if applicable)
- [ ] Enable Vercel Analytics
- [ ] Test all auth flows on production URL
- [ ] Verify Supabase RLS policies

### Environment Variables Needed
```
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.xxx
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
```

---

## Technical Debt & Cleanup

- [ ] Add comprehensive error boundaries
- [ ] Implement proper loading skeletons
- [ ] Add unit tests for critical hooks
- [ ] Add E2E tests for auth and report flows
- [ ] Optimize bundle size
- [ ] Add proper TypeScript strict mode compliance

---

## Notes

- All features should maintain EN/ES/HT language support
- Privacy-first approach - minimal data collection
- Performance critical - app must work on low-end devices
- Offline capability important for areas with poor connectivity

---

*Last updated: December 2024*
