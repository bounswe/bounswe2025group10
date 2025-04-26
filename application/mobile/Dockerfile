FROM node:18-slim

# 1) Java 17 + wget/unzip
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      openjdk-17-jdk-headless \
      wget \
      unzip \
 && rm -rf /var/lib/apt/lists/*

# 2) Android SDK CLI tools
ENV ANDROID_SDK_ROOT=/opt/android-sdk
ENV PATH=$PATH:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools

RUN mkdir -p $ANDROID_SDK_ROOT/cmdline-tools \
 && wget https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip -O /tmp/cmdline.zip \
 && unzip /tmp/cmdline.zip -d $ANDROID_SDK_ROOT/cmdline-tools \
 && mv $ANDROID_SDK_ROOT/cmdline-tools/cmdline-tools $ANDROID_SDK_ROOT/cmdline-tools/latest \
 && rm /tmp/cmdline.zip \
 && yes | sdkmanager --sdk_root=$ANDROID_SDK_ROOT --licenses \
 && sdkmanager --sdk_root=$ANDROID_SDK_ROOT \
      "platform-tools" \
      "platforms;android-31" \
      "build-tools;31.0.0"

# 3) Install JS deps via npm
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 4) Copy source & expose Metro port
COPY . .
EXPOSE 8081

# 5) Default: start Metro on all interfaces
CMD ["npx", "react-native", "start", "--host", "0.0.0.0"]
