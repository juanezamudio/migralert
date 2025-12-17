# Commands Cheatsheet

Quick reference for all Capacitor and Fastlane deployment commands.

---

## Development

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Build Next.js for production |
| `npm run start` | Start production server locally |
| `npm run lint` | Run ESLint |

---

## Capacitor - Sync & Open

| Command | Description |
|---------|-------------|
| `npm run cap:sync` | Sync web assets to native platforms |
| `npm run cap:build` | Build Next.js + sync to both platforms |
| `npm run cap:android` | Open project in Android Studio |
| `npm run cap:ios` | Open project in Xcode |

---

## Capacitor - Run on Device/Simulator

| Command | Description |
|---------|-------------|
| `npm run cap:run:android` | Build and run on Android emulator/device |
| `npm run cap:run:ios` | Build and run on iOS simulator |

**Tips:**
- For iOS simulator, Xcode must be installed
- For Android, an emulator must be running or device connected
- Use `adb devices` to check connected Android devices

---

## Local Deployment - iOS

| Command | Description |
|---------|-------------|
| `npm run deploy:ios:build` | Build .ipa file only (no upload) |
| `npm run deploy:ios:beta` | Build + upload to TestFlight |
| `npm run deploy:ios:release` | Build + upload to App Store |

**Requirements:**
- Mac with Xcode installed
- Apple Developer account configured
- Fastlane Match set up (see APP_STORE_DEPLOYMENT.md)

**Output location:** `ios/App/build/MigrAlert.ipa`

---

## Local Deployment - Android

| Command | Description |
|---------|-------------|
| `npm run deploy:android:build` | Build .aab file (Play Store format) |
| `npm run deploy:android:apk` | Build .apk file (for testing/sideloading) |
| `npm run deploy:android:beta` | Build + upload to Play Store Internal Testing |
| `npm run deploy:android:release` | Build + upload to Play Store Production |

**Requirements:**
- Java 17 installed
- Android SDK (or just run via GitHub Actions)
- Signing keystore configured

**Output locations:**
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`
- APK: `android/app/build/outputs/apk/release/app-release.apk`

---

## GitHub Actions - Cloud Deployment

**Automatic trigger:** Push a version tag
```bash
git tag v1.0.0
git push origin v1.0.0
```

**Manual trigger:**
1. Go to GitHub → Actions
2. Select workflow (Build & Deploy iOS or Android)
3. Click "Run workflow"
4. Choose lane: `beta` or `release`

---

## Utility Commands

| Command | Description |
|---------|-------------|
| `npm run generate:icons` | Regenerate app icons from SVG |

---

## Common Workflows

### "I want to test on my phone"

```bash
# Android (connect phone via USB, enable USB debugging)
npm run cap:run:android

# iOS (simulator only without paid Apple account)
npm run cap:run:ios
```

### "I want to share a test build with someone"

```bash
# Android - generates APK you can send directly
npm run deploy:android:apk
# Then share: android/app/build/outputs/apk/release/app-release.apk

# iOS - upload to TestFlight, invite testers there
npm run deploy:ios:beta
```

### "I'm ready to release to app stores"

```bash
# Option 1: Local deployment
npm run deploy:ios:release
npm run deploy:android:release

# Option 2: GitHub Actions (recommended)
git tag v1.0.0
git push origin v1.0.0
```

### "I made code changes and want to see them on device"

```bash
# Quick sync without full rebuild
npm run cap:sync

# Then run on device
npm run cap:run:android
# or
npm run cap:run:ios
```

### "I updated the app icon"

```bash
# Regenerate all icon sizes from SVG
npm run generate:icons

# Sync to native projects
npm run cap:sync
```

---

## Environment Variables

For local Fastlane deployment, set these in your shell or `.env` file:

### iOS
```bash
export APPLE_ID="your@email.com"
export APPLE_TEAM_ID="ABC123DEF4"
export ITC_TEAM_ID="ABC123DEF4"
export ASC_KEY_ID="ABC123XYZ"
export ASC_ISSUER_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
export ASC_KEY_CONTENT="base64-encoded-p8-key"
export MATCH_GIT_URL="https://github.com/you/certificates.git"
export MATCH_PASSWORD="your-match-password"
```

### Android
```bash
export KEYSTORE_PATH="/path/to/release.keystore"
export KEYSTORE_PASSWORD="your-keystore-password"
export KEY_ALIAS="migralert"
export KEY_PASSWORD="your-key-password"
export GOOGLE_PLAY_JSON_KEY='{"type":"service_account",...}'
```

---

## Troubleshooting

### "Command not found: bundle"
```bash
gem install bundler
```

### "Fastlane not found"
```bash
# Install Fastlane
gem install fastlane

# Or install via Bundler (recommended)
cd ios/App  # or android/
bundle install
```

### "pod: command not found"
```bash
gem install cocoapods
```

### "Java not found" (Android builds)
```bash
# macOS
brew install openjdk@17

# Add to PATH
export JAVA_HOME=/opt/homebrew/opt/openjdk@17
```

### "Build failed - no provisioning profile"
```bash
# Regenerate iOS certificates
cd ios/App
bundle exec fastlane match appstore --force
```

### "Keystore was tampered with"
- Double-check `KEYSTORE_PASSWORD` is correct
- Make sure you're using the right keystore file

---

## File Locations

| File | Purpose |
|------|---------|
| `capacitor.config.ts` | Capacitor configuration |
| `ios/App/fastlane/Fastfile` | iOS Fastlane lanes |
| `android/fastlane/Fastfile` | Android Fastlane lanes |
| `.github/workflows/build-ios.yml` | iOS GitHub Actions workflow |
| `.github/workflows/build-android.yml` | Android GitHub Actions workflow |
| `docs/APP_STORE_DEPLOYMENT.md` | Full deployment setup guide |
