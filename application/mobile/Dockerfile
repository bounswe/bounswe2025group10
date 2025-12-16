# ==============================================================================
# Zero Waste Challenge - Mobile App Docker Build Environment
# ==============================================================================
# This Dockerfile provides a complete build environment for the React Native
# Expo application, supporting both development and production APK builds.
#
# Usage:
#   Development: docker build --target development -t zerowaste-mobile-dev .
#   Production:  docker build --target production -t zerowaste-mobile-prod .
#   APK Build:   docker build --target apk-builder -t zerowaste-apk-builder .
# ==============================================================================

# ------------------------------------------------------------------------------
# Base Stage: Node.js environment with common dependencies
# ------------------------------------------------------------------------------
FROM node:20-bullseye AS base

# Install system dependencies required for React Native and Android SDK
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    unzip \
    openjdk-17-jdk \
    && rm -rf /var/lib/apt/lists/*

# Set Android SDK environment variables
ENV ANDROID_HOME=/opt/android-sdk
ENV ANDROID_SDK_ROOT=/opt/android-sdk
ENV PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools/34.0.0

# Install Android SDK command-line tools
RUN mkdir -p $ANDROID_HOME/cmdline-tools && \
    cd $ANDROID_HOME/cmdline-tools && \
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O cmdline-tools.zip && \
    unzip -q cmdline-tools.zip && \
    rm cmdline-tools.zip && \
    mv cmdline-tools latest

# Detect JAVA_HOME dynamically and install Android SDK components
RUN export JAVA_HOME=$(dirname $(dirname $(readlink -f $(which java)))) && \
    echo "JAVA_HOME=$JAVA_HOME" && \
    yes | sdkmanager --licenses && \
    sdkmanager "platform-tools" \
    "platforms;android-34" \
    "build-tools;34.0.0" \
    "ndk;26.1.10909125"

# Set JAVA_HOME for subsequent commands
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-arm64

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# ------------------------------------------------------------------------------
# Development Stage: For local development with hot reloading
# ------------------------------------------------------------------------------
FROM base AS development

# Expose Metro bundler port
EXPOSE 8081

# Expose Expo DevTools port
EXPOSE 19000
EXPOSE 19001
EXPOSE 19002

# Default command for development
CMD ["npm", "start"]

# ------------------------------------------------------------------------------
# APK Builder Stage: For building production APK
# ------------------------------------------------------------------------------
FROM base AS apk-builder

# Set build-time arguments for environment configuration
ARG API_URL=https://zerowaste.ink
ARG BUILD_TYPE=release

# Create .env file with build-time configuration
RUN echo "API_URL=${API_URL}" > .env

# Generate native Android project using Expo prebuild
RUN npx expo prebuild --platform android --clean

# Build the APK
WORKDIR /app/android

# For release build
RUN if [ "$BUILD_TYPE" = "release" ]; then \
    ./gradlew assembleRelease --no-daemon; \
    else \
    ./gradlew assembleDebug --no-daemon; \
    fi

# Copy APK to output directory
RUN mkdir -p /app/output && \
    if [ "$BUILD_TYPE" = "release" ]; then \
    cp /app/android/app/build/outputs/apk/release/*.apk /app/output/; \
    else \
    cp /app/android/app/build/outputs/apk/debug/*.apk /app/output/; \
    fi

WORKDIR /app

# ------------------------------------------------------------------------------
# Production Stage: Minimal image with just the built APK
# ------------------------------------------------------------------------------
FROM alpine:latest AS production

WORKDIR /output

# Copy APK from builder stage
COPY --from=apk-builder /app/output/*.apk ./

# Default command shows the built APK
CMD ["ls", "-la", "/output"]
