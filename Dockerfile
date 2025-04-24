FROM node:18

# Install tools required for Android
RUN apt-get update && apt-get install -y openjdk-11-jdk

# Watchman (optional - file watcher)
RUN apt-get install -y wget gnupg && \
    wget https://dl.bintray.com/facebook/buck/wgetrc -O /etc/wgetrc && \
    echo "deb http://dl.bintray.com/facebook/deb trusty main" | tee /etc/apt/sources.list.d/facebook.list && \
    apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 7F6E5C82 && \
    apt-get update && apt-get install -y watchman

# Application directory
WORKDIR /app

# Copy all files
COPY . .

# Install dependencies
RUN npm install

# Start Metro Bundler
CMD ["npx", "react-native", "start"]
