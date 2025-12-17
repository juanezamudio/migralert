# App Store Deployment Guide

This guide explains how to set up automated builds and deployments to the Apple App Store and Google Play Store using Fastlane and GitHub Actions.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [iOS Setup](#ios-setup)
- [Android Setup](#android-setup)
- [GitHub Secrets Configuration](#github-secrets-configuration)
- [Triggering Builds](#triggering-builds)
- [Troubleshooting](#troubleshooting)

---

## Overview

The CI/CD pipeline uses:

- **Capacitor** - Wraps the Next.js web app into native iOS/Android projects
- **Fastlane** - Handles building, code signing, and uploading to app stores
- **GitHub Actions** - Runs Fastlane in the cloud (no local resources needed)

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Actions                          │
│                                                             │
│  1. Checkout code                                           │
│  2. Build Next.js (npm run build)                           │
│  3. Sync to Capacitor (npx cap sync)                        │
│  4. Run Fastlane (build, sign, upload)                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
      ┌──────────────┐               ┌──────────────┐
      │  App Store   │               │  Play Store  │
      │  (TestFlight)│               │  (Internal)  │
      └──────────────┘               └──────────────┘
```

---

## Prerequisites

### Required Accounts

| Account | Cost | URL |
|---------|------|-----|
| Apple Developer Program | $99/year | https://developer.apple.com/programs/ |
| Google Play Developer | $25 one-time | https://play.google.com/console/ |
| GitHub (for Actions) | Free | https://github.com |

### Required Tools (for initial setup only)

- Xcode (for creating certificates) - Mac only
- A private GitHub repository for iOS certificates (used by Fastlane Match)

---

## iOS Setup

### Step 1: Create App Store Connect API Key

The API key allows Fastlane to authenticate with App Store Connect without your password.

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Click **Users and Access** → **Keys** tab → **App Store Connect API**
3. Click the **+** button to create a new key
4. Name it `Fastlane CI` and select **Admin** access
5. Click **Generate**
6. **Download the .p8 file** (you can only download it once!)
7. Note down:
   - **Key ID** (shown in the table, e.g., `ABC123XYZ`)
   - **Issuer ID** (shown at the top of the page)

**Convert the .p8 key to Base64:**

```bash
base64 -i AuthKey_ABC123XYZ.p8 | tr -d '\n'
```

This output is your `ASC_KEY_CONTENT` secret.

### Step 2: Get Your Team IDs

**Apple Team ID:**
1. Go to [Apple Developer Account](https://developer.apple.com/account)
2. Look at the URL or Membership page
3. Your Team ID looks like: `ABC123DEF4`

**App Store Connect Team ID (ITC_TEAM_ID):**
1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Open browser developer tools (F12) → Network tab
3. Refresh the page
4. Look for requests to `itc/` endpoints
5. Find `itcTeamId` in the response, or check the URL

Alternatively, run this Fastlane command locally:
```bash
fastlane produce
# It will show your team IDs during the process
```

### Step 3: Set Up Fastlane Match (Code Signing)

Match stores your certificates and provisioning profiles in a private Git repository, allowing GitHub Actions to access them.

**Create a private repository for certificates:**
1. Create a new **private** GitHub repository (e.g., `migralert-certificates`)
2. Don't add any files to it

**Initialize Match:**
```bash
cd ios/App
bundle install
bundle exec fastlane match init
```

When prompted:
- Select **git** as storage mode
- Enter your certificates repo URL: `https://github.com/YOUR_USERNAME/migralert-certificates.git`

**Generate certificates:**
```bash
bundle exec fastlane match appstore
```

This will:
- Create a distribution certificate
- Create an App Store provisioning profile
- Encrypt and store them in your private repo

You'll be asked to create a passphrase - save this as `MATCH_PASSWORD`.

### Step 4: Create Your App in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com/) → **My Apps**
2. Click **+** → **New App**
3. Fill in:
   - Platform: iOS
   - Name: MigrAlert
   - Primary Language: English (U.S.)
   - Bundle ID: `com.migralert.app`
   - SKU: `migralert-ios`
4. Click **Create**

---

## Android Setup

### Step 1: Create a Signing Keystore

The keystore is used to sign your app. **Keep it safe - you cannot change it later!**

```bash
keytool -genkey -v -keystore release.keystore -alias migralert -keyalg RSA -keysize 2048 -validity 10000
```

When prompted, enter:
- Keystore password (save as `ANDROID_KEYSTORE_PASSWORD`)
- Your name, organization, etc.
- Key password (save as `ANDROID_KEY_PASSWORD`)

**Convert to Base64:**
```bash
base64 -i release.keystore | tr -d '\n'
```

This output is your `ANDROID_KEYSTORE_BASE64` secret.

**Important:** Back up your keystore file securely. If you lose it, you cannot update your app on the Play Store.

### Step 2: Create Your App in Google Play Console

1. Go to [Google Play Console](https://play.google.com/console/)
2. Click **Create app**
3. Fill in:
   - App name: MigrAlert
   - Default language: English (US)
   - App or game: App
   - Free or paid: Free
4. Accept the declarations
5. Click **Create app**

### Step 3: Create a Service Account for API Access

This allows Fastlane to upload builds to Play Store.

**In Google Cloud Console:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Go to **IAM & Admin** → **Service Accounts**
4. Click **Create Service Account**
5. Name it `fastlane-deploy`
6. Click **Create and Continue**
7. Skip the optional steps, click **Done**
8. Click on the created service account
9. Go to **Keys** tab → **Add Key** → **Create new key**
10. Select **JSON** and click **Create**
11. Save the downloaded JSON file

**In Google Play Console:**

1. Go to [Play Console](https://play.google.com/console/) → **Settings** → **API access**
2. Click **Link** to link your Google Cloud project
3. Under **Service accounts**, find your `fastlane-deploy` account
4. Click **Grant access**
5. Set permissions:
   - **App permissions**: Select your app → **Admin** (all permissions)
   - Or at minimum: Release to production, Manage testing tracks
6. Click **Invite user** → **Send invite**

**Get the JSON key content:**

Open the downloaded JSON file and copy its entire contents. This is your `GOOGLE_PLAY_JSON_KEY` secret.

### Step 4: Complete Store Listing (Required Before First Upload)

Before you can upload your first build, you need to complete the store listing:

1. In Play Console, go to your app
2. Complete all sections under **Grow** → **Store presence** → **Main store listing**:
   - App name
   - Short description
   - Full description
   - Screenshots (phone, 7-inch tablet, 10-inch tablet)
   - Feature graphic (1024x500)
   - App icon (512x512)
3. Complete **App content** sections:
   - Privacy policy URL
   - App access (if app requires login)
   - Ads declaration
   - Content rating questionnaire
   - Target audience
   - News apps (if applicable)
   - Data safety

---

## GitHub Secrets Configuration

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### iOS Secrets

| Secret Name | Value | How to Get |
|-------------|-------|------------|
| `ASC_KEY_ID` | API Key ID (e.g., `ABC123XYZ`) | App Store Connect → Keys |
| `ASC_ISSUER_ID` | Issuer ID (UUID format) | App Store Connect → Keys (top of page) |
| `ASC_KEY_CONTENT` | Base64-encoded .p8 file | `base64 -i AuthKey_XXX.p8 \| tr -d '\n'` |
| `APPLE_ID` | Your Apple ID email | Your login email |
| `APPLE_TEAM_ID` | Team ID (e.g., `ABC123DEF4`) | Developer Account → Membership |
| `ITC_TEAM_ID` | App Store Connect Team ID | Same as APPLE_TEAM_ID for most accounts |
| `MATCH_GIT_URL` | Certificates repo URL | `https://github.com/USER/migralert-certificates.git` |
| `MATCH_PASSWORD` | Match encryption passphrase | Created during `fastlane match init` |

### Android Secrets

| Secret Name | Value | How to Get |
|-------------|-------|------------|
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded keystore | `base64 -i release.keystore \| tr -d '\n'` |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password | Created with `keytool` |
| `ANDROID_KEY_ALIAS` | Key alias | `migralert` (or what you specified) |
| `ANDROID_KEY_PASSWORD` | Key password | Created with `keytool` |
| `GOOGLE_PLAY_JSON_KEY` | Full JSON content | Service account JSON file contents |

### App Environment Secrets

| Secret Name | Value | How to Get |
|-------------|-------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Your Mapbox access token | Mapbox Dashboard → Access tokens |

---

## Triggering Builds

### Option 1: Push a Version Tag (Recommended)

This triggers both iOS and Android builds automatically:

```bash
# Make sure all changes are committed
git add .
git commit -m "Prepare release v1.0.0"

# Create and push a version tag
git tag v1.0.0
git push origin main
git push origin v1.0.0
```

### Option 2: Manual Trigger

1. Go to your GitHub repository → **Actions**
2. Select **Build & Deploy iOS** or **Build & Deploy Android**
3. Click **Run workflow**
4. Choose the lane:
   - `beta` - Upload to TestFlight / Internal Testing
   - `release` - Upload to App Store / Production
   - `build_apk` (Android only) - Build APK for manual testing
5. Click **Run workflow**

### Build Outputs

After a successful build, you can download artifacts:

1. Go to **Actions** → Click on the completed workflow run
2. Scroll to **Artifacts**
3. Download `MigrAlert-iOS` or `MigrAlert-Android-AAB`

---

## Troubleshooting

### iOS Issues

**"No matching provisioning profile found"**
- Run `fastlane match appstore --force` locally to regenerate profiles
- Make sure `MATCH_GIT_URL` and `MATCH_PASSWORD` are correct

**"The bundle identifier is not available"**
- The app ID `com.migralert.app` may already be taken
- Register it manually in Apple Developer Portal → Identifiers

**"App Store Connect API key not found"**
- Verify `ASC_KEY_ID`, `ASC_ISSUER_ID`, and `ASC_KEY_CONTENT` are correct
- Make sure the .p8 key was base64-encoded without newlines

### Android Issues

**"Error: Could not find google-services.json"**
- This file is optional for Capacitor apps without Firebase
- If using Firebase, add the file to `android/app/`

**"Keystore was tampered with, or password was incorrect"**
- Double-check `ANDROID_KEYSTORE_PASSWORD`
- Ensure the keystore was base64-encoded correctly

**"APK not found" or "AAB not found"**
- Check the build logs for Gradle errors
- Ensure Java 17 is being used

**"Cannot upload to Play Store - app not found"**
- Create the app in Play Console first
- Complete the store listing and content rating

### General Issues

**"npm ci failed"**
- Check that `package-lock.json` is committed
- Ensure Node.js version matches your local environment

**"Capacitor sync failed"**
- Run `npx cap sync` locally to see detailed errors
- Check that the `out/` directory is being generated

### Viewing Logs

1. Go to **Actions** → Click on the failed workflow
2. Click on the failed job
3. Expand the failed step to see detailed logs
4. Look for error messages in red

### Local Testing

You can test Fastlane locally before pushing:

```bash
# iOS (requires Mac with Xcode)
cd ios/App
bundle install
bundle exec fastlane build

# Android
cd android
bundle install
bundle exec fastlane build_apk
```

---

## Cost Summary

| Service | Cost |
|---------|------|
| Apple Developer Program | $99/year |
| Google Play Developer | $25 one-time |
| GitHub Actions | Free (2,000 min/month) |
| **Total first year** | **~$124** |
| **Annual renewal** | **$99** |

---

## Security Notes

1. **Never commit secrets** to your repository
2. **Back up your Android keystore** - losing it means you can't update your app
3. **Keep your Match repository private** - it contains your iOS certificates
4. **Rotate API keys** if you suspect they've been compromised
5. **Use branch protection** to prevent unauthorized deployments

---

## Next Steps After Setup

1. **First iOS build**: Upload will create the app version in TestFlight
2. **First Android build**: Upload will create an internal testing track
3. **Testing**: Invite testers via TestFlight (iOS) and Internal Testing (Android)
4. **Production release**: Change lane to `release` when ready

For questions or issues, check the [Fastlane documentation](https://docs.fastlane.tools/) or open an issue in this repository.
