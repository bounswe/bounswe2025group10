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


# 🚀 Quick Start

## Prerequisites
- Node.js (v18 or later)
- npm (v8 or later)
- Docker & Docker Compose

---

# 1. Web Application (Backend + Frontend)

## Environment Variables
- Copy and adapt the following to create your `.env` files:

### Backend `.env.example`
```
SECRET_KEY=your-django-secret-key
DEBUG=True
MYSQL_DATABASE=main_db
MYSQL_USER=admin
MYSQL_PASSWORD=123456789
MYSQL_ROOT_PASSWORD=123456789
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@smtp-brevo.com
EMAIL_HOST_PASSWORD=your-email-password
DEFAULT_FROM_EMAIL=no_reply@zerowaste.ink
```

### Frontend `.env.example`
```
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

---

## Development Setup

1. **Start all services:**
   ```bash
   docker compose up --build
   ```
   - Backend: http://localhost:8000
   - Frontend: http://localhost:3000

2. **Apply migrations (if not auto-run):**
   ```bash
   docker compose exec backend-web python manage.py migrate
   ```

3. **Seed the database with mock data and badges:**
   ```bash
   docker compose exec backend-web python manage.py create_mock_data
   docker compose exec backend-web python manage.py create_badges
   ```
   This will populate the system with demo users, posts, achievements, badges, and more.

4. **Default Test Users:**
   - Regular User:  
     - Username: `test_user`  
     - Password: `test123`  
     - Email: `test@gmail.com`
   - Admin User:  
     - Username: `admin`  
     - Password: `admin123`  
     - Email: `admin@example.com`

---

## Production Setup
- Adjust `.env` files for production secrets and domains.
- Build and run with:
  ```bash
  docker compose -f docker-compose.yml up --build -d
  ```
- For custom domains, update `ALLOWED_HOSTS` in backend settings and `VITE_API_URL` in frontend.

---

# 2. Mobile Application

## Environment Variables
- Copy `mobile/.env.example` to `mobile/.env` and set `API_URL` as needed.

## Running the Mobile App
1. **Start backend (see above).**
2. **Install dependencies:**
   ```bash
   cd mobile
   npm install
   npx expo install
   ```
3. **Start Metro bundler:**
   ```bash
   npx react-native start
   ```
4. **Run on emulator or device:**
   ```bash
   npm run android
   # or
   npm run ios
   ```

---

# 🧱 Project Structure in Docker
- `Dockerfile`: Defines the base image and build process for backend/frontend
- `docker-compose.yml`: Manages multi-container setup including services (web, db, redis)
- `volumes`: Sync local changes without restarting containers
- `ports`: Exposes the app on your local environment (see `docker-compose.yml` for specifics)

# 📦 Common Docker Commands
- View running containers:
   ```bash
   docker ps
   ```
- Enter container shell:
   ```bash
   docker exec -it <container_name> /bin/bash
   ```
- Stop all containers:
   ```bash
   docker compose down
   ```

---

# 📄 Further Documentation
- See the [Project Wiki](https://github.com/bounswe/bounswe2025group10/wiki) for requirements, diagrams, and more.

---

# ❓ Need Help?
- Open an issue or contact the maintainers via the project repository.
