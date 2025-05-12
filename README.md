# Zero Waste Challenge – Codebase

Welcome to the codebase of the **Zero Waste Challenge**, a gamified platform designed to promote sustainable living through personalized goals, community challenges, and collaborative efforts.

## 🚀 Project Overview

This repository contains the implementation of the Zero Waste Challenge platform, encompassing backend services, frontend interfaces, and supporting tools.

## 🛠️ Technologies Used

** TO BE COMPLETED**
For detailed information, please refer to [Software Requirement Specifications](https://github.com/bounswe/bounswe2025group10/wiki/Project-%235-:-ZERO-WASTE-CHALLENGE#software-requirements-specification) page

## 📁 File Structure

** TO BE COMPLETED**

## 📄 Documentation

For detailed information on project requirements, design diagrams, and meeting notes, please refer to our [Project Wiki](https://github.com/bounswe/bounswe2025group10/wiki).

## 🐳 Docker Usage

This project supports Docker for consistent development and deployment environments.

### 🚀 Quick Start

1. **Build and run the application:**
   ```bash
   docker-compose up --build
   ```

2. **Stop the containers:**
   ```bash
   docker-compose down
   ```

3. **Rebuild without cache (if needed):**
   ```bash
   docker-compose build --no-cache
   ```

### ⚡️  Running Mobile App 

1. **Build and run the the backend  server on docker:**
   ```bash
   docker-compose up --build
   ```

2. **On a seperate terminal, start React Native**
   ```bash
   npx react-native start
   ```

3. **On yet another seperate terminal, start your emulator**
   ```bash
   emulator <YOUR_EMULATOR_DEVICE_NAME>
   ```

4. **On any terminal, start the app**
   ```bash
   npm run android
   ```

### 🧱 Project Structure in Docker

- `Dockerfile`: Defines the base image and build process for backend/frontend
- `docker-compose.yml`: Manages multi-container setup including services (e.g. web, db)
- `volumes`: Sync local changes without restarting containers
- `ports`: Exposes the app on your local environment (check `docker-compose.yml` for specific ports)

### 📦 Common Commands

- View running containers:
   ```bash
   docker ps
   ```
- Enter container shell:
   ```bash
   docker exec -it <container_name> /bin/bash
   ```

Make sure Docker and Docker Compose are installed on your system. For installation, visit [https://docs.docker.com/get-docker/](https://docs.docker.com/get-docker/)
