# Zero Waste Challenge Mobile App - Docker Build
# This Dockerfile allows building the Android APK without requiring local Android SDK setup

# ==============================================================================
# Stage 1: Base Node.js environment
# ==============================================================================
FROM node:18-bullseye AS base

WORKDIR /app

# Install required system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    unzip \
    openjdk-17-jdk \
    && rm -rf /var/lib/apt/lists/*

# Create symlink for consistent JAVA_HOME path (works on both amd64 and arm64)
RUN ln -sf /usr/lib/jvm/java-17-openjdk-* /usr/lib/jvm/java-17-openjdk

# Set JAVA_HOME to the symlink
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk
ENV PATH=$JAVA_HOME/bin:$PATH

# ==============================================================================
# Stage 2: Android SDK Setup
# ==============================================================================
FROM base AS android-sdk

# Android SDK environment variables
ENV ANDROID_HOME=/opt/android-sdk
ENV ANDROID_SDK_ROOT=/opt/android-sdk
ENV PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools/34.0.0

# Download and install Android command line tools
RUN mkdir -p $ANDROID_HOME/cmdline-tools && \
    cd $ANDROID_HOME/cmdline-tools && \
    curl -o commandlinetools.zip https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip && \
    unzip commandlinetools.zip && \
    rm commandlinetools.zip && \
    mv cmdline-tools latest

# Accept Android SDK licenses
RUN yes | sdkmanager --licenses

# Install required Android SDK packages
RUN sdkmanager \
    "platform-tools" \
    "platforms;android-34" \
    "build-tools;34.0.0" \
    "ndk;26.1.10909125"

# ==============================================================================
# Stage 3: Dependencies installation
# ==============================================================================
FROM android-sdk AS dependencies

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# ==============================================================================
# Stage 4: Development environment (for testing and linting)
# ==============================================================================
FROM dependencies AS development

# Copy all source files
COPY . .

# Default command for development
CMD ["npm", "start"]

# ==============================================================================
# Stage 5: Testing stage
# ==============================================================================
FROM dependencies AS test

# Copy all source files
COPY . .

# Run tests
CMD ["npm", "test"]

# ==============================================================================
# Stage 6: Production APK build using EAS Build
# ==============================================================================
FROM dependencies AS build-apk

# Copy all source files
COPY . .

# Copy environment file if provided, otherwise use example
COPY .env* ./
RUN if [ ! -f .env ]; then cp .env.example .env 2>/dev/null || echo "API_URL=http://localhost:8000" > .env; fi

# Install EAS CLI globally
RUN npm install -g eas-cli

# Create eas.json if it doesn't exist
RUN if [ ! -f eas.json ]; then echo '{\
  "cli": { "version": ">= 5.0.0" },\
  "build": {\
    "development": {\
      "developmentClient": true,\
      "distribution": "internal"\
    },\
    "preview": {\
      "distribution": "internal",\
      "android": { "buildType": "apk" }\
    },\
    "production": {\
      "android": { "buildType": "apk" }\
    }\
  }\
}' > eas.json; fi

# Build APK (requires EAS account or use --local flag)
# The actual build command will be run via docker-compose or docker run
CMD ["npm", "run", "build:android:local"]

# ==============================================================================
# Stage 7: Web export (alternative for quick verification)
# ==============================================================================
FROM dependencies AS build-web

COPY . .

# Copy environment file
COPY .env* ./
RUN if [ ! -f .env ]; then cp .env.example .env 2>/dev/null || echo "API_URL=http://localhost:8000" > .env; fi

# Export for web
CMD ["npx", "expo", "export", "--platform", "web"]
