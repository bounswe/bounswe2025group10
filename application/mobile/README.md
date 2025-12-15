# Zero Waste Challenge - Mobile App

A React Native mobile application for the Zero Waste Challenge platform, built with Expo.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start with Docker](#quick-start-with-docker)
- [Local Development Setup](#local-development-setup)
- [Building the App](#building-the-app)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Environment Configuration](#environment-configuration)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### For Docker-based builds (Recommended for professors/reviewers)

- Docker Desktop (v20.10+)
- Docker Compose (v2.0+)

### For local development

- Node.js 18+
- npm 9+
- For Android: Android Studio with Android SDK
- For iOS: Xcode 14+ (macOS only)

---

## Quick Start with Docker

The easiest way to build and test the app without installing Android SDK or other dependencies.

### 1. Setup Environment

```bash
cd application/mobile

# Copy environment template
cp .env.example .env

# Edit .env to set your API URL (see .env.example for options)
```

### 2. Verify Build Environment

```bash
docker-compose run --rm verify
```

### 3. Run Tests

```bash
# Run all tests
docker-compose run --rm test

# Run tests with coverage
docker-compose run --rm test-coverage
```

### 4. Lint Code

```bash
docker-compose run --rm lint
```

### 5. Build Android APK

```bash
# Create output directory
mkdir -p build-output

# Build release APK (takes ~10-15 minutes on first run)
docker-compose run --rm build-android

# Or build debug APK (faster)
docker-compose run --rm build-android-debug

# The APK will be in: build-output/app-release.apk (or app-debug.apk)
```

### 6. Build Web Version (Quick Verification)

```bash
# Export web build (much faster, no Android SDK needed)
docker-compose run --rm build-web

# Output will be in: dist/
```

---

## Local Development Setup

### 1. Install Dependencies

```bash
cd application/mobile
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your preferred API URL
```

### 3. Start the Development Server

```bash
# Start Expo development server
npm start

# Or start with specific platform
npm run android  # Android
npm run ios      # iOS (macOS only)
npm run web      # Web browser
```

### 4. Running on Devices

**Android Emulator:**
1. Start Android Studio
2. Open AVD Manager and launch an emulator
3. Run `npm run android`

**Physical Device:**
1. Install Expo Go app on your device
2. Scan the QR code from Metro bundler
3. Make sure device is on the same network as your computer

---

## Building the App

### Development Build (with Docker)

```bash
# Debug APK for testing
docker-compose run --rm build-android-debug
```

### Production Build (with Docker)

```bash
# Release APK for distribution
docker-compose run --rm build-android
```

### Local Build (without Docker)

Requires Android SDK to be installed locally.

```bash
# Generate native Android project
npx expo prebuild --platform android

# Build APK
cd android
./gradlew assembleRelease

# APK location: android/app/build/outputs/apk/release/app-release.apk
```

### Using EAS Build (Cloud)

For cloud-based builds (requires Expo account):

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build for Android
eas build --platform android --profile preview
```

---

## Testing

### Run Tests

```bash
# With Docker
docker-compose run --rm test

# Locally
npm test
```

### Run Tests with Watch Mode

```bash
npm run test:watch
```

### Generate Coverage Report

```bash
# With Docker
docker-compose run --rm test-coverage

# Locally
npm run test:coverage
```

### Run Specific Tests

```bash
npm test -- --testPathPattern="HomeScreen"
```

---

## Project Structure

```
mobile/
├── src/
│   ├── components/     # Reusable UI components
│   ├── context/        # React Context providers (AuthContext)
│   ├── hooks/          # Custom React hooks
│   ├── navigation/     # React Navigation setup
│   ├── screens/        # Screen components
│   │   └── auth/       # Authentication screens
│   ├── services/       # API service layer
│   ├── utils/          # Utility functions
│   └── assets/         # Images and static files
├── __mocks__/          # Jest mocks
├── __tests__/          # Test files
├── Dockerfile          # Docker build configuration
├── docker-compose.yml  # Docker Compose services
├── app.json            # Expo configuration
├── babel.config.js     # Babel configuration
├── package.json        # Dependencies and scripts
└── .env.example        # Environment template
```

---

## Environment Configuration

Copy `.env.example` to `.env` and configure:

| Variable | Description | Default |
|----------|-------------|---------|
| `API_URL` | Backend API base URL | `http://localhost:8000` |

### API URL Options

| Environment | URL | Notes |
|-------------|-----|-------|
| Local Docker | `http://localhost:8000` | Backend running locally |
| Android Emulator | `http://10.0.2.2:8000` | Special IP for emulator |
| Physical Device | `http://YOUR_IP:8000` | Your computer's IP |
| Production | `http://209.38.114.201:8000` | Production server |

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start Expo development server |
| `npm run android` | Run on Android |
| `npm run ios` | Run on iOS |
| `npm run web` | Run in web browser |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |
| `npm run lint` | Lint the codebase |

---

## Docker Services

| Service | Description | Command |
|---------|-------------|---------|
| `dev` | Development server | `docker-compose up dev` |
| `test` | Run tests | `docker-compose run --rm test` |
| `test-coverage` | Tests with coverage | `docker-compose run --rm test-coverage` |
| `lint` | Lint code | `docker-compose run --rm lint` |
| `build-android` | Build release APK | `docker-compose run --rm build-android` |
| `build-android-debug` | Build debug APK | `docker-compose run --rm build-android-debug` |
| `build-web` | Build web version | `docker-compose run --rm build-web` |
| `verify` | Verify environment | `docker-compose run --rm verify` |

---

## Troubleshooting

### Docker Build Issues

**"Cannot connect to Docker daemon"**
- Make sure Docker Desktop is running

**Build fails with memory error**
- Increase Docker memory limit in Docker Desktop settings (8GB recommended)

**Slow builds**
- First build downloads Android SDK (~2GB), subsequent builds are faster
- Use `build-android-debug` for faster iteration

### Local Development Issues

**"Unable to resolve module"**
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npx expo start --clear
```

**Metro bundler errors**
```bash
npx expo start --clear
```

**Android build fails locally**
- Ensure ANDROID_HOME is set
- Run `sdkmanager --licenses` to accept all licenses

### API Connection Issues

**"Network request failed"**
- Check that backend is running
- Verify API_URL in .env matches your setup
- For Android emulator, use `http://10.0.2.2:8000`
- For physical device, use your computer's IP address

---

## Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
