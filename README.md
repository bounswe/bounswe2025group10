# Zero Waste Challenge – Codebase

Welcome to the codebase of the **Zero Waste Challenge**, a gamified platform designed to promote sustainable living through personalized goals, community challenges, and collaborative efforts.

## 🚀 Project Video Recordings

1) [User Web Application](https://www.youtube.com/watch?v=_MOUUgUt5oI)
2) [Mobile Application](https://www.youtube.com/watch?v=m-UfFU4DWHM)

## 🚀 Project Overview

This repository contains the implementation of the Zero Waste Challenge platform, encompassing backend services, frontend interfaces, and supporting tools.

## 🛠️ Technologies Used

For detailed information, please refer to [Software Requirement Specifications](https://github.com/bounswe/bounswe2025group10/wiki/Project-%235-:-ZERO-WASTE-CHALLENGE#software-requirements-specification) page

## 📁 File Structure

** TO BE COMPLETED**

## 📄 Documentation

For detailed information on project requirements, design diagrams, and meeting notes, please refer to our [Project Wiki](https://github.com/bounswe/bounswe2025group10/wiki).


## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or later)
- npm (v8 or later)
- Docker (optional, for running the application in a container)

### **Backend**
1. **Stop the containers:**
   In a terminal:
   ```bash
   docker-compose down
   ```

2. **Build the backend:**
   Inside the backend folder run this command:
   ```bash
   docker-compose up --build
   ```

3. **Backend deployed:**
   Now the backend is deployed at http://localhost:8000.

### Frontend
To start the development server, run:
```
npm run dev
```
This will start the application in development mode and open it in your default web browser.
The application will be available at `http://localhost:5173` by default.

### Building the Application
To build the application for production, run:
```
npm run build
```

This will create a `dist` directory with the production build of the application.

## Docker
To run the application in a Docker container, you can use the provided `Dockerfile`. This file is set up to build and run the application in a lightweight container.
### Building the Docker Image
To build the Docker image, run:
```
docker build -t zero-waste-frontend .
```
### Running the Docker Container
To run the Docker container, use the following command:
```
docker run -p 80:80 zero-waste-frontend
```
This will start the application in a container and map port 80 of the container to port 80 of your host machine.
You can then access the application in your web browser at `http://localhost`.

### Using local backend or domain
The default settings uses our prod backend on zerowaste.ink. If you would like to use the local backend you deployed switch line 13 in Dockerfile in the zero-waste folder into
```
RUN npm run build
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
