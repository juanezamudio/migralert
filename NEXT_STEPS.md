# MigrAlert - Next Steps & Feature Ideas

This document outlines potential features and improvements for the MigrAlert app, compiled during development.

---

## Current Status (Completed Features)

### Core Pages
- **Map View** - Interactive Mapbox map with report markers, real-time updates, report detail bottom sheet with user interactions (confirm/inactive/false)
- **Report Submission** - Location detection with reverse geocoding, optional address override with autocomplete, 6 activity types, photo upload with compression, description with character limit
- **Alerts** - Emergency contacts management, panic button, alert message templates
- **Auth** - Email and phone authentication, signup, login, password reset, OTP verification
- **Profile/Settings** - User profile, phone verification, language switcher (EN/ES), privacy notice

### Technical Infrastructure
- Supabase backend (auth, database, storage)
- Real-time subscriptions for report updates
- PostGIS for geospatial queries
- Mapbox for maps and geocoding
- i18n support (English/Spanish)
- Dark theme UI

---

## Priority 1: High Impact Features

### 1. Legal Resources Page
**Why:** Core to the app's mission - users need quick access to legal help.

**Features:**
- List of immigration legal aid organizations
- "Know Your Rights" quick reference cards
- Emergency legal hotline numbers
- Downloadable PDF resources
- Location-based legal aid finder

**Implementation:**
- Create `/src/app/legal/page.tsx`
- Add content in both EN/ES
- Link from profile page "Legal Resources" button

---

### 2. Know Your Rights Page
**Why:** Users need to know their rights during an encounter.

**Features:**
- Step-by-step guidance for different scenarios
- "What to do if stopped" checklist
- Rights during home visits
- Rights at checkpoints
- Wallet-sized digital card with key phrases

**Implementation:**
- Create `/src/app/rights/page.tsx`
- Visual, easy-to-scan format
- Available offline (critical)

---

### 3. Moderation Dashboard
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

### 4. Push Notifications
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
- Service worker for push handling

---

### 5. Onboarding Flow
**Why:** First-time users need to understand how the app works.

**Screens:**
1. Welcome + app purpose
2. How reports work (view & submit)
3. Emergency alerts explanation
4. Location permission request (with context)
5. Optional account creation prompt

**Implementation:**
- Create `/src/app/onboarding/page.tsx`
- Store completion in localStorage
- Show only on first visit

---

### 6. Distance Display on Reports
**Why:** Users want to know how close a report is to them.

**Features:**
- Show "2.3 mi away" on map markers/popups
- Sort reports by distance option
- "Reports within X miles" filter

**Implementation:**
- Distance already calculated in `reports_within_radius` RPC
- Add `distance_miles` to Report type
- Display in bottom sheet and any list views

---

## Priority 3: Technical Improvements

### 7. PWA Support (Progressive Web App)
**Why:** Users need the app to work offline and be installable.

**Features:**
- Installable on home screen
- Offline access to Know Your Rights content
- Cached map tiles for recent area
- Queue reports when offline, sync when online

**Implementation:**
- Add `manifest.json`
- Set up service worker with Workbox
- Cache critical assets and pages
- Implement background sync for offline reports

---

### 8. Report Expiration UI
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

### 9. Enhanced Map Features
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

## Priority 4: Future Considerations

### 10. Family/Group Linking
**Why:** Families want to stay connected and share alerts.

**Features:**
- Create family groups
- Share location with group members
- In-app alerts to family when panic button pressed
- See family members on map

---

### 11. Community Verification
**Why:** Crowdsourced verification improves report accuracy.

**Features:**
- "I see this too" confirmations from nearby users
- Confidence score based on confirmations
- Report accuracy history per user
- Trusted reporter badges

---

### 12. Analytics Dashboard (Admin)
**Why:** Understand app usage and report patterns.

**Features:**
- Reports by region/time
- User growth metrics
- Response time analytics
- Hot spot identification

---

### 13. Accessibility Improvements
**Why:** App should be usable by everyone.

**Features:**
- Screen reader optimization
- High contrast mode option
- Larger text option
- Voice-activated panic button

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

## Notes

- All features should maintain EN/ES language support
- Privacy-first approach - minimal data collection
- Performance critical - app must work on low-end devices
- Offline capability important for areas with poor connectivity

---

*Last updated: December 2024*
