# Zero Waste Challenge - Mobile App Build Guide

This document provides comprehensive instructions for building the Zero Waste Challenge mobile application using Docker, including development setup, production builds, network configuration, and APK generation.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Configuration](#environment-configuration)
- [Network Configuration](#network-configuration)
- [Development Build](#development-build)
- [Production Build (APK)](#production-build-apk)
- [Docker Commands Reference](#docker-commands-reference)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### For Local Development (without Docker)

- Node.js 18+ (LTS recommended)
- npm 9+
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### For Docker Builds

- Docker 20.10+
- Docker Compose 2.0+ (optional, for full stack)
- At least 8GB RAM allocated to Docker
- 20GB+ free disk space (Android SDK is large)

## Quick Start

### Option 1: Local Development (Recommended for Development)

```bash
cd application/mobile

# Install dependencies
npm install

# Configure network for your environment
./scripts/configure-network.sh production  # or android, ios, device

# Start the development server
npm start
```

### Option 2: Docker Development Build

```bash
cd application/mobile

# Build the development image
docker build --target development -t zerowaste-mobile-dev .

# Run development server
docker run -it -p 8081:8081 -p 19000:19000 -p 19001:19001 -p 19002:19002 zerowaste-mobile-dev
```

### Option 3: Build APK with Docker

```bash
cd application/mobile

# Build production APK (uses production API by default)
docker build --target apk-builder -t zerowaste-apk-builder .

# Extract the APK
docker create --name temp-apk zerowaste-apk-builder
docker cp temp-apk:/app/output/. ./build/
docker rm temp-apk

# APK is now in ./build/ directory
```

## Environment Configuration

### Setting Up Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` to set your API URL based on your environment:
   ```bash
   # For production
   API_URL=https://zerowaste.ink

   # For local development with Android emulator
   API_URL=http://10.0.2.2:8000
   ```

### Available Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `API_URL` | Backend API base URL | `https://zerowaste.ink` |

### Using the Configuration Script

The `configure-network.sh` script automatically sets up the correct API URL:

```bash
# For production builds
./scripts/configure-network.sh production

# For Android emulator (connects to host's localhost via 10.0.2.2)
./scripts/configure-network.sh android

# For iOS simulator
./scripts/configure-network.sh ios

# For physical device (auto-detects your machine's IP)
./scripts/configure-network.sh device

# For Docker Compose environment
./scripts/configure-network.sh docker

# For custom URL
./scripts/configure-network.sh custom http://192.168.1.100:8000
```

## Network Configuration

### Understanding Mobile Network Challenges

Mobile apps run on devices/emulators with their own network stack. `localhost` from the app's perspective refers to the device itself, not your development machine.

### Network Configuration by Environment

| Environment | API_URL | Notes |
|-------------|---------|-------|
| **Production** | `https://zerowaste.ink` | Always use for release builds |
| **Android Emulator** | `http://10.0.2.2:8000` | Android's alias for host localhost |
| **iOS Simulator** | `http://localhost:8000` | iOS shares host network |
| **Physical Device** | `http://<host-ip>:8000` | Device must be on same WiFi |
| **Docker Compose** | `http://backend:8000` | Uses Docker service name |

### Finding Your Machine's IP Address

```bash
# macOS
ipconfig getifaddr en0

# Linux
hostname -I | awk '{print $1}'

# Windows (PowerShell)
(Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*"}).IPAddress
```

### Docker Compose Network Configuration

When running the full stack with Docker Compose, the mobile app needs special handling since it runs on a physical device or emulator outside the Docker network:

```yaml
# docker-compose.yml example
version: '3.8'
services:
  backend:
    # ... backend config ...
    ports:
      - "8000:8000"  # Expose to host for mobile access

  # Note: Mobile app typically runs outside Docker
  # Configure it to connect to host's IP or use production URL
```

For physical device testing with Docker Compose:
1. Run the backend in Docker: `docker-compose up backend`
2. Configure mobile with your host IP: `./scripts/configure-network.sh device`
3. Ensure device is on the same WiFi network

## Development Build

### Local Development

```bash
cd application/mobile

# Install dependencies
npm install

# Start Expo development server
npm start

# Or start with specific platform
npm run android    # Android
npm run ios        # iOS (macOS only)
```

### Docker Development

Build and run the development container:

```bash
# Build development image
docker build --target development -t zerowaste-mobile-dev .

# Run with all necessary ports
docker run -it \
  -p 8081:8081 \
  -p 19000:19000 \
  -p 19001:19001 \
  -p 19002:19002 \
  -v $(pwd):/app \
  -v /app/node_modules \
  zerowaste-mobile-dev
```

Connect from Expo Go app using the displayed QR code or URL.

## Production Build (APK)

### Building APK with Docker

The Dockerfile provides a complete Android build environment:

```bash
cd application/mobile

# Build with production API (default)
docker build --target apk-builder -t zerowaste-apk-builder .

# Build with custom API URL
docker build --target apk-builder \
  --build-arg API_URL=https://your-api.com \
  -t zerowaste-apk-builder .

# Build debug APK
docker build --target apk-builder \
  --build-arg BUILD_TYPE=debug \
  -t zerowaste-apk-debug .
```

### Extracting the APK

```bash
# Create a temporary container
docker create --name temp-apk zerowaste-apk-builder

# Copy APK to local directory
mkdir -p build
docker cp temp-apk:/app/output/. ./build/

# Clean up
docker rm temp-apk

# APK location
ls -la ./build/*.apk
```

### Building Without Docker (EAS Build)

For cloud-based builds using Expo Application Services:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS (first time only)
eas build:configure

# Build APK for Android
eas build --platform android --profile preview

# Build release AAB for Play Store
eas build --platform android --profile production
```

### Local Build Without Docker

If you have Android Studio installed:

```bash
cd application/mobile

# Generate native Android project
npx expo prebuild --platform android

# Build debug APK
cd android
./gradlew assembleDebug

# APK location: android/app/build/outputs/apk/debug/app-debug.apk

# Build release APK (requires signing configuration)
./gradlew assembleRelease
```

## Docker Commands Reference

### Build Commands

```bash
# Development image
docker build --target development -t zerowaste-mobile-dev .

# APK builder image
docker build --target apk-builder -t zerowaste-apk-builder .

# Production image (contains only APK)
docker build --target production -t zerowaste-mobile-prod .

# Build with custom API URL
docker build --target apk-builder \
  --build-arg API_URL=http://your-api.com \
  -t zerowaste-apk-builder .
```

### Run Commands

```bash
# Development server
docker run -it -p 8081:8081 -p 19000-19002:19000-19002 zerowaste-mobile-dev

# Extract APK from production image
docker run --rm -v $(pwd)/build:/output zerowaste-mobile-prod cp /output/*.apk /output/
```

### Utility Commands

```bash
# View APK in production container
docker run --rm zerowaste-mobile-prod ls -la /output

# Shell into development container
docker run -it zerowaste-mobile-dev /bin/bash

# Check build logs
docker logs <container-id>
```

## Release Artifact (.apk)

### Creating a Release APK

For GitHub releases (tag: `customer-milestone-3`):

1. **Build the APK:**
   ```bash
   cd application/mobile

   # Using Docker
   docker build --target apk-builder \
     --build-arg API_URL=https://zerowaste.ink \
     --build-arg BUILD_TYPE=release \
     -t zerowaste-apk-release .

   # Extract APK
   docker create --name release-apk zerowaste-apk-release
   docker cp release-apk:/app/output/. ./release/
   docker rm release-apk
   ```

2. **Rename the APK:**
   ```bash
   mv ./release/*.apk ./release/ZeroWasteChallenge-v1.0.0.apk
   ```

3. **Attach to GitHub Release:**
   - Go to GitHub Releases
   - Create/edit release with tag `customer-milestone-3`
   - Upload `ZeroWasteChallenge-v1.0.0.apk` as release asset

### APK Signing (Production)

For production releases, configure signing in `eas.json`:

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk",
        "credentialsSource": "local"
      }
    }
  }
}
```

Or add signing config to `android/app/build.gradle` after prebuild.

## Troubleshooting

### Common Issues

#### "Connection refused" when connecting to backend

**Problem:** Mobile app can't reach the backend server.

**Solutions:**
1. Verify the API_URL is correct for your environment
2. For Android emulator, use `10.0.2.2` instead of `localhost`
3. For physical device, ensure same WiFi network and use host IP
4. Check if backend is running: `curl http://localhost:8000/health/`

#### Docker build fails with memory error

**Problem:** Android SDK installation or Gradle build runs out of memory.

**Solutions:**
1. Increase Docker memory limit to 8GB+
2. Add swap space to the build
3. Use `--no-daemon` flag for Gradle (already included in Dockerfile)

#### APK not found after build

**Problem:** Can't find the built APK.

**Solutions:**
```bash
# Check inside container
docker run --rm zerowaste-apk-builder find /app -name "*.apk"

# Typical locations:
# Debug: /app/android/app/build/outputs/apk/debug/app-debug.apk
# Release: /app/android/app/build/outputs/apk/release/app-release.apk
```

#### Metro bundler connection issues in Docker

**Problem:** Expo Go can't connect to Metro bundler in Docker.

**Solutions:**
1. Ensure all ports (8081, 19000-19002) are mapped
2. Use `--host 0.0.0.0` when starting Metro
3. Set `REACT_NATIVE_PACKAGER_HOSTNAME` environment variable

### Getting Help

- Check [Expo Documentation](https://docs.expo.dev/)
- Review [React Native Troubleshooting](https://reactnative.dev/docs/troubleshooting)
- Open an issue at [GitHub Issues](https://github.com/bounswe/bounswe2025group10/issues)
